import { supabase } from '@/lib/supabaseClient';

export interface Company {
  id: string;
  name: string;
  contact_info?: any;
  created_at: string;
}

export interface CompanyResponse {
  data: Company | Company[] | null;
  error: string | null;
}

export interface CreateCompanyData {
  name: string;
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
    [key: string]: any;
  };
}

/**
 * Create a new company
 */
export const createCompany = async (companyData: CreateCompanyData): Promise<CompanyResponse> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return {
        data: null,
        error: error.message || 'Failed to create company',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating company:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the company',
    };
  }
};

/**
 * Get all companies
 */
export const getCompanies = async (): Promise<CompanyResponse> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching companies:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch companies',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching companies:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching companies',
    };
  }
};

/**
 * Get a single company by ID
 */
export const getCompanyById = async (companyId: string): Promise<CompanyResponse> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch company',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching company:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the company',
    };
  }
};

/**
 * Update a company
 */
export const updateCompany = async (
  companyId: string,
  updates: Partial<CreateCompanyData>,
): Promise<CompanyResponse> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating company:', error);
      return {
        data: null,
        error: error.message || 'Failed to update company',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating company:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the company',
    };
  }
};

/**
 * Delete a company
 */
export const deleteCompany = async (companyId: string): Promise<CompanyResponse> => {
  try {
    const { error } = await supabase.from('companies').delete().eq('id', companyId);

    if (error) {
      console.error('Error deleting company:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete company',
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting company:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the company',
    };
  }
};
