-- =====================
-- Multi-Tenant Schema Updates Migration
-- Adds company_id to all entities and Stripe customer integration
-- =====================

-- Add company_id to ai_agents table
ALTER TABLE ai_agents
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add company_id to agent_logs table
ALTER TABLE agent_logs
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add company_id to meeting_logs table
ALTER TABLE meeting_logs
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add company_id to media_projects table
ALTER TABLE media_projects
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add company_id to media_assets table
ALTER TABLE media_assets
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add company_id to api_usage table
ALTER TABLE api_usage
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add Stripe customer ID to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create company_plans table for billing tiers
CREATE TABLE IF NOT EXISTS company_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('starter', 'professional', 'enterprise', 'custom')),
  monthly_limit_usd DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_company_id ON ai_agents(company_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_company_id ON agent_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_meeting_logs_company_id ON meeting_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_media_projects_company_id ON media_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_company_id ON media_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_company_id ON api_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_company_plans_company_id ON company_plans(company_id);

-- Enable RLS on company_plans
ALTER TABLE company_plans ENABLE ROW LEVEL SECURITY;

-- Update existing records to set company_id (for existing data)
-- Note: This will need to be handled carefully in production
-- For now, we'll set company_id for existing records based on context

-- For ai_agents: Set company_id to the first admin user's company (if exists)
UPDATE ai_agents
SET company_id = (
  SELECT c.id
  FROM companies c
  JOIN users u ON u.company_id = c.id
  WHERE u.role = 'admin'
  LIMIT 1
)
WHERE company_id IS NULL;

-- For media_projects: Set company_id based on created_by user
UPDATE media_projects
SET company_id = (
  SELECT u.company_id
  FROM users u
  WHERE u.id = media_projects.created_by
)
WHERE company_id IS NULL;

-- For media_assets: We'll need to add a created_by column first, or set to a default company
-- For now, set to the first company (in production, this would need proper data migration)
UPDATE media_assets
SET company_id = (SELECT id FROM companies LIMIT 1)
WHERE company_id IS NULL;

-- For api_usage: Set to the first company (in production, this would need proper data migration)
UPDATE api_usage
SET company_id = (SELECT id FROM companies LIMIT 1)
WHERE company_id IS NULL;

-- Insert default plan for existing companies
INSERT INTO company_plans (company_id, plan_tier, monthly_limit_usd, features)
SELECT
  c.id,
  'starter'::TEXT,
  100.00,
  '{
    "ai_requests": 1000,
    "storage_gb": 5,
    "support_level": "email",
    "features": ["basic_ai", "media_generation", "api_access"]
  }'::jsonb
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM company_plans cp WHERE cp.company_id = c.id
);
