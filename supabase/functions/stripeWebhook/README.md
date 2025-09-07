# Stripe Webhook Handler

This Supabase Edge Function handles Stripe webhook events, specifically processing `checkout.session.completed` events to update invoice status and create transaction records.

## Features

- Listens for `checkout.session.completed` events from Stripe
- Updates invoice status to 'paid' and sets `paid_date`
- Creates a transaction record linked to the invoice
- Returns proper HTTP status codes for webhook responses

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

When creating checkout sessions in Stripe, include the invoice ID in the session metadata:

```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Invoice Payment',
        },
        unit_amount: amountInCents,
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: 'https://your-app.com/success',
  cancel_url: 'https://your-app.com/cancel',
  metadata: {
    invoice_id: 'your-invoice-uuid-here', // Required for webhook processing
  },
});
```

### Webhook Flow

1. Stripe sends `checkout.session.completed` event to the webhook endpoint
2. Function extracts the `invoice_id` from session metadata
3. Updates the invoice status to 'paid' and sets `paid_date` to current date
4. Creates a new transaction record with:
   - `invoice_id`: The invoice that was paid
   - `amount`: The invoice amount
   - `payment_method`: 'stripe'
5. Returns 200 success response

## Security Notes

- ✅ **Webhook signature verification is implemented** using HMAC-SHA256
- The function verifies that webhook requests are genuinely from Stripe
- The function uses the service role key to bypass RLS policies for server-side operations
- **Important**: Keep your `STRIPE_WEBHOOK_SECRET` secure and never expose it in client-side code

## Error Handling

The function handles various error scenarios:

- Missing or invalid webhook signatures
- Unsupported event types
- Missing invoice ID in metadata
- Database operation failures

All errors are logged to the console and return appropriate HTTP status codes.
