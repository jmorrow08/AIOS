import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cost calculators (simplified versions)
const costCalculators = {
  openai: {
    gpt4: (inputTokens: number, outputTokens: number) => ({
      cost: (inputTokens * 0.03 + outputTokens * 0.06) / 1000,
      tokens_used: inputTokens + outputTokens,
    }),
    gpt3_5_turbo: (inputTokens: number, outputTokens: number) => ({
      cost: (inputTokens * 0.0015 + outputTokens * 0.002) / 1000,
      tokens_used: inputTokens + outputTokens,
    }),
  },
  ollama: {
    llama3_8b: (inputTokens: number, outputTokens: number) => ({
      cost: 0, // Free for local
      tokens_used: inputTokens + outputTokens,
    }),
  },
};

interface LLMRequest {
  companyId: string;
  agentId?: string;
  agentName?: string;
  input: string;
  provider?: 'openai' | 'claude' | 'gemini' | 'ollama';
  model?: string;
  systemPrompt?: string;
}

// Check budget before API call
async function checkBudget(supabase: any, companyId: string, estimatedCost: number) {
  try {
    const { data, error } = await supabase.rpc('check_budget_before_usage', {
      p_agent_id: null,
      p_estimated_cost: estimatedCost,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Budget check error:', error);
    return { can_proceed: true, budget_limit: 100, current_spend: 0 }; // Fallback
  }
}

// Log API usage
async function logUsage(
  supabase: any,
  companyId: string,
  service: string,
  agentId: string | null,
  agentName: string | null,
  description: string,
  cost: number,
  tokensUsed: number,
  metadata: any = {},
) {
  try {
    await supabase.rpc('log_api_usage_and_update_budget', {
      p_service: service,
      p_agent_id: agentId,
      p_agent_name: agentName,
      p_description: description,
      p_cost: cost,
      p_tokens_used: tokensUsed,
      p_metadata: metadata,
    });
  } catch (error) {
    console.error('Usage logging error:', error);
  }
}

// Call OpenAI API
async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userInput: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
    },
  };
}

// Check Ollama health with timeout
async function checkOllama(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error(`Ollama health check failed for ${url}:`, error);
    return false;
  }
}

// Call Ollama API (local or remote)
async function callOllama(baseUrl: string, model: string, systemPrompt: string, userInput: string) {
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'llama3.1:8b',
      prompt: `${systemPrompt}\n\n${userInput}`,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.response || '',
    usage: {
      input_tokens: Math.ceil((systemPrompt.length + userInput.length) / 4),
      output_tokens: Math.ceil(data.response?.length / 4) || 0,
    },
  };
}

// Get API key from provider_keys table
async function getApiKey(supabase: any, companyId: string, provider: string) {
  const { data, error } = await supabase
    .from('provider_keys')
    .select('key_data')
    .eq('company_id', companyId)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }

  // Parse the key_data JSON
  try {
    const keyData = typeof data.key_data === 'string' ? JSON.parse(data.key_data) : data.key_data;
    return keyData.apiKey || keyData.key || null;
  } catch (e) {
    console.error('Error parsing API key data:', e);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const requestBody: LLMRequest = await req.json();
    const {
      companyId,
      agentId,
      agentName,
      input,
      provider = 'ollama',
      model,
      systemPrompt,
    } = requestBody;

    if (!companyId || !input) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: companyId and input' }),
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

    // Determine which provider to use
    let actualProvider = provider;
    let apiKey = null;
    let useLocalOllama = false;

    // Check if we're in dev mode (prefer local Ollama)
    const budgetMode = Deno.env.get('BUDGET_MODE') || 'dev';
    if (budgetMode === 'dev' && provider === 'ollama') {
      useLocalOllama = true;
    }

    // For SaaS providers, get API key from database
    if (!useLocalOllama) {
      apiKey = await getApiKey(supabase, companyId, provider);

      // Fallback to environment variables if not in database
      if (!apiKey) {
        switch (provider) {
          case 'openai':
            apiKey = Deno.env.get('OPENAI_API_KEY');
            break;
          case 'claude':
            apiKey = Deno.env.get('ANTHROPIC_API_KEY');
            break;
          case 'gemini':
            apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
            break;
        }
      }

      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error: `No API key found for provider ${provider}. Add key to provider_keys table or environment variables.`,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        );
      }
    }

    // Estimate cost for budget check
    const estimatedInputTokens = Math.ceil((systemPrompt?.length || 0 + input.length) / 4);
    const estimatedOutputTokens = useLocalOllama ? 1000 : 2000;
    const costCalc = useLocalOllama
      ? costCalculators.ollama.llama3_8b(estimatedInputTokens, estimatedOutputTokens)
      : provider === 'openai'
      ? costCalculators.openai.gpt4(estimatedInputTokens, estimatedOutputTokens)
      : { cost: 0.01, tokens_used: estimatedInputTokens + estimatedOutputTokens }; // Default estimate

    // Check budget
    const budgetCheck = await checkBudget(supabase, companyId, costCalc.cost);
    if (!budgetCheck.can_proceed) {
      return new Response(
        JSON.stringify({
          error: `Budget exceeded. Current spend: $${budgetCheck.current_spend?.toFixed(
            2,
          )}, Limit: $${budgetCheck.budget_limit?.toFixed(2)}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      );
    }

    // Make the API call
    let result;
    try {
      if (useLocalOllama || provider === 'ollama') {
        // For Ollama, try remote first (OLLAMA_BASE_URL), then fallback to local
        let baseUrl = Deno.env.get('OLLAMA_BASE_URL');
        let finalUrl = null;

        if (baseUrl) {
          // Try remote URL first
          const remoteHealthy = await checkOllama(baseUrl);
          if (remoteHealthy) {
            finalUrl = baseUrl;
          } else {
            console.log(`Remote Ollama (${baseUrl}) not available, trying local fallback`);
          }
        }

        if (!finalUrl) {
          // Try local fallback
          const localUrl = 'http://127.0.0.1:11434';
          const localHealthy = await checkOllama(localUrl);
          if (localHealthy) {
            finalUrl = localUrl;
          }
        }

        if (!finalUrl) {
          // If both remote and local fail, return gpu_offline error
          return new Response(
            JSON.stringify({
              error: 'OLLAMA_UNAVAILABLE',
              status: 'gpu_offline',
              message:
                'Ollama service is not available. Please start your GPU pod or ensure Ollama is running locally.',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            },
          );
        }

        result = await callOllama(
          finalUrl,
          model || 'llama3.1:8b',
          systemPrompt || 'You are a helpful AI assistant.',
          input,
        );
      } else if (provider === 'openai') {
        result = await callOpenAI(
          apiKey,
          model || 'gpt-4',
          systemPrompt || 'You are a helpful AI assistant.',
          input,
        );
      } else {
        // For other providers, you'd implement similar functions
        throw new Error(`Provider ${provider} not implemented yet`);
      }
    } catch (apiError) {
      console.error('API call error:', apiError);
      return new Response(JSON.stringify({ error: `API call failed: ${apiError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Calculate actual cost
    const actualCost = useLocalOllama ? 0 : costCalc.cost; // Ollama is free
    const totalTokens = result.usage.input_tokens + result.usage.output_tokens;

    // Log usage
    await logUsage(
      supabase,
      companyId,
      useLocalOllama ? 'Ollama' : provider.toUpperCase(),
      agentId || null,
      agentName || null,
      `AI generation: ${model || 'default model'}`,
      actualCost,
      totalTokens,
      {
        provider: useLocalOllama ? 'ollama' : provider,
        model: model || 'default',
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
      },
    );

    // Log to agent_runs table if this is an agent interaction
    if (agentId) {
      try {
        await supabase.from('agent_runs').insert({
          agent_id: agentId,
          company_id: companyId,
          input: input,
          output: result.content,
          tokens_used: totalTokens,
          cost: actualCost,
          metadata: {
            provider: useLocalOllama ? 'ollama' : provider,
            model: model || 'default',
          },
        });
      } catch (logError) {
        console.error('Error logging to agent_runs:', logError);
        // Don't fail the request for logging errors
      }
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        content: result.content,
        usage: {
          tokens_used: totalTokens,
          cost: actualCost,
          provider: useLocalOllama ? 'ollama' : provider,
        },
        budget_status: {
          current_spend: budgetCheck.current_spend,
          budget_limit: budgetCheck.budget_limit,
          percentage_used: budgetCheck.percentage_used,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  }
});
