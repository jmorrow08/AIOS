import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { routeTask, getAgents, updateAgent, type Agent, type TaskResult } from '@/agents';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MessageSquare, Users, Edit, Ban, CheckCircle, XCircle, Plus } from 'lucide-react';
import AgentConfigModal from '@/components/AgentConfigModal';

interface ChatMessage {
  id: string;
  agentName: string;
  agentRole: string;
  message: string;
  timestamp: Date;
  isUser?: boolean;
}

interface MeetingTranscript {
  id: string;
  question: string;
  responses: ChatMessage[];
  chiefSummary?: string;
  timestamp: Date;
}

const AiLab: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [meetingOpen, setMeetingOpen] = useState(false);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Meeting states
  const [meetingQuestion, setMeetingQuestion] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [meetingTranscript, setMeetingTranscript] = useState<MeetingTranscript | null>(null);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

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

  const handleChat = async () => {
    if (!selectedAgent || !chatInput.trim()) return;

    setChatLoading(true);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      agentName: 'You',
      agentRole: 'user',
      message: chatInput,
      timestamp: new Date(),
      isUser: true,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');

    try {
      const result = await routeTask(selectedAgent.role, chatInput);

      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        agentName: selectedAgent.name,
        agentRole: selectedAgent.role,
        message: result.response || 'No response received',
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        agentName: selectedAgent.name,
        agentRole: selectedAgent.role,
        message: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleMeeting = async () => {
    if (!meetingQuestion.trim() || selectedAgents.length === 0) return;

    setMeetingLoading(true);

    const meetingId = Date.now().toString();
    const responses: ChatMessage[] = [];

    // Get responses from selected agents
    for (const agentRole of selectedAgents) {
      try {
        const result = await routeTask(agentRole, meetingQuestion);

        const agent = agents.find((a) => a.role === agentRole);
        if (agent && result.success) {
          const response: ChatMessage = {
            id: `${meetingId}-${agentRole}`,
            agentName: agent.name,
            agentRole: agent.role,
            message: result.response,
            timestamp: new Date(),
          };
          responses.push(response);
        }
      } catch (error) {
        console.error(`Error getting response from ${agentRole}:`, error);
      }
    }

    const transcript: MeetingTranscript = {
      id: meetingId,
      question: meetingQuestion,
      responses,
      timestamp: new Date(),
    };

    setMeetingTranscript(transcript);

    // Auto-summarize with Chief if available
    await summarizeMeeting(transcript);

    setMeetingLoading(false);
  };

  const summarizeMeeting = async (transcript: MeetingTranscript) => {
    setSummarizing(true);
    try {
      const chiefAvailable = agents.some((agent) => agent.role.toLowerCase() === 'chief');
      if (chiefAvailable) {
        const summaryPrompt = `Please summarize the following meeting discussion:\n\nQuestion: ${
          transcript.question
        }\n\nResponses:\n${transcript.responses
          .map((r) => `${r.agentName} (${r.agentRole}): ${r.message}`)
          .join('\n\n')}`;

        const summaryResult = await routeTask('chief', summaryPrompt);
        if (summaryResult.success) {
          setMeetingTranscript((prev) =>
            prev ? { ...prev, chiefSummary: summaryResult.response } : null,
          );
        }
      }
    } catch (error) {
      console.error('Error summarizing meeting:', error);
    } finally {
      setSummarizing(false);
    }
  };

  const saveTranscript = async () => {
    if (!meetingTranscript) return;

    try {
      const { error } = await supabase.from('meeting_logs').insert([
        {
          transcript: {
            id: meetingTranscript.id,
            question: meetingTranscript.question,
            responses: meetingTranscript.responses.map((r) => ({
              agentName: r.agentName,
              agentRole: r.agentRole,
              message: r.message,
              timestamp: r.timestamp.toISOString(),
            })),
            chiefSummary: meetingTranscript.chiefSummary,
            timestamp: meetingTranscript.timestamp.toISOString(),
          },
        },
      ]);

      if (error) throw error;

      alert('Meeting transcript saved successfully!');
    } catch (error) {
      console.error('Error saving transcript:', error);
      alert('Failed to save transcript.');
    }
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setConfigModalOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setConfigModalOpen(true);
  };

  const handleConfigModalSuccess = async () => {
    await loadAgents();
    setConfigModalOpen(false);
    setEditingAgent(null);
  };

  const handleConfigModalClose = () => {
    setConfigModalOpen(false);
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

  const toggleAgentSelection = (agentRole: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentRole) ? prev.filter((role) => role !== agentRole) : [...prev, agentRole],
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-white">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">AI Lab</h1>
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
            Meeting Mode
          </Button>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-cosmic-dark rounded-lg border border-cosmic-light overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Role</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">LLM Provider</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="text-white">{agent.name}</TableCell>
                <TableCell className="text-white">{agent.role}</TableCell>
                <TableCell>
                  <span
                    className={`flex items-center ${
                      agent.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {agent.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-1" />
                    )}
                    {agent.status}
                  </span>
                </TableCell>
                <TableCell className="text-white">{agent.llm_provider || 'Not set'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedAgent(agent);
                        setChatOpen(true);
                      }}
                      disabled={agent.status !== 'active'}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditAgent(agent)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleAgentStatus(agent)}
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Chat with {selectedAgent?.name} ({selectedAgent?.role})
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-96">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cosmic-dark rounded">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.isUser ? 'bg-cosmic-accent text-white' : 'bg-cosmic-light text-white'
                    }`}
                  >
                    <div className="font-semibold text-sm">{msg.agentName}</div>
                    <div className="text-sm mt-1">{msg.message}</div>
                    <div className="text-xs opacity-70 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-cosmic-light p-3 rounded-lg">
                    <div className="text-white text-sm">Thinking...</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex mt-4 space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Type your message..."
                className="flex-1 p-2 bg-cosmic-light text-white rounded border border-cosmic-accent"
                disabled={chatLoading}
              />
              <Button onClick={handleChat} disabled={chatLoading || !chatInput.trim()}>
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Configuration Modal */}
      <AgentConfigModal
        isOpen={configModalOpen}
        onClose={handleConfigModalClose}
        agent={editingAgent}
        onSuccess={handleConfigModalSuccess}
      />

      {/* Meeting Mode Dialog */}
      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-white">AI Meeting Mode</DialogTitle>
          </DialogHeader>

          <div className="flex space-x-4 h-96">
            {/* Agent Selection */}
            <div className="w-1/3 bg-cosmic-dark p-4 rounded">
              <h3 className="text-white font-semibold mb-3">Select Agents</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {agents
                  .filter((agent) => agent.status === 'active')
                  .map((agent) => (
                    <label key={agent.id} className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={selectedAgents.includes(agent.role)}
                        onChange={() => toggleAgentSelection(agent.role)}
                        className="rounded"
                      />
                      <span>
                        {agent.name} ({agent.role})
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            {/* Meeting Interface */}
            <div className="flex-1 flex flex-col">
              <div className="mb-4">
                <textarea
                  value={meetingQuestion}
                  onChange={(e) => setMeetingQuestion(e.target.value)}
                  placeholder="Enter your question for the meeting..."
                  className="w-full p-3 bg-cosmic-light text-white rounded h-24 resize-none"
                />
                <Button
                  onClick={handleMeeting}
                  disabled={
                    meetingLoading || !meetingQuestion.trim() || selectedAgents.length === 0
                  }
                  className="mt-2 bg-cosmic-accent hover:bg-cosmic-highlight"
                >
                  {meetingLoading ? 'Processing...' : 'Start Meeting'}
                </Button>
              </div>

              {/* Meeting Transcript */}
              <div className="flex-1 bg-cosmic-dark p-4 rounded overflow-y-auto">
                {meetingTranscript ? (
                  <div className="space-y-4">
                    <div className="border-b border-cosmic-light pb-2">
                      <h4 className="text-white font-semibold">Question:</h4>
                      <p className="text-white mt-1">{meetingTranscript.question}</p>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-2">Responses:</h4>
                      <div className="space-y-3">
                        {meetingTranscript.responses.map((response) => (
                          <div key={response.id} className="bg-cosmic-light p-3 rounded">
                            <div className="font-semibold text-white">
                              {response.agentName} ({response.agentRole})
                            </div>
                            <div className="text-white text-sm mt-1">{response.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {meetingTranscript.chiefSummary && (
                      <div className="border-t border-cosmic-light pt-4">
                        <h4 className="text-white font-semibold mb-2">Chief Summary:</h4>
                        <div className="bg-cosmic-accent p-3 rounded text-white">
                          {summarizing ? 'Generating summary...' : meetingTranscript.chiefSummary}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={saveTranscript} variant="outline">
                        Save Transcript
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-white text-center opacity-50">
                    Select agents and enter a question to start a meeting
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AiLab;
