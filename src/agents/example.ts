/**
 * Example usage of the AI Agent Orchestrator
 *
 * This file demonstrates how to use the routeTask function and other utilities
 * from the agents module.
 */

import { routeTask, getAvailableAgentRoles, isAgentRoleAvailable } from './index';

/**
 * Example: Route a task to a specific agent
 */
export const exampleRouteTask = async () => {
  try {
    const result = await routeTask(
      'sales_support',
      'Generate a sales pitch for our new AI consulting service',
    );

    if (result.success) {
      console.log('Agent Response:', result.response);
    } else {
      console.error('Error:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

/**
 * Example: Use Chief agent with delegation
 */
export const exampleChiefDelegation = async () => {
  try {
    const result = await routeTask(
      'chief',
      'Plan a comprehensive marketing strategy for our AI products',
    );

    if (result.success) {
      console.log('Chief Agent Response:', result.response);

      if (result.delegatedTasks && result.delegatedTasks.length > 0) {
        console.log('Delegated Tasks:');
        result.delegatedTasks.forEach((task, index) => {
          console.log(`Task ${index + 1}:`, task.success ? 'Success' : 'Failed');
          if (task.error) {
            console.log('Error:', task.error);
          }
        });
      }
    } else {
      console.error('Error:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

/**
 * Example: Check available agent roles
 */
export const exampleCheckAgents = async () => {
  try {
    const roles = await getAvailableAgentRoles();
    console.log('Available agent roles:', roles);

    const salesAvailable = await isAgentRoleAvailable('sales_support');
    console.log('Sales support agent available:', salesAvailable);

    return { roles, salesAvailable };
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

/**
 * Example: Environment variables setup
 *
 * Make sure to set these environment variables in your .env file:
 *
 * VITE_OPENAI_API_KEY=your_openai_api_key
 * VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
 * VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
 *
 * Or use custom API key references in the agent configuration.
 */

/**
 * Example: Agent configuration in database
 *
 * When creating agents in the database, set these fields:
 *
 * - name: "Sales Assistant"
 * - role: "sales_support"
 * - prompt: "You are a helpful sales assistant AI specializing in AI consulting services."
 * - llm_provider: "openai" | "claude" | "gemini"
 * - llm_model: "gpt-4" | "claude-3-sonnet-20240229" | "gemini-pro"
 * - api_key_ref: "VITE_OPENAI_API_KEY" (optional, uses default if not set)
 * - status: "active"
 */
