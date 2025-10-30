import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { MainNavigation } from '@/components/MainNavigation';
import {
  getAgentTemplates,
  getAgentTemplatesByCategory,
  searchAgentTemplates,
  getTemplateCategories,
  type AgentTemplate,
} from '@/api/agentTemplates';
import { createAgent, type CreateAgentData } from '@/agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Download,
  Plus,
  Bot,
  Zap,
  DollarSign,
  Tag,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Grid3X3,
  List,
} from 'lucide-react';

// Publish Template Modal Component
const PublishTemplateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPublish: (template: PublishTemplateData) => void;
}> = ({ isOpen, onClose, onPublish }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [defaultModel, setDefaultModel] = useState('gpt-4');
  const [costEstimate, setCostEstimate] = useState(0);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!name.trim() || !role.trim() || !description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsPublishing(true);
    try {
      const tagArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      await onPublish({
        name,
        role,
        description,
        prompt_template: promptTemplate,
        default_model: defaultModel,
        cost_estimate: costEstimate,
        category,
        tags: tagArray,
        is_public: isPublic,
      });
      onClose();
      // Reset form
      setName('');
      setRole('');
      setDescription('');
      setPromptTemplate('');
      setDefaultModel('gpt-4');
      setCostEstimate(0);
      setCategory('');
      setTags('');
      setIsPublic(true);
    } catch (error) {
      console.error('Error publishing template:', error);
      alert('Failed to publish template. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Publish Agent Template</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share your agent configuration as a reusable template for your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name" className="text-white">
                Template Name *
              </Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-cosmic-light text-white border-cosmic-accent"
                placeholder="e.g., Senior Developer Assistant"
              />
            </div>

            <div>
              <Label htmlFor="template-role" className="text-white">
                Role *
              </Label>
              <Input
                id="template-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-cosmic-light text-white border-cosmic-accent"
                placeholder="e.g., senior_developer"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="template-description" className="text-white">
              Description *
            </Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-cosmic-light text-white border-cosmic-accent"
              placeholder="Describe what this agent does and its capabilities..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="prompt-template" className="text-white">
              Prompt Template
            </Label>
            <Textarea
              id="prompt-template"
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              className="bg-cosmic-light text-white border-cosmic-accent"
              placeholder="Enter the system prompt template for this agent..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="default-model" className="text-white">
                Default Model
              </Label>
              <Select value={defaultModel} onValueChange={setDefaultModel}>
                <SelectTrigger className="bg-cosmic-light text-white border-cosmic-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3">Claude 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cost-estimate" className="text-white">
                Cost Estimate ($/month)
              </Label>
              <Input
                id="cost-estimate"
                type="number"
                value={costEstimate}
                onChange={(e) => setCostEstimate(Number(e.target.value))}
                className="bg-cosmic-light text-white border-cosmic-accent"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-white">
                Category
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-cosmic-light text-white border-cosmic-accent"
                placeholder="e.g., technical"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags" className="text-white">
              Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-cosmic-light text-white border-cosmic-accent"
              placeholder="e.g., coding, development, technical"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is-public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-cosmic-accent"
            />
            <Label htmlFor="is-public" className="text-white">
              Make this template public
            </Label>
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handlePublish}
            disabled={!name.trim() || !role.trim() || !description.trim() || isPublishing}
            className="bg-cosmic-accent hover:bg-cosmic-highlight flex-1"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Publish Template
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Publish Template Data Interface
interface PublishTemplateData {
  name: string;
  role: string;
  description: string;
  prompt_template?: string;
  default_model: string;
  cost_estimate: number;
  category?: string;
  tags: string[];
  is_public: boolean;
}

// Agent Configuration Modal Component
const AgentConfigModal: React.FC<{
  template: AgentTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall: (config: InstallConfig) => void;
}> = ({ template, isOpen, onClose, onInstall }) => {
  const [name, setName] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [description, setDescription] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (template) {
      setName(`${template.name} (Custom)`);
      setModel(template.default_model);
      setDescription(template.description || '');
    }
  }, [template]);

  const handleInstall = async () => {
    if (!template) return;

    setIsInstalling(true);
    try {
      await onInstall({
        name,
        model,
        description,
        templateId: template.id,
      });
      onClose();
    } catch (error) {
      console.error('Error installing agent:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Install {template.name}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Customize your agent before installing it to your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="agent-name" className="text-white">
              Agent Name
            </Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-cosmic-light text-white border-cosmic-accent"
              placeholder="Enter agent name"
            />
          </div>

          <div>
            <Label htmlFor="model" className="text-white">
              AI Model
            </Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-cosmic-light text-white border-cosmic-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4 (Most Capable)</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</SelectItem>
                <SelectItem value="claude-3">Claude 3 (Balanced)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-white">
              Description (Optional)
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-cosmic-light text-white border-cosmic-accent"
              placeholder="Brief description of your agent's purpose"
            />
          </div>

          <div className="bg-cosmic-light/50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Estimated Cost:</span>
              <span className="text-cosmic-accent font-semibold">
                ${template.cost_estimate}/month
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleInstall}
            disabled={!name.trim() || isInstalling}
            className="bg-cosmic-accent hover:bg-cosmic-highlight flex-1"
          >
            {isInstalling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Install Agent
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Install Configuration Interface
interface InstallConfig {
  name: string;
  model: string;
  description: string;
  templateId: string;
}

const AgentMarketplace: React.FC = () => {
  const { user, role, companyId } = useUser();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AgentTemplate[]>([]);
  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [installingAgent, setInstallingAgent] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter templates when search or filters change
  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load available templates
      const templatesResponse = await getAgentTemplates();
      if (templatesResponse.data && Array.isArray(templatesResponse.data)) {
        setTemplates(templatesResponse.data as AgentTemplate[]);
      }

      // Load categories
      const cats = await getTemplateCategories();
      setCategories(cats);

      // Load user's agents
      await loadMyAgents();
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyAgents = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMyAgents(data);
      }
    } catch (error) {
      console.error('Error loading user agents:', error);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.role.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query) ||
          template.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((template) => template.category === categoryFilter);
    }

    setFilteredTemplates(filtered);
  };

  const handlePublishTemplate = async (templateData: PublishTemplateData) => {
    try {
      const response = await createAgentTemplate({
        ...templateData,
        company_id: companyId,
        created_by: user?.id,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh templates list
      await loadData();
    } catch (error) {
      console.error('Error publishing template:', error);
      throw error;
    }
  };

  const handleInstallAgent = async (config: InstallConfig) => {
    if (!companyId || !selectedTemplate) return;

    setInstallingAgent(config.templateId);

    try {
      const agentData: CreateAgentData = {
        name: config.name,
        role: selectedTemplate.role,
        description: config.description,
        prompt: selectedTemplate.prompt_template,
        llm_provider: config.model.startsWith('gpt') ? 'openai' : 'claude',
        llm_model: config.model,
        capabilities_json: ['chat', 'basic_task_execution'],
        status: 'active',
        created_by: user?.id,
        company_id: companyId,
      };

      const response = await createAgent(agentData);

      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh agents list
      await loadMyAgents();
    } catch (error) {
      console.error('Error installing agent:', error);
      alert('Failed to install agent. Please try again.');
    } finally {
      setInstallingAgent(null);
    }
  };

  const getCategoryColor = (category?: string) => {
    const colors = {
      executive: 'bg-purple-500/20 text-purple-400',
      operations: 'bg-blue-500/20 text-blue-400',
      marketing: 'bg-green-500/20 text-green-400',
      finance: 'bg-yellow-500/20 text-yellow-400',
      technical: 'bg-red-500/20 text-red-400',
      sales: 'bg-pink-500/20 text-pink-400',
      human_resources: 'bg-indigo-500/20 text-indigo-400',
      project_management: 'bg-orange-500/20 text-orange-400',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-cosmic-dark">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-cosmic-accent animate-spin" />
          <p className="text-white text-xl">Loading Agent Marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-cosmic-dark">
      <MainNavigation />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cosmic-light">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Agent Marketplace</h1>
              <p className="text-gray-400 mt-1">
                Discover, customize, and install AI agents for your team
              </p>
            </div>
            {role === 'admin' && (
              <Button
                onClick={() => setPublishModalOpen(true)}
                className="bg-cosmic-accent hover:bg-cosmic-highlight"
              >
                <Plus className="w-4 h-4 mr-2" />
                Publish Template
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="available" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
            <TabsTrigger value="available">Available Agents</TabsTrigger>
            <TabsTrigger value="my-agents">My Agents ({myAgents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="flex-1 flex flex-col overflow-hidden">
            {/* Search and Filters */}
            <div className="p-6 border-b border-cosmic-light">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search agents by name, role, or description..."
                      className="pl-10 bg-cosmic-light text-white border-cosmic-accent"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40 bg-cosmic-light text-white border-cosmic-accent">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex border border-cosmic-light rounded">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Templates Grid/List */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchQuery || categoryFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No agent templates are currently available'}
                  </p>
                  {(searchQuery || categoryFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                      : 'space-y-4'
                  }
                >
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="bg-cosmic-light border-cosmic-accent/20 hover:border-cosmic-accent/50 transition-all duration-200"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                            <CardDescription className="text-gray-400 capitalize">
                              {template.role.replace('_', ' ')}
                            </CardDescription>
                          </div>
                          {template.category && (
                            <Badge className={getCategoryColor(template.category)}>
                              {template.category.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="pb-3">
                        {template.description && (
                          <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                            {template.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                          <div className="flex items-center">
                            <Zap className="w-4 h-4 mr-1" />
                            <span>{template.default_model}</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span>${template.cost_estimate}/mo</span>
                          </div>
                        </div>

                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>

                      <CardFooter>
                        <Button
                          onClick={() => {
                            setSelectedTemplate(template);
                            setConfigModalOpen(true);
                          }}
                          disabled={installingAgent === template.id}
                          className="w-full bg-cosmic-accent hover:bg-cosmic-highlight"
                        >
                          {installingAgent === template.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Installing...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Install Agent
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-agents" className="flex-1">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAgents.map((agent) => (
                  <Card key={agent.id} className="bg-cosmic-light border-cosmic-accent/20">
                    <CardHeader>
                      <CardTitle className="text-white">{agent.name}</CardTitle>
                      <CardDescription className="text-gray-400 capitalize">
                        {agent.role.replace('_', ' ')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-sm text-gray-400">Active</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {agent.llm_provider} - {agent.llm_model}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Agent Configuration Modal */}
        <AgentConfigModal
          template={selectedTemplate}
          isOpen={configModalOpen}
          onClose={() => {
            setConfigModalOpen(false);
            setSelectedTemplate(null);
          }}
          onInstall={handleInstallAgent}
        />

        {/* Publish Template Modal */}
        <PublishTemplateModal
          isOpen={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          onPublish={handlePublishTemplate}
        />
      </div>
    </div>
  );
};

export default AgentMarketplace;
