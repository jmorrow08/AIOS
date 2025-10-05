import { supabase } from '@/lib/supabaseClient';

export interface MediaProject {
  id: string;
  title: string;
  type: 'image' | 'video' | 'audio';
  description?: string;
  brief?: string;
  script?: string;
  image_paths?: string[];
  audio_path?: string;
  status: 'draft' | 'completed' | 'exported';
  scenes?: any[]; // JSON array of Scene objects
  settings?: any; // JSON object of MediaProjectSettings
  export_url?: string;
  export_options?: any; // JSON object of VideoExportOptions
  render_progress?: any; // JSON object of RenderProgress
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MediaProjectResponse {
  data: MediaProject | MediaProject[] | null;
  error: string | null;
}

export interface CreateMediaProjectData {
  title: string;
  type: 'image' | 'video' | 'audio';
  description?: string;
  brief?: string;
  script?: string;
  image_paths?: string[];
  audio_path?: string;
  status?: 'draft' | 'completed' | 'exported';
}

/**
 * Create a new media project
 */
export const createMediaProject = async (
  projectData: CreateMediaProjectData,
): Promise<MediaProjectResponse> => {
  try {
    const { data, error } = await supabase
      .from('media_projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error('Error creating media project:', error);
      return {
        data: null,
        error: error.message || 'Failed to create media project',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating media project:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the media project',
    };
  }
};

/**
 * Get all media projects for the current user
 */
export const getMediaProjects = async (): Promise<MediaProjectResponse> => {
  try {
    const { data, error } = await supabase
      .from('media_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching media projects:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch media projects',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching media projects:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching media projects',
    };
  }
};

/**
 * Get media projects by type
 */
export const getMediaProjectsByType = async (
  projectType: 'image' | 'video' | 'audio',
): Promise<MediaProjectResponse> => {
  try {
    const { data, error } = await supabase
      .from('media_projects')
      .select('*')
      .eq('type', projectType)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching media projects by type:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch media projects by type',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching media projects by type:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching media projects by type',
    };
  }
};

/**
 * Get a single media project by ID
 */
export const getMediaProjectById = async (projectId: string): Promise<MediaProjectResponse> => {
  try {
    const { data, error } = await supabase
      .from('media_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching media project:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch media project',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching media project:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the media project',
    };
  }
};

/**
 * Update a media project
 */
export const updateMediaProject = async (
  projectId: string,
  updates: Partial<CreateMediaProjectData>,
): Promise<MediaProjectResponse> => {
  try {
    const { data, error } = await supabase
      .from('media_projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating media project:', error);
      return {
        data: null,
        error: error.message || 'Failed to update media project',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating media project:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the media project',
    };
  }
};

/**
 * Delete a media project
 */
export const deleteMediaProject = async (projectId: string): Promise<MediaProjectResponse> => {
  try {
    const { error } = await supabase.from('media_projects').delete().eq('id', projectId);

    if (error) {
      console.error('Error deleting media project:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete media project',
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting media project:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the media project',
    };
  }
};
