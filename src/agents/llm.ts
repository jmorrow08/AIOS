import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider } from './api';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export interface LLMResponse {
  content: string;
  error?: string;
}

/**
 * Get API key from environment variables based on provider
 */
export const getApiKey = (provider: LLMProvider, apiKeyRef?: string): string | null => {
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
 * Send message to OpenAI
 */
export const sendOpenAIMessage = async (
  apiKey: string,
  model: string,
  prompt: string,
  task: string,
): Promise<LLMResponse> => {
  try {
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

    return { content };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown OpenAI error',
    };
  }
};

/**
 * Send message to Claude (Anthropic)
 */
export const sendClaudeMessage = async (
  apiKey: string,
  model: string,
  prompt: string,
  task: string,
): Promise<LLMResponse> => {
  try {
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

    return { content };
  } catch (error) {
    console.error('Claude API error:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown Claude error',
    };
  }
};

/**
 * Send message to Gemini (Google AI)
 */
export const sendGeminiMessage = async (
  apiKey: string,
  model: string,
  prompt: string,
  task: string,
): Promise<LLMResponse> => {
  try {
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

    return { content };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown Gemini error',
    };
  }
};

/**
 * Send message to LLM based on provider configuration
 */
export const sendLLMMessage = async (
  config: LLMConfig,
  prompt: string,
  task: string,
): Promise<LLMResponse> => {
  const { provider, apiKey, model } = config;

  switch (provider) {
    case 'openai':
      return await sendOpenAIMessage(apiKey, model, prompt, task);
    case 'claude':
      return await sendClaudeMessage(apiKey, model, prompt, task);
    case 'gemini':
      return await sendGeminiMessage(apiKey, model, prompt, task);
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
export const createLLMConfig = (
  provider: LLMProvider,
  apiKeyRef?: string,
  model?: string,
): LLMConfig | null => {
  const apiKey = getApiKey(provider, apiKeyRef);

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
