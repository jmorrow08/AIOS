import { supabase } from '@/lib/supabaseClient';

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  category: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsResponse {
  data: Setting | Setting[] | null;
  error: string | null;
}

export interface CreateSettingData {
  key: string;
  value?: string;
  description?: string;
  category?: string;
  is_encrypted?: boolean;
}

/**
 * Get all settings
 */
export const getSettings = async (): Promise<SettingsResponse> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

    if (error) {
      console.error('Error fetching settings:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch settings',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching settings:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching settings',
    };
  }
};

/**
 * Get setting by key
 */
export const getSettingByKey = async (key: string): Promise<SettingsResponse> => {
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('key', key).single();

    if (error) {
      console.error('Error fetching setting:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch setting',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching setting:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the setting',
    };
  }
};

/**
 * Get settings by category
 */
export const getSettingsByCategory = async (category: string): Promise<SettingsResponse> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('category', category)
      .order('key', { ascending: true });

    if (error) {
      console.error('Error fetching settings by category:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch settings by category',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching settings by category:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching settings by category',
    };
  }
};

/**
 * Update or create a setting
 */
export const upsertSetting = async (
  key: string,
  updates: Partial<CreateSettingData>,
): Promise<SettingsResponse> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        key,
        ...updates,
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting setting:', error);
      return {
        data: null,
        error: error.message || 'Failed to update setting',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error upserting setting:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the setting',
    };
  }
};

/**
 * Delete a setting
 */
export const deleteSetting = async (key: string): Promise<SettingsResponse> => {
  try {
    const { error } = await supabase.from('settings').delete().eq('key', key);

    if (error) {
      console.error('Error deleting setting:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete setting',
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting setting:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the setting',
    };
  }
};
