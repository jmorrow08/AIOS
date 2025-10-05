import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/api/dashboard';

export type AgentStatus = 'active' | 'inactive';
export type LLMProvider = 'openai' | 'claude' | 'gemini';

export interface Agent {
  id: string;
  name: string;
  role: string;
  description?: string;
  prompt?: string;
  api_key_ref?: string;
  llm_provider?: LLMProvider;
  llm_model?: string;
  capabilities_json?: string[];
  status: AgentStatus;
  created_at: string;
  created_by?: string;
}

export interface AgentLog {
  id: string;
  agent_id: string;
  input: string;
  output?: string;
  error?: string;
  created_at: string;
}

export interface AgentResponse {
  data: Agent | Agent[] | AgentLog | null;
  error: string | null;
}

export interface CreateAgentData {
  name: string;
  role: string;
  description?: string;
  prompt?: string;
  api_key_ref?: string;
  llm_provider?: LLMProvider;
  llm_model?: string;
  capabilities_json?: string[];
  status?: AgentStatus;
  created_by?: string;
  company_id?: string;
}

export interface UpdateAgentData {
  name?: string;
  role?: string;
  description?: string;
  prompt?: string;
  api_key_ref?: string;
  llm_provider?: LLMProvider;
  llm_model?: string;
  capabilities_json?: string[];
  status?: AgentStatus;
}

export interface CreateAgentLogData {
  agent_id: string;
  input: string;
  output?: string;
  error?: string;
}

export interface ConversationLog {
  id: string;
  agent_id: string;
  user_id: string;
  conversation_title?: string;
  messages: Array<{
    id: string;
    message: string;
    timestamp: Date;
    isUser: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

export interface TaskLog {
  id: string;
  agent_id: string;
  user_id: string;
  task_description: string;
  task_plan?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: any;
  sub_tasks?: any[];
  created_at: string;
  updated_at: string;
}

export interface CreateConversationLogData {
  agent_id: string;
  user_id: string;
  conversation_title?: string;
  messages?: any[];
}

export interface CreateTaskLogData {
  agent_id: string;
  user_id: string;
  task_description: string;
  task_plan?: any;
  status?: string;
  results?: any;
  sub_tasks?: any[];
}

/**
 * Get agent by role
 */
export const getAgentByRole = async (role: string): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('role', role)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching agent by role:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch agent by role',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching agent by role:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching agent by role',
    };
  }
};

/**
 * Get all agents
 */
export const getAgents = async (): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch agents',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching agents:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching agents',
    };
  }
};

/**
 * Create a new agent
 */
export const createAgent = async (agentData: CreateAgentData): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .insert([
        {
          ...agentData,
          status: agentData.status || 'active',
          capabilities_json: agentData.capabilities_json || ['chat'],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return {
        data: null,
        error: error.message || 'Failed to create agent',
      };
    }

    // Log activity
    try {
      await logActivity(
        `New AI agent "${agentData.name}" (${agentData.role}) was created`,
        'agent',
        '/ai-lab',
        {
          agent_id: data.id,
          agent_name: agentData.name,
          agent_role: agentData.role,
        },
      );
    } catch (logError) {
      console.warn('Failed to log agent creation activity:', logError);
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating agent:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the agent',
    };
  }
};

/**
 * Update an existing agent
 */
export const updateAgent = async (
  agentId: string,
  updates: UpdateAgentData,
): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .update(updates)
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent:', error);
      return {
        data: null,
        error: error.message || 'Failed to update agent',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating agent:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the agent',
    };
  }
};

/**
 * Log agent interaction
 */
export const logAgentInteraction = async (logData: CreateAgentLogData): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('agent_logs')
      .insert([
        {
          ...logData,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error logging agent interaction:', error);
      return {
        data: null,
        error: error.message || 'Failed to log agent interaction',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error logging agent interaction:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while logging agent interaction',
    };
  }
};

/**
 * Get agent logs by agent ID
 */
export const getAgentLogs = async (agentId: string): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agent logs:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch agent logs',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching agent logs:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching agent logs',
    };
  }
};

/**
 * Create a conversation log
 */
export const createConversationLog = async (
  logData: CreateConversationLogData,
): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('conversation_logs')
      .insert([
        {
          ...logData,
          messages: logData.messages || [],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation log:', error);
      return {
        data: null,
        error: error.message || 'Failed to create conversation log',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating conversation log:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the conversation log',
    };
  }
};

/**
 * Update a conversation log
 */
export const updateConversationLog = async (
  logId: string,
  updates: Partial<CreateConversationLogData>,
): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('conversation_logs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', logId)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation log:', error);
      return {
        data: null,
        error: error.message || 'Failed to update conversation log',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating conversation log:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the conversation log',
    };
  }
};

/**
 * Get conversation logs for a user
 */
export const getConversationLogs = async (userId: string): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('conversation_logs')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversation logs:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch conversation logs',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching conversation logs:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching conversation logs',
    };
  }
};

/**
 * Create a task log
 */
export const createTaskLog = async (logData: CreateTaskLogData): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('task_logs')
      .insert([
        {
          ...logData,
          status: logData.status || 'pending',
          sub_tasks: logData.sub_tasks || [],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating task log:', error);
      return {
        data: null,
        error: error.message || 'Failed to create task log',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating task log:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the task log',
    };
  }
};

/**
 * Update a task log
 */
export const updateTaskLog = async (
  logId: string,
  updates: Partial<CreateTaskLogData>,
): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('task_logs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', logId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task log:', error);
      return {
        data: null,
        error: error.message || 'Failed to update task log',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating task log:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the task log',
    };
  }
};

/**
 * Get task logs for a user
 */
export const getTaskLogs = async (userId: string): Promise<AgentResponse> => {
  try {
    const { data, error } = await supabase
      .from('task_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task logs:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch task logs',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching task logs:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching task logs',
    };
  }
};
