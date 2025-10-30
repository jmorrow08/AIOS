# Multi-Tenant Architecture

This document describes the multi-tenant architecture implementation in the LytbuB Supabase Shell, including company data isolation, Row Level Security (RLS) policies, and administrative controls.

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
- Security Policies (`company_id`)
- Compliance Requests (`company_id`)
- Data Retention Logs (`company_id`)
- API Keys (`company_id`)
- Audit Logs (actor_id + company context)

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

### 4. Compliance Administrators

- Access to company's security policies and compliance settings
- Can manage IP allowlists and access controls
- Can process GDPR/CCPA compliance requests
- Can configure data retention policies

## Company Management

### Creating Companies

1. **Admin Portal**: Admins can create new companies
2. **Auto-Setup**: System creates default company plan
3. **Stripe Integration**: Auto-creates Stripe customer
4. **Initial Configuration**: Sets up default settings
5. **Security Policies**: Creates default security policies and compliance settings
6. **Compliance Setup**: Initializes GDPR compliance request handling

### Compliance Management

Each company gets its own compliance environment:

- **Security Policies**: Company-specific security configurations
- **IP Access Control**: Company-scoped IP allowlists and restrictions
- **Data Retention**: Company-specific data retention policies
- **Compliance Requests**: GDPR/CCPA request processing per company
- **Audit Logging**: Company-scoped security event logging

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

4. **202509XX_compliance.sql**
   - Creates security_policies table for company security configurations
   - Creates compliance_requests table for GDPR/CCPA request tracking
   - Creates data_retention_logs table for automated cleanup monitoring
   - Creates api_keys table for encrypted API key storage
   - Creates audit_logs table for comprehensive security event logging
   - Implements RLS policies for all compliance-related tables

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

### Compliance

- Configure appropriate data retention policies per company
- Set up IP access controls based on company requirements
- Regularly review and rotate API keys
- Process GDPR/CCPA requests within regulatory timeframes
- Maintain comprehensive audit trails for compliance reporting

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

4. **Compliance Access Issues**

   - Check user's company_id assignment
   - Verify compliance permissions are set
   - Confirm security policies exist for company

5. **IP Access Control Problems**

   - Validate IP allowlist format (use CIDR notation)
   - Check IP address against allowlist
   - Verify login attempt is within allowed ranges

6. **Data Retention Failures**
   - Confirm retention policies are configured
   - Check automated cleanup job permissions
   - Review data retention logs for errors

## Future Enhancements

- **Company Branding**: Custom branding per company
- **Advanced Permissions**: Granular role-based access
- **Multi-Company Users**: Users with access to multiple companies
- **Company Analytics**: Detailed usage and performance metrics
- **Automated Scaling**: Resource allocation based on company needs
- **Advanced Compliance**: Automated compliance monitoring and reporting
- **Multi-Company Compliance**: Cross-company compliance dashboards for enterprise clients
- **Compliance Automation**: AI-powered compliance policy recommendations
- **Advanced Security**: Zero-trust architecture with continuous authentication
