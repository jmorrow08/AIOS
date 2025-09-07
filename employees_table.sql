-- =====================
-- Employees table for OperationsHub
-- =====================
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

-- Enable Row Level Security (RLS) for employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on employees (adjust later for role-based access)
CREATE POLICY "Allow all operations on employees"
  ON public.employees
  FOR ALL
  USING (true);

-- Create updated_at trigger (reusing the function from clients table)
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_status
  ON public.employees (status);
CREATE INDEX IF NOT EXISTS idx_employees_role
  ON public.employees (role);
CREATE INDEX IF NOT EXISTS idx_employees_email
  ON public.employees (email);
