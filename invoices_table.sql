-- =====================
-- Invoices table for FinancialNexus
-- =====================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Paid', 'Overdue')) DEFAULT 'Draft',
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on invoices (adjust later)
CREATE POLICY "Allow all operations on invoices"
  ON public.invoices
  FOR ALL
  USING (true);

-- Indexes for better sorting/filtering on invoices
CREATE INDEX IF NOT EXISTS idx_invoices_due_date
  ON public.invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON public.invoices (status);
