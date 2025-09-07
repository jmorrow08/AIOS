import { supabase } from '@/lib/supabaseClient';

export type ServiceStatus = 'active' | 'paused' | 'completed';
export type BillingType = 'subscription' | 'one-time';

export interface Service {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  status: ServiceStatus;
  billing_type: BillingType;
  price: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface ServiceResponse {
  data: Service | Service[] | null;
  error: string | null;
}

export interface CreateServiceData {
  company_id: string;
  name: string;
  description?: string;
  status?: ServiceStatus;
  billing_type: BillingType;
  price: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  status?: ServiceStatus;
  billing_type?: BillingType;
  price?: number;
  start_date?: string;
  end_date?: string;
}

/**
 * Create a new service
 */
export const createService = async (serviceData: CreateServiceData): Promise<ServiceResponse> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert([
        {
          ...serviceData,
          status: serviceData.status || 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return {
        data: null,
        error: error.message || 'Failed to create service',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating service:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the service',
    };
  }
};

/**
 * Get services, optionally filtered by company ID
 */
export const getServices = async (companyId?: string): Promise<ServiceResponse> => {
  try {
    let query = supabase.from('services').select('*').order('created_at', { ascending: false });

    // Filter by company if provided
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch services',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching services:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching services',
    };
  }
};

/**
 * Update an existing service
 */
export const updateService = async (
  serviceId: string,
  updates: UpdateServiceData,
): Promise<ServiceResponse> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      return {
        data: null,
        error: error.message || 'Failed to update service',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating service:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the service',
    };
  }
};

/**
 * Delete a service
 */
export const deleteService = async (serviceId: string): Promise<ServiceResponse> => {
  try {
    const { error } = await supabase.from('services').delete().eq('id', serviceId);

    if (error) {
      console.error('Error deleting service:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete service',
      };
    }

    return {
      data: null, // No data returned for delete operations
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting service:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the service',
    };
  }
};

/**
 * Get a single service by ID
 */
export const getServiceById = async (serviceId: string): Promise<ServiceResponse> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) {
      console.error('Error fetching service:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch service',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching service:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the service',
    };
  }
};

/**
 * Get services by status
 */
export const getServicesByStatus = async (
  status: ServiceStatus,
  companyId?: string,
): Promise<ServiceResponse> => {
  try {
    let query = supabase
      .from('services')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    // Filter by company if provided
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching services by status:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch services by status',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching services by status:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching services by status',
    };
  }
};
