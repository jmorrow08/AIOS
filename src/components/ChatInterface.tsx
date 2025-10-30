import React, { useState, useEffect } from 'react';
import {
  selectModel,
  type ModelOption,
  type TaskType,
  type LatencyTolerance,
  type CostMode,
} from '@/lib/modelRouter';
import { useSettings } from '@/hooks/useSettings';
import { useUser } from '@/context/UserContext';
import {
  executeTool,
  applySettingChange,
  parseToolCalls,
  getAvailableTools,
  type ToolCall,
} from '@/lib/chatTools';
import { ensureOriaExists, getOriaAgent } from '@/agents/oria';
import { supabase } from '@/lib/supabaseClient';

interface AICapabilities {
  models: any[];
  modelsByProvider: Record<string, any[]>;
  providers: Array<{
    id: string;
    name: string;
    description: string;
    requiresApiKey: boolean;
    localOnly: boolean;
  }>;
  providerAvailability: Record<string, boolean>;
  recommendations: Record<string, any[]>;
  ollamaStatus?: {
    type: 'remote' | 'local' | 'offline';
    url: string;
  };
}

export default function ChatInterface() {
  const { companyId } = useUser();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    { role: string; content: string; thinking?: any[]; selectedModel?: ModelOption }[]
  >([
    {
      role: 'assistant',
      content: `👋 Hi there! I'm Oria, your intelligent AI companion for the AI OS Autopilot system.

I'm here to help you with:
• 🤖 **Multi-agent orchestration** - Coordinating specialized AI agents for complex tasks
• 📊 **Data analysis** - Analyzing your business data and generating insights
• 🎨 **Content creation** - Helping with marketing, social media, and creative projects
• ⚙️ **System administration** - Managing settings and optimizing workflows
• 🛠️ **Tool integration** - Using various APIs and services to get things done

I can also access your database, manage settings, and even schedule social media posts. Just let me know what you'd like to work on!

💡 **Try asking me things like:**
- "Show me my recent projects"
- "Analyze my business data"
- "Schedule a social media post"
- "Help me create marketing content"
- "Check my system settings"`,
      thinking: [],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedModelOption, setSelectedModelOption] = useState('auto');
  const [currentModel, setCurrentModel] = useState<ModelOption | null>(null);
  const [usage, setUsage] = useState<{ tokens?: number; cost?: number }>({});
  const [thinkingProcess, setThinkingProcess] = useState<any[]>([]);
  const [showThinking, setShowThinking] = useState(false);
  const [pendingToolCalls, setPendingToolCalls] = useState<ToolCall[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [oriaAgent, setOriaAgent] = useState<any>(null);
  const [oriaInitialized, setOriaInitialized] = useState(false);
  const [aiCapabilities, setAiCapabilities] = useState<AICapabilities | null>(null);
  const [loadingCapabilities, setLoadingCapabilities] = useState(true);

  const { settings, updateSetting } = useSettings();

  // Initialize Oria agent
  useEffect(() => {
    const initializeOria = async () => {
      try {
        const result = await ensureOriaExists();
        if (result.success) {
          const oriaData = await getOriaAgent();
          if (oriaData.success) {
            setOriaAgent(oriaData.data);
          }
        }
        setOriaInitialized(true);
      } catch (error) {
        console.error('Error initializing Oria:', error);
        setOriaInitialized(true); // Still set to true to not block UI
      }
    };

    initializeOria();
  }, []);

  // Fetch AI capabilities
  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('ai-capabilities');

        if (error) {
          console.error('Error fetching AI capabilities:', error);
          // Fallback to basic model options
          setAiCapabilities(null);
        } else if (data?.success) {
          setAiCapabilities(data);
        }
      } catch (error) {
        console.error('Error fetching AI capabilities:', error);
        setAiCapabilities(null);
      } finally {
        setLoadingCapabilities(false);
      }
    };

    fetchCapabilities();
  }, []);

  // Determine the actual model to use
  const getSelectedModel = async (): Promise<ModelOption | null> => {
    if (selectedModelOption === 'auto') {
      // Use smart model selection
      const runpodEnabled = settings?.runpod_enabled === 'true';
      const criteria = {
        taskType: 'chat' as TaskType,
        latencyTolerance: 'normal' as LatencyTolerance,
        costMode: 'balanced' as CostMode,
        runpodEnabled,
        providerAvailability: aiCapabilities?.providerAvailability || {
          openai: true,
          claude: true,
          gemini: true,
          ollama: runpodEnabled,
        },
      };

      return await selectModel(criteria);
    } else {
      // Manual model selection - find model from capabilities
      if (aiCapabilities?.models) {
        // For specific provider selections, pick the best available model
        const providerModels = aiCapabilities.modelsByProvider[selectedModelOption];
        if (providerModels && providerModels.length > 0) {
          // Pick the first available model (they're already sorted by preference)
          const selectedModelData = providerModels[0];
          return {
            provider: selectedModelData.provider as any,
            model: selectedModelData.model,
            costPerToken: (selectedModelData.pricing.input + selectedModelData.pricing.output) / 2,
            latency: selectedModelData.metadata.latency as any,
            contextWindow: selectedModelData.metadata.contextWindow,
            capabilities: selectedModelData.capabilities.strengths as any,
            available: selectedModelData.available,
          };
        }
      }

      // Fallback to legacy hardcoded models if capabilities not loaded
      const providerMap: Record<string, ModelOption> = {
        ollama: {
          provider: 'ollama',
          model: 'llama2',
          costPerToken: 0,
          latency: 'medium',
          contextWindow: 4096,
          capabilities: ['chat'],
          available: true,
        },
        openai: {
          provider: 'openai',
          model: 'gpt-4',
          costPerToken: 0.03,
          latency: 'high',
          contextWindow: 8192,
          capabilities: ['chat'],
          available: true,
        },
        claude: {
          provider: 'claude',
          model: 'claude-3-sonnet-20240229',
          costPerToken: 0.015,
          latency: 'medium',
          contextWindow: 200000,
          capabilities: ['chat'],
          available: true,
        },
        gemini: {
          provider: 'gemini',
          model: 'gemini-pro',
          costPerToken: 0.00025,
          latency: 'medium',
          contextWindow: 32768,
          capabilities: ['chat'],
          available: true,
        },
      };
      return providerMap[selectedModelOption] || null;
    }
  };

  // Generate model options for dropdown
  const getModelOptions = () => {
    const options = [{ id: 'auto', label: 'Auto (Smart Selection)' }];

    if (aiCapabilities?.providers) {
      // Add available providers
      aiCapabilities.providers.forEach((provider) => {
        if (aiCapabilities.providerAvailability[provider.id]) {
          const modelCount = aiCapabilities.modelsByProvider[provider.id]?.length || 0;
          options.push({
            id: provider.id,
            label: `${provider.name}${modelCount > 1 ? ` (${modelCount} models)` : ''}`,
          });
        }
      });
    } else if (!loadingCapabilities) {
      // Fallback options if capabilities failed to load
      options.push(
        { id: 'ollama', label: 'Local (Ollama)' },
        { id: 'openai', label: 'OpenAI GPT-4' },
        { id: 'claude', label: 'Anthropic Claude' },
        { id: 'gemini', label: 'Google Gemini' },
      );
    }

    return options;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setThinkingProcess([]);

    try {
      // Select model for this message
      const selectedModel = await getSelectedModel();
      setCurrentModel(selectedModel);

      if (!selectedModel) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '❌ No suitable model available. Please check your API keys and settings.',
            selectedModel,
          },
        ]);
        return;
      }

      // Add thinking step
      const thinkingSteps = [
        {
          timestamp: new Date().toISOString(),
          step: 'model_selection',
          details: `Selected ${selectedModel.provider} ${
            selectedModel.model
          } (cost: $${selectedModel.costPerToken.toFixed(4)}/token)`,
        },
      ];
      setThinkingProcess(thinkingSteps);

      // Call the AI API
      let res;
      if (selectedModel.provider === 'ollama') {
        // Call Ollama directly for local development
        res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel.model || 'llama3.1:8b',
            prompt: `${
              selectedModel.systemPrompt || 'You are a helpful AI assistant.'
            }\n\n${input}`,
            stream: false,
          }),
        });
      } else {
        // Call the Edge Function for cloud providers
        res = await fetch('https://ysjkyrtkdngxksassvmw.supabase.co/functions/v1/ai-generate', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyId: companyId || 'default-company',
            input,
            provider: selectedModel.provider,
            model: selectedModel.model,
          }),
        });
      }

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`);
      }

      const data = await res.json();

      // Handle different response formats
      let content, usage;
      if (selectedModel.provider === 'ollama') {
        // Ollama response format
        content = data.response || '';
        usage = {
          tokens_used: Math.ceil((input.length + (selectedModel.systemPrompt?.length || 0)) / 4),
          cost: 0, // Free for local Ollama
        };
      } else {
        // Edge Function response format
        content = data.content || '';
        usage = data.usage;
      }

      // Add more thinking steps
      thinkingSteps.push({
        timestamp: new Date().toISOString(),
        step: 'api_call',
        details: `Called ${selectedModel.provider} API with ${input.length} characters`,
      });

      if (usage) {
        thinkingSteps.push({
          timestamp: new Date().toISOString(),
          step: 'usage_calculation',
          details: `Used ${usage.tokens_used} tokens, cost: $${usage.cost?.toFixed(4) || '0.0000'}`,
        });
      }

      // Check for tool calls in the response
      const toolCalls = parseToolCalls(content);
      const hasToolCalls = toolCalls.length > 0;
      const requiresConfirmation = toolCalls.some((tc) => tc.requiresConfirmation);

      if (hasToolCalls) {
        thinkingSteps.push({
          timestamp: new Date().toISOString(),
          step: 'tool_detection',
          details: `Detected ${toolCalls.length} tool call(s), ${
            requiresConfirmation ? 'confirmation required' : 'executing directly'
          }`,
        });
      }

      setThinkingProcess([...thinkingSteps]);

      let finalContent = content;
      let toolResults: any[] = [];

      // Handle tool calls
      if (hasToolCalls) {
        if (requiresConfirmation) {
          // Show confirmation dialog
          setPendingToolCalls(toolCalls);
          setShowConfirmation(true);

          const aiMsg = {
            role: 'assistant',
            content: `${finalContent}\n\n⚠️ This action requires your confirmation. Please review and approve the tool calls below.`,
            thinking: thinkingSteps,
            selectedModel,
            pendingTools: toolCalls,
          };

          setMessages((prev) => [...prev, aiMsg]);
        } else {
          // Execute tools directly
          toolResults = await executeToolCalls(toolCalls);
          finalContent += '\n\n' + formatToolResults(toolResults);
        }
      }

      if (!requiresConfirmation) {
        const aiMsg = {
          role: 'assistant',
          content: finalContent,
          thinking: thinkingSteps,
          selectedModel,
          toolResults: toolResults.length > 0 ? toolResults : undefined,
        };

        setMessages((prev) => [...prev, aiMsg]);
      }

      if (usage) {
        setUsage({ tokens: usage.tokens_used, cost: usage.cost });
      }
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        thinking: [
          ...thinkingProcess,
          {
            timestamp: new Date().toISOString(),
            step: 'error',
            details: `Error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`,
          },
        ],
        selectedModel: currentModel,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Runpod/Local mode
  const toggleRunpodEnabled = async () => {
    const currentValue = settings?.runpod_enabled === 'true';
    const newValue = (!currentValue).toString();
    await updateSetting('runpod_enabled', newValue);
  };

  // Execute tool calls
  const executeToolCalls = async (toolCalls: ToolCall[]): Promise<any[]> => {
    const results = [];

    for (const toolCall of toolCalls) {
      try {
        const result = await executeTool(toolCall.tool, toolCall.parameters);
        results.push({
          tool: toolCall.tool,
          parameters: toolCall.parameters,
          result,
        });
      } catch (error) {
        results.push({
          tool: toolCall.tool,
          parameters: toolCall.parameters,
          result: {
            success: false,
            result: null,
            message: `Tool execution failed: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        });
      }
    }

    return results;
  };

  // Format tool results for display
  const formatToolResults = (results: any[]): string => {
    let output = '🛠️ Tool Execution Results:\n';

    results.forEach((result, index) => {
      output += `\n${index + 1}. ${result.tool}:\n`;
      output += `   Status: ${result.result.success ? '✅ Success' : '❌ Failed'}\n`;
      output += `   Message: ${result.result.message}\n`;

      if (result.result.success && result.result.result) {
        if (Array.isArray(result.result.result)) {
          output += `   Data: ${result.result.result.length} items\n`;
        } else if (typeof result.result.result === 'object') {
          output += `   Data: ${JSON.stringify(result.result.result, null, 2)}\n`;
        } else {
          output += `   Result: ${result.result.result}\n`;
        }
      }
    });

    return output;
  };

  // Handle tool confirmation
  const handleToolConfirmation = async (approved: boolean) => {
    if (!approved) {
      setPendingToolCalls([]);
      setShowConfirmation(false);

      // Add cancellation message
      const cancelMsg = {
        role: 'assistant',
        content: 'Tool execution cancelled by user.',
        thinking: [],
        selectedModel: currentModel,
      };
      setMessages((prev) => [...prev, cancelMsg]);
      return;
    }

    // Execute the approved tools
    setLoading(true);
    try {
      const toolResults = await executeToolCalls(pendingToolCalls);

      // Handle special case for settings.set
      for (const toolCall of pendingToolCalls) {
        if (toolCall.tool === 'settings.set') {
          const result = toolResults.find((r) => r.tool === 'settings.set');
          if (result?.result.success) {
            // Apply the setting change
            await applySettingChange(
              toolCall.parameters.key,
              toolCall.parameters.value,
              toolCall.parameters.category,
              'user-id', // TODO: Get actual user ID
            );
          }
        }
      }

      const resultMsg = {
        role: 'assistant',
        content: formatToolResults(toolResults),
        thinking: [],
        selectedModel: currentModel,
        toolResults,
      };

      setMessages((prev) => [...prev, resultMsg]);
    } catch (error) {
      const errorMsg = {
        role: 'assistant',
        content: `❌ Tool execution failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        thinking: [],
        selectedModel: currentModel,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setPendingToolCalls([]);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <header className="flex justify-between items-center px-6 py-3 bg-white shadow">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            O
          </div>
          <div>
            <h1 className="text-xl font-semibold">Oria</h1>
            <p className="text-xs text-gray-400">Your intelligent AI companion</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Runpod/Local Toggle */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Local Mode</label>
            <button
              onClick={toggleRunpodEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings?.runpod_enabled === 'true' ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings?.runpod_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Model Selector */}
          <select
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={selectedModelOption}
            onChange={(e) => setSelectedModelOption(e.target.value)}
            disabled={loadingCapabilities}
          >
            {getModelOptions().map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Thinking Toggle */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Show Thinking</label>
            <button
              onClick={() => setShowThinking(!showThinking)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showThinking ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showThinking ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className="space-y-2">
            {/* Model info for assistant messages */}
            {m.role === 'assistant' && m.selectedModel && (
              <div className="text-xs text-gray-500 ml-4">
                Using{' '}
                {m.selectedModel.provider === 'ollama'
                  ? `${
                      aiCapabilities?.ollamaStatus?.type === 'remote' ? 'RunPod' : 'Local'
                    } (Ollama)`
                  : m.selectedModel.provider}{' '}
                {m.selectedModel.model}
                {m.selectedModel.costPerToken > 0 && (
                  <span className="ml-2">(${m.selectedModel.costPerToken.toFixed(4)}/token)</span>
                )}
                {aiCapabilities?.models &&
                  (() => {
                    const modelData = aiCapabilities.models.find(
                      (mod) =>
                        mod.provider === m.selectedModel?.provider &&
                        mod.model === m.selectedModel?.model,
                    );
                    return modelData ? (
                      <span className="ml-2 text-gray-400">
                        {modelData.metadata.contextWindow}ctx • {modelData.metadata.latency} latency
                      </span>
                    ) : null;
                  })()}
              </div>
            )}

            {/* Thinking process (if enabled and available) */}
            {m.role === 'assistant' && showThinking && m.thinking && m.thinking.length > 0 && (
              <div className="ml-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-[80%]">
                <div className="text-xs font-medium text-yellow-800 mb-2">Thinking Process:</div>
                <div className="space-y-1">
                  {m.thinking.map((step: any, stepIndex: number) => (
                    <div key={stepIndex} className="text-xs text-yellow-700">
                      <span className="font-medium">{step.step}:</span> {step.details}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message content */}
            <div
              className={`p-3 rounded-xl max-w-[80%] ${
                m.role === 'user' ? 'ml-auto bg-blue-100' : 'mr-auto bg-gray-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-gray-400 animate-pulse">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span>Thinking...</span>
            {currentModel && (
              <span className="text-xs">
                (using {currentModel.provider} {currentModel.model})
              </span>
            )}
          </div>
        )}
      </main>

      <footer className="border-t bg-white p-4">
        <div className="flex space-x-2">
          <input
            className="flex-1 border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Oria anything..."
            onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading || !input.trim()}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
          <div>
            {currentModel && (
              <span>
                Current:{' '}
                {currentModel.provider === 'ollama'
                  ? `${
                      aiCapabilities?.ollamaStatus?.type === 'remote' ? 'RunPod' : 'Local'
                    } (Ollama)`
                  : currentModel.provider}{' '}
                {currentModel.model}
                {currentModel.costPerToken > 0 && (
                  <span className="ml-2">(${currentModel.costPerToken.toFixed(4)}/token)</span>
                )}
              </span>
            )}
          </div>
          <div>
            {usage.tokens ? (
              <>
                Tokens: {usage.tokens} | Cost: ${usage.cost?.toFixed(4)}
              </>
            ) : (
              'Ready to chat'
            )}
          </div>
        </div>
      </footer>

      {/* Tool Confirmation Dialog */}
      {showConfirmation && pendingToolCalls.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Tool Execution</h3>
            <p className="text-gray-600 mb-4">
              The AI assistant wants to execute the following tools. Please review and confirm:
            </p>

            <div className="space-y-3 mb-6">
              {pendingToolCalls.map((toolCall, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-gray-900">{toolCall.tool}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Parameters: {JSON.stringify(toolCall.parameters, null, 2)}
                  </div>
                  {toolCall.confirmationMessage && (
                    <div className="text-sm text-orange-600 mt-2">
                      ⚠️ {toolCall.confirmationMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleToolConfirmation(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleToolConfirmation(true)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? 'Executing...' : 'Approve & Execute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
