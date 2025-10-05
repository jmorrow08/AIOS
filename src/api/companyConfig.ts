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

/**
 * Get Slack integration configuration
 */
export const getSlackConfig = async (): Promise<{ enabled: boolean; config: any } | null> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('is_enabled, value')
      .eq('key', 'slack_integration')
      .single();

    if (error || !data) {
      console.warn('Slack config not found:', error);
      return null;
    }

    return {
      enabled: data.is_enabled,
      config: data.value,
    };
  } catch (error) {
    console.error('Error fetching Slack config:', error);
    return null;
  }
};

/**
 * Get Discord integration configuration
 */
export const getDiscordConfig = async (): Promise<{ enabled: boolean; config: any } | null> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('is_enabled, value')
      .eq('key', 'discord_integration')
      .single();

    if (error || !data) {
      console.warn('Discord config not found:', error);
      return null;
    }

    return {
      enabled: data.is_enabled,
      config: data.value,
    };
  } catch (error) {
    console.error('Error fetching Discord config:', error);
    return null;
  }
};

/**
 * Get Email integration configuration
 */
export const getEmailConfig = async (): Promise<{ enabled: boolean; config: any } | null> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('is_enabled, value')
      .eq('key', 'email_integration')
      .single();

    if (error || !data) {
      console.warn('Email config not found:', error);
      return null;
    }

    return {
      enabled: data.is_enabled,
      config: data.value,
    };
  } catch (error) {
    console.error('Error fetching Email config:', error);
    return null;
  }
};

/**
 * Get SMS integration configuration
 */
export const getSmsConfig = async (): Promise<{ enabled: boolean; config: any } | null> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('is_enabled, value')
      .eq('key', 'sms_integration')
      .single();

    if (error || !data) {
      console.warn('SMS config not found:', error);
      return null;
    }

    return {
      enabled: data.is_enabled,
      config: data.value,
    };
  } catch (error) {
    console.error('Error fetching SMS config:', error);
    return null;
  }
};

/**
 * Enable/Disable Slack integration
 */
export const toggleSlackIntegration = async (enabled: boolean): Promise<CompanyConfigResponse> => {
  return updateCompanyConfig('slack_integration', { is_enabled: enabled });
};

/**
 * Enable/Disable Discord integration
 */
export const toggleDiscordIntegration = async (
  enabled: boolean,
): Promise<CompanyConfigResponse> => {
  return updateCompanyConfig('discord_integration', { is_enabled: enabled });
};

/**
 * Enable/Disable Email integration
 */
export const toggleEmailIntegration = async (enabled: boolean): Promise<CompanyConfigResponse> => {
  return updateCompanyConfig('email_integration', { is_enabled: enabled });
};

/**
 * Enable/Disable SMS integration
 */
export const toggleSmsIntegration = async (enabled: boolean): Promise<CompanyConfigResponse> => {
  return updateCompanyConfig('sms_integration', { is_enabled: enabled });
};

/**
 * Update Slack configuration
 */
export const updateSlackConfig = async (config: {
  webhook_url?: string;
  channel?: string;
  enabled_events?: string[];
  mention_users?: string[];
}): Promise<CompanyConfigResponse> => {
  try {
    // First get current config
    const currentConfig = await getSlackConfig();
    const currentValue = currentConfig?.config || {};

    // Merge with new config
    const updatedValue = {
      ...currentValue,
      ...config,
    };

    return updateCompanyConfig('slack_integration', { value: updatedValue });
  } catch (error) {
    console.error('Error updating Slack config:', error);
    return {
      data: null,
      error: 'Failed to update Slack configuration',
    };
  }
};

/**
 * Update Discord configuration
 */
export const updateDiscordConfig = async (config: {
  webhook_url?: string;
  username?: string;
  avatar_url?: string;
  enabled_events?: string[];
}): Promise<CompanyConfigResponse> => {
  try {
    // First get current config
    const currentConfig = await getDiscordConfig();
    const currentValue = currentConfig?.config || {};

    // Merge with new config
    const updatedValue = {
      ...currentValue,
      ...config,
    };

    return updateCompanyConfig('discord_integration', { value: updatedValue });
  } catch (error) {
    console.error('Error updating Discord config:', error);
    return {
      data: null,
      error: 'Failed to update Discord configuration',
    };
  }
};

/**
 * Update Email configuration
 */
export const updateEmailConfig = async (config: {
  provider?: string;
  api_key?: string;
  from_email?: string;
  from_name?: string;
  enabled_events?: string[];
  template_ids?: Record<string, string>;
}): Promise<CompanyConfigResponse> => {
  try {
    // First get current config
    const currentConfig = await getEmailConfig();
    const currentValue = currentConfig?.config || {};

    // Merge with new config
    const updatedValue = {
      ...currentValue,
      ...config,
    };

    return updateCompanyConfig('email_integration', { value: updatedValue });
  } catch (error) {
    console.error('Error updating Email config:', error);
    return {
      data: null,
      error: 'Failed to update Email configuration',
    };
  }
};

/**
 * Update SMS configuration
 */
export const updateSmsConfig = async (config: {
  provider?: string;
  api_key?: string;
  account_sid?: string;
  phone_number?: string;
  enabled_events?: string[];
  country_codes?: string[];
}): Promise<CompanyConfigResponse> => {
  try {
    // First get current config
    const currentConfig = await getSmsConfig();
    const currentValue = currentConfig?.config || {};

    // Merge with new config
    const updatedValue = {
      ...currentValue,
      ...config,
    };

    return updateCompanyConfig('sms_integration', { value: updatedValue });
  } catch (error) {
    console.error('Error updating SMS config:', error);
    return {
      data: null,
      error: 'Failed to update SMS configuration',
    };
  }
};
