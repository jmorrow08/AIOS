import { supabase } from '@/lib/supabaseClient';

export interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  description?: string;
  prompt_template?: string;
  default_model: string;
  cost_estimate: number;
  category?: string;
  tags?: string[];
  is_public: boolean;
  created_by?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentTemplateData {
  name: string;
  role: string;
  description?: string;
  prompt_template?: string;
  default_model?: string;
  cost_estimate?: number;
  category?: string;
  tags?: string[];
  is_public?: boolean;
  company_id?: string;
}

export interface UpdateAgentTemplateData {
  name?: string;
  role?: string;
  description?: string;
  prompt_template?: string;
  default_model?: string;
  cost_estimate?: number;
  category?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface AgentTemplateResponse {
  data: AgentTemplate | AgentTemplate[] | null;
  error: string | null;
}

/**
 * Get all available agent templates
 */
export const getAgentTemplates = async (): Promise<AgentTemplateResponse> => {
  try {
    const { data, error } = await supabase
      .from('agent_templates')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agent templates:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch agent templates',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching agent templates:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching agent templates',
    };
  }
};

/**
 * Get agent templates by category
 */
export const getAgentTemplatesByCategory = async (
  category: string,
): Promise<AgentTemplateResponse> => {
  try {
    const { data, error } = await supabase
      .from('agent_templates')
      .select('*')
      .eq('is_public', true)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agent templates by category:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch agent templates by category',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching agent templates by category:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching agent templates by category',
    };
  }
};

/**
 * Search agent templates
 */
export const searchAgentTemplates = async (query: string): Promise<AgentTemplateResponse> => {
  try {
    const { data, error } = await supabase
      .from('agent_templates')
      .select('*')
      .eq('is_public', true)
      .or(`name.ilike.%${query}%,role.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching agent templates:', error);
      return {
        data: null,
        error: error.message || 'Failed to search agent templates',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error searching agent templates:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while searching agent templates',
    };
  }
};

/**
 * Get agent template by ID
 */
export const getAgentTemplateById = async (id: string): Promise<AgentTemplateResponse> => {
  try {
    const { data, error } = await supabase
      .from('agent_templates')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single();

    if (error) {
      console.error('Error fetching agent template by ID:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch agent template',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching agent template by ID:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching agent template',
    };
  }
};

/**
 * Create a new agent template (for admins/publishers)
 */
export const createAgentTemplate = async (
  templateData: CreateAgentTemplateData,
): Promise<AgentTemplateResponse> => {
  try {
    const { data, error } = await supabase
      .from('agent_templates')
      .insert([templateData])
      .select()
      .single();

    if (error) {
      console.error('Error creating agent template:', error);
      return {
        data: null,
        error: error.message || 'Failed to create agent template',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating agent template:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating agent template',
    };
  }
};

/**
 * Update an agent template
 */
export const updateAgentTemplate = async (
  id: string,
  updates: UpdateAgentTemplateData,
): Promise<AgentTemplateResponse> => {
  try {
    const { data, error } = await supabase
      .from('agent_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent template:', error);
      return {
        data: null,
        error: error.message || 'Failed to update agent template',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating agent template:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating agent template',
    };
  }
};

/**
 * Delete an agent template
 */
export const deleteAgentTemplate = async (id: string): Promise<AgentTemplateResponse> => {
  try {
    const { error } = await supabase.from('agent_templates').delete().eq('id', id);

    if (error) {
      console.error('Error deleting agent template:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete agent template',
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting agent template:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting agent template',
    };
  }
};

/**
 * Get categories from templates
 */
export const getTemplateCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('agent_templates')
      .select('category')
      .eq('is_public', true)
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching template categories:', error);
      return [];
    }

    const categories = [...new Set(data?.map((item) => item.category) || [])];
    return categories.sort();
  } catch (error) {
    console.error('Unexpected error fetching template categories:', error);
    return [];
  }
};
