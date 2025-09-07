import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAgents, updateAgent, type Agent } from '@/agents';
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
    <div className="h-screen flex flex-col bg-cosmic-dark">
      {/* Header */}
      <div className="p-6 border-b border-cosmic-light">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Agent Builder & Hub</h1>
            <p className="text-gray-400 mt-1">
              Create, configure, and interact with AI agents powered by advanced LLMs
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
        <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
          <TabsTrigger value="agents">Agent Management</TabsTrigger>
          <TabsTrigger value="sop">SOP Generator</TabsTrigger>
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
  );
};

export default AiLab;
