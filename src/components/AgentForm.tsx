import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  createAgent,
  updateAgent,
  type Agent,
  type CreateAgentData,
  type UpdateAgentData,
} from '@/agents';
import { Loader2, X } from 'lucide-react';

interface AgentFormProps {
  agent?: Agent | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const AGENT_ROLES = [
  {
    value: 'content_creator',
    label: 'Content Creator',
    description: 'Creates engaging content across various formats',
  },
  {
    value: 'financial_analyst',
    label: 'Financial Analyst',
    description: 'Provides financial analysis and insights',
  },
  {
    value: 'technical_consultant',
    label: 'Technical Consultant',
    description: 'Offers technical guidance and solutions',
  },
  {
    value: 'project_manager',
    label: 'Project Manager',
    description: 'Manages projects and coordinates teams',
  },
  {
    value: 'data_scientist',
    label: 'Data Scientist',
    description: 'Analyzes data and builds models',
  },
  {
    value: 'sales_support',
    label: 'Sales Support',
    description: 'Assists with sales and customer interactions',
  },
  {
    value: 'customer_service',
    label: 'Customer Service',
    description: 'Handles customer inquiries and support',
  },
  {
    value: 'research_analyst',
    label: 'Research Analyst',
    description: 'Conducts research and analysis',
  },
  {
    value: 'marketing_specialist',
    label: 'Marketing Specialist',
    description: 'Develops marketing strategies and campaigns',
  },
  {
    value: 'operations_manager',
    label: 'Operations Manager',
    description: 'Manages operational processes',
  },
];

const AGENT_CAPABILITIES = [
  { value: 'chat', label: 'Chat', description: 'Basic conversational capabilities' },
  {
    value: 'content_generation',
    label: 'Content Generation',
    description: 'Create text content and articles',
  },
  {
    value: 'creative_writing',
    label: 'Creative Writing',
    description: 'Creative and narrative writing',
  },
  {
    value: 'multimedia_design',
    label: 'Multimedia Design',
    description: 'Design and multimedia content',
  },
  {
    value: 'financial_analysis',
    label: 'Financial Analysis',
    description: 'Analyze financial data and trends',
  },
  {
    value: 'data_processing',
    label: 'Data Processing',
    description: 'Process and manipulate data',
  },
  {
    value: 'report_generation',
    label: 'Report Generation',
    description: 'Generate structured reports',
  },
  { value: 'market_research', label: 'Market Research', description: 'Conduct market analysis' },
  {
    value: 'technical_consulting',
    label: 'Technical Consulting',
    description: 'Provide technical guidance',
  },
  { value: 'code_review', label: 'Code Review', description: 'Review and analyze code' },
  {
    value: 'architecture_design',
    label: 'Architecture Design',
    description: 'Design system architectures',
  },
  {
    value: 'system_analysis',
    label: 'System Analysis',
    description: 'Analyze systems and processes',
  },
  {
    value: 'project_management',
    label: 'Project Management',
    description: 'Manage projects and tasks',
  },
  { value: 'task_coordination', label: 'Task Coordination', description: 'Coordinate team tasks' },
  {
    value: 'risk_assessment',
    label: 'Risk Assessment',
    description: 'Assess risks and mitigation',
  },
  {
    value: 'resource_planning',
    label: 'Resource Planning',
    description: 'Plan resource allocation',
  },
  {
    value: 'sub_agent_coordination',
    label: 'Sub-Agent Coordination',
    description: 'Coordinate with other agents',
  },
  { value: 'data_analysis', label: 'Data Analysis', description: 'Analyze complex datasets' },
  {
    value: 'machine_learning',
    label: 'Machine Learning',
    description: 'Build ML models and predictions',
  },
  {
    value: 'statistical_modeling',
    label: 'Statistical Modeling',
    description: 'Create statistical models',
  },
  {
    value: 'data_visualization',
    label: 'Data Visualization',
    description: 'Create charts and visualizations',
  },
];

const AgentForm: React.FC<AgentFormProps> = ({ agent, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateAgentData | UpdateAgentData>({
    name: agent?.name || '',
    role: agent?.role || '',
    description: agent?.description || '',
    prompt: agent?.prompt || '',
    capabilities_json: agent?.capabilities_json || [],
    llm_provider: agent?.llm_provider || 'openai',
    llm_model: agent?.llm_model || 'gpt-4',
    status: agent?.status || 'active',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!agent;

  // Generate default prompt based on role and description
  useEffect(() => {
    if (!isEditing && formData.role && formData.description) {
      const selectedRole = AGENT_ROLES.find((r) => r.value === formData.role);
      const defaultPrompt = `You are ${formData.name || 'an AI agent'} specialized in ${
        selectedRole?.label || formData.role
      }.
${formData.description}

Your role involves: ${selectedRole?.description || 'performing specialized tasks'}.
Please be helpful, accurate, and professional in all your responses.`;

      setFormData((prev) => ({ ...prev, prompt: defaultPrompt }));
    }
  }, [formData.role, formData.description, formData.name, isEditing]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCapabilityToggle = (capability: string) => {
    const currentCapabilities = formData.capabilities_json || [];
    const newCapabilities = currentCapabilities.includes(capability)
      ? currentCapabilities.filter((c) => c !== capability)
      : [...currentCapabilities, capability];

    setFormData((prev) => ({ ...prev, capabilities_json: newCapabilities }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name?.trim()) {
        throw new Error('Agent name is required');
      }
      if (!formData.role) {
        throw new Error('Agent role is required');
      }
      if (!formData.description?.trim()) {
        throw new Error('Agent description is required');
      }

      let result;
      if (isEditing && agent) {
        result = await updateAgent(agent.id, formData as UpdateAgentData);
      } else {
        result = await createAgent(formData as CreateAgentData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedCapabilities = (role: string) => {
    const roleCapabilities: Record<string, string[]> = {
      content_creator: ['chat', 'content_generation', 'creative_writing', 'multimedia_design'],
      financial_analyst: [
        'chat',
        'financial_analysis',
        'data_processing',
        'report_generation',
        'market_research',
      ],
      technical_consultant: [
        'chat',
        'technical_consulting',
        'code_review',
        'architecture_design',
        'system_analysis',
      ],
      project_manager: [
        'chat',
        'project_management',
        'task_coordination',
        'risk_assessment',
        'resource_planning',
        'sub_agent_coordination',
      ],
      data_scientist: [
        'chat',
        'data_analysis',
        'machine_learning',
        'statistical_modeling',
        'data_visualization',
      ],
    };

    return roleCapabilities[role] || ['chat'];
  };

  const handleRoleChange = (role: string) => {
    handleInputChange('role', role);
    // Auto-suggest capabilities based on role
    if (!isEditing) {
      const suggestedCapabilities = getSuggestedCapabilities(role);
      handleInputChange('capabilities_json', suggestedCapabilities);
    }
  };

  return (
    <div className="bg-cosmic-dark p-6 rounded-lg border border-cosmic-light max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          {isEditing ? 'Edit Agent' : 'Create New Agent'}
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="text-white">
              Agent Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Marketing Assistant"
              className="bg-cosmic-light text-white border-cosmic-accent mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="role" className="text-white">
              Role *
            </Label>
            <select
              id="role"
              value={formData.role || ''}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full p-2 bg-cosmic-light text-white border border-cosmic-accent rounded mt-1"
              required
            >
              <option value="">Select a role...</option>
              {AGENT_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-white">
            Description & Purpose *
          </Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what this agent does and its primary purpose..."
            className="bg-cosmic-light text-white border-cosmic-accent mt-1"
            rows={3}
            required
          />
        </div>

        {/* LLM Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="llm_provider" className="text-white">
              LLM Provider
            </Label>
            <select
              id="llm_provider"
              value={formData.llm_provider || 'openai'}
              onChange={(e) => handleInputChange('llm_provider', e.target.value)}
              className="w-full p-2 bg-cosmic-light text-white border border-cosmic-accent rounded mt-1"
            >
              <option value="openai">OpenAI</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="gemini">Gemini (Google)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="llm_model" className="text-white">
              LLM Model
            </Label>
            <Input
              id="llm_model"
              type="text"
              value={formData.llm_model || 'gpt-4'}
              onChange={(e) => handleInputChange('llm_model', e.target.value)}
              placeholder="e.g., gpt-4, claude-3-sonnet"
              className="bg-cosmic-light text-white border-cosmic-accent mt-1"
            />
          </div>

          <div>
            <Label htmlFor="status" className="text-white">
              Status
            </Label>
            <select
              id="status"
              value={formData.status || 'active'}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full p-2 bg-cosmic-light text-white border border-cosmic-accent rounded mt-1"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <Label className="text-white block mb-3">Capabilities</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {AGENT_CAPABILITIES.map((capability) => (
              <label key={capability.value} className="flex items-start space-x-2 text-white">
                <input
                  type="checkbox"
                  checked={(formData.capabilities_json || []).includes(capability.value)}
                  onChange={() => handleCapabilityToggle(capability.value)}
                  className="mt-1 rounded border-cosmic-accent"
                />
                <div className="flex-1">
                  <div className="font-medium">{capability.label}</div>
                  <div className="text-sm text-gray-400">{capability.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <Label htmlFor="prompt" className="text-white">
            System Prompt
          </Label>
          <Textarea
            id="prompt"
            value={formData.prompt || ''}
            onChange={(e) => handleInputChange('prompt', e.target.value)}
            placeholder="Enter the system prompt that defines the agent's behavior..."
            className="bg-cosmic-light text-white border-cosmic-accent mt-1"
            rows={6}
          />
          <p className="text-sm text-gray-400 mt-1">
            This prompt defines how the agent behaves. Leave empty to auto-generate based on role
            and description.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-cosmic-light">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-cosmic-accent hover:bg-cosmic-highlight"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEditing ? 'Update Agent' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AgentForm;
