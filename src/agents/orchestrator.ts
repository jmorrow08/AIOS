import { getAgentByRole, getAgents, logAgentInteraction, Agent } from './api';
import { sendLLMMessage, createLLMConfig } from './llm';

export interface TaskResult {
  success: boolean;
  response: string;
  error?: string;
  delegatedTasks?: TaskResult[];
}

/**
 * Route a task to the appropriate agent
 */
export const routeTask = async (agentRole: string, task: string): Promise<TaskResult> => {
  try {
    // Fetch agent configuration from Supabase
    const agentResponse = await getAgentByRole(agentRole);

    if (agentResponse.error || !agentResponse.data) {
      return {
        success: false,
        response: '',
        error: `Agent with role '${agentRole}' not found: ${agentResponse.error}`,
      };
    }

    const agent = agentResponse.data as Agent;

    // Check if agent is Chief and handle delegation
    if (agentRole.toLowerCase() === 'chief') {
      return await handleChiefDelegation(agent, task);
    }

    // Process task with the specified agent
    return await processAgentTask(agent, task);
  } catch (error) {
    console.error('Error in routeTask:', error);
    return {
      success: false,
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error in routeTask',
    };
  }
};

/**
 * Handle delegation logic for Chief agent
 */
const handleChiefDelegation = async (chiefAgent: Agent, task: string): Promise<TaskResult> => {
  const delegatedTasks: TaskResult[] = [];

  try {
    // First, analyze the task with the Chief agent to determine delegation needs
    const analysisResult = await processAgentTask(chiefAgent, task);

    if (!analysisResult.success) {
      return analysisResult;
    }

    // Parse the Chief's response to determine which agents to delegate to
    const delegationPlan = parseDelegationPlan(analysisResult.response);

    if (delegationPlan.length === 0) {
      // No delegation needed, return Chief's direct response
      return analysisResult;
    }

    // Execute delegated tasks sequentially
    let finalResponse = analysisResult.response;

    for (const delegateRole of delegationPlan) {
      const delegateResult = await routeTask(delegateRole, task);

      delegatedTasks.push(delegateResult);

      if (delegateResult.success) {
        // Combine results (you can customize this logic)
        finalResponse += `\n\n--- ${delegateRole.toUpperCase()} Agent Response ---\n${
          delegateResult.response
        }`;
      }
    }

    return {
      success: true,
      response: finalResponse,
      delegatedTasks,
    };
  } catch (error) {
    console.error('Error in Chief delegation:', error);
    return {
      success: false,
      response: '',
      error: error instanceof Error ? error.message : 'Error in Chief delegation',
    };
  }
};

/**
 * Process a task with a specific agent
 */
const processAgentTask = async (agent: Agent, task: string): Promise<TaskResult> => {
  try {
    // Check if agent has LLM configuration
    if (!agent.llm_provider) {
      return {
        success: false,
        response: '',
        error: `Agent '${agent.name}' does not have LLM provider configured`,
      };
    }

    // Create LLM configuration
    const llmConfig = createLLMConfig(agent.llm_provider, agent.api_key_ref, agent.llm_model);

    if (!llmConfig) {
      return {
        success: false,
        response: '',
        error: `Failed to create LLM configuration for agent '${agent.name}'`,
      };
    }

    // Prepare the prompt
    const prompt =
      agent.prompt || `You are ${agent.name}, an AI agent specialized in ${agent.role}.`;

    // Send task to LLM
    const llmResponse = await sendLLMMessage(llmConfig, prompt, task);

    // Log the interaction
    await logAgentInteraction({
      agent_id: agent.id,
      input: task,
      output: llmResponse.content,
      error: llmResponse.error,
    });

    if (llmResponse.error) {
      return {
        success: false,
        response: '',
        error: llmResponse.error,
      };
    }

    return {
      success: true,
      response: llmResponse.content,
    };
  } catch (error) {
    console.error('Error processing agent task:', error);

    // Log the error
    await logAgentInteraction({
      agent_id: agent.id,
      input: task,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      response: '',
      error: error instanceof Error ? error.message : 'Error processing agent task',
    };
  }
};

/**
 * Parse delegation plan from Chief agent's response
 * This is a simple implementation - you can make this more sophisticated
 */
const parseDelegationPlan = (chiefResponse: string): string[] => {
  const delegationKeywords = [
    'delegate to',
    'ask the',
    'consult with',
    'get help from',
    'involve the',
  ];

  const delegatedRoles: string[] = [];

  // Simple keyword-based parsing (can be improved with more sophisticated NLP)
  const responseLower = chiefResponse.toLowerCase();

  // Common agent roles to look for
  const commonRoles = [
    'sales',
    'marketing',
    'support',
    'technical',
    'finance',
    'operations',
    'research',
    'analysis',
    'writing',
    'design',
  ];

  for (const role of commonRoles) {
    if (
      responseLower.includes(role) &&
      delegationKeywords.some((keyword) => responseLower.includes(keyword))
    ) {
      delegatedRoles.push(role);
    }
  }

  // Remove duplicates
  return [...new Set(delegatedRoles)];
};

/**
 * Get all available agent roles
 */
export const getAvailableAgentRoles = async (): Promise<string[]> => {
  try {
    const agentsResponse = await getAgents();

    if (agentsResponse.error || !agentsResponse.data) {
      console.error('Error fetching agents:', agentsResponse.error);
      return [];
    }

    const agents = agentsResponse.data as Agent[];
    return agents.map((agent) => agent.role);
  } catch (error) {
    console.error('Error getting available agent roles:', error);
    return [];
  }
};

/**
 * Check if an agent role exists and is active
 */
export const isAgentRoleAvailable = async (role: string): Promise<boolean> => {
  try {
    const agentResponse = await getAgentByRole(role);
    return !agentResponse.error && !!agentResponse.data;
  } catch (error) {
    console.error('Error checking agent role availability:', error);
    return false;
  }
};
