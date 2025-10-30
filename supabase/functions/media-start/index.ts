import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cost estimates for media generation
const mediaCostEstimates = {
  image: {
    comfyui: 0, // Free when local
    runway: 0.02, // Estimated cost per image
    openai: 0.04, // DALL-E 3
  },
  video: {
    comfyui: 0, // Free when local
    runway: 0.15, // Estimated cost per video
    heygen: 0.3, // Estimated cost per video
  },
  audio: {
    elevenlabs: 0.3, // Estimated cost per minute
    openai: 0.015, // TTS cost
  },
};

interface MediaRequest {
  companyId: string;
  jobType: 'image' | 'video' | 'audio';
  params: {
    prompt?: string;
    duration?: number;
    voice?: string;
    style?: string;
    [key: string]: any;
  };
  provider?: 'comfyui' | 'runway' | 'heygen' | 'elevenlabs' | 'openai';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const requestBody: MediaRequest = await req.json();
    const { companyId, jobType, params, provider = 'comfyui' } = requestBody;

    if (!companyId || !jobType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: companyId and jobType' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Estimate cost
    const estimatedCost = mediaCostEstimates[jobType]?.[provider] || 0.1;

    // Check budget
    const { data: budgetData, error: budgetError } = await supabase.rpc(
      'check_budget_before_usage',
      {
        p_agent_id: null,
        p_estimated_cost: estimatedCost,
      },
    );

    if (budgetError) {
      console.error('Budget check error:', budgetError);
    } else if (budgetData && !budgetData.can_proceed) {
      return new Response(
        JSON.stringify({
          error: `Budget exceeded. Current spend: $${budgetData.current_spend?.toFixed(
            2,
          )}, Limit: $${budgetData.budget_limit?.toFixed(2)}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      );
    }

    // Create job record in media_projects table
    const { data: job, error: jobError } = await supabase
      .from('media_projects')
      .insert({
        company_id: companyId,
        job_type: jobType,
        status: 'queued',
        params: params,
        provider: provider,
        estimated_cost: estimatedCost,
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating media job:', jobError);
      return new Response(JSON.stringify({ error: 'Failed to create media job' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // For ComfyUI (local), try to start the job immediately
    if (provider === 'comfyui') {
      try {
        const comfyUrl = Deno.env.get('COMFY_WORKER_URL') || 'http://localhost:8188';

        // Basic ComfyUI workflow for image generation
        const workflow = {
          '1': {
            inputs: {
              ckpt_name: 'sdxl_base_1.0.safetensors',
            },
            class_type: 'CheckpointLoaderSimple',
            _meta: { title: 'Load Checkpoint' },
          },
          '2': {
            inputs: {
              text: params.prompt || 'a beautiful landscape',
              clip: ['1', 1],
            },
            class_type: 'CLIPTextEncode',
            _meta: { title: 'Positive Prompt' },
          },
          '3': {
            inputs: {
              text: 'blurry, ugly, deformed',
              clip: ['1', 1],
            },
            class_type: 'CLIPTextEncode',
            _meta: { title: 'Negative Prompt' },
          },
          '4': {
            inputs: {
              seed: Math.floor(Math.random() * 1000000),
              steps: 20,
              cfg: 7,
              sampler_name: 'euler',
              scheduler: 'normal',
              denoise: 1,
              model: ['1', 0],
              positive: ['2', 0],
              negative: ['3', 0],
              latent_image: ['5', 0],
            },
            class_type: 'KSampler',
            _meta: { title: 'KSampler' },
          },
          '5': {
            inputs: {
              width: 1024,
              height: 1024,
              batch_size: 1,
            },
            class_type: 'EmptyLatentImage',
            _meta: { title: 'Empty Latent Image' },
          },
          '6': {
            inputs: {
              samples: ['4', 0],
              vae: ['1', 2],
            },
            class_type: 'VAEDecode',
            _meta: { title: 'VAE Decode' },
          },
          '7': {
            inputs: {
              filename_prefix: `media_${job.id}`,
              images: ['6', 0],
            },
            class_type: 'SaveImage',
            _meta: { title: 'Save Image' },
          },
        };

        // Queue the workflow
        const queueResponse = await fetch(`${comfyUrl}/prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: workflow }),
        });

        if (queueResponse.ok) {
          const queueData = await queueResponse.json();

          // Update job with prompt_id
          await supabase
            .from('media_projects')
            .update({
              status: 'processing',
              external_job_id: queueData.prompt_id,
              started_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          // Log usage (ComfyUI is free for local)
          await supabase.rpc('log_api_usage_and_update_budget', {
            p_service: 'ComfyUI',
            p_agent_id: null,
            p_agent_name: null,
            p_description: `Media generation: ${jobType}`,
            p_cost: 0,
            p_tokens_used: 0,
            p_metadata: {
              job_id: job.id,
              job_type: jobType,
              provider: 'comfyui',
              prompt_id: queueData.prompt_id,
            },
          });
        } else {
          console.warn('ComfyUI not available, job will remain queued');
        }
      } catch (comfyError) {
        console.warn('ComfyUI connection failed:', comfyError);
        // Job remains queued for manual processing or SaaS fallback
      }
    } else {
      // For SaaS providers, job stays queued until processed by worker
      console.log(`Job ${job.id} queued for ${provider} processing`);
    }

    // Return job information
    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        status: job.status,
        provider: provider,
        estimated_cost: estimatedCost,
        message:
          provider === 'comfyui'
            ? 'Job queued for ComfyUI processing (check if ComfyUI is running)'
            : `Job queued for ${provider} processing`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  } catch (error) {
    console.error('Media start error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  }
});
