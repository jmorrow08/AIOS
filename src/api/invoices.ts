import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/api/dashboard';
import { autoGeneratePayout } from '@/api/hr';

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  company_id: string;
  service_id?: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  paid_date?: string;
  line_items?: LineItem[];
  payment_link?: string;
  created_at: string;
  updated_at?: string;
}

export interface LineItem {
  description: string;
  amount: number;
  quantity?: number;
  unit_price?: number;
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
  service_id?: string;
  amount: number;
  due_date: string;
  line_items?: LineItem[];
  payment_link?: string;
}

/**
 * Create a new invoice
 */
export const createInvoice = async (invoiceData: CreateInvoiceData): Promise<InvoiceResponse> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          company_id: invoiceData.company_id,
          service_id: invoiceData.service_id,
          amount: invoiceData.amount,
          due_date: invoiceData.due_date,
          line_items: invoiceData.line_items || [],
          payment_link: invoiceData.payment_link,
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

    // Log activity
    try {
      await logActivity(
        `Invoice #${data.id.slice(-8)} created for $${invoiceData.amount.toFixed(2)}`,
        'invoice',
        '/financial-nexus',
        {
          invoice_id: data.id,
          amount: invoiceData.amount,
          client_id: invoiceData.company_id,
          service_id: invoiceData.service_id,
          line_items_count: invoiceData.line_items?.length || 0,
        },
      );
    } catch (logError) {
      console.warn('Failed to log invoice creation activity:', logError);
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
 * Mark an invoice as paid and auto-generate payouts
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

    // Auto-generate payouts for linked services
    if (data.service_id) {
      try {
        // Get service details to find linked employees/agents
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select(
            `
            *,
            employees!inner(id, name, email),
            ai_agents(id, name, role)
          `,
          )
          .eq('id', data.service_id)
          .single();

        if (!serviceError && serviceData) {
          // Try to auto-generate payout for the service
          // This will use the payroll rules to determine the amount
          const payoutResult = await autoGeneratePayout(
            data.service_id,
            serviceData.employees?.id, // Primary employee if available
            serviceData.ai_agents?.id, // AI agent if available
            undefined, // hoursWorked - could be calculated from service metadata
          );

          if (payoutResult.data) {
            console.log('Auto-generated payout:', payoutResult.data);
          } else {
            console.warn('Failed to auto-generate payout:', payoutResult.error);
          }
        }
      } catch (payoutError) {
        console.warn('Error during auto-payout generation:', payoutError);
        // Don't fail the invoice payment if payout generation fails
      }
    }

    // Log activity
    try {
      await logActivity(
        `Invoice #${invoiceId.slice(-8)} was marked as paid ($${data.amount.toFixed(2)})`,
        'invoice',
        '/financial-nexus',
        {
          invoice_id: invoiceId,
          amount: data.amount,
          paid_date: paidDate,
          auto_payout_triggered: !!data.service_id,
        },
      );
    } catch (logError) {
      console.warn('Failed to log invoice payment activity:', logError);
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

/**
 * Get invoice statistics
 */
export const getInvoiceStats = async (
  companyId?: string,
): Promise<{
  data: {
    totalUnpaid: number;
    totalOverdue: number;
    totalPaidThisMonth: number;
    totalOutstanding: number;
  } | null;
  error: string | null;
}> => {
  try {
    let query = supabase.from('invoices').select('*');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invoice stats:', error);
      return { data: null, error: error.message || 'Failed to fetch invoice stats' };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalUnpaid = 0;
    let totalOverdue = 0;
    let totalPaidThisMonth = 0;
    let totalOutstanding = 0;

    if (data) {
      data.forEach((invoice: any) => {
        if (invoice.status === 'paid') {
          if (new Date(invoice.paid_date) >= startOfMonth) {
            totalPaidThisMonth += invoice.amount;
          }
        } else {
          totalOutstanding += invoice.amount;
          if (invoice.status === 'overdue' || new Date(invoice.due_date) < now) {
            totalOverdue += invoice.amount;
          } else {
            totalUnpaid += invoice.amount;
          }
        }
      });
    }

    return {
      data: {
        totalUnpaid,
        totalOverdue,
        totalPaidThisMonth,
        totalOutstanding,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching invoice stats:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching invoice stats',
    };
  }
};

/**
 * Generate invoice number (simple implementation)
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Get count of invoices this month for sequential numbering
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());

  const sequence = String((count || 0) + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
};
