// Debug script to check Supabase connection and user status
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Debugging Supabase Login Issues...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  console.log('Make sure you have:');
  console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key configured:', supabaseAnonKey ? 'Yes' : 'No');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugLogin() {
  try {
    console.log('\n🔍 Testing connection...');
    
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.log('❌ Database connection failed:', healthError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check if user exists
    console.log('\n�� Checking user account...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'alijayem1@gmail.com');
    
    if (profileError) {
      console.log('❌ Profile query failed:', profileError.message);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ User not found in profiles table');
      console.log('💡 You need to create the user account first');
      return;
    }
    
    console.log('✅ User found in profiles:', profiles[0]);
    
    // Try login
    console.log('\n🔐 Attempting login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alijayem1@gmail.com',
      password: 'Admin123'
    });
    
    if (authError) {
      console.log('❌ Login failed:', authError.message);
      
      if (authError.message.includes('Invalid login credentials')) {
        console.log('💡 Possible issues:');
        console.log('   - Wrong password');
        console.log('   - Email not confirmed');
        console.log('   - Account disabled');
      }
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('User:', authData.user?.email);
    console.log('Session created:', !!authData.session);
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

debugLogin();
