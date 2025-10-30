# Compliance & Security Policies Panel

This document provides comprehensive guidance for the Compliance & Security Policies Panel, a enterprise-grade security and compliance management system built into the LytbuB Supabase Shell multi-tenant platform.

## Overview

The Compliance Panel provides organizations with complete control over their security policies, GDPR/CCPA compliance requirements, and automated data governance. All features are company-scoped with proper data isolation and comprehensive audit logging.

## Architecture

### Key Components

1. **Security Policies Management**

   - Company-specific security configurations
   - IP access control and authentication policies
   - API key rotation and encryption policies
   - Data retention and cleanup policies

2. **GDPR/CCPA Compliance**

   - Self-service data export requests
   - Data deletion and access request management
   - Automated compliance workflow tracking
   - Audit trail for all compliance actions

3. **Data Governance**

   - Automated data retention policies
   - Configurable cleanup schedules
   - Data category monitoring and reporting
   - Compliance audit logging

4. **Access Control**
   - IP-based login restrictions
   - Multi-factor authentication enforcement
   - Role-based access controls
   - Session management policies

## Setup Instructions

### 1. Database Migration

Run the compliance migration to create required tables:

```bash
# Apply the compliance migration
supabase db push
```

This creates the following tables:

- `security_policies` - Company security configurations
- `compliance_requests` - GDPR/CCPA request tracking
- `data_retention_logs` - Automated cleanup monitoring
- `api_keys` - Encrypted API key storage
- `audit_logs` - Security event logging

### 2. Environment Configuration

Add compliance-related environment variables:

```env
# Encryption (Required for API key security)
VITE_ENCRYPTION_KEY=your-256-bit-encryption-key-here

# Optional: IP Geolocation for enhanced security
VITE_IPINFO_API_KEY=your-ipinfo-api-key
```

### 3. Seed Data

Run the compliance seeding script:

```bash
node seed_compliance_data.js
```

This creates:

- Default security policies for test companies
- Sample compliance requests
- Test API keys with rotation policies
- Data retention monitoring data

## User Interface

### Compliance Panel (`/compliance`)

The Compliance Panel provides four main sections:

#### 1. Access Control Tab

**Features:**

- **2FA Enforcement**: Toggle multi-factor authentication requirements
- **IP Allowlist Management**: Add/remove approved IP ranges
- **CIDR Support**: Support for both individual IPs and CIDR notation
- **Real-time Validation**: IP format validation and conflict detection

**Usage:**

```typescript
// Enable 2FA for company
await updateSecurityPolicies(companyId, {
  enforce_2fa: true,
});

// Add IP to allowlist
await updateSecurityPolicies(companyId, {
  ip_allowlist: ['192.168.1.0/24', '10.0.0.1'],
});
```

#### 2. Key Management Tab

**Features:**

- **Rotation Period Configuration**: Set API key rotation intervals (30-365 days)
- **Expiration Monitoring**: Automatic detection of keys requiring renewal
- **Warning System**: Visual alerts for keys past rotation date
- **Integration with Security Panel**: Seamless connection to API key vault

**Usage:**

```typescript
// Set 90-day rotation policy
await updateSecurityPolicies(companyId, {
  key_rotation_days: 90,
});

// Check for keys needing rotation
const { flaggedKeys } = await enforceKeyRotation(companyId);
```

#### 3. Data Retention Tab

**Features:**

- **Retention Period Slider**: Configure data retention (30-1095 days)
- **Category Monitoring**: Track retention status for different data types
- **Automated Cleanup**: Background jobs for data removal
- **Compliance Reporting**: Retention policy adherence tracking

**Supported Data Categories:**

- Messages and communications
- System logs and audit trails
- File attachments and media assets
- Notification records
- Usage analytics and reports

**Usage:**

```typescript
// Set 365-day retention policy
await updateSecurityPolicies(companyId, {
  data_retention_days: 365,
});

// Run data cleanup
const { processed } = await processDataRetention(companyId);
```

#### 4. Compliance Requests Tab

**Features:**

- **Self-Service Requests**: User-initiated GDPR/CCPA requests
- **Request Types**: Export, delete, and access data requests
- **Status Tracking**: Monitor request processing status
- **Admin Management**: Admin tools for processing requests

**Request Types:**

- **Data Export**: Download all user data in machine-readable format
- **Data Deletion**: Remove all user data from the system
- **Data Access**: Review what data is stored about the user

**Usage:**

```typescript
// Create a data export request
await createComplianceRequest(companyId, userId, {
  request_type: 'export_data',
  request_reason: 'Annual data review',
});
```

## Backend API

### Compliance API (`src/api/compliance.ts`)

#### Core Functions

##### `getSecurityPolicies(companyId: string)`

Retrieves security policies for a company.

**Returns:** `SecurityPolicy` object with:

- `enforce_2fa`: Boolean 2FA requirement
- `ip_allowlist`: Array of allowed IPs/CIDR ranges
- `key_rotation_days`: API key rotation period
- `data_retention_days`: Data retention period
- `gdpr_request_enabled`: GDPR request processing status

##### `updateSecurityPolicies(companyId: string, policies: UpdateSecurityPolicyData)`

Updates security policies for a company.

##### `enforceKeyRotation(companyId: string)`

Checks for API keys that need rotation based on company policy.

**Returns:** Object with `flaggedKeys` array containing key IDs requiring renewal.

##### `applyIPRestrictions(userId: string, requestIp: string)`

Validates IP address against company allowlist during login.

**Returns:** Object with `allowed` boolean and error message if denied.

##### `processDataRetention(companyId: string)`

Executes automated data cleanup based on retention policies.

**Returns:** Object with `processed` status and cleanup statistics.

##### `createComplianceRequest(companyId: string, userId: string, requestData)`

Creates a new GDPR/CCPA compliance request.

##### `getComplianceRequests(userId: string)`

Retrieves compliance requests for a user.

## Security Features

### Data Protection

- **Encryption at Rest**: All sensitive data encrypted using AES-256
- **Row Level Security**: PostgreSQL RLS policies for data isolation
- **Audit Logging**: Comprehensive logging of all security events
- **Access Control**: Role-based permissions and company scoping

### IP Access Control

- **CIDR Support**: Support for IP ranges using CIDR notation
- **Login Validation**: IP checking during authentication process
- **Geographic Filtering**: Optional geographic restrictions
- **Admin Override**: Emergency access capabilities

### API Key Security

- **Encrypted Storage**: API keys encrypted before database storage
- **Automatic Rotation**: Configurable rotation policies
- **Masked Display**: Keys displayed with masking (\*\*\*\*last4)
- **Usage Tracking**: Monitor API key usage and last access

## Automated Jobs

### Data Retention Jobs (`src/utils/dataRetentionJob.ts`)

#### `runDataRetentionCleanup()`

**Purpose:** Automatically clean up old data based on retention policies

**Schedule:** Recommended daily execution

**Process:**

1. Query all companies with retention policies
2. Identify data older than retention period
3. Remove expired records from all data categories
4. Log cleanup operations and statistics
5. Update retention monitoring tables

#### `runKeyRotationReminder()`

**Purpose:** Send notifications about expiring API keys

**Schedule:** Recommended weekly execution

**Process:**

1. Check all companies for API keys nearing expiration
2. Calculate days until rotation required
3. Send notifications to company administrators
4. Log reminder actions

#### `runComplianceAudit()`

**Purpose:** Perform compliance audits and generate reports

**Schedule:** Recommended monthly execution

**Process:**

1. Review all companies' compliance status
2. Check policy adherence and data handling
3. Generate compliance reports
4. Flag potential issues for remediation

## Compliance Workflow

### GDPR/CCPA Request Processing

1. **Request Submission**

   - User submits request via Compliance Panel
   - Request logged with timestamp and reason
   - Status set to 'pending'

2. **Admin Review**

   - Admins receive notification of new request
   - Request details reviewed for validity
   - Status updated to 'processing'

3. **Data Processing**

   - For export requests: Data compiled and packaged
   - For deletion requests: Data marked for removal
   - For access requests: Data inventory prepared

4. **Completion**
   - Request marked as 'completed'
   - User notified of completion
   - Audit trail maintained for compliance

### Data Retention Enforcement

1. **Policy Configuration**

   - Company sets retention periods per data category
   - Policies stored in security_policies table

2. **Automated Monitoring**

   - Background jobs check data age against policies
   - Old data identified and flagged for removal

3. **Cleanup Execution**
   - Data removed according to retention policies
   - Cleanup operations logged for audit purposes
   - Retention logs updated with cleanup statistics

## Monitoring and Reporting

### Dashboard Metrics

- **Compliance Status**: Overall compliance health score
- **Active Requests**: Number of pending compliance requests
- **Data Retention**: Percentage of data within retention policies
- **Security Alerts**: Active security warnings and alerts

### Audit Logging

All compliance actions are logged with:

- **Actor Information**: User ID and role
- **Action Details**: Specific action performed
- **Target Data**: What was affected
- **Timestamp**: When action occurred
- **Company Context**: Company ID for multi-tenant isolation

## Integration Points

### Security Panel Integration

- **API Key Vault**: Compliance panel monitors key rotation status
- **Warning Banners**: Security panel displays compliance alerts
- **Audit Logs**: Shared audit logging between panels

### Authentication Integration

- **IP Validation**: Login process includes IP allowlist checking
- **2FA Enforcement**: Authentication flow respects 2FA policies
- **Session Management**: Security policies affect session handling

### Multi-Tenant Integration

- **Company Isolation**: All compliance data scoped to companies
- **RLS Policies**: Database-level security enforcement
- **Admin Oversight**: Company admins manage their own compliance

## Best Practices

### Security Configuration

1. **Regular Policy Reviews**: Review security policies quarterly
2. **IP Allowlist Maintenance**: Keep IP allowlists current
3. **Key Rotation**: Implement appropriate rotation schedules
4. **Access Monitoring**: Regularly review access logs

### Compliance Management

1. **Request Processing**: Process compliance requests within 30 days
2. **Data Accuracy**: Ensure exported data is complete and accurate
3. **Audit Preparation**: Maintain detailed audit trails
4. **User Communication**: Keep users informed of request status

### Data Governance

1. **Retention Policies**: Set appropriate retention periods
2. **Data Classification**: Categorize data by sensitivity and retention needs
3. **Cleanup Monitoring**: Monitor automated cleanup processes
4. **Backup Strategy**: Ensure proper backups before data deletion

## Troubleshooting

### Common Issues

1. **IP Access Denied**

   - Check IP allowlist configuration
   - Verify CIDR notation is correct
   - Confirm user's company assignment

2. **Compliance Request Errors**

   - Validate user permissions
   - Check company policy settings
   - Review request data format

3. **Data Retention Failures**
   - Verify retention policy configuration
   - Check database permissions
   - Review cleanup job logs

### Debug Tools

- **Compliance Logs**: Check audit_logs table for compliance events
- **Security Policies**: Review security_policies table for configuration
- **Data Retention Logs**: Monitor data_retention_logs for cleanup status
- **API Key Status**: Check api_keys table for key rotation status

## Future Enhancements

### Planned Features

- **Advanced IP Controls**: Geographic and time-based restrictions
- **Automated Compliance Reports**: Scheduled compliance status reports
- **Data Classification**: Automatic data sensitivity classification
- **Integration APIs**: Third-party compliance tool integration
- **Advanced Analytics**: Detailed compliance metrics and trends
- **Automated Remediation**: Self-healing compliance issues

### Security Enhancements

- **Zero-Trust Architecture**: Enhanced authentication and authorization
- **Advanced Encryption**: End-to-end encryption for sensitive data
- **Real-time Monitoring**: Live security event monitoring
- **Threat Detection**: Automated security threat detection
- **Incident Response**: Automated incident response workflows

---

**Note:** This compliance system is designed to help organizations meet GDPR, CCPA, and other data protection requirements. However, compliance is a shared responsibility between the platform and its users. Organizations should consult with legal experts to ensure their specific compliance needs are met.
