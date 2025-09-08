require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

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
    console.log('🔐 Attempting to create profiles table...');

    // First, let's try to insert a dummy profile to see if the table exists
    const testData = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'client',
      company_name: 'Test Company',
    };

    const { error } = await supabase.from('profiles').insert(testData);

    if (error) {
      if (error.message.includes('Could not find the table')) {
        console.log('❌ Profiles table does not exist.');
        console.log('');
        console.log('📋 MANUAL SETUP REQUIRED:');
        console.log('');
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
        console.log('2. Navigate to your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Run the following SQL:');
        console.log('');
        console.log('```sql');
        console.log('CREATE TABLE IF NOT EXISTS public.profiles (');
        console.log('  id UUID REFERENCES auth.users(id) PRIMARY KEY,');
        console.log('  email TEXT UNIQUE NOT NULL,');
        console.log('  full_name TEXT,');
        console.log(
          "  role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'client')) DEFAULT 'client',",
        );
        console.log('  company_name TEXT,');
        console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(');');
        console.log('');
        console.log('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('CREATE POLICY "Users can view their own profile" ON public.profiles');
        console.log('  FOR SELECT USING (auth.uid() = id);');
        console.log('');
        console.log('CREATE POLICY "Users can update their own profile" ON public.profiles');
        console.log('  FOR UPDATE USING (auth.uid() = id);');
        console.log('');
        console.log('CREATE POLICY "Admins can view all profiles" ON public.profiles');
        console.log('  FOR SELECT USING (');
        console.log('    EXISTS (');
        console.log('      SELECT 1 FROM public.profiles');
        console.log("      WHERE id = auth.uid() AND role = 'admin'");
        console.log('    )');
        console.log('  );');
        console.log('');
        console.log('CREATE POLICY "Admins can update all profiles" ON public.profiles');
        console.log('  FOR UPDATE USING (');
        console.log('    EXISTS (');
        console.log('      SELECT 1 FROM public.profiles');
        console.log("      WHERE id = auth.uid() AND role = 'admin'");
        console.log('    )');
        console.log('  );');
        console.log('');
        console.log('CREATE OR REPLACE FUNCTION public.handle_new_user()');
        console.log('RETURNS TRIGGER AS $$');
        console.log('BEGIN');
        console.log('  INSERT INTO public.profiles (id, email, full_name, role)');
        console.log('  VALUES (');
        console.log('    NEW.id,');
        console.log('    NEW.email,');
        console.log(
          "    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),",
        );
        console.log("    COALESCE(NEW.raw_user_meta_data->>'role', 'client')");
        console.log('  );');
        console.log('  RETURN NEW;');
        console.log('END;');
        console.log('$$ LANGUAGE plpgsql SECURITY DEFINER;');
        console.log('');
        console.log('CREATE TRIGGER on_auth_user_created');
        console.log('  AFTER INSERT ON auth.users');
        console.log('  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();');
        console.log('```');
        console.log('');
        console.log('5. After creating the table, create a user account in Supabase Auth');
        console.log('6. The profile will be automatically created via the trigger');
      } else {
        console.log('✅ Profiles table exists! Error was:', error.message);
      }
    } else {
      console.log('✅ Profiles table exists and we can insert into it!');
      // Clean up the test data
      await supabase.from('profiles').delete().eq('id', testData.id);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createProfilesTable();

