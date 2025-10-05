import { supabase } from '@/lib/supabaseClient';
import {
  generateSOP,
  saveSOP,
  updateSOP,
  getSOPs,
  publishSOP,
  exportSOPToPDF,
  createSOPVersion,
  type SOPRequest,
  type SOPDocument,
  type SOPResponse,
} from '@/agents';

export interface SOPApiResponse {
  success: boolean;
  data?: SOPDocument | SOPDocument[];
  error?: string;
  pdfUrl?: string;
}

/**
 * Generate a new SOP
 */
export const generateSOPApi = async (request: SOPRequest): Promise<SOPApiResponse> => {
  try {
    // Check user permissions (only admins and agents can generate SOPs)
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Check user role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.user.id)
      .single();

    if (!userProfile || !['admin', 'agent'].includes(userProfile.role)) {
      return {
        success: false,
        error: 'Insufficient permissions to generate SOPs',
      };
    }

    const result = await generateSOP({
      ...request,
      userId: user.user.id,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.sop,
    };
  } catch (error) {
    console.error('Error in generateSOPApi:', error);
    return {
      success: false,
      error: 'Failed to generate SOP',
    };
  }
};

/**
 * Save an SOP document
 */
export const saveSOPApi = async (sop: SOPDocument): Promise<SOPApiResponse> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const result = await saveSOP({
      ...sop,
      created_by: user.user.id,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.sop,
    };
  } catch (error) {
    console.error('Error in saveSOPApi:', error);
    return {
      success: false,
      error: 'Failed to save SOP',
    };
  }
};

/**
 * Update an existing SOP
 */
export const updateSOPApi = async (
  sopId: string,
  updates: Partial<SOPDocument>,
): Promise<SOPApiResponse> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const result = await updateSOP(sopId, updates);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.sop,
    };
  } catch (error) {
    console.error('Error in updateSOPApi:', error);
    return {
      success: false,
      error: 'Failed to update SOP',
    };
  }
};

/**
 * Get SOP documents with optional filtering
 */
export const getSOPsApi = async (filters?: {
  audience?: string;
  topic?: string;
  status?: string;
  created_by?: string;
}): Promise<SOPApiResponse> => {
  try {
    const result = await getSOPs(filters);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.sops,
    };
  } catch (error) {
    console.error('Error in getSOPsApi:', error);
    return {
      success: false,
      error: 'Failed to fetch SOPs',
    };
  }
};

/**
 * Get a specific SOP by ID
 */
export const getSOPByIdApi = async (sopId: string): Promise<SOPApiResponse> => {
  try {
    const { data, error } = await supabase.from('sop_docs').select('*').eq('id', sopId).single();

    if (error) {
      console.error('Error fetching SOP:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch SOP',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Unexpected error fetching SOP:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching the SOP',
    };
  }
};

/**
 * Publish an SOP (requires admin approval)
 */
export const publishSOPApi = async (sopId: string): Promise<SOPApiResponse> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Check if user has admin role for publishing
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return {
        success: false,
        error: 'Only administrators can publish SOPs',
      };
    }

    const result = await publishSOP(sopId, user.user.id);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.sop,
    };
  } catch (error) {
    console.error('Error in publishSOPApi:', error);
    return {
      success: false,
      error: 'Failed to publish SOP',
    };
  }
};

/**
 * Export SOP to PDF
 */
export const exportSOPToPDFApi = async (sopId: string): Promise<SOPApiResponse> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const result = await exportSOPToPDF(sopId);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      pdfUrl: result.pdfUrl,
    };
  } catch (error) {
    console.error('Error in exportSOPToPDFApi:', error);
    return {
      success: false,
      error: 'Failed to export SOP to PDF',
    };
  }
};

/**
 * Create a new version of an existing SOP
 */
export const createSOPVersionApi = async (
  originalSopId: string,
  newContent: string,
): Promise<SOPApiResponse> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const result = await createSOPVersion(originalSopId, newContent, user.user.id);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.sop,
    };
  } catch (error) {
    console.error('Error in createSOPVersionApi:', error);
    return {
      success: false,
      error: 'Failed to create SOP version',
    };
  }
};

/**
 * Delete an SOP (only creators and admins can delete)
 */
export const deleteSOPApi = async (sopId: string): Promise<SOPApiResponse> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Get the SOP to check ownership
    const { data: sop } = await supabase
      .from('sop_docs')
      .select('created_by')
      .eq('id', sopId)
      .single();

    // Check user permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.user.id)
      .single();

    const isOwner = sop?.created_by === user.user.id;
    const isAdmin = userProfile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Insufficient permissions to delete this SOP',
      };
    }

    const { error } = await supabase.from('sop_docs').delete().eq('id', sopId);

    if (error) {
      console.error('Error deleting SOP:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete SOP',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error deleting SOP:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the SOP',
    };
  }
};
