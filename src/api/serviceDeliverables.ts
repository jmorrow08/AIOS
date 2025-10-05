import { supabase } from '@/lib/supabaseClient';
import { createNotification, getNotificationContent } from '@/api/notifications';

export type DeliverableStatus =
  | 'pending'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'revision_requested';

export interface ServiceDeliverable {
  id: string;
  service_id: string;
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: string;
  uploaded_by_type: 'admin' | 'agent';
  status: DeliverableStatus;
  feedback?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceDeliverableResponse {
  data: ServiceDeliverable | ServiceDeliverable[] | null;
  error: string | null;
}

export interface CreateDeliverableData {
  service_id: string;
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: string;
  uploaded_by_type: 'admin' | 'agent';
}

export interface UpdateDeliverableData {
  title?: string;
  description?: string;
  status?: DeliverableStatus;
  feedback?: string;
  reviewed_by?: string;
}

/**
 * Get deliverables for a specific service
 */
export const getServiceDeliverables = async (
  serviceId: string,
): Promise<ServiceDeliverableResponse> => {
  try {
    const { data, error } = await supabase
      .from('service_deliverables')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching service deliverables:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch service deliverables',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching service deliverables:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching service deliverables',
    };
  }
};

/**
 * Create a new deliverable
 */
export const createServiceDeliverable = async (
  deliverableData: CreateDeliverableData,
): Promise<ServiceDeliverableResponse> => {
  try {
    const { data, error } = await supabase
      .from('service_deliverables')
      .insert([
        {
          ...deliverableData,
          status: 'submitted',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating service deliverable:', error);
      return {
        data: null,
        error: error.message || 'Failed to create service deliverable',
      };
    }

    // Trigger notifications for deliverable upload
    try {
      await notifyDeliverableUpload(data);
    } catch (notificationError) {
      console.error('Error sending deliverable notifications:', notificationError);
      // Don't fail the deliverable creation if notifications fail
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating service deliverable:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the service deliverable',
    };
  }
};

/**
 * Update an existing deliverable
 */
export const updateServiceDeliverable = async (
  deliverableId: string,
  updates: UpdateDeliverableData,
): Promise<ServiceDeliverableResponse> => {
  try {
    const updateData: any = { ...updates };

    // Set reviewed_at when status changes to accepted/rejected/revision_requested
    if (updates.status && ['accepted', 'rejected', 'revision_requested'].includes(updates.status)) {
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('service_deliverables')
      .update(updateData)
      .eq('id', deliverableId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service deliverable:', error);
      return {
        data: null,
        error: error.message || 'Failed to update service deliverable',
      };
    }

    // Trigger notifications for status changes
    try {
      if (updates.status) {
        await notifyDeliverableStatusChange(data);
      }
    } catch (notificationError) {
      console.error('Error sending deliverable status notifications:', notificationError);
      // Don't fail the deliverable update if notifications fail
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating service deliverable:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the service deliverable',
    };
  }
};

/**
 * Delete a deliverable
 */
export const deleteServiceDeliverable = async (
  deliverableId: string,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('service_deliverables').delete().eq('id', deliverableId);

    if (error) {
      console.error('Error deleting service deliverable:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete service deliverable',
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting service deliverable:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the service deliverable',
    };
  }
};

/**
 * Upload deliverable file to Supabase Storage
 */
export const uploadDeliverableFile = async (
  file: File,
  serviceId: string,
  userId: string,
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `service-deliverables/${serviceId}/${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('deliverables') // Using new deliverables bucket
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading deliverable file:', error);
      return {
        url: null,
        error: error.message || 'Failed to upload deliverable file',
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
    console.error('Unexpected error uploading deliverable file:', error);
    return {
      url: null,
      error: 'An unexpected error occurred while uploading the deliverable file',
    };
  }
};

/**
 * Get deliverable statistics for a service
 */
export const getDeliverableStats = async (
  serviceId: string,
): Promise<{
  data: {
    total: number;
    pending: number;
    submitted: number;
    accepted: number;
    rejected: number;
    revision_requested: number;
  } | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('service_deliverables')
      .select('status')
      .eq('service_id', serviceId);

    if (error) {
      console.error('Error fetching deliverable stats:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch deliverable stats',
      };
    }

    const stats = {
      total: data?.length || 0,
      pending: 0,
      submitted: 0,
      accepted: 0,
      rejected: 0,
      revision_requested: 0,
    };

    data?.forEach((deliverable: any) => {
      stats[deliverable.status as keyof typeof stats]++;
    });

    return {
      data: stats,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching deliverable stats:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching deliverable stats',
    };
  }
};

/**
 * Notify participants about deliverable upload
 */
const notifyDeliverableUpload = async (deliverable: ServiceDeliverable): Promise<void> => {
  try {
    // Get service details
    const { data: service } = await supabase
      .from('services')
      .select('name, client_id')
      .eq('id', deliverable.service_id)
      .single();

    if (!service) return;

    const serviceName = service.name || 'Service';
    const notificationContent = getNotificationContent('deliverable', { serviceName });

    // Notify client about new deliverable
    if (service.client_id) {
      await createNotification(
        service.client_id,
        'deliverable',
        notificationContent.title,
        notificationContent.body,
        `/client-portal/services/${deliverable.service_id}/deliverables`,
      );
    }

    // Notify admin users about new deliverable
    const { data: adminUsers } = await supabase.from('profiles').select('id').eq('role', 'admin');

    if (adminUsers) {
      for (const admin of adminUsers) {
        await createNotification(
          admin.id,
          'deliverable',
          notificationContent.title,
          notificationContent.body,
          `/admin/services/${deliverable.service_id}/deliverables`,
        );
      }
    }
  } catch (error) {
    console.error('Error notifying deliverable upload:', error);
    // Don't throw - notifications are not critical
  }
};

/**
 * Notify participants about deliverable status change
 */
const notifyDeliverableStatusChange = async (deliverable: ServiceDeliverable): Promise<void> => {
  try {
    // Get service details
    const { data: service } = await supabase
      .from('services')
      .select('name, client_id')
      .eq('id', deliverable.service_id)
      .single();

    if (!service) return;

    const serviceName = service.name || 'Service';

    // Notify client about status changes
    if (service.client_id && deliverable.uploaded_by_type === 'admin') {
      const statusMessages = {
        accepted: 'Your deliverable has been accepted!',
        rejected: 'Your deliverable has been rejected. Please check feedback.',
        revision_requested: 'Revision requested for your deliverable.',
      };

      const message =
        statusMessages[deliverable.status as keyof typeof statusMessages] ||
        `Your deliverable status has been updated to ${deliverable.status}`;

      await createNotification(
        service.client_id,
        'deliverable',
        'Deliverable Status Update',
        message,
        `/client-portal/services/${deliverable.service_id}/deliverables`,
      );
    }

    // Notify uploader if someone else updated the status
    if (deliverable.uploaded_by !== deliverable.reviewed_by && deliverable.reviewed_by) {
      const statusMessages = {
        accepted: 'Your submitted deliverable has been accepted!',
        rejected: 'Your submitted deliverable has been rejected. Please check feedback.',
        revision_requested: 'Revision has been requested for your deliverable.',
      };

      const message =
        statusMessages[deliverable.status as keyof typeof statusMessages] ||
        `Your deliverable status has been updated to ${deliverable.status}`;

      await createNotification(
        deliverable.uploaded_by,
        'deliverable',
        'Deliverable Status Update',
        message,
        deliverable.uploaded_by_type === 'admin'
          ? `/admin/services/${deliverable.service_id}/deliverables`
          : `/agent/services/${deliverable.service_id}/deliverables`,
      );
    }
  } catch (error) {
    console.error('Error notifying deliverable status change:', error);
    // Don't throw - notifications are not critical
  }
};
