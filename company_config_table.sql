-- =====================
-- Company Configuration table for Admin Settings
-- =====================
CREATE TABLE IF NOT EXISTS public.company_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on company_config
ALTER TABLE public.company_config ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on company_config (adjust later)
CREATE POLICY "Allow all operations on company_config"
  ON public.company_config
  FOR ALL
  USING (true);

-- Indexes to improve search performance on company_config
CREATE INDEX IF NOT EXISTS idx_company_config_key
  ON public.company_config (key);
CREATE INDEX IF NOT EXISTS idx_company_config_category
  ON public.company_config (category);
CREATE INDEX IF NOT EXISTS idx_company_config_created_at
  ON public.company_config (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_config_is_enabled
  ON public.company_config (is_enabled);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_config_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_company_config_updated_at
    BEFORE UPDATE ON public.company_config
    FOR EACH ROW
    EXECUTE FUNCTION update_company_config_updated_at_column();

-- Insert default configuration entries
INSERT INTO public.company_config (key, value, description, category, is_enabled) VALUES
  (
    'zapier_integration',
    '{
      "webhook_url": null,
      "api_key": null,
      "enabled_events": ["client_created", "invoice_created", "invoice_overdue"]
    }'::jsonb,
    'Configuration for Zapier webhook integration',
    'integrations',
    false
  ),
  (
    'tasker_integration',
    '{
      "webhook_url": null,
      "api_key": null,
      "enabled_events": ["client_created", "invoice_created", "invoice_overdue"]
    }'::jsonb,
    'Configuration for Tasker webhook integration',
    'integrations',
    false
  ),
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
