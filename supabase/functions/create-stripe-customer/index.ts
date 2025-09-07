import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY environment variable not set');
      return new Response('Stripe secret key not configured', { status: 500 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { companyId, name, email } = await req.json();

    if (!companyId) {
      return new Response('Company ID is required', { status: 400 });
    }

    // Check if company already has a Stripe customer
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('stripe_customer_id, name, contact_info')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return new Response('Company not found', { status: 404 });
    }

    if (company.stripe_customer_id) {
      // Return existing customer
      return new Response(
        JSON.stringify({
          customerId: company.stripe_customer_id,
          existing: true,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        },
      );
    }

    // Create new Stripe customer
    const customerData: any = {
      metadata: {
        company_id: companyId,
        supabase_company_id: companyId,
      },
    };

    // Add name if provided or from company
    if (name || company.name) {
      customerData.name = name || company.name;
    }

    // Add email if provided or from contact_info
    if (email || company.contact_info?.email) {
      customerData.email = email || company.contact_info?.email;
    }

    const customer = await stripe.customers.create(customerData);

    return new Response(
      JSON.stringify({
        customerId: customer.id,
        existing: false,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error('Create Stripe customer error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
