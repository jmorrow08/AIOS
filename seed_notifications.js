/**
 * Seed script for demo notifications in Jarvis HQ
 * Run with: node seed_notifications.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedNotifications() {
  try {
    console.log('🌱 Seeding demo notifications...');

    // Get existing users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(10);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }

    console.log(`Found ${users.length} users`);

    // Separate admin and client users
    const adminUsers = users.filter((user) => user.role === 'admin');
    const clientUsers = users.filter((user) => user.role === 'client');

    // Sample notification data
    const notificationTemplates = [
      {
        type: 'budget',
        title: 'Budget Alert: Usage at 85%',
        body: 'Your API usage has reached 85% of your monthly budget. Current spend: $85.00 / $100.00',
        link: '/admin/budget',
        read: false,
      },
      {
        type: 'message',
        title: 'New Message from Client',
        body: 'You have received a new message regarding your web development service.',
        link: '/admin/services',
        read: false,
      },
      {
        type: 'deliverable',
        title: 'New Deliverable Submitted',
        body: 'A new deliverable has been uploaded for the marketing campaign service.',
        link: '/admin/services',
        read: false,
      },
      {
        type: 'feedback',
        title: 'New Feedback Received',
        body: 'Client has submitted feedback for the completed service (Rating: 5/5).',
        link: '/admin/services',
        read: true,
      },
      {
        type: 'system',
        title: 'System Maintenance Scheduled',
        body: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST.',
        link: null,
        read: false,
      },
      {
        type: 'invoice',
        title: 'Invoice Generated',
        body: 'A new invoice has been generated for your recent service completion.',
        link: '/admin/invoices',
        read: true,
      },
      {
        type: 'budget',
        title: 'Budget Warning: 75% Used',
        body: 'You have used 75% of your monthly API budget. Consider upgrading your plan.',
        link: '/admin/budget',
        read: true,
      },
      {
        type: 'message',
        title: 'Service Status Update',
        body: 'Your logo design service status has been updated to "In Progress".',
        link: '/client-portal/services',
        read: false,
      },
      {
        type: 'deliverable',
        title: 'Deliverable Ready for Review',
        body: 'Your website mockups are ready for your review and feedback.',
        link: '/client-portal/services',
        read: false,
      },
      {
        type: 'system',
        title: 'Welcome to Jarvis HQ',
        body: 'Welcome! Your account has been successfully set up. Explore the platform and let us know if you need any assistance.',
        link: '/dashboard',
        read: true,
      },
    ];

    const notificationsToInsert = [];
    const now = new Date();

    // Create notifications for each user
    users.forEach((user, userIndex) => {
      // Create 3-5 notifications per user
      const numNotifications = Math.floor(Math.random() * 3) + 3;

      for (let i = 0; i < numNotifications; i++) {
        const template =
          notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];

        // Adjust link based on user role
        let adjustedLink = template.link;
        if (user.role === 'client' && template.link?.includes('/admin/')) {
          adjustedLink = template.link.replace('/admin/', '/client-portal/');
        } else if (user.role === 'admin' && template.link?.includes('/client-portal/')) {
          adjustedLink = template.link.replace('/client-portal/', '/admin/');
        }

        // Create notification with some variation in timing
        const createdAt = new Date(
          now.getTime() - i * 24 * 60 * 60 * 1000 - Math.random() * 7 * 24 * 60 * 60 * 1000,
        );

        notificationsToInsert.push({
          user_id: user.id,
          type: template.type,
          title: template.title,
          body: template.body,
          link: adjustedLink,
          read: Math.random() > 0.6 ? template.read : false, // 40% chance to be unread
          created_at: createdAt.toISOString(),
        });
      }
    });

    console.log(`Creating ${notificationsToInsert.length} notifications...`);

    // Insert notifications in batches
    const batchSize = 50;
    for (let i = 0; i < notificationsToInsert.length; i += batchSize) {
      const batch = notificationsToInsert.slice(i, i + batchSize);

      const { error: insertError } = await supabase.from('notifications').insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError);
      } else {
        console.log(
          `✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} notifications)`,
        );
      }
    }

    // Create some recent notifications (last 24 hours) to demonstrate real-time functionality
    console.log('Creating recent notifications...');

    const recentNotifications = [
      {
        type: 'budget',
        title: 'Budget Critical Alert',
        body: 'API usage has reached 95% of monthly budget ($95.00 / $100.00). Action required.',
        link: '/admin/budget',
        read: false,
      },
      {
        type: 'message',
        title: 'Urgent: Client Message',
        body: 'Client has sent an urgent message regarding the ongoing project deadline.',
        link: '/admin/services',
        read: false,
      },
      {
        type: 'deliverable',
        title: 'Deliverable Submitted',
        body: 'Final deliverable for the branding project has been submitted and is ready for review.',
        link: '/admin/services',
        read: false,
      },
    ];

    // Add recent notifications to a few users
    for (let i = 0; i < Math.min(3, users.length); i++) {
      const user = users[i];
      const template = recentNotifications[i % recentNotifications.length];

      let adjustedLink = template.link;
      if (user.role === 'client' && template.link?.includes('/admin/')) {
        adjustedLink = template.link.replace('/admin/', '/client-portal/');
      }

      const { error: recentError } = await supabase.from('notifications').insert({
        user_id: user.id,
        type: template.type,
        title: template.title,
        body: template.body,
        link: adjustedLink,
        read: false,
        created_at: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (recentError) {
        console.error('Error creating recent notification:', recentError);
      } else {
        console.log(`✅ Created recent notification for ${user.email}`);
      }
    }

    console.log('🎉 Demo notifications seeding completed!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Total notifications created: ${notificationsToInsert.length}`);
    console.log(`   - Users with notifications: ${users.length}`);
    console.log(
      `   - Average notifications per user: ${Math.round(
        notificationsToInsert.length / users.length,
      )}`,
    );
    console.log('');
    console.log('🔗 Next steps:');
    console.log('   1. Run the migration: npx supabase db reset');
    console.log('   2. Start the development server');
    console.log('   3. Test the notification system in the UI');
  } catch (error) {
    console.error('Error seeding notifications:', error);
    process.exit(1);
  }
}

// Run the seed function
seedNotifications();
