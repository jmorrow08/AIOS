import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  workflowId?: string;
  workflowName?: string;
}

interface ScheduledPostResult {
  postId: string;
  platform: string;
  status: 'posted' | 'failed';
  externalPostId?: string;
  error?: string;
}

interface ContentPerformanceData {
  postId: string;
  platform: string;
  metrics: Record<string, any>;
  capturedAt: string;
}

console.log('n8n-webhook-proxy function loaded');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate the shared secret
    const authHeader = req.headers.get('authorization');
    const expectedSecret = Deno.env.get('N8N_WEBHOOK_SECRET');

    if (!expectedSecret) {
      console.error('N8N_WEBHOOK_SECRET environment variable not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const providedSecret = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (providedSecret !== expectedSecret) {
      console.error('Invalid webhook secret provided');
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid secret' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the webhook payload
    const payload: WebhookPayload = await req.json();
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different event types
    switch (payload.event) {
      case 'social_post_completed':
        return await handleSocialPostCompleted(supabase, payload.data);

      case 'content_performance_updated':
        return await handleContentPerformanceUpdate(supabase, payload.data);

      case 'automation_status_update':
        return await handleAutomationStatusUpdate(supabase, payload.data);

      default:
        console.log(`Unhandled event type: ${payload.event}`);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Event ${payload.event} received but not processed`,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
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

/**
 * Handle social post completion events from n8n
 */
async function handleSocialPostCompleted(
  supabase: any,
  data: { results: ScheduledPostResult[] },
): Promise<Response> {
  console.log('Processing social post completion:', data);

  if (!data.results || !Array.isArray(data.results)) {
    return new Response(JSON.stringify({ error: 'Invalid payload: missing results array' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const updates = [];

  for (const result of data.results) {
    try {
      // Update the scheduled_posts table
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          status: result.status,
          external_ids: result.externalPostId ? { [result.platform]: result.externalPostId } : {},
          error: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq('id', result.postId);

      if (updateError) {
        console.error(`Error updating post ${result.postId}:`, updateError);
        updates.push({
          postId: result.postId,
          success: false,
          error: updateError.message,
        });
      } else {
        console.log(`Successfully updated post ${result.postId}`);
        updates.push({
          postId: result.postId,
          success: true,
        });
      }
    } catch (error) {
      console.error(`Error processing post ${result.postId}:`, error);
      updates.push({
        postId: result.postId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Processed ${updates.length} social post updates`,
      results: updates,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}

/**
 * Handle content performance updates from n8n
 */
async function handleContentPerformanceUpdate(
  supabase: any,
  data: { performance: ContentPerformanceData[] },
): Promise<Response> {
  console.log('Processing content performance update:', data);

  if (!data.performance || !Array.isArray(data.performance)) {
    return new Response(JSON.stringify({ error: 'Invalid payload: missing performance array' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const inserts = [];

  for (const perfData of data.performance) {
    try {
      // Insert into content_performance table
      const { error: insertError } = await supabase.from('content_performance').insert({
        post_id: perfData.postId,
        platform: perfData.platform,
        metrics: perfData.metrics,
        captured_at: perfData.capturedAt || new Date().toISOString(),
      });

      if (insertError) {
        console.error(`Error inserting performance data for post ${perfData.postId}:`, insertError);
        inserts.push({
          postId: perfData.postId,
          success: false,
          error: insertError.message,
        });
      } else {
        console.log(`Successfully inserted performance data for post ${perfData.postId}`);
        inserts.push({
          postId: perfData.postId,
          success: true,
        });
      }
    } catch (error) {
      console.error(`Error processing performance data for post ${perfData.postId}:`, error);
      inserts.push({
        postId: perfData.postId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Processed ${inserts.length} content performance updates`,
      results: inserts,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}

/**
 * Handle general automation status updates
 */
async function handleAutomationStatusUpdate(
  supabase: any,
  data: { automationId: string; status: string; details?: any },
): Promise<Response> {
  console.log('Processing automation status update:', data);

  // Log to activity log for monitoring
  try {
    const { error: logError } = await supabase.from('activity_log').insert({
      user_id: null, // System action
      action: 'automation_status_update',
      details: {
        automation_id: data.automationId,
        status: data.status,
        details: data.details,
        source: 'n8n_webhook',
      },
      created_at: new Date().toISOString(),
    });

    if (logError) {
      console.error('Error logging automation status:', logError);
    }
  } catch (error) {
    console.error('Error logging automation status:', error);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Automation status update logged: ${data.automationId} - ${data.status}`,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}
