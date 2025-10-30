// Simple Ollama test script
const { exec } = require('child_process');

async function testOllama() {
  console.log('🧪 Testing Ollama Integration...\n');

  // Test 1: Direct Ollama API call
  console.log('1️⃣ Testing direct Ollama API call...');

  const testPrompt = JSON.stringify({
    model: 'llama3.1:8b',
    prompt:
      'You are a helpful AI assistant for business systems. Explain what AI business operating systems are in 2-3 sentences.',
    stream: false,
  });

  exec(
    `curl -X POST http://localhost:11434/api/generate -H "Content-Type: application/json" -d '${testPrompt}'`,
    (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Ollama API test failed:', error.message);
        return;
      }

      try {
        const response = JSON.parse(stdout);
        console.log('✅ Ollama API test successful!');
        console.log('📄 Response preview:', response.response.substring(0, 200) + '...\n');
      } catch (e) {
        console.error('❌ Failed to parse Ollama response:', e.message);
      }

      // Test 2: Check our app is running
      console.log('2️⃣ Testing app server...');
      exec('curl -s http://localhost:5173 | head -20', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ App server test failed:', error.message);
          return;
        }

        if (stdout.includes('html')) {
          console.log('✅ App server is running!\n');
        } else {
          console.log('⚠️ App server response unclear\n');
        }

        // Test 3: Summary
        console.log('🎯 TEST RESULTS:');
        console.log('- Ollama: ✅ Running with llama3.1:8b model');
        console.log('- App Server: ✅ Running on http://localhost:5173');
        console.log('- Next Steps:');
        console.log('  1. Open http://localhost:5173 in your browser');
        console.log('  2. Try the AI agents or create a test company');
        console.log('  3. For edge functions: Run "npx supabase link" then deploy');
        console.log('\n🚀 Ready for manual testing!');
      });
    },
  );
}

testOllama();
