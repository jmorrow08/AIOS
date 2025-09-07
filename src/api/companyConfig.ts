import { supabase } from '@/lib/supabaseClient';

export interface CompanyConfig {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyConfigResponse {
  data: CompanyConfig | CompanyConfig[] | null;
  error: string | null;
}

export interface UpdateCompanyConfigData {
  key: string;
  value?: any;
  is_enabled?: boolean;
  description?: string;
  category?: string;
}

/**
 * Get all company configuration settings
 */
export const getCompanyConfig = async (): Promise<CompanyConfigResponse> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

    if (error) {
      console.error('Error fetching company config:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch company configuration',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching company config:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching company configuration',
    };
  }
};

/**
 * Get a specific company configuration setting by key
 */
export const getCompanyConfigByKey = async (key: string): Promise<CompanyConfigResponse> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      console.error('Error fetching company config by key:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch company configuration',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching company config by key:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching company configuration',
    };
  }
};

/**
 * Update a company configuration setting
 */
export const updateCompanyConfig = async (
  key: string,
  updates: Partial<Omit<CompanyConfig, 'id' | 'key' | 'created_at' | 'updated_at'>>,
): Promise<CompanyConfigResponse> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .update(updates)
      .eq('key', key)
      .select()
      .single();

    if (error) {
      console.error('Error updating company config:', error);
      return {
        data: null,
        error: error.message || 'Failed to update company configuration',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating company config:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating company configuration',
    };
  }
};

/**
 * Create a new company configuration setting
 */
export const createCompanyConfig = async (
  configData: Omit<CompanyConfig, 'id' | 'created_at' | 'updated_at'>,
): Promise<CompanyConfigResponse> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .insert([configData])
      .select()
      .single();

    if (error) {
      console.error('Error creating company config:', error);
      return {
        data: null,
        error: error.message || 'Failed to create company configuration',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating company config:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating company configuration',
    };
  }
};

/**
 * Delete a company configuration setting
 */
export const deleteCompanyConfig = async (key: string): Promise<CompanyConfigResponse> => {
  try {
    const { error } = await supabase.from('company_config').delete().eq('key', key);

    if (error) {
      console.error('Error deleting company config:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete company configuration',
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting company config:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting company configuration',
    };
  }
};

/**
 * Get Zapier integration configuration
 */
export const getZapierConfig = async (): Promise<{ enabled: boolean; config: any } | null> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('is_enabled, value')
      .eq('key', 'zapier_integration')
      .single();

    if (error || !data) {
      console.warn('Zapier config not found:', error);
      return null;
    }

    return {
      enabled: data.is_enabled,
      config: data.value,
    };
  } catch (error) {
    console.error('Error fetching Zapier config:', error);
    return null;
  }
};

/**
 * Get Tasker integration configuration
 */
export const getTaskerConfig = async (): Promise<{ enabled: boolean; config: any } | null> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('is_enabled, value')
      .eq('key', 'tasker_integration')
      .single();

    if (error || !data) {
      console.warn('Tasker config not found:', error);
      return null;
    }

    return {
      enabled: data.is_enabled,
      config: data.value,
    };
  } catch (error) {
    console.error('Error fetching Tasker config:', error);
    return null;
  }
};

/**
 * Enable/Disable Zapier integration
 */
export const toggleZapierIntegration = async (enabled: boolean): Promise<CompanyConfigResponse> => {
  return updateCompanyConfig('zapier_integration', { is_enabled: enabled });
};

/**
 * Enable/Disable Tasker integration
 */
export const toggleTaskerIntegration = async (enabled: boolean): Promise<CompanyConfigResponse> => {
  return updateCompanyConfig('tasker_integration', { is_enabled: enabled });
};

/**
 * Update Zapier configuration
 */
export const updateZapierConfig = async (config: {
  webhook_url?: string;
  api_key?: string;
  enabled_events?: string[];
}): Promise<CompanyConfigResponse> => {
  try {
    // First get current config
    const currentConfig = await getZapierConfig();
    const currentValue = currentConfig?.config || {};

    // Merge with new config
    const updatedValue = {
      ...currentValue,
      ...config,
    };

    return updateCompanyConfig('zapier_integration', { value: updatedValue });
  } catch (error) {
    console.error('Error updating Zapier config:', error);
    return {
      data: null,
      error: 'Failed to update Zapier configuration',
    };
  }
};

/**
 * Update Tasker configuration
 */
export const updateTaskerConfig = async (config: {
  webhook_url?: string;
  api_key?: string;
  enabled_events?: string[];
}): Promise<CompanyConfigResponse> => {
  try {
    // First get current config
    const currentConfig = await getTaskerConfig();
    const currentValue = currentConfig?.config || {};

    // Merge with new config
    const updatedValue = {
      ...currentValue,
      ...config,
    };

    return updateCompanyConfig('tasker_integration', { value: updatedValue });
  } catch (error) {
    console.error('Error updating Tasker config:', error);
    return {
      data: null,
      error: 'Failed to update Tasker configuration',
    };
  }
};
