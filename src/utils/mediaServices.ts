import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';
import {
  Scene,
  MediaProjectSettings,
  VideoExportOptions,
  RenderProgress,
  TextOverlay,
} from '@/lib/types';
import {
  costCalculators,
  checkBudgetBeforeAction,
  logApiUsageAndUpdateBudget,
} from '@/api/apiUsage';

// AI Service Configurations
interface AIServiceConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// Get API key from Supabase settings
const getApiKey = async (serviceKey: string): Promise<string | null> => {
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', serviceKey).single();

    return data?.value || null;
  } catch (error) {
    console.error(`Failed to get API key for ${serviceKey}:`, error);
    return null;
  }
};

/**
 * Rewrite a prompt using GPT-4 to make it more cinematic and polished
 */
export const rewritePrompt = async (
  originalPrompt: string,
  context: 'image' | 'audio' | 'video',
  agentId?: string,
): Promise<{ success: boolean; rewrittenPrompt?: string; error?: string; cost?: number }> => {
  try {
    const openaiApiKey = await getApiKey('openai_api_key');
    if (!openaiApiKey) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    // Calculate estimated cost
    const estimatedTokens = Math.ceil((originalPrompt.length + 200) / 4);
    const costCalc = costCalculators.openai.chatCompletion(estimatedTokens);

    // Check budget
    const budgetCheck = await checkBudgetBeforeAction('OpenAI', costCalc.cost, agentId);
    if (budgetCheck.error) {
      return { success: false, error: `Budget check failed: ${budgetCheck.error}` };
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true,
    });

    const contextPrompts = {
      image: `Rewrite this image prompt to be more cinematic and visually appealing. Focus on:
- Lighting and atmosphere
- Composition and framing
- Style and mood
- Visual details that enhance the scene
Make it detailed but concise, optimized for AI image generation.`,

      audio: `Rewrite this audio script to be more engaging and natural for voice synthesis. Focus on:
- Natural speech patterns
- Emotional delivery cues
- Clear pronunciation
- Engaging narrative flow
Make it optimized for text-to-speech conversion.`,

      video: `Rewrite this video concept to be more cinematic and production-ready. Focus on:
- Visual storytelling elements
- Pacing and scene composition
- Cinematic techniques
- Professional production quality
Make it detailed for video generation systems.`,
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional creative director specializing in AI-generated content. ${contextPrompts[context]}

Keep the core meaning but enhance it significantly. Be specific and descriptive. Avoid generic terms like "beautiful" or "amazing" - use concrete visual/audio details.`,
        },
        {
          role: 'user',
          content: `Original prompt: "${originalPrompt}"

Please rewrite this to be more professional and effective for AI ${context} generation.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const rewrittenPrompt = response.choices[0]?.message?.content?.trim();
    if (!rewrittenPrompt) {
      return { success: false, error: 'No response from AI prompt rewriter' };
    }

    // Log usage
    const actualTokens = response.usage?.total_tokens || estimatedTokens;
    const actualCostCalc = costCalculators.openai.chatCompletion(actualTokens);

    await logApiUsageAndUpdateBudget({
      service: 'OpenAI',
      agent_id: agentId,
      description: `Prompt rewriting for ${context}`,
      cost: actualCostCalc.cost,
      tokens_used: actualTokens,
      metadata: {
        original_prompt: originalPrompt,
        rewritten_prompt: rewrittenPrompt,
        context,
        model: 'gpt-4',
      },
    });

    return {
      success: true,
      rewrittenPrompt,
      cost: actualCostCalc.cost,
    };
  } catch (error) {
    console.error('Prompt rewriting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rewrite prompt',
    };
  }
};

/**
 * Generate image using various AI services
 */
export const generateImage = async (
  prompt: string,
  service: 'dalle' | 'stability' | 'midjourney',
  options: {
    size?: string;
    style?: string;
    quality?: string;
    agentId?: string;
    skipBudgetCheck?: boolean;
  } = {},
): Promise<{ success: boolean; imageUrl?: string; error?: string; cost?: number }> => {
  try {
    const {
      size = '1024x1024',
      style = 'natural',
      quality = 'standard',
      agentId,
      skipBudgetCheck = false,
    } = options;

    switch (service) {
      case 'dalle':
        return await generateDalleImage(prompt, size, quality, agentId, skipBudgetCheck);
      case 'stability':
        return await generateStabilityImage(prompt, size, style, agentId, skipBudgetCheck);
      case 'midjourney':
        return await generateMidjourneyImage(prompt, size, style, agentId, skipBudgetCheck);
      default:
        return { success: false, error: 'Unsupported image service' };
    }
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image',
    };
  }
};

/**
 * Generate image using DALL-E
 */
const generateDalleImage = async (
  prompt: string,
  size: string,
  quality: string,
  agentId?: string,
  skipBudgetCheck?: boolean,
): Promise<{ success: boolean; imageUrl?: string; error?: string; cost?: number }> => {
  try {
    const apiKey = await getApiKey('dalle_api_key');
    if (!apiKey) {
      return { success: false, error: 'DALL-E API key not configured' };
    }

    // Calculate estimated cost
    const costCalc = costCalculators.dalle.image_generation(quality === 'hd' ? 2 : 1);

    // Check budget
    if (!skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction('DALL-E', costCalc.cost, agentId);
      if (budgetCheck.error) {
        return { success: false, error: `Budget check failed: ${budgetCheck.error}` };
      }
    }

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const response = await openai.images.generate({
      model: quality === 'hd' ? 'dall-e-3' : 'dall-e-2',
      prompt,
      size: size as any,
      quality: quality as any,
      n: 1,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      return { success: false, error: 'No image URL returned from DALL-E' };
    }

    // Log usage
    if (!skipBudgetCheck) {
      await logApiUsageAndUpdateBudget({
        service: 'DALL-E',
        agent_id: agentId,
        description: 'Image generation',
        cost: costCalc.cost,
        images_generated: 1,
        metadata: {
          prompt,
          size,
          quality,
          model: quality === 'hd' ? 'dall-e-3' : 'dall-e-2',
        },
      });
    }

    return { success: true, imageUrl, cost: costCalc.cost };
  } catch (error) {
    console.error('DALL-E generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image with DALL-E',
    };
  }
};

/**
 * Generate image using Stability AI
 */
const generateStabilityImage = async (
  prompt: string,
  size: string,
  style: string,
  agentId?: string,
  skipBudgetCheck?: boolean,
): Promise<{ success: boolean; imageUrl?: string; error?: string; cost?: number }> => {
  try {
    const apiKey = await getApiKey('stability_api_key');
    if (!apiKey) {
      return { success: false, error: 'Stability AI API key not configured' };
    }

    // Calculate estimated cost
    const [width, height] = size.split('x').map(Number);
    const resolution = width >= 1024 ? 'high' : 'standard';
    const costCalc = costCalculators.stability.image_generation(1, resolution);

    // Check budget
    if (!skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction('Stability AI', costCalc.cost, agentId);
      if (budgetCheck.error) {
        return { success: false, error: `Budget check failed: ${budgetCheck.error}` };
      }
    }

    // Mock implementation - replace with actual Stability AI API call
    console.log('Generating image with Stability AI:', { prompt, size, style });

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock response - replace with actual API call
    const mockImageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;

    // Log usage
    if (!skipBudgetCheck) {
      await logApiUsageAndUpdateBudget({
        service: 'Stability AI',
        agent_id: agentId,
        description: 'Image generation',
        cost: costCalc.cost,
        images_generated: 1,
        metadata: {
          prompt,
          size,
          style,
          model: 'stable-diffusion-xl',
        },
      });
    }

    return { success: true, imageUrl: mockImageUrl, cost: costCalc.cost };
  } catch (error) {
    console.error('Stability AI generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image with Stability AI',
    };
  }
};

/**
 * Generate image using Midjourney (via API if available)
 */
const generateMidjourneyImage = async (
  prompt: string,
  size: string,
  style: string,
  agentId?: string,
  skipBudgetCheck?: boolean,
): Promise<{ success: boolean; imageUrl?: string; error?: string; cost?: number }> => {
  // Midjourney doesn't have a public API yet, so this is a placeholder
  return {
    success: false,
    error: 'Midjourney API integration not yet implemented. Please use DALL-E or Stability AI.',
  };
};

/**
 * Generate audio using various AI services
 */
export const generateAudio = async (
  text: string,
  service: 'elevenlabs' | 'google-tts',
  options: {
    voice?: string;
    speed?: number;
    agentId?: string;
    skipBudgetCheck?: boolean;
  } = {},
): Promise<{ success: boolean; audioUrl?: string; error?: string; cost?: number }> => {
  try {
    const { voice = 'default', speed = 1.0, agentId, skipBudgetCheck = false } = options;

    switch (service) {
      case 'elevenlabs':
        return await generateElevenLabsAudio(text, voice, speed, agentId, skipBudgetCheck);
      case 'google-tts':
        return await generateGoogleTTSAudio(text, voice, speed, agentId, skipBudgetCheck);
      default:
        return { success: false, error: 'Unsupported audio service' };
    }
  } catch (error) {
    console.error('Audio generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate audio',
    };
  }
};

/**
 * Generate audio using ElevenLabs
 */
const generateElevenLabsAudio = async (
  text: string,
  voice: string,
  speed: number,
  agentId?: string,
  skipBudgetCheck?: boolean,
): Promise<{ success: boolean; audioUrl?: string; error?: string; cost?: number }> => {
  try {
    const apiKey = await getApiKey('elevenlabs_api_key');
    if (!apiKey) {
      return { success: false, error: 'ElevenLabs API key not configured' };
    }

    // Estimate character count for cost calculation
    const characters = text.length;
    const costCalc = costCalculators.elevenlabs.tts(characters);

    // Check budget
    if (!skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction('ElevenLabs', costCalc.cost, agentId);
      if (budgetCheck.error) {
        return { success: false, error: `Budget check failed: ${budgetCheck.error}` };
      }
    }

    // Mock implementation - replace with actual ElevenLabs API call
    console.log('Generating audio with ElevenLabs:', { text, voice, speed });

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mock response - replace with actual API call
    const mockAudioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';

    // Log usage
    if (!skipBudgetCheck) {
      await logApiUsageAndUpdateBudget({
        service: 'ElevenLabs',
        agent_id: agentId,
        description: 'Audio generation',
        cost: costCalc.cost,
        metadata: {
          text_length: characters,
          voice,
          speed,
          model: 'eleven_monolingual_v1',
        },
      });
    }

    return { success: true, audioUrl: mockAudioUrl, cost: costCalc.cost };
  } catch (error) {
    console.error('ElevenLabs generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate audio with ElevenLabs',
    };
  }
};

/**
 * Generate audio using Google Text-to-Speech
 */
const generateGoogleTTSAudio = async (
  text: string,
  voice: string,
  speed: number,
  agentId?: string,
  skipBudgetCheck?: boolean,
): Promise<{ success: boolean; audioUrl?: string; error?: string; cost?: number }> => {
  try {
    // Google TTS is free for reasonable usage, so minimal cost calculation
    const characters = text.length;
    const costCalc = { cost: 0.0001 }; // Minimal cost for Google TTS

    // Mock implementation - replace with actual Google TTS API call
    console.log('Generating audio with Google TTS:', { text, voice, speed });

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock response - replace with actual API call
    const mockAudioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';

    // Log usage
    if (!skipBudgetCheck) {
      await logApiUsageAndUpdateBudget({
        service: 'Google TTS',
        agent_id: agentId,
        description: 'Audio generation',
        cost: costCalc.cost,
        metadata: {
          text_length: characters,
          voice,
          speed,
          provider: 'google_cloud_tts',
        },
      });
    }

    return { success: true, audioUrl: mockAudioUrl, cost: costCalc.cost };
  } catch (error) {
    console.error('Google TTS generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate audio with Google TTS',
    };
  }
};

/**
 * Upload media file to Supabase Storage
 */
export const uploadMediaToStorage = async (
  file: File | Blob,
  fileName: string,
  bucket: string = 'media',
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Media upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload media',
    };
  }
};

/**
 * Download and convert media URL to blob
 */
export const urlToBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  return await response.blob();
};

/**
 * Calculate total duration of scenes
 */
export const calculateTotalDuration = (scenes: Scene[]): number => {
  return scenes.reduce((total, scene) => total + scene.duration, 0);
};

/**
 * Validate scene data
 */
export const validateScene = (scene: Partial<Scene>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!scene.title?.trim()) {
    errors.push('Scene title is required');
  }

  if (!scene.script?.trim()) {
    errors.push('Scene script is required');
  }

  if (!scene.duration || scene.duration <= 0) {
    errors.push('Scene duration must be greater than 0');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get default project settings
 */
export const getDefaultProjectSettings = (): MediaProjectSettings => ({
  imageService: 'dalle',
  audioService: 'elevenlabs',
  videoService: 'heygen',
  promptRewriterEnabled: true,
  outputFormat: 'mp4',
  resolution: '1080p',
});

/**
 * Save project settings to Supabase
 */
export const saveProjectSettings = async (
  projectId: string,
  settings: MediaProjectSettings,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('media_projects')
      .update({ settings })
      .eq('id', projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to save project settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save settings',
    };
  }
};

/**
 * Load project settings from Supabase
 */
export const loadProjectSettings = async (
  projectId: string,
): Promise<{ success: boolean; settings?: MediaProjectSettings; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('media_projects')
      .select('settings')
      .eq('id', projectId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const settings = data?.settings || getDefaultProjectSettings();
    return { success: true, settings };
  } catch (error) {
    console.error('Failed to load project settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load settings',
    };
  }
};
