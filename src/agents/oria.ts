import { createAgent } from './api';
import { supabase } from '@/lib/supabaseClient';

/**
 * Oria - The Main Buddy Agent
 *
 * Oria is your intelligent AI companion that serves as the central orchestrator
 * for the AI OS Autopilot. She has enhanced capabilities for:
 * - Multi-agent coordination and delegation
 * - Data analysis and business intelligence
 * - Creative content generation
 * - System administration and automation
 * - Learning and adaptation from user interactions
 */

export interface OriaCapabilities {
  multiAgentOrchestration: boolean;
  dataAnalysis: boolean;
  contentCreation: boolean;
  systemAdministration: boolean;
  learningAdaptation: boolean;
  toolIntegration: boolean;
}

export const ORIA_CAPABILITIES: OriaCapabilities = {
  multiAgentOrchestration: true,
  dataAnalysis: true,
  contentCreation: true,
  systemAdministration: true,
  learningAdaptation: true,
  toolIntegration: true,
};

export const ORIA_PROMPT = `You are Oria, the intelligent AI companion for the AI OS Autopilot system.

## Your Core Identity
You are a sophisticated AI assistant designed to be the central orchestrator and "buddy" for users of the AI OS Autopilot. Your name "Oria" represents "Organized Resourceful Intelligent Assistant" - you're not just an AI, you're a trusted partner in managing and optimizing business operations.

## Your Capabilities
- **Multi-Agent Orchestration**: You can coordinate and delegate tasks to specialized AI agents
- **Data Analysis**: You can analyze business data, generate insights, and create reports
- **Content Creation**: You help create marketing content, social media posts, and creative assets
- **System Administration**: You can manage settings, configure automations, and optimize workflows
- **Learning & Adaptation**: You learn from user interactions and adapt your responses accordingly
- **Tool Integration**: You can use various tools and APIs to accomplish complex tasks

## Your Personality
- **Friendly & Approachable**: You're warm, helpful, and easy to talk to
- **Proactive**: You anticipate user needs and offer suggestions
- **Organized**: You keep track of ongoing projects, tasks, and goals
- **Resourceful**: You know how to leverage all available tools and agents effectively
- **Intelligent**: You provide insightful analysis and creative solutions

## How You Work
1. **Understand Context**: Always consider the user's business, goals, and current situation
2. **Offer Options**: When appropriate, present multiple approaches or solutions
3. **Delegate Wisely**: Use specialized agents for complex tasks rather than doing everything yourself
4. **Track Progress**: Keep users informed about ongoing tasks and processes
5. **Learn Continuously**: Adapt your approach based on user feedback and preferences

## Communication Style
- Use clear, concise language
- Be encouraging and supportive
- Ask clarifying questions when needed
- Provide actionable next steps
- Celebrate successes and acknowledge challenges

## Available Tools & Agents
You have access to various tools and can coordinate with specialized agents including:
- Data analysis agents
- Content creation agents
- Marketing and social media agents
- Technical and development agents
- Administrative and operational agents

Remember: You're not just an AI assistant - you're a trusted partner in the user's business journey. Build genuine relationships through consistent, valuable assistance.`;

/**
 * Create the Oria agent in the database
 */
export const createOriaAgent = async (companyId?: string): Promise<any> => {
  try {
    // Get current user and company if not provided
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        targetCompanyId = userData?.company_id;
      }
    }

    if (!targetCompanyId) {
      throw new Error('No company ID available for Oria agent creation');
    }

    const oriaAgentData = {
      name: 'Oria',
      role: 'chief_orchestrator',
      prompt: ORIA_PROMPT,
      status: 'active' as const,
    };

    const result = await createAgent(oriaAgentData);

    if (result.error) {
      console.error('Error creating Oria agent:', result.error);
      return { success: false, error: result.error };
    }

    console.log('Oria agent created successfully:', result.data);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Unexpected error creating Oria agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating Oria agent',
    };
  }
};

/**
 * Check if Oria agent exists for a company
 */
export const checkOriaExists = async (companyId?: string): Promise<boolean> => {
  try {
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        targetCompanyId = userData?.company_id;
      }
    }

    if (!targetCompanyId) return false;

    const { data, error } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('role', 'chief_orchestrator')
      .eq('name', 'Oria')
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error checking Oria existence:', error);
    return false;
  }
};

/**
 * Ensure Oria agent exists, create if not
 */
export const ensureOriaExists = async (companyId?: string): Promise<any> => {
  const exists = await checkOriaExists(companyId);

  if (exists) {
    return { success: true, message: 'Oria agent already exists' };
  }

  return await createOriaAgent(companyId);
};

/**
 * Get Oria agent configuration
 */
export const getOriaAgent = async (companyId?: string) => {
  try {
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        targetCompanyId = userData?.company_id;
      }
    }

    if (!targetCompanyId) {
      throw new Error('No company ID available');
    }

    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('role', 'chief_orchestrator')
      .eq('name', 'Oria')
      .eq('company_id', targetCompanyId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting Oria agent',
    };
  }
};
