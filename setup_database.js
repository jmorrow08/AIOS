require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // or service role key for schema changes

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database tables...');

    // Read and execute SQL files
    const sqlFiles = ['jobs_table.sql', 'invoices_table.sql', 'documents_table.sql'];

    for (const file of sqlFiles) {
      console.log(`📄 Executing ${file}...`);

      const sqlContent = fs.readFileSync(path.join(__dirname, file), 'utf8');

      // Split SQL into individual statements (basic approach)
      const statements = sqlContent
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
              console.log(`⚠️  Warning executing statement: ${error.message}`);
            }
          } catch (err) {
            console.log(`⚠️  Warning: ${err.message}`);
          }
        }
      }
    }

    console.log('✅ Database setup completed!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

setupDatabase();
