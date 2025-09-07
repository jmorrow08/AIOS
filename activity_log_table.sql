-- =====================
-- Activity Log table for MissionControl Dashboard
-- =====================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category TEXT NOT NULL CHECK (category IN ('client', 'invoice', 'job', 'media', 'agent', 'document', 'system')),
  link TEXT, -- Optional link to related page (e.g., '/invoices/123')
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data like IDs, amounts, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on activity_log (adjust later for role-based access)
CREATE POLICY "Allow all operations on activity_log"
  ON public.activity_log
  FOR ALL
  USING (true);

-- Indexes to improve search performance on activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp
  ON public.activity_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_category
  ON public.activity_log (category);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
  ON public.activity_log (created_at DESC);

-- Function to automatically clean up old activity logs (keep last 1000 entries)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_log
  WHERE id NOT IN (
    SELECT id FROM activity_log
    ORDER BY timestamp DESC
    LIMIT 1000
  );
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a trigger to auto-cleanup (commented out by default)
-- CREATE OR REPLACE FUNCTION trigger_cleanup_activity_logs()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- Clean up old logs when new ones are inserted
--   PERFORM cleanup_old_activity_logs();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER cleanup_activity_logs_trigger
--   AFTER INSERT ON activity_log
--   EXECUTE FUNCTION trigger_cleanup_activity_logs();
