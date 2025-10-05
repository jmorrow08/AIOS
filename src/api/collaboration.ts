import { supabase } from '@/lib/supabaseClient';
import { routeTask } from '@/agents/orchestrator';

export type SenderType = 'user' | 'agent';

export interface Participant {
  id: string;
  type: SenderType;
  name: string;
  avatar?: string;
  role?: string;
  isOnline?: boolean;
}

export interface CollabSession {
  id: string;
  title: string;
  participants: Participant[];
  created_by: string;
  is_active: boolean;
  meeting_mode: boolean;
  whiteboard_data?: any;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface CollabMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_type: SenderType;
  sender_name: string;
  sender_avatar?: string;
  message: string;
  message_type: 'text' | 'system' | 'agent_response' | 'meeting_turn';
  attachments: Array<{
    url: string;
    filename: string;
    type: string;
    size?: number;
  }>;
  metadata?: any;
  is_read?: Record<string, string>; // user_id -> timestamp
  created_at: string;
  updated_at: string;
}

export interface CreateSessionData {
  title: string;
  participants: Participant[];
  meeting_mode?: boolean;
  settings?: any;
}

export interface CreateMessageData {
  session_id: string;
  sender_id: string;
  sender_type: SenderType;
  sender_name: string;
  sender_avatar?: string;
  message: string;
  message_type?: 'text' | 'system' | 'agent_response' | 'meeting_turn';
  attachments?: Array<{
    url: string;
    filename: string;
    type: string;
    size?: number;
  }>;
  metadata?: any;
}

export interface CollabResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Get all collaboration sessions for the current user
 */
export const getUserSessions = async (
  includeInactive: boolean = false,
): Promise<CollabResponse<CollabSession[]>> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { data: null, error: 'User not authenticated' };
    }

    let query = supabase
      .from('collab_sessions')
      .select('*')
      .or(
        `created_by.eq.${user.user.id},participants.cs.{${JSON.stringify({
          id: user.user.id,
          type: 'user',
        })}}`,
      )
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user sessions:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch sessions',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching user sessions:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching sessions',
    };
  }
};

/**
 * Create a new collaboration session
 */
export const createSession = async (
  sessionData: CreateSessionData,
): Promise<CollabResponse<CollabSession>> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Ensure current user is in participants
    const currentUserParticipant: Participant = {
      id: user.user.id,
      type: 'user',
      name: user.user.user_metadata?.full_name || user.user.email || 'Unknown User',
      avatar: user.user.user_metadata?.avatar_url,
      isOnline: true,
    };

    const participants = sessionData.participants.some(
      (p) => p.id === user.user.id && p.type === 'user',
    )
      ? sessionData.participants
      : [currentUserParticipant, ...sessionData.participants];

    const { data, error } = await supabase
      .from('collab_sessions')
      .insert([
        {
          title: sessionData.title,
          participants: participants,
          created_by: user.user.id,
          meeting_mode: sessionData.meeting_mode || false,
          settings: sessionData.settings || {},
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return {
        data: null,
        error: error.message || 'Failed to create session',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating session:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the session',
    };
  }
};

/**
 * Update a collaboration session
 */
export const updateSession = async (
  sessionId: string,
  updates: Partial<CreateSessionData>,
): Promise<CollabResponse<CollabSession>> => {
  try {
    const { data, error } = await supabase
      .from('collab_sessions')
      .update({
        title: updates.title,
        participants: updates.participants,
        meeting_mode: updates.meeting_mode,
        settings: updates.settings,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return {
        data: null,
        error: error.message || 'Failed to update session',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating session:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the session',
    };
  }
};

/**
 * Delete a collaboration session
 */
export const deleteSession = async (
  sessionId: string,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('collab_sessions').delete().eq('id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete session',
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting session:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the session',
    };
  }
};

/**
 * Get messages for a specific session
 */
export const getSessionMessages = async (
  sessionId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<CollabResponse<CollabMessage[]>> => {
  try {
    const { data, error } = await supabase
      .from('collab_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching session messages:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch messages',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching session messages:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching messages',
    };
  }
};

/**
 * Send a message to a session
 */
export const sendMessage = async (
  messageData: CreateMessageData,
): Promise<CollabResponse<CollabMessage>> => {
  try {
    const { data, error } = await supabase
      .from('collab_messages')
      .insert([
        {
          session_id: messageData.session_id,
          sender_id: messageData.sender_id,
          sender_type: messageData.sender_type,
          sender_name: messageData.sender_name,
          sender_avatar: messageData.sender_avatar,
          message: messageData.message,
          message_type: messageData.message_type || 'text',
          attachments: messageData.attachments || [],
          metadata: messageData.metadata || {},
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return {
        data: null,
        error: error.message || 'Failed to send message',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error sending message:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while sending the message',
    };
  }
};

/**
 * Send a message from an AI agent
 */
export const sendAgentMessage = async (
  sessionId: string,
  agentId: string,
  agentName: string,
  message: string,
  agentRole?: string,
  metadata?: any,
): Promise<CollabResponse<CollabMessage>> => {
  return sendMessage({
    session_id: sessionId,
    sender_id: agentId,
    sender_type: 'agent',
    sender_name: agentName,
    message,
    message_type: 'agent_response',
    metadata: {
      agent_role: agentRole,
      ...metadata,
    },
  });
};

/**
 * Process agent participation in a session
 */
export const processAgentParticipation = async (
  sessionId: string,
  agentRole: string,
  contextMessages: CollabMessage[],
  userPrompt?: string,
): Promise<CollabResponse<string>> => {
  try {
    // Build context from recent messages
    const context = contextMessages
      .slice(-10) // Last 10 messages for context
      .map((msg) => `${msg.sender_name} (${msg.sender_type}): ${msg.message}`)
      .join('\n');

    const task =
      userPrompt || `Participate in this collaboration session. Recent context:\n${context}`;

    // Route to appropriate agent
    const result = await routeTask(agentRole, task);

    if (!result.success) {
      return {
        data: null,
        error: result.error || 'Agent failed to respond',
      };
    }

    // Send agent response to session
    const agentResponse = await sendAgentMessage(
      sessionId,
      agentRole,
      `${agentRole.charAt(0).toUpperCase() + agentRole.slice(1)} Agent`,
      result.response,
      agentRole,
      {
        confidence: result.success ? 1 : 0,
        thinking_time: Date.now(), // Could be enhanced to track actual thinking time
      },
    );

    if (agentResponse.error) {
      return {
        data: null,
        error: agentResponse.error,
      };
    }

    return {
      data: result.response,
      error: null,
    };
  } catch (error) {
    console.error('Error processing agent participation:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Agent participation failed',
    };
  }
};

/**
 * Mark messages as read for a user
 */
export const markMessagesAsRead = async (
  messageIds: string[],
  userId: string,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Get current read status for each message
    const { data: messages } = await supabase
      .from('collab_messages')
      .select('id, is_read')
      .in('id', messageIds);

    if (!messages) {
      return {
        success: false,
        error: 'Messages not found',
      };
    }

    // Update read status for each message
    const updates = messages.map((message) => ({
      id: message.id,
      is_read: {
        ...message.is_read,
        [userId]: new Date().toISOString(),
      },
    }));

    const { error } = await supabase.from('collab_messages').upsert(updates);

    if (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark messages as read',
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error marking messages as read:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while marking messages as read',
    };
  }
};

/**
 * Upload attachment to Supabase Storage
 */
export const uploadAttachment = async (
  file: File,
  sessionId: string,
  userId: string,
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `collaboration/${sessionId}/${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documents') // Using documents bucket
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading attachment:', error);
      return {
        url: null,
        error: error.message || 'Failed to upload attachment',
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('documents').getPublicUrl(filePath);

    return {
      url: publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error uploading attachment:', error);
    return {
      url: null,
      error: 'An unexpected error occurred while uploading the attachment',
    };
  }
};

/**
 * Start meeting mode with turn-taking
 */
export const startMeetingMode = async (
  sessionId: string,
  participants: Participant[],
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const agentParticipants = participants.filter((p) => p.type === 'agent');
    if (agentParticipants.length === 0) {
      return { success: false, error: 'No AI agents in the meeting' };
    }

    // Set initial turn order
    const turnOrder = agentParticipants.map((p) => p.role!);

    const { error } = await supabase
      .from('collab_sessions')
      .update({
        meeting_mode: true,
        settings: {
          turnOrder,
          currentTurn: 0,
          meetingStarted: true,
          meetingStartTime: new Date().toISOString(),
        },
      })
      .eq('id', sessionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error starting meeting mode:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start meeting mode',
    };
  }
};

/**
 * Advance to next turn in meeting mode
 */
export const nextMeetingTurn = async (
  sessionId: string,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { data: session } = await supabase
      .from('collab_sessions')
      .select('settings')
      .eq('id', sessionId)
      .single();

    if (!session?.settings?.turnOrder) {
      return { success: false, error: 'Meeting mode not active' };
    }

    const currentTurn = session.settings.currentTurn || 0;
    const turnOrder = session.settings.turnOrder;
    const nextTurn = (currentTurn + 1) % turnOrder.length;

    const { error } = await supabase
      .from('collab_sessions')
      .update({
        settings: {
          ...session.settings,
          currentTurn: nextTurn,
        },
      })
      .eq('id', sessionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error advancing meeting turn:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to advance turn',
    };
  }
};

/**
 * End meeting mode and generate summary
 */
export const endMeetingMode = async (
  sessionId: string,
): Promise<{ success: boolean; summary: string | null; error: string | null }> => {
  try {
    // Get all messages for summary
    const { data: messages } = await supabase
      .from('collab_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!messages) {
      return { success: false, summary: null, error: 'No messages found' };
    }

    // Generate summary using Chief agent
    const context = messages
      .slice(-20) // Last 20 messages for context
      .map((msg) => `${msg.sender_name}: ${msg.message}`)
      .join('\n');

    const summaryPrompt = `Please provide a comprehensive summary of this collaboration session. Include key decisions, action items, and insights discussed:\n\n${context}`;

    const result = await routeTask('chief', summaryPrompt);

    // Update session to end meeting mode
    const { error } = await supabase
      .from('collab_sessions')
      .update({
        meeting_mode: false,
        settings: {
          meetingEnded: true,
          meetingEndTime: new Date().toISOString(),
          summary: result.response,
        },
      })
      .eq('id', sessionId);

    if (error) {
      return { success: false, summary: null, error: error.message };
    }

    return {
      success: true,
      summary: result.success ? result.response : null,
      error: null,
    };
  } catch (error) {
    console.error('Error ending meeting mode:', error);
    return {
      success: false,
      summary: null,
      error: error instanceof Error ? error.message : 'Failed to end meeting mode',
    };
  }
};

/**
 * Export session transcript
 */
export const exportSessionTranscript = async (
  sessionId: string,
  format: 'json' | 'text' | 'pdf' = 'json',
): Promise<{ data: any | null; error: string | null }> => {
  try {
    // Get session details
    const { data: session } = await supabase
      .from('collab_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return { data: null, error: 'Session not found' };
    }

    // Get all messages
    const { data: messages } = await supabase
      .from('collab_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const transcript = {
      session: session,
      messages: messages || [],
      exported_at: new Date().toISOString(),
    };

    if (format === 'text') {
      const textTranscript =
        messages
          ?.map(
            (msg) =>
              `[${new Date(msg.created_at).toLocaleString()}] ${msg.sender_name}: ${msg.message}`,
          )
          .join('\n') || '';

      return {
        data: textTranscript,
        error: null,
      };
    }

    if (format === 'pdf') {
      // For PDF, we'll return the data and let the frontend handle PDF generation
      // This could be enhanced with a server-side PDF generation service
      const pdfContent = {
        title: `Collaboration Session: ${session.title}`,
        date: new Date(session.created_at).toLocaleDateString(),
        participants: session.participants.map((p) => p.name).join(', '),
        messages:
          messages?.map((msg) => ({
            timestamp: new Date(msg.created_at).toLocaleString(),
            sender: msg.sender_name,
            type: msg.sender_type,
            message: msg.message,
          })) || [],
      };

      return {
        data: pdfContent,
        error: null,
      };
    }

    return {
      data: transcript,
      error: null,
    };
  } catch (error) {
    console.error('Error exporting transcript:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to export transcript',
    };
  }
};

/**
 * Save transcript to Knowledge Library
 */
export const saveTranscriptToKnowledgeLibrary = async (
  sessionId: string,
  title?: string,
): Promise<{ success: boolean; documentId: string | null; error: string | null }> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, documentId: null, error: 'User not authenticated' };
    }

    // Get session details
    const { data: session } = await supabase
      .from('collab_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return { success: false, documentId: null, error: 'Session not found' };
    }

    // Get all messages
    const { data: messages } = await supabase
      .from('collab_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Format transcript content
    const transcriptTitle = title || `Collaboration Transcript: ${session.title}`;
    const transcriptContent = `# ${transcriptTitle}

**Session Details:**
- **Date:** ${new Date(session.created_at).toLocaleDateString()}
- **Participants:** ${session.participants.map((p) => p.name).join(', ')}
- **Meeting Mode:** ${session.meeting_mode ? 'Yes' : 'No'}

## Transcript

${
  messages
    ?.map(
      (msg) =>
        `### ${new Date(msg.created_at).toLocaleString()} - ${msg.sender_name} (${msg.sender_type})
${msg.message}
`,
    )
    .join('\n') || 'No messages found.'
}

---
*Generated on ${new Date().toLocaleDateString()}*
`;

    // Save to documents table (assuming Knowledge Library uses the documents table)
    const { data: document, error } = await supabase
      .from('documents')
      .insert([
        {
          title: transcriptTitle,
          content: transcriptContent,
          category: 'Summaries',
          description: `Transcript of collaboration session: ${session.title}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving transcript to Knowledge Library:', error);
      return {
        success: false,
        documentId: null,
        error: error.message || 'Failed to save transcript to Knowledge Library',
      };
    }

    return {
      success: true,
      documentId: document.id,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error saving transcript to Knowledge Library:', error);
    return {
      success: false,
      documentId: null,
      error:
        error instanceof Error ? error.message : 'Failed to save transcript to Knowledge Library',
    };
  }
};
