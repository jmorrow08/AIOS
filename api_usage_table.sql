-- =====================
-- API Usage table for tracking AI API costs
-- =====================
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  service TEXT NOT NULL, -- e.g., 'OpenAI', 'Stability AI', 'Anthropic'
  agent_id UUID REFERENCES ai_agents(id), -- FK to ai_agents table
  agent TEXT, -- optional agent name for display
  description TEXT NOT NULL,
  cost DECIMAL(10,4) NOT NULL DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  requests_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on api_usage
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on api_usage (adjust later)
CREATE POLICY "Allow all operations on api_usage"
  ON public.api_usage
  FOR ALL
  USING (true);

-- Indexes for better querying on api_usage
CREATE INDEX IF NOT EXISTS idx_api_usage_date
  ON public.api_usage (date);
CREATE INDEX IF NOT EXISTS idx_api_usage_service
  ON public.api_usage (service);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at
  ON public.api_usage (created_at DESC);

-- Insert default API budget setting
INSERT INTO public.settings (key, value, description, category)
VALUES ('api_budget_limit', '50.00', 'Monthly API budget limit in USD', 'billing')
ON CONFLICT (key) DO NOTHING;
