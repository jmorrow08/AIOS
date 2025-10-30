import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface for the request body
interface RunPodControlRequest {
  action: 'start' | 'stop' | 'status';
  podId?: string;
}

// Interface for RunPod API responses
interface RunPodPod {
  id: string;
  name: string;
  runtime: {
    uptimeInSeconds: number;
    ports: Array<{
      privatePort: number;
      publicPort: number;
      type: string;
    }>;
  };
  desiredStatus: string;
  lastStatusChange: string;
}

// Helper function for RunPod API calls
async function runPodApiCall(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any,
) {
  const apiKey = Deno.env.get('RUNPOD_API_KEY');
  if (!apiKey) {
    throw new Error('RUNPOD_API_KEY environment variable is not set');
  }

  const url = `https://api.runpod.io/v2/${endpoint}`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RunPod API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Get pod status
async function getPodStatus(podId: string) {
  try {
    const data = await runPodApiCall(`pod/${podId}`);
    return {
      id: data.id,
      name: data.name,
      status: data.desiredStatus,
      uptime: data.runtime?.uptimeInSeconds || 0,
      ports: data.runtime?.ports || [],
      lastStatusChange: data.lastStatusChange,
    };
  } catch (error) {
    console.error('Error getting pod status:', error);
    throw error;
  }
}

// Start a pod
async function startPod(podId: string) {
  try {
    const data = await runPodApiCall(`pod/${podId}/start`, 'POST');
    return {
      id: data.id,
      status: 'STARTING',
      message: 'Pod start initiated',
    };
  } catch (error) {
    console.error('Error starting pod:', error);
    throw error;
  }
}

// Stop a pod
async function stopPod(podId: string) {
  try {
    const data = await runPodApiCall(`pod/${podId}/stop`, 'POST');
    return {
      id: data.id,
      status: 'STOPPING',
      message: 'Pod stop initiated',
    };
  } catch (error) {
    console.error('Error stopping pod:', error);
    throw error;
  }
}

// Persist desired state in settings table
async function updateDesiredState(
  supabase: any,
  podId: string,
  desiredState: 'running' | 'stopped',
) {
  try {
    const { error } = await supabase.from('settings').upsert({
      key: 'runpod_desired_state',
      value: JSON.stringify({ podId, desiredState, updatedAt: new Date().toISOString() }),
      category: 'runpod',
      description: 'Desired RunPod pod state for persistence',
    });

    if (error) {
      console.error('Error updating desired state:', error);
    }
  } catch (error) {
    console.error('Error persisting desired state:', error);
  }
}

// Get persisted desired state
async function getDesiredState(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'runpod_desired_state')
      .single();

    if (error || !data) {
      return null;
    }

    return JSON.parse(data.value);
  } catch (error) {
    console.error('Error getting desired state:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      // Handle control actions
      const requestBody: RunPodControlRequest = await req.json();
      const { action, podId } = requestBody;

      if (!action || !['start', 'stop', 'status'].includes(action)) {
        return new Response(
          JSON.stringify({
            error: 'Invalid action. Must be one of: start, stop, status',
            code: 'INVALID_ACTION',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        );
      }

      if (!podId && action !== 'status') {
        return new Response(
          JSON.stringify({
            error: 'podId is required for start/stop actions',
            code: 'MISSING_POD_ID',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        );
      }

      try {
        let result;

        switch (action) {
          case 'start':
            result = await startPod(podId!);
            await updateDesiredState(supabase, podId!, 'running');
            break;
          case 'stop':
            result = await stopPod(podId!);
            await updateDesiredState(supabase, podId!, 'stopped');
            break;
          case 'status':
            // If no podId provided, try to get from persisted state
            if (!podId) {
              const desiredState = await getDesiredState(supabase);
              if (desiredState?.podId) {
                podId = desiredState.podId;
              } else {
                return new Response(
                  JSON.stringify({
                    error: 'No podId provided and none found in persisted state',
                    code: 'NO_POD_ID',
                  }),
                  {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                  },
                );
              }
            }
            result = await getPodStatus(podId!);
            break;
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: result,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        );
      } catch (apiError) {
        console.error('RunPod API error:', apiError);
        return new Response(
          JSON.stringify({
            error: `RunPod API error: ${apiError.message}`,
            code: 'RUNPOD_API_ERROR',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        );
      }
    } else if (req.method === 'GET') {
      // Handle status check
      try {
        const desiredState = await getDesiredState(supabase);

        if (!desiredState?.podId) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                status: 'unknown',
                message: 'No pod configured',
                desiredState: null,
              },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            },
          );
        }

        const status = await getPodStatus(desiredState.podId);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              ...status,
              desiredState: desiredState.desiredState,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        );
      } catch (apiError) {
        console.error('Status check error:', apiError);
        return new Response(
          JSON.stringify({
            error: `Status check failed: ${apiError.message}`,
            code: 'STATUS_CHECK_ERROR',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  }
});
