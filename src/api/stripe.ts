import { supabase } from '@/lib/supabaseClient';

export interface StripeCustomer {
  id: string;
  email?: string;
  name?: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
}

export interface StripePortalSession {
  url: string;
}

export interface CreateCheckoutSessionParams {
  companyId: string;
  invoiceId: string;
  amount: number;
  description: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCustomerPortalParams {
  companyId: string;
  returnUrl?: string;
}

// Create Stripe checkout session for invoice payment
export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams,
): Promise<{ data?: StripeCheckoutSession; error?: string }> => {
  try {
    // Get company details for customer creation
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, contact_info, stripe_customer_id')
      .eq('id', params.companyId)
      .single();

    if (companyError || !company) {
      return { error: 'Company not found' };
    }

    // Create or update Stripe customer
    let customerId = company.stripe_customer_id;

    if (!customerId) {
      const customerResult = await createStripeCustomer({
        companyId: params.companyId,
        name: company.name,
        email: company.contact_info?.email,
      });

      if (customerResult.error) {
        return { error: customerResult.error };
      }

      customerId = customerResult.data?.id;
    }

    // Create checkout session via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        customerId,
        invoiceId: params.invoiceId,
        companyId: params.companyId,
        amount: params.amount,
        description: params.description,
        successUrl:
          params.successUrl || `${window.location.origin}/client-portal/billing?success=true`,
        cancelUrl:
          params.cancelUrl || `${window.location.origin}/client-portal/billing?canceled=true`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    console.error('Error creating checkout session:', err);
    return { error: 'Failed to create checkout session' };
  }
};

// Create Stripe customer for company
export const createStripeCustomer = async (params: {
  companyId: string;
  name?: string;
  email?: string;
}): Promise<{ data?: StripeCustomer; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-stripe-customer', {
      body: {
        companyId: params.companyId,
        name: params.name,
        email: params.email,
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Update company with Stripe customer ID
    if (data.customerId) {
      await supabase
        .from('companies')
        .update({ stripe_customer_id: data.customerId })
        .eq('id', params.companyId);
    }

    return { data: { id: data.customerId, email: params.email, name: params.name } };
  } catch (err) {
    console.error('Error creating Stripe customer:', err);
    return { error: 'Failed to create Stripe customer' };
  }
};

// Create customer portal session
export const createCustomerPortalSession = async (
  params: CreateCustomerPortalParams,
): Promise<{ data?: StripePortalSession; error?: string }> => {
  try {
    // Get company's Stripe customer ID
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('stripe_customer_id')
      .eq('id', params.companyId)
      .single();

    if (companyError || !company) {
      return { error: 'Company not found' };
    }

    if (!company.stripe_customer_id) {
      return { error: 'No Stripe customer found for this company' };
    }

    // Create portal session via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-customer-portal-session', {
      body: {
        customerId: company.stripe_customer_id,
        returnUrl: params.returnUrl || `${window.location.origin}/client-portal/billing`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    console.error('Error creating customer portal session:', err);
    return { error: 'Failed to create customer portal session' };
  }
};

// Get company's billing information
export const getCompanyBillingInfo = async (
  companyId: string,
): Promise<{
  data?: {
    stripeCustomerId?: string;
    plan?: any;
    usage?: any;
    invoices?: any[];
  };
  error?: string;
}> => {
  try {
    // Get company with Stripe info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('stripe_customer_id')
      .eq('id', companyId)
      .single();

    if (companyError) {
      return { error: 'Failed to fetch company billing info' };
    }

    // Get company plan
    const { data: plan, error: planError } = await supabase
      .from('company_plans')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single();

    // Get recent invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(
        `
        *,
        services (
          name,
          billing_type,
          price
        )
      `,
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get current usage (this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usage, error: usageError } = await supabase
      .from('api_usage')
      .select('cost, tokens_used, images_generated, requests_count')
      .eq('company_id', companyId)
      .gte('date', startOfMonth.toISOString().split('T')[0]);

    let totalCost = 0;
    let totalTokens = 0;
    let totalImages = 0;
    let totalRequests = 0;

    if (usage) {
      usage.forEach((item) => {
        totalCost += item.cost || 0;
        totalTokens += item.tokens_used || 0;
        totalImages += item.images_generated || 0;
        totalRequests += item.requests_count || 0;
      });
    }

    return {
      data: {
        stripeCustomerId: company?.stripe_customer_id,
        plan,
        usage: {
          totalCost,
          totalTokens,
          totalImages,
          totalRequests,
          period: 'current_month',
        },
        invoices: invoices || [],
      },
    };
  } catch (err) {
    console.error('Error fetching company billing info:', err);
    return { error: 'Failed to fetch billing information' };
  }
};
