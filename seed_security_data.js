/**
 * Security Panel Seed Data Script
 *
 * This script seeds the security panel with sample data for testing.
 * Run with: node seed_security_data.js
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

// Sample data for testing
const sampleData = {
  // Sample API keys (these will be encrypted when stored)
  apiKeys: [
    {
      service: 'openai',
      apiKey: 'sk-test1234567890abcdef1234567890abcdef1234567890', // Fake key for testing
    },
    {
      service: 'stripe',
      apiKey: 'sk_test_1234567890abcdef1234567890abcdef1234567890', // Fake key for testing
    },
    {
      service: 'anthropic',
      apiKey: 'sk-ant-test1234567890abcdef1234567890abcdef1234567890', // Fake key for testing
    },
  ],

  // Sample audit logs
  auditLogs: [
    {
      action: 'create_api_key',
      target: 'api_key:openai',
      details: {
        service: 'openai',
        masked_key: 'sk-****1234',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    },
    {
      action: 'use_api_key',
      target: 'api_key:openai',
      details: {
        service: 'openai',
        endpoint: 'chat/completions',
        tokens_used: 150,
        cost: 0.00225,
      },
    },
    {
      action: 'create_api_key',
      target: 'api_key:stripe',
      details: {
        service: 'stripe',
        masked_key: 'sk_test_****5678',
        ip_address: '192.168.1.100',
      },
    },
    {
      action: 'view_api_key',
      target: 'api_key:openai',
      details: {
        service: 'openai',
        action: 'viewed_masked_key',
      },
    },
    {
      action: 'login',
      target: 'user:admin@acme.com',
      details: {
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        success: true,
      },
    },
  ],

  // Sample security settings
  securitySettings: [
    {
      setting_key: 'two_factor_enforced',
      setting_value: false,
    },
    {
      setting_key: 'key_rotation_days',
      setting_value: 90,
    },
    {
      setting_key: 'audit_retention_days',
      setting_value: 365,
    },
    {
      setting_key: 'max_failed_login_attempts',
      setting_value: 5,
    },
    {
      setting_key: 'session_timeout_minutes',
      setting_value: 480, // 8 hours
    },
    {
      setting_key: 'password_min_length',
      setting_value: 12,
    },
    {
      setting_key: 'require_special_characters',
      setting_value: true,
    },
  ],
};

async function seedSecurityData() {
  console.log('🌱 Starting security data seeding...');

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

    // Clear existing data for this company (optional - uncomment if needed)
    // console.log('🧹 Clearing existing security data...');
    // await supabase.from('audit_logs').delete().eq('actor_id', adminUser.id);
    // await supabase.from('api_keys').delete().eq('company_id', company.id);
    // await supabase.from('security_settings').delete().eq('company_id', company.id);

    // Seed API keys
    console.log('🔑 Seeding API keys...');
    for (const keyData of sampleData.apiKeys) {
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          company_id: company.id,
          service: keyData.service,
          key_encrypted: `ENCRYPTED_${keyData.apiKey}`, // In real usage, this would be properly encrypted
          last_used: keyData.service === 'openai' ? new Date().toISOString() : null,
        })
        .select();

      if (error) {
        console.error(`❌ Failed to seed ${keyData.service} API key:`, error);
      } else {
        console.log(`✅ Seeded ${keyData.service} API key`);

        // Create corresponding audit log
        await supabase.from('audit_logs').insert({
          actor_id: adminUser.id,
          action: 'create_api_key',
          target: `api_key:${keyData.service}`,
          details: {
            service: keyData.service,
            masked_key: `****${keyData.apiKey.slice(-4)}`,
            seeded: true,
          },
        });
      }
    }

    // Seed audit logs
    console.log('📋 Seeding audit logs...');
    for (const logData of sampleData.auditLogs) {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          actor_id: adminUser.id,
          action: logData.action,
          target: logData.target,
          details: logData.details,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random time in last 7 days
        })
        .select();

      if (error) {
        console.error(`❌ Failed to seed audit log for ${logData.action}:`, error);
      } else {
        console.log(`✅ Seeded audit log: ${logData.action}`);
      }
    }

    // Seed security settings
    console.log('⚙️ Seeding security settings...');
    for (const setting of sampleData.securitySettings) {
      const { data, error } = await supabase
        .from('security_settings')
        .upsert({
          company_id: company.id,
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
        })
        .select();

      if (error) {
        console.error(`❌ Failed to seed security setting ${setting.setting_key}:`, error);
      } else {
        console.log(`✅ Seeded security setting: ${setting.setting_key}`);
      }
    }

    console.log('🎉 Security data seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${sampleData.apiKeys.length} API keys seeded`);
    console.log(`   • ${sampleData.auditLogs.length} audit logs seeded`);
    console.log(`   • ${sampleData.securitySettings.length} security settings seeded`);
    console.log('');
    console.log('🔍 Test the security panel by:');
    console.log('   1. Running the application');
    console.log('   2. Navigating to the Security Panel');
    console.log('   3. Verifying masked API keys are displayed');
    console.log('   4. Checking audit logs show the seeded activities');
    console.log('   5. Testing the settings toggles and inputs');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedSecurityData().catch(console.error);
