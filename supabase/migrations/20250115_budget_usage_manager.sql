-- =====================
-- Budget & API Usage Manager Migration
-- Adds agent_id relationship to api_usage and budget fields to company_config
-- =====================

-- Add agent_id column to api_usage table if it doesn't exist
ALTER TABLE public.api_usage
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES ai_agents(id);

-- Add index on agent_id for better performance
CREATE INDEX IF NOT EXISTS idx_api_usage_agent_id
  ON public.api_usage (agent_id);

-- Add budget configuration entries to company_config
INSERT INTO public.company_config (key, value, description, category, is_enabled) VALUES
  (
    'monthly_budget_usd',
    '100.00'::jsonb,
    'Monthly API budget limit in USD',
    'billing',
    true
  ),
  (
    'current_spend_usd',
    '0.00'::jsonb,
    'Current month API spend in USD',
    'billing',
    true
  ),
  (
    'alerts_enabled',
    'true'::jsonb,
    'Enable budget alerts and notifications',
    'billing',
    true
  ),
  (
    'alert_thresholds',
    '{
      "warning": 80,
      "critical": 95
    }'::jsonb,
    'Budget alert thresholds as percentages',
    'billing',
    true
  )
ON CONFLICT (key) DO NOTHING;

-- Function to check and update budget before API usage
CREATE OR REPLACE FUNCTION check_budget_before_usage(
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
  -- Get budget configuration
  SELECT (value->>'value')::DECIMAL(10,4) INTO budget_limit
  FROM company_config WHERE key = 'monthly_budget_usd' AND is_enabled = true;

  SELECT (value->>'value')::DECIMAL(10,4) INTO current_spend
  FROM company_config WHERE key = 'current_spend_usd' AND is_enabled = true;

  SELECT (value->>'value')::BOOLEAN INTO alerts_enabled
  FROM company_config WHERE key = 'alerts_enabled' AND is_enabled = true;

  SELECT (value->>'warning')::INTEGER INTO warning_threshold
  FROM company_config WHERE key = 'alert_thresholds' AND is_enabled = true;

  SELECT (value->>'critical')::INTEGER INTO critical_threshold
  FROM company_config WHERE key = 'alert_thresholds' AND is_enabled = true;

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

-- Function to log API usage and update budget
CREATE OR REPLACE FUNCTION log_api_usage_and_update_budget(
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
  -- Insert usage record
  INSERT INTO api_usage (
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

  -- Update current spend in company_config
  SELECT (value->>'value')::DECIMAL(10,4) INTO current_spend
  FROM company_config WHERE key = 'current_spend_usd' AND is_enabled = true;

  UPDATE company_config
  SET value = jsonb_build_object('value', (COALESCE(current_spend, 0) + p_cost)::TEXT),
      updated_at = NOW()
  WHERE key = 'current_spend_usd' AND is_enabled = true;

  RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly budget spend (run on first day of month)
CREATE OR REPLACE FUNCTION reset_monthly_budget()
RETURNS VOID AS $$
BEGIN
  UPDATE company_config
  SET value = jsonb_build_object('value', '0.00'),
      updated_at = NOW()
  WHERE key = 'current_spend_usd' AND is_enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
