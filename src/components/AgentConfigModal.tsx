import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  createAgent,
  updateAgent,
  Agent,
  CreateAgentData,
  UpdateAgentData,
  LLMProvider,
} from '@/agents';

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent | null;
  onSuccess: () => void;
}

interface ModelOption {
  value: string;
  label: string;
  provider: LLMProvider;
}

const MODEL_OPTIONS: ModelOption[] = [
  { value: 'gpt-4', label: 'GPT-4', provider: 'openai' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'openai' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', provider: 'claude' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', provider: 'claude' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', provider: 'claude' },
  { value: 'gemini-pro', label: 'Gemini Pro', provider: 'gemini' },
  { value: 'gemini-pro-vision', label: 'Gemini Pro Vision', provider: 'gemini' },
];

const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    prompt: '',
    model: '',
    api_key_ref: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form data when agent changes
  useEffect(() => {
    if (agent) {
      // Edit mode
      const selectedModel = MODEL_OPTIONS.find(
        (option) => option.provider === agent.llm_provider && option.value === agent.llm_model,
      );

      setFormData({
        name: agent.name,
        role: agent.role,
        prompt: agent.prompt || '',
        model: selectedModel ? selectedModel.value : agent.llm_model || '',
        api_key_ref: agent.api_key_ref || '',
      });
    } else {
      // Create mode
      setFormData({
        name: '',
        role: '',
        prompt: '',
        model: '',
        api_key_ref: '',
      });
    }
    setError(null);
    setValidationErrors({});
  }, [agent, isOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Agent name is required';
    }

    if (!formData.role.trim()) {
      errors.role = 'Agent role is required';
    }

    if (!formData.prompt.trim()) {
      errors.prompt = 'System prompt is required';
    }

    if (!formData.model) {
      errors.model = 'Model selection is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedModelOption = MODEL_OPTIONS.find((option) => option.value === formData.model);

      if (!selectedModelOption) {
        throw new Error('Invalid model selection');
      }

      const agentData = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        prompt: formData.prompt.trim(),
        llm_provider: selectedModelOption.provider,
        llm_model: selectedModelOption.value,
        api_key_ref: formData.api_key_ref.trim() || undefined,
      };

      let result;
      if (agent) {
        // Update existing agent
        result = await updateAgent(agent.id, agentData as UpdateAgentData);
      } else {
        // Create new agent
        result = await createAgent(agentData as CreateAgentData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving agent:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const getDefaultApiKeyRef = (model: string): string => {
    const modelOption = MODEL_OPTIONS.find((option) => option.value === model);
    if (!modelOption) return '';

    switch (modelOption.provider) {
      case 'openai':
        return 'VITE_OPENAI_API_KEY';
      case 'claude':
        return 'VITE_ANTHROPIC_API_KEY';
      case 'gemini':
        return 'VITE_GOOGLE_AI_API_KEY';
      default:
        return '';
    }
  };

  const handleModelChange = (modelValue: string) => {
    setFormData((prev) => ({
      ...prev,
      model: modelValue,
      // Auto-fill API key reference if not already set
      api_key_ref: prev.api_key_ref || getDefaultApiKeyRef(modelValue),
    }));

    if (validationErrors.model) {
      setValidationErrors((prev) => ({ ...prev, model: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {agent ? 'Edit Agent' : 'Create New Agent'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Agent Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Agent Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Sales Assistant"
                className={`bg-cosmic-light text-white border-cosmic-accent ${
                  validationErrors.name ? 'border-red-500' : ''
                }`}
                disabled={loading}
              />
              {validationErrors.name && (
                <p className="text-red-400 text-xs">{validationErrors.name}</p>
              )}
            </div>

            {/* Agent Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">
                Agent Role *
              </Label>
              <Input
                id="role"
                type="text"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder="e.g., sales_support"
                className={`bg-cosmic-light text-white border-cosmic-accent ${
                  validationErrors.role ? 'border-red-500' : ''
                }`}
                disabled={loading}
              />
              {validationErrors.role && (
                <p className="text-red-400 text-xs">{validationErrors.role}</p>
              )}
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model" className="text-white">
              Model *
            </Label>
            <select
              id="model"
              value={formData.model}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={loading}
              className={`w-full p-2 bg-cosmic-light text-white border rounded ${
                validationErrors.model ? 'border-red-500' : 'border-cosmic-accent'
              }`}
            >
              <option value="">Select a model...</option>
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {validationErrors.model && (
              <p className="text-red-400 text-xs">{validationErrors.model}</p>
            )}
          </div>

          {/* API Key Reference */}
          <div className="space-y-2">
            <Label htmlFor="api_key_ref" className="text-white">
              API Key Reference
            </Label>
            <Input
              id="api_key_ref"
              type="text"
              value={formData.api_key_ref}
              onChange={(e) => handleInputChange('api_key_ref', e.target.value)}
              placeholder="e.g., VITE_OPENAI_API_KEY"
              className="bg-cosmic-light text-white border-cosmic-accent"
              disabled={loading}
            />
            <p className="text-gray-400 text-xs">
              Environment variable containing the API key. Leave empty to use default.
            </p>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-white">
              System Prompt *
            </Label>
            <Textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              placeholder="Enter the system prompt that defines this agent's behavior and role..."
              className={`bg-cosmic-light text-white border-cosmic-accent min-h-[120px] resize-vertical ${
                validationErrors.prompt ? 'border-red-500' : ''
              }`}
              disabled={loading}
            />
            {validationErrors.prompt && (
              <p className="text-red-400 text-xs">{validationErrors.prompt}</p>
            )}
            <p className="text-gray-400 text-xs">
              This prompt will be used to initialize the agent's behavior and context.
            </p>
          </div>

          <DialogFooter className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-cosmic-accent hover:bg-cosmic-highlight"
            >
              {loading ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgentConfigModal;
