-- =====================
-- HR Portal Schema Extensions
-- Migration: 20250110_hr_portal_schema.sql
-- =====================

-- Add agent_id column to employees table to link human employees with AI agents
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES ai_agents(id);

-- Create index for agent_id for better performance
CREATE INDEX IF NOT EXISTS idx_employees_agent_id
ON public.employees (agent_id);

-- Add permissions column to employees table for storing access rights as JSON
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "services": true,
  "finance": false,
  "media": false,
  "knowledge": false,
  "hr": false,
  "admin": false
}'::jsonb;

-- Add permissions column to ai_agents table for storing agent access rights
ALTER TABLE ai_agents
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "services": true,
  "finance": false,
  "media": false,
  "knowledge": true,
  "hr": false,
  "admin": false
}'::jsonb;

-- Create employee_onboarding table for tracking onboarding workflows
CREATE TABLE IF NOT EXISTS employee_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  steps JSONB DEFAULT '[]'::jsonb,
  current_step INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  sop_document_id UUID REFERENCES documents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on employee_onboarding
ALTER TABLE employee_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_onboarding
CREATE POLICY "Admins have full access to employee_onboarding" ON employee_onboarding
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "HR users can access employee_onboarding" ON employee_onboarding
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

-- Create function to update updated_at for employee_onboarding
CREATE OR REPLACE FUNCTION update_employee_onboarding_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for employee_onboarding updated_at
CREATE TRIGGER update_employee_onboarding_updated_at
  BEFORE UPDATE ON employee_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_onboarding_updated_at_column();

-- Create payroll_transactions table for tracking employee/agent payouts
CREATE TABLE IF NOT EXISTS payroll_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  agent_id UUID REFERENCES ai_agents(id),
  service_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'failed')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure either employee_id or agent_id is provided, but not both
  CONSTRAINT payroll_transaction_entity_check CHECK (
    (employee_id IS NOT NULL AND agent_id IS NULL) OR
    (employee_id IS NULL AND agent_id IS NOT NULL)
  )
);

-- Enable RLS on payroll_transactions
ALTER TABLE payroll_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_transactions
CREATE POLICY "Admins have full access to payroll_transactions" ON payroll_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "HR users can access payroll_transactions" ON payroll_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

-- Create function to update updated_at for payroll_transactions
CREATE OR REPLACE FUNCTION update_payroll_transactions_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for payroll_transactions updated_at
CREATE TRIGGER update_payroll_transactions_updated_at
  BEFORE UPDATE ON payroll_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_transactions_updated_at_column();

-- Create indexes for payroll_transactions
CREATE INDEX IF NOT EXISTS idx_payroll_transactions_employee_id
ON public.payroll_transactions (employee_id);

CREATE INDEX IF NOT EXISTS idx_payroll_transactions_agent_id
ON public.payroll_transactions (agent_id);

CREATE INDEX IF NOT EXISTS idx_payroll_transactions_period_start
ON public.payroll_transactions (period_start);

CREATE INDEX IF NOT EXISTS idx_payroll_transactions_status
ON public.payroll_transactions (status);
