import { supabase } from '@/lib/supabaseClient';
import {
  getSlackConfig,
  getDiscordConfig,
  getEmailConfig,
  getSmsConfig,
} from '@/api/companyConfig';

// Notification types for the database
export type NotificationType =
  | 'message'
  | 'deliverable'
  | 'feedback'
  | 'invoice'
  | 'budget'
  | 'system';

// Database notification interface
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  created_at: string;
}

// API response types
export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
}

// Create notification function
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
): Promise<ApiResponse<string>> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        link,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Trigger external integrations if configured
    await sendExternalNotifications(userId, type, title, body);

    return {
      data: data?.id || null,
      error: null,
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create notification',
    };
  }
};

// Get notifications for a user
export const getNotifications = async (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: NotificationType;
    read?: boolean;
  },
): Promise<ApiResponse<Notification[]>> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.read !== undefined) {
      query = query.eq('read', options.read);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch notifications',
    };
  }
};

// Mark notification as read
export const markAsRead = async (notificationId: string): Promise<ApiResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to mark notification as read',
    };
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId: string): Promise<ApiResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
    };
  }
};

// Get unread notification count for a user
export const getUnreadCount = async (userId: string): Promise<ApiResponse<number>> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    return {
      data: count || 0,
      error: null,
    };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get unread count',
    };
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<ApiResponse<boolean>> => {
  try {
    const { error } = await supabase.from('notifications').delete().eq('id', notificationId);

    if (error) throw error;

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete notification',
    };
  }
};

// External integration stubs

// Send Slack notification
export const sendSlackNotification = async (
  channel: string,
  message: string,
): Promise<ApiResponse<boolean>> => {
  try {
    const config = await getSlackConfig();

    if (!config?.enabled || !config.config?.webhook_url) {
      console.warn('Slack integration not configured or disabled');
      return { data: true, error: null }; // Don't fail silently
    }

    const payload = {
      channel: channel || config.config.channel || '#general',
      username: 'AI OS Bot',
      text: message,
      icon_emoji: ':robot_face:',
    };

    // Mention users if configured
    if (config.config.mention_users && config.config.mention_users.length > 0) {
      const mentions = config.config.mention_users.map((user: string) => `<@${user}>`).join(' ');
      payload.text = `${mentions} ${message}`;
    }

    const response = await fetch(config.config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Slack notification sent successfully');
    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('❌ Error sending Slack notification:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to send Slack notification',
    };
  }
};

// Send Discord notification
export const sendDiscordNotification = async (
  webhookUrl: string,
  message: string,
): Promise<ApiResponse<boolean>> => {
  try {
    const config = await getDiscordConfig();

    if (!config?.enabled || !config.config?.webhook_url) {
      console.warn('Discord integration not configured or disabled');
      return { data: true, error: null }; // Don't fail silently
    }

    const payload = {
      username: config.config.username || 'AI OS Bot',
      avatar_url: config.config.avatar_url,
      embeds: [
        {
          title: 'AI OS Notification',
          description: message,
          color: 0x5d8bf4, // Cosmic accent color
          timestamp: new Date().toISOString(),
          footer: {
            text: 'AI OS',
          },
        },
      ],
    };

    const response = await fetch(config.config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook returned ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Discord notification sent successfully');
    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('❌ Error sending Discord notification:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to send Discord notification',
    };
  }
};

// Send email notification
export const sendEmailNotification = async (
  userId: string,
  subject: string,
  body: string,
): Promise<ApiResponse<boolean>> => {
  try {
    const config = await getEmailConfig();

    if (!config?.enabled || !config.config?.api_key) {
      console.warn('Email integration not configured or disabled');
      return { data: true, error: null }; // Don't fail silently
    }

    // Get user email from profiles table
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userProfile?.email) {
      console.warn('User email not found:', userId);
      return { data: false, error: 'User email not found' };
    }

    const provider = config.config.provider || 'sendgrid';
    let response;

    switch (provider.toLowerCase()) {
      case 'sendgrid':
        response = await sendSendGridEmail(
          config.config.api_key,
          config.config.from_email,
          config.config.from_name || 'AI OS',
          userProfile.email,
          subject,
          body,
        );
        break;

      case 'mailgun':
        response = await sendMailgunEmail(
          config.config.api_key,
          config.config.from_email,
          userProfile.email,
          subject,
          body,
        );
        break;

      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }

    if (!response.ok) {
      throw new Error(`Email service returned ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Email notification sent successfully');
    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to send email notification',
    };
  }
};

// Helper function for SendGrid
const sendSendGridEmail = async (
  apiKey: string,
  fromEmail: string,
  fromName: string,
  toEmail: string,
  subject: string,
  body: string,
): Promise<Response> => {
  const payload = {
    personalizations: [
      {
        to: [{ email: toEmail }],
        subject,
      },
    ],
    from: { email: fromEmail, name: fromName },
    content: [
      {
        type: 'text/html',
        value: body,
      },
    ],
  };

  return fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};

// Helper function for Mailgun
const sendMailgunEmail = async (
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  body: string,
): Promise<Response> => {
  const formData = new FormData();
  formData.append('from', fromEmail);
  formData.append('to', toEmail);
  formData.append('subject', subject);
  formData.append('html', body);

  return fetch('https://api.mailgun.net/v3/YOUR_DOMAIN/messages', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
    },
    body: formData,
  });
};

// Send SMS notification
export const sendSMSNotification = async (
  phoneNumber: string,
  message: string,
): Promise<ApiResponse<boolean>> => {
  try {
    const config = await getSmsConfig();

    if (!config?.enabled || !config.config?.api_key) {
      console.warn('SMS integration not configured or disabled');
      return { data: true, error: null }; // Don't fail silently
    }

    const provider = config.config.provider || 'twilio';
    let response;

    switch (provider.toLowerCase()) {
      case 'twilio':
        response = await sendTwilioSMS(
          config.config.account_sid,
          config.config.api_key,
          config.config.phone_number,
          phoneNumber,
          message,
        );
        break;

      case 'nexmo':
        response = await sendNexmoSMS(config.config.api_key, phoneNumber, message);
        break;

      default:
        throw new Error(`Unsupported SMS provider: ${provider}`);
    }

    if (!response.ok) {
      throw new Error(`SMS service returned ${response.status}: ${response.statusText}`);
    }

    console.log('✅ SMS notification sent successfully');
    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('❌ Error sending SMS notification:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to send SMS notification',
    };
  }
};

// Helper function for Twilio SMS
const sendTwilioSMS = async (
  accountSid: string,
  authToken: string,
  fromNumber: string,
  toNumber: string,
  message: string,
): Promise<Response> => {
  const formData = new FormData();
  formData.append('From', fromNumber);
  formData.append('To', toNumber);
  formData.append('Body', message);

  const credentials = btoa(`${accountSid}:${authToken}`);

  return fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    body: formData,
  });
};

// Helper function for Nexmo (Vonage) SMS
const sendNexmoSMS = async (
  apiKey: string,
  toNumber: string,
  message: string,
): Promise<Response> => {
  const params = new URLSearchParams({
    api_key: apiKey,
    to: toNumber,
    text: message,
  });

  return fetch(`https://rest.nexmo.com/sms/json?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Internal helper to send external notifications based on company config
const sendExternalNotifications = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
): Promise<void> => {
  try {
    const slackConfig = await getSlackConfig();
    const discordConfig = await getDiscordConfig();
    const emailConfig = await getEmailConfig();

    // Send Slack notification if configured and event is enabled
    if (slackConfig?.enabled && slackConfig.config?.webhook_url) {
      const enabledEvents = slackConfig.config.enabled_events || [];
      if (enabledEvents.includes(type) || enabledEvents.includes('all')) {
        await sendSlackNotification(slackConfig.config.channel || '#general', `${title}: ${body}`);
      }
    }

    // Send Discord notification if configured and event is enabled
    if (discordConfig?.enabled && discordConfig.config?.webhook_url) {
      const enabledEvents = discordConfig.config.enabled_events || [];
      if (enabledEvents.includes(type) || enabledEvents.includes('all')) {
        await sendDiscordNotification(discordConfig.config.webhook_url, `${title}: ${body}`);
      }
    }

    // Send email notification if configured and event is enabled
    if (emailConfig?.enabled && emailConfig.config?.api_key) {
      const enabledEvents = emailConfig.config.enabled_events || [];
      if (enabledEvents.includes(type) || enabledEvents.includes('all')) {
        await sendEmailNotification(userId, title, body);
      }
    }
  } catch (error) {
    console.error('Error sending external notifications:', error);
    // Don't throw - external notifications shouldn't break the main flow
  }
};

// Test notification functions
export const testSlackNotification = async (): Promise<ApiResponse<boolean>> => {
  const testMessage = '🧪 Test notification from AI OS - Slack integration is working!';
  return sendSlackNotification('#general', testMessage);
};

export const testDiscordNotification = async (): Promise<ApiResponse<boolean>> => {
  const testMessage = '🧪 Test notification from AI OS - Discord integration is working!';
  return sendDiscordNotification('', testMessage); // Will use config webhook
};

export const testEmailNotification = async (userId?: string): Promise<ApiResponse<boolean>> => {
  const testSubject = '🧪 AI OS Email Test';
  const testBody =
    '<h2>Test Email</h2><p>This is a test notification from AI OS. Your email integration is working!</p>';

  // If no userId provided, try to get the current user's ID
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return { data: false, error: 'No user ID available for email test' };
    }
    userId = user.id;
  }

  return sendEmailNotification(userId, testSubject, testBody);
};

export const testSMSNotification = async (phoneNumber?: string): Promise<ApiResponse<boolean>> => {
  const testMessage = 'Test SMS from AI OS - SMS integration is working!';

  if (!phoneNumber) {
    return { data: false, error: 'Phone number required for SMS test' };
  }

  return sendSMSNotification(phoneNumber, testMessage);
};

// Helper functions for notification content
export const getNotificationContent = (type: NotificationType, metadata?: any) => {
  const templates = {
    message: {
      title: 'New Message',
      body: `You have a new message${metadata?.serviceName ? ` on ${metadata.serviceName}` : ''}`,
    },
    deliverable: {
      title: 'New Deliverable',
      body: `A new deliverable is available${
        metadata?.serviceName ? ` for ${metadata.serviceName}` : ''
      }`,
    },
    feedback: {
      title: 'Feedback Submitted',
      body: `New feedback has been submitted${
        metadata?.serviceName ? ` for ${metadata.serviceName}` : ''
      }`,
    },
    invoice: {
      title: 'Invoice Update',
      body: `Invoice status updated${
        metadata?.invoiceId ? ` for invoice #${metadata.invoiceId}` : ''
      }`,
    },
    budget: {
      title: 'Budget Alert',
      body: `Budget threshold reached${metadata?.percentage ? ` (${metadata.percentage}%)` : ''}`,
    },
    system: {
      title: 'System Notification',
      body: metadata?.message || 'System notification',
    },
  };

  return templates[type] || { title: 'Notification', body: 'You have a new notification' };
};
