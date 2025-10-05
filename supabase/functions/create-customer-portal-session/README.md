# Create Customer Portal Session

This Supabase Edge Function creates Stripe Customer Portal sessions for companies, allowing clients to manage their billing information and payment methods securely.

## Overview

The function generates secure portal sessions that redirect users to Stripe's hosted customer portal, where they can manage subscriptions, payment methods, invoices, and billing information.

## Features

- **Secure Portal Access**: Creates authenticated portal sessions
- **Company Validation**: Ensures users can only access their company's portal
- **Custom Return URLs**: Configurable redirect URLs after portal usage
- **Error Handling**: Comprehensive error handling for various scenarios
- **Session Security**: Time-limited portal sessions with proper authentication

## API Usage

### Request Format

```typescript
POST /functions/v1/create-customer-portal-session
Authorization: Bearer <user-jwt>
Content-Type: application/json

{
  "customerId": "cus_stripe_customer_id",
  "returnUrl": "https://app.com/billing"
}
```

### Response Format

**Success Response:**

```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

**Error Response:**

```json
{
  "error": "Customer ID is required"
}
```

## Security Features

### Customer Validation

- Verifies Stripe customer exists
- Ensures customer belongs to requesting company
- Validates user permissions for portal access

### Session Security

- Creates time-limited portal sessions
- Uses Stripe's secure authentication
- Includes proper redirect URLs

## Portal Configuration

### Stripe Dashboard Setup

1. **Enable Customer Portal**

   ```
   Stripe Dashboard → Settings → Customer Portal
   ```

2. **Configure Features**

   - ✅ Manage subscriptions
   - ✅ Update payment methods
   - ✅ Download invoices
   - ✅ Email receipts
   - ✅ Update customer information

3. **Set Portal Configuration ID**
   ```env
   STRIPE_PORTAL_CONFIG_ID=bpc_...
   ```

### Portal Features

The customer portal allows users to:

- View and download invoices
- Update payment methods
- Update billing information
- Cancel subscriptions (if applicable)
- View payment history
- Manage email preferences

## Integration Example

```typescript
import { createCustomerPortalSession } from '@/api/stripe';

const openCustomerPortal = async () => {
  try {
    const result = await createCustomerPortalSession({
      companyId: user.companyId,
      returnUrl: window.location.href,
    });

    if (result.error) {
      console.error('Portal creation failed:', result.error);
      return;
    }

    // Open portal in new tab/window
    window.open(result.data.url, '_blank');
  } catch (error) {
    console.error('Portal error:', error);
  }
};
```

## Environment Setup

### Required Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PORTAL_CONFIG_ID=bpc_...
```

### Deployment

```bash
supabase functions deploy create-customer-portal-session
```

## Testing

### Test Mode Configuration

Use test Stripe keys and configure test portal settings.

### Test Scenarios

1. **Valid Customer**: Existing Stripe customer with portal access
2. **Invalid Customer**: Non-existent customer ID
3. **Missing Configuration**: Portal configuration not set up
4. **Permission Errors**: User without access to customer

### Portal Testing

- Test all portal features in Stripe test mode
- Verify return URLs work correctly
- Test portal session timeouts

## Production Considerations

### Security

- Use live Stripe keys in production
- Configure production portal settings
- Monitor portal access patterns
- Set up alerts for unusual activities

### User Experience

- Provide clear portal access instructions
- Handle portal session timeouts gracefully
- Implement proper loading states
- Add portal access logging

### Monitoring

- Track portal session creation
- Monitor Stripe portal usage
- Log access patterns and errors
- Set up alerts for portal failures

## Troubleshooting

### Common Issues

1. **"Customer ID is required" Error**

   - Ensure customerId is provided in request
   - Check request format and parameters

2. **"Portal configuration not set up" Error**

   - Verify STRIPE_PORTAL_CONFIG_ID is set
   - Check portal configuration in Stripe Dashboard
   - Ensure portal features are enabled

3. **Stripe API Errors**
   - Check Stripe secret key validity
   - Verify API keys match environment
   - Confirm portal configuration exists

### Debug Mode

Enable detailed logging:

```env
DEBUG=true
```

Provides comprehensive logs for portal session issues.

## Portal Customization

### Branding

Customize portal appearance in Stripe Dashboard:

- Company logo and branding
- Color scheme matching your application
- Custom messaging and support contact

### Feature Configuration

Enable/disable portal features based on your needs:

- Subscription management
- Payment method updates
- Invoice downloads
- Customer information updates

## Best Practices

### User Experience

- Provide clear "Manage Billing" buttons
- Explain what users can do in the portal
- Handle portal redirects gracefully
- Implement loading states for better UX

### Security

- Always validate customer ownership
- Use HTTPS for all portal redirects
- Monitor for suspicious portal access
- Implement proper session management

### Error Handling

- Provide meaningful error messages
- Implement retry logic for transient failures
- Log detailed error information
- Gracefully handle portal timeouts

### Monitoring

- Track portal usage metrics
- Monitor successful/failed portal sessions
- Log user portal access patterns
- Set up alerts for portal issues

## Portal Events

The function handles various portal-related events:

- **Session Creation**: Logs portal access attempts
- **Customer Updates**: Handles customer information changes
- **Payment Method Updates**: Processes payment method changes
- **Invoice Access**: Tracks invoice downloads and views

Monitor these events in your application for better customer insights.
