import { supabase } from '@/lib/supabaseClient';

export interface LogEntry {
  id: string;
  agent_id?: string;
  agent_name?: string;
  input?: string;
  output?: string;
  description?: string;
  category?: 'client' | 'invoice' | 'job' | 'media' | 'agent' | 'document' | 'system';
  severity?: 'info' | 'warning' | 'error' | 'critical';
  status?: 'success' | 'failed' | 'pending';
  timestamp: string;
  metadata?: any;
  source: 'activity_log' | 'agent_logs';
}

export interface SystemHealthData {
  apiUptime: {
    openai: boolean;
    supabase: boolean;
    elevenlabs: boolean;
    stability: boolean;
    heygen: boolean;
  };
  agentStats: {
    totalAgents: number;
    activeAgents: number;
    successRate: number;
    failureRate: number;
    averageResponseTime: number;
  };
  systemStats: {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    recentActivity: number;
  };
}

export interface DevPortalSettings {
  safeMode: boolean;
  debugMode: boolean;
}

/**
 * Fetch combined logs from activity_log and agent_logs tables
 */
export const getSystemLogs = async (
  limit: number = 50,
  filters?: {
    agentId?: string;
    category?: string;
    severity?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<{ data: LogEntry[] | null; error: string | null }> => {
  try {
    // Build query for agent_logs
    let agentLogsQuery = supabase
      .from('agent_logs')
      .select(
        `
        id,
        agent_id,
        input,
        output,
        created_at,
        ai_agents!inner(name)
      `,
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (filters?.agentId) {
      agentLogsQuery = agentLogsQuery.eq('agent_id', filters.agentId);
    }
    if (filters?.dateFrom) {
      agentLogsQuery = agentLogsQuery.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      agentLogsQuery = agentLogsQuery.lte('created_at', filters.dateTo);
    }

    // Build query for activity_log
    let activityLogsQuery = supabase
      .from('activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    // Apply filters
    if (filters?.category) {
      activityLogsQuery = activityLogsQuery.eq('category', filters.category);
    }
    if (filters?.dateFrom) {
      activityLogsQuery = activityLogsQuery.gte('timestamp', filters.dateFrom);
    }
    if (filters?.dateTo) {
      activityLogsQuery = activityLogsQuery.lte('timestamp', filters.dateTo);
    }

    // Execute both queries
    const [agentLogsResult, activityLogsResult] = await Promise.all([
      agentLogsQuery,
      activityLogsQuery,
    ]);

    if (agentLogsResult.error) {
      console.error('Error fetching agent logs:', agentLogsResult.error);
      return { data: null, error: agentLogsResult.error.message };
    }

    if (activityLogsResult.error) {
      console.error('Error fetching activity logs:', activityLogsResult.error);
      return { data: null, error: activityLogsResult.error.message };
    }

    // Transform agent logs
    const transformedAgentLogs: LogEntry[] = (agentLogsResult.data || []).map((log) => ({
      id: log.id,
      agent_id: log.agent_id,
      agent_name: log.ai_agents?.name || 'Unknown Agent',
      input: log.input,
      output: log.output,
      timestamp: log.created_at,
      source: 'agent_logs' as const,
      severity: log.output?.toLowerCase().includes('error') ? 'error' : 'info',
      status: log.output?.toLowerCase().includes('failed') ? 'failed' : 'success',
    }));

    // Transform activity logs
    const transformedActivityLogs: LogEntry[] = (activityLogsResult.data || []).map((log) => ({
      id: log.id,
      description: log.description,
      category: log.category,
      timestamp: log.timestamp,
      metadata: log.metadata,
      source: 'activity_log' as const,
      severity: log.category === 'system' ? 'warning' : 'info',
      status: 'success', // Activity logs are typically successful events
    }));

    // Combine and sort by timestamp
    const combinedLogs = [...transformedAgentLogs, ...transformedActivityLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return { data: combinedLogs, error: null };
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return {
      data: null,
      error: 'Failed to fetch system logs',
    };
  }
};

/**
 * Get system health data
 */
export const getSystemHealth = async (): Promise<{
  data: SystemHealthData | null;
  error: string | null;
}> => {
  try {
    // Parallel queries for health data
    const [agentsResult, agentLogsResult, activityLogsResult, recentActivityResult] =
      await Promise.all([
        // Get agent counts
        supabase.from('ai_agents').select('id, is_active', { count: 'exact' }),

        // Get agent logs for success/failure rates
        supabase
          .from('agent_logs')
          .select('output, created_at')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()), // Last 24 hours

        // Get activity logs for system stats
        supabase
          .from('activity_log')
          .select('category, timestamp')
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

        // Get recent activity count
        supabase
          .from('activity_log')
          .select('id', { count: 'exact', head: true })
          .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()), // Last hour
      ]);

    // Process results
    const totalAgents = agentsResult.count || 0;
    const activeAgents = agentsResult.data?.filter((agent) => agent.is_active).length || 0;

    const agentLogs = agentLogsResult.data || [];
    const successCount = agentLogs.filter(
      (log) =>
        log.output &&
        !log.output.toLowerCase().includes('error') &&
        !log.output.toLowerCase().includes('failed'),
    ).length;
    const failureCount = agentLogs.filter(
      (log) =>
        log.output &&
        (log.output.toLowerCase().includes('error') || log.output.toLowerCase().includes('failed')),
    ).length;
    const successRate = agentLogs.length > 0 ? (successCount / agentLogs.length) * 100 : 0;
    const failureRate = agentLogs.length > 0 ? (failureCount / agentLogs.length) * 100 : 0;

    const activityLogs = activityLogsResult.data || [];
    const errorCount = activityLogs.filter((log) => log.category === 'system').length;
    const warningCount = activityLogs.filter((log) =>
      ['agent', 'system'].includes(log.category || ''),
    ).length;

    const recentActivity = recentActivityResult.count || 0;

    // Simple uptime checks (ping basic endpoints)
    const apiUptime = await checkApiUptime();

    const healthData: SystemHealthData = {
      apiUptime,
      agentStats: {
        totalAgents,
        activeAgents,
        successRate,
        failureRate,
        averageResponseTime: 2.3, // Mock value - would need actual timing data
      },
      systemStats: {
        totalLogs: activityLogs.length + agentLogs.length,
        errorCount,
        warningCount,
        recentActivity,
      },
    };

    return { data: healthData, error: null };
  } catch (error) {
    console.error('Error fetching system health:', error);
    return {
      data: null,
      error: 'Failed to fetch system health data',
    };
  }
};

/**
 * Check API uptime by making simple requests
 */
const checkApiUptime = async (): Promise<SystemHealthData['apiUptime']> => {
  const uptime: SystemHealthData['apiUptime'] = {
    openai: false,
    supabase: false,
    elevenlabs: false,
    stability: false,
    heygen: false,
  };

  try {
    // Supabase check
    const { data: healthData, error } = await supabase.from('companies').select('id').limit(1);
    uptime.supabase = !error && healthData !== null;
  } catch (err) {
    console.error('Supabase health check failed:', err);
  }

  // For other APIs, we'll use mock data since we don't want to make actual API calls
  // In production, you'd implement actual health checks
  uptime.openai = true; // Mock
  uptime.elevenlabs = true; // Mock
  uptime.stability = true; // Mock
  uptime.heygen = true; // Mock

  return uptime;
};

/**
 * Get dev portal settings
 */
export const getDevPortalSettings = async (): Promise<{
  data: DevPortalSettings | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('key, value')
      .in('key', ['safe_mode', 'debug_mode']);

    if (error) {
      console.error('Error fetching dev portal settings:', error);
      return { data: null, error: error.message };
    }

    const settings: DevPortalSettings = {
      safeMode: false,
      debugMode: false,
    };

    // Parse the key-value pairs
    data?.forEach((config) => {
      if (config.key === 'safe_mode') {
        settings.safeMode = config.value === 'true' || config.value === true;
      } else if (config.key === 'debug_mode') {
        settings.debugMode = config.value === 'true' || config.value === true;
      }
    });

    return { data: settings, error: null };
  } catch (error) {
    console.error('Error fetching dev portal settings:', error);
    return {
      data: null,
      error: 'Failed to fetch dev portal settings',
    };
  }
};

/**
 * Update dev portal settings
 */
export const updateDevPortalSettings = async (
  settings: DevPortalSettings,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Update safe_mode setting
    const { error: safeModeError } = await supabase.from('company_config').upsert(
      {
        key: 'safe_mode',
        value: settings.safeMode,
        description: 'Enable safe mode to force GPT-3.5 for all AI requests',
        category: 'system',
        is_enabled: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'key',
      },
    );

    if (safeModeError) {
      console.error('Error updating safe mode setting:', safeModeError);
      return { success: false, error: safeModeError.message };
    }

    // Update debug_mode setting
    const { error: debugModeError } = await supabase.from('company_config').upsert(
      {
        key: 'debug_mode',
        value: settings.debugMode,
        description: 'Enable debug mode for verbose agent logging',
        category: 'system',
        is_enabled: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'key',
      },
    );

    if (debugModeError) {
      console.error('Error updating debug mode setting:', debugModeError);
      return { success: false, error: debugModeError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating dev portal settings:', error);
    return {
      success: false,
      error: 'Failed to update dev portal settings',
    };
  }
};
