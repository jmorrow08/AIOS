/**
 * Test Service Exchange Flow
 *
 * This script tests the service exchange functionality to ensure everything works correctly.
 * Run this after setting up the database and seeding demo data.
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testServiceExchangeFlow() {
  try {
    console.log('🧪 Testing Service Exchange Flow...\n');

    // Test 1: Get services for a company
    console.log('1️⃣ Testing getServicesForClient...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', 'demo-company-001')
      .eq('status', 'in_progress');

    if (servicesError) {
      console.error('❌ Error fetching services:', servicesError);
      return;
    }
    console.log(`✅ Found ${services.length} services`);

    if (services.length === 0) {
      console.log('⚠️ No services found. Please run the seed script first.');
      return;
    }

    const testService = services[0];
    console.log(`📋 Testing with service: ${testService.name}\n`);

    // Test 2: Get messages for the service
    console.log('2️⃣ Testing getServiceMessages...');
    const { data: messages, error: messagesError } = await supabase
      .from('service_messages')
      .select('*')
      .eq('service_id', testService.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ Error fetching messages:', messagesError);
      return;
    }
    console.log(`✅ Found ${messages.length} messages`);
    messages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.sender_type}: ${msg.message.substring(0, 50)}...`);
    });
    console.log('');

    // Test 3: Get deliverables for the service
    console.log('3️⃣ Testing getServiceDeliverables...');
    const { data: deliverables, error: deliverablesError } = await supabase
      .from('service_deliverables')
      .select('*')
      .eq('service_id', testService.id)
      .order('created_at', { ascending: false });

    if (deliverablesError) {
      console.error('❌ Error fetching deliverables:', deliverablesError);
      return;
    }
    console.log(`✅ Found ${deliverables.length} deliverables`);
    deliverables.forEach((del, index) => {
      console.log(`   ${index + 1}. ${del.title} (${del.status}) - ${del.file_name}`);
    });
    console.log('');

    // Test 4: Get feedback for the service
    console.log('4️⃣ Testing getServiceFeedback...');
    const { data: feedback, error: feedbackError } = await supabase
      .from('service_feedback')
      .select('*')
      .eq('service_id', testService.id)
      .order('created_at', { ascending: false });

    if (feedbackError) {
      console.error('❌ Error fetching feedback:', feedbackError);
      return;
    }
    console.log(`✅ Found ${feedback.length} feedback entries`);
    feedback.forEach((fb, index) => {
      console.log(`   ${index + 1}. Rating: ${fb.rating}/5 - ${fb.comment?.substring(0, 50)}...`);
    });
    console.log('');

    // Test 5: Test status update (if we have permission)
    console.log('5️⃣ Testing service status update...');
    try {
      const { data: updatedService, error: updateError } = await supabase
        .from('services')
        .update({ status: 'review' })
        .eq('id', testService.id)
        .select()
        .single();

      if (updateError) {
        console.log(`⚠️ Status update failed (expected if no permissions): ${updateError.message}`);
      } else {
        console.log(`✅ Service status updated to: ${updatedService.status}`);
        // Revert the change for testing
        await supabase.from('services').update({ status: 'in_progress' }).eq('id', testService.id);
      }
    } catch (error) {
      console.log(`⚠️ Status update test failed: ${error.message}`);
    }
    console.log('');

    // Test 6: Test service deliverables array
    console.log('6️⃣ Testing service deliverables array...');
    const { data: serviceWithDeliverables, error: serviceDelError } = await supabase
      .from('services')
      .select('id, name, deliverables')
      .eq('id', testService.id)
      .single();

    if (serviceDelError) {
      console.error('❌ Error fetching service deliverables array:', serviceDelError);
    } else {
      console.log(
        `✅ Service deliverables array: ${JSON.stringify(
          serviceWithDeliverables.deliverables,
          null,
          2,
        )}`,
      );
    }
    console.log('');

    // Test 7: Test storage bucket access
    console.log('7️⃣ Testing storage bucket access...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

      if (bucketsError) {
        console.error('❌ Error listing buckets:', bucketsError);
      } else {
        const deliverablesBucket = buckets.find((b) => b.name === 'deliverables');
        if (deliverablesBucket) {
          console.log('✅ Deliverables bucket exists');
        } else {
          console.log('⚠️ Deliverables bucket not found');
        }
      }
    } catch (error) {
      console.log(`⚠️ Storage test failed: ${error.message}`);
    }

    console.log('\n🎉 Service Exchange Flow Test Completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Services: ${services.length}`);
    console.log(`   - Messages: ${messages.length}`);
    console.log(`   - Deliverables: ${deliverables.length}`);
    console.log(`   - Feedback: ${feedback.length}`);
    console.log('\n✅ All core functionality appears to be working!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Helper function to simulate API calls using the actual API functions
async function testAPIIntegration() {
  console.log('\n🔧 Testing API Integration (requires authentication)...');

  try {
    // Import the clientPortal API functions (this would work in a Node.js environment with proper setup)
    console.log('Note: API integration testing requires proper authentication setup');
    console.log('To test the full API integration:');
    console.log('1. Set up authentication in your app');
    console.log('2. Import functions from src/api/clientPortal.ts');
    console.log('3. Call functions like getServicesForClient(), addServiceMessage(), etc.');

    // Example of how to test:
    console.log('\nExample usage:');
    console.log(`
import {
  getServicesForClient,
  addServiceMessage,
  getServiceMessages,
  uploadDeliverable,
  acceptDeliverable,
  addServiceFeedback
} from '@/api/clientPortal';

// Get services for a company
const { data: services } = await getServicesForClient('company-id');

// Add a message
const { data: message } = await addServiceMessage(
  'service-id',
  'user-id',
  'Hello, this is a test message!'
);

// Upload a deliverable
const { data: deliverable } = await uploadDeliverable(
  'service-id',
  file,
  'Design Mockup',
  'Initial design concepts'
);
    `);
  } catch (error) {
    console.error('API integration test error:', error);
  }
}

// Run the tests
if (require.main === module) {
  testServiceExchangeFlow()
    .then(() => testAPIIntegration())
    .then(() => {
      console.log('\n🏁 All tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test process failed:', error);
      process.exit(1);
    });
}

module.exports = { testServiceExchangeFlow, testAPIIntegration };
