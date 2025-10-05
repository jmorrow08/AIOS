import { supabase } from '@/lib/supabaseClient';
import type {
  ServiceMessage,
  CreateMessageData,
  ServiceFeedback,
  CreateFeedbackData,
  ServiceDeliverable,
  CreateDeliverableData,
} from './serviceMessages';
import {
  getServiceMessages as getMessages,
  createServiceMessage as createMessage,
  markMessagesAsRead,
  uploadMessageAttachment,
} from './serviceMessages';
import {
  getServiceFeedback as getFeedback,
  createServiceFeedback as createFeedback,
} from './serviceFeedback';
import {
  getServiceDeliverables as getDeliverables,
  createServiceDeliverable as createDeliverable,
  updateServiceDeliverable as updateDeliverable,
  uploadDeliverableFile,
} from './serviceDeliverables';
import { getServices, updateService, type Service, type ServiceStatus } from './services';

export type {
  ServiceMessage,
  CreateMessageData,
  ServiceFeedback,
  CreateFeedbackData,
  ServiceDeliverable,
  CreateDeliverableData,
  Service,
  ServiceStatus,
};

// Response types
export interface ClientPortalResponse<T> {
  data: T | null;
  error: string | null;
}

export interface ServicesResponse extends ClientPortalResponse<Service[]> {}
export interface ServiceResponse extends ClientPortalResponse<Service> {}
export interface MessagesResponse extends ClientPortalResponse<ServiceMessage[]> {}
export interface MessageResponse extends ClientPortalResponse<ServiceMessage> {}
export interface FeedbackResponse extends ClientPortalResponse<ServiceFeedback[]> {}
export interface DeliverablesResponse extends ClientPortalResponse<ServiceDeliverable[]> {}
export interface DeliverableResponse extends ClientPortalResponse<ServiceDeliverable> {}

/**
 * Get all services for a specific company (client view)
 * Filters services to only show those relevant to the client
 */
export const getServicesForClient = async (
  companyId: string,
  status?: ServiceStatus,
): Promise<ServicesResponse> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', status || 'in_progress')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client services:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch services',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching client services:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching services',
    };
  }
};

/**
 * Update service status
 */
export const updateServiceStatus = async (
  serviceId: string,
  status: ServiceStatus,
): Promise<ServiceResponse> => {
  return updateService(serviceId, { status });
};

/**
 * Add a new service message
 */
export const addServiceMessage = async (
  serviceId: string,
  senderId: string,
  message: string,
  senderType: 'client' | 'admin' | 'agent' = 'client',
  attachments?: Array<{
    url: string;
    filename: string;
    type: string;
    size?: number;
  }>,
): Promise<MessageResponse> => {
  const messageData: CreateMessageData = {
    service_id: serviceId,
    sender_id: senderId,
    sender_type: senderType,
    message,
    attachments,
  };

  return createMessage(messageData);
};

/**
 * Get all messages for a service
 */
export const getServiceMessages = async (
  serviceId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<MessagesResponse> => {
  return getMessages(serviceId, limit, offset);
};

/**
 * Upload a deliverable file and create deliverable record
 */
export const uploadDeliverable = async (
  serviceId: string,
  file: File,
  title: string,
  description?: string,
  uploadedBy: string,
  uploadedByType: 'admin' | 'agent' = 'admin',
): Promise<DeliverableResponse> => {
  try {
    // First upload the file
    const uploadResult = await uploadDeliverableFile(file, serviceId, uploadedBy);

    if (uploadResult.error || !uploadResult.url) {
      return {
        data: null,
        error: uploadResult.error || 'Failed to upload file',
      };
    }

    // Create deliverable record
    const deliverableData: CreateDeliverableData = {
      service_id: serviceId,
      title,
      description,
      file_url: uploadResult.url,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: uploadedBy,
      uploaded_by_type: uploadedByType,
    };

    const result = await createDeliverable(deliverableData);

    // If successful, also add to services.deliverables array
    if (result.data && !result.error) {
      await addDeliverableToService(serviceId, {
        id: result.data.id,
        title,
        url: uploadResult.url,
        filename: file.name,
        uploaded_at: result.data.created_at,
        status: 'submitted',
      });
    }

    return result;
  } catch (error) {
    console.error('Unexpected error uploading deliverable:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while uploading the deliverable',
    };
  }
};

/**
 * Accept a deliverable (client action)
 */
export const acceptDeliverable = async (
  deliverableId: string,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const result = await updateDeliverable(deliverableId, {
      status: 'accepted',
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      feedback: 'Deliverable accepted by client',
    });

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Update the deliverable status in services.deliverables array
    const deliverable = result.data;
    if (deliverable) {
      await updateDeliverableInService(deliverable.service_id, deliverableId, {
        status: 'accepted',
        reviewed_at: new Date().toISOString(),
      });
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error accepting deliverable:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while accepting the deliverable',
    };
  }
};

/**
 * Add service feedback
 */
export const addServiceFeedback = async (
  serviceId: string,
  rating: number,
  comment: string,
  clientId: string,
): Promise<{ success: boolean; error: string | null }> => {
  const feedbackData: CreateFeedbackData = {
    service_id: serviceId,
    client_id: clientId,
    rating,
    comment,
  };

  const result = await createFeedback(feedbackData);

  if (result.error) {
    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
    error: null,
  };
};

/**
 * Get all deliverables for a service
 */
export const getServiceDeliverables = async (serviceId: string): Promise<DeliverablesResponse> => {
  return getDeliverables(serviceId);
};

/**
 * Get all feedback for a service
 */
export const getServiceFeedback = async (serviceId: string): Promise<FeedbackResponse> => {
  return getFeedback(serviceId);
};

/**
 * Mark messages as read
 */
export const markServiceMessagesAsRead = async (
  messageIds: string[],
): Promise<{ success: boolean; error: string | null }> => {
  return markMessagesAsRead(messageIds);
};

/**
 * Helper function to add deliverable to services.deliverables array
 */
const addDeliverableToService = async (
  serviceId: string,
  deliverable: {
    id: string;
    title: string;
    url: string;
    filename: string;
    uploaded_at: string;
    status: string;
  },
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('append_deliverable_to_service', {
      service_id: serviceId,
      deliverable_data: deliverable,
    });

    if (error) {
      console.warn('Failed to append deliverable to service:', error);
      // Fallback: update manually
      const { data: service } = await supabase
        .from('services')
        .select('deliverables')
        .eq('id', serviceId)
        .single();

      if (service) {
        const currentDeliverables = service.deliverables || [];
        const updatedDeliverables = [...currentDeliverables, deliverable];

        await supabase
          .from('services')
          .update({ deliverables: updatedDeliverables })
          .eq('id', serviceId);
      }
    }
  } catch (error) {
    console.warn('Error updating service deliverables:', error);
  }
};

/**
 * Helper function to update deliverable status in services.deliverables array
 */
const updateDeliverableInService = async (
  serviceId: string,
  deliverableId: string,
  updates: { status: string; reviewed_at?: string },
): Promise<void> => {
  try {
    const { data: service } = await supabase
      .from('services')
      .select('deliverables')
      .eq('id', serviceId)
      .single();

    if (service && service.deliverables) {
      const updatedDeliverables = service.deliverables.map((del: any) =>
        del.id === deliverableId ? { ...del, ...updates } : del,
      );

      await supabase
        .from('services')
        .update({ deliverables: updatedDeliverables })
        .eq('id', serviceId);
    }
  } catch (error) {
    console.warn('Error updating deliverable in service:', error);
  }
};

/**
 * Get service statistics for client dashboard
 */
export const getServiceStats = async (
  companyId: string,
): Promise<{
  data: {
    totalServices: number;
    activeServices: number;
    completedServices: number;
    pendingDeliverables: number;
    unreadMessages: number;
  } | null;
  error: string | null;
}> => {
  try {
    // Get service counts
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('status')
      .eq('company_id', companyId);

    if (servicesError) {
      return {
        data: null,
        error: servicesError.message,
      };
    }

    const totalServices = services?.length || 0;
    const activeServices = services?.filter((s) => s.status === 'in_progress').length || 0;
    const completedServices = services?.filter((s) => s.status === 'completed').length || 0;

    // Get pending deliverables count
    const { count: pendingDeliverables, error: deliverablesError } = await supabase
      .from('service_deliverables')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .in('service_id', services?.map((s) => s.id) || []);

    if (deliverablesError) {
      console.warn('Error fetching deliverables count:', deliverablesError);
    }

    // Get unread messages count (simplified - would need user context)
    const unreadMessages = 0; // This would require more complex logic with user context

    return {
      data: {
        totalServices,
        activeServices,
        completedServices,
        pendingDeliverables: pendingDeliverables || 0,
        unreadMessages,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching service stats:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching service statistics',
    };
  }
};
