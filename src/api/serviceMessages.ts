import { supabase } from '@/lib/supabaseClient';
import { createNotification, getNotificationContent } from '@/api/notifications';

export type SenderType = 'client' | 'admin' | 'agent';

export interface ServiceMessage {
  id: string;
  service_id: string;
  sender_id: string;
  sender_type: SenderType;
  message: string;
  attachments: Array<{
    url: string;
    filename: string;
    type: string;
    size?: number;
  }>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceMessageResponse {
  data: ServiceMessage | ServiceMessage[] | null;
  error: string | null;
}

export interface CreateMessageData {
  service_id: string;
  sender_id: string;
  sender_type: SenderType;
  message: string;
  attachments?: Array<{
    url: string;
    filename: string;
    type: string;
    size?: number;
  }>;
}

/**
 * Get messages for a specific service
 */
export const getServiceMessages = async (
  serviceId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<ServiceMessageResponse> => {
  try {
    const { data, error } = await supabase
      .from('service_messages')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching service messages:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch service messages',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching service messages:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching service messages',
    };
  }
};

/**
 * Create a new service message
 */
export const createServiceMessage = async (
  messageData: CreateMessageData,
): Promise<ServiceMessageResponse> => {
  try {
    const { data, error } = await supabase
      .from('service_messages')
      .insert([
        {
          service_id: messageData.service_id,
          sender_id: messageData.sender_id,
          sender_type: messageData.sender_type,
          message: messageData.message,
          attachments: messageData.attachments || [],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating service message:', error);
      return {
        data: null,
        error: error.message || 'Failed to create service message',
      };
    }

    // Trigger notifications for all participants except the sender
    try {
      await notifyServiceParticipants(
        messageData.service_id,
        messageData.sender_id,
        messageData.sender_type,
      );
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the message creation if notifications fail
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating service message:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the service message',
    };
  }
};

/**
 * Notify all participants of a service about a new message
 */
const notifyServiceParticipants = async (
  serviceId: string,
  senderId: string,
  senderType: SenderType,
): Promise<void> => {
  try {
    // Get service details
    const { data: service } = await supabase
      .from('services')
      .select('name, client_id')
      .eq('id', serviceId)
      .single();

    if (!service) return;

    const serviceName = service.name || 'Service';
    const notificationContent = getNotificationContent('message', { serviceName });

    // Notify client if sender is not client
    if (senderType !== 'client' && service.client_id) {
      await createNotification(
        service.client_id,
        'message',
        notificationContent.title,
        notificationContent.body,
        `/client-portal/services/${serviceId}`,
      );
    }

    // Notify admin users (excluding sender if sender is admin)
    const { data: adminUsers } = await supabase.from('profiles').select('id').eq('role', 'admin');

    if (adminUsers) {
      for (const admin of adminUsers) {
        if (senderType !== 'admin' || admin.id !== senderId) {
          await createNotification(
            admin.id,
            'message',
            notificationContent.title,
            notificationContent.body,
            `/admin/services/${serviceId}`,
          );
        }
      }
    }

    // Notify assigned agents (excluding sender if sender is agent)
    const { data: assignedAgents } = await supabase
      .from('service_assignments')
      .select('agent_id')
      .eq('service_id', serviceId);

    if (assignedAgents) {
      for (const assignment of assignedAgents) {
        if (senderType !== 'agent' || assignment.agent_id !== senderId) {
          await createNotification(
            assignment.agent_id,
            'message',
            notificationContent.title,
            notificationContent.body,
            `/agent/services/${serviceId}`,
          );
        }
      }
    }
  } catch (error) {
    console.error('Error notifying service participants:', error);
    // Don't throw - notifications are not critical
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  messageIds: string[],
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('service_messages')
      .update({ is_read: true })
      .in('id', messageIds);

    if (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark messages as read',
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error marking messages as read:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while marking messages as read',
    };
  }
};

/**
 * Get unread message count for a service
 */
export const getUnreadMessageCount = async (
  serviceId: string,
  userId: string,
): Promise<{ count: number; error: string | null }> => {
  try {
    const { count, error } = await supabase
      .from('service_messages')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', serviceId)
      .neq('sender_id', userId) // Don't count own messages
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread message count:', error);
      return {
        count: 0,
        error: error.message || 'Failed to fetch unread message count',
      };
    }

    return {
      count: count || 0,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching unread message count:', error);
    return {
      count: 0,
      error: 'An unexpected error occurred while fetching unread message count',
    };
  }
};

/**
 * Upload attachment to Supabase Storage
 */
export const uploadMessageAttachment = async (
  file: File,
  serviceId: string,
  userId: string,
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `service-messages/${serviceId}/${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('deliverables') // Using new deliverables bucket
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading attachment:', error);
      return {
        url: null,
        error: error.message || 'Failed to upload attachment',
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('deliverables').getPublicUrl(filePath);

    return {
      url: publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error uploading attachment:', error);
    return {
      url: null,
      error: 'An unexpected error occurred while uploading the attachment',
    };
  }
};
