import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { MainNavigation } from '@/components/MainNavigation';
import { CosmicBackground } from '@/components/CosmicBackground';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  CollabSession,
  CollabMessage,
  Participant,
  getUserSessions,
  createSession,
  getSessionMessages,
  sendMessage,
  processAgentParticipation,
  exportSessionTranscript,
  saveTranscriptToKnowledgeLibrary,
  startMeetingMode,
  nextMeetingTurn,
  endMeetingMode,
} from '@/api/collaboration';
import { supabase } from '@/lib/supabaseClient';
import {
  MessageCircle,
  Users,
  Plus,
  Send,
  Paperclip,
  Download,
  Settings,
  Bot,
  User,
  Crown,
  Circle,
  CheckCircle,
  Zap,
  PenTool,
  Square,
  Type,
  Image,
  FileText,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Collaboration: React.FC = () => {
  const { user } = useUser();
  const [sessions, setSessions] = useState<CollabSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CollabSession | null>(null);
  const [messages, setMessages] = useState<CollabMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'lobby' | 'chat'>('lobby');

  // Create session form state
  const [sessionTitle, setSessionTitle] = useState('');
  const [meetingMode, setMeetingMode] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user sessions
  useEffect(() => {
    loadUserSessions();
  }, []);

  // Set up real-time subscriptions for current session
  useEffect(() => {
    if (!currentSession) return;

    const messagesChannel = supabase
      .channel(`collab_messages_${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collab_messages',
          filter: `session_id=eq.${currentSession.id}`,
        },
        (payload) => {
          const newMessage = payload.new as CollabMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'collab_messages',
          filter: `session_id=eq.${currentSession.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as CollabMessage;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)),
          );
        },
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
      });

    const sessionsChannel = supabase
      .channel(`collab_sessions_${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'collab_sessions',
          filter: `id=eq.${currentSession.id}`,
        },
        (payload) => {
          const updatedSession = payload.new as CollabSession;
          setCurrentSession(updatedSession);
        },
      )
      .subscribe((status) => {
        console.log('Sessions subscription status:', status);
      });

    // Send user presence update
    const updatePresence = async () => {
      if (user) {
        await supabase
          .from('collab_sessions')
          .update({
            participants: currentSession.participants.map((p) =>
              p.id === user.id && p.type === 'user'
                ? { ...p, isOnline: true, lastSeen: new Date().toISOString() }
                : p,
            ),
          })
          .eq('id', currentSession.id);
      }
    };

    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000); // Update every 30 seconds

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(sessionsChannel);
      clearInterval(presenceInterval);
    };
  }, [currentSession, user]);

  const loadUserSessions = async () => {
    setLoading(true);
    const response = await getUserSessions();
    if (response.data) {
      setSessions(response.data);
    }
    setLoading(false);
  };

  const handleCreateSession = async () => {
    if (!sessionTitle.trim()) return;

    // Create participants list with selected agents
    const participants: Participant[] = selectedAgents.map((agentId) => ({
      id: agentId,
      type: 'agent',
      name: `${agentId.charAt(0).toUpperCase() + agentId.slice(1)} Agent`,
      role: agentId,
      isOnline: true,
    }));

    const response = await createSession({
      title: sessionTitle,
      participants,
      meeting_mode: meetingMode,
    });

    if (response.data) {
      setSessions((prev) => [response.data!, ...prev]);
      setShowCreateDialog(false);
      setSessionTitle('');
      setSelectedAgents([]);
      setMeetingMode(false);
    }
  };

  const handleJoinSession = async (session: CollabSession) => {
    setCurrentSession(session);
    setActiveTab('chat');

    // Load messages for this session
    const response = await getSessionMessages(session.id);
    if (response.data) {
      setMessages(response.data);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentSession || !user) return;

    setSending(true);

    const response = await sendMessage({
      session_id: currentSession.id,
      sender_id: user.id,
      sender_type: 'user',
      sender_name: user.user_metadata?.full_name || user.email || 'Unknown User',
      sender_avatar: user.user_metadata?.avatar_url,
      message: newMessage,
    });

    if (response.data) {
      // Message will be added via real-time subscription
      setNewMessage('');

      // Trigger auto agent response if applicable
      if (currentSession.participants.some((p) => p.type === 'agent')) {
        handleAutoAgentResponse(newMessage);
      }
    }

    setSending(false);
  };

  const handleAgentParticipation = async (agentRole: string, customPrompt?: string) => {
    if (!currentSession) return;

    const contextMessages = messages.slice(-10); // Last 10 messages for context
    await processAgentParticipation(currentSession.id, agentRole, contextMessages, customPrompt);
  };

  const handleAutoAgentResponse = async (userMessage: string) => {
    if (!currentSession || !currentSession.participants.some((p) => p.type === 'agent')) return;

    // Simple logic to determine which agent to trigger based on message content
    const messageLower = userMessage.toLowerCase();
    let suggestedAgent = '';

    if (
      messageLower.includes('sales') ||
      messageLower.includes('revenue') ||
      messageLower.includes('business')
    ) {
      suggestedAgent = 'sales';
    } else if (
      messageLower.includes('marketing') ||
      messageLower.includes('campaign') ||
      messageLower.includes('brand')
    ) {
      suggestedAgent = 'marketing';
    } else if (
      messageLower.includes('technical') ||
      messageLower.includes('code') ||
      messageLower.includes('system')
    ) {
      suggestedAgent = 'technical';
    } else if (
      messageLower.includes('support') ||
      messageLower.includes('help') ||
      messageLower.includes('issue')
    ) {
      suggestedAgent = 'support';
    }

    if (suggestedAgent && currentSession.participants.some((p) => p.role === suggestedAgent)) {
      // Auto-trigger agent response after a short delay
      setTimeout(() => {
        handleAgentParticipation(suggestedAgent, `Respond to this user message: "${userMessage}"`);
      }, 1000);
    }
  };

  const handleStartMeetingMode = async () => {
    if (!currentSession) return;

    const result = await startMeetingMode(currentSession.id, currentSession.participants);
    if (result.success) {
      // Session will be updated via real-time subscription
      console.log('Meeting mode started');
    }
  };

  const handleNextTurn = async () => {
    if (!currentSession) return;

    const result = await nextMeetingTurn(currentSession.id);
    if (result.success) {
      // Trigger next agent's response
      const settings = currentSession.settings || {};
      const turnOrder = settings.turnOrder || [];
      const currentTurn = settings.currentTurn || 0;

      if (turnOrder.length > 0) {
        const nextAgent = turnOrder[currentTurn];
        const contextMessages = messages.slice(-10);
        await processAgentParticipation(
          currentSession.id,
          nextAgent,
          contextMessages,
          `It's your turn in the meeting. Please provide your input on the current discussion.`,
        );
      }
    }
  };

  const handleEndMeetingMode = async () => {
    if (!currentSession) return;

    const result = await endMeetingMode(currentSession.id);
    if (result.success && result.summary) {
      // Add summary message to chat
      await sendMessage({
        session_id: currentSession.id,
        sender_id: 'chief',
        sender_type: 'agent',
        sender_name: 'Chief Agent',
        message: `## Meeting Summary\n\n${result.summary}`,
        message_type: 'system',
      });
    }
  };

  const handleExportTranscript = async (format: 'text' | 'pdf' | 'json' = 'text') => {
    if (!currentSession) return;

    const response = await exportSessionTranscript(currentSession.id, format);
    if (response.data) {
      let blob: Blob;
      let filename: string;
      let mimeType: string;

      if (format === 'text') {
        blob = new Blob([response.data], { type: 'text/plain' });
        filename = `collab-transcript-${currentSession.title}-${
          new Date().toISOString().split('T')[0]
        }.txt`;
        mimeType = 'text/plain';
      } else if (format === 'pdf') {
        // For now, export as JSON since we don't have PDF generation
        // This could be enhanced with a PDF library like jsPDF
        const jsonData = JSON.stringify(response.data, null, 2);
        blob = new Blob([jsonData], { type: 'application/json' });
        filename = `collab-transcript-${currentSession.title}-${
          new Date().toISOString().split('T')[0]
        }.json`;
        mimeType = 'application/json';
      } else {
        // JSON format
        const jsonData = JSON.stringify(response.data, null, 2);
        blob = new Blob([jsonData], { type: 'application/json' });
        filename = `collab-transcript-${currentSession.title}-${
          new Date().toISOString().split('T')[0]
        }.json`;
        mimeType = 'application/json';
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSaveToKnowledgeLibrary = async () => {
    if (!currentSession) return;

    const result = await saveTranscriptToKnowledgeLibrary(currentSession.id);
    if (result.success) {
      alert('Transcript saved to Knowledge Library successfully!');
    } else {
      alert(`Failed to save transcript: ${result.error}`);
    }
  };

  const getCurrentTurnAgent = () => {
    if (!currentSession?.meeting_mode || !currentSession.settings?.turnOrder) return null;

    const turnOrder = currentSession.settings.turnOrder;
    const currentTurn = currentSession.settings.currentTurn || 0;
    const currentAgentRole = turnOrder[currentTurn];

    return currentSession.participants.find((p) => p.role === currentAgentRole);
  };

  const getParticipantIcon = (participant: Participant) => {
    if (participant.type === 'agent') {
      return <Bot className="w-4 h-4" />;
    }
    return <User className="w-4 h-4" />;
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'agent_response':
        return <Bot className="w-4 h-4 text-blue-400" />;
      case 'system':
        return <Settings className="w-4 h-4 text-gray-400" />;
      case 'meeting_turn':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      default:
        return <User className="w-4 h-4 text-green-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <CosmicBackground />
        <div className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center text-white">Loading collaboration sessions...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      <MainNavigation />
      <CosmicBackground />
      <div className="flex-1 relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-purple-400" />
              Collaboration Hub
            </h1>
            <p className="text-gray-300">Real-time collaboration with AI agents and team members</p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'lobby' | 'chat')}
          >
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="lobby" className="data-[state=active]:bg-purple-600">
                Session Lobby
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-purple-600"
                disabled={!currentSession}
              >
                {currentSession ? `Chat: ${currentSession.title}` : 'Chat'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lobby" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Session List */}
                <div className="lg:col-span-2">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Active Sessions
                          </CardTitle>
                          <CardDescription>Join existing collaboration sessions</CardDescription>
                        </div>
                        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                          <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                              <Plus className="w-4 h-4 mr-2" />
                              New Session
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-800 border-slate-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">Create New Session</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="title" className="text-white">
                                  Session Title
                                </Label>
                                <Input
                                  id="title"
                                  value={sessionTitle}
                                  onChange={(e) => setSessionTitle(e.target.value)}
                                  placeholder="Enter session title..."
                                  className="bg-slate-700 border-slate-600 text-white"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="meeting-mode"
                                  checked={meetingMode}
                                  onCheckedChange={setMeetingMode}
                                />
                                <Label htmlFor="meeting-mode" className="text-white">
                                  Meeting Mode (Turn-taking)
                                </Label>
                              </div>
                              <div>
                                <Label className="text-white">AI Agents</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {['sales', 'marketing', 'technical', 'support'].map((agent) => (
                                    <Button
                                      key={agent}
                                      variant={
                                        selectedAgents.includes(agent) ? 'default' : 'outline'
                                      }
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAgents((prev) =>
                                          prev.includes(agent)
                                            ? prev.filter((a) => a !== agent)
                                            : [...prev, agent],
                                        );
                                      }}
                                      className={
                                        selectedAgents.includes(agent)
                                          ? 'bg-purple-600'
                                          : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                                      }
                                    >
                                      <Bot className="w-3 h-3 mr-1" />
                                      {agent.charAt(0).toUpperCase() + agent.slice(1)}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <Button
                                onClick={handleCreateSession}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                disabled={!sessionTitle.trim()}
                              >
                                Create Session
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {sessions.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No active sessions</p>
                          <p className="text-sm">Create your first collaboration session</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sessions.map((session) => (
                            <Card
                              key={session.id}
                              className="bg-slate-700/50 border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                              onClick={() => handleJoinSession(session)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h3 className="text-white font-semibold">{session.title}</h3>
                                    <p className="text-sm text-gray-400">
                                      Created {new Date(session.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    {session.meeting_mode && (
                                      <Badge variant="secondary" className="bg-yellow-600">
                                        <Crown className="w-3 h-3 mr-1" />
                                        Meeting
                                      </Badge>
                                    )}
                                    <Badge
                                      variant="outline"
                                      className="border-slate-500 text-slate-300"
                                    >
                                      {session.participants.length} participants
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {session.participants.slice(0, 5).map((participant, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-1 text-xs text-gray-400"
                                    >
                                      {getParticipantIcon(participant)}
                                      {participant.name}
                                    </div>
                                  ))}
                                  {session.participants.length > 5 && (
                                    <span className="text-xs text-gray-500">
                                      +{session.participants.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        onClick={() => setShowCreateDialog(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Session
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Import Transcript
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              {currentSession && (
                <div>
                  {/* Whiteboard Tab Navigation */}
                  <Tabs defaultValue="chat" className="w-full mb-4">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-700">
                      <TabsTrigger value="chat" className="data-[state=active]:bg-purple-600">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </TabsTrigger>
                      <TabsTrigger value="whiteboard" className="data-[state=active]:bg-purple-600">
                        <PenTool className="w-4 h-4 mr-2" />
                        Whiteboard
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="mt-4">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Participants Sidebar */}
                        <div>
                          <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                              <CardTitle className="text-white text-sm">Participants</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {currentSession.participants.map((participant, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  {getParticipantIcon(participant)}
                                  <span className="text-gray-300">{participant.name}</span>
                                  <Circle className="w-2 h-2 fill-green-400 text-green-400 ml-auto" />
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          {/* Agent Controls */}
                          <Card className="bg-slate-800/50 border-slate-700 mt-4">
                            <CardHeader>
                              <CardTitle className="text-white text-sm">AI Agents</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {currentSession.participants
                                .filter((p) => p.type === 'agent')
                                .map((agent, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                                    onClick={() => handleAgentParticipation(agent.role!)}
                                  >
                                    <Bot className="w-3 h-3 mr-2" />
                                    Ask {agent.name}
                                  </Button>
                                ))}
                            </CardContent>
                          </Card>
                        </div>

                        {/* Chat Area */}
                        <div className="lg:col-span-3">
                          <Card className="bg-slate-800/50 border-slate-700 h-[600px] flex flex-col">
                            <CardHeader className="flex-shrink-0">
                              <div className="flex justify-between items-center">
                                <div>
                                  <CardTitle className="text-white">
                                    {currentSession.title}
                                  </CardTitle>
                                  <CardDescription>
                                    {currentSession.participants.length} participants
                                    {currentSession.meeting_mode && ' • Meeting Mode'}
                                  </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                  {currentSession.meeting_mode ? (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNextTurn}
                                        className="bg-yellow-600 border-yellow-500 text-white hover:bg-yellow-700"
                                      >
                                        Next Turn
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleEndMeetingMode}
                                        className="bg-red-600 border-red-500 text-white hover:bg-red-700"
                                      >
                                        End Meeting
                                      </Button>
                                    </>
                                  ) : (
                                    currentSession.participants.some((p) => p.type === 'agent') && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleStartMeetingMode}
                                        className="bg-green-600 border-green-500 text-white hover:bg-green-700"
                                      >
                                        Start Meeting
                                      </Button>
                                    )
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                                      >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export
                                        <ChevronDown className="w-3 h-3 ml-1" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                                      <DropdownMenuItem
                                        onClick={() => handleExportTranscript('text')}
                                        className="text-white hover:bg-slate-700 cursor-pointer"
                                      >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Export as Text
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleExportTranscript('json')}
                                        className="text-white hover:bg-slate-700 cursor-pointer"
                                      >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Export as JSON
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleExportTranscript('pdf')}
                                        className="text-white hover:bg-slate-700 cursor-pointer"
                                      >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Export as PDF
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleSaveToKnowledgeLibrary()}
                                        className="text-white hover:bg-slate-700 cursor-pointer"
                                      >
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Save to Knowledge Library
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              {currentSession.meeting_mode && (
                                <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Crown className="w-4 h-4 text-yellow-400" />
                                      <span className="text-sm text-white">Current Turn:</span>
                                      {(() => {
                                        const currentAgent = getCurrentTurnAgent();
                                        return currentAgent ? (
                                          <div className="flex items-center gap-2">
                                            <Bot className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm text-blue-400 font-medium">
                                              {currentAgent.name}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-sm text-gray-400">Waiting...</span>
                                        );
                                      })()}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Turn {(currentSession.settings?.currentTurn || 0) + 1} of{' '}
                                      {currentSession.settings?.turnOrder?.length || 0}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardHeader>

                            {/* Messages */}
                            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
                              {messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex gap-3 ${
                                    message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  {message.sender_type !== 'user' && (
                                    <div className="flex-shrink-0">
                                      {getMessageTypeIcon(message.message_type)}
                                    </div>
                                  )}
                                  <div
                                    className={`max-w-[70%] rounded-lg p-3 ${
                                      message.sender_type === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : message.sender_type === 'agent'
                                        ? 'bg-slate-700 text-gray-100'
                                        : 'bg-slate-600 text-gray-200'
                                    }`}
                                  >
                                    <div className="text-xs opacity-75 mb-1">
                                      {message.sender_name}
                                      {message.message_type === 'agent_response' && (
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          AI
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm">{message.message}</div>
                                    <div className="text-xs opacity-50 mt-1">
                                      {new Date(message.created_at).toLocaleTimeString()}
                                    </div>
                                  </div>
                                  {message.sender_type === 'user' && (
                                    <div className="flex-shrink-0">
                                      <User className="w-4 h-4 text-purple-400" />
                                    </div>
                                  )}
                                </div>
                              ))}
                              <div ref={messagesEndRef} />
                            </CardContent>

                            {/* Message Input */}
                            <div className="flex-shrink-0 p-4 border-t border-slate-700">
                              <div className="flex gap-2">
                                <Textarea
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  placeholder="Type your message..."
                                  className="flex-1 bg-slate-700 border-slate-600 text-white resize-none"
                                  rows={2}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendMessage();
                                    }
                                  }}
                                />
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    <Paperclip className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || sending}
                                    className="bg-purple-600 hover:bg-purple-700"
                                    size="icon"
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                              />
                            </div>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="whiteboard" className="mt-4">
                      <Card className="bg-slate-800/50 border-slate-700 h-[600px]">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <PenTool className="w-5 h-5" />
                            Collaborative Whiteboard
                          </CardTitle>
                          <CardDescription>
                            Visual collaboration space (Coming Soon)
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-full flex items-center justify-center">
                          <div className="text-center space-y-4">
                            <div className="w-24 h-24 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center">
                              <PenTool className="w-12 h-12 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-2">
                                Whiteboard Coming Soon
                              </h3>
                              <p className="text-gray-400 mb-4">
                                This collaborative whiteboard will allow you to:
                              </p>
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                  <Square className="w-4 h-4" />
                                  Draw shapes and diagrams
                                </div>
                                <div className="flex items-center gap-2">
                                  <Type className="w-4 h-4" />
                                  Add text and notes
                                </div>
                                <div className="flex items-center gap-2">
                                  <Image className="w-4 h-4" />
                                  Insert images and media
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Real-time collaboration
                                </div>
                              </div>
                            </div>
                            <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
                              Request Feature
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Collaboration;
