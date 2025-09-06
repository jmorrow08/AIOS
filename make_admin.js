import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '❌ Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address: node make_admin.js user@email.com');
    process.exit(1);
  }

  try {
    console.log(`🔧 Making ${email} an admin...`);

    // Get the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }

    const user = userData.users.find((u) => u.email === email);

    if (!user) {
      console.error(`❌ User ${email} not found`);
      return;
    }

    // Update the profile to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }

    console.log(`✅ ${email} is now an admin!`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

makeAdmin();
