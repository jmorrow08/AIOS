import { supabase } from '@/lib/supabaseClient';

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
    console.log('💬 Slack notification:', { channel, message });

    // Stub: In production, integrate with Slack API
    /*
    const slackService = new SlackService();
    await slackService.send({
      channel,
      message,
    });
    */

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('Error sending Slack notification:', error);
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
    console.log('🎮 Discord notification:', { webhookUrl, message });

    // Stub: In production, integrate with Discord webhooks
    /*
    const discordService = new DiscordService();
    await discordService.send({
      webhookUrl,
      embed: {
        title: 'Notification',
        description: message,
        color: 0x0099ff, // Blue color
        timestamp: new Date().toISOString(),
      },
    });
    */

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('Error sending Discord notification:', error);
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
    console.log('📧 Email notification:', { userId, subject, body });

    // Stub: In production, integrate with email service
    /*
    const emailService = new EmailService();
    const userEmail = await getUserEmail(userId);
    await emailService.send({
      to: userEmail,
      subject,
      body,
    });
    */

    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to send email notification',
    };
  }
};

// Internal helper to send external notifications based on company config
const sendExternalNotifications = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
): Promise<void> => {
  try {
    // Get company config for external integrations
    const { data: config } = await supabase
      .from('company_config')
      .select('slack_webhook, discord_webhook, email_provider')
      .single();

    if (!config) return;

    // Send Slack notification if configured
    if (config.slack_webhook) {
      await sendSlackNotification(config.slack_webhook, `${title}: ${body}`);
    }

    // Send Discord notification if configured
    if (config.discord_webhook) {
      await sendDiscordNotification(config.discord_webhook, `${title}: ${body}`);
    }

    // Send email notification if configured
    if (config.email_provider) {
      await sendEmailNotification(userId, title, body);
    }
  } catch (error) {
    console.error('Error sending external notifications:', error);
    // Don't throw - external notifications shouldn't break the main flow
  }
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
