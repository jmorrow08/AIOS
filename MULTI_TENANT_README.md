# Multi-Tenant Architecture

This document describes the multi-tenant architecture implementation in the AI OS Supabase Shell, including company data isolation, Row Level Security (RLS) policies, and administrative controls.

## Overview

The system implements a complete multi-tenant architecture where each company (client) operates in complete isolation from others, with shared infrastructure but separate data domains. This ensures security, scalability, and proper resource allocation.

## Key Components

### 1. Company Structure

Each tenant is represented by a company record with:

- Unique company ID (UUID)
- Company details (name, contact info)
- Stripe customer ID for billing
- Associated users, services, and data

### 2. Data Isolation

All entities include a `company_id` foreign key:

- Users (`company_id`)
- Services (`company_id`)
- Invoices (`company_id`)
- Jobs (`company_id`)
- Documents (`company_id`)
- Media Assets (`company_id`)
- API Usage (`company_id`)
- AI Agents (`company_id`)
- Agent Logs (`company_id`)

### 3. Row Level Security (RLS)

PostgreSQL RLS policies enforce data access:

#### Admin Policies

```sql
-- Admins have full access to all companies
CREATE POLICY "Admins have full access to companies"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

#### Company Isolation Policies

```sql
-- Users can only see their company's data
CREATE POLICY "Users see services for their company"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = services.company_id
    )
  );
```

## User Roles

### 1. Admin Users

- Full access to all companies
- Can create and manage companies
- Access to billing and usage analytics
- System configuration management

### 2. Client Users

- Access only to their company's data
- Can manage their company's services and invoices
- Access to billing portal and usage metrics
- Limited to their company's context

### 3. Agent Users

- Limited access based on assigned permissions
- Can interact with AI agents and logs
- Restricted to their company's resources

## Company Management

### Creating Companies

1. **Admin Portal**: Admins can create new companies
2. **Auto-Setup**: System creates default company plan
3. **Stripe Integration**: Auto-creates Stripe customer
4. **Initial Configuration**: Sets up default settings

### Company Plans

Each company has a billing plan:

```sql
CREATE TABLE company_plans (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  plan_tier TEXT, -- 'starter', 'professional', 'enterprise', 'custom'
  monthly_limit_usd DECIMAL(10,2),
  features JSONB,
  is_active BOOLEAN DEFAULT true
);
```

Available Plans:

- **Starter**: $100/month, basic features
- **Professional**: $500/month, advanced features
- **Enterprise**: $2000/month, full features
- **Custom**: Negotiated pricing and features

## Usage Tracking

### Company-Specific Usage

- API usage tracked per company
- Monthly budget limits enforced
- Real-time usage monitoring
- Automated alerts for budget thresholds

### Budget Management

```sql
-- Check budget before API usage
SELECT check_budget_before_usage(company_id, agent_id, estimated_cost);

-- Log usage and update budget
SELECT log_api_usage_and_update_budget(
  company_id, service, agent_id, description, cost
);
```

## Administrative Features

### Admin Portal

- **Company Overview**: List all companies with key metrics
- **Usage Analytics**: Monitor usage across all companies
- **Billing Management**: View and manage company plans
- **System Configuration**: Global settings and maintenance

### Company Details Modal

- **Plan Information**: Current plan and limits
- **Usage Statistics**: Real-time usage metrics
- **Stripe Integration**: Customer ID and connection status
- **Activity Log**: Recent company activities

## Security Considerations

### Data Isolation

- All queries include company context validation
- RLS policies prevent cross-company data access
- Database triggers ensure data integrity

### Authentication

- Supabase Auth with custom claims
- Role-based access control
- Session management with company context

### API Security

- All endpoints validate company ownership
- Rate limiting per company
- Audit logging for sensitive operations

## Database Migrations

### Key Migration Files

1. **20250130_multi_tenant_schema_updates.sql**

   - Adds company_id to all tables
   - Creates company_plans table
   - Updates existing data with company references

2. **20250131_multi_tenant_rls_policies.sql**

   - Implements comprehensive RLS policies
   - Sets up admin and company isolation rules
   - Configures secure data access patterns

3. **20250132_company_specific_budget.sql**
   - Updates budget system for multi-tenancy
   - Company-specific usage tracking
   - Automated budget reset functions

## Best Practices

### Development

- Always include company_id in queries
- Use RLS policies for data access
- Test with multiple company contexts
- Validate company ownership in API calls

### Operations

- Monitor usage per company
- Set appropriate budget limits
- Regular backup of company data
- Plan for company-specific scaling

### Security

- Regular security audits
- Monitor for unusual usage patterns
- Implement proper logging
- Keep RLS policies updated

## Troubleshooting

### Common Issues

1. **Company Data Not Visible**

   - Check user's company_id assignment
   - Verify RLS policies are active
   - Confirm user has correct role permissions

2. **Budget Limits Not Working**

   - Verify company_config has budget settings
   - Check budget calculation functions
   - Review API usage logging

3. **Stripe Integration Issues**
   - Confirm Stripe customer ID is set
   - Check webhook configuration
   - Verify API keys and permissions

## Future Enhancements

- **Company Branding**: Custom branding per company
- **Advanced Permissions**: Granular role-based access
- **Multi-Company Users**: Users with access to multiple companies
- **Company Analytics**: Detailed usage and performance metrics
- **Automated Scaling**: Resource allocation based on company needs
