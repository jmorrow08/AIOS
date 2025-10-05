import { supabase } from '@/lib/supabaseClient';
import { createNotification } from '@/api/notifications';

export interface ServiceFeedback {
  id: string;
  service_id: string;
  client_id: string;
  rating: number; // 1-5
  comment?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFeedbackResponse {
  data: ServiceFeedback | ServiceFeedback[] | null;
  error: string | null;
}

export interface CreateFeedbackData {
  service_id: string;
  client_id: string;
  rating: number;
  comment?: string;
  is_public?: boolean;
}

/**
 * Get feedback for a specific service
 */
export const getServiceFeedback = async (serviceId: string): Promise<ServiceFeedbackResponse> => {
  try {
    const { data, error } = await supabase
      .from('service_feedback')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching service feedback:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch service feedback',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching service feedback:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching service feedback',
    };
  }
};

/**
 * Create new feedback for a service
 */
export const createServiceFeedback = async (
  feedbackData: CreateFeedbackData,
): Promise<ServiceFeedbackResponse> => {
  try {
    const { data, error } = await supabase
      .from('service_feedback')
      .insert([
        {
          ...feedbackData,
          is_public: feedbackData.is_public || false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating service feedback:', error);
      return {
        data: null,
        error: error.message || 'Failed to create service feedback',
      };
    }

    // Trigger notifications for feedback submission
    try {
      await notifyFeedbackSubmission(data);
    } catch (notificationError) {
      console.error('Error sending feedback notifications:', notificationError);
      // Don't fail the feedback creation if notifications fail
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating service feedback:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the service feedback',
    };
  }
};

/**
 * Update existing feedback
 */
export const updateServiceFeedback = async (
  feedbackId: string,
  updates: Partial<Pick<CreateFeedbackData, 'rating' | 'comment' | 'is_public'>>,
): Promise<ServiceFeedbackResponse> => {
  try {
    const { data, error } = await supabase
      .from('service_feedback')
      .update(updates)
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) {
      console.error('Error updating service feedback:', error);
      return {
        data: null,
        error: error.message || 'Failed to update service feedback',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating service feedback:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the service feedback',
    };
  }
};

/**
 * Get public testimonials (feedback marked as public)
 */
export const getPublicTestimonials = async (
  companyId?: string,
  limit: number = 10,
): Promise<ServiceFeedbackResponse> => {
  try {
    let query = supabase
      .from('service_feedback')
      .select(
        `
        *,
        services (
          id,
          name,
          company_id
        )
      `,
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by company if provided
    if (companyId) {
      query = query.eq('services.company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching public testimonials:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch public testimonials',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching public testimonials:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching public testimonials',
    };
  }
};

/**
 * Get feedback statistics for a company
 */
export const getFeedbackStats = async (
  companyId?: string,
): Promise<{
  data: {
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    publicTestimonials: number;
  } | null;
  error: string | null;
}> => {
  try {
    let query = supabase.from('service_feedback').select('rating, is_public, services(company_id)');

    if (companyId) {
      query = query.eq('services.company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching feedback stats:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch feedback stats',
      };
    }

    if (!data || data.length === 0) {
      return {
        data: {
          totalFeedback: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          publicTestimonials: 0,
        },
        error: null,
      };
    }

    const totalFeedback = data.length;
    const averageRating = data.reduce((sum, item: any) => sum + item.rating, 0) / totalFeedback;
    const publicTestimonials = data.filter((item: any) => item.is_public).length;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach((item: any) => {
      ratingDistribution[item.rating as keyof typeof ratingDistribution]++;
    });

    return {
      data: {
        totalFeedback,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        ratingDistribution,
        publicTestimonials,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching feedback stats:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching feedback stats',
    };
  }
};

/**
 * Check if a client has already submitted feedback for a service
 */
export const hasClientSubmittedFeedback = async (
  serviceId: string,
  clientId: string,
): Promise<{ hasSubmitted: boolean; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('service_feedback')
      .select('id')
      .eq('service_id', serviceId)
      .eq('client_id', clientId)
      .limit(1);

    if (error) {
      console.error('Error checking feedback submission:', error);
      return {
        hasSubmitted: false,
        error: error.message || 'Failed to check feedback submission',
      };
    }

    return {
      hasSubmitted: data && data.length > 0,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error checking feedback submission:', error);
    return {
      hasSubmitted: false,
      error: 'An unexpected error occurred while checking feedback submission',
    };
  }
};

/**
 * Notify admins about feedback submission
 */
const notifyFeedbackSubmission = async (feedback: ServiceFeedback): Promise<void> => {
  try {
    // Get service details
    const { data: service } = await supabase
      .from('services')
      .select('name')
      .eq('id', feedback.service_id)
      .single();

    const serviceName = service?.name || 'Service';

    // Notify admin users about new feedback
    const { data: adminUsers } = await supabase.from('profiles').select('id').eq('role', 'admin');

    if (adminUsers) {
      for (const admin of adminUsers) {
        await createNotification(
          admin.id,
          'feedback',
          'New Feedback Submitted',
          `New feedback (rating: ${feedback.rating}/5) has been submitted for ${serviceName}`,
          `/admin/services/${feedback.service_id}/feedback`,
        );
      }
    }
  } catch (error) {
    console.error('Error notifying feedback submission:', error);
    // Don't throw - notifications are not critical
  }
};
