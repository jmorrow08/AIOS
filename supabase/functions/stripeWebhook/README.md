# Stripe Webhook Handler (Multi-Tenant)

This Supabase Edge Function handles Stripe webhook events in a multi-tenant environment, processing `checkout.session.completed` events to update invoice status, create transaction records, and maintain company data isolation.

## Features

- **Multi-Tenant Support**: Processes payments with company context validation
- **Company Data Isolation**: Ensures invoices belong to the correct company
- **Stripe Customer Management**: Updates company Stripe customer IDs
- **Comprehensive Logging**: Activity logging for audit trails
- **Secure Processing**: Validates company ownership before processing payments
- **Transaction Records**: Creates detailed payment transaction records
- **Error Handling**: Robust error handling with proper HTTP responses

## Setup

### 1. Environment Variables

Ensure the following environment variables are set in your Supabase project:

**Required for the webhook function:**

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (required for bypassing RLS)
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret (starts with `whsec_`)

**Required for the frontend:**

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

#### Setting Environment Variables in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to Project Settings → Edge Functions
3. Add the following environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### 2. Stripe Webhook Configuration

1. In your Stripe Dashboard, create a new webhook endpoint pointing to:

   ```
   https://your-project-id.supabase.co/functions/v1/stripeWebhook
   ```

2. Select the `checkout.session.completed` event to listen for

3. Copy the webhook signing secret (starts with `whsec_`) and add it as the `STRIPE_WEBHOOK_SECRET` environment variable

### 3. Deploy the Function

```bash
# Deploy to Supabase
supabase functions deploy stripeWebhook

# Test locally (optional)
supabase functions serve stripeWebhook --no-verify-jwt
```

### 4. Testing the Webhook

#### Using Stripe CLI (Recommended):

1. Install Stripe CLI and login:

   ```bash
   stripe login
   ```

2. Forward webhook events to your local function:

   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripeWebhook
   ```

3. Use Stripe's test mode to create a test payment and trigger the webhook

#### Manual Testing:

You can also test the webhook using tools like:

- Postman
- curl
- Stripe's webhook testing tools in the Dashboard

## Usage

### Creating Stripe Checkout Sessions

When creating checkout sessions in Stripe, include both invoice ID and company ID in the session metadata for proper multi-tenant processing:

```javascript
const session = await stripe.checkout.sessions.create({
  customer: 'cus_stripe_customer_id', // Link to existing Stripe customer
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Invoice Payment',
          description: `Invoice ${invoiceId.slice(0, 8)}`,
        },
        unit_amount: amountInCents,
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: `${window.location.origin}/client-portal/billing?success=true`,
  cancel_url: `${window.location.origin}/client-portal/billing?canceled=true`,
  metadata: {
    invoice_id: 'your-invoice-uuid-here', // Required for invoice processing
    company_id: 'your-company-uuid-here', // Required for multi-tenant validation
  },
});
```

### Multi-Tenant Webhook Flow

1. **Stripe Event Reception**: Receives `checkout.session.completed` event
2. **Signature Verification**: Validates webhook signature using HMAC-SHA256
3. **Metadata Extraction**: Extracts `invoice_id` and `company_id` from session metadata
4. **Company Validation**: Verifies invoice belongs to the specified company
5. **Customer ID Update**: Updates company's `stripe_customer_id` if not set
6. **Invoice Processing**: Updates invoice status to 'paid' and sets `paid_date`
7. **Transaction Creation**: Creates detailed transaction record with company context
8. **Activity Logging**: Logs payment event in company activity log
9. **Response**: Returns success/failure response with detailed information

### Security Features

- **Company Isolation**: Validates all operations against company ownership
- **Data Integrity**: Ensures invoice belongs to company before processing
- **Audit Trail**: Comprehensive logging of all payment activities
- **Error Recovery**: Graceful handling of partial failures
- **Signature Security**: Cryptographic verification of webhook authenticity

## Security Notes

- ✅ **Webhook signature verification is implemented** using HMAC-SHA256
- The function verifies that webhook requests are genuinely from Stripe
- The function uses the service role key to bypass RLS policies for server-side operations
- **Important**: Keep your `STRIPE_WEBHOOK_SECRET` secure and never expose it in client-side code

## Error Handling

The function handles various multi-tenant error scenarios:

### Validation Errors

- **Missing Metadata**: `invoice_id` or `company_id` not provided in session metadata
- **Invalid Company**: Invoice does not belong to the specified company
- **Invoice Not Found**: Invoice UUID does not exist in database
- **Already Paid**: Invoice status is already 'paid'

### Security Errors

- **Invalid Signature**: Webhook signature verification fails
- **Unauthorized Access**: Attempt to access data outside company scope

### Processing Errors

- **Database Failures**: Invoice update or transaction creation fails
- **Stripe API Errors**: Issues with Stripe customer operations
- **Partial Failures**: Some operations succeed while others fail

### Error Response Format

```json
{
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "company_id": "company-uuid",
  "invoice_id": "invoice-uuid"
}
```

All errors are logged with full context and return appropriate HTTP status codes for proper webhook retry handling.
