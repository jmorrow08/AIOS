import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/api/dashboard';
import { processPayment, validatePaymentRequest, PaymentRequest } from '@/lib/paymentServices';
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
  // Enhanced fields
  payroll_rule_id?: string;
  approved_by?: string;
  approved_at?: string;
  payment_method?: 'zelle' | 'ach' | 'stripe' | 'check' | 'wire';
  payment_reference?: string;
  hours_worked?: number;
  service_value?: number;
  calculated_amount?: number;
  final_amount: number;
}

export interface PayrollRule {
  id: string;
  name: string;
  role?: string;
  department?: string;
  employee_id?: string;
  agent_id?: string;
  service_id?: string;
  rate_type: 'hourly' | 'per-job' | 'salary' | 'percentage';
  amount: number;
  is_percentage: boolean;
  is_active: boolean;
  priority: number;
  effective_date: string;
  expiration_date?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeNotification {
  id: string;
  employee_id?: string;
  agent_id?: string;
  payroll_transaction_id: string;
  notification_type: 'payout_created' | 'payout_approved' | 'payout_paid' | 'payout_failed';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
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

/**
 * Get payroll rules
 */
export const getPayrollRules = async (): Promise<HRResponse<PayrollRule[]>> => {
  try {
    const { data, error } = await supabase
      .from('payroll_rules')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payroll rules:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch payroll rules',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching payroll rules:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching payroll rules',
    };
  }
};

/**
 * Create payroll rule
 */
export const createPayrollRule = async (
  ruleData: Omit<PayrollRule, 'id' | 'created_at' | 'updated_at'>,
): Promise<HRResponse<PayrollRule>> => {
  try {
    const { data, error } = await supabase
      .from('payroll_rules')
      .insert([ruleData])
      .select()
      .single();

    if (error) {
      console.error('Error creating payroll rule:', error);
      return {
        data: null,
        error: error.message || 'Failed to create payroll rule',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating payroll rule:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the payroll rule',
    };
  }
};

/**
 * Update payroll rule
 */
export const updatePayrollRule = async (
  ruleId: string,
  updates: Partial<Omit<PayrollRule, 'id' | 'created_at' | 'updated_at'>>,
): Promise<HRResponse<PayrollRule>> => {
  try {
    const { data, error } = await supabase
      .from('payroll_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payroll rule:', error);
      return {
        data: null,
        error: error.message || 'Failed to update payroll rule',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating payroll rule:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the payroll rule',
    };
  }
};

/**
 * Delete payroll rule
 */
export const deletePayrollRule = async (ruleId: string): Promise<HRResponse<boolean>> => {
  try {
    const { error } = await supabase.from('payroll_rules').delete().eq('id', ruleId);

    if (error) {
      console.error('Error deleting payroll rule:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete payroll rule',
      };
    }

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting payroll rule:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the payroll rule',
    };
  }
};

/**
 * Calculate payout amount based on rules and service
 */
export const calculatePayoutAmount = async (
  employeeId?: string,
  agentId?: string,
  serviceId?: string,
  hoursWorked?: number,
  serviceValue?: number,
): Promise<HRResponse<{ amount: number; rule: PayrollRule | null }>> => {
  try {
    // Get applicable rules (highest priority first)
    let query = supabase
      .from('payroll_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    // Apply filters based on the context
    if (employeeId) {
      query = query.or(`employee_id.is.null,employee_id.eq.${employeeId}`);
    }
    if (agentId) {
      query = query.or(`agent_id.is.null,agent_id.eq.${agentId}`);
    }
    if (serviceId) {
      query = query.or(`service_id.is.null,service_id.eq.${serviceId}`);
    }

    const { data: rules, error } = await query;

    if (error) {
      console.error('Error fetching applicable rules:', error);
      return {
        data: null,
        error: error.message || 'Failed to calculate payout amount',
      };
    }

    if (!rules || rules.length === 0) {
      return {
        data: { amount: 0, rule: null },
        error: null,
      };
    }

    // Find the best matching rule (highest priority)
    const bestRule = rules[0];

    let calculatedAmount = 0;

    switch (bestRule.rate_type) {
      case 'hourly':
        calculatedAmount = (hoursWorked || 0) * bestRule.amount;
        break;
      case 'per-job':
        calculatedAmount = bestRule.amount;
        break;
      case 'salary':
        // For salary, we'd need to calculate based on period, but for now use full amount
        calculatedAmount = bestRule.amount;
        break;
      case 'percentage':
        calculatedAmount = (serviceValue || 0) * (bestRule.amount / 100);
        break;
    }

    return {
      data: { amount: calculatedAmount, rule: bestRule },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error calculating payout amount:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while calculating the payout amount',
    };
  }
};

/**
 * Auto-generate payout when service/invoice is completed
 */
export const autoGeneratePayout = async (
  serviceId: string,
  employeeId?: string,
  agentId?: string,
  hoursWorked?: number,
): Promise<HRResponse<PayrollTransaction | null>> => {
  try {
    // Get service details to determine payout amount
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*, invoices(amount)')
      .eq('id', serviceId)
      .single();

    if (serviceError) {
      console.error('Error fetching service:', serviceError);
      return {
        data: null,
        error: serviceError.message || 'Failed to fetch service details',
      };
    }

    // Calculate payout amount
    const calculation = await calculatePayoutAmount(
      employeeId,
      agentId,
      serviceId,
      hoursWorked,
      service?.invoices?.[0]?.amount,
    );

    if (calculation.error || !calculation.data) {
      return {
        data: null,
        error: calculation.error || 'Failed to calculate payout amount',
      };
    }

    // Create payout transaction
    const payoutData = {
      employee_id: employeeId,
      agent_id: agentId,
      service_id: serviceId,
      amount: calculation.data.amount,
      final_amount: calculation.data.amount,
      period_start: new Date().toISOString().split('T')[0], // Today's date
      period_end: new Date().toISOString().split('T')[0], // Today's date
      status: 'pending' as const,
      payroll_rule_id: calculation.data.rule?.id,
      calculated_amount: calculation.data.amount,
      service_value: service?.invoices?.[0]?.amount,
      hours_worked: hoursWorked,
      notes: `Auto-generated payout for service completion - Rule: ${
        calculation.data.rule?.name || 'N/A'
      }`,
    };

    const result = await createPayrollTransaction(payoutData);

    if (result.data) {
      // Create notification for the employee/agent
      await createEmployeeNotification({
        employee_id: employeeId,
        agent_id: agentId,
        payroll_transaction_id: result.data.id,
        notification_type: 'payout_created',
        title: 'New Payout Created',
        message: `A payout of $${result.data.final_amount.toFixed(
          2,
        )} has been created for your recent work.`,
      });
    }

    return result;
  } catch (error) {
    console.error('Unexpected error auto-generating payout:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while auto-generating the payout',
    };
  }
};

/**
 * Approve payroll transaction
 */
export const approvePayrollTransaction = async (
  transactionId: string,
  approvedBy: string,
  finalAmount?: number,
): Promise<HRResponse<PayrollTransaction>> => {
  try {
    const updateData: any = {
      status: 'processed',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    };

    if (finalAmount !== undefined) {
      updateData.final_amount = finalAmount;
    }

    const result = await updatePayrollTransaction(transactionId, updateData);

    if (result.data) {
      // Create notification for approval
      await createEmployeeNotification({
        employee_id: result.data.employee_id,
        agent_id: result.data.agent_id,
        payroll_transaction_id: result.data.id,
        notification_type: 'payout_approved',
        title: 'Payout Approved',
        message: `Your payout of $${result.data.final_amount.toFixed(
          2,
        )} has been approved and is ready for payment.`,
      });
    }

    return result;
  } catch (error) {
    console.error('Unexpected error approving payroll transaction:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while approving the payroll transaction',
    };
  }
};

/**
 * Mark payroll transaction as paid with payment processing
 */
export const markPayrollAsPaid = async (
  transactionId: string,
  paymentMethod: 'zelle' | 'ach' | 'stripe' | 'check' | 'wire',
  paymentReference?: string,
): Promise<HRResponse<PayrollTransaction>> => {
  try {
    // First get the transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from('payroll_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !transaction) {
      return {
        data: null,
        error: 'Failed to fetch payroll transaction details',
      };
    }

    // Prepare payment request
    const paymentRequest: PaymentRequest = {
      amount: transaction.final_amount,
      recipientId: transaction.employee_id || transaction.agent_id || '',
      recipientType: transaction.employee_id ? 'employee' : 'agent',
      paymentMethod,
      description: `Payroll payout for ${transaction.employee_id ? 'employee' : 'agent'}`,
      payrollTransactionId: transactionId,
    };

    // Validate payment request
    const validation = validatePaymentRequest(paymentRequest);
    if (!validation.valid) {
      return {
        data: null,
        error: `Payment validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Process the payment
    const paymentResult = await processPayment(paymentRequest);

    // Update transaction with payment details
    const updateData: any = {
      status: paymentResult.success ? 'paid' : 'failed',
      payment_date: paymentResult.success ? new Date().toISOString().split('T')[0] : undefined,
      payment_method: paymentMethod,
      payment_reference: paymentResult.reference || paymentReference,
    };

    if (paymentResult.transactionId) {
      updateData.payment_reference = paymentResult.transactionId;
    }

    const result = await updatePayrollTransaction(transactionId, updateData);

    if (result.data) {
      // Create notification for payment result
      const notificationType = paymentResult.success ? 'payout_paid' : 'payout_failed';
      const title = paymentResult.success ? 'Payout Processed' : 'Payout Failed';
      const message = paymentResult.success
        ? `Your payout of $${result.data.final_amount.toFixed(
            2,
          )} has been processed via ${paymentMethod.toUpperCase()}.`
        : `Your payout of $${result.data.final_amount.toFixed(2)} failed to process: ${
            paymentResult.error
          }`;

      await createEmployeeNotification({
        employee_id: result.data.employee_id,
        agent_id: result.data.agent_id,
        payroll_transaction_id: result.data.id,
        notification_type: notificationType,
        title,
        message,
      });
    }

    return result;
  } catch (error) {
    console.error('Unexpected error marking payroll as paid:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while marking the payroll as paid',
    };
  }
};

/**
 * Bulk approve payroll transactions
 */
export const bulkApprovePayrollTransactions = async (
  transactionIds: string[],
  approvedBy: string,
): Promise<HRResponse<PayrollTransaction[]>> => {
  try {
    const { data, error } = await supabase
      .from('payroll_transactions')
      .update({
        status: 'processed',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .in('id', transactionIds)
      .select();

    if (error) {
      console.error('Error bulk approving payroll transactions:', error);
      return {
        data: null,
        error: error.message || 'Failed to bulk approve payroll transactions',
      };
    }

    // Create notifications for each approved transaction
    for (const transaction of data || []) {
      await createEmployeeNotification({
        employee_id: transaction.employee_id,
        agent_id: transaction.agent_id,
        payroll_transaction_id: transaction.id,
        notification_type: 'payout_approved',
        title: 'Payout Approved',
        message: `Your payout of $${transaction.final_amount.toFixed(
          2,
        )} has been approved and is ready for payment.`,
      });
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error bulk approving payroll transactions:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while bulk approving payroll transactions',
    };
  }
};

/**
 * Get employee notifications
 */
export const getEmployeeNotifications = async (
  employeeId?: string,
  agentId?: string,
): Promise<HRResponse<EmployeeNotification[]>> => {
  try {
    let query = supabase
      .from('employee_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching employee notifications:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch employee notifications',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching employee notifications:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching employee notifications',
    };
  }
};

/**
 * Create employee notification
 */
export const createEmployeeNotification = async (
  notificationData: Omit<EmployeeNotification, 'id' | 'created_at'>,
): Promise<HRResponse<EmployeeNotification>> => {
  try {
    const { data, error } = await supabase
      .from('employee_notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) {
      console.error('Error creating employee notification:', error);
      return {
        data: null,
        error: error.message || 'Failed to create employee notification',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating employee notification:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the employee notification',
    };
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
): Promise<HRResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('employee_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return {
        data: null,
        error: error.message || 'Failed to mark notification as read',
      };
    }

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error marking notification as read:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while marking the notification as read',
    };
  }
};
