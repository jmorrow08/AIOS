-- =====================
-- Updated Jobs table for OperationsHub
-- =====================
-- Drop existing table if it exists and recreate with new schema
DROP TABLE IF EXISTS public.jobs CASCADE;

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('Planned', 'In Progress', 'Completed', 'On Hold', 'Cancelled')) DEFAULT 'Planned',
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  due_date DATE,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on jobs (adjust later for role-based access)
CREATE POLICY "Allow all operations on jobs"
  ON public.jobs
  FOR ALL
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status
  ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id
  ON public.jobs (client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to
  ON public.jobs (assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_due_date
  ON public.jobs (due_date);
CREATE INDEX IF NOT EXISTS idx_jobs_priority
  ON public.jobs (priority);
