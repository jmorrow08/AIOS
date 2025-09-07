import { supabase } from '@/lib/supabaseClient';

export type AgentStatus = 'active' | 'inactive';
export type LLMProvider = 'openai' | 'claude' | 'gemini';

export interface Agent {
  id: string;
  name: string;
  role: string;
  prompt?: string;
  api_key_ref?: string;
  llm_provider?: LLMProvider;
  llm_model?: string;
  status: AgentStatus;
  created_at: string;
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
  prompt?: string;
  api_key_ref?: string;
  llm_provider?: LLMProvider;
  llm_model?: string;
  status?: AgentStatus;
}

export interface UpdateAgentData {
  name?: string;
  role?: string;
  prompt?: string;
  api_key_ref?: string;
  llm_provider?: LLMProvider;
  llm_model?: string;
  status?: AgentStatus;
}

export interface CreateAgentLogData {
  agent_id: string;
  input: string;
  output?: string;
  error?: string;
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
