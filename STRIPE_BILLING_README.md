# Stripe Billing Integration

This document provides comprehensive guidance for the Stripe billing integration in the AI OS Supabase Shell multi-tenant platform.

## Overview

The platform integrates Stripe for complete billing management, including customer creation, payment processing, subscription management, and customer portal access. All billing operations are company-scoped with proper data isolation.

## Architecture

### Key Components

1. **Stripe Customer Management**

   - Auto-creation of Stripe customers per company
   - Customer metadata with company_id references
   - Secure customer ID storage in companies table

2. **Payment Processing**

   - Checkout sessions for invoice payments
   - Webhook-driven payment completion
   - Transaction record creation and updates

3. **Customer Portal**

   - Self-service billing management
   - Payment method updates
   - Invoice history and downloads

4. **Usage-Based Billing**
   - Real-time API usage tracking
   - Company-specific budget limits
   - Automated billing alerts

## Setup Instructions

### 1. Stripe Dashboard Configuration

#### Create Products and Prices

```bash
# Example pricing structure
Starter Plan: $100/month
- 1000 API requests
- 5GB storage
- Email support

Professional Plan: $500/month
- 10000 API requests
- 50GB storage
- Priority support

Enterprise Plan: $2000/month
- Unlimited API requests
- 500GB storage
- Dedicated support
```

#### Configure Customer Portal

1. Go to Stripe Dashboard → Settings → Customer Portal
2. Enable features:
   - Manage subscriptions
   - Update payment methods
   - Download invoices
   - Email receipts
3. Note the Portal Configuration ID for environment variables

### 2. Environment Configuration

```env
# Required for billing functionality
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PORTAL_CONFIG_ID=bpc_...
```

### 3. Supabase Edge Functions Deployment

```bash
# Deploy all Stripe-related functions
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout-session
supabase functions deploy create-stripe-customer
supabase functions deploy create-customer-portal-session
```

## API Integration

### Creating Stripe Customers

```typescript
import { createStripeCustomer } from '@/api/stripe';

// Auto-creates customer when company is created
const customerResult = await createStripeCustomer({
  companyId: 'company-uuid',
  name: 'Acme Corporation',
  email: 'billing@acme.com',
});
```

### Checkout Sessions

```typescript
import { createCheckoutSession } from '@/api/stripe';

// Create payment session for invoice
const sessionResult = await createCheckoutSession({
  companyId: 'company-uuid',
  invoiceId: 'invoice-uuid',
  amount: 250.0,
  description: 'Monthly Service - September 2024',
  successUrl: `${window.location.origin}/billing/success`,
  cancelUrl: `${window.location.origin}/billing/cancel`,
});

// Redirect to Stripe Checkout
window.location.href = sessionResult.data.url;
```

### Customer Portal Access

```typescript
import { createCustomerPortalSession } from '@/api/stripe';

// Open customer portal for self-service billing
const portalResult = await createCustomerPortalSession({
  companyId: 'company-uuid',
  returnUrl: window.location.href,
});

// Open portal in new tab
window.open(portalResult.data.url, '_blank');
```

## Webhook Configuration

### Stripe Webhook Setup

1. **Create Webhook Endpoint**

   ```
   URL: https://your-project.supabase.co/functions/v1/stripe-webhook
   Events: checkout.session.completed
   ```

2. **Webhook Secret**
   - Copy the webhook signing secret
   - Add to environment as `STRIPE_WEBHOOK_SECRET`

### Webhook Processing

The webhook handler:

- Verifies Stripe signature
- Validates company ownership
- Updates invoice status to 'paid'
- Creates transaction records
- Logs activity for audit trail

```typescript
// Webhook payload includes company context
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "metadata": {
        "company_id": "company-uuid",
        "invoice_id": "invoice-uuid"
      },
      "customer": "cus_..."
    }
  }
}
```

## Billing Workflow

### 1. Company Onboarding

```typescript
// When creating a new company
const company = await createCompany({
  name: 'New Client Corp',
  contact_info: { email: 'billing@client.com' },
});

// Auto-create Stripe customer
await createStripeCustomer({
  companyId: company.id,
  name: company.name,
  email: company.contact_info.email,
});
```

### 2. Plan Assignment

```sql
-- Assign billing plan to company
INSERT INTO company_plans (
  company_id,
  plan_tier,
  monthly_limit_usd,
  features
) VALUES (
  'company-uuid',
  'professional',
  500.00,
  '{"api_requests": 10000, "storage_gb": 50}'
);
```

### 3. Usage Tracking

```typescript
// Track API usage with company context
await logApiUsage({
  companyId: 'company-uuid',
  service: 'openai',
  cost: 0.002,
  tokensUsed: 150,
  description: 'Chat completion',
});
```

### 4. Invoice Generation

```typescript
// Create invoice for company
const invoice = await createInvoice({
  companyId: 'company-uuid',
  serviceId: 'service-uuid',
  amount: 500.0,
  dueDate: '2024-10-01',
});
```

### 5. Payment Processing

```typescript
// Create checkout session for payment
const session = await createCheckoutSession({
  companyId: 'company-uuid',
  invoiceId: invoice.id,
  amount: invoice.amount,
  description: `Invoice ${invoice.id.slice(0, 8)}`,
});

// Customer completes payment on Stripe
// Webhook updates invoice status automatically
```

## Admin Features

### Company Billing Overview

- View all companies with billing status
- Monitor usage vs. plan limits
- Track payment history and outstanding invoices
- Manage plan upgrades/downgrades

### Usage Analytics

```sql
-- Get company usage summary
SELECT
  c.name,
  cp.plan_tier,
  cp.monthly_limit_usd,
  COALESCE(SUM(au.cost), 0) as current_usage,
  COUNT(au.id) as total_requests
FROM companies c
LEFT JOIN company_plans cp ON c.id = cp.company_id
LEFT JOIN api_usage au ON c.id = au.company_id
  AND au.date >= DATE_TRUNC('month', CURRENT_DATE)
WHERE cp.is_active = true
GROUP BY c.id, c.name, cp.plan_tier, cp.monthly_limit_usd;
```

## Client Features

### Billing Portal Access

- View current plan and usage
- Access Stripe Customer Portal
- Download invoices and receipts
- Update payment methods
- View billing history

### Usage Monitoring

```typescript
// Get company billing information
const billingInfo = await getCompanyBillingInfo(companyId);

console.log('Current Plan:', billingInfo.plan?.plan_tier);
console.log('Monthly Limit:', billingInfo.plan?.monthly_limit_usd);
console.log('Current Usage:', billingInfo.usage?.totalCost);
console.log('Usage %:', (billingInfo.usage?.totalCost / billingInfo.plan?.monthly_limit_usd) * 100);
```

## Security Considerations

### Data Protection

- Company data isolated by RLS policies
- Stripe customer IDs encrypted at rest
- Webhook signatures verified on all requests

### PCI Compliance

- No credit card data stored locally
- All payment processing handled by Stripe
- Secure token-based payment methods

### Access Control

- Admin-only access to billing configuration
- Company-scoped access to billing data
- Audit logging for all billing operations

## Error Handling

### Common Issues

1. **Webhook Signature Verification Fails**

   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint is accessible
   - Verify Stripe webhook configuration

2. **Customer Creation Fails**

   - Check Stripe API keys are valid
   - Verify company data is complete
   - Check for duplicate email addresses

3. **Checkout Session Errors**
   - Validate invoice belongs to company
   - Check invoice is not already paid
   - Verify amount is positive

### Monitoring

```typescript
// Log billing events for monitoring
await supabase.from('activity_log').insert({
  company_id: companyId,
  action: 'billing_event',
  details: {
    event_type: 'payment_failed',
    error_message: error.message,
    invoice_id: invoiceId,
  },
});
```

## Testing

### Test Mode Setup

1. Use Stripe test keys (`pk_test_`, `sk_test_`)
2. Create test products and prices
3. Use test card numbers for payments
4. Configure test webhooks

### Test Scenarios

- Successful payment completion
- Failed payment handling
- Webhook retry logic
- Customer portal access
- Usage limit enforcement

## Production Deployment

### Pre-Launch Checklist

- [ ] Stripe account configured for live mode
- [ ] Live API keys set in environment
- [ ] Production webhook endpoints configured
- [ ] Customer portal settings finalized
- [ ] Test payments with real cards
- [ ] Monitor webhook delivery
- [ ] Set up billing alerts

### Go-Live Process

1. Update environment variables for production
2. Deploy updated Edge Functions
3. Configure production webhooks
4. Test end-to-end payment flow
5. Enable live customer portal
6. Monitor first transactions

## Support and Troubleshooting

### Stripe Dashboard

- Monitor payments and customers
- View webhook delivery status
- Check failed payment logs
- Access customer portal analytics

### Common Support Queries

1. **Payment Failed**: Check card details, funds, or contact bank
2. **Invoice Not Updated**: Check webhook delivery, retry if needed
3. **Portal Access Issues**: Verify customer ID, check portal configuration
4. **Usage Limits**: Review plan settings, upgrade if needed

## Future Enhancements

- **Subscription Management**: Recurring billing cycles
- **Proration**: Partial billing for plan changes
- **Discounts and Coupons**: Promotional pricing
- **Multi-Currency**: International payment support
- **Advanced Analytics**: Detailed billing insights
- **Automated Dunning**: Failed payment recovery
