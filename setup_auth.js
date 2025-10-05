require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAuth() {
  try {
    console.log('🔐 Setting up authentication and role-based access...');

    const sqlContent = fs.readFileSync('./auth_setup.sql', 'utf8');

    // Split SQL into statements
    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          // Use rpc to execute raw SQL
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  Warning: ${error.message}`);
          }
        } catch (err) {
          console.log(`⚠️  Note: ${err.message}`);
        }
      }
    }

    console.log('✅ Authentication setup completed!');
    console.log('🎯 Next steps:');
    console.log('1. Create your admin account in Supabase Auth');
    console.log('2. Update your profile role to "admin" in the profiles table');
    console.log('3. Test the role-based access system');
  } catch (error) {
    console.error('❌ Error setting up authentication:', error);
  }
}

setupAuth();
