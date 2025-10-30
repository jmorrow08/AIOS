// Script to verify and set up Supabase credentials
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Supabase Credentials Setup\n');
console.log('This script will help you set up your Supabase credentials.\n');

rl.question('Enter your Supabase Project URL (https://xxxxx.supabase.co): ', (url) => {
  if (!url || !url.includes('supabase.co')) {
    console.log('❌ Invalid URL format. Should be: https://your-project-id.supabase.co');
    rl.close();
    return;
  }

  rl.question('Enter your Supabase Anon/Public Key (starts with eyJ...): ', (key) => {
    if (!key || !key.startsWith('eyJ')) {
      console.log('❌ Invalid key format. Should start with "eyJ"');
      rl.close();
      return;
    }

    // Create .env.local
    const fs = require('fs');
    const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${url}
VITE_SUPABASE_ANON_KEY=${key}

# Other config...
BUDGET_MODE=dev
OLLAMA_BASE_URL=http://192.168.1.229:11434
COMFY_WORKER_URL=http://localhost:8188
`;

    fs.writeFileSync('.env.local', envContent);
    console.log('\n✅ .env.local created successfully!');
    console.log('🔄 Restarting dev server...');
    
    rl.close();
    
    // Test connection
    setTimeout(() => {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(url, key);
      
      supabase.from('profiles').select('count', { count: 'exact', head: true })
        .then(({ error }) => {
          if (error) {
            console.log('❌ Connection test failed:', error.message);
            console.log('💡 Make sure your Supabase project is set up correctly');
          } else {
            console.log('✅ Connection test successful!');
            console.log('🚀 You can now try logging in at http://localhost:5174');
          }
        });
    }, 1000);
  });
});
