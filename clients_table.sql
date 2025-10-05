-- =====================
-- Clients table for OperationsHub
-- =====================
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

-- Enable Row Level Security (RLS) for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on clients (adjust later for role-based access)
CREATE POLICY "Allow all operations on clients"
  ON public.clients
  FOR ALL
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status
  ON public.clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_company
  ON public.clients (company);
