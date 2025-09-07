import { supabase } from '@/lib/supabaseClient';
import {
  AutomationFlow,
  AutomationNode,
  AutomationExecutionPayload,
  AutomationExecutionResult,
  TestPayload,
} from '@/lib/types';

// Flow CRUD Operations
export interface AutomationFlowResponse {
  data: AutomationFlow | AutomationFlow[] | null;
  error: string | null;
}

export interface AutomationNodeResponse {
  data: AutomationNode | AutomationNode[] | null;
  error: string | null;
}

/**
 * Create a new automation flow
 */
export const createAutomationFlow = async (
  flowData: Omit<AutomationFlow, 'id' | 'created_at' | 'updated_at'>,
): Promise<AutomationFlowResponse> => {
  try {
    const { data, error } = await supabase
      .from('automation_flows')
      .insert([flowData])
      .select()
      .single();

    if (error) {
      console.error('Error creating automation flow:', error);
      return {
        data: null,
        error: error.message || 'Failed to create automation flow',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating automation flow:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the automation flow',
    };
  }
};

/**
 * Get automation flows, optionally filtered by company ID
 */
export const getAutomationFlows = async (companyId?: string): Promise<AutomationFlowResponse> => {
  try {
    let query = supabase
      .from('automation_flows')
      .select('*')
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching automation flows:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch automation flows',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching automation flows:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching automation flows',
    };
  }
};

/**
 * Update an automation flow
 */
export const updateAutomationFlow = async (
  flowId: string,
  updates: Partial<Omit<AutomationFlow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<AutomationFlowResponse> => {
  try {
    const { data, error } = await supabase
      .from('automation_flows')
      .update(updates)
      .eq('id', flowId)
      .select()
      .single();

    if (error) {
      console.error('Error updating automation flow:', error);
      return {
        data: null,
        error: error.message || 'Failed to update automation flow',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating automation flow:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the automation flow',
    };
  }
};

/**
 * Delete an automation flow
 */
export const deleteAutomationFlow = async (flowId: string): Promise<AutomationFlowResponse> => {
  try {
    const { error } = await supabase.from('automation_flows').delete().eq('id', flowId);

    if (error) {
      console.error('Error deleting automation flow:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete automation flow',
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting automation flow:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the automation flow',
    };
  }
};

/**
 * Get a single automation flow by ID
 */
export const getAutomationFlowById = async (flowId: string): Promise<AutomationFlowResponse> => {
  try {
    const { data, error } = await supabase
      .from('automation_flows')
      .select('*')
      .eq('id', flowId)
      .single();

    if (error) {
      console.error('Error fetching automation flow:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch automation flow',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching automation flow:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the automation flow',
    };
  }
};

// Node CRUD Operations

/**
 * Create automation nodes
 */
export const createAutomationNodes = async (
  nodes: Omit<AutomationNode, 'id' | 'created_at' | 'updated_at'>[],
): Promise<AutomationNodeResponse> => {
  try {
    const { data, error } = await supabase.from('automation_nodes').insert(nodes).select();

    if (error) {
      console.error('Error creating automation nodes:', error);
      return {
        data: null,
        error: error.message || 'Failed to create automation nodes',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating automation nodes:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating automation nodes',
    };
  }
};

/**
 * Get automation nodes for a flow
 */
export const getAutomationNodes = async (flowId: string): Promise<AutomationNodeResponse> => {
  try {
    const { data, error } = await supabase
      .from('automation_nodes')
      .select('*')
      .eq('flow_id', flowId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching automation nodes:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch automation nodes',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching automation nodes:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching automation nodes',
    };
  }
};

/**
 * Update automation nodes
 */
export const updateAutomationNodes = async (
  nodeUpdates: {
    id: string;
    updates: Partial<Omit<AutomationNode, 'id' | 'flow_id' | 'created_at' | 'updated_at'>>;
  }[],
): Promise<AutomationNodeResponse> => {
  try {
    const results = [];

    for (const { id, updates } of nodeUpdates) {
      const { data, error } = await supabase
        .from('automation_nodes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating automation node:', error);
        return {
          data: null,
          error: error.message || 'Failed to update automation node',
        };
      }

      results.push(data);
    }

    return {
      data: results,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating automation nodes:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating automation nodes',
    };
  }
};

/**
 * Delete automation nodes
 */
export const deleteAutomationNodes = async (nodeIds: string[]): Promise<AutomationNodeResponse> => {
  try {
    const { error } = await supabase.from('automation_nodes').delete().in('id', nodeIds);

    if (error) {
      console.error('Error deleting automation nodes:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete automation nodes',
      };
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting automation nodes:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting automation nodes',
    };
  }
};

// Execution Engine

/**
 * Execute an automation flow
 */
export const runAutomationFlow = async (
  flowId: string,
  payload: AutomationExecutionPayload,
): Promise<AutomationExecutionResult> => {
  try {
    // Get flow and nodes
    const [flowResponse, nodesResponse] = await Promise.all([
      getAutomationFlowById(flowId),
      getAutomationNodes(flowId),
    ]);

    if (flowResponse.error || nodesResponse.error) {
      return {
        success: false,
        executedNodes: [],
        errors: [flowResponse.error || nodesResponse.error || 'Failed to load flow'],
        outputs: {},
      };
    }

    const flow = flowResponse.data as AutomationFlow;
    const nodes = nodesResponse.data as AutomationNode[];

    if (!flow.enabled) {
      return {
        success: false,
        executedNodes: [],
        errors: ['Flow is disabled'],
        outputs: {},
      };
    }

    // Execute the flow
    const result = await executeFlow(nodes, payload);

    return result;
  } catch (error) {
    console.error('Error executing automation flow:', error);
    return {
      success: false,
      executedNodes: [],
      errors: ['Unexpected error during flow execution'],
      outputs: {},
    };
  }
};

/**
 * Execute the flow logic
 */
const executeFlow = async (
  nodes: AutomationNode[],
  payload: AutomationExecutionPayload,
): Promise<AutomationExecutionResult> => {
  const executedNodes: string[] = [];
  const errors: string[] = [];
  const outputs: Record<string, any> = {};

  try {
    // Find trigger nodes that match the payload
    const triggerNodes = nodes.filter(
      (node) => node.type === 'trigger' && node.node_type === payload.triggerType,
    );

    if (triggerNodes.length === 0) {
      return {
        success: false,
        executedNodes,
        errors: [`No trigger nodes found for type: ${payload.triggerType}`],
        outputs,
      };
    }

    // Start with trigger nodes
    const nodesToExecute = [...triggerNodes];

    while (nodesToExecute.length > 0) {
      const currentNode = nodesToExecute.shift()!;

      try {
        executedNodes.push(currentNode.id);

        // Execute based on node type
        if (currentNode.type === 'condition') {
          const conditionMet = await evaluateCondition(currentNode, payload.data);
          outputs[currentNode.id] = { conditionMet };

          if (conditionMet) {
            // Find next nodes (simplified - in real implementation, would use edges)
            const nextNodes = nodes.filter(
              (node) =>
                node.position.y > currentNode.position.y &&
                Math.abs(node.position.x - currentNode.position.x) < 200,
            );
            nodesToExecute.push(...nextNodes);
          }
        } else if (currentNode.type === 'action') {
          const actionResult = await executeAction(currentNode, payload.data);
          outputs[currentNode.id] = actionResult;

          // Find next nodes
          const nextNodes = nodes.filter(
            (node) =>
              node.position.y > currentNode.position.y &&
              Math.abs(node.position.x - currentNode.position.x) < 200,
          );
          nodesToExecute.push(...nextNodes);
        } else {
          // Trigger node - just pass through
          const nextNodes = nodes.filter(
            (node) =>
              node.position.y > currentNode.position.y &&
              Math.abs(node.position.x - currentNode.position.x) < 200,
          );
          nodesToExecute.push(...nextNodes);
        }
      } catch (nodeError) {
        errors.push(`Error executing node ${currentNode.label}: ${nodeError}`);
      }
    }

    return {
      success: errors.length === 0,
      executedNodes,
      errors,
      outputs,
    };
  } catch (error) {
    errors.push(`Flow execution error: ${error}`);
    return {
      success: false,
      executedNodes,
      errors,
      outputs,
    };
  }
};

/**
 * Evaluate a condition node
 */
const evaluateCondition = async (
  node: AutomationNode,
  data: Record<string, any>,
): Promise<boolean> => {
  const config = node.config;

  // Simple condition evaluation (would be more complex in production)
  const fieldValue = data[config.field];
  const { operator, value } = config;

  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'greater':
      return fieldValue > value;
    case 'less':
      return fieldValue < value;
    case 'contains':
      return String(fieldValue).includes(String(value));
    default:
      return false;
  }
};

/**
 * Execute an action node
 */
const executeAction = async (node: AutomationNode, data: Record<string, any>): Promise<any> => {
  const config = node.config;

  // This is where you'd integrate with existing APIs
  switch (node.node_type) {
    case 'send_email':
      // Integrate with email service
      console.log('Sending email:', config);
      return { status: 'email_sent', recipient: config.recipient };

    case 'send_slack':
      // Integrate with Slack API
      console.log('Sending Slack message:', config);
      return { status: 'slack_sent', channel: config.channel };

    case 'generate_doc':
      // Integrate with document generation
      console.log('Generating document:', config);
      return { status: 'doc_generated', template: config.template };

    case 'start_agent_task':
      // Integrate with agent system
      console.log('Starting agent task:', config);
      return { status: 'agent_started', agent: config.agentType };

    default:
      throw new Error(`Unknown action type: ${node.node_type}`);
  }
};

/**
 * Test run an automation flow with sample payload
 */
export const testAutomationFlow = async (
  flowId: string,
  testPayload: TestPayload,
): Promise<AutomationExecutionResult> => {
  const payload: AutomationExecutionPayload = {
    triggerType: testPayload.triggerType,
    data: testPayload.data,
    flowId,
  };

  return await runAutomationFlow(flowId, payload);
};
