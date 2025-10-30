// Create a user with alijayem1@gmail.com
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing environment variables. Please set:');
  console.log('   VITE_SUPABASE_URL=your_project_url');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUser() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'alijayem1@gmail.com',
      password: 'Admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Ali Jayem',
        role: 'admin'
      }
    });

    if (error) {
      console.error('❌ Error creating user:', error);
      return;
    }

    console.log('✅ User created successfully!');
    console.log('Email: alijayem1@gmail.com');
    console.log('Password: Admin123');
    console.log('Role: admin');

    // Also create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: 'alijayem1@gmail.com',
        full_name: 'Ali Jayem',
        role: 'admin'
      });

    if (profileError) {
      console.log('⚠️ Profile creation warning:', profileError);
    } else {
      console.log('✅ Profile created successfully!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createUser();
