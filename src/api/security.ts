import { supabase } from '@/lib/supabaseClient';
import CryptoJS from 'crypto-js';

// Security types
export interface ApiKey {
  id: string;
  company_id: string;
  service: string;
  key_encrypted: string;
  last_used: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface SecuritySetting {
  id: string;
  company_id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyResponse {
  data: ApiKey | ApiKey[] | null;
  error: string | null;
}

export interface AuditLogResponse {
  data: AuditLog | AuditLog[] | null;
  error: string | null;
}

export interface SecuritySettingResponse {
  data: SecuritySetting | SecuritySetting[] | null;
  error: string | null;
}

export interface AddApiKeyData {
  companyId: string;
  service: string;
  apiKey: string;
}

export interface MaskedApiKey {
  id: string;
  service: string;
  masked_key: string;
  last_used: string | null;
  created_at: string;
}

// Encryption utilities
const ENCRYPTION_KEY =
  import.meta.env.VITE_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Encrypt an API key using AES encryption
 */
export const encryptApiKey = (apiKey: string): string => {
  try {
    return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Error encrypting API key:', error);
    throw new Error('Failed to encrypt API key');
  }
};

/**
 * Decrypt an API key using AES decryption
 */
export const decryptApiKey = (encryptedKey: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting API key:', error);
    throw new Error('Failed to decrypt API key');
  }
};

/**
 * Mask an API key for display (show only last 4 characters)
 */
export const maskApiKey = (apiKey: string): string => {
  if (apiKey.length <= 8) return '****';
  return `****${apiKey.slice(-4)}`;
};

/**
 * Get masked API keys for a company
 */
export const getApiKeys = async (
  companyId: string,
): Promise<{ data: MaskedApiKey[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch API keys',
      };
    }

    // Mask the keys for display
    const maskedData = (data || []).map((key: ApiKey) => ({
      id: key.id,
      service: key.service,
      masked_key: maskApiKey(decryptApiKey(key.key_encrypted)),
      last_used: key.last_used,
      created_at: key.created_at,
    }));

    return {
      data: maskedData,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching API keys:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching API keys',
    };
  }
};

/**
 * Add a new API key (encrypts before storing)
 */
export const addApiKey = async (data: AddApiKeyData): Promise<ApiKeyResponse> => {
  try {
    const encryptedKey = encryptApiKey(data.apiKey);

    const { data: result, error } = await supabase
      .from('api_keys')
      .insert({
        company_id: data.companyId,
        service: data.service,
        key_encrypted: encryptedKey,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding API key:', error);
      return {
        data: null,
        error: error.message || 'Failed to add API key',
      };
    }

    // Log the audit event
    await logAudit(result.id, 'create_api_key', `api_key:${data.service}`, {
      service: data.service,
      masked_key: maskApiKey(data.apiKey),
    });

    return {
      data: result,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error adding API key:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while adding API key',
    };
  }
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (id: string): Promise<ApiKeyResponse> => {
  try {
    // First get the key details for audit logging
    const { data: keyData } = await supabase.from('api_keys').select('*').eq('id', id).single();

    const { error } = await supabase.from('api_keys').delete().eq('id', id);

    if (error) {
      console.error('Error deleting API key:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete API key',
      };
    }

    // Log the audit event
    if (keyData) {
      await logAudit(id, 'delete_api_key', `api_key:${keyData.service}`, {
        service: keyData.service,
      });
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting API key:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting API key',
    };
  }
};

/**
 * Get decrypted API key for use (internal function)
 */
export const getDecryptedApiKey = async (
  companyId: string,
  service: string,
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key_encrypted, id')
      .eq('company_id', companyId)
      .eq('service', service)
      .single();

    if (error || !data) {
      console.error('Error fetching API key:', error);
      return null;
    }

    // Update last_used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', data.id);

    // Log the usage
    await logAudit(data.id, 'use_api_key', `api_key:${service}`, {
      service,
      action: 'decrypted_for_use',
    });

    return decryptApiKey(data.key_encrypted);
  } catch (error) {
    console.error('Error getting decrypted API key:', error);
    return null;
  }
};

/**
 * Log an audit event
 */
export const logAudit = async (
  actorId: string,
  action: string,
  target: string,
  details?: Record<string, any>,
): Promise<AuditLogResponse> => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: actorId,
        action,
        target,
        details: details || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging audit event:', error);
      return {
        data: null,
        error: error.message || 'Failed to log audit event',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error logging audit event:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while logging audit event',
    };
  }
};

/**
 * Get audit logs for a company
 */
export const getAuditLogs = async (
  companyId: string,
  limit: number = 100,
): Promise<AuditLogResponse> => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(
        `
        *,
        users:actor_id (
          email
        )
      `,
      )
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch audit logs',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching audit logs:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching audit logs',
    };
  }
};

/**
 * Get security settings for a company
 */
export const getSecuritySettings = async (companyId: string): Promise<SecuritySettingResponse> => {
  try {
    const { data, error } = await supabase
      .from('security_settings')
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching security settings:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch security settings',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching security settings:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching security settings',
    };
  }
};

/**
 * Update security setting
 */
export const updateSecuritySetting = async (
  companyId: string,
  settingKey: string,
  settingValue: any,
): Promise<SecuritySettingResponse> => {
  try {
    const { data, error } = await supabase
      .from('security_settings')
      .upsert({
        company_id: companyId,
        setting_key: settingKey,
        setting_value: settingValue,
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating security setting:', error);
      return {
        data: null,
        error: error.message || 'Failed to update security setting',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating security setting:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating security setting',
    };
  }
};

/**
 * Get API key for a specific service (convenience function)
 */
export const getServiceApiKey = async (
  companyId: string,
  service: string,
): Promise<string | null> => {
  return getDecryptedApiKey(companyId, service);
};

/**
 * Validate API key format (basic validation)
 */
export const validateApiKeyFormat = (service: string, apiKey: string): boolean => {
  const patterns: Record<string, RegExp> = {
    openai: /^sk-[a-zA-Z0-9]{48}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9_-]{95,100}$/,
    stripe: /^sk_(test|live)_[a-zA-Z0-9]{24}$/,
    elevenlabs: /^[a-zA-Z0-9]{32}$/,
    stability: /^sk-[a-zA-Z0-9]{48}$/,
    heygen: /^[a-zA-Z0-9_-]{40,}$/,
    'google-gemini': /^[a-zA-Z0-9_-]{39}$/,
    notion: /^secret_[a-zA-Z0-9]{43}$/,
    drive: /^[a-zA-Z0-9_-]{44}$/,
  };

  const pattern = patterns[service];
  return pattern ? pattern.test(apiKey) : true; // Allow unknown services
};
