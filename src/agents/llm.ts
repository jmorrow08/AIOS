import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider } from './api';
import {
  costCalculators,
  checkBudgetBeforeAction,
  logApiUsageAndUpdateBudget,
} from '@/api/apiUsage';
import { getServiceApiKey } from '@/api/security';
import { supabase } from '@/lib/supabaseClient';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export interface LLMResponse {
  content: string;
  error?: string;
  usage?: {
    tokens_used: number;
    cost: number;
    service: string;
  };
}

export interface LLMCallOptions {
  agentId?: string;
  agentName?: string;
  skipBudgetCheck?: boolean;
  skipUsageLogging?: boolean;
}

/**
 * Get API key from database or environment variables based on provider
 */
export const getApiKey = async (
  provider: LLMProvider,
  apiKeyRef?: string,
): Promise<string | null> => {
  try {
    // First try to get from database
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return getFallbackApiKey(provider, apiKeyRef);
    }

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      console.error('User has no company association');
      return getFallbackApiKey(provider, apiKeyRef);
    }

    // Map provider to service name in database
    const serviceName = mapProviderToService(provider);

    // Try to get API key from database
    const apiKey = await getServiceApiKey(userData.company_id, serviceName);
    if (apiKey) {
      return apiKey;
    }

    // Fallback to environment variables if database lookup fails
    console.warn(
      `API key not found in database for service ${serviceName}, falling back to environment variables`,
    );
    return getFallbackApiKey(provider, apiKeyRef);
  } catch (error) {
    console.error('Error fetching API key from database:', error);
    return getFallbackApiKey(provider, apiKeyRef);
  }
};

/**
 * Map LLM provider to database service name
 */
const mapProviderToService = (provider: LLMProvider): string => {
  switch (provider) {
    case 'openai':
      return 'openai';
    case 'claude':
      return 'anthropic';
    case 'gemini':
      return 'google-gemini';
    default:
      return provider;
  }
};

/**
 * Fallback to environment variables (for backward compatibility)
 */
const getFallbackApiKey = (provider: LLMProvider, apiKeyRef?: string): string | null => {
  // If apiKeyRef is provided, use it as the key name in environment variables
  if (apiKeyRef) {
    return import.meta.env[apiKeyRef] || null;
  }

  // Fallback to default environment variable names
  switch (provider) {
    case 'openai':
      return import.meta.env.VITE_OPENAI_API_KEY || null;
    case 'claude':
      return import.meta.env.VITE_ANTHROPIC_API_KEY || null;
    case 'gemini':
      return import.meta.env.VITE_GOOGLE_AI_API_KEY || null;
    default:
      return null;
  }
};

/**
 * Send message to OpenAI with budget checking and usage logging
 */
export const sendOpenAIMessage = async (
  apiKey: string,
  model: string,
  prompt: string,
  task: string,
  options: LLMCallOptions = {},
): Promise<LLMResponse> => {
  try {
    // Estimate token usage for budget check
    const estimatedInputTokens = Math.ceil((prompt.length + task.length) / 4); // Rough estimate
    const estimatedOutputTokens = 2000; // max_tokens setting
    const costCalc =
      model.includes('gpt-4') && !model.includes('turbo')
        ? costCalculators.openai.gpt4(estimatedInputTokens, estimatedOutputTokens)
        : model.includes('turbo')
        ? costCalculators.openai.gpt4_turbo(estimatedInputTokens, estimatedOutputTokens)
        : costCalculators.openai.gpt3_5_turbo(estimatedInputTokens, estimatedOutputTokens);

    // Check budget before proceeding
    if (!options.skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction('OpenAI', costCalc.cost, options.agentId);
      if (budgetCheck.error) {
        return {
          content: '',
          error: `Budget check failed: ${budgetCheck.error}`,
        };
      }
      if (!budgetCheck.data?.can_proceed) {
        return {
          content: '',
          error: `Budget exceeded. Current spend: $${budgetCheck.data?.current_spend?.toFixed(
            2,
          )}, Limit: $${budgetCheck.data?.budget_limit?.toFixed(2)}`,
        };
      }
    }

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, this should be handled server-side
    });

    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: task },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return {
        content: '',
        error: 'No response from OpenAI',
      };
    }

    // Calculate actual token usage
    const actualInputTokens = completion.usage?.prompt_tokens || estimatedInputTokens;
    const actualOutputTokens = completion.usage?.completion_tokens || estimatedOutputTokens;
    const actualCostCalc =
      model.includes('gpt-4') && !model.includes('turbo')
        ? costCalculators.openai.gpt4(actualInputTokens, actualOutputTokens)
        : model.includes('turbo')
        ? costCalculators.openai.gpt4_turbo(actualInputTokens, actualOutputTokens)
        : costCalculators.openai.gpt3_5_turbo(actualInputTokens, actualOutputTokens);

    // Log usage if not skipped
    if (!options.skipUsageLogging) {
      await logApiUsageAndUpdateBudget({
        service: 'OpenAI',
        agent_id: options.agentId,
        agent: options.agentName,
        description: `LLM call: ${model}`,
        cost: actualCostCalc.cost,
        tokens_used: actualCostCalc.tokens_used,
        metadata: {
          model,
          input_tokens: actualInputTokens,
          output_tokens: actualOutputTokens,
          prompt_length: prompt.length,
          task_length: task.length,
        },
      });
    }

    return {
      content,
      usage: {
        tokens_used: actualCostCalc.tokens_used,
        cost: actualCostCalc.cost,
        service: 'OpenAI',
      },
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown OpenAI error',
    };
  }
};

/**
 * Send message to Claude (Anthropic) with budget checking and usage logging
 */
export const sendClaudeMessage = async (
  apiKey: string,
  model: string,
  prompt: string,
  task: string,
  options: LLMCallOptions = {},
): Promise<LLMResponse> => {
  try {
    // Estimate token usage for budget check
    const estimatedInputTokens = Math.ceil((prompt.length + task.length) / 4); // Rough estimate
    const estimatedOutputTokens = 2000; // max_tokens setting
    const costCalc = model.includes('sonnet')
      ? costCalculators.claude.sonnet(estimatedInputTokens, estimatedOutputTokens)
      : costCalculators.claude.haiku(estimatedInputTokens, estimatedOutputTokens);

    // Check budget before proceeding
    if (!options.skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction('Claude', costCalc.cost, options.agentId);
      if (budgetCheck.error) {
        return {
          content: '',
          error: `Budget check failed: ${budgetCheck.error}`,
        };
      }
      if (!budgetCheck.data?.can_proceed) {
        return {
          content: '',
          error: `Budget exceeded. Current spend: $${budgetCheck.data?.current_spend?.toFixed(
            2,
          )}, Limit: $${budgetCheck.data?.budget_limit?.toFixed(2)}`,
        };
      }
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    const message = await anthropic.messages.create({
      model: model || 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      system: prompt,
      messages: [{ role: 'user', content: task }],
      temperature: 0.7,
    });

    const content = message.content[0]?.type === 'text' ? message.content[0].text : '';
    if (!content) {
      return {
        content: '',
        error: 'No response from Claude',
      };
    }

    // Calculate actual token usage
    const actualInputTokens = message.usage?.input_tokens || estimatedInputTokens;
    const actualOutputTokens = message.usage?.output_tokens || estimatedOutputTokens;
    const actualCostCalc = model.includes('sonnet')
      ? costCalculators.claude.sonnet(actualInputTokens, actualOutputTokens)
      : costCalculators.claude.haiku(actualInputTokens, actualOutputTokens);

    // Log usage if not skipped
    if (!options.skipUsageLogging) {
      await logApiUsageAndUpdateBudget({
        service: 'Claude',
        agent_id: options.agentId,
        agent: options.agentName,
        description: `LLM call: ${model}`,
        cost: actualCostCalc.cost,
        tokens_used: actualCostCalc.tokens_used,
        metadata: {
          model,
          input_tokens: actualInputTokens,
          output_tokens: actualOutputTokens,
          prompt_length: prompt.length,
          task_length: task.length,
        },
      });
    }

    return {
      content,
      usage: {
        tokens_used: actualCostCalc.tokens_used,
        cost: actualCostCalc.cost,
        service: 'Claude',
      },
    };
  } catch (error) {
    console.error('Claude API error:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown Claude error',
    };
  }
};

/**
 * Send message to Gemini (Google AI) with budget checking and usage logging
 */
export const sendGeminiMessage = async (
  apiKey: string,
  model: string,
  prompt: string,
  task: string,
  options: LLMCallOptions = {},
): Promise<LLMResponse> => {
  try {
    // Estimate token usage for budget check
    const estimatedInputTokens = Math.ceil((prompt.length + task.length) / 4); // Rough estimate
    const estimatedOutputTokens = 1000; // Gemini typical response
    const costCalc = costCalculators.gemini.pro(estimatedInputTokens, estimatedOutputTokens);

    // Check budget before proceeding
    if (!options.skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction('Gemini', costCalc.cost, options.agentId);
      if (budgetCheck.error) {
        return {
          content: '',
          error: `Budget check failed: ${budgetCheck.error}`,
        };
      }
      if (!budgetCheck.data?.can_proceed) {
        return {
          content: '',
          error: `Budget exceeded. Current spend: $${budgetCheck.data?.current_spend?.toFixed(
            2,
          )}, Limit: $${budgetCheck.data?.budget_limit?.toFixed(2)}`,
        };
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model: model || 'gemini-pro',
      systemInstruction: prompt,
    });

    const result = await geminiModel.generateContent(task);
    const response = await result.response;
    const content = response.text();

    if (!content) {
      return {
        content: '',
        error: 'No response from Gemini',
      };
    }

    // Estimate actual token usage (Gemini doesn't provide token counts in response)
    const actualInputTokens = Math.ceil((prompt.length + task.length) / 4);
    const actualOutputTokens = Math.ceil(content.length / 4);
    const actualCostCalc = costCalculators.gemini.pro(actualInputTokens, actualOutputTokens);

    // Log usage if not skipped
    if (!options.skipUsageLogging) {
      await logApiUsageAndUpdateBudget({
        service: 'Gemini',
        agent_id: options.agentId,
        agent: options.agentName,
        description: `LLM call: ${model}`,
        cost: actualCostCalc.cost,
        tokens_used: actualCostCalc.tokens_used,
        metadata: {
          model,
          estimated_input_tokens: actualInputTokens,
          estimated_output_tokens: actualOutputTokens,
          prompt_length: prompt.length,
          task_length: task.length,
          response_length: content.length,
        },
      });
    }

    return {
      content,
      usage: {
        tokens_used: actualCostCalc.tokens_used,
        cost: actualCostCalc.cost,
        service: 'Gemini',
      },
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown Gemini error',
    };
  }
};

/**
 * Send message to LLM based on provider configuration with budget checking and usage logging
 */
export const sendLLMMessage = async (
  config: LLMConfig | Promise<LLMConfig | null>,
  prompt: string,
  task: string,
  options: LLMCallOptions = {},
): Promise<LLMResponse> => {
  // Handle both sync and async config
  const resolvedConfig = config instanceof Promise ? await config : config;

  if (!resolvedConfig) {
    return {
      content: '',
      error: 'Failed to create LLM configuration',
    };
  }

  const { provider, apiKey, model } = resolvedConfig;

  switch (provider) {
    case 'openai':
      return await sendOpenAIMessage(apiKey, model, prompt, task, options);
    case 'claude':
      return await sendClaudeMessage(apiKey, model, prompt, task, options);
    case 'gemini':
      return await sendGeminiMessage(apiKey, model, prompt, task, options);
    default:
      return {
        content: '',
        error: `Unsupported LLM provider: ${provider}`,
      };
  }
};

/**
 * Create LLM configuration from agent data
 */
export const createLLMConfig = async (
  provider: LLMProvider,
  apiKeyRef?: string,
  model?: string,
): Promise<LLMConfig | null> => {
  const apiKey = await getApiKey(provider, apiKeyRef);

  if (!apiKey) {
    console.error(`API key not found for provider: ${provider}`);
    return null;
  }

  return {
    provider,
    apiKey,
    model: model || getDefaultModel(provider),
  };
};

/**
 * Get default model for a provider
 */
export const getDefaultModel = (provider: LLMProvider): string => {
  switch (provider) {
    case 'openai':
      return 'gpt-4';
    case 'claude':
      return 'claude-3-sonnet-20240229';
    case 'gemini':
      return 'gemini-pro';
    default:
      return '';
  }
};
