/**
 * Seed Service Exchange Demo Data
 *
 * This script seeds demo data for testing the service exchange flow in ClientPortal.
 * Run this after applying the migration to populate test data.
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo data
const demoData = {
  company: {
    id: 'demo-company-001',
    name: 'Demo Tech Solutions',
    contact_info: {
      email: 'contact@demotech.com',
      phone: '+1-555-0123',
      address: '123 Demo Street, Tech City, TC 12345',
    },
  },
  client: {
    id: 'demo-client-001',
    email: 'client@demotech.com',
    role: 'client',
    company_id: 'demo-company-001',
  },
  agent: {
    id: 'demo-agent-001',
    email: 'agent@demotech.com',
    role: 'agent',
    company_id: 'demo-company-001',
  },
  service: {
    id: 'demo-service-001',
    company_id: 'demo-company-001',
    name: 'Website Redesign Project',
    description: 'Complete redesign and development of company website with modern UI/UX',
    status: 'in_progress',
    billing_type: 'one-time',
    price: 15000.0,
    start_date: '2024-09-01',
    deliverables: [],
  },
};

async function seedDemoData() {
  try {
    console.log('🌱 Starting service exchange demo data seeding...');

    // 1. Insert demo company
    console.log('📝 Creating demo company...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert([demoData.company])
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return;
    }
    console.log('✅ Company created:', company.name);

    // 2. Insert demo users
    console.log('👥 Creating demo users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .upsert([demoData.client, demoData.agent])
      .select();

    if (usersError) {
      console.error('Error creating users:', usersError);
      return;
    }
    console.log('✅ Users created:', users.length);

    // 3. Insert demo service
    console.log('🔧 Creating demo service...');
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .upsert([demoData.service])
      .select()
      .single();

    if (serviceError) {
      console.error('Error creating service:', serviceError);
      return;
    }
    console.log('✅ Service created:', service.name);

    // 4. Insert demo messages
    console.log('💬 Creating demo messages...');
    const messages = [
      {
        service_id: service.id,
        sender_id: demoData.client.id,
        sender_type: 'client',
        message:
          "Hi! I'm excited to start working on the website redesign. Can you provide an overview of the current timeline and deliverables?",
        is_read: true,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      },
      {
        service_id: service.id,
        sender_id: demoData.agent.id,
        sender_type: 'agent',
        message:
          "Hello! Great to hear from you. We'll be completing the project in 4 weeks. Here's the breakdown: Week 1-2: Design mockups and wireframes, Week 3: Development, Week 4: Testing and launch.",
        is_read: true,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      },
      {
        service_id: service.id,
        sender_id: demoData.client.id,
        sender_type: 'client',
        message:
          'That timeline looks good. I have some specific requirements for the design. Can we schedule a quick call to discuss them?',
        is_read: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        service_id: service.id,
        sender_id: demoData.agent.id,
        sender_type: 'agent',
        message:
          "Absolutely! I'm available tomorrow at 2 PM EST. Would that work for you? I'll send a calendar invite.",
        is_read: false,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
    ];

    const { data: insertedMessages, error: messagesError } = await supabase
      .from('service_messages')
      .upsert(messages)
      .select();

    if (messagesError) {
      console.error('Error creating messages:', messagesError);
      return;
    }
    console.log('✅ Messages created:', insertedMessages.length);

    // 5. Insert demo deliverables
    console.log('📎 Creating demo deliverables...');
    const deliverables = [
      {
        service_id: service.id,
        title: 'Initial Design Mockups',
        description: 'High-fidelity mockups for homepage, about page, and contact page',
        file_url: 'https://example.com/mockups-design.pdf',
        file_name: 'website_mockups_v1.pdf',
        file_size: 2048576, // 2MB
        file_type: 'application/pdf',
        uploaded_by: demoData.agent.id,
        uploaded_by_type: 'agent',
        status: 'submitted',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        service_id: service.id,
        title: 'Technical Specification Document',
        description: 'Detailed technical requirements and implementation plan',
        file_url: 'https://example.com/tech-spec.docx',
        file_name: 'technical_specification.docx',
        file_size: 1048576, // 1MB
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploaded_by: demoData.agent.id,
        uploaded_by_type: 'agent',
        status: 'accepted',
        reviewed_by: demoData.client.id,
        reviewed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        feedback: 'Looks comprehensive. Approved to proceed.',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      },
    ];

    const { data: insertedDeliverables, error: deliverablesError } = await supabase
      .from('service_deliverables')
      .upsert(deliverables)
      .select();

    if (deliverablesError) {
      console.error('Error creating deliverables:', deliverablesError);
      return;
    }
    console.log('✅ Deliverables created:', insertedDeliverables.length);

    // 6. Update service deliverables array
    const deliverablesArray = insertedDeliverables.map((del) => ({
      id: del.id,
      title: del.title,
      url: del.file_url,
      filename: del.file_name,
      uploaded_at: del.created_at,
      status: del.status,
    }));

    const { error: updateServiceError } = await supabase
      .from('services')
      .update({ deliverables: deliverablesArray })
      .eq('id', service.id);

    if (updateServiceError) {
      console.warn('Warning: Could not update service deliverables array:', updateServiceError);
    } else {
      console.log('✅ Service deliverables array updated');
    }

    // 7. Insert demo feedback
    console.log('⭐ Creating demo feedback...');
    const feedback = {
      service_id: service.id,
      client_id: demoData.client.id,
      rating: 5,
      comment:
        'Excellent work so far! The team is very responsive and the deliverables are high quality. Looking forward to the final product.',
      is_public: false,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    };

    const { data: insertedFeedback, error: feedbackError } = await supabase
      .from('service_feedback')
      .upsert([feedback])
      .select();

    if (feedbackError) {
      console.error('Error creating feedback:', feedbackError);
      return;
    }
    console.log('✅ Feedback created:', insertedFeedback.length);

    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Company: ${company.name}`);
    console.log(`   - Service: ${service.name} (${service.status})`);
    console.log(`   - Messages: ${insertedMessages.length}`);
    console.log(`   - Deliverables: ${insertedDeliverables.length}`);
    console.log(`   - Feedback: ${insertedFeedback.length} rating`);
    console.log('\n🔗 You can now test the ClientPortal service exchange flow!');
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
  }
}

// Helper function to create a simple text file for demo purposes
async function createDemoFile(filename, content) {
  // This would normally upload to Supabase Storage
  // For demo purposes, we'll just return a mock URL
  return `https://demo-files.example.com/${filename}`;
}

// Run the seeding function
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('🏁 Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoData, demoData };
