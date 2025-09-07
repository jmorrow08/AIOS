-- =====================
-- Payroll Rules Table
-- =====================
CREATE TABLE IF NOT EXISTS public.payroll_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- Rule name for easy identification
  role TEXT, -- Specific role this rule applies to (null means applies to all roles)
  department TEXT, -- Specific department this rule applies to (null means applies to all departments)
  employee_id UUID REFERENCES employees(id), -- Specific employee override (null means applies to all)
  agent_id UUID REFERENCES ai_agents(id), -- Specific agent override (null means applies to all)
  service_id UUID REFERENCES services(id), -- Specific service this rule applies to (null means applies to all services)
  rate_type TEXT NOT NULL CHECK (rate_type IN ('hourly', 'per-job', 'salary', 'percentage')),
  amount DECIMAL(10,2) NOT NULL, -- Rate amount or percentage
  is_percentage BOOLEAN DEFAULT false, -- Whether amount is a percentage of service value
  is_active BOOLEAN DEFAULT true, -- Whether this rule is currently active
  priority INTEGER DEFAULT 0, -- Rule priority (higher numbers override lower ones)
  effective_date DATE DEFAULT CURRENT_DATE, -- When this rule becomes effective
  expiration_date DATE, -- When this rule expires (null means no expiration)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure at least one target is specified
  CONSTRAINT payroll_rules_target_check CHECK (
    role IS NOT NULL OR
    department IS NOT NULL OR
    employee_id IS NOT NULL OR
    agent_id IS NOT NULL OR
    service_id IS NOT NULL
  ),
  -- Ensure percentage rules have valid percentage values
  CONSTRAINT payroll_rules_percentage_check CHECK (
    NOT is_percentage OR (is_percentage AND amount >= 0 AND amount <= 100)
  )
);

-- Enable Row Level Security (RLS) for payroll_rules
ALTER TABLE public.payroll_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and HR have full access
CREATE POLICY "Admins and HR have full access to payroll_rules"
  ON public.payroll_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_payroll_rules_updated_at
  BEFORE UPDATE ON payroll_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payroll_rules_role
  ON public.payroll_rules (role);
CREATE INDEX IF NOT EXISTS idx_payroll_rules_department
  ON public.payroll_rules (department);
CREATE INDEX IF NOT EXISTS idx_payroll_rules_employee_id
  ON public.payroll_rules (employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_rules_agent_id
  ON public.payroll_rules (agent_id);
CREATE INDEX IF NOT EXISTS idx_payroll_rules_service_id
  ON public.payroll_rules (service_id);
CREATE INDEX IF NOT EXISTS idx_payroll_rules_rate_type
  ON public.payroll_rules (rate_type);
CREATE INDEX IF NOT EXISTS idx_payroll_rules_is_active
  ON public.payroll_rules (is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_rules_priority
  ON public.payroll_rules (priority);
