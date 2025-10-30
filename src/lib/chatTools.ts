import { supabase } from './supabaseClient';
import { logActivity } from '@/api/dashboard';

export interface ChatTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any) => Promise<{ success: boolean; result: any; message: string }>;
}

export interface ToolCall {
  tool: string;
  parameters: any;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

/**
 * Database description tool - shows available tables and their schemas
 */
const describeDatabase: ChatTool = {
  name: 'db.describe',
  description: 'Get information about available database tables and their schemas',
  parameters: {
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'Optional: specific table name to describe',
      },
    },
  },
  execute: async ({ table }) => {
    try {
      // Get list of tables from information_schema (read-only)
      let query = supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public');

      if (table) {
        query = query.eq('table_name', table);
      }

      const { data: tables, error } = await query;

      if (error) {
        return {
          success: false,
          result: null,
          message: `Error fetching table information: ${error.message}`,
        };
      }

      if (!tables || tables.length === 0) {
        return {
          success: true,
          result: [],
          message: table ? `Table '${table}' not found or not accessible` : 'No tables found',
        };
      }

      // Get column information for each table
      const tableDetails = [];
      for (const tableInfo of tables) {
        try {
          const { data: columns, error: colError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_schema', 'public')
            .eq('table_name', tableInfo.table_name)
            .order('ordinal_position');

          if (!colError && columns) {
            tableDetails.push({
              table: tableInfo.table_name,
              columns: columns.map((col) => ({
                name: col.column_name,
                type: col.data_type,
                nullable: col.is_nullable === 'YES',
                default: col.column_default,
              })),
            });
          }
        } catch (err) {
          // Skip tables we can't access
          continue;
        }
      }

      return {
        success: true,
        result: tableDetails,
        message: `Found ${tableDetails.length} accessible table(s)`,
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        message: `Database description failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  },
};

/**
 * Database query tool - execute read-only SQL queries
 */
const queryDatabase: ChatTool = {
  name: 'db.query',
  description: 'Execute a read-only SQL query on the database (SELECT only)',
  parameters: {
    type: 'object',
    properties: {
      sql: {
        type: 'string',
        description: 'SQL query to execute (must be SELECT statement)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of rows to return (default: 100)',
        default: 100,
      },
    },
    required: ['sql'],
  },
  execute: async ({ sql, limit = 100 }) => {
    try {
      // Basic validation - only allow SELECT statements
      const normalizedSql = sql.trim().toUpperCase();
      if (!normalizedSql.startsWith('SELECT')) {
        return {
          success: false,
          result: null,
          message: 'Only SELECT queries are allowed for security reasons',
        };
      }

      // Prevent dangerous operations
      const forbiddenPatterns = [
        /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b/i,
        /\b(EXEC|EXECUTE)\b/i,
        /;\s*(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)/i,
      ];

      for (const pattern of forbiddenPatterns) {
        if (pattern.test(sql)) {
          return {
            success: false,
            result: null,
            message: 'Query contains forbidden operations. Only SELECT statements are allowed.',
          };
        }
      }

      // Use Supabase RPC for safe query execution
      const { data, error } = await supabase.rpc('execute_read_query', {
        query_text: sql,
        row_limit: Math.min(limit, 1000), // Max 1000 rows
      });

      if (error) {
        return {
          success: false,
          result: null,
          message: `Query execution failed: ${error.message}`,
        };
      }

      return {
        success: true,
        result: data,
        message: `Query executed successfully. Returned ${
          Array.isArray(data) ? data.length : 1
        } row(s).`,
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        message: `Query execution failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  },
};

/**
 * Settings get tool - retrieve setting values
 */
const getSetting: ChatTool = {
  name: 'settings.get',
  description: 'Get the value of a specific setting',
  parameters: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Setting key to retrieve',
      },
    },
    required: ['key'],
  },
  execute: async ({ key }) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value, description, category')
        .eq('key', key)
        .single();

      if (error) {
        return {
          success: false,
          result: null,
          message: `Setting '${key}' not found or not accessible`,
        };
      }

      return {
        success: true,
        result: {
          key: data.key,
          value: data.value,
          description: data.description,
          category: data.category,
        },
        message: `Retrieved setting '${key}'`,
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        message: `Failed to get setting: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  },
};

/**
 * Settings set tool - propose setting changes (requires confirmation)
 */
const setSetting: ChatTool = {
  name: 'settings.set',
  description: 'Propose a setting change (requires user confirmation)',
  parameters: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Setting key to change',
      },
      value: {
        type: 'string',
        description: 'New value for the setting',
      },
      category: {
        type: 'string',
        description: 'Setting category (optional)',
        default: 'general',
      },
    },
    required: ['key', 'value'],
  },
  execute: async ({ key, value, category = 'general' }) => {
    try {
      // Get current setting to show diff
      const { data: currentSetting } = await supabase
        .from('settings')
        .select('value, description')
        .eq('key', key)
        .single();

      return {
        success: true,
        result: {
          key,
          currentValue: currentSetting?.value || null,
          proposedValue: value,
          category,
          description: currentSetting?.description || 'No description available',
        },
        message: `Setting change proposed. Current: '${
          currentSetting?.value || 'not set'
        }', Proposed: '${value}'`,
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        message: `Failed to prepare setting change: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  },
};

/**
 * Apply a confirmed setting change
 */
export const applySettingChange = async (
  key: string,
  value: string,
  category: string = 'general',
  userId: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.from('settings').upsert(
      {
        key,
        value: value || null,
        category,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'key',
      },
    );

    if (error) {
      return {
        success: false,
        message: `Failed to update setting: ${error.message}`,
      };
    }

    // Log the activity
    try {
      await logActivity(`Setting "${key}" was updated via AI assistant`, 'setting', '/ai', {
        setting_key: key,
        new_value: value,
        category,
      });
    } catch (logError) {
      console.warn('Failed to log setting change activity:', logError);
    }

    return {
      success: true,
      message: `Setting '${key}' updated successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to apply setting change: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
};

/**
 * Capabilities report tool - shows system capabilities and status
 */
const getCapabilitiesReport: ChatTool = {
  name: 'system.capabilities',
  description: 'Get a comprehensive report of system capabilities, agents, and integrations',
  parameters: {
    type: 'object',
    properties: {
      include_agents: {
        type: 'boolean',
        description: 'Include detailed agent information',
        default: true,
      },
      include_integrations: {
        type: 'boolean',
        description: 'Include integration status',
        default: true,
      },
      include_usage: {
        type: 'boolean',
        description: 'Include recent usage statistics',
        default: false,
      },
    },
  },
  execute: async ({
    include_agents = true,
    include_integrations = true,
    include_usage = false,
  }) => {
    try {
      const report: any = {
        timestamp: new Date().toISOString(),
        system: {
          name: 'AI OS Autopilot',
          version: '1.0.0',
          status: 'active',
        },
        capabilities: [],
        integrations: {},
        agents: [],
      };

      // Core capabilities
      report.capabilities = [
        {
          category: 'AI Models',
          items: [
            { name: 'OpenAI GPT-4', status: 'available', provider: 'openai' },
            { name: 'Anthropic Claude', status: 'available', provider: 'claude' },
            { name: 'Google Gemini', status: 'available', provider: 'gemini' },
            { name: 'Local Ollama', status: 'configurable', provider: 'ollama' },
          ],
        },
        {
          category: 'Automation',
          items: [
            {
              name: 'n8n Workflow Engine',
              status: 'available',
              description: 'No-code automation platform',
            },
            {
              name: 'Social Media Scheduler',
              status: 'active',
              description: 'Automated posting system',
            },
            {
              name: 'Agent Orchestration',
              status: 'active',
              description: 'Multi-agent task coordination',
            },
          ],
        },
        {
          category: 'Content Creation',
          items: [
            { name: 'Media Studio', status: 'active', description: 'Video and image creation' },
            { name: 'Text-to-Speech', status: 'configurable', description: 'Voice synthesis' },
            { name: 'Image Generation', status: 'configurable', description: 'AI-powered images' },
          ],
        },
        {
          category: 'Data & Analytics',
          items: [
            { name: 'Database Access', status: 'active', description: 'Secure data querying' },
            { name: 'Settings Management', status: 'active', description: 'System configuration' },
            {
              name: 'Usage Analytics',
              status: 'active',
              description: 'Cost and performance tracking',
            },
          ],
        },
      ];

      // Integrations status
      if (include_integrations) {
        try {
          // Check n8n integration
          const { data: n8nSettings } = await supabase
            .from('settings')
            .select('value')
            .in('key', ['n8n_base_url', 'n8n_api_key', 'n8n_webhook_secret']);

          const n8nConfigured = n8nSettings?.some((s) => s.value) || false;

          report.integrations = {
            n8n: {
              status: n8nConfigured ? 'configured' : 'not_configured',
              description: 'n8n automation platform',
              configured: n8nConfigured,
            },
            runpod: {
              status: 'configurable',
              description: 'Local AI model hosting',
              configured: false, // Would need to check actual Runpod connection
            },
            social_platforms: {
              status: 'ready',
              description: 'Twitter, LinkedIn, Facebook, Instagram, TikTok, YouTube',
              configured: true, // Assume available through n8n
            },
          };
        } catch (error) {
          report.integrations = { error: 'Unable to check integration status' };
        }
      }

      // Agent information
      if (include_agents) {
        try {
          const { data: agents } = await supabase
            .from('ai_agents')
            .select('name, role, status, llm_provider, capabilities_json')
            .eq('status', 'active');

          report.agents =
            agents?.map((agent) => ({
              name: agent.name,
              role: agent.role,
              status: agent.status,
              provider: agent.llm_provider,
              capabilities: agent.capabilities_json || [],
            })) || [];
        } catch (error) {
          report.agents = { error: 'Unable to retrieve agent information' };
        }
      }

      // Usage statistics (if requested)
      if (include_usage) {
        try {
          const { data: usage } = await supabase
            .from('api_usage')
            .select('service, cost, tokens_used, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

          report.usage = {
            recent_transactions: usage || [],
            total_this_month: usage?.reduce((sum, u) => sum + (u.cost || 0), 0) || 0,
          };
        } catch (error) {
          report.usage = { error: 'Unable to retrieve usage statistics' };
        }
      }

      return {
        success: true,
        result: report,
        message: 'System capabilities report generated successfully',
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        message: `Capabilities report failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  },
};

/**
 * Audit log tool - shows recent system activities
 */
const getAuditLogs: ChatTool = {
  name: 'system.audit_logs',
  description: 'Retrieve recent audit logs and system activities',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of logs to retrieve',
        default: 20,
        maximum: 100,
      },
      action_filter: {
        type: 'string',
        description: 'Filter by specific action type',
      },
    },
  },
  execute: async ({ limit = 20, action_filter }) => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Math.min(limit, 100));

      if (action_filter) {
        query = query.eq('action', action_filter);
      }

      const { data: logs, error } = await query;

      if (error) {
        return {
          success: false,
          result: null,
          message: `Audit log retrieval failed: ${error.message}`,
        };
      }

      return {
        success: true,
        result: {
          logs: logs || [],
          count: logs?.length || 0,
          filter: action_filter || 'none',
        },
        message: `Retrieved ${logs?.length || 0} audit log entries`,
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        message: `Audit log retrieval failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  },
};

/**
 * Log activity to audit logs
 */
export const logActivityAudit = async (
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: any,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Failed to log audit activity:', error);
  }
};

/**
 * Get all available tools
 */
export const getAvailableTools = (): ChatTool[] => {
  return [
    describeDatabase,
    queryDatabase,
    getSetting,
    setSetting,
    getCapabilitiesReport,
    getAuditLogs,
  ];
};

/**
 * Execute a tool call
 */
export const executeTool = async (
  toolName: string,
  parameters: any,
): Promise<{ success: boolean; result: any; message: string }> => {
  const tools = getAvailableTools();
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    return {
      success: false,
      result: null,
      message: `Tool '${toolName}' not found`,
    };
  }

  return await tool.execute(parameters);
};

/**
 * Parse tool calls from assistant message
 */
export const parseToolCalls = (message: string): ToolCall[] => {
  const toolCalls: ToolCall[] = [];

  // Look for tool call patterns like: [tool.name(parameters)]
  const toolPattern = /\[(\w+\.\w+)\(([^)]*)\)\]/g;
  let match;

  while ((match = toolPattern.exec(message)) !== null) {
    const [fullMatch, toolName, paramsStr] = match;

    try {
      // Parse parameters (simple JSON-like parsing)
      const params = paramsStr.trim() ? JSON.parse(`{${paramsStr}}`) : {};

      // Check if this tool requires confirmation
      const requiresConfirmation =
        toolName.startsWith('settings.set') || toolName.startsWith('db.query');

      toolCalls.push({
        tool: toolName,
        parameters: params,
        requiresConfirmation,
        confirmationMessage: requiresConfirmation
          ? `Allow AI to ${toolName} with parameters: ${JSON.stringify(params)}?`
          : undefined,
      });
    } catch (error) {
      console.warn('Failed to parse tool call:', fullMatch, error);
    }
  }

  return toolCalls;
};
