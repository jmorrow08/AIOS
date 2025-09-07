import { supabase } from '@/lib/supabaseClient';

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  company_id: string;
  service_id: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  paid_date?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  created_at: string;
}

export interface InvoiceResponse {
  data: Invoice | Invoice[] | null;
  error: string | null;
}

export interface TransactionResponse {
  data: Transaction | Transaction[] | null;
  error: string | null;
}

export interface CreateInvoiceData {
  company_id: string;
  service_id: string;
  amount: number;
  due_date: string;
}

/**
 * Create a new invoice
 */
export const createInvoice = async (
  companyId: string,
  serviceId: string,
  amount: number,
  dueDate: string,
): Promise<InvoiceResponse> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          company_id: companyId,
          service_id: serviceId,
          amount,
          due_date: dueDate,
          status: 'pending' as InvoiceStatus,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      return {
        data: null,
        error: error.message || 'Failed to create invoice',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating invoice:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the invoice',
    };
  }
};

/**
 * Get invoices, optionally filtered by company ID
 */
export const getInvoices = async (companyId?: string): Promise<InvoiceResponse> => {
  try {
    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });

    // Filter by company if provided
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch invoices',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching invoices:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching invoices',
    };
  }
};

/**
 * Mark an invoice as paid
 */
export const markInvoicePaid = async (invoiceId: string): Promise<InvoiceResponse> => {
  try {
    const paidDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'paid' as InvoiceStatus,
        paid_date: paidDate,
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      console.error('Error marking invoice as paid:', error);
      return {
        data: null,
        error: error.message || 'Failed to mark invoice as paid',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error marking invoice as paid:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while marking the invoice as paid',
    };
  }
};

/**
 * Get transactions, optionally filtered by invoice ID
 */
export const getTransactions = async (invoiceId?: string): Promise<TransactionResponse> => {
  try {
    let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });

    // Filter by invoice if provided
    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch transactions',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching transactions:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching transactions',
    };
  }
};

/**
 * Create a transaction for an invoice
 */
export const createTransaction = async (
  invoiceId: string,
  amount: number,
  paymentMethod: string,
): Promise<TransactionResponse> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          invoice_id: invoiceId,
          amount,
          payment_method: paymentMethod,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return {
        data: null,
        error: error.message || 'Failed to create transaction',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating transaction:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the transaction',
    };
  }
};

/**
 * Get a single invoice by ID
 */
export const getInvoiceById = async (invoiceId: string): Promise<InvoiceResponse> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch invoice',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching invoice:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the invoice',
    };
  }
};

/**
 * Get invoices by status
 */
export const getInvoicesByStatus = async (
  status: InvoiceStatus,
  companyId?: string,
): Promise<InvoiceResponse> => {
  try {
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    // Filter by company if provided
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invoices by status:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch invoices by status',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching invoices by status:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching invoices by status',
    };
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (
  invoiceId: string,
  status: InvoiceStatus,
  paidDate?: string,
): Promise<InvoiceResponse> => {
  try {
    const updates: Partial<Invoice> = { status };

    if (status === 'paid' && paidDate) {
      updates.paid_date = paidDate;
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice status:', error);
      return {
        data: null,
        error: error.message || 'Failed to update invoice status',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating invoice status:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the invoice status',
    };
  }
};
