import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/api/dashboard';
import { Employee } from '@/api/employees';
import { Agent } from '@/agents/api';

// HR-specific types
export type EmployeeType = 'human' | 'ai';
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type PayrollStatus = 'pending' | 'processed' | 'paid' | 'failed';

export interface EmployeeWithAgent extends Employee {
  agent_id?: string;
  agent?: Agent;
  permissions: {
    services: boolean;
    finance: boolean;
    media: boolean;
    knowledge: boolean;
    hr: boolean;
    admin: boolean;
  };
}

export interface OnboardingWorkflow {
  id: string;
  employee_id?: string;
  agent_id?: string;
  workflow_name: string;
  steps: OnboardingStep[];
  current_step: number;
  status: OnboardingStatus;
  sop_document_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completed_at?: string;
}

export interface PayrollTransaction {
  id: string;
  employee_id?: string;
  agent_id?: string;
  service_id?: string;
  amount: number;
  period_start: string;
  period_end: string;
  status: PayrollStatus;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HRResponse<T> {
  data: T | null;
  error: string | null;
}

export interface CreateEmployeeWithAgentData {
  employeeData: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    department?: string;
    hire_date?: string;
    status?: string;
    notes?: string;
  };
  agent_id?: string;
  permissions?: {
    services: boolean;
    finance: boolean;
    media: boolean;
    knowledge: boolean;
    hr: boolean;
    admin: boolean;
  };
}

export interface UpdateEmployeeWithAgentData {
  employeeData?: Partial<{
    name: string;
    email: string;
    phone?: string;
    role: string;
    department?: string;
    hire_date?: string;
    status?: string;
    notes?: string;
  }>;
  agent_id?: string | null;
  permissions?: {
    services: boolean;
    finance: boolean;
    media: boolean;
    knowledge: boolean;
    hr: boolean;
    admin: boolean;
  };
}

/**
 * Get employees with their associated agents
 */
export const getEmployeesWithAgents = async (): Promise<HRResponse<EmployeeWithAgent[]>> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select(
        `
        *,
        ai_agents (
          id,
          name,
          role,
          description,
          status,
          capabilities_json
        )
      `,
      )
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching employees with agents:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch employees with agents',
      };
    }

    // Transform the data to match our interface
    const employeesWithAgents: EmployeeWithAgent[] = (data || []).map((employee: any) => ({
      ...employee,
      agent: employee.ai_agents,
      permissions: employee.permissions || {
        services: true,
        finance: false,
        media: false,
        knowledge: false,
        hr: false,
        admin: false,
      },
    }));

    return {
      data: employeesWithAgents,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching employees with agents:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching employees with agents',
    };
  }
};

/**
 * Create employee with optional agent linkage
 */
export const createEmployeeWithAgent = async (
  data: CreateEmployeeWithAgentData,
): Promise<HRResponse<EmployeeWithAgent>> => {
  try {
    const { employeeData, agent_id, permissions } = data;

    const { data: employee, error } = await supabase
      .from('employees')
      .insert([
        {
          name: employeeData.name,
          email: employeeData.email,
          phone: employeeData.phone || null,
          role: employeeData.role,
          department: employeeData.department || null,
          hire_date: employeeData.hire_date || null,
          status: employeeData.status || 'Active',
          notes: employeeData.notes || null,
          agent_id: agent_id || null,
          permissions: permissions ? JSON.stringify(permissions) : null,
        },
      ])
      .select(
        `
        *,
        ai_agents (
          id,
          name,
          role,
          description,
          status,
          capabilities_json
        )
      `,
      )
      .single();

    if (error) {
      console.error('Error creating employee with agent:', error);
      return {
        data: null,
        error: error.message || 'Failed to create employee with agent',
      };
    }

    // Log activity
    try {
      await logActivity(
        `Employee "${employeeData.name}" was created${agent_id ? ' with AI agent linkage' : ''}`,
        'employee',
        '/hr',
        {
          employee_id: employee.id,
          employee_name: employeeData.name,
          agent_id: agent_id,
          role: employeeData.role,
        },
      );
    } catch (logError) {
      console.warn('Failed to log employee creation activity:', logError);
    }

    const employeeWithAgent: EmployeeWithAgent = {
      ...employee,
      agent: employee.ai_agents,
      permissions: employee.permissions || {
        services: true,
        finance: false,
        media: false,
        knowledge: false,
        hr: false,
        admin: false,
      },
    };

    return {
      data: employeeWithAgent,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating employee with agent:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the employee with agent',
    };
  }
};

/**
 * Update employee with agent linkage
 */
export const updateEmployeeWithAgent = async (
  employeeId: string,
  data: UpdateEmployeeWithAgentData,
): Promise<HRResponse<EmployeeWithAgent>> => {
  try {
    const { employeeData, agent_id, permissions } = data;

    const updateData: any = {
      ...employeeData,
    };

    if (agent_id !== undefined) {
      updateData.agent_id = agent_id;
    }

    if (permissions) {
      updateData.permissions = JSON.stringify(permissions);
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', employeeId)
      .select(
        `
        *,
        ai_agents (
          id,
          name,
          role,
          description,
          status,
          capabilities_json
        )
      `,
      )
      .single();

    if (error) {
      console.error('Error updating employee with agent:', error);
      return {
        data: null,
        error: error.message || 'Failed to update employee with agent',
      };
    }

    // Log activity
    try {
      await logActivity(`Employee "${employee.name}" was updated`, 'employee', '/hr', {
        employee_id: employee.id,
        employee_name: employee.name,
        agent_id: agent_id,
      });
    } catch (logError) {
      console.warn('Failed to log employee update activity:', logError);
    }

    const employeeWithAgent: EmployeeWithAgent = {
      ...employee,
      agent: employee.ai_agents,
      permissions: employee.permissions || {
        services: true,
        finance: false,
        media: false,
        knowledge: false,
        hr: false,
        admin: false,
      },
    };

    return {
      data: employeeWithAgent,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating employee with agent:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the employee with agent',
    };
  }
};

/**
 * Link employee to AI agent
 */
export const linkEmployeeToAgent = async (
  employeeId: string,
  agentId: string,
): Promise<HRResponse<EmployeeWithAgent>> => {
  return updateEmployeeWithAgent(employeeId, { agent_id: agentId });
};

/**
 * Unlink employee from AI agent
 */
export const unlinkEmployeeFromAgent = async (
  employeeId: string,
): Promise<HRResponse<EmployeeWithAgent>> => {
  return updateEmployeeWithAgent(employeeId, { agent_id: null });
};

/**
 * Update employee permissions
 */
export const updateEmployeePermissions = async (
  employeeId: string,
  permissions: EmployeeWithAgent['permissions'],
): Promise<HRResponse<EmployeeWithAgent>> => {
  return updateEmployeeWithAgent(employeeId, { permissions });
};

/**
 * Get AI agents with their permissions
 */
export const getAgentsWithPermissions = async (): Promise<HRResponse<Agent[]>> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents with permissions:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch agents with permissions',
      };
    }

    // Transform permissions JSON to object
    const agentsWithPermissions: Agent[] = (data || []).map((agent: any) => ({
      ...agent,
      permissions: agent.permissions || {
        services: true,
        finance: false,
        media: false,
        knowledge: true,
        hr: false,
        admin: false,
      },
    }));

    return {
      data: agentsWithPermissions,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching agents with permissions:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching agents with permissions',
    };
  }
};

/**
 * Update AI agent permissions
 */
export const updateAgentPermissions = async (
  agentId: string,
  permissions: EmployeeWithAgent['permissions'],
): Promise<HRResponse<Agent>> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .update({
        permissions: JSON.stringify(permissions),
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent permissions:', error);
      return {
        data: null,
        error: error.message || 'Failed to update agent permissions',
      };
    }

    return {
      data: {
        ...data,
        permissions: permissions,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating agent permissions:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating agent permissions',
    };
  }
};

/**
 * Get onboarding workflows
 */
export const getOnboardingWorkflows = async (): Promise<HRResponse<OnboardingWorkflow[]>> => {
  try {
    const { data, error } = await supabase
      .from('employee_onboarding')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching onboarding workflows:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch onboarding workflows',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching onboarding workflows:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching onboarding workflows',
    };
  }
};

/**
 * Create onboarding workflow
 */
export const createOnboardingWorkflow = async (
  workflowData: Omit<OnboardingWorkflow, 'id' | 'created_at' | 'updated_at' | 'completed_at'>,
): Promise<HRResponse<OnboardingWorkflow>> => {
  try {
    const { data, error } = await supabase
      .from('employee_onboarding')
      .insert([
        {
          ...workflowData,
          steps: JSON.stringify(workflowData.steps),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating onboarding workflow:', error);
      return {
        data: null,
        error: error.message || 'Failed to create onboarding workflow',
      };
    }

    return {
      data: {
        ...data,
        steps: JSON.parse(data.steps),
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating onboarding workflow:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the onboarding workflow',
    };
  }
};

/**
 * Update onboarding workflow
 */
export const updateOnboardingWorkflow = async (
  workflowId: string,
  updates: Partial<Omit<OnboardingWorkflow, 'id' | 'created_at' | 'updated_at' | 'completed_at'>>,
): Promise<HRResponse<OnboardingWorkflow>> => {
  try {
    const updateData: any = { ...updates };
    if (updates.steps) {
      updateData.steps = JSON.stringify(updates.steps);
    }

    const { data, error } = await supabase
      .from('employee_onboarding')
      .update(updateData)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) {
      console.error('Error updating onboarding workflow:', error);
      return {
        data: null,
        error: error.message || 'Failed to update onboarding workflow',
      };
    }

    return {
      data: {
        ...data,
        steps: JSON.parse(data.steps),
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating onboarding workflow:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the onboarding workflow',
    };
  }
};

/**
 * Get payroll transactions
 */
export const getPayrollTransactions = async (): Promise<HRResponse<PayrollTransaction[]>> => {
  try {
    const { data, error } = await supabase
      .from('payroll_transactions')
      .select(
        `
        *,
        employees (
          id,
          name,
          email,
          role
        ),
        ai_agents (
          id,
          name,
          role
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payroll transactions:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch payroll transactions',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching payroll transactions:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching payroll transactions',
    };
  }
};

/**
 * Create payroll transaction
 */
export const createPayrollTransaction = async (
  transactionData: Omit<PayrollTransaction, 'id' | 'created_at' | 'updated_at'>,
): Promise<HRResponse<PayrollTransaction>> => {
  try {
    const { data, error } = await supabase
      .from('payroll_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating payroll transaction:', error);
      return {
        data: null,
        error: error.message || 'Failed to create payroll transaction',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating payroll transaction:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the payroll transaction',
    };
  }
};

/**
 * Update payroll transaction
 */
export const updatePayrollTransaction = async (
  transactionId: string,
  updates: Partial<Omit<PayrollTransaction, 'id' | 'created_at' | 'updated_at'>>,
): Promise<HRResponse<PayrollTransaction>> => {
  try {
    const { data, error } = await supabase
      .from('payroll_transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payroll transaction:', error);
      return {
        data: null,
        error: error.message || 'Failed to update payroll transaction',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating payroll transaction:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the payroll transaction',
    };
  }
};
