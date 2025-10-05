-- =====================
-- Company-Specific Budget System Migration
-- Updates budget tracking to be per-company instead of global
-- =====================

-- Add company_id to company_config if it doesn't exist
ALTER TABLE company_config
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Create index on company_config for company_id
CREATE INDEX IF NOT EXISTS idx_company_config_company_id
  ON company_config (company_id);

-- Migrate existing global config to company-specific
-- For each existing company, create company-specific budget settings
INSERT INTO company_config (company_id, key, value, description, category, is_enabled)
SELECT
  c.id as company_id,
  'monthly_budget_usd' as key,
  jsonb_build_object('value', '100.00') as value,
  'Monthly API budget limit in USD' as description,
  'billing' as category,
  true as is_enabled
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM company_config cc
  WHERE cc.company_id = c.id AND cc.key = 'monthly_budget_usd'
);

INSERT INTO company_config (company_id, key, value, description, category, is_enabled)
SELECT
  c.id as company_id,
  'current_spend_usd' as key,
  jsonb_build_object('value', '0.00') as value,
  'Current month API spend in USD' as description,
  'billing' as category,
  true as is_enabled
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM company_config cc
  WHERE cc.company_id = c.id AND cc.key = 'current_spend_usd'
);

INSERT INTO company_config (company_id, key, value, description, category, is_enabled)
SELECT
  c.id as company_id,
  'alerts_enabled' as key,
  jsonb_build_object('value', 'true') as value,
  'Enable budget alerts and notifications' as description,
  'billing' as category,
  true as is_enabled
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM company_config cc
  WHERE cc.company_id = c.id AND cc.key = 'alerts_enabled'
);

INSERT INTO company_config (company_id, key, value, description, category, is_enabled)
SELECT
  c.id as company_id,
  'alert_thresholds' as key,
  jsonb_build_object('warning', 80, 'critical', 95) as value,
  'Budget alert thresholds as percentages' as description,
  'billing' as category,
  true as is_enabled
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM company_config cc
  WHERE cc.company_id = c.id AND cc.key = 'alert_thresholds'
);

-- Update the budget checking function to be company-specific
CREATE OR REPLACE FUNCTION check_budget_before_usage(
  p_company_id UUID,
  p_agent_id UUID DEFAULT NULL,
  p_estimated_cost DECIMAL(10,4) DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  budget_limit DECIMAL(10,4) := 0;
  current_spend DECIMAL(10,4) := 0;
  projected_spend DECIMAL(10,4) := 0;
  alerts_enabled BOOLEAN := true;
  warning_threshold INTEGER := 80;
  critical_threshold INTEGER := 95;
  result JSONB;
BEGIN
  -- Get budget configuration for the specific company
  SELECT (value->>'value')::DECIMAL(10,4) INTO budget_limit
  FROM company_config WHERE key = 'monthly_budget_usd'
  AND company_id = p_company_id AND is_enabled = true;

  SELECT (value->>'value')::DECIMAL(10,4) INTO current_spend
  FROM company_config WHERE key = 'current_spend_usd'
  AND company_id = p_company_id AND is_enabled = true;

  SELECT (value->>'value')::BOOLEAN INTO alerts_enabled
  FROM company_config WHERE key = 'alerts_enabled'
  AND company_id = p_company_id AND is_enabled = true;

  SELECT (value->>'warning')::INTEGER INTO warning_threshold
  FROM company_config WHERE key = 'alert_thresholds'
  AND company_id = p_company_id AND is_enabled = true;

  SELECT (value->>'critical')::INTEGER INTO critical_threshold
  FROM company_config WHERE key = 'alert_thresholds'
  AND company_id = p_company_id AND is_enabled = true;

  -- Set defaults if not configured
  budget_limit := COALESCE(budget_limit, 100.00);
  current_spend := COALESCE(current_spend, 0.00);
  alerts_enabled := COALESCE(alerts_enabled, true);
  warning_threshold := COALESCE(warning_threshold, 80);
  critical_threshold := COALESCE(critical_threshold, 95);

  projected_spend := current_spend + p_estimated_cost;

  -- Build result
  result := jsonb_build_object(
    'can_proceed', projected_spend <= budget_limit,
    'budget_limit', budget_limit,
    'current_spend', current_spend,
    'projected_spend', projected_spend,
    'percentage_used', ROUND((current_spend / budget_limit) * 100, 2),
    'alert_level', CASE
      WHEN projected_spend > budget_limit THEN 'critical'
      WHEN (projected_spend / budget_limit) * 100 >= critical_threshold THEN 'critical'
      WHEN (projected_spend / budget_limit) * 100 >= warning_threshold THEN 'warning'
      ELSE 'normal'
    END,
    'alerts_enabled', alerts_enabled
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the API usage logging function to be company-specific
CREATE OR REPLACE FUNCTION log_api_usage_and_update_budget(
  p_company_id UUID,
  p_service TEXT,
  p_agent_id UUID DEFAULT NULL,
  p_agent_name TEXT DEFAULT NULL,
  p_description TEXT,
  p_cost DECIMAL(10,4),
  p_tokens_used INTEGER DEFAULT 0,
  p_images_generated INTEGER DEFAULT 0,
  p_requests_count INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  usage_id UUID;
  current_spend DECIMAL(10,4) := 0;
BEGIN
  -- Insert usage record with company_id
  INSERT INTO api_usage (
    company_id,
    service,
    agent_id,
    agent,
    description,
    cost,
    tokens_used,
    images_generated,
    requests_count,
    metadata,
    date
  ) VALUES (
    p_company_id,
    p_service,
    p_agent_id,
    p_agent_name,
    p_description,
    p_cost,
    p_tokens_used,
    p_images_generated,
    p_requests_count,
    p_metadata,
    CURRENT_DATE
  ) RETURNING id INTO usage_id;

  -- Update current spend for the specific company
  SELECT (value->>'value')::DECIMAL(10,4) INTO current_spend
  FROM company_config WHERE key = 'current_spend_usd'
  AND company_id = p_company_id AND is_enabled = true;

  UPDATE company_config
  SET value = jsonb_build_object('value', (COALESCE(current_spend, 0) + p_cost)::TEXT),
      updated_at = NOW()
  WHERE key = 'current_spend_usd' AND company_id = p_company_id AND is_enabled = true;

  RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the monthly budget reset function to be company-specific
CREATE OR REPLACE FUNCTION reset_monthly_budget_for_company(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE company_config
  SET value = jsonb_build_object('value', '0.00'),
      updated_at = NOW()
  WHERE key = 'current_spend_usd' AND company_id = p_company_id AND is_enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to reset all companies' monthly budgets (for cron job)
CREATE OR REPLACE FUNCTION reset_all_monthly_budgets()
RETURNS VOID AS $$
BEGIN
  UPDATE company_config
  SET value = jsonb_build_object('value', '0.00'),
      updated_at = NOW()
  WHERE key = 'current_spend_usd' AND is_enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
