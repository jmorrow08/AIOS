import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

/**
 * Verify Stripe webhook signature
 */
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    const elements = signature.split(',');
    const sigElements: { [key: string]: string } = {};

    for (const element of elements) {
      const [key, value] = element.split('=');
      sigElements[key] = value;
    }

    const timestamp = sigElements.t;
    const expectedSignature = sigElements.v1;

    if (!timestamp || !expectedSignature) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));

    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return computedSignature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

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
    // Get webhook secret from environment
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!stripeWebhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET environment variable not set');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Get request body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Missing Stripe signature', { status: 400 });
    }

    // Verify webhook signature
    const isValidSignature = await verifyStripeSignature(body, signature, stripeWebhookSecret);
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 400 });
    }

    // Parse the webhook payload
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      return new Response('Invalid JSON payload', { status: 400 });
    }

    // Only process checkout.session.completed events
    if (event.type !== 'checkout.session.completed') {
      return new Response('Event type not supported', { status: 200 });
    }

    const session = event.data.object;

    // Extract invoice ID and company ID from metadata
    const invoiceId = session.metadata?.invoice_id;
    const companyId = session.metadata?.company_id;
    const customerId = session.customer;

    if (!invoiceId) {
      console.error('No invoice ID found in session metadata');
      return new Response('Invoice ID missing', { status: 400 });
    }

    if (!companyId) {
      console.error('No company ID found in session metadata');
      return new Response('Company ID missing', { status: 400 });
    }

    // Initialize Supabase client with service role key for server-side operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, update the company's stripe_customer_id if not already set
    if (customerId) {
      const { error: customerUpdateError } = await supabase
        .from('companies')
        .update({ stripe_customer_id: customerId })
        .eq('id', companyId);

      if (customerUpdateError) {
        console.error('Error updating company stripe_customer_id:', customerUpdateError);
        // Continue processing - this isn't critical for payment processing
      }
    }

    // Update invoice status to 'paid' and set paid_date
    const paidDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: paidDate,
      })
      .eq('id', invoiceId)
      .eq('company_id', companyId) // Ensure invoice belongs to the company
      .select()
      .single();

    if (invoiceError) {
      console.error('Error updating invoice:', invoiceError);
      return new Response('Failed to update invoice', { status: 500 });
    }

    if (!invoice) {
      console.error('Invoice not found or does not belong to company');
      return new Response('Invoice not found', { status: 404 });
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          invoice_id: invoiceId,
          amount: invoice.amount,
          payment_method: 'stripe',
        },
      ])
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Note: Invoice is already marked as paid, so we don't rollback
      // You might want to handle this differently based on your business logic
    }

    // Log the successful payment in activity_log if the table exists
    try {
      const { error: activityError } = await supabase.from('activity_log').insert([
        {
          company_id: companyId,
          action: 'payment_processed',
          details: {
            invoice_id: invoiceId,
            amount: invoice.amount,
            stripe_session_id: session.id,
            customer_id: customerId,
          },
          created_by: null, // System action
        },
      ]);

      if (activityError) {
        console.error('Error logging activity:', activityError);
        // Don't fail the webhook for logging errors
      }
    } catch (activityLogError) {
      console.error('Activity log error (table may not exist):', activityLogError);
    }

    console.log('Invoice marked as paid:', invoiceId);
    console.log('Transaction created:', transaction?.id);
    console.log('Stripe customer ID stored for company:', companyId);

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: invoiceId,
        transaction_id: transaction?.id,
        company_id: companyId,
        stripe_customer_id: customerId,
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
    console.error('Webhook error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
