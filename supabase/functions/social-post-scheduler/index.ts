import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledPost {
  id: string;
  company_id: string;
  platform: string;
  content: string;
  media_asset_id?: string;
  scheduled_at: string;
  status: string;
  external_ids?: Record<string, any>;
  error?: string;
}

console.log('social-post-scheduler function loaded');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get n8n webhook settings
    const { data: n8nUrlSetting, error: urlError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'n8n_base_url')
      .single();

    const { data: n8nSecretSetting, error: secretError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'n8n_webhook_secret')
      .single();

    if (urlError || secretError || !n8nUrlSetting?.value || !n8nSecretSetting?.value) {
      console.error('n8n webhook settings not configured');
      return new Response(
        JSON.stringify({
          error: 'n8n webhook not configured',
          details: 'Missing n8n_base_url or n8n_webhook_secret settings',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const n8nWebhookUrl = `${n8nUrlSetting.value.replace(/\/$/, '')}/webhook/social-post-scheduler`;
    const n8nSecret = n8nSecretSetting.value;

    console.log('Starting scheduled post check...');

    // Find all pending scheduled posts that are due
    const now = new Date().toISOString();
    const { data: duePosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching due posts:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch scheduled posts',
          details: fetchError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (!duePosts || duePosts.length === 0) {
      console.log('No due posts found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No posts due for scheduling',
          processed: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log(`Found ${duePosts.length} posts due for scheduling`);

    const results = [];
    const postsToSend = [];

    // Process each due post
    for (const post of duePosts as ScheduledPost[]) {
      try {
        // Update status to 'queued' immediately
        const { error: updateError } = await supabase
          .from('scheduled_posts')
          .update({
            status: 'queued',
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        if (updateError) {
          console.error(`Error updating post ${post.id} status:`, updateError);
          results.push({
            postId: post.id,
            success: false,
            error: `Failed to update status: ${updateError.message}`,
          });
          continue;
        }

        // Prepare post data for n8n
        postsToSend.push({
          id: post.id,
          companyId: post.company_id,
          platform: post.platform,
          content: post.content,
          mediaAssetId: post.media_asset_id,
          scheduledAt: post.scheduled_at,
          externalIds: post.external_ids || {},
        });

        results.push({
          postId: post.id,
          success: true,
          status: 'queued',
        });
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        results.push({
          postId: post.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Send batch to n8n webhook
    if (postsToSend.length > 0) {
      try {
        console.log(`Sending ${postsToSend.length} posts to n8n webhook`);

        const webhookPayload = {
          event: 'posts_ready_for_scheduling',
          data: {
            posts: postsToSend,
            batchId: `batch_${Date.now()}`,
            totalCount: postsToSend.length,
          },
          timestamp: new Date().toISOString(),
          source: 'social-post-scheduler',
        };

        const webhookResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${n8nSecret}`,
            'User-Agent': 'AI-OS-Social-Post-Scheduler/1.0',
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error('n8n webhook error:', webhookResponse.status, errorText);

          // Mark posts as failed if webhook fails
          for (const post of postsToSend) {
            await supabase
              .from('scheduled_posts')
              .update({
                status: 'failed',
                error: `Webhook failed: ${webhookResponse.status} ${errorText}`,
                updated_at: new Date().toISOString(),
              })
              .eq('id', post.id);
          }

          return new Response(
            JSON.stringify({
              error: 'Failed to send posts to n8n',
              details: `Webhook returned ${webhookResponse.status}: ${errorText}`,
              processed: results.length,
              sent: 0,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          );
        }

        const webhookResult = await webhookResponse.json();
        console.log('n8n webhook response:', webhookResult);
      } catch (webhookError) {
        console.error('Error sending to n8n webhook:', webhookError);

        // Mark posts as failed
        for (const post of postsToSend) {
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'failed',
              error: `Webhook error: ${
                webhookError instanceof Error ? webhookError.message : 'Unknown error'
              }`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', post.id);
        }

        return new Response(
          JSON.stringify({
            error: 'Failed to send posts to n8n',
            details: webhookError instanceof Error ? webhookError.message : 'Unknown error',
            processed: results.length,
            sent: 0,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(`Scheduler completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} scheduled posts`,
        results: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          sent_to_n8n: postsToSend.length,
        },
        details: results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in social-post-scheduler:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});


