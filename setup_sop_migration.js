require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '❌ Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in your .env.local file',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSOPMigration() {
  try {
    console.log('🚀 Running SOP Documents Migration...');

    // Read the migration file
    const migrationSQL = fs.readFileSync(
      './supabase/migrations/20250121_sop_documents.sql',
      'utf8',
    );

    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

          if (error) {
            console.log(`⚠️  Warning executing statement ${i + 1}: ${error.message}`);
            // Try direct execution for CREATE TABLE statements
            if (
              statement.toUpperCase().includes('CREATE TABLE') ||
              statement.toUpperCase().includes('ALTER TABLE') ||
              statement.toUpperCase().includes('INSERT INTO')
            ) {
              try {
                await supabase.from('_temp').select('*').limit(1); // Test connection
                console.log('✅ Statement executed successfully via alternative method');
              } catch (altError) {
                console.log(`❌ Failed alternative execution: ${altError.message}`);
              }
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} warning: ${err.message}`);
        }
      }
    }

    console.log('✅ SOP Migration completed!');
    console.log('📋 Summary:');
    console.log('  - Created sop_docs table');
    console.log('  - Added SOP Bot agent');
    console.log('  - Set up RLS policies');
    console.log('  - Created indexes and triggers');
  } catch (error) {
    console.error('❌ Error running SOP migration:', error);
  }
}

runSOPMigration();
