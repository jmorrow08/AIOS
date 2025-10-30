import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Static model registry (embedded in function for performance)
const AI_MODELS = [
  // ========== OPENAI MODELS ==========
  {
    id: 'gpt-4o',
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    capabilities: {
      strengths: [
        'chat',
        'creative',
        'analysis',
        'reasoning',
        'multimodal',
        'vision',
        'coding_assistant',
        'agent_workflows',
      ],
      capable: ['translation', 'summarization', 'question_answering', 'research', 'real_time'],
      weaknesses: ['long_context'],
      features: ['Function calling', 'Vision', 'JSON mode', 'Streaming', 'Multilingual'],
      limitations: ['No direct code execution', 'Knowledge cutoff: October 2023'],
    },
    pricing: {
      input: 2.5,
      output: 10.0,
    },
    metadata: {
      contextWindow: 128000,
      latency: 'balanced',
      knowledgeCutoff: '2023-10',
      functionCalling: true,
      vision: true,
      streaming: true,
      size: 'large',
    },
    available: true,
    releaseDate: '2024-05',
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    model: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    capabilities: {
      strengths: ['fast', 'chat', 'question_answering', 'summarization', 'real_time'],
      capable: ['code', 'analysis', 'creative'],
      weaknesses: ['complex_reasoning', 'long_context', 'multimodal'],
      features: ['Function calling', 'JSON mode', 'Streaming', 'Multilingual'],
      limitations: ['No vision', 'Smaller context window', 'Less capable than GPT-4o'],
    },
    pricing: {
      input: 0.15,
      output: 0.6,
    },
    metadata: {
      contextWindow: 128000,
      latency: 'fast',
      knowledgeCutoff: '2023-10',
      functionCalling: true,
      vision: false,
      streaming: true,
      size: 'medium',
    },
    available: true,
    releaseDate: '2024-07',
  },
  {
    id: 'gpt-4-turbo',
    provider: 'openai',
    model: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    capabilities: {
      strengths: ['analysis', 'reasoning', 'creative', 'code', 'long_context', 'research'],
      capable: ['chat', 'translation', 'summarization'],
      weaknesses: ['real_time', 'vision'],
      features: ['Function calling', 'JSON mode', 'Streaming', 'Large context'],
      limitations: ['Slower than GPT-4o', 'No vision', 'Higher cost'],
    },
    pricing: {
      input: 10.0,
      output: 30.0,
    },
    metadata: {
      contextWindow: 128000,
      latency: 'balanced',
      knowledgeCutoff: '2023-12',
      functionCalling: true,
      vision: false,
      streaming: true,
      size: 'large',
    },
    available: true,
    releaseDate: '2023-11',
  },
  {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    capabilities: {
      strengths: ['fast', 'chat', 'question_answering', 'summarization'],
      capable: ['code', 'creative', 'translation'],
      weaknesses: ['complex_reasoning', 'analysis', 'long_context', 'research'],
      features: ['Function calling', 'JSON mode', 'Streaming'],
      limitations: ['Smaller context', 'Less capable than GPT-4 models', 'Outdated knowledge'],
    },
    pricing: {
      input: 0.5,
      output: 1.5,
    },
    metadata: {
      contextWindow: 16385,
      latency: 'fast',
      knowledgeCutoff: '2021-09',
      functionCalling: true,
      vision: false,
      streaming: true,
      size: 'medium',
    },
    available: true,
    releaseDate: '2022-03',
  },

  // ========== ANTHROPIC CLAUDE MODELS ==========
  {
    id: 'claude-3-5-sonnet',
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    capabilities: {
      strengths: [
        'reasoning',
        'analysis',
        'creative',
        'code',
        'research',
        'agent_workflows',
        'long_context',
      ],
      capable: ['chat', 'translation', 'summarization', 'question_answering'],
      weaknesses: ['real_time', 'vision'],
      features: [
        'Excellent reasoning',
        'Large context',
        'Tool use',
        'Multilingual',
        'Code generation',
      ],
      limitations: ['No vision (yet)', 'Higher latency than smaller models'],
    },
    pricing: {
      input: 3.0,
      output: 15.0,
    },
    metadata: {
      contextWindow: 200000,
      latency: 'balanced',
      knowledgeCutoff: '2024-04',
      functionCalling: true,
      vision: false,
      streaming: true,
      size: 'xlarge',
    },
    available: true,
    releaseDate: '2024-06',
    notes: 'Most intelligent model available, excels at complex reasoning tasks',
  },
  {
    id: 'claude-3-opus',
    provider: 'claude',
    model: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    capabilities: {
      strengths: ['creative', 'analysis', 'reasoning', 'research', 'long_context'],
      capable: ['chat', 'code', 'translation'],
      weaknesses: ['real_time', 'fast'],
      features: [
        'Highest intelligence',
        'Large context',
        'Excellent writing',
        'Research capabilities',
      ],
      limitations: ['Slowest Claude model', 'Highest cost', 'No vision'],
    },
    pricing: {
      input: 15.0,
      output: 75.0,
    },
    metadata: {
      contextWindow: 200000,
      latency: 'thorough',
      knowledgeCutoff: '2023-10',
      functionCalling: true,
      vision: false,
      streaming: true,
      size: 'xlarge',
    },
    available: true,
    releaseDate: '2024-03',
  },
  {
    id: 'claude-3-haiku',
    provider: 'claude',
    model: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku',
    capabilities: {
      strengths: ['fast', 'chat', 'question_answering', 'summarization', 'real_time'],
      capable: ['code', 'creative', 'analysis'],
      weaknesses: ['complex_reasoning', 'long_context', 'research'],
      features: ['Fastest Claude model', 'Cost-effective', 'Good for simple tasks'],
      limitations: ['Less capable than Sonnet/Opus', 'Smaller context than newer models'],
    },
    pricing: {
      input: 0.25,
      output: 1.25,
    },
    metadata: {
      contextWindow: 200000,
      latency: 'fast',
      knowledgeCutoff: '2023-10',
      functionCalling: true,
      vision: false,
      streaming: true,
      size: 'medium',
    },
    available: true,
    releaseDate: '2024-03',
  },

  // ========== GOOGLE GEMINI MODELS ==========
  {
    id: 'gemini-2.0-flash',
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash',
    capabilities: {
      strengths: ['fast', 'multimodal', 'vision', 'chat', 'question_answering', 'real_time'],
      capable: ['code', 'creative', 'analysis', 'translation'],
      weaknesses: ['complex_reasoning', 'long_context'],
      features: ['Multimodal', 'Vision', 'Streaming', 'Fast inference', 'Function calling'],
      limitations: ['Experimental model', 'May have inconsistent performance'],
    },
    pricing: {
      input: 0.15,
      output: 0.6,
    },
    metadata: {
      contextWindow: 1048576,
      latency: 'realtime',
      knowledgeCutoff: '2024-08',
      functionCalling: true,
      vision: true,
      streaming: true,
      size: 'large',
    },
    available: true,
    releaseDate: '2024-12',
    notes: 'Latest Gemini model with multimodal capabilities',
  },
  {
    id: 'gemini-1.5-pro',
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    capabilities: {
      strengths: ['multimodal', 'vision', 'long_context', 'analysis', 'creative'],
      capable: ['chat', 'code', 'reasoning'],
      weaknesses: ['real_time', 'fast'],
      features: ['Massive context window', 'Multimodal', 'Vision', 'Function calling'],
      limitations: ['Slower than Flash models', 'Higher cost'],
    },
    pricing: {
      input: 1.25,
      output: 5.0,
    },
    metadata: {
      contextWindow: 2097152,
      latency: 'balanced',
      knowledgeCutoff: '2024-04',
      functionCalling: true,
      vision: true,
      streaming: true,
      size: 'xlarge',
    },
    available: true,
    releaseDate: '2024-02',
  },
  {
    id: 'gemini-1.5-flash',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    capabilities: {
      strengths: ['fast', 'multimodal', 'vision', 'chat', 'question_answering'],
      capable: ['code', 'creative', 'analysis'],
      weaknesses: ['complex_reasoning', 'long_context'],
      features: ['Fast inference', 'Multimodal', 'Vision', 'Function calling'],
      limitations: ['Smaller context than Pro', 'Less capable than Pro'],
    },
    pricing: {
      input: 0.075,
      output: 0.3,
    },
    metadata: {
      contextWindow: 1048576,
      latency: 'fast',
      knowledgeCutoff: '2024-04',
      functionCalling: true,
      vision: true,
      streaming: true,
      size: 'large',
    },
    available: true,
    releaseDate: '2024-05',
  },
];

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Industry-leading models with excellent performance',
    requiresApiKey: true,
    localOnly: false,
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Safety-focused models with strong reasoning capabilities',
    requiresApiKey: true,
    localOnly: false,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Fast multimodal models with large context windows',
    requiresApiKey: true,
    localOnly: false,
  },
  {
    id: 'meta',
    name: 'Meta Llama',
    description: 'Open-source models from Meta (via Ollama)',
    requiresApiKey: false,
    localOnly: true,
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Open-source models with strong multilingual support',
    requiresApiKey: false,
    localOnly: true,
  },
  {
    id: 'qwen',
    name: 'Qwen',
    description: "Alibaba's open-source models, strong in coding",
    requiresApiKey: false,
    localOnly: true,
  },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Check Ollama health with timeout
 */
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

/**
 * Fetch live Ollama models from the Ollama API with fallback logic
 */
async function getOllamaModels(): Promise<{
  models: any[];
  status: { type: 'remote' | 'local' | 'offline'; url: string };
}> {
  // Try remote URL first (OLLAMA_BASE_URL)
  const remoteUrl = Deno.env.get('OLLAMA_BASE_URL');
  if (remoteUrl) {
    const remoteHealthy = await checkOllama(remoteUrl);
    if (remoteHealthy) {
      try {
        const response = await fetch(`${remoteUrl}/api/tags`, { timeout: 5000 });
        if (response.ok) {
          const data = await response.json();
          const ollamaModels = processOllamaModels(data.models || [], 'remote');
          return { models: ollamaModels, status: { type: 'remote', url: remoteUrl } };
        }
      } catch (error) {
        console.warn(`Failed to fetch models from remote Ollama (${remoteUrl}):`, error);
      }
    }
  }

  // Fallback to local
  const localUrl = 'http://127.0.0.1:11434';
  const localHealthy = await checkOllama(localUrl);
  if (localHealthy) {
    try {
      const response = await fetch(`${localUrl}/api/tags`, { timeout: 5000 });
      if (response.ok) {
        const data = await response.json();
        const ollamaModels = processOllamaModels(data.models || [], 'local');
        return { models: ollamaModels, status: { type: 'local', url: localUrl } };
      }
    } catch (error) {
      console.warn(`Failed to fetch models from local Ollama (${localUrl}):`, error);
    }
  }

  // Both failed
  return { models: [], status: { type: 'offline', url: '' } };
}

/**
 * Process Ollama models data into our format
 */
function processOllamaModels(models: any[], source: 'remote' | 'local'): any[] {
  const ollamaModels: any[] = [];

  for (const model of models) {
    const modelName = model.name.toLowerCase();

    // Try to match with known models in our registry
    let baseModel = AI_MODELS.find(
      (m) =>
        m.model.toLowerCase().includes(modelName) ||
        modelName.includes(m.model.toLowerCase().split(':')[0]),
    );

    if (!baseModel) {
      // Create generic Ollama model entry for unknown models
      const modelFamily = modelName.includes('llama')
        ? 'meta'
        : modelName.includes('mistral')
        ? 'mistral'
        : modelName.includes('qwen')
        ? 'qwen'
        : 'meta';

      baseModel = {
        id: `ollama-${model.name}`,
        provider: modelFamily,
        model: model.name,
        displayName: `${model.name} (${source === 'remote' ? 'RunPod' : 'Local'})`,
        capabilities: {
          strengths: modelName.includes('coder')
            ? ['code', 'coding_assistant']
            : ['chat', 'analysis'],
          capable: ['creative', 'question_answering'],
          weaknesses: ['vision', 'multimodal', 'real_time'],
          features: ['Local inference', 'Privacy-focused', 'No API costs'],
          limitations: ['Hardware dependent', 'No cloud features', 'May be slower'],
        },
        pricing: { input: 0, output: 0 },
        metadata: {
          contextWindow: model.details?.context_length || 4096,
          latency: modelName.includes('70b') || modelName.includes('405b') ? 'balanced' : 'fast',
          knowledgeCutoff: '2024-01',
          functionCalling: false,
          vision: false,
          streaming: true,
          size:
            modelName.includes('70b') || modelName.includes('405b')
              ? 'xlarge'
              : modelName.includes('32b') || modelName.includes('14b')
              ? 'large'
              : 'medium',
        },
        available: true,
        releaseDate: '2024-01',
        source: 'ollama',
      };
    }

    // Override with Ollama-specific data
    const ollamaModel = {
      ...baseModel,
      id: `ollama-${model.name}`,
      model: model.name,
      displayName: `${model.name} (${source === 'remote' ? 'RunPod' : 'Local'})`,
      metadata: {
        ...baseModel.metadata,
        contextWindow: model.details?.context_length || baseModel.metadata.contextWindow,
      },
      source: 'ollama',
      ollama: {
        size: model.size || 'Unknown',
        format: model.details?.format || 'Unknown',
        family: model.details?.family || 'Unknown',
        families: model.details?.families || [],
        parameter_size: model.details?.parameter_size || 'Unknown',
        quantization_level: model.details?.quantization_level || 'Unknown',
      },
    };

    ollamaModels.push(ollamaModel);
  }

  return ollamaModels;
}

/**
 * Check provider availability based on API keys
 */
async function checkProviderAvailability(
  supabase: any,
  companyId: string,
): Promise<Record<string, boolean>> {
  const availability: Record<string, boolean> = {};

  try {
    // Check for API keys in the provider_keys table
    const { data: apiKeys } = await supabase
      .from('provider_keys')
      .select('provider')
      .eq('company_id', companyId);

    const availableProviders = new Set(apiKeys?.map((k) => k.provider) || []);

    // Define which providers require API keys
    availability.openai = availableProviders.has('openai');
    availability.claude = availableProviders.has('anthropic');
    availability.gemini = availableProviders.has('google-gemini');

    // Local providers are always available if Ollama is running
    const ollamaResult = await getOllamaModels();
    availability.meta = ollamaResult.models.some((m) => m.provider === 'meta');
    availability.mistral = ollamaResult.models.some((m) => m.provider === 'mistral');
    availability.qwen = ollamaResult.models.some((m) => m.provider === 'qwen');
  } catch (error) {
    console.error('Error checking provider availability:', error);
    // Fallback: assume all providers are available
    availability.openai = true;
    availability.claude = true;
    availability.gemini = true;
    availability.meta = true;
    availability.mistral = true;
    availability.qwen = true;
  }

  return availability;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user and company
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return new Response(JSON.stringify({ error: 'User has no company association' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get Ollama models (live) with status
    const ollamaResult = await getOllamaModels();

    // Check provider availability
    const providerAvailability = await checkProviderAvailability(supabase, userData.company_id);

    // Filter static models based on availability
    const availableStaticModels = AI_MODELS.filter((model) => {
      if (model.provider === 'meta' || model.provider === 'mistral' || model.provider === 'qwen') {
        // Local models: check if we have Ollama models for this provider
        return ollamaResult.models.some((om) => om.provider === model.provider);
      }
      // Cloud models: check API key availability
      return providerAvailability[model.provider] || false;
    });

    // Merge static and Ollama models
    const allModels = [...availableStaticModels, ...ollamaResult.models];

    // Remove duplicates (prefer Ollama models for local ones)
    const uniqueModels = allModels.filter(
      (model, index, self) => index === self.findIndex((m) => m.id === model.id),
    );

    // Group models by provider
    const modelsByProvider = uniqueModels.reduce((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate recommended models for common tasks
    const recommendations = {
      chat: uniqueModels
        .filter((m) => m.capabilities.strengths.includes('chat'))
        .sort((a, b) => {
          // Prefer faster, cheaper models for chat
          const aScore = (a.metadata.latency === 'fast' ? 2 : 1) * (a.pricing.input < 1 ? 2 : 1);
          const bScore = (b.metadata.latency === 'fast' ? 2 : 1) * (b.pricing.input < 1 ? 2 : 1);
          return bScore - aScore;
        })
        .slice(0, 3),

      code: uniqueModels
        .filter((m) => m.capabilities.strengths.includes('code'))
        .sort((a, b) => {
          // Prefer more capable models for coding
          const aScore = a.metadata.size === 'xlarge' ? 3 : a.metadata.size === 'large' ? 2 : 1;
          const bScore = b.metadata.size === 'xlarge' ? 3 : b.metadata.size === 'large' ? 2 : 1;
          return bScore - aScore;
        })
        .slice(0, 3),

      creative: uniqueModels
        .filter((m) => m.capabilities.strengths.includes('creative'))
        .sort((a, b) => {
          // Prefer more capable models for creative work
          const aScore = a.metadata.size === 'xlarge' ? 3 : a.metadata.size === 'large' ? 2 : 1;
          const bScore = b.metadata.size === 'xlarge' ? 3 : b.metadata.size === 'large' ? 2 : 1;
          return bScore - aScore;
        })
        .slice(0, 3),

      fast: uniqueModels
        .filter((m) => m.metadata.latency === 'fast' || m.metadata.latency === 'realtime')
        .sort((a, b) => a.pricing.input - b.pricing.input) // Cheapest first
        .slice(0, 3),

      budget: uniqueModels
        .filter((m) => (m.pricing.input + m.pricing.output) / 2 < 2) // Under $2 per 1M tokens avg
        .sort((a, b) => a.pricing.input - b.pricing.input)
        .slice(0, 3),
    };

    return new Response(
      JSON.stringify({
        success: true,
        models: uniqueModels,
        modelsByProvider,
        providers: PROVIDERS,
        providerAvailability,
        recommendations,
        ollamaStatus: ollamaResult.status,
        metadata: {
          totalModels: uniqueModels.length,
          ollamaModelsCount: ollamaResult.models.length,
          staticModelsCount: availableStaticModels.length,
          lastUpdated: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  } catch (error) {
    console.error('AI Capabilities error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  }
});
