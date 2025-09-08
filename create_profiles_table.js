require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '❌ Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file',
  );
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProfilesTable() {
  try {
    console.log('🔐 Creating profiles table...');

    // Create the profiles table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'client')) DEFAULT 'client',
        company_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (tableError) {
      console.log('⚠️  Could not use exec_sql, trying direct approach...');

      // Try direct approach if exec_sql doesn't work
      try {
        const { error } = await supabase.from('profiles').select('*').limit(1);
        if (error && error.message.includes('Could not find the table')) {
          console.log(
            '❌ Profiles table does not exist. Please create it manually in Supabase dashboard:',
          );
          console.log('');
          console.log('SQL to run:');
          console.log(createTableSQL);
          console.log('');
          console.log('Then run the RLS policies:');
          console.log(`
            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "Users can view their own profile" ON public.profiles
              FOR SELECT USING (auth.uid() = id);

            CREATE POLICY "Users can update their own profile" ON public.profiles
              FOR UPDATE USING (auth.uid() = id);

            CREATE POLICY "Admins can view all profiles" ON public.profiles
              FOR SELECT USING (
                EXISTS (
                  SELECT 1 FROM public.profiles
                  WHERE id = auth.uid() AND role = 'admin'
                )
              );

            CREATE POLICY "Admins can update all profiles" ON public.profiles
              FOR UPDATE USING (
                EXISTS (
                  SELECT 1 FROM public.profiles
                  WHERE id = auth.uid() AND role = 'admin'
                )
              );
          `);
          return;
        }
      } catch (err) {
        console.log('❌ Error checking profiles table:', err.message);
      }
    } else {
      console.log('✅ Profiles table created successfully!');
    }

    // Enable RLS
    console.log('🔒 Setting up Row Level Security...');
    const rlsSQL = `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`;
    await supabase.rpc('exec_sql', { sql: rlsSQL });

    // Create RLS policies
    const policiesSQL = `
      CREATE POLICY "Users can view their own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);

      CREATE POLICY "Users can update their own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);

      CREATE POLICY "Admins can view all profiles" ON public.profiles
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      CREATE POLICY "Admins can update all profiles" ON public.profiles
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
          )
        );
    `;

    await supabase.rpc('exec_sql', { sql: policiesSQL });
    console.log('✅ RLS policies created!');

    // Create trigger function
    console.log('🔧 Setting up trigger function...');
    const triggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'client')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    await supabase.rpc('exec_sql', { sql: triggerFunctionSQL });

    // Create trigger
    const triggerSQL = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    await supabase.rpc('exec_sql', { sql: triggerSQL });
    console.log('✅ Trigger created!');

    console.log('🎉 Profiles table setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Create a user account in Supabase Auth dashboard');
    console.log('2. The profile will be automatically created via trigger');
    console.log('3. Update the profile role to "admin" if needed');
  } catch (error) {
    console.error('❌ Error setting up profiles table:', error);
  }
}

createProfilesTable();

