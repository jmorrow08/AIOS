-- Compliance & Security Policies Migration
-- Creates security_policies table for comprehensive compliance management
-- Migration: 202509XX_compliance.sql

-- =====================
-- Security Policies table
-- =====================
CREATE TABLE IF NOT EXISTS public.security_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  enforce_2fa BOOLEAN DEFAULT false,
  ip_allowlist JSONB DEFAULT '[]'::jsonb, -- Array of CIDR/IPs
  key_rotation_days INTEGER DEFAULT 90,
  data_retention_days INTEGER DEFAULT 365,
  gdpr_request_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Enable Row Level Security (RLS) for security_policies
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage security policies
CREATE POLICY "Admins can manage security policies"
  ON public.security_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.company_id = security_policies.company_id
    )
  );

-- Policy: Users can view security policies for their company (read-only)
CREATE POLICY "Users can view security policies"
  ON public.security_policies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.company_id = security_policies.company_id
    )
  );

-- Create updated_at trigger for security_policies
CREATE OR REPLACE FUNCTION update_security_policies_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_security_policies_updated_at
  BEFORE UPDATE ON public.security_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_security_policies_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_policies_company_id
  ON public.security_policies (company_id);
CREATE INDEX IF NOT EXISTS idx_security_policies_enforce_2fa
  ON public.security_policies (enforce_2fa);
CREATE INDEX IF NOT EXISTS idx_security_policies_created_at
  ON public.security_policies (created_at DESC);

-- =====================
-- Compliance Requests table for GDPR/CCPA requests
-- =====================
CREATE TABLE IF NOT EXISTS public.compliance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export_data', 'delete_data', 'access_data')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  request_reason TEXT,
  completion_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- For data export links
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for compliance_requests
ALTER TABLE public.compliance_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create compliance requests for themselves
CREATE POLICY "Users can create compliance requests"
  ON public.compliance_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.company_id = compliance_requests.company_id
    )
  );

-- Policy: Users can view their own compliance requests
CREATE POLICY "Users can view their own compliance requests"
  ON public.compliance_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can manage all compliance requests for their company
CREATE POLICY "Admins can manage compliance requests"
  ON public.compliance_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.company_id = compliance_requests.company_id
    )
  );

-- Create updated_at trigger for compliance_requests
CREATE OR REPLACE FUNCTION update_compliance_requests_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_compliance_requests_updated_at
  BEFORE UPDATE ON public.compliance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_requests_updated_at_column();

-- Indexes for compliance_requests
CREATE INDEX IF NOT EXISTS idx_compliance_requests_company_id
  ON public.compliance_requests (company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_requests_user_id
  ON public.compliance_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_requests_status
  ON public.compliance_requests (status);
CREATE INDEX IF NOT EXISTS idx_compliance_requests_requested_at
  ON public.compliance_requests (requested_at DESC);

-- =====================
-- Data Retention Tracking table
-- =====================
CREATE TABLE IF NOT EXISTS public.data_retention_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  data_category TEXT NOT NULL, -- 'messages', 'deliverables', 'logs', 'files', etc.
  record_count INTEGER NOT NULL,
  oldest_record TIMESTAMP WITH TIME ZONE,
  newest_record TIMESTAMP WITH TIME ZONE,
  retention_days INTEGER NOT NULL,
  last_cleanup TIMESTAMP WITH TIME ZONE,
  next_cleanup TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for data_retention_logs
ALTER TABLE public.data_retention_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage data retention logs
CREATE POLICY "Admins can manage data retention logs"
  ON public.data_retention_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.company_id = data_retention_logs.company_id
    )
  );

-- Create updated_at trigger for data_retention_logs
CREATE OR REPLACE FUNCTION update_data_retention_logs_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_data_retention_logs_updated_at
  BEFORE UPDATE ON public.data_retention_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_data_retention_logs_updated_at_column();

-- Indexes for data_retention_logs
CREATE INDEX IF NOT EXISTS idx_data_retention_logs_company_id
  ON public.data_retention_logs (company_id);
CREATE INDEX IF NOT EXISTS idx_data_retention_logs_category
  ON public.data_retention_logs (data_category);
CREATE INDEX IF NOT EXISTS idx_data_retention_logs_next_cleanup
  ON public.data_retention_logs (next_cleanup);

-- =====================
-- Seed Data for Testing
-- =====================

-- Insert default security policies for the demo company
INSERT INTO public.security_policies (
  id,
  company_id,
  enforce_2fa,
  ip_allowlist,
  key_rotation_days,
  data_retention_days,
  gdpr_request_enabled
) VALUES (
  '550e8400-e29b-41d4-a716-446655440200',
  '550e8400-e29b-41d4-a716-446655440000',
  true, -- 2FA enforced
  '["127.0.0.1", "192.168.1.0/24"]'::jsonb, -- Test IP allowlist
  90, -- Key rotation days
  365, -- Data retention days
  true -- GDPR requests enabled
) ON CONFLICT (company_id) DO NOTHING;

-- Insert sample compliance requests
INSERT INTO public.compliance_requests (
  id,
  company_id,
  user_id,
  request_type,
  status,
  request_reason
) VALUES (
  '550e8400-e29b-41d4-a716-446655440201',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'export_data',
  'completed',
  'Annual data export request'
),
(
  '550e8400-e29b-41d4-a716-446655440202',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'access_data',
  'pending',
  'Review my stored data'
) ON CONFLICT DO NOTHING;

-- Insert sample data retention logs
INSERT INTO public.data_retention_logs (
  id,
  company_id,
  data_category,
  record_count,
  oldest_record,
  newest_record,
  retention_days,
  last_cleanup,
  next_cleanup
) VALUES (
  '550e8400-e29b-41d4-a716-446655440203',
  '550e8400-e29b-41d4-a716-446655440000',
  'messages',
  1250,
  NOW() - INTERVAL '300 days',
  NOW() - INTERVAL '5 days',
  365,
  NOW() - INTERVAL '30 days',
  NOW() + INTERVAL '30 days'
),
(
  '550e8400-e29b-41d4-a716-446655440204',
  '550e8400-e29b-41d4-a716-446655440000',
  'logs',
  5000,
  NOW() - INTERVAL '200 days',
  NOW() - INTERVAL '1 day',
  365,
  NOW() - INTERVAL '15 days',
  NOW() + INTERVAL '15 days'
) ON CONFLICT DO NOTHING;
