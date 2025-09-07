/**
 * Compliance & Security Policies Seed Data Script
 *
 * This script seeds compliance-related data for testing the new Compliance panel.
 * Run with: node seed_compliance_data.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample compliance data for testing
const sampleData = {
  // Sample expired API key (older than 90 days)
  expiredApiKey: {
    service: 'anthropic',
    apiKey: 'sk-ant-old1234567890abcdef1234567890abcdef1234567890', // Fake old key
    createdDaysAgo: 120, // 120 days ago - should trigger rotation warning
  },

  // Sample compliance requests
  complianceRequests: [
    {
      request_type: 'export_data',
      request_reason: 'Annual data export for tax purposes',
      status: 'completed',
    },
    {
      request_type: 'access_data',
      request_reason: 'Need to review my account data',
      status: 'pending',
    },
    {
      request_type: 'delete_data',
      request_reason: 'Requesting account deletion under GDPR',
      status: 'processing',
    },
  ],
};

async function seedComplianceData() {
  console.log('🌱 Starting compliance data seeding...');

  try {
    // Get the test company and admin user
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'Acme Corporation')
      .single();

    if (companyError || !company) {
      console.error('❌ Test company not found. Please run the main database setup first.');
      return;
    }

    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@acme.com')
      .single();

    if (userError || !adminUser) {
      console.error('❌ Admin user not found. Please run the main database setup first.');
      return;
    }

    console.log(`📍 Using company ID: ${company.id}`);
    console.log(`👤 Using admin user ID: ${adminUser.id}`);

    // First, ensure security policies exist (the migration should have created this, but let's verify)
    const { data: existingPolicy, error: policyError } = await supabase
      .from('security_policies')
      .select('*')
      .eq('company_id', company.id)
      .single();

    if (policyError && policyError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('❌ Error checking security policies:', policyError);
    } else if (!existingPolicy) {
      console.log('📋 Creating default security policies...');
      const { data: newPolicy, error: createError } = await supabase
        .from('security_policies')
        .insert({
          company_id: company.id,
          enforce_2fa: true,
          ip_allowlist: ['127.0.0.1', '192.168.1.0/24', '10.0.0.0/8'],
          key_rotation_days: 90,
          data_retention_days: 365,
          gdpr_request_enabled: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create security policies:', createError);
      } else {
        console.log('✅ Created security policies');
      }
    } else {
      console.log('✅ Security policies already exist');
    }

    // Seed an expired API key for testing rotation warnings
    console.log('🔑 Seeding expired API key for rotation testing...');
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - sampleData.expiredApiKey.createdDaysAgo);

    const { data: expiredKey, error: expiredKeyError } = await supabase
      .from('api_keys')
      .insert({
        company_id: company.id,
        service: sampleData.expiredApiKey.service,
        key_encrypted: `ENCRYPTED_EXPIRED_${sampleData.expiredApiKey.apiKey}`,
        created_at: expiredDate.toISOString(),
        updated_at: expiredDate.toISOString(),
      })
      .select()
      .single();

    if (expiredKeyError) {
      console.error('❌ Failed to seed expired API key:', expiredKeyError);
    } else {
      console.log(
        `✅ Seeded expired ${sampleData.expiredApiKey.service} API key (${sampleData.expiredApiKey.createdDaysAgo} days old)`,
      );

      // Create audit log for the expired key
      await supabase.from('audit_logs').insert({
        actor_id: adminUser.id,
        action: 'create_api_key',
        target: `api_key:${sampleData.expiredApiKey.service}`,
        details: {
          service: sampleData.expiredApiKey.service,
          masked_key: `****${sampleData.expiredApiKey.apiKey.slice(-4)}`,
          seeded: true,
          note: 'Expired key for rotation testing',
        },
        timestamp: expiredDate.toISOString(),
      });
    }

    // Seed compliance requests
    console.log('📋 Seeding compliance requests...');
    for (const requestData of sampleData.complianceRequests) {
      const requestDate = new Date();
      requestDate.setDate(requestDate.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days

      const { data: request, error: requestError } = await supabase
        .from('compliance_requests')
        .insert({
          company_id: company.id,
          user_id: adminUser.id,
          request_type: requestData.request_type,
          status: requestData.status,
          request_reason: requestData.request_reason,
          requested_at: requestDate.toISOString(),
          ...(requestData.status === 'completed' && {
            completed_at: new Date(requestDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day later
            completion_notes: 'Request processed successfully',
          }),
        })
        .select()
        .single();

      if (requestError) {
        console.error(`❌ Failed to seed compliance request:`, requestError);
      } else {
        console.log(`✅ Seeded ${requestData.request_type} request (${requestData.status})`);

        // Create audit log for the compliance request
        await supabase.from('audit_logs').insert({
          actor_id: adminUser.id,
          action: 'system_access',
          target: `compliance_request:${request.id}`,
          details: {
            request_type: requestData.request_type,
            status: requestData.status,
            seeded: true,
          },
          timestamp: requestDate.toISOString(),
        });
      }
    }

    // Seed some data retention logs
    console.log('📊 Seeding data retention logs...');
    const retentionCategories = [
      { category: 'messages', recordCount: 2500, oldestDays: 400, newestDays: 10 },
      { category: 'logs', recordCount: 15000, oldestDays: 300, newestDays: 5 },
      { category: 'files', recordCount: 500, oldestDays: 200, newestDays: 15 },
      { category: 'notifications', recordCount: 800, oldestDays: 150, newestDays: 2 },
    ];

    for (const category of retentionCategories) {
      const lastCleanup = new Date();
      lastCleanup.setDate(lastCleanup.getDate() - Math.floor(Math.random() * 30)); // Random within last 30 days

      const { data: retentionLog, error: retentionError } = await supabase
        .from('data_retention_logs')
        .insert({
          company_id: company.id,
          data_category: category.category,
          record_count: category.recordCount,
          oldest_record: new Date(
            Date.now() - category.oldestDays * 24 * 60 * 60 * 1000,
          ).toISOString(),
          newest_record: new Date(
            Date.now() - category.newestDays * 24 * 60 * 60 * 1000,
          ).toISOString(),
          retention_days: 365,
          last_cleanup: lastCleanup.toISOString(),
          next_cleanup: new Date(lastCleanup.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days later
        })
        .select()
        .single();

      if (retentionError) {
        console.error(`❌ Failed to seed retention log for ${category.category}:`, retentionError);
      } else {
        console.log(
          `✅ Seeded retention log for ${category.category} (${category.recordCount} records)`,
        );
      }
    }

    console.log('🎉 Compliance data seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('   • Security policies configured');
    console.log('   • 1 expired API key seeded (for rotation testing)');
    console.log(`   • ${sampleData.complianceRequests.length} compliance requests seeded`);
    console.log(`   • ${retentionCategories.length} data retention logs seeded`);
    console.log('');
    console.log('🔍 Test the Compliance panel by:');
    console.log('   1. Running the application');
    console.log('   2. Navigating to the Compliance page (/compliance)');
    console.log('   3. Checking Access Control tab for IP restrictions');
    console.log('   4. Checking Key Management tab for rotation warnings');
    console.log('   5. Checking Data Retention tab for cleanup logs');
    console.log('   6. Checking Compliance Requests tab for GDPR requests');
    console.log('');
    console.log('🔐 Test IP restrictions by:');
    console.log('   1. Adding 127.0.0.1 to IP allowlist');
    console.log('   2. Trying to login from a different IP (should be blocked)');
    console.log('');
    console.log('⚠️  Test rotation warnings by:');
    console.log('   1. Going to Security Panel');
    console.log('   2. Looking for orange warning banner about expired keys');
    console.log('   3. Clicking "Manage Compliance" link');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedComplianceData().catch(console.error);
