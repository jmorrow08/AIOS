import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAgents, updateAgent, type Agent } from '@/agents';
import { MainNavigation } from '@/components/MainNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Users,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Bot,
  User,
  Settings,
  History,
  ExternalLink,
} from 'lucide-react';
import AgentForm from '@/components/AgentForm';
import AgentConsole from '@/components/AgentConsole';
import SOPGenerator from '@/components/SOPGenerator';

const AiLab: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals and forms
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [editAgentOpen, setEditAgentOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Meeting states
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingQuestion, setMeetingQuestion] = useState('');
  const [selectedAgentsForMeeting, setSelectedAgentsForMeeting] = useState<string[]>([]);
  const [meetingLoading, setMeetingLoading] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [agents, searchQuery, statusFilter, roleFilter]);

  const loadAgents = async () => {
    try {
      const response = await getAgents();
      if (response.data && Array.isArray(response.data)) {
        setAgents(response.data as Agent[]);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAgents = () => {
    let filtered = [...agents];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((agent) => agent.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((agent) => agent.role === roleFilter);
    }

    setFilteredAgents(filtered);
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setCreateAgentOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setEditAgentOpen(true);
  };

  const handleAgentFormSuccess = async () => {
    await loadAgents();
    setCreateAgentOpen(false);
    setEditAgentOpen(false);
    setEditingAgent(null);
  };

  const handleToggleAgentStatus = async (agent: Agent) => {
    try {
      const newStatus = agent.status === 'active' ? 'inactive' : 'active';
      const response = await updateAgent(agent.id, { status: newStatus });
      if (!response.error) {
        await loadAgents();
      } else {
        alert('Failed to update agent status: ' + response.error);
      }
    } catch (error) {
      console.error('Error updating agent status:', error);
      alert('Error updating agent status.');
    }
  };

  const getUniqueRoles = () => {
    const roles = agents.map((agent) => agent.role);
    return [...new Set(roles)].sort();
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <XCircle className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading AI Lab...</div>
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
              <h1 className="text-3xl font-bold text-white">AI Automation Lab</h1>
              <p className="text-gray-400 mt-1">
                Build intelligent AI agents and create no-code automation workflows with n8n
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleCreateAgent}
                className="bg-cosmic-accent hover:bg-cosmic-highlight"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
              <Button onClick={() => setMeetingOpen(true)} variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Multi-Agent Meeting
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="agents" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
            <TabsTrigger value="agents">🤖 AI Agents</TabsTrigger>
            <TabsTrigger value="workflows">⚡ n8n Workflows</TabsTrigger>
            <TabsTrigger value="sop">📋 SOP Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Agent List & Management */}
              <div className="w-1/3 border-r border-cosmic-light flex flex-col">
                {/* Search and Filters */}
                <div className="p-4 border-b border-cosmic-light">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="search" className="text-white text-sm">
                        Search Agents
                      </Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="search"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name, role, or description..."
                          className="pl-10 bg-cosmic-light text-white border-cosmic-accent"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Label htmlFor="status-filter" className="text-white text-sm">
                          Status
                        </Label>
                        <select
                          id="status-filter"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                          className="w-full mt-1 p-2 bg-cosmic-light text-white border border-cosmic-accent rounded text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div className="flex-1">
                        <Label htmlFor="role-filter" className="text-white text-sm">
                          Role
                        </Label>
                        <select
                          id="role-filter"
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="w-full mt-1 p-2 bg-cosmic-light text-white border border-cosmic-accent rounded text-sm"
                        >
                          <option value="all">All Roles</option>
                          {getUniqueRoles().map((role) => (
                            <option key={role} value={role}>
                              {role.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agent List */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {filteredAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedAgent?.id === agent.id
                            ? 'border-cosmic-accent bg-cosmic-accent/10'
                            : 'border-cosmic-light bg-cosmic-dark hover:border-cosmic-accent/50'
                        }`}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-white font-semibold">{agent.name}</h3>
                            <p className="text-gray-400 text-sm capitalize">
                              {agent.role.replace('_', ' ')}
                            </p>
                          </div>
                          <div className={`flex items-center ${getStatusColor(agent.status)}`}>
                            {getStatusIcon(agent.status)}
                            <span className="text-xs ml-1 capitalize">{agent.status}</span>
                          </div>
                        </div>

                        {agent.description && (
                          <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                            {agent.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1 mb-3">
                          {agent.capabilities_json?.slice(0, 3).map((cap: string) => (
                            <span
                              key={cap}
                              className="text-xs bg-cosmic-accent/20 text-cosmic-accent px-2 py-1 rounded"
                            >
                              {cap.replace('_', ' ')}
                            </span>
                          ))}
                          {agent.capabilities_json && agent.capabilities_json.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{agent.capabilities_json.length - 3} more
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-400">
                            {agent.llm_provider && (
                              <span className="capitalize">{agent.llm_provider}</span>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAgent(agent);
                              }}
                              className="text-gray-400 hover:text-white p-1"
                            >
                              <Settings className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAgentStatus(agent);
                              }}
                              className="text-gray-400 hover:text-white p-1"
                            >
                              <Ban className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredAgents.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No agents found matching your criteria.</p>
                        <Button
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                            setRoleFilter('all');
                          }}
                          variant="outline"
                          className="mt-3"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Stats */}
                <div className="p-4 border-t border-cosmic-light">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">{agents.length}</div>
                      <div className="text-xs text-gray-400">Total Agents</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {agents.filter((a) => a.status === 'active').length}
                      </div>
                      <div className="text-xs text-gray-400">Active</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        {getUniqueRoles().length}
                      </div>
                      <div className="text-xs text-gray-400">Roles</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Agent Console */}
              <div className="flex-1 flex flex-col">
                {selectedAgent ? (
                  <AgentConsole agent={selectedAgent} userId="user-123" />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Select an Agent to Start
                      </h3>
                      <p className="max-w-md">
                        Choose an agent from the list to begin chatting, running tasks, or accessing
                        specialized capabilities.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="flex-1">
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">n8n Automation Workflows</h2>
                  <p className="text-gray-400 text-lg">
                    Create powerful no-code automations that connect your AI agents with external
                    services. Perfect for beginners - drag, drop, and automate!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Getting Started Card */}
                  <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
                    <div className="text-4xl mb-4">🚀</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Getting Started</h3>
                    <p className="text-gray-300 mb-4">
                      New to automation? Start with our beginner-friendly templates and step-by-step
                      guides.
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Social media posting</li>
                      <li>• Email notifications</li>
                      <li>• Data synchronization</li>
                    </ul>
                  </div>

                  {/* Social Media Automation */}
                  <div className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-lg p-6">
                    <div className="text-4xl mb-4">📱</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Social Media</h3>
                    <p className="text-gray-300 mb-4">
                      Automatically post to multiple platforms, schedule content, and track
                      performance.
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Multi-platform posting</li>
                      <li>• Content scheduling</li>
                      <li>• Performance tracking</li>
                    </ul>
                  </div>

                  {/* AI Agent Integration */}
                  <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6">
                    <div className="text-4xl mb-4">🤖</div>
                    <h3 className="text-xl font-semibold text-white mb-2">AI Integration</h3>
                    <p className="text-gray-300 mb-4">
                      Connect your AI agents with external tools and services for enhanced
                      automation.
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Agent task triggers</li>
                      <li>• Content generation</li>
                      <li>• Smart routing</li>
                    </ul>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="bg-cosmic-dark/50 border border-cosmic-light rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    ⚙️ Setup Your n8n Instance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-cosmic-accent mb-2">
                        1. Self-Host n8n
                      </h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Run n8n on your own server for full control and privacy.
                      </p>
                      <div className="bg-black/30 rounded p-3 font-mono text-xs text-green-400">
                        docker run -d --name n8n -p 5678:5678 n8nio/n8n
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-cosmic-accent mb-2">
                        2. Configure Connection
                      </h4>
                      <p className="text-gray-300 text-sm mb-3">
                        Set your n8n URL and API key in AI OS settings.
                      </p>
                      <Button
                        onClick={() => (window.location.href = '/settings')}
                        variant="outline"
                        size="sm"
                        className="border-cosmic-accent text-cosmic-accent hover:bg-cosmic-accent hover:text-white"
                      >
                        Open Settings
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => (window.location.href = '/automation-builder')}
                    className="bg-cosmic-accent hover:bg-cosmic-highlight text-white px-8 py-3"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Open n8n Builder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://docs.n8n.io', '_blank')}
                    className="border-cosmic-light text-white hover:bg-cosmic-light/10 px-8 py-3"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    n8n Documentation
                  </Button>
                </div>

                {/* Quick Tips */}
                <div className="mt-8 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-yellow-400 mb-2">
                    💡 Quick Tips for Beginners
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                      <strong className="text-white">Start Simple:</strong> Begin with basic
                      workflows like "When I create a new client → Send welcome email"
                    </div>
                    <div>
                      <strong className="text-white">Use Templates:</strong> n8n has hundreds of
                      pre-built templates you can customize
                    </div>
                    <div>
                      <strong className="text-white">Test Often:</strong> Use the "Test Run" feature
                      to verify your workflows before activating
                    </div>
                    <div>
                      <strong className="text-white">Learn by Doing:</strong> Most automation
                      concepts are easier to understand when you build them
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sop" className="flex-1">
            <SOPGenerator />
          </TabsContent>
        </Tabs>

        {/* Create Agent Modal */}
        <Dialog open={createAgentOpen} onOpenChange={setCreateAgentOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <AgentForm
              onSuccess={handleAgentFormSuccess}
              onCancel={() => setCreateAgentOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Agent Modal */}
        <Dialog open={editAgentOpen} onOpenChange={setEditAgentOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <AgentForm
              agent={editingAgent}
              onSuccess={handleAgentFormSuccess}
              onCancel={() => setEditAgentOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Multi-Agent Meeting Modal - Placeholder for now */}
        <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
          <DialogContent className="max-w-4xl">
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto mb-4 text-cosmic-accent" />
              <h3 className="text-xl font-semibold text-white mb-2">Multi-Agent Meeting</h3>
              <p className="text-gray-400 mb-4">
                This feature allows multiple agents to collaborate on complex tasks.
              </p>
              <p className="text-sm text-gray-500">
                Coming soon - Enhanced multi-agent coordination system
              </p>
              <Button onClick={() => setMeetingOpen(false)} className="mt-4" variant="outline">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AiLab;
