-- =====================
-- Invoices table for FinancialNexus
-- =====================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  service_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_date DATE,
  line_items JSONB DEFAULT '[]',
  payment_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on invoices (adjust later)
CREATE POLICY "Allow all operations on invoices"
  ON public.invoices
  FOR ALL
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoices_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at_column();

-- Indexes for better sorting/filtering on invoices
CREATE INDEX IF NOT EXISTS idx_invoices_due_date
  ON public.invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON public.invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id
  ON public.invoices (company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at
  ON public.invoices (created_at DESC);
