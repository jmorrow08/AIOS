-- =====================
-- Client Profiles table for Onboarding System
-- Migration: 20250122_client_profiles_onboarding.sql
-- =====================
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Basic Information
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,

  -- Business Information
  business_type TEXT,
  company_size TEXT, -- '1-10', '11-50', '51-200', '201-1000', '1000+'
  industry TEXT,
  years_in_business INTEGER,

  -- Goals & Challenges
  primary_goals JSONB, -- Array of goals
  pain_points JSONB, -- Array of pain points
  current_tools JSONB, -- Array of current tools/software

  -- Budget & Timeline
  budget_range TEXT, -- '$0-5K', '$5K-15K', '$15K-50K', '$50K-100K', '$100K+'
  timeline TEXT, -- 'ASAP', '1-3 months', '3-6 months', '6-12 months', 'Exploring options'

  -- AI System Plan
  system_plan_id UUID, -- Reference to generated SOP document
  system_plan JSONB, -- Store the generated plan details

  -- Onboarding Status
  onboarding_status TEXT DEFAULT 'in_progress' CHECK (onboarding_status IN ('in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID -- Admin who created the profile
);

-- Enable Row Level Security (RLS) for client_profiles
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Admins have full access to client profiles
CREATE POLICY "Admins have full access to client_profiles"
  ON public.client_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Clients can view their own profiles
CREATE POLICY "Clients can view their own profiles"
  ON public.client_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_profiles.client_id
      AND clients.id IN (
        SELECT users.company_id FROM users
        WHERE users.id = auth.uid()
      )
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_client_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_client_profiles_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_client_id
  ON public.client_profiles (client_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_company_id
  ON public.client_profiles (company_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_business_type
  ON public.client_profiles (business_type);
CREATE INDEX IF NOT EXISTS idx_client_profiles_industry
  ON public.client_profiles (industry);
CREATE INDEX IF NOT EXISTS idx_client_profiles_onboarding_status
  ON public.client_profiles (onboarding_status);
CREATE INDEX IF NOT EXISTS idx_client_profiles_created_at
  ON public.client_profiles (created_at DESC);
