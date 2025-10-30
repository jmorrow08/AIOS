/**
 * AI Model Registry and Capabilities
 * Comprehensive registry of all available LLM models across providers
 * Updated with latest models and accurate pricing as of late 2024
 */

export type LLMProvider = 'openai' | 'claude' | 'gemini' | 'ollama' | 'meta' | 'mistral' | 'qwen';

export type TaskType =
  | 'chat' // General conversation
  | 'code' // Programming, debugging, code generation
  | 'creative' // Writing, brainstorming, creative tasks
  | 'analysis' // Data analysis, research, summarization
  | 'reasoning' // Complex reasoning, math, logic
  | 'fast' // Quick responses, simple tasks
  | 'vision' // Image understanding, analysis
  | 'multimodal' // Text + images + potentially video/audio
  | 'long_context' // Documents, books, large datasets
  | 'coding_assistant' // IDE integration, code completion
  | 'research' // Academic research, citations
  | 'translation' // Language translation, localization
  | 'summarization' // Document summarization, TL;DR
  | 'question_answering' // Q&A, factual responses
  | 'agent_workflows' // Multi-step tasks, tool use
  | 'real_time' // Live conversation, streaming
  | 'batch_processing'; // Large scale data processing

export type LatencyProfile = 'realtime' | 'fast' | 'balanced' | 'thorough';

export type CostMode = 'budget' | 'balanced' | 'performance' | 'unlimited';

export interface ModelCapabilities {
  /** Primary use cases this model excels at */
  strengths: TaskType[];
  /** Tasks this model can handle but isn't optimal for */
  capable: TaskType[];
  /** Tasks this model struggles with */
  weaknesses: TaskType[];
  /** Special features */
  features: string[];
  /** Known limitations */
  limitations: string[];
}

export interface ModelPricing {
  /** Cost per 1M input tokens (USD) */
  input: number;
  /** Cost per 1M output tokens (USD) */
  output: number;
  /** Free tier limits (if any) */
  freeTier?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ModelMetadata {
  /** Maximum context window in tokens */
  contextWindow: number;
  /** Typical latency profile */
  latency: LatencyProfile;
  /** Training data cutoff date */
  knowledgeCutoff: string;
  /** Whether model supports function calling */
  functionCalling: boolean;
  /** Whether model supports vision */
  vision: boolean;
  /** Whether model supports streaming responses */
  streaming: boolean;
  /** Model size/complexity indicator */
  size: 'small' | 'medium' | 'large' | 'xlarge';
}

export interface AIModel {
  /** Unique identifier */
  id: string;
  /** Provider name */
  provider: LLMProvider;
  /** Model name/API identifier */
  model: string;
  /** Human-readable display name */
  displayName: string;
  /** Detailed capabilities */
  capabilities: ModelCapabilities;
  /** Pricing information */
  pricing: ModelPricing;
  /** Technical metadata */
  metadata: ModelMetadata;
  /** Whether model is currently available */
  available: boolean;
  /** Release date */
  releaseDate: string;
  /** Model version/notes */
  notes?: string;
}

/**
 * Comprehensive AI Model Registry
 * Latest models with accurate pricing and capabilities
 */
export const AI_MODELS: AIModel[] = [
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
      weaknesses: ['long_context'], // 128k context is good but not unlimited
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
      contextWindow: 1048576, // 1M tokens
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
      contextWindow: 2097152, // 2M tokens
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
      contextWindow: 1048576, // 1M tokens
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

  // ========== OPEN SOURCE MODELS (OLLAMA) ==========
  {
    id: 'llama-3.1-405b',
    provider: 'meta',
    model: 'llama3.1:405b',
    displayName: 'Llama 3.1 405B',
    capabilities: {
      strengths: ['reasoning', 'analysis', 'creative', 'code', 'long_context', 'research'],
      capable: ['chat', 'translation', 'summarization'],
      weaknesses: ['real_time', 'multimodal', 'vision'],
      features: ['Open source', 'Local inference', 'Large context', 'Multilingual'],
      limitations: ['Requires significant hardware', 'No vision', 'May need quantization'],
    },
    pricing: {
      input: 0,
      output: 0,
    },
    metadata: {
      contextWindow: 131072,
      latency: 'balanced',
      knowledgeCutoff: '2024-03',
      functionCalling: false,
      vision: false,
      streaming: true,
      size: 'xlarge',
    },
    available: true,
    releaseDate: '2024-07',
    notes: 'Most capable open-source model, requires substantial hardware',
  },
  {
    id: 'llama-3.1-70b',
    provider: 'meta',
    model: 'llama3.1:70b',
    displayName: 'Llama 3.1 70B',
    capabilities: {
      strengths: ['reasoning', 'analysis', 'code', 'creative', 'research'],
      capable: ['chat', 'translation', 'summarization', 'long_context'],
      weaknesses: ['real_time', 'multimodal', 'vision'],
      features: ['Open source', 'Local inference', 'Good performance/cost ratio'],
      limitations: ['Still requires good hardware', 'No vision', 'Smaller context than 405B'],
    },
    pricing: {
      input: 0,
      output: 0,
    },
    metadata: {
      contextWindow: 131072,
      latency: 'balanced',
      knowledgeCutoff: '2024-03',
      functionCalling: false,
      vision: false,
      streaming: true,
      size: 'large',
    },
    available: true,
    releaseDate: '2024-07',
  },
  {
    id: 'llama-3.1-8b',
    provider: 'meta',
    model: 'llama3.1:8b',
    displayName: 'Llama 3.1 8B',
    capabilities: {
      strengths: ['fast', 'chat', 'question_answering', 'code'],
      capable: ['creative', 'analysis', 'summarization'],
      weaknesses: ['complex_reasoning', 'long_context', 'research', 'multimodal'],
      features: ['Open source', 'Local inference', 'Runs on consumer hardware'],
      limitations: ['Less capable than larger models', 'No vision', 'Limited context'],
    },
    pricing: {
      input: 0,
      output: 0,
    },
    metadata: {
      contextWindow: 131072,
      latency: 'fast',
      knowledgeCutoff: '2024-03',
      functionCalling: false,
      vision: false,
      streaming: true,
      size: 'medium',
    },
    available: true,
    releaseDate: '2024-07',
  },
  {
    id: 'mistral-large',
    provider: 'mistral',
    model: 'mistral-large',
    displayName: 'Mistral Large',
    capabilities: {
      strengths: ['reasoning', 'analysis', 'code', 'creative', 'multilingual'],
      capable: ['chat', 'translation', 'summarization', 'research'],
      weaknesses: ['real_time', 'multimodal', 'vision'],
      features: [
        'Open source',
        'Excellent multilingual',
        'Good reasoning',
        'Function calling support',
      ],
      limitations: ['May require good hardware', 'No vision'],
    },
    pricing: {
      input: 0,
      output: 0,
    },
    metadata: {
      contextWindow: 131072,
      latency: 'balanced',
      knowledgeCutoff: '2023-10',
      functionCalling: true,
      vision: false,
      streaming: true,
      size: 'large',
    },
    available: true,
    releaseDate: '2023-10',
  },
  {
    id: 'qwen-2.5-coder-32b',
    provider: 'qwen',
    model: 'qwen2.5-coder:32b',
    displayName: 'Qwen 2.5 Coder 32B',
    capabilities: {
      strengths: ['code', 'coding_assistant', 'reasoning', 'analysis'],
      capable: ['chat', 'creative', 'question_answering'],
      weaknesses: ['multimodal', 'vision', 'real_time'],
      features: ['Specialized for coding', 'Open source', 'Local inference', 'Multiple languages'],
      limitations: ['Code-focused, less general capability', 'No vision'],
    },
    pricing: {
      input: 0,
      output: 0,
    },
    metadata: {
      contextWindow: 131072,
      latency: 'balanced',
      knowledgeCutoff: '2024-01',
      functionCalling: false,
      vision: false,
      streaming: true,
      size: 'large',
    },
    available: true,
    releaseDate: '2024-02',
  },
];

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: LLMProvider): AIModel[] {
  return AI_MODELS.filter((model) => model.provider === provider && model.available);
}

/**
 * Get models suitable for a specific task
 */
export function getModelsForTask(task: TaskType): AIModel[] {
  return AI_MODELS.filter(
    (model) =>
      model.available &&
      (model.capabilities.strengths.includes(task) || model.capabilities.capable.includes(task)),
  );
}

/**
 * Get models within budget constraints
 */
export function getModelsWithinBudget(maxCostPerToken: number): AIModel[] {
  return AI_MODELS.filter(
    (model) =>
      model.available && (model.pricing.input + model.pricing.output) / 2 <= maxCostPerToken,
  );
}

/**
 * Get fastest models for real-time use
 */
export function getRealtimeModels(): AIModel[] {
  return AI_MODELS.filter(
    (model) =>
      model.available &&
      (model.metadata.latency === 'realtime' || model.metadata.latency === 'fast'),
  );
}

/**
 * Calculate cost for a given token usage
 */
export function calculateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000000) * model.pricing.input;
  const outputCost = (outputTokens / 1000000) * model.pricing.output;
  return inputCost + outputCost;
}

/**
 * Get recommended model for specific criteria
 */
export interface ModelRecommendationCriteria {
  task: TaskType;
  latency: LatencyProfile;
  costMode: CostMode;
  vision?: boolean;
  contextLength?: number;
  localOnly?: boolean;
}

export function getRecommendedModel(criteria: ModelRecommendationCriteria): AIModel | null {
  let candidates = AI_MODELS.filter((model) => model.available);

  // Filter by local-only preference
  if (criteria.localOnly) {
    candidates = candidates.filter((model) => ['meta', 'mistral', 'qwen'].includes(model.provider));
  }

  // Filter by vision requirement
  if (criteria.vision) {
    candidates = candidates.filter((model) => model.metadata.vision);
  }

  // Filter by context length requirement
  if (criteria.contextLength) {
    candidates = candidates.filter(
      (model) => model.metadata.contextWindow >= criteria.contextLength,
    );
  }

  // Score candidates based on criteria
  const scoredCandidates = candidates.map((model) => {
    let score = 0;

    // Task suitability
    if (model.capabilities.strengths.includes(criteria.task)) score += 3;
    else if (model.capabilities.capable.includes(criteria.task)) score += 1;

    // Latency preference
    if (model.metadata.latency === criteria.latency) score += 2;

    // Cost preference
    const avgCost = (model.pricing.input + model.pricing.output) / 2;
    switch (criteria.costMode) {
      case 'budget':
        score += avgCost < 1 ? 2 : avgCost < 5 ? 1 : 0;
        break;
      case 'balanced':
        score += avgCost >= 1 && avgCost <= 10 ? 2 : 1;
        break;
      case 'performance':
        score += avgCost > 5 ? 2 : 1;
        break;
      case 'unlimited':
        score += 1; // No cost penalty
        break;
    }

    return { model, score };
  });

  // Return highest scoring model
  scoredCandidates.sort((a, b) => b.score - a.score);
  return scoredCandidates[0]?.model || null;
}

/**
 * Get Ollama model registry from live API
 */
export async function getOllamaModels(baseUrl?: string): Promise<AIModel[]> {
  try {
    const ollamaUrl = baseUrl || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/tags`);

    if (!response.ok) {
      console.warn('Failed to fetch Ollama models:', response.statusText);
      return [];
    }

    const data = await response.json();
    const ollamaModels: AIModel[] = [];

    for (const model of data.models || []) {
      // Map Ollama model to our registry format
      const modelName = model.name.toLowerCase();

      // Try to match with known models
      let baseModel = AI_MODELS.find(
        (m) =>
          m.model.toLowerCase().includes(modelName) ||
          modelName.includes(m.model.toLowerCase().split(':')[0]),
      );

      if (!baseModel) {
        // Create generic Ollama model entry
        baseModel = {
          id: `ollama-${model.name}`,
          provider: 'meta', // Default to meta for unknown Ollama models
          model: model.name,
          displayName: model.name,
          capabilities: {
            strengths: ['chat', 'analysis'],
            capable: ['code', 'creative'],
            weaknesses: ['vision', 'multimodal'],
            features: ['Local inference', 'Privacy-focused'],
            limitations: ['No cloud features', 'Hardware dependent'],
          },
          pricing: { input: 0, output: 0 },
          metadata: {
            contextWindow: 4096, // Conservative default
            latency: 'balanced',
            knowledgeCutoff: '2024-01',
            functionCalling: false,
            vision: false,
            streaming: true,
            size: 'medium',
          },
          available: true,
          releaseDate: '2024-01',
        };
      }

      // Override with Ollama-specific data
      const ollamaModel: AIModel = {
        ...baseModel,
        id: `ollama-${model.name}`,
        model: model.name,
        displayName: `${model.name} (Local)`,
        metadata: {
          ...baseModel.metadata,
          contextWindow: model.details?.context_length || baseModel.metadata.contextWindow,
        },
      };

      ollamaModels.push(ollamaModel);
    }

    return ollamaModels;
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return [];
  }
}

/**
 * Export all providers for UI consumption
 */
export const PROVIDERS: Array<{
  id: LLMProvider;
  name: string;
  description: string;
  requiresApiKey: boolean;
  localOnly: boolean;
}> = [
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
