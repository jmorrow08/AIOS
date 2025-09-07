# AI Agent Orchestrator

This module provides a comprehensive system for managing and orchestrating AI agents with support for multiple LLM providers (OpenAI, Claude, Gemini) and agent delegation.

## Features

- **Multi-LLM Support**: Seamlessly switch between OpenAI, Claude (Anthropic), and Gemini
- **Agent Configuration**: Store agent configurations in Supabase database
- **Task Routing**: Route tasks to specific agents based on role
- **Chief Agent Delegation**: Special handling for Chief agents that can delegate tasks
- **Logging**: Automatic logging of all agent interactions
- **Type Safety**: Full TypeScript support with proper type definitions

## Setup

### 1. Environment Variables

Add these environment variables to your `.env` file:

```env
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### 2. Database Setup

Ensure your Supabase database has the `ai_agents` and `agent_logs` tables (included in the migration file).

### 3. Agent Configuration

Create agents in your database with the following fields:

```sql
INSERT INTO ai_agents (name, role, prompt, llm_provider, llm_model, api_key_ref, status) VALUES
('Sales Assistant', 'sales_support', 'You are a helpful sales assistant AI.', 'openai', 'gpt-4', 'VITE_OPENAI_API_KEY', 'active'),
('Chief Strategist', 'chief', 'You are the Chief AI strategist who can delegate tasks.', 'claude', 'claude-3-sonnet-20240229', 'VITE_ANTHROPIC_API_KEY', 'active');
```

## Usage

### Basic Task Routing

```typescript
import { routeTask } from '@/agents';

const result = await routeTask('sales_support', 'Generate a sales pitch for our AI service');

if (result.success) {
  console.log('Response:', result.response);
} else {
  console.error('Error:', result.error);
}
```

### Chief Agent with Delegation

```typescript
import { routeTask } from '@/agents';

const result = await routeTask('chief', 'Plan a comprehensive marketing strategy');

if (result.success) {
  console.log('Chief Response:', result.response);
  if (result.delegatedTasks) {
    console.log('Delegated tasks completed:', result.delegatedTasks.length);
  }
}
```

### Check Available Agents

```typescript
import { getAvailableAgentRoles, isAgentRoleAvailable } from '@/agents';

const roles = await getAvailableAgentRoles();
const isAvailable = await isAgentRoleAvailable('sales_support');
```

## API Reference

### Core Functions

#### `routeTask(agentRole: string, task: string): Promise<TaskResult>`

Routes a task to the specified agent role.

**Parameters:**

- `agentRole`: The role of the agent (e.g., 'sales_support', 'chief')
- `task`: The task description to send to the agent

**Returns:** Promise resolving to TaskResult with success status, response, and optional error/delegation info

#### `getAvailableAgentRoles(): Promise<string[]>`

Gets all available agent roles from the database.

#### `isAgentRoleAvailable(role: string): Promise<boolean>`

Checks if a specific agent role exists and is active.

### Agent Management

#### `getAgentByRole(role: string): Promise<AgentResponse>`

Fetches agent configuration by role.

#### `getAgents(): Promise<AgentResponse>`

Gets all agents from the database.

#### `createAgent(agentData: CreateAgentData): Promise<AgentResponse>`

Creates a new agent in the database.

#### `updateAgent(agentId: string, updates: UpdateAgentData): Promise<AgentResponse>`

Updates an existing agent.

#### `logAgentInteraction(logData: CreateAgentLogData): Promise<AgentResponse>`

Logs an agent interaction to the database.

### Types

```typescript
interface TaskResult {
  success: boolean;
  response: string;
  error?: string;
  delegatedTasks?: TaskResult[];
}

interface Agent {
  id: string;
  name: string;
  role: string;
  prompt?: string;
  api_key_ref?: string;
  llm_provider?: LLMProvider;
  llm_model?: string;
  status: AgentStatus;
  created_at: string;
}

type LLMProvider = 'openai' | 'claude' | 'gemini';
type AgentStatus = 'active' | 'inactive';
```

## LLM Provider Support

### OpenAI

- Default model: `gpt-4`
- Supports all OpenAI models
- Uses chat completions API

### Claude (Anthropic)

- Default model: `claude-3-sonnet-20240229`
- Supports Claude 3 models
- Uses messages API

### Gemini (Google AI)

- Default model: `gemini-pro`
- Supports Gemini models
- Uses generative AI API

## Chief Agent Delegation

The Chief agent has special delegation capabilities:

1. **Task Analysis**: First analyzes the task to determine delegation needs
2. **Sequential Execution**: Delegates to other agents one by one
3. **Result Combination**: Combines all responses into a comprehensive answer
4. **Fallback Handling**: Falls back to direct response if delegation isn't needed

Delegation is triggered when the Chief agent's response contains delegation keywords like "delegate to", "ask the", "consult with", etc.

## Error Handling

The system provides comprehensive error handling:

- **Configuration Errors**: Invalid LLM provider or missing API keys
- **API Errors**: LLM provider API failures
- **Database Errors**: Supabase connection or query failures
- **Delegation Errors**: Issues with task delegation

All errors are logged to the `agent_logs` table for debugging.

## Security Notes

- API keys should be stored as environment variables
- The `dangerouslyAllowBrowser` flag is set for OpenAI (consider server-side implementation for production)
- Row Level Security (RLS) policies are in place for database access control
- Agent interactions are logged for audit purposes

## Examples

See `example.ts` for comprehensive usage examples including:

- Basic task routing
- Chief agent delegation
- Agent availability checking
- Environment setup instructions
