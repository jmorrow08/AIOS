-- =====================
-- Settings table for application configuration
-- =====================
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on settings (adjust later)
CREATE POLICY "Allow all operations on settings"
  ON public.settings
  FOR ALL
  USING (true);

-- Indexes to improve search performance on settings
CREATE INDEX IF NOT EXISTS idx_settings_key
  ON public.settings (key);
CREATE INDEX IF NOT EXISTS idx_settings_category
  ON public.settings (category);
CREATE INDEX IF NOT EXISTS idx_settings_created_at
  ON public.settings (created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_settings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at_column();

-- Insert default webhook settings (optional - can be set via UI)
-- These are placeholder values that should be updated with actual webhook URLs
INSERT INTO public.settings (key, value, description, category) VALUES
  ('zapier_webhook_url', NULL, 'Zapier webhook URL for receiving events', 'webhooks'),
  ('zapier_api_key', NULL, 'API key for Zapier authentication', 'webhooks'),
  ('tasker_webhook_url', NULL, 'Tasker webhook URL for receiving events', 'webhooks'),
  ('tasker_api_key', NULL, 'API key for Tasker authentication', 'webhooks')
ON CONFLICT (key) DO NOTHING;
