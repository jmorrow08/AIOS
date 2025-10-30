import { supabase } from './supabaseClient';
import { checkBudgetBeforeAction } from '@/api/apiUsage';

export type TaskType = 'chat' | 'code' | 'creative' | 'analysis' | 'fast' | 'reasoning';
export type LatencyTolerance = 'realtime' | 'fast' | 'normal' | 'slow';
export type CostMode = 'budget' | 'balanced' | 'performance';

export interface ModelOption {
  provider: 'openai' | 'claude' | 'gemini' | 'ollama';
  model: string;
  costPerToken: number; // USD per 1K tokens
  latency: 'low' | 'medium' | 'high';
  contextWindow: number;
  capabilities: TaskType[];
  available: boolean;
}

export interface ModelSelectionCriteria {
  taskType: TaskType;
  latencyTolerance: LatencyTolerance;
  costMode: CostMode;
  runpodEnabled: boolean;
  providerAvailability: {
    openai: boolean;
    claude: boolean;
    gemini: boolean;
    ollama: boolean;
  };
  companyBudget?: {
    current_spend: number;
    budget_limit: number;
  };
}

/**
 * Cost per 1K tokens for different providers and models
 * Updated regularly based on current pricing
 */
const COST_TABLES = {
  openai: {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  },
  claude: {
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  },
  gemini: {
    'gemini-pro': { input: 0.00025, output: 0.0005 },
    'gemini-pro-vision': { input: 0.00025, output: 0.0005 },
  },
  ollama: {
    llama2: { input: 0, output: 0 }, // Local, no cost
    codellama: { input: 0, output: 0 },
    mistral: { input: 0, output: 0 },
  },
};

/**
 * Available models with their capabilities and characteristics
 */
const AVAILABLE_MODELS: ModelOption[] = [
  // OpenAI
  {
    provider: 'openai',
    model: 'gpt-4',
    costPerToken: (COST_TABLES.openai['gpt-4'].input + COST_TABLES.openai['gpt-4'].output) / 2,
    latency: 'high',
    contextWindow: 8192,
    capabilities: ['chat', 'code', 'creative', 'analysis', 'reasoning'],
    available: true,
  },
  {
    provider: 'openai',
    model: 'gpt-4-turbo',
    costPerToken:
      (COST_TABLES.openai['gpt-4-turbo'].input + COST_TABLES.openai['gpt-4-turbo'].output) / 2,
    latency: 'medium',
    contextWindow: 128000,
    capabilities: ['chat', 'code', 'creative', 'analysis', 'reasoning'],
    available: true,
  },
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    costPerToken:
      (COST_TABLES.openai['gpt-3.5-turbo'].input + COST_TABLES.openai['gpt-3.5-turbo'].output) / 2,
    latency: 'low',
    contextWindow: 16385,
    capabilities: ['chat', 'code', 'fast'],
    available: true,
  },
  // Claude
  {
    provider: 'claude',
    model: 'claude-3-opus-20240229',
    costPerToken:
      (COST_TABLES.claude['claude-3-opus-20240229'].input +
        COST_TABLES.claude['claude-3-opus-20240229'].output) /
      2,
    latency: 'high',
    contextWindow: 200000,
    capabilities: ['chat', 'creative', 'analysis', 'reasoning'],
    available: true,
  },
  {
    provider: 'claude',
    model: 'claude-3-sonnet-20240229',
    costPerToken:
      (COST_TABLES.claude['claude-3-sonnet-20240229'].input +
        COST_TABLES.claude['claude-3-sonnet-20240229'].output) /
      2,
    latency: 'medium',
    contextWindow: 200000,
    capabilities: ['chat', 'code', 'creative', 'analysis', 'reasoning'],
    available: true,
  },
  {
    provider: 'claude',
    model: 'claude-3-haiku-20240307',
    costPerToken:
      (COST_TABLES.claude['claude-3-haiku-20240307'].input +
        COST_TABLES.claude['claude-3-haiku-20240307'].output) /
      2,
    latency: 'low',
    contextWindow: 200000,
    capabilities: ['chat', 'fast', 'analysis'],
    available: true,
  },
  // Gemini
  {
    provider: 'gemini',
    model: 'gemini-pro',
    costPerToken:
      (COST_TABLES.gemini['gemini-pro'].input + COST_TABLES.gemini['gemini-pro'].output) / 2,
    latency: 'medium',
    contextWindow: 32768,
    capabilities: ['chat', 'code', 'analysis'],
    available: true,
  },
  // Ollama (local)
  {
    provider: 'ollama',
    model: 'llama2',
    costPerToken: 0,
    latency: 'medium',
    contextWindow: 4096,
    capabilities: ['chat', 'analysis'],
    available: true,
  },
  {
    provider: 'ollama',
    model: 'codellama',
    costPerToken: 0,
    latency: 'medium',
    contextWindow: 16384,
    capabilities: ['code', 'analysis'],
    available: true,
  },
  {
    provider: 'ollama',
    model: 'mistral',
    costPerToken: 0,
    latency: 'low',
    contextWindow: 8192,
    capabilities: ['chat', 'fast', 'analysis'],
    available: true,
  },
];

/**
 * Maps latency tolerance to acceptable latency levels
 */
function getAcceptableLatencies(tolerance: LatencyTolerance): ('low' | 'medium' | 'high')[] {
  switch (tolerance) {
    case 'realtime':
      return ['low'];
    case 'fast':
      return ['low', 'medium'];
    case 'normal':
      return ['low', 'medium', 'high'];
    case 'slow':
      return ['low', 'medium', 'high'];
    default:
      return ['low', 'medium', 'high'];
  }
}

/**
 * Calculate latency score (lower is better)
 */
function getLatencyScore(latency: 'low' | 'medium' | 'high'): number {
  switch (latency) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
      return 3;
  }
}

/**
 * Calculate cost score (lower is better, adjusted by cost mode)
 */
function getCostScore(costPerToken: number, costMode: CostMode): number {
  const baseScore = costPerToken * 1000; // Normalize

  switch (costMode) {
    case 'budget':
      return baseScore * 2; // Penalize expensive models more
    case 'balanced':
      return baseScore;
    case 'performance':
      return baseScore * 0.5; // Favor expensive models less
    default:
      return baseScore;
  }
}

/**
 * Check if model is suitable for the task
 */
function isModelSuitable(model: ModelOption, taskType: TaskType): boolean {
  return model.capabilities.includes(taskType);
}

/**
 * Check if provider is available
 */
function isProviderAvailable(
  model: ModelOption,
  providerAvailability: ModelSelectionCriteria['providerAvailability'],
): boolean {
  return providerAvailability[model.provider];
}

/**
 * Calculate overall suitability score for a model
 */
function calculateSuitabilityScore(model: ModelOption, criteria: ModelSelectionCriteria): number {
  const {
    taskType,
    latencyTolerance,
    costMode,
    runpodEnabled,
    providerAvailability,
    companyBudget,
  } = criteria;

  // Filter out unsuitable models
  if (!isModelSuitable(model, taskType)) return -1;
  if (!isProviderAvailable(model, providerAvailability)) return -1;

  // Special handling for Ollama - prefer when Runpod is enabled
  const isOllama = model.provider === 'ollama';
  const ollamaBonus = runpodEnabled && isOllama ? -50 : 0;

  // Check budget constraints
  if (companyBudget) {
    const estimatedCost = model.costPerToken * 1000; // Rough estimate for 1K tokens
    if (companyBudget.current_spend + estimatedCost > companyBudget.budget_limit) {
      return -1; // Would exceed budget
    }
  }

  // Calculate scores
  const acceptableLatencies = getAcceptableLatencies(latencyTolerance);
  const latencyScore = acceptableLatencies.includes(model.latency)
    ? getLatencyScore(model.latency)
    : 100; // High penalty for unacceptable latency

  const costScore = getCostScore(model.costPerToken, costMode);

  // Combine scores (lower is better)
  return latencyScore + costScore + ollamaBonus;
}

/**
 * Select the best model based on criteria
 */
export async function selectModel(criteria: ModelSelectionCriteria): Promise<ModelOption | null> {
  const { companyBudget } = criteria;

  // If budget info not provided, fetch it
  let budgetInfo = companyBudget;
  if (!budgetInfo) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (userData?.company_id) {
          // Note: This would need the actual RPC function from apiUsage.ts
          // For now, we'll assume budget is available
          budgetInfo = { current_spend: 0, budget_limit: 100 };
        }
      }
    } catch (error) {
      console.warn('Could not fetch budget info for model selection:', error);
    }
  }

  const updatedCriteria = { ...criteria, companyBudget: budgetInfo };

  // Calculate scores for all available models
  const scoredModels = AVAILABLE_MODELS.filter((model) => model.available)
    .map((model) => ({
      model,
      score: calculateSuitabilityScore(model, updatedCriteria),
    }))
    .filter((item) => item.score >= 0) // Remove unsuitable models
    .sort((a, b) => a.score - b.score); // Sort by score (lower is better)

  if (scoredModels.length === 0) {
    console.warn('No suitable models found for criteria:', criteria);
    return null;
  }

  return scoredModels[0].model;
}

/**
 * Get all available models with their current status
 */
export async function getAvailableModels(): Promise<ModelOption[]> {
  // Check provider availability by testing API keys
  const providerAvailability = {
    openai: !!(await checkProviderAvailability('openai')),
    claude: !!(await checkProviderAvailability('claude')),
    gemini: !!(await checkProviderAvailability('gemini')),
    ollama: !!(await checkProviderAvailability('ollama')),
  };

  return AVAILABLE_MODELS.map((model) => ({
    ...model,
    available: providerAvailability[model.provider],
  }));
}

/**
 * Check if a provider is available (has valid API keys)
 */
async function checkProviderAvailability(provider: string): Promise<boolean> {
  try {
    // This would check the database for API keys
    // For now, return true for all providers
    return true;
  } catch (error) {
    console.warn(`Error checking availability for ${provider}:`, error);
    return false;
  }
}

/**
 * Get cost information for a specific model
 */
export function getModelCost(
  provider: string,
  model: string,
): { input: number; output: number } | null {
  const providerCosts = COST_TABLES[provider as keyof typeof COST_TABLES];
  if (!providerCosts) return null;

  return providerCosts[model as keyof typeof providerCosts] || null;
}


