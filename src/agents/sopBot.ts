import { supabase } from '@/lib/supabaseClient';
import { sendLLMMessage, createLLMConfig } from './llm';
import { getAgentByRole } from './api';
import { performRAGSearch } from './rag';

export interface SOPRequest {
  title: string;
  topic: string;
  audience: 'employee' | 'client' | 'agent';
  notes?: string;
  userId?: string;
}

export interface SOPDocument {
  id?: string;
  title: string;
  version: string;
  content: string;
  audience: string;
  topic: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'published';
  created_by?: string;
  approved_by?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SOPResponse {
  success: boolean;
  sop?: SOPDocument;
  preview?: string;
  error?: string;
}

/**
 * Generate a Standard Operating Procedure using AI
 */
export const generateSOP = async (request: SOPRequest): Promise<SOPResponse> => {
  try {
    // Get SOP Bot agent configuration
    const agentResponse = await getAgentByRole('documentation_specialist');
    if (agentResponse.error || !agentResponse.data) {
      return {
        success: false,
        error: `SOP Bot not found: ${agentResponse.error}`,
      };
    }

    const agent = agentResponse.data;

    // Perform RAG search for relevant context
    const contextSearch = await performRAGSearch(
      `SOP for ${request.topic} ${request.audience}`,
      'documentation_specialist',
    );

    // Build the SOP generation prompt
    const prompt = buildSOPPrompt(request, contextSearch.results);

    // Generate SOP content using LLM
    const llmConfig = createLLMConfig(agent.llm_provider, agent.api_key_ref, agent.llm_model);
    if (!llmConfig) {
      return {
        success: false,
        error: 'LLM configuration not available for SOP generation',
      };
    }

    const llmResponse = await sendLLMMessage(llmConfig, agent.prompt || '', prompt);

    if (llmResponse.error || !llmResponse.content) {
      return {
        success: false,
        error: `Failed to generate SOP: ${llmResponse.error}`,
      };
    }

    // Create SOP document
    const sopContent = llmResponse.content;
    const sopDocument: SOPDocument = {
      title: request.title,
      version: '1.0',
      content: sopContent,
      audience: request.audience,
      topic: request.topic,
      status: 'draft',
      created_by: request.userId,
    };

    return {
      success: true,
      sop: sopDocument,
      preview: sopContent,
    };
  } catch (error) {
    console.error('Error generating SOP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating SOP',
    };
  }
};

/**
 * Save an SOP document to the database
 */
export const saveSOP = async (sop: SOPDocument): Promise<SOPResponse> => {
  try {
    const { data, error } = await supabase
      .from('sop_docs')
      .insert([
        {
          title: sop.title,
          version: sop.version,
          content: sop.content,
          audience: sop.audience,
          topic: sop.topic,
          status: sop.status,
          created_by: sop.created_by,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving SOP:', error);
      return {
        success: false,
        error: error.message || 'Failed to save SOP',
      };
    }

    return {
      success: true,
      sop: data as SOPDocument,
    };
  } catch (error) {
    console.error('Unexpected error saving SOP:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while saving the SOP',
    };
  }
};

/**
 * Update an existing SOP document
 */
export const updateSOP = async (
  sopId: string,
  updates: Partial<SOPDocument>,
): Promise<SOPResponse> => {
  try {
    const { data, error } = await supabase
      .from('sop_docs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sopId)
      .select()
      .single();

    if (error) {
      console.error('Error updating SOP:', error);
      return {
        success: false,
        error: error.message || 'Failed to update SOP',
      };
    }

    return {
      success: true,
      sop: data as SOPDocument,
    };
  } catch (error) {
    console.error('Unexpected error updating SOP:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while updating the SOP',
    };
  }
};

/**
 * Get SOP documents with filtering
 */
export const getSOPs = async (filters?: {
  audience?: string;
  topic?: string;
  status?: string;
  created_by?: string;
}): Promise<{ success: boolean; sops?: SOPDocument[]; error?: string }> => {
  try {
    let query = supabase.from('sop_docs').select('*').order('created_at', { ascending: false });

    if (filters?.audience) {
      query = query.eq('audience', filters.audience);
    }

    if (filters?.topic) {
      query = query.ilike('topic', `%${filters.topic}%`);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching SOPs:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch SOPs',
      };
    }

    return {
      success: true,
      sops: data as SOPDocument[],
    };
  } catch (error) {
    console.error('Unexpected error fetching SOPs:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching SOPs',
    };
  }
};

/**
 * Publish an SOP document (requires admin approval)
 */
export const publishSOP = async (sopId: string, approvedBy: string): Promise<SOPResponse> => {
  try {
    const { data, error } = await supabase
      .from('sop_docs')
      .update({
        status: 'published',
        approved_by: approvedBy,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sopId)
      .select()
      .single();

    if (error) {
      console.error('Error publishing SOP:', error);
      return {
        success: false,
        error: error.message || 'Failed to publish SOP',
      };
    }

    return {
      success: true,
      sop: data as SOPDocument,
    };
  } catch (error) {
    console.error('Unexpected error publishing SOP:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while publishing the SOP',
    };
  }
};

/**
 * Export SOP as PDF (placeholder - would integrate with PDF generation service)
 */
export const exportSOPToPDF = async (
  sopId: string,
): Promise<{ success: boolean; pdfUrl?: string; error?: string }> => {
  try {
    // Get SOP content
    const { data: sop, error: fetchError } = await supabase
      .from('sop_docs')
      .select('*')
      .eq('id', sopId)
      .single();

    if (fetchError || !sop) {
      return {
        success: false,
        error: 'SOP not found',
      };
    }

    // In a real implementation, this would use a PDF generation service
    // For now, we'll return a placeholder
    console.log('PDF export would be implemented here for SOP:', sop.title);

    return {
      success: true,
      pdfUrl: `https://example.com/sop-${sopId}.pdf`,
    };
  } catch (error) {
    console.error('Error exporting SOP to PDF:', error);
    return {
      success: false,
      error: 'Failed to export SOP to PDF',
    };
  }
};

/**
 * Build the SOP generation prompt
 */
const buildSOPPrompt = (request: SOPRequest, contextResults: any[]): string => {
  const contextText =
    contextResults.length > 0
      ? `\n\nRelevant context from knowledge library:\n${contextResults
          .slice(0, 3)
          .map((result) => `- ${result.title}: ${result.content.substring(0, 200)}...`)
          .join('\n')}`
      : '';

  const audienceGuidelines = {
    employee: `
- Focus on internal processes and procedures
- Include safety considerations and compliance requirements
- Use professional but accessible language
- Include step-by-step instructions with checkpoints`,
    client: `
- Focus on how the process benefits the client
- Use client-friendly language
- Emphasize quality and service aspects
- Include contact information for support`,
    agent: `
- Focus on technical implementation details
- Include API endpoints and data structures
- Specify error handling and edge cases
- Include performance considerations`,
  };

  return `Generate a comprehensive Standard Operating Procedure (SOP) with the following requirements:

**SOP Details:**
- Title: ${request.title}
- Topic: ${request.topic}
- Target Audience: ${request.audience}
${request.notes ? `- Additional Notes: ${request.notes}` : ''}

**Audience-Specific Guidelines:**
${audienceGuidelines[request.audience]}

**SOP Structure Requirements:**
1. **Purpose/Objective** - Clear statement of what this SOP achieves
2. **Scope** - What this SOP covers and any limitations
3. **Responsibilities** - Who is responsible for what
4. **Procedure** - Step-by-step instructions
5. **References** - Related documents or resources
6. **Revision History** - Version tracking
7. **Approval** - Who approved this SOP

**Writing Guidelines:**
- Use clear, concise language appropriate for the audience
- Number all steps and sub-steps
- Include decision points and conditional actions
- Add safety warnings where applicable
- Use bullet points for lists and checklists
- Include any required forms or documentation

${contextText}

Generate the complete SOP in Markdown format with proper headings and formatting.`;
};

/**
 * Create a new version of an existing SOP
 */
export const createSOPVersion = async (
  originalSopId: string,
  newContent: string,
  userId: string,
): Promise<SOPResponse> => {
  try {
    // Get the original SOP
    const { data: originalSop, error: fetchError } = await supabase
      .from('sop_docs')
      .select('*')
      .eq('id', originalSopId)
      .single();

    if (fetchError || !originalSop) {
      return {
        success: false,
        error: 'Original SOP not found',
      };
    }

    // Increment version (simple implementation)
    const currentVersion = parseFloat(originalSop.version);
    const newVersion = (currentVersion + 0.1).toFixed(1);

    // Create new version
    const newSop: SOPDocument = {
      title: originalSop.title,
      version: newVersion,
      content: newContent,
      audience: originalSop.audience,
      topic: originalSop.topic,
      status: 'draft',
      created_by: userId,
    };

    return await saveSOP(newSop);
  } catch (error) {
    console.error('Error creating SOP version:', error);
    return {
      success: false,
      error: 'Failed to create new SOP version',
    };
  }
};
