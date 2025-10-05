// Main orchestrator functions
export { routeTask, getAvailableAgentRoles, isAgentRoleAvailable } from './orchestrator';

// Agent API functions
export {
  getAgentByRole,
  getAgents,
  createAgent,
  updateAgent,
  logAgentInteraction,
  getAgentLogs,
  createConversationLog,
  updateConversationLog,
  getConversationLogs,
  createTaskLog,
  updateTaskLog,
  getTaskLogs,
} from './api';

// Types
export type {
  Agent,
  AgentLog,
  AgentResponse,
  CreateAgentData,
  UpdateAgentData,
  CreateAgentLogData,
  ConversationLog,
  TaskLog,
  CreateConversationLogData,
  CreateTaskLogData,
  AgentStatus,
  LLMProvider,
  TaskResult,
} from './api';

// RAG utilities
export { performRAGSearch, getSourceDocuments } from './rag';
export type { SearchResult, RAGSearchResponse } from './rag';

// LLM utilities
export { sendLLMMessage, createLLMConfig, getDefaultModel } from './llm';

// SOP Bot utilities
export {
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
} from './sopBot';
