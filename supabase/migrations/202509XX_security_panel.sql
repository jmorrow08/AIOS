-- Security Panel Schema Migration
-- Creates tables for API key vault and audit logging
-- Migration: 202509XX_security_panel.sql

-- =====================
-- API Keys table for encrypted storage of service credentials
-- =====================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('openai', 'elevenlabs', 'heygen', 'stability', 'stripe', 'notion', 'drive', 'anthropic', 'google-gemini', 'claude', 'midjourney', 'other')),
  key_encrypted TEXT NOT NULL, -- AES encrypted API key
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can create/update API keys
CREATE POLICY "Admins can manage API keys"
  ON public.api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.company_id = api_keys.company_id
    )
  );

-- Policy: Services can read masked versions (this will be handled in the application layer)
CREATE POLICY "Users can view API keys for their company"
  ON public.api_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.company_id = api_keys.company_id
    )
  );

-- Create updated_at trigger for api_keys
CREATE OR REPLACE FUNCTION update_api_keys_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_company_id
  ON public.api_keys (company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_service
  ON public.api_keys (service);
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used
  ON public.api_keys (last_used DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at
  ON public.api_keys (created_at DESC);

-- =====================
-- Audit Logs table for security event tracking
-- =====================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create_api_key', 'delete_api_key', 'use_api_key', 'view_api_key', 'update_api_key', 'login', 'logout', 'failed_login', 'permission_denied', 'system_access')),
  target TEXT NOT NULL, -- e.g., "api_key:openai", "user:123", "system:settings"
  details JSONB DEFAULT '{}'::jsonb, -- Additional context (IP, user agent, etc.)
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Users can only insert their own audit logs
CREATE POLICY "Users can create audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND actor_id = auth.uid());

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
  ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target
  ON public.audit_logs (target);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
  ON public.audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_timestamp
  ON public.audit_logs (actor_id, timestamp DESC);

-- =====================
-- Security Settings table for additional configuration
-- =====================
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, setting_key)
);

-- Enable Row Level Security (RLS) for security_settings
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage security settings
CREATE POLICY "Admins can manage security settings"
  ON public.security_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.company_id = security_settings.company_id
    )
  );

-- Create updated_at trigger for security_settings
CREATE OR REPLACE FUNCTION update_security_settings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_security_settings_updated_at
  BEFORE UPDATE ON public.security_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_security_settings_updated_at_column();

-- Indexes for security_settings
CREATE INDEX IF NOT EXISTS idx_security_settings_company_id
  ON public.security_settings (company_id);
CREATE INDEX IF NOT EXISTS idx_security_settings_key
  ON public.security_settings (setting_key);

-- =====================
-- Seed Data for Testing
-- =====================

-- Insert a sample encrypted API key (this would normally be encrypted at runtime)
-- Note: In production, keys should never be stored as plaintext, even in migrations
-- This is just for testing purposes
INSERT INTO public.api_keys (id, company_id, service, key_encrypted) VALUES
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440000', 'openai', 'ENCRYPTED_SAMPLE_OPENAI_KEY_FOR_TESTING'),
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440000', 'stripe', 'ENCRYPTED_SAMPLE_STRIPE_KEY_FOR_TESTING');

-- Insert sample audit logs
INSERT INTO public.audit_logs (id, actor_id, action, target, details) VALUES
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'create_api_key', 'api_key:openai', '{"service": "openai", "masked_key": "sk-****1234"}'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440001', 'create_api_key', 'api_key:stripe', '{"service": "stripe", "masked_key": "sk_test_****5678"}'),
('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440001', 'use_api_key', 'api_key:openai', '{"endpoint": "chat/completions", "tokens": 150}');

-- Insert default security settings
INSERT INTO public.security_settings (company_id, setting_key, setting_value) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'two_factor_enforced', 'false'),
('550e8400-e29b-41d4-a716-446655440000', 'key_rotation_days', '90'),
('550e8400-e29b-41d4-a716-446655440000', 'audit_retention_days', '365'),
('550e8400-e29b-41d4-a716-446655440000', 'max_failed_login_attempts', '5');
