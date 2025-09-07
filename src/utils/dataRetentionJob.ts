import { processDataRetention } from '@/api/compliance';
import { supabase } from '@/lib/supabaseClient';

/**
 * Data Retention Cleanup Job
 * This function should be called periodically (e.g., nightly) to clean up old data
 * based on company-specific retention policies.
 */
export const runDataRetentionCleanup = async (): Promise<{
  success: boolean;
  companiesProcessed: number;
  totalRecordsDeleted: number;
  errors: string[];
}> => {
  const result = {
    success: true,
    companiesProcessed: 0,
    totalRecordsDeleted: 0,
    errors: [] as string[],
  };

  try {
    console.log('Starting data retention cleanup job...');

    // Get all companies that have security policies
    const { data: companies, error: companiesError } = await supabase
      .from('security_policies')
      .select('company_id');

    if (companiesError) {
      result.success = false;
      result.errors.push(`Failed to fetch companies: ${companiesError.message}`);
      return result;
    }

    if (!companies || companies.length === 0) {
      console.log('No companies with security policies found.');
      return result;
    }

    // Process each company's data retention
    for (const company of companies) {
      try {
        console.log(`Processing data retention for company: ${company.company_id}`);

        const { processed, error } = await processDataRetention(company.company_id);

        if (processed) {
          result.companiesProcessed++;
          // Note: We can't easily track total records deleted without more complex logic
          // In a real implementation, you'd modify processDataRetention to return this info
        } else {
          result.errors.push(`Failed to process company ${company.company_id}: ${error}`);
        }
      } catch (error: any) {
        result.errors.push(`Error processing company ${company.company_id}: ${error.message}`);
      }
    }

    console.log(
      `Data retention cleanup completed. Processed ${result.companiesProcessed} companies.`,
    );
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Unexpected error in data retention cleanup: ${error.message}`);
    console.error('Error in data retention cleanup job:', error);
  }

  return result;
};

/**
 * Key Rotation Reminder Job
 * This function can be called periodically to send reminders about expiring API keys
 */
export const runKeyRotationReminder = async (): Promise<{
  success: boolean;
  remindersSent: number;
  errors: string[];
}> => {
  const result = {
    success: true,
    remindersSent: 0,
    errors: [] as string[],
  };

  try {
    console.log('Starting key rotation reminder job...');

    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name');

    if (companiesError) {
      result.success = false;
      result.errors.push(`Failed to fetch companies: ${companiesError.message}`);
      return result;
    }

    // Process each company
    for (const company of companies) {
      try {
        // Get security policies for rotation settings
        const { data: policies, error: policyError } = await supabase
          .from('security_policies')
          .select('*')
          .eq('company_id', company.id)
          .single();

        if (policyError || !policies) continue;

        const rotationDays = policies.key_rotation_days;
        const warningDays = 30; // Warn 30 days before expiration
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (rotationDays - warningDays));

        // Find API keys that need rotation soon
        const { data: expiringKeys, error: keysError } = await supabase
          .from('api_keys')
          .select('id, service, created_at')
          .eq('company_id', company.id)
          .lt('created_at', cutoffDate.toISOString())
          .gte(
            'created_at',
            new Date(Date.now() - rotationDays * 24 * 60 * 60 * 1000).toISOString(),
          );

        if (keysError) {
          result.errors.push(
            `Failed to fetch keys for company ${company.id}: ${keysError.message}`,
          );
          continue;
        }

        if (expiringKeys && expiringKeys.length > 0) {
          // Get admin users for this company to send notifications
          const { data: admins, error: adminsError } = await supabase
            .from('users')
            .select('id, email')
            .eq('company_id', company.id)
            .eq('role', 'admin');

          if (!adminsError && admins) {
            // In a real implementation, you'd send email notifications here
            console.log(`Company ${company.name}: ${expiringKeys.length} API keys expiring soon`);

            for (const admin of admins) {
              console.log(`  - Notification would be sent to: ${admin.email}`);
              // TODO: Implement actual notification sending
            }

            result.remindersSent += admins.length;
          }
        }
      } catch (error: any) {
        result.errors.push(`Error processing company ${company.id}: ${error.message}`);
      }
    }

    console.log(`Key rotation reminder job completed. Sent ${result.remindersSent} reminders.`);
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Unexpected error in key rotation reminder job: ${error.message}`);
    console.error('Error in key rotation reminder job:', error);
  }

  return result;
};

/**
 * Compliance Audit Job
 * This function can be called periodically to perform compliance audits
 */
export const runComplianceAudit = async (): Promise<{
  success: boolean;
  auditsCompleted: number;
  issuesFound: number;
  errors: string[];
}> => {
  const result = {
    success: true,
    auditsCompleted: 0,
    issuesFound: 0,
    errors: [] as string[],
  };

  try {
    console.log('Starting compliance audit job...');

    // Get all companies with security policies
    const { data: companies, error: companiesError } = await supabase
      .from('security_policies')
      .select('company_id, *');

    if (companiesError) {
      result.success = false;
      result.errors.push(`Failed to fetch companies: ${companiesError.message}`);
      return result;
    }

    for (const policy of companies) {
      try {
        console.log(`Auditing compliance for company: ${policy.company_id}`);

        // Check for various compliance issues
        let companyIssues = 0;

        // 1. Check for API keys that haven't been rotated
        const rotationDays = policy.key_rotation_days;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - rotationDays);

        const { count: oldKeysCount, error: keysError } = await supabase
          .from('api_keys')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', policy.company_id)
          .lt('created_at', cutoffDate.toISOString());

        if (!keysError && oldKeysCount && oldKeysCount > 0) {
          companyIssues += oldKeysCount;
          console.log(`  - Found ${oldKeysCount} API keys past rotation date`);
        }

        // 2. Check data retention compliance (simplified check)
        const retentionDays = policy.data_retention_days;
        const retentionCutoff = new Date();
        retentionCutoff.setDate(retentionCutoff.getDate() - retentionDays);

        // Check audit logs
        const { count: oldAuditLogs, error: auditError } = await supabase
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .eq('actor_id', policy.company_id) // Note: This might need adjustment based on your schema
          .lt('timestamp', retentionCutoff.toISOString());

        if (!auditError && oldAuditLogs && oldAuditLogs > 0) {
          companyIssues += oldAuditLogs;
          console.log(`  - Found ${oldAuditLogs} old audit log entries`);
        }

        // Log audit results
        await supabase.from('audit_logs').insert({
          actor_id: 'system',
          action: 'system_access',
          target: `compliance_audit:${policy.company_id}`,
          details: {
            issues_found: companyIssues,
            rotation_days: rotationDays,
            retention_days: retentionDays,
            audit_timestamp: new Date().toISOString(),
          },
        });

        result.auditsCompleted++;
        result.issuesFound += companyIssues;
      } catch (error: any) {
        result.errors.push(`Error auditing company ${policy.company_id}: ${error.message}`);
      }
    }

    console.log(
      `Compliance audit completed. ${result.auditsCompleted} audits, ${result.issuesFound} issues found.`,
    );
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Unexpected error in compliance audit: ${error.message}`);
    console.error('Error in compliance audit job:', error);
  }

  return result;
};
