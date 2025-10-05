import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/api/dashboard';

export interface ClientProfile {
  id: string;
  client_id: string;
  company_id?: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  business_type?: string;
  company_size?: string;
  industry?: string;
  years_in_business?: number;
  primary_goals?: string[];
  pain_points?: string[];
  current_tools?: string[];
  budget_range?: string;
  timeline?: string;
  system_plan_id?: string;
  system_plan?: any;
  onboarding_status: 'in_progress' | 'completed' | 'cancelled';
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateClientProfileData {
  client_id: string;
  company_id?: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  business_type?: string;
  company_size?: string;
  industry?: string;
  years_in_business?: number;
  primary_goals?: string[];
  pain_points?: string[];
  current_tools?: string[];
  budget_range?: string;
  timeline?: string;
  system_plan?: any;
  created_by?: string;
}

export interface UpdateClientProfileData extends Partial<CreateClientProfileData> {
  onboarding_status?: 'in_progress' | 'completed' | 'cancelled';
  system_plan_id?: string;
}

export interface ClientProfileResponse {
  data: ClientProfile | ClientProfile[] | null;
  error: string | null;
}

/**
 * Create a new client profile
 */
export const createClientProfile = async (
  profileData: CreateClientProfileData,
): Promise<ClientProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .insert([
        {
          client_id: profileData.client_id,
          company_id: profileData.company_id || null,
          name: profileData.name,
          role: profileData.role || null,
          email: profileData.email || null,
          phone: profileData.phone || null,
          business_type: profileData.business_type || null,
          company_size: profileData.company_size || null,
          industry: profileData.industry || null,
          years_in_business: profileData.years_in_business || null,
          primary_goals: profileData.primary_goals
            ? JSON.stringify(profileData.primary_goals)
            : null,
          pain_points: profileData.pain_points ? JSON.stringify(profileData.pain_points) : null,
          current_tools: profileData.current_tools
            ? JSON.stringify(profileData.current_tools)
            : null,
          budget_range: profileData.budget_range || null,
          timeline: profileData.timeline || null,
          system_plan: profileData.system_plan ? JSON.stringify(profileData.system_plan) : null,
          onboarding_status: 'in_progress',
          created_by: profileData.created_by || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating client profile:', error);
      return {
        data: null,
        error: error.message || 'Failed to create client profile',
      };
    }

    // Log activity
    try {
      await logActivity(
        `Client profile created for "${profileData.name}"`,
        'client',
        '/onboarding',
        {
          client_profile_id: data.id,
          client_id: profileData.client_id,
          profile_name: profileData.name,
        },
      );
    } catch (logError) {
      console.warn('Failed to log client profile creation activity:', logError);
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating client profile:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the client profile',
    };
  }
};

/**
 * Get all client profiles
 */
export const getClientProfiles = async (): Promise<ClientProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client profiles:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch client profiles',
      };
    }

    // Parse JSON fields
    const profiles = data?.map((profile) => ({
      ...profile,
      primary_goals: profile.primary_goals ? JSON.parse(profile.primary_goals) : null,
      pain_points: profile.pain_points ? JSON.parse(profile.pain_points) : null,
      current_tools: profile.current_tools ? JSON.parse(profile.current_tools) : null,
      system_plan: profile.system_plan ? JSON.parse(profile.system_plan) : null,
    }));

    return {
      data: profiles || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching client profiles:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching client profiles',
    };
  }
};

/**
 * Get a single client profile by ID
 */
export const getClientProfileById = async (profileId: string): Promise<ClientProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      console.error('Error fetching client profile:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch client profile',
      };
    }

    // Parse JSON fields
    const profile = {
      ...data,
      primary_goals: data.primary_goals ? JSON.parse(data.primary_goals) : null,
      pain_points: data.pain_points ? JSON.parse(data.pain_points) : null,
      current_tools: data.current_tools ? JSON.parse(data.current_tools) : null,
      system_plan: data.system_plan ? JSON.parse(data.system_plan) : null,
    };

    return {
      data: profile,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching client profile:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the client profile',
    };
  }
};

/**
 * Get client profile by client ID
 */
export const getClientProfileByClientId = async (
  clientId: string,
): Promise<ClientProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('Error fetching client profile:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch client profile',
      };
    }

    // Parse JSON fields
    const profile = {
      ...data,
      primary_goals: data.primary_goals ? JSON.parse(data.primary_goals) : null,
      pain_points: data.pain_points ? JSON.parse(data.pain_points) : null,
      current_tools: data.current_tools ? JSON.parse(data.current_tools) : null,
      system_plan: data.system_plan ? JSON.parse(data.system_plan) : null,
    };

    return {
      data: profile,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching client profile:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the client profile',
    };
  }
};

/**
 * Update a client profile
 */
export const updateClientProfile = async (
  profileId: string,
  updateData: UpdateClientProfileData,
): Promise<ClientProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update({
        name: updateData.name,
        role: updateData.role || null,
        email: updateData.email || null,
        phone: updateData.phone || null,
        business_type: updateData.business_type || null,
        company_size: updateData.company_size || null,
        industry: updateData.industry || null,
        years_in_business: updateData.years_in_business || null,
        primary_goals: updateData.primary_goals
          ? JSON.stringify(updateData.primary_goals)
          : undefined,
        pain_points: updateData.pain_points ? JSON.stringify(updateData.pain_points) : undefined,
        current_tools: updateData.current_tools
          ? JSON.stringify(updateData.current_tools)
          : undefined,
        budget_range: updateData.budget_range || null,
        timeline: updateData.timeline || null,
        system_plan: updateData.system_plan ? JSON.stringify(updateData.system_plan) : undefined,
        system_plan_id: updateData.system_plan_id || null,
        onboarding_status: updateData.onboarding_status,
        completed_at:
          updateData.onboarding_status === 'completed' ? new Date().toISOString() : undefined,
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client profile:', error);
      return {
        data: null,
        error: error.message || 'Failed to update client profile',
      };
    }

    // Log activity
    try {
      await logActivity(`Client profile updated for "${data.name}"`, 'client', '/onboarding', {
        client_profile_id: data.id,
        client_id: data.client_id,
        profile_name: data.name,
      });
    } catch (logError) {
      console.warn('Failed to log client profile update activity:', logError);
    }

    // Parse JSON fields for return
    const profile = {
      ...data,
      primary_goals: data.primary_goals ? JSON.parse(data.primary_goals) : null,
      pain_points: data.pain_points ? JSON.parse(data.pain_points) : null,
      current_tools: data.current_tools ? JSON.parse(data.current_tools) : null,
      system_plan: data.system_plan ? JSON.parse(data.system_plan) : null,
    };

    return {
      data: profile,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating client profile:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the client profile',
    };
  }
};

/**
 * Delete a client profile
 */
export const deleteClientProfile = async (profileId: string): Promise<ClientProfileResponse> => {
  try {
    // First get the profile data for logging
    const { data: profileData } = await getClientProfileById(profileId);

    const { error } = await supabase.from('client_profiles').delete().eq('id', profileId);

    if (error) {
      console.error('Error deleting client profile:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete client profile',
      };
    }

    // Log activity
    if (profileData) {
      try {
        await logActivity(
          `Client profile deleted for "${(profileData as ClientProfile).name}"`,
          'client',
          '/onboarding',
          {
            client_profile_id: profileId,
            client_id: (profileData as ClientProfile).client_id,
            profile_name: (profileData as ClientProfile).name,
          },
        );
      } catch (logError) {
        console.warn('Failed to log client profile deletion activity:', logError);
      }
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting client profile:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the client profile',
    };
  }
};

/**
 * Get client profiles by status
 */
export const getClientProfilesByStatus = async (
  status: 'in_progress' | 'completed' | 'cancelled',
): Promise<ClientProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('onboarding_status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client profiles by status:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch client profiles by status',
      };
    }

    // Parse JSON fields
    const profiles = data?.map((profile) => ({
      ...profile,
      primary_goals: profile.primary_goals ? JSON.parse(profile.primary_goals) : null,
      pain_points: profile.pain_points ? JSON.parse(profile.pain_points) : null,
      current_tools: profile.current_tools ? JSON.parse(profile.current_tools) : null,
      system_plan: profile.system_plan ? JSON.parse(profile.system_plan) : null,
    }));

    return {
      data: profiles || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching client profiles by status:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching client profiles by status',
    };
  }
};
