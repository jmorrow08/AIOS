# AI Agent Orchestrator (Multi-Tenant)

This module provides a comprehensive system for managing and orchestrating AI agents in a multi-tenant environment, with support for multiple LLM providers (OpenAI, Claude, Gemini) and company-scoped agent delegation.

## Features

- **Multi-Tenant Support**: Company-scoped agent configurations and interactions
- **Multi-LLM Support**: Seamlessly switch between OpenAI, Claude (Anthropic), and Gemini
- **Agent Configuration**: Store agent configurations in Supabase database with company isolation
- **Task Routing**: Route tasks to specific agents based on role and company context
- **Chief Agent Delegation**: Company-scoped agent delegation and task management
- **Usage Tracking**: Monitor API usage and costs per company
- **Logging**: Automatic logging of all agent interactions with company context
- **Security Compliance**: Integration with company security policies and IP restrictions
- **Audit Trail**: Comprehensive audit logging for compliance and security monitoring
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

Ensure your Supabase database has the multi-tenant `ai_agents` and `agent_logs` tables with company isolation:

```sql
-- AI Agents table with company scoping
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  prompt TEXT,
  api_key_ref TEXT,
  llm_provider TEXT,
  llm_model TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Logs table with company scoping
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  input TEXT,
  output TEXT,
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Agent Configuration

Create company-scoped agents in your database with the following fields:

```sql
-- Create agents for a specific company
INSERT INTO ai_agents (company_id, name, role, prompt, llm_provider, llm_model, api_key_ref, status) VALUES
('your-company-uuid', 'Sales Assistant', 'sales_support', 'You are a helpful sales assistant AI for our company.', 'openai', 'gpt-4', 'VITE_OPENAI_API_KEY', 'active'),
('your-company-uuid', 'Chief Strategist', 'chief', 'You are the Chief AI strategist who can delegate tasks for our company.', 'claude', 'claude-3-sonnet-20240229', 'VITE_ANTHROPIC_API_KEY', 'active');
```

**Note**: Each company can have its own set of agents with custom prompts and configurations.

### 3. Security and Compliance Setup

The agent system integrates with the Compliance & Security Policies Panel:

- **IP Access Control**: Agent operations respect company IP allowlists
- **API Key Rotation**: Agents use rotating API keys with automatic renewal
- **Audit Logging**: All agent interactions are logged for compliance
- **Data Retention**: Agent logs follow company data retention policies
- **Security Policies**: Agents inherit company security configurations

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

### Security and Compliance Functions

#### `getAgentSecurityStatus(companyId: string): Promise<SecurityStatus>`

Retrieves the security compliance status for a company's agents.

**Parameters:**

- `companyId`: The company UUID to check security status for

**Returns:** Security status including API key rotation status, IP access compliance, and audit log completeness

#### `validateAgentAccess(companyId: string, userId: string, requestIp: string): Promise<AccessValidation>`

Validates if a user can access agent functionality based on company security policies.

**Parameters:**

- `companyId`: The company UUID
- `userId`: The user UUID requesting access
- `requestIp`: The IP address of the request

**Returns:** Access validation result with allowed status and reason

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

// Security and Compliance Types
interface SecurityStatus {
  apiKeyRotationStatus: 'compliant' | 'warning' | 'expired';
  ipAccessCompliance: boolean;
  auditLogCompleteness: number; // percentage
  lastSecurityCheck: string;
}

interface AccessValidation {
  allowed: boolean;
  reason?: string;
  securityPolicy?: {
    enforce_2fa: boolean;
    ip_allowed: boolean;
    data_retention_days: number;
  };
}
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

## Multi-Tenant Agent Management

### Company Isolation

- Agents are scoped to specific companies via `company_id`
- Users can only access agents belonging to their company
- Agent logs include company context for proper isolation
- API usage is tracked per company for billing

### Agent Administration

- Admins can create company-specific agents
- Clients can manage their own company's agents
- Agent configurations can be customized per company
- Usage limits are enforced per company

### Usage Tracking

- All agent interactions are logged with company context
- API costs are tracked per company
- Usage limits prevent budget overruns
- Analytics available per company

### Security and Compliance

- **IP Access Control**: Agent access respects company IP allowlists
- **API Key Security**: Agents use encrypted, rotating API keys
- **Audit Compliance**: All agent activities are audit-logged for compliance
- **Data Retention**: Agent logs follow company retention policies
- **Security Monitoring**: Real-time monitoring of agent security status

## Security Notes

- **Company Isolation**: All agent operations respect company boundaries
- **API Keys**: Stored as environment variables with proper access control
- **Row Level Security**: RLS policies enforce company data isolation
- **Audit Logging**: All agent interactions logged with company context
- **Usage Limits**: Company-specific budget limits prevent abuse
- **Access Control**: Users can only access their company's agents
- **Compliance Integration**: Agents integrate with Compliance & Security Policies Panel
- **GDPR Compliance**: Agent data handling follows company retention policies
- **Security Policies**: Agents respect company security configurations

**Note**: The `dangerouslyAllowBrowser` flag is set for OpenAI (consider server-side implementation for production with enhanced security)

## Examples

See `example.ts` for comprehensive usage examples including:

- Basic task routing
- Chief agent delegation
- Agent availability checking
- Environment setup instructions
