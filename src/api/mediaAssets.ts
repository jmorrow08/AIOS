import { supabase } from '@/lib/supabaseClient';

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
