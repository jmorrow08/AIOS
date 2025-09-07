import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  getAgentsWithPermissions,
  updateAgentPermissions,
  getEmployeesWithAgents,
  EmployeeWithAgent,
} from '@/api/hr';
import {
  getAgents,
  createAgent,
  updateAgent,
  Agent,
  CreateAgentData,
  UpdateAgentData,
  LLMProvider,
} from '@/agents/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Settings,
  Search,
  Loader2,
  User,
  Shield,
  ShieldCheck,
  Play,
  Pause,
  Activity,
  Users,
} from 'lucide-react';

const LLM_PROVIDERS: LLMProvider[] = ['openai', 'claude', 'gemini'];
const DEPARTMENTS = ['hr', 'sales', 'marketing', 'ops', 'finance', 'support', 'executive'];

const PERMISSION_LABELS = {
  services: 'Services',
  finance: 'Finance',
  media: 'Media Studio',
  knowledge: 'Knowledge Library',
  hr: 'HR Portal',
  admin: 'Admin Portal',
};

const CAPABILITY_LABELS = {
  chat: 'Chat',
  content_generation: 'Content Generation',
  creative_writing: 'Creative Writing',
  multimedia_design: 'Multimedia Design',
  financial_analysis: 'Financial Analysis',
  data_processing: 'Data Processing',
  report_generation: 'Report Generation',
  market_research: 'Market Research',
  technical_consulting: 'Technical Consulting',
  code_review: 'Code Review',
  architecture_design: 'Architecture Design',
  system_analysis: 'System Analysis',
  project_management: 'Project Management',
  task_coordination: 'Task Coordination',
  risk_assessment: 'Risk Assessment',
  resource_planning: 'Resource Planning',
  sub_agent_coordination: 'Sub-Agent Coordination',
  data_analysis: 'Data Analysis',
  machine_learning: 'Machine Learning',
  statistical_modeling: 'Statistical Modeling',
  data_visualization: 'Data Visualization',
};

interface AiAgentsProps {
  onAgentSelect?: (agent: Agent) => void;
}

const AiAgents: React.FC<AiAgentsProps> = ({ onAgentSelect }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CreateAgentData>({
    name: '',
    role: '',
    description: '',
    prompt: '',
    api_key_ref: '',
    llm_provider: 'openai',
    llm_model: 'gpt-4',
    capabilities_json: ['chat'],
    status: 'active',
  });

  const [permissionsData, setPermissionsData] = useState<EmployeeWithAgent['permissions']>({
    services: true,
    finance: false,
    media: false,
    knowledge: true,
    hr: false,
    admin: false,
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentsResult, employeesResult] = await Promise.all([
        getAgentsWithPermissions(),
        getEmployeesWithAgents(),
      ]);

      if (agentsResult.data) {
        setAgents(agentsResult.data);
      }
      if (employeesResult.data) {
        setEmployees(employeesResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter agents based on search and department
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  // Get linked employees for an agent
  const getLinkedEmployees = (agentId: string) => {
    return employees.filter((employee) => employee.agent_id === agentId);
  };

  const handleCreateAgent = async () => {
    setIsSubmitting(true);
    try {
      const result = await createAgent(formData);
      if (result.data) {
        setAgents((prev) => [result.data!, ...prev]);
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        console.error('Error creating agent:', result.error);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateAgentData = {
        name: formData.name,
        role: formData.role,
        description: formData.description,
        prompt: formData.prompt,
        api_key_ref: formData.api_key_ref,
        llm_provider: formData.llm_provider,
        llm_model: formData.llm_model,
        capabilities_json: formData.capabilities_json,
        status: formData.status,
      };

      const result = await updateAgent(selectedAgent.id, updateData);
      if (result.data) {
        setAgents((prev) =>
          prev.map((agent) => (agent.id === selectedAgent.id ? result.data! : agent)),
        );
        setIsEditDialogOpen(false);
        resetForm();
      } else {
        console.error('Error updating agent:', result.error);
      }
    } catch (error) {
      console.error('Error updating agent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from('ai_agents').delete().eq('id', agentId);
      if (error) throw error;

      setAgents((prev) => prev.filter((agent) => agent.id !== agentId));
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const handleToggleAgentStatus = async (agent: Agent) => {
    try {
      const newStatus = agent.status === 'active' ? 'inactive' : 'active';
      const result = await updateAgent(agent.id, { status: newStatus });
      if (result.data) {
        setAgents((prev) => prev.map((a) => (a.id === agent.id ? result.data! : a)));
      }
    } catch (error) {
      console.error('Error toggling agent status:', error);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedAgent) return;

    setIsSubmitting(true);
    try {
      const result = await updateAgentPermissions(selectedAgent.id, permissionsData);
      if (result.data) {
        setAgents((prev) =>
          prev.map((agent) => (agent.id === selectedAgent.id ? result.data! : agent)),
        );
        setIsPermissionsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      description: '',
      prompt: '',
      api_key_ref: '',
      llm_provider: 'openai',
      llm_model: 'gpt-4',
      capabilities_json: ['chat'],
      status: 'active',
    });
    setSelectedAgent(null);
  };

  const openEditDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      role: agent.role,
      description: agent.description || '',
      prompt: agent.prompt || '',
      api_key_ref: agent.api_key_ref || '',
      llm_provider: agent.llm_provider || 'openai',
      llm_model: agent.llm_model || 'gpt-4',
      capabilities_json: agent.capabilities_json || ['chat'],
      status: agent.status,
    });
    setIsEditDialogOpen(true);
  };

  const openPermissionsDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setPermissionsData(
      agent.permissions || {
        services: true,
        finance: false,
        media: false,
        knowledge: true,
        hr: false,
        admin: false,
      },
    );
    setIsPermissionsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const renderCapabilities = (capabilities: string[]) => {
    if (!capabilities || capabilities.length === 0) {
      return <span className="text-gray-500 text-sm">No capabilities</span>;
    }

    const capabilityLabels = capabilities
      .map((cap) => CAPABILITY_LABELS[cap as keyof typeof CAPABILITY_LABELS] || cap)
      .slice(0, 3);

    return (
      <div className="flex flex-wrap gap-1">
        {capabilityLabels.map((capability) => (
          <Badge key={capability} variant="outline" className="text-xs">
            {capability}
          </Badge>
        ))}
        {capabilities.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{capabilities.length - 3}
          </Badge>
        )}
      </div>
    );
  };

  const renderPermissions = (permissions: EmployeeWithAgent['permissions']) => {
    const activePermissions = Object.entries(permissions)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => PERMISSION_LABELS[key as keyof typeof PERMISSION_LABELS]);

    return activePermissions.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {activePermissions.slice(0, 2).map((permission) => (
          <Badge key={permission} variant="outline" className="text-xs">
            {permission}
          </Badge>
        ))}
        {activePermissions.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{activePermissions.length - 2}
          </Badge>
        )}
      </div>
    ) : (
      <span className="text-gray-500 text-sm">No permissions</span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-cosmic-accent" />
        <span className="ml-2 text-white">Loading AI agents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Bot className="w-8 h-8 text-cosmic-accent" />
          <div>
            <h2 className="text-2xl font-bold text-white">AI Agents</h2>
            <p className="text-gray-400">Manage AI agents and their assignments to departments</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cosmic-accent hover:bg-cosmic-highlight">
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create New AI Agent</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure a new AI agent with specific capabilities and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="Content Creator Agent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-white">
                  Role *
                </Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="content_creator"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="llm_provider" className="text-white">
                  LLM Provider
                </Label>
                <Select
                  value={formData.llm_provider}
                  onValueChange={(value: LLMProvider) =>
                    setFormData((prev) => ({ ...prev, llm_provider: value }))
                  }
                >
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-dark border-cosmic-light">
                    {LLM_PROVIDERS.map((provider) => (
                      <SelectItem key={provider} value={provider} className="text-white">
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="llm_model" className="text-white">
                  LLM Model
                </Label>
                <Input
                  id="llm_model"
                  value={formData.llm_model}
                  onChange={(e) => setFormData((prev) => ({ ...prev, llm_model: e.target.value }))}
                  className="bg-cosmic-light border-cosmic-accent text-white"
                  placeholder="gpt-4"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="bg-cosmic-light border-cosmic-accent text-white"
                placeholder="Brief description of the agent's purpose..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-white">
                System Prompt
              </Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                className="bg-cosmic-light border-cosmic-accent text-white"
                placeholder="You are a specialized AI agent that..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="text-white border-cosmic-accent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={isSubmitting}
                className="bg-cosmic-accent hover:bg-cosmic-highlight"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Agent
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-cosmic-dark border-cosmic-light">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-cosmic-light border-cosmic-accent text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card className="bg-cosmic-dark border-cosmic-light">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Agents ({filteredAgents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-cosmic-light">
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Role</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Capabilities</TableHead>
                <TableHead className="text-white">Permissions</TableHead>
                <TableHead className="text-white">Linked Employees</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => {
                const linkedEmployees = getLinkedEmployees(agent.id);
                return (
                  <TableRow key={agent.id} className="border-cosmic-light">
                    <TableCell className="text-white font-medium">{agent.name}</TableCell>
                    <TableCell className="text-white">{agent.role}</TableCell>
                    <TableCell>{getStatusBadge(agent.status)}</TableCell>
                    <TableCell>{renderCapabilities(agent.capabilities_json || [])}</TableCell>
                    <TableCell>
                      {renderPermissions(
                        agent.permissions || {
                          services: true,
                          finance: false,
                          media: false,
                          knowledge: true,
                          hr: false,
                          admin: false,
                        },
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-white text-sm">{linkedEmployees.length}</span>
                        {linkedEmployees.length > 0 && (
                          <div className="ml-2">
                            <div className="flex flex-wrap gap-1">
                              {linkedEmployees.slice(0, 2).map((employee) => (
                                <Badge key={employee.id} variant="outline" className="text-xs">
                                  {employee.name}
                                </Badge>
                              ))}
                              {linkedEmployees.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{linkedEmployees.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleAgentStatus(agent)}
                          className={`${
                            agent.status === 'active'
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-green-400 hover:text-green-300'
                          }`}
                        >
                          {agent.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(agent)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openPermissionsDialog(agent)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-cosmic-dark border-cosmic-light">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Delete AI Agent
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to delete {agent.name}? This will also unlink
                                all associated employees.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="text-white border-cosmic-accent">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAgent(agent.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Agent Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit AI Agent</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update agent configuration and settings.
            </DialogDescription>
          </DialogHeader>
          {/* Same form fields as create dialog */}
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-white">
                Name *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-cosmic-light border-cosmic-accent text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-white">
                Role *
              </Label>
              <Input
                id="edit-role"
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                className="bg-cosmic-light border-cosmic-accent text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-llm_provider" className="text-white">
                LLM Provider
              </Label>
              <Select
                value={formData.llm_provider}
                onValueChange={(value: LLMProvider) =>
                  setFormData((prev) => ({ ...prev, llm_provider: value }))
                }
              >
                <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-dark border-cosmic-light">
                  {LLM_PROVIDERS.map((provider) => (
                    <SelectItem key={provider} value={provider} className="text-white">
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-llm_model" className="text-white">
                LLM Model
              </Label>
              <Input
                id="edit-llm_model"
                value={formData.llm_model}
                onChange={(e) => setFormData((prev) => ({ ...prev, llm_model: e.target.value }))}
                className="bg-cosmic-light border-cosmic-accent text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-white">
              Description
            </Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="bg-cosmic-light border-cosmic-accent text-white"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-prompt" className="text-white">
              System Prompt
            </Label>
            <Textarea
              id="edit-prompt"
              value={formData.prompt}
              onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
              className="bg-cosmic-light border-cosmic-accent text-white"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="text-white border-cosmic-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAgent}
              disabled={isSubmitting}
              className="bg-cosmic-accent hover:bg-cosmic-highlight"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              Update Agent
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="bg-cosmic-dark border-cosmic-light max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Manage Agent Permissions</DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure access permissions for {selectedAgent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`agent-perm-${key}`} className="text-white">
                  {label}
                </Label>
                <Switch
                  id={`agent-perm-${key}`}
                  checked={permissionsData[key as keyof typeof permissionsData]}
                  onCheckedChange={(checked) =>
                    setPermissionsData((prev) => ({
                      ...prev,
                      [key]: checked,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPermissionsDialogOpen(false)}
              className="text-white border-cosmic-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              disabled={isSubmitting}
              className="bg-cosmic-accent hover:bg-cosmic-highlight"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Update Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AiAgents;
