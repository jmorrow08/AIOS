-- ===========================================
-- AI OS Autopilot - Phase 0: Foundations
-- ===========================================
-- This migration adds the foundational database schema for the AI OS Autopilot
-- including scheduled posts, content performance tracking, and new settings keys

-- Create scheduled_posts table for autoposting functionality
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube')),
  content TEXT NOT NULL,
  media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'posted', 'failed', 'cancelled')),
  external_ids JSONB DEFAULT '{}', -- Store platform-specific post IDs
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Create content_performance table for tracking post performance
CREATE TABLE IF NOT EXISTS public.content_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL, -- References the external post ID from scheduled_posts.external_ids
  platform TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}', -- Store various metrics (likes, shares, views, etc.)
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_posts
CREATE POLICY "Users can view their company's scheduled posts"
  ON public.scheduled_posts
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company's scheduled posts"
  ON public.scheduled_posts
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    ) AND
    created_by = auth.uid()
  );

CREATE POLICY "Users can update their company's scheduled posts"
  ON public.scheduled_posts
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company's scheduled posts"
  ON public.scheduled_posts
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  );

-- RLS Policies for content_performance
CREATE POLICY "Users can view their company's content performance"
  ON public.content_performance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_posts sp
      WHERE sp.id::text = content_performance.post_id::text
      AND sp.company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their company's content performance"
  ON public.content_performance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scheduled_posts sp
      WHERE sp.id::text = content_performance.post_id::text
      AND sp.company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their company's content performance"
  ON public.content_performance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_posts sp
      WHERE sp.id::text = content_performance.post_id::text
      AND sp.company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_company_id ON public.scheduled_posts(company_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON public.scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON public.scheduled_posts(platform);

CREATE INDEX IF NOT EXISTS idx_content_performance_post_id ON public.content_performance(post_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_platform ON public.content_performance(platform);
CREATE INDEX IF NOT EXISTS idx_content_performance_captured_at ON public.content_performance(captured_at);

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_scheduled_posts_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON public.scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_posts_updated_at_column();

-- Add new settings keys for Runpod and n8n integration
INSERT INTO public.settings (key, value, description, category) VALUES
  ('runpod_enabled', 'false', 'Whether Runpod local LLM endpoint is enabled', 'ai'),
  ('runpod_base_url', NULL, 'Base URL for Runpod/Ollama endpoint (e.g., http://localhost:11434)', 'ai'),
  ('n8n_base_url', NULL, 'Base URL for self-hosted n8n instance', 'automation'),
  ('n8n_api_key', NULL, 'API key for n8n authentication', 'automation'),
  ('n8n_webhook_secret', NULL, 'Shared secret for n8n webhook validation', 'automation')
ON CONFLICT (key) DO NOTHING;

-- Create audit_logs table if it doesn't exist (for Phase 5 capabilities)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Create thinking_logs table for agent thinking process tracking
CREATE TABLE IF NOT EXISTS public.thinking_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL, -- Can be agent ID or 'oria' for main buddy
  agent_name TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'chat', 'image_generation', 'video_creation', etc.
  task_description TEXT NOT NULL,
  thinking_steps JSONB DEFAULT '[]', -- Array of thinking steps with timestamps
  final_output TEXT,
  duration_ms INTEGER,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL
);

ALTER TABLE public.thinking_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their thinking logs"
  ON public.thinking_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their thinking logs"
  ON public.thinking_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their thinking logs"
  ON public.thinking_logs
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_thinking_logs_user_id ON public.thinking_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_thinking_logs_agent_id ON public.thinking_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_thinking_logs_task_type ON public.thinking_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_thinking_logs_created_at ON public.thinking_logs(created_at);

-- Update trigger for thinking_logs
CREATE OR REPLACE FUNCTION update_thinking_logs_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_thinking_logs_updated_at
    BEFORE UPDATE ON public.thinking_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_thinking_logs_updated_at_column();


