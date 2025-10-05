import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/api/dashboard';
import {
  costCalculators,
  checkBudgetBeforeAction,
  logApiUsageAndUpdateBudget,
} from '@/api/apiUsage';

export interface MediaAsset {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type: string;
  media_type: 'image' | 'video' | 'audio';
  prompt?: string;
  ai_service?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaAssetResponse {
  data: MediaAsset | MediaAsset[] | null;
  error: string | null;
}

export interface CreateMediaAssetData {
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type: string;
  media_type: 'image' | 'video' | 'audio';
  prompt?: string;
  ai_service?: string;
}

/**
 * Create a new media asset
 */
export const createMediaAsset = async (
  assetData: CreateMediaAssetData,
): Promise<MediaAssetResponse> => {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .insert([assetData])
      .select()
      .single();

    if (error) {
      console.error('Error creating media asset:', error);
      return {
        data: null,
        error: error.message || 'Failed to create media asset',
      };
    }

    // Log activity
    try {
      await logActivity(
        `New ${assetData.media_type} "${assetData.title}" was generated`,
        'media',
        '/media-studio',
        {
          media_id: data.id,
          media_type: assetData.media_type,
          title: assetData.title,
          ai_service: assetData.ai_service,
        },
      );
    } catch (logError) {
      console.warn('Failed to log media creation activity:', logError);
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating media asset:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the media asset',
    };
  }
};

/**
 * Get all media assets
 */
export const getMediaAssets = async (): Promise<MediaAssetResponse> => {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media assets:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch media assets',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching media assets:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching media assets',
    };
  }
};

/**
 * Get media assets by type
 */
export const getMediaAssetsByType = async (
  mediaType: 'image' | 'video' | 'audio',
): Promise<MediaAssetResponse> => {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('media_type', mediaType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media assets by type:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch media assets by type',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching media assets by type:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching media assets by type',
    };
  }
};

/**
 * Get a single media asset by ID
 */
export const getMediaAssetById = async (assetId: string): Promise<MediaAssetResponse> => {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error) {
      console.error('Error fetching media asset:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch media asset',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching media asset:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the media asset',
    };
  }
};

/**
 * Update a media asset
 */
export const updateMediaAsset = async (
  assetId: string,
  updates: Partial<CreateMediaAssetData>,
): Promise<MediaAssetResponse> => {
  try {
    const { data, error } = await supabase
      .from('media_assets')
      .update(updates)
      .eq('id', assetId)
      .select()
      .single();

    if (error) {
      console.error('Error updating media asset:', error);
      return {
        data: null,
        error: error.message || 'Failed to update media asset',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating media asset:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the media asset',
    };
  }
};

/**
 * Delete a media asset
 */
export const deleteMediaAsset = async (assetId: string): Promise<MediaAssetResponse> => {
  try {
    const { error } = await supabase.from('media_assets').delete().eq('id', assetId);

    if (error) {
      console.error('Error deleting media asset:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete media asset',
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting media asset:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the media asset',
    };
  }
};

// Media Generation Interfaces
export interface MediaGenerationOptions {
  agentId?: string;
  agentName?: string;
  skipBudgetCheck?: boolean;
  skipUsageLogging?: boolean;
}

export interface ImageGenerationRequest {
  prompt: string;
  count?: number;
  resolution?: 'standard' | 'high';
  style?: string;
}

export interface VideoGenerationRequest {
  script: string;
  duration?: number; // in minutes
  style?: string;
}

export interface AudioGenerationRequest {
  text: string;
  voice?: string;
}

export interface MediaGenerationResponse {
  success: boolean;
  assets?: MediaAsset[];
  error?: string;
  totalCost?: number;
}

/**
 * Generate images using AI services with budget checking and usage logging
 */
export const generateImages = async (
  request: ImageGenerationRequest,
  options: MediaGenerationOptions = {},
): Promise<MediaGenerationResponse> => {
  try {
    const imageCount = request.count || 1;
    const resolution = request.resolution || 'standard';

    // Calculate estimated cost
    const costCalc = costCalculators.stability.image_generation(imageCount, resolution);

    // Check budget before proceeding
    if (!options.skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction(
        'Stability AI',
        costCalc.cost,
        options.agentId,
      );
      if (budgetCheck.error) {
        return {
          success: false,
          error: `Budget check failed: ${budgetCheck.error}`,
        };
      }
      if (!budgetCheck.data?.can_proceed) {
        return {
          success: false,
          error: `Budget exceeded. Current spend: $${budgetCheck.data?.current_spend?.toFixed(
            2,
          )}, Limit: $${budgetCheck.data?.budget_limit?.toFixed(2)}`,
        };
      }
    }

    // Here you would integrate with actual Stability AI API
    // For now, we'll simulate the generation process
    console.log('Generating images with Stability AI:', request);

    const generatedAssets: MediaAsset[] = [];
    for (let i = 0; i < imageCount; i++) {
      const assetData: CreateMediaAssetData = {
        title: `Generated Image ${i + 1}`,
        description: `AI-generated image based on prompt: ${request.prompt}`,
        file_url: `https://example.com/generated-image-${i + 1}.jpg`, // Placeholder
        file_name: `generated-image-${i + 1}.jpg`,
        file_type: 'image/jpeg',
        media_type: 'image',
        prompt: request.prompt,
        ai_service: 'Stability AI',
      };

      const result = await createMediaAsset(assetData);
      if (result.data) {
        generatedAssets.push(result.data as MediaAsset);
      }
    }

    // Log usage if not skipped
    if (!options.skipUsageLogging) {
      await logApiUsageAndUpdateBudget({
        service: 'Stability AI',
        agent_id: options.agentId,
        agent: options.agentName,
        description: `Image generation: ${imageCount} images`,
        cost: costCalc.cost,
        images_generated: imageCount,
        metadata: {
          prompt: request.prompt,
          resolution,
          style: request.style,
          count: imageCount,
        },
      });
    }

    return {
      success: true,
      assets: generatedAssets,
      totalCost: costCalc.cost,
    };
  } catch (error) {
    console.error('Error generating images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate images',
    };
  }
};

/**
 * Generate video using AI services with budget checking and usage logging
 */
export const generateVideo = async (
  request: VideoGenerationRequest,
  options: MediaGenerationOptions = {},
): Promise<MediaGenerationResponse> => {
  try {
    const duration = request.duration || 1; // Default 1 minute

    // Calculate estimated cost
    const costCalc = costCalculators.heygen.video_generation(duration);

    // Check budget before proceeding
    if (!options.skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction('HeyGen', costCalc.cost, options.agentId);
      if (budgetCheck.error) {
        return {
          success: false,
          error: `Budget check failed: ${budgetCheck.error}`,
        };
      }
      if (!budgetCheck.data?.can_proceed) {
        return {
          success: false,
          error: `Budget exceeded. Current spend: $${budgetCheck.data?.current_spend?.toFixed(
            2,
          )}, Limit: $${budgetCheck.data?.budget_limit?.toFixed(2)}`,
        };
      }
    }

    // Here you would integrate with actual HeyGen API
    // For now, we'll simulate the generation process
    console.log('Generating video with HeyGen:', request);

    const assetData: CreateMediaAssetData = {
      title: 'Generated Video',
      description: `AI-generated video based on script: ${request.script.substring(0, 100)}...`,
      file_url: 'https://example.com/generated-video.mp4', // Placeholder
      file_name: 'generated-video.mp4',
      file_type: 'video/mp4',
      media_type: 'video',
      prompt: request.script,
      ai_service: 'HeyGen',
    };

    const result = await createMediaAsset(assetData);
    const generatedAssets = result.data ? [result.data as MediaAsset] : [];

    // Log usage if not skipped
    if (!options.skipUsageLogging && result.data) {
      await logApiUsageAndUpdateBudget({
        service: 'HeyGen',
        agent_id: options.agentId,
        agent: options.agentName,
        description: `Video generation: ${duration} minute(s)`,
        cost: costCalc.cost,
        metadata: {
          script_length: request.script.length,
          duration,
          style: request.style,
        },
      });
    }

    return {
      success: result.error === null,
      assets: generatedAssets,
      totalCost: costCalc.cost,
      error: result.error || undefined,
    };
  } catch (error) {
    console.error('Error generating video:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate video',
    };
  }
};

/**
 * Generate audio using AI services with budget checking and usage logging
 */
export const generateAudio = async (
  request: AudioGenerationRequest,
  options: MediaGenerationOptions = {},
): Promise<MediaGenerationResponse> => {
  try {
    // Estimate character count for cost calculation
    const characters = request.text.length;

    // Calculate estimated cost
    const costCalc = costCalculators.elevenlabs.tts(characters);

    // Check budget before proceeding
    if (!options.skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction(
        'ElevenLabs',
        costCalc.cost,
        options.agentId,
      );
      if (budgetCheck.error) {
        return {
          success: false,
          error: `Budget check failed: ${budgetCheck.error}`,
        };
      }
      if (!budgetCheck.data?.can_proceed) {
        return {
          success: false,
          error: `Budget exceeded. Current spend: $${budgetCheck.data?.current_spend?.toFixed(
            2,
          )}, Limit: $${budgetCheck.data?.budget_limit?.toFixed(2)}`,
        };
      }
    }

    // Here you would integrate with actual ElevenLabs API
    // For now, we'll simulate the generation process
    console.log('Generating audio with ElevenLabs:', request);

    const assetData: CreateMediaAssetData = {
      title: 'Generated Audio',
      description: `AI-generated audio for text: ${request.text.substring(0, 100)}...`,
      file_url: 'https://example.com/generated-audio.mp3', // Placeholder
      file_name: 'generated-audio.mp3',
      file_type: 'audio/mpeg',
      media_type: 'audio',
      prompt: request.text,
      ai_service: 'ElevenLabs',
    };

    const result = await createMediaAsset(assetData);
    const generatedAssets = result.data ? [result.data as MediaAsset] : [];

    // Log usage if not skipped
    if (!options.skipUsageLogging && result.data) {
      await logApiUsageAndUpdateBudget({
        service: 'ElevenLabs',
        agent_id: options.agentId,
        agent: options.agentName,
        description: `Audio generation: ${characters} characters`,
        cost: costCalc.cost,
        metadata: {
          text_length: characters,
          voice: request.voice,
        },
      });
    }

    return {
      success: result.error === null,
      assets: generatedAssets,
      totalCost: costCalc.cost,
      error: result.error || undefined,
    };
  } catch (error) {
    console.error('Error generating audio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate audio',
    };
  }
};

/**
 * Transcribe audio using Whisper with budget checking and usage logging
 */
export const transcribeAudio = async (
  audioUrl: string,
  durationMinutes: number,
  options: MediaGenerationOptions = {},
): Promise<{ success: boolean; transcription?: string; error?: string; cost?: number }> => {
  try {
    // Calculate estimated cost
    const costCalc = costCalculators.whisper.transcription(durationMinutes);

    // Check budget before proceeding
    if (!options.skipBudgetCheck) {
      const budgetCheck = await checkBudgetBeforeAction('OpenAI', costCalc.cost, options.agentId);
      if (budgetCheck.error) {
        return {
          success: false,
          error: `Budget check failed: ${budgetCheck.error}`,
        };
      }
      if (!budgetCheck.data?.can_proceed) {
        return {
          success: false,
          error: `Budget exceeded. Current spend: $${budgetCheck.data?.current_spend?.toFixed(
            2,
          )}, Limit: $${budgetCheck.data?.budget_limit?.toFixed(2)}`,
        };
      }
    }

    // Here you would integrate with actual OpenAI Whisper API
    // For now, we'll simulate the transcription process
    console.log('Transcribing audio with Whisper:', { audioUrl, durationMinutes });

    const mockTranscription = `This is a mock transcription of the audio file that was ${durationMinutes} minutes long.`;

    // Log usage if not skipped
    if (!options.skipUsageLogging) {
      await logApiUsageAndUpdateBudget({
        service: 'OpenAI',
        agent_id: options.agentId,
        agent: options.agentName,
        description: `Audio transcription: ${durationMinutes} minutes`,
        cost: costCalc.cost,
        metadata: {
          audio_url: audioUrl,
          duration_minutes: durationMinutes,
          model: 'whisper-1',
        },
      });
    }

    return {
      success: true,
      transcription: mockTranscription,
      cost: costCalc.cost,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to transcribe audio',
    };
  }
};
