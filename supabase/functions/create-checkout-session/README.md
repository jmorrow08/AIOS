# Create Checkout Session

This Supabase Edge Function creates secure Stripe checkout sessions for invoice payments in a multi-tenant environment.

## Overview

The function creates Stripe checkout sessions that are company-scoped, ensuring that invoices can only be paid by users from the correct company. It handles payment processing with proper validation and security.

## Features

- **Multi-Tenant Security**: Validates company ownership of invoices
- **Secure Payment Processing**: Creates Stripe checkout sessions with proper metadata
- **Invoice Validation**: Ensures invoice exists and belongs to company
- **Error Handling**: Comprehensive error responses for various failure scenarios
- **Audit Trail**: Logs checkout session creation for tracking

## API Usage

### Request Format

```typescript
POST /functions/v1/create-checkout-session
Authorization: Bearer <user-jwt>
Content-Type: application/json

{
  "customerId": "cus_stripe_customer_id",
  "invoiceId": "invoice-uuid",
  "companyId": "company-uuid",
  "amount": 250.00,
  "description": "Monthly Service - September 2024",
  "successUrl": "https://app.com/billing/success",
  "cancelUrl": "https://app.com/billing/cancel"
}
```

### Response Format

**Success Response:**

```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Error Response:**

```json
{
  "error": "Invoice not found or does not belong to company"
}
```

## Security Features

### Company Validation

- Verifies invoice belongs to the requesting company
- Prevents cross-company payment attempts
- Validates user permissions through Supabase Auth

### Stripe Security

- Uses Stripe's secure checkout flow
- Includes company and invoice metadata
- Supports test and live mode configurations

## Error Scenarios

### Validation Errors

- **Missing Parameters**: Required fields not provided
- **Invalid Company**: Invoice doesn't belong to company
- **Invoice Not Found**: Invoice UUID doesn't exist
- **Already Paid**: Invoice status is already 'paid'

### Stripe Errors

- **Invalid Customer**: Stripe customer ID doesn't exist
- **API Errors**: Stripe API connectivity issues
- **Configuration Errors**: Missing Stripe keys

## Integration Example

```typescript
import { createCheckoutSession } from '@/api/stripe';

const handlePayment = async (invoice: Invoice) => {
  try {
    const result = await createCheckoutSession({
      companyId: user.companyId,
      invoiceId: invoice.id,
      amount: invoice.amount,
      description: `Payment for Invoice ${invoice.id.slice(0, 8)}`,
      successUrl: `${window.location.origin}/billing/success`,
      cancelUrl: `${window.location.origin}/billing/cancel`,
    });

    if (result.error) {
      console.error('Checkout creation failed:', result.error);
      return;
    }

    // Redirect to Stripe Checkout
    window.location.href = result.data.url;
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

## Environment Setup

### Required Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Deployment

```bash
supabase functions deploy create-checkout-session
```

## Testing

### Test Mode

Use Stripe test keys for development:

- `pk_test_` for publishable key
- `sk_test_` for secret key

### Test Cards

```bash
# Successful payment
4242 4242 4242 4242

# Failed payment
4000 0000 0000 0002
```

### Webhook Testing

Configure test webhooks in Stripe Dashboard to test complete payment flow.

## Production Considerations

### Security

- Use live Stripe keys in production
- Configure production webhook endpoints
- Monitor payment failures and success rates
- Implement proper error logging

### Performance

- Function has built-in timeout handling
- Stripe API calls are optimized
- Database queries use proper indexing

### Monitoring

- Log all checkout session creations
- Monitor Stripe webhook delivery
- Track payment success/failure rates
- Set up alerts for failed payments

## Troubleshooting

### Common Issues

1. **"Invoice not found" Error**

   - Check invoice UUID is correct
   - Verify invoice belongs to user's company
   - Ensure invoice status is not already 'paid'

2. **"Invalid customer" Error**

   - Verify Stripe customer ID exists
   - Check customer belongs to correct company
   - Confirm customer is active in Stripe

3. **Stripe API Errors**
   - Check Stripe secret key is valid
   - Verify API keys match environment (test/live)
   - Confirm Stripe account has proper permissions

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=true
```

This will provide detailed logs for troubleshooting payment issues.
