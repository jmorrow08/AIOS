-- Collaboration Schema Migration
-- Creates tables for real-time collaboration between humans and AI agents

-- =====================
-- Collaboration Sessions table for real-time collaboration
-- =====================
CREATE TABLE IF NOT EXISTS public.collab_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {id: string, type: 'user'|'agent', name: string, avatar?: string}
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  meeting_mode BOOLEAN DEFAULT false, -- Enable turn-taking for agents
  whiteboard_data JSONB DEFAULT '{}'::jsonb, -- Store whiteboard state
  settings JSONB DEFAULT '{}'::jsonb, -- Session settings (auto-save, notifications, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for collab_sessions
ALTER TABLE public.collab_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view sessions they participate in
CREATE POLICY "Users can view sessions they participate in"
  ON public.collab_sessions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    (
      created_by = auth.uid() OR
      participants @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text, 'type', 'user'))
    )
  );

-- Policy: Allow authenticated users to create sessions
CREATE POLICY "Users can create sessions"
  ON public.collab_sessions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Allow session participants to update their sessions
CREATE POLICY "Session participants can update sessions"
  ON public.collab_sessions
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (
      created_by = auth.uid() OR
      participants @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text, 'type', 'user'))
    )
  );

-- Policy: Allow session creators to delete sessions
CREATE POLICY "Session creators can delete sessions"
  ON public.collab_sessions
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_collab_sessions_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collab_sessions_updated_at
  BEFORE UPDATE ON public.collab_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_collab_sessions_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collab_sessions_created_by
  ON public.collab_sessions (created_by);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_is_active
  ON public.collab_sessions (is_active);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_created_at
  ON public.collab_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_participants_gin
  ON public.collab_sessions USING GIN (participants);

-- =====================
-- Collaboration Messages table for real-time messaging
-- =====================
CREATE TABLE IF NOT EXISTS public.collab_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.collab_sessions(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL, -- Can be user UUID or agent ID
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent')),
  sender_name TEXT NOT NULL,
  sender_avatar TEXT, -- Avatar URL or icon
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'agent_response', 'meeting_turn')),
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of {url: string, filename: string, type: string, size?: number}
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data (agent thinking time, confidence score, etc.)
  is_read JSONB DEFAULT '{}'::jsonb, -- Track read status by participant: {user_id: timestamp}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for collab_messages
ALTER TABLE public.collab_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view messages from sessions they participate in
CREATE POLICY "Users can view messages from their sessions"
  ON public.collab_messages
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.collab_sessions cs
      WHERE cs.id = collab_messages.session_id
      AND (
        cs.created_by = auth.uid() OR
        cs.participants @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text, 'type', 'user'))
      )
    )
  );

-- Policy: Allow authenticated users to insert messages in their sessions
CREATE POLICY "Users can send messages to their sessions"
  ON public.collab_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.collab_sessions cs
      WHERE cs.id = collab_messages.session_id
      AND (
        cs.created_by = auth.uid() OR
        cs.participants @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text, 'type', 'user'))
      )
    )
  );

-- Policy: Allow message senders to update their own messages
CREATE POLICY "Users can update their own messages"
  ON public.collab_messages
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    sender_id = auth.uid()::text AND
    sender_type = 'user'
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_collab_messages_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collab_messages_updated_at
  BEFORE UPDATE ON public.collab_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_collab_messages_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collab_messages_session_id
  ON public.collab_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_collab_messages_sender_id
  ON public.collab_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_collab_messages_sender_type
  ON public.collab_messages (sender_type);
CREATE INDEX IF NOT EXISTS idx_collab_messages_created_at
  ON public.collab_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collab_messages_session_created
  ON public.collab_messages (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collab_messages_attachments_gin
  ON public.collab_messages USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_collab_messages_metadata_gin
  ON public.collab_messages USING GIN (metadata);
