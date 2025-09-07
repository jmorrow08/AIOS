import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/api/dashboard';

export type EmployeeStatus = 'Active' | 'Inactive' | 'Terminated';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  hire_date?: string;
  status: EmployeeStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeResponse {
  data: Employee | Employee[] | null;
  error: string | null;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  hire_date?: string;
  status?: EmployeeStatus;
  notes?: string;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {}

/**
 * Create a new employee
 */
export const createEmployee = async (
  employeeData: CreateEmployeeData,
): Promise<EmployeeResponse> => {
  try {
    const { data, error } = await supabase
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
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating employee:', error);
      return {
        data: null,
        error: error.message || 'Failed to create employee',
      };
    }

    // Log activity
    try {
      await logActivity(
        `Employee "${employeeData.name}" was created`,
        'employee',
        '/operations-hub',
        {
          employee_id: data.id,
          employee_name: employeeData.name,
          role: employeeData.role,
        },
      );
    } catch (logError) {
      console.warn('Failed to log employee creation activity:', logError);
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating employee:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the employee',
    };
  }
};

/**
 * Get all employees
 */
export const getEmployees = async (): Promise<EmployeeResponse> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching employees:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch employees',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching employees:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching employees',
    };
  }
};

/**
 * Get a single employee by ID
 */
export const getEmployeeById = async (employeeId: string): Promise<EmployeeResponse> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (error) {
      console.error('Error fetching employee:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch employee',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching employee:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the employee',
    };
  }
};

/**
 * Update an employee
 */
export const updateEmployee = async (
  employeeId: string,
  updateData: UpdateEmployeeData,
): Promise<EmployeeResponse> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .update({
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone || null,
        role: updateData.role,
        department: updateData.department || null,
        hire_date: updateData.hire_date || null,
        status: updateData.status,
        notes: updateData.notes || null,
      })
      .eq('id', employeeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      return {
        data: null,
        error: error.message || 'Failed to update employee',
      };
    }

    // Log activity
    try {
      await logActivity(`Employee "${data.name}" was updated`, 'employee', '/operations-hub', {
        employee_id: data.id,
        employee_name: data.name,
      });
    } catch (logError) {
      console.warn('Failed to log employee update activity:', logError);
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating employee:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the employee',
    };
  }
};

/**
 * Delete an employee
 */
export const deleteEmployee = async (employeeId: string): Promise<EmployeeResponse> => {
  try {
    // First get the employee data for logging
    const { data: employeeData } = await getEmployeeById(employeeId);

    const { error } = await supabase.from('employees').delete().eq('id', employeeId);

    if (error) {
      console.error('Error deleting employee:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete employee',
      };
    }

    // Log activity
    if (employeeData) {
      try {
        await logActivity(
          `Employee "${(employeeData as Employee).name}" was deleted`,
          'employee',
          '/operations-hub',
          {
            employee_id: employeeId,
            employee_name: (employeeData as Employee).name,
          },
        );
      } catch (logError) {
        console.warn('Failed to log employee deletion activity:', logError);
      }
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting employee:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the employee',
    };
  }
};

/**
 * Get employees by status
 */
export const getEmployeesByStatus = async (status: EmployeeStatus): Promise<EmployeeResponse> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('status', status)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching employees by status:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch employees by status',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching employees by status:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching employees by status',
    };
  }
};

/**
 * Get employees by role
 */
export const getEmployeesByRole = async (role: string): Promise<EmployeeResponse> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('role', role)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching employees by role:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch employees by role',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching employees by role:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching employees by role',
    };
  }
};
