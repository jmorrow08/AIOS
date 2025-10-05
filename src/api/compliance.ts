import { supabase } from '@/lib/supabaseClient';
import { logAudit } from './security';

// Compliance types
export interface SecurityPolicy {
  id: string;
  company_id: string;
  enforce_2fa: boolean;
  ip_allowlist: string[]; // Array of CIDR/IPs
  key_rotation_days: number;
  data_retention_days: number;
  gdpr_request_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRequest {
  id: string;
  company_id: string;
  user_id: string;
  request_type: 'export_data' | 'delete_data' | 'access_data';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  request_reason?: string;
  completion_notes?: string;
  requested_at: string;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DataRetentionLog {
  id: string;
  company_id: string;
  data_category: string;
  record_count: number;
  oldest_record?: string;
  newest_record?: string;
  retention_days: number;
  last_cleanup?: string;
  next_cleanup?: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityPolicyResponse {
  data: SecurityPolicy | null;
  error: string | null;
}

export interface ComplianceRequestResponse {
  data: ComplianceRequest | ComplianceRequest[] | null;
  error: string | null;
}

export interface DataRetentionResponse {
  data: DataRetentionLog | DataRetentionLog[] | null;
  error: string | null;
}

export interface UpdateSecurityPolicyData {
  enforce_2fa?: boolean;
  ip_allowlist?: string[];
  key_rotation_days?: number;
  data_retention_days?: number;
  gdpr_request_enabled?: boolean;
}

export interface CreateComplianceRequestData {
  request_type: 'export_data' | 'delete_data' | 'access_data';
  request_reason?: string;
}

/**
 * Get security policies for a company
 */
export const getSecurityPolicies = async (companyId: string): Promise<SecurityPolicyResponse> => {
  try {
    const { data, error } = await supabase
      .from('security_policies')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching security policies:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch security policies',
      };
    }

    return {
      data: data || null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching security policies:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching security policies',
    };
  }
};

/**
 * Update security policies for a company
 */
export const updateSecurityPolicies = async (
  companyId: string,
  policies: UpdateSecurityPolicyData,
): Promise<SecurityPolicyResponse> => {
  try {
    const { data, error } = await supabase
      .from('security_policies')
      .upsert({
        company_id: companyId,
        ...policies,
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating security policies:', error);
      return {
        data: null,
        error: error.message || 'Failed to update security policies',
      };
    }

    // Log the audit event
    await logAudit(data.id, 'system_access', `security_policies:${companyId}`, {
      action: 'update_policies',
      policies_updated: Object.keys(policies),
    });

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating security policies:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating security policies',
    };
  }
};

/**
 * Check and enforce key rotation for a company
 */
export const enforceKeyRotation = async (
  companyId: string,
): Promise<{ flaggedKeys: string[]; error: string | null }> => {
  try {
    // Get security policies
    const { data: policies, error: policyError } = await getSecurityPolicies(companyId);
    if (policyError || !policies) {
      return {
        flaggedKeys: [],
        error: policyError || 'No security policies found',
      };
    }

    const rotationDays = policies.key_rotation_days;

    // Get API keys older than rotation period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rotationDays);

    const { data: oldKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('id, service, created_at')
      .eq('company_id', companyId)
      .lt('created_at', cutoffDate.toISOString());

    if (keysError) {
      console.error('Error fetching old API keys:', keysError);
      return {
        flaggedKeys: [],
        error: keysError.message || 'Failed to fetch API keys for rotation check',
      };
    }

    const flaggedKeys = (oldKeys || []).map((key) => key.id);

    // Log the rotation check
    await logAudit('system', 'system_access', `key_rotation_check:${companyId}`, {
      rotation_days: rotationDays,
      flagged_keys_count: flaggedKeys.length,
      cutoff_date: cutoffDate.toISOString(),
    });

    return {
      flaggedKeys,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error enforcing key rotation:', error);
    return {
      flaggedKeys: [],
      error: 'An unexpected error occurred while checking key rotation',
    };
  }
};

/**
 * Apply IP restrictions for login
 */
export const applyIPRestrictions = async (
  userId: string,
  requestIp: string,
): Promise<{ allowed: boolean; error: string | null }> => {
  try {
    // Get user's company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return {
        allowed: false,
        error: userError?.message || 'User not found',
      };
    }

    // Get security policies
    const { data: policies, error: policyError } = await getSecurityPolicies(userData.company_id);
    if (policyError || !policies) {
      // If no policies, allow by default
      return { allowed: true, error: null };
    }

    // Check if IP is in allowlist
    const ipAllowlist = policies.ip_allowlist || [];
    const isAllowed = ipAllowlist.some((allowedIp) => {
      if (allowedIp.includes('/')) {
        // CIDR notation - for simplicity, we'll do exact match for now
        // In production, you'd want proper CIDR validation
        return requestIp === allowedIp.split('/')[0];
      }
      return requestIp === allowedIp;
    });

    // Log the IP check
    await logAudit(userId, 'login', `ip_check:${requestIp}`, {
      allowed: isAllowed,
      ip_allowlist: ipAllowlist,
      request_ip: requestIp,
    });

    return {
      allowed: isAllowed,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error applying IP restrictions:', error);
    return {
      allowed: false,
      error: 'An unexpected error occurred while checking IP restrictions',
    };
  }
};

/**
 * Process data retention cleanup
 */
export const processDataRetention = async (
  companyId: string,
): Promise<{ processed: boolean; error: string | null }> => {
  try {
    // Get security policies
    const { data: policies, error: policyError } = await getSecurityPolicies(companyId);
    if (policyError || !policies) {
      return {
        processed: false,
        error: policyError || 'No security policies found',
      };
    }

    const retentionDays = policies.data_retention_days;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Define data categories to clean up
    const dataCategories = [
      { table: 'audit_logs', category: 'logs' },
      { table: 'collab_messages', category: 'messages' },
      { table: 'activity_log', category: 'activity' },
      { table: 'notifications', category: 'notifications' },
    ];

    let totalDeleted = 0;

    for (const category of dataCategories) {
      try {
        // Count records before deletion
        const { count: beforeCount } = await supabase
          .from(category.table)
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .lt('created_at', cutoffDate.toISOString());

        // Delete old records
        const { error: deleteError } = await supabase
          .from(category.table)
          .delete()
          .eq('company_id', companyId)
          .lt('created_at', cutoffDate.toISOString());

        if (deleteError) {
          console.error(`Error deleting old ${category.category}:`, deleteError);
          continue;
        }

        // Update data retention log
        await supabase.from('data_retention_logs').upsert({
          company_id: companyId,
          data_category: category.category,
          record_count: beforeCount || 0,
          retention_days: retentionDays,
          last_cleanup: new Date().toISOString(),
          next_cleanup: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        });

        totalDeleted += beforeCount || 0;
      } catch (error) {
        console.error(`Error processing ${category.category} retention:`, error);
      }
    }

    // Log the retention processing
    await logAudit('system', 'system_access', `data_retention:${companyId}`, {
      retention_days: retentionDays,
      cutoff_date: cutoffDate.toISOString(),
      records_deleted: totalDeleted,
    });

    return {
      processed: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error processing data retention:', error);
    return {
      processed: false,
      error: 'An unexpected error occurred while processing data retention',
    };
  }
};

/**
 * Log a compliance event (uses existing audit_logs)
 */
export const logComplianceEvent = async (
  actorId: string,
  action: string,
  target: string,
  details?: Record<string, any>,
): Promise<{ logged: boolean; error: string | null }> => {
  try {
    const result = await logAudit(actorId, action as any, target, details);
    return {
      logged: !result.error,
      error: result.error,
    };
  } catch (error) {
    console.error('Error logging compliance event:', error);
    return {
      logged: false,
      error: 'Failed to log compliance event',
    };
  }
};

/**
 * Create a compliance request (GDPR/CCPA)
 */
export const createComplianceRequest = async (
  companyId: string,
  userId: string,
  requestData: CreateComplianceRequestData,
): Promise<ComplianceRequestResponse> => {
  try {
    const { data, error } = await supabase
      .from('compliance_requests')
      .insert({
        company_id: companyId,
        user_id: userId,
        ...requestData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating compliance request:', error);
      return {
        data: null,
        error: error.message || 'Failed to create compliance request',
      };
    }

    // Log the compliance request
    await logComplianceEvent(userId, 'system_access', `compliance_request:${data.id}`, {
      request_type: requestData.request_type,
      reason: requestData.request_reason,
    });

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating compliance request:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating compliance request',
    };
  }
};

/**
 * Get compliance requests for a user
 */
export const getComplianceRequests = async (
  userId: string,
  limit: number = 50,
): Promise<ComplianceRequestResponse> => {
  try {
    const { data, error } = await supabase
      .from('compliance_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching compliance requests:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch compliance requests',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching compliance requests:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching compliance requests',
    };
  }
};

/**
 * Get data retention logs for a company
 */
export const getDataRetentionLogs = async (companyId: string): Promise<DataRetentionResponse> => {
  try {
    const { data, error } = await supabase
      .from('data_retention_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data retention logs:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch data retention logs',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching data retention logs:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching data retention logs',
    };
  }
};

/**
 * Validate IP address format
 */
export const validateIPAddress = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

  if (cidrRegex.test(ip)) {
    const [ipPart, mask] = ip.split('/');
    const maskNum = parseInt(mask);
    return maskNum >= 0 && maskNum <= 32 && validateIPAddress(ipPart);
  }

  if (!ipv4Regex.test(ip)) return false;

  const parts = ip.split('.');
  return parts.every((part) => {
    const num = parseInt(part);
    return num >= 0 && num <= 255;
  });
};
