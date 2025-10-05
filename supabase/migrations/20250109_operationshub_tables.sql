-- =====================
-- OperationsHub Tables Migration
-- =====================

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive', 'Prospect')) DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  department TEXT,
  hire_date DATE,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive', 'Terminated')) DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing jobs table if it exists
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Updated Jobs table
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations (adjust later for role-based access)
CREATE POLICY "Allow all operations on clients"
  ON public.clients
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on employees"
  ON public.employees
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on jobs"
  ON public.jobs
  FOR ALL
  USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients (company);

CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees (status);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees (role);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees (email);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs (client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON public.jobs (assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_due_date ON public.jobs (due_date);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON public.jobs (priority);
