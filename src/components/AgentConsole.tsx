import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  routeTask,
  performRAGSearch,
  createConversationLog,
  updateConversationLog,
  createTaskLog,
  type Agent,
  type ConversationLog,
} from '@/agents';
import {
  Send,
  Play,
  BookOpen,
  User,
  Bot,
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ChatMessage {
  id: string;
  message: string;
  timestamp: Date;
  isUser: boolean;
  knowledgeContext?: any[];
}

interface AgentConsoleProps {
  agent: Agent;
  userId: string;
}

const AgentConsole: React.FC<AgentConsoleProps> = ({ agent, userId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [knowledgeSearchEnabled, setKnowledgeSearchEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load or create conversation log
  useEffect(() => {
    if (agent && userId) {
      loadOrCreateConversation();
    }
  }, [agent, userId]);

  const loadOrCreateConversation = async () => {
    try {
      // For now, we'll create a new conversation each time
      // In a real implementation, you might want to load existing conversations
      const conversationTitle = `${agent.name} - ${new Date().toLocaleDateString()}`;
      const result = await createConversationLog({
        agent_id: agent.id,
        user_id: userId,
        conversation_title: conversationTitle,
        messages: [],
      });

      if (result.data) {
        setConversationId(result.data.id);
      }
    } catch (error) {
      console.error('Error creating conversation log:', error);
    }
  };

  const searchKnowledgeBase = async (query: string) => {
    if (!knowledgeSearchEnabled) return null;

    try {
      const searchResult = await performRAGSearch(query, 'rag');
      if (searchResult.success && searchResult.results.length > 0) {
        return searchResult.results.slice(0, 3); // Return top 3 results
      }
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: currentMessage,
      timestamp: new Date(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage('');
    setLoading(true);

    try {
      // Search knowledge base first
      const knowledgeContext = await searchKnowledgeBase(currentMessage);

      // Add context to user message for display
      if (knowledgeContext) {
        userMessage.knowledgeContext = knowledgeContext;
      }

      // Prepare enhanced prompt with knowledge context
      let enhancedQuery = currentMessage;
      if (knowledgeContext && knowledgeContext.length > 0) {
        const contextText = knowledgeContext
          .map((ctx: any) => `[${ctx.source}] ${ctx.title}: ${ctx.content}`)
          .join('\n\n');
        enhancedQuery = `Context from knowledge base:\n${contextText}\n\nUser query: ${currentMessage}`;
      }

      // Send message to agent
      const result = await routeTask(agent.role, enhancedQuery);

      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: result.response || 'No response received',
        timestamp: new Date(),
        isUser: false,
      };

      setMessages((prev) => [...prev, agentMessage]);

      // Update conversation log
      if (conversationId) {
        const updatedMessages = [...messages, userMessage, agentMessage].map((msg) => ({
          id: msg.id,
          message: msg.message,
          timestamp: msg.timestamp.toISOString(),
          isUser: msg.isUser,
        }));

        await updateConversationLog(conversationId, {
          messages: updatedMessages,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTask = async () => {
    if (!taskDescription.trim() || taskLoading) return;

    setTaskLoading(true);
    setTaskModalOpen(false);

    try {
      // Create task log
      const taskLogResult = await createTaskLog({
        agent_id: agent.id,
        user_id: userId,
        task_description: taskDescription,
        status: 'in_progress',
      });

      if (taskLogResult.data) {
        setCurrentTask(taskLogResult.data);
      }

      // For now, simulate task planning
      const planningPrompt = `You are ${agent.name}, a ${agent.role}. Plan and execute the following task step by step: ${taskDescription}

Please break this down into actionable steps and provide a detailed plan.`;

      const planningResult = await routeTask(agent.role, planningPrompt);

      // Add planning message to chat
      const planningMessage: ChatMessage = {
        id: Date.now().toString(),
        message: `🤖 **Task Planning Started**\n\n${planningResult.response}`,
        timestamp: new Date(),
        isUser: false,
      };

      setMessages((prev) => [...prev, planningMessage]);

      // Simulate sub-agent spawning if the agent has that capability
      if (agent.capabilities_json?.includes('sub_agent_coordination')) {
        setTimeout(async () => {
          const subAgentMessage: ChatMessage = {
            id: (Date.now() + 1000).toString(),
            message: `🔄 **Sub-Agent Coordination**\n\nI've spawned a specialized sub-agent to handle part of this task. The sub-agent will work on the detailed implementation while I coordinate the overall progress.`,
            timestamp: new Date(),
            isUser: false,
          };
          setMessages((prev) => [...prev, subAgentMessage]);
        }, 2000);
      }

      setTaskDescription('');
    } catch (error) {
      console.error('Error running task:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        message: '❌ Error starting task. Please try again.',
        timestamp: new Date(),
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleBasedCapabilities = () => {
    const capabilities = agent.capabilities_json || [];
    return {
      canRunTasks:
        capabilities.includes('project_management') || capabilities.includes('task_coordination'),
      canAccessKnowledge:
        capabilities.includes('data_analysis') || capabilities.includes('research'),
      canSpawnSubAgents: capabilities.includes('sub_agent_coordination'),
      canGenerateContent:
        capabilities.includes('content_generation') || capabilities.includes('creative_writing'),
    };
  };

  const capabilities = getRoleBasedCapabilities();

  return (
    <div className="flex flex-col h-full bg-cosmic-dark rounded-lg border border-cosmic-light">
      {/* Header */}
      <div className="p-4 border-b border-cosmic-light">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
            <p className="text-sm text-gray-400">{agent.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {agent.capabilities_json?.slice(0, 3).map((cap: string) => (
                <span key={cap} className="text-xs bg-cosmic-accent px-2 py-1 rounded">
                  {cap.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
          <div className="flex space-x-2">
            {capabilities.canRunTasks && (
              <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-cosmic-accent hover:bg-cosmic-accent"
                    disabled={taskLoading}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Run Autonomous Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="task-desc" className="text-white">
                        Task Description
                      </Label>
                      <Textarea
                        id="task-desc"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Describe the high-level goal or task you want the agent to accomplish..."
                        className="bg-cosmic-light text-white border-cosmic-accent mt-2"
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setTaskModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRunTask}
                        disabled={!taskDescription.trim() || taskLoading}
                        className="bg-cosmic-accent hover:bg-cosmic-highlight"
                      >
                        {taskLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Start Task
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKnowledgeSearchEnabled(!knowledgeSearchEnabled)}
              className={`text-white border-cosmic-accent hover:bg-cosmic-accent ${
                knowledgeSearchEnabled ? 'bg-cosmic-accent' : ''
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Knowledge {knowledgeSearchEnabled ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Start a conversation with {agent.name}</p>
            <p className="text-sm">
              Ask questions, request help, or{' '}
              {capabilities.canRunTasks ? 'run autonomous tasks' : 'get assistance'} related to{' '}
              {agent.role.replace('_', ' ')}.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.isUser ? 'bg-cosmic-accent text-white' : 'bg-cosmic-light text-white'
              }`}
            >
              <div className="flex items-center mb-2">
                {msg.isUser ? <User className="w-4 h-4 mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
                <span className="text-sm font-medium">{msg.isUser ? 'You' : agent.name}</span>
                <span className="text-xs opacity-70 ml-auto">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>

              <div className="text-sm whitespace-pre-wrap">{msg.message}</div>

              {/* Knowledge context */}
              {msg.knowledgeContext && msg.knowledgeContext.length > 0 && (
                <div className="mt-3 pt-3 border-t border-cosmic-accent/30">
                  <div className="text-xs text-cosmic-accent mb-2 flex items-center">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Knowledge Base Context:
                  </div>
                  <div className="space-y-2">
                    {msg.knowledgeContext.map((ctx: any, idx: number) => (
                      <div key={idx} className="text-xs bg-cosmic-dark/50 p-2 rounded">
                        <div className="font-medium">{ctx.title}</div>
                        <div className="opacity-70">{ctx.content.substring(0, 100)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-cosmic-light p-3 rounded-lg">
              <div className="flex items-center text-white">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {agent.name} is thinking...
              </div>
            </div>
          </div>
        )}

        {taskLoading && (
          <div className="flex justify-start">
            <div className="bg-cosmic-light p-3 rounded-lg">
              <div className="flex items-center text-white">
                <Play className="w-4 h-4 animate-spin mr-2" />
                Executing autonomous task...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-cosmic-light">
        <div className="flex space-x-2">
          <Textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${agent.name} a question or give instructions...`}
            className="flex-1 bg-cosmic-light text-white border-cosmic-accent resize-none"
            rows={2}
            disabled={loading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !currentMessage.trim()}
            className="bg-cosmic-accent hover:bg-cosmic-highlight px-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          <div>Press Enter to send, Shift+Enter for new line</div>
          <div className="flex space-x-4">
            {capabilities.canRunTasks && (
              <span className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1 text-green-400" />
                Task Execution
              </span>
            )}
            {capabilities.canSpawnSubAgents && (
              <span className="flex items-center">
                <Plus className="w-3 h-3 mr-1 text-blue-400" />
                Sub-Agent Coordination
              </span>
            )}
            {knowledgeSearchEnabled && (
              <span className="flex items-center">
                <BookOpen className="w-3 h-3 mr-1 text-purple-400" />
                Knowledge Search
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentConsole;
