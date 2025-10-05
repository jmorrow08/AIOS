# Create Stripe Customer

This Supabase Edge Function creates Stripe customers for companies in a multi-tenant environment, ensuring proper customer management and billing setup.

## Overview

The function automatically creates Stripe customer records when new companies are onboarded, linking them to the company's billing information and maintaining proper data isolation.

## Features

- **Multi-Tenant Customer Creation**: Creates customers scoped to specific companies
- **Duplicate Prevention**: Checks for existing customers before creation
- **Metadata Management**: Stores company context in Stripe customer metadata
- **Error Handling**: Comprehensive error handling for various failure scenarios
- **Audit Trail**: Logs customer creation activities

## API Usage

### Request Format

```typescript
POST /functions/v1/create-stripe-customer
Authorization: Bearer <user-jwt>
Content-Type: application/json

{
  "companyId": "company-uuid",
  "name": "Acme Corporation",
  "email": "billing@acme.com"
}
```

### Response Format

**Success Response:**

```json
{
  "customerId": "cus_1234567890",
  "existing": false
}
```

**Existing Customer Response:**

```json
{
  "customerId": "cus_1234567890",
  "existing": true
}
```

**Error Response:**

```json
{
  "error": "Company not found"
}
```

## Security Features

### Company Validation

- Verifies company exists in database
- Ensures user has permission to create customers for the company
- Prevents unauthorized customer creation

### Stripe Security

- Uses Stripe's secure API with proper authentication
- Includes company metadata for audit trails
- Supports both test and live environments

## Customer Metadata

The function automatically includes the following metadata with each Stripe customer:

```json
{
  "metadata": {
    "company_id": "company-uuid",
    "supabase_company_id": "company-uuid",
    "created_by": "system"
  }
}
```

## Error Scenarios

### Validation Errors

- **Missing Company ID**: Required parameter not provided
- **Company Not Found**: Company UUID doesn't exist in database
- **Unauthorized Access**: User doesn't have permission for company

### Stripe Errors

- **API Connection**: Issues connecting to Stripe API
- **Invalid API Key**: Stripe secret key is invalid or expired
- **Duplicate Email**: Email already exists in Stripe (handled gracefully)

### Database Errors

- **Connection Issues**: Unable to connect to Supabase database
- **Transaction Failures**: Database update operations fail

## Integration Example

```typescript
import { createStripeCustomer } from '@/api/stripe';

const setupCompanyBilling = async (company: Company) => {
  try {
    // Check if company already has a Stripe customer
    if (!company.stripe_customer_id) {
      const result = await createStripeCustomer({
        companyId: company.id,
        name: company.name,
        email: company.contact_info?.email,
      });

      if (result.error) {
        console.error('Failed to create Stripe customer:', result.error);
        return;
      }

      // Update company with Stripe customer ID
      await updateCompanyStripeId(company.id, result.data.customerId);
    }
  } catch (error) {
    console.error('Customer creation error:', error);
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
supabase functions deploy create-stripe-customer
```

## Testing

### Test Mode Configuration

Use Stripe test keys for development:

- `sk_test_` for secret key
- Test email addresses that don't conflict with live data

### Test Scenarios

1. **New Customer Creation**: Company without existing Stripe customer
2. **Existing Customer**: Company with existing Stripe customer ID
3. **Error Handling**: Invalid company ID, missing permissions
4. **Duplicate Prevention**: Attempting to create customer for same company twice

### Verification

Check Stripe Dashboard → Customers to verify customer creation and metadata.

## Production Considerations

### Security

- Use live Stripe keys in production
- Implement proper API key rotation
- Monitor customer creation activities
- Set up alerts for failed customer creation

### Performance

- Function includes timeout handling
- Stripe API calls are optimized
- Database queries use proper indexing

### Monitoring

- Log all customer creation attempts
- Monitor Stripe API usage and limits
- Track customer creation success/failure rates
- Set up alerts for API failures

## Troubleshooting

### Common Issues

1. **"Company not found" Error**

   - Verify company UUID is correct
   - Check company exists in database
   - Ensure user has access to company

2. **Stripe API Errors**

   - Check Stripe secret key is valid
   - Verify API keys match environment
   - Confirm Stripe account permissions

3. **Duplicate Customer Creation**
   - Check if company already has stripe_customer_id
   - Function handles duplicates gracefully
   - Review application logic for duplicate calls

### Debug Mode

Enable detailed logging:

```env
DEBUG=true
```

This provides comprehensive logs for troubleshooting customer creation issues.

## Best Practices

### Customer Management

- Always check for existing customers before creation
- Store Stripe customer ID in company record
- Include relevant metadata for future reference
- Handle both new and existing customer scenarios

### Error Handling

- Implement retry logic for transient failures
- Provide meaningful error messages to users
- Log detailed error information for debugging
- Gracefully handle Stripe API rate limits

### Security

- Validate all input parameters
- Use secure API key storage
- Implement proper access controls
- Monitor for suspicious activities
