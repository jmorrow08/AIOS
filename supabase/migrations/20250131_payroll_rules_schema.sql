-- =====================
-- Payroll Rules and Enhanced Payouts Schema
-- Migration: 20250131_payroll_rules_schema.sql
-- =====================

-- Create payroll_rules table for defining compensation rules
CREATE TABLE IF NOT EXISTS payroll_rules (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
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

-- Enable RLS on payroll_rules
ALTER TABLE payroll_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_rules
CREATE POLICY "Admins have full access to payroll_rules" ON payroll_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "HR users can access payroll_rules" ON payroll_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

-- Create function to update updated_at for payroll_rules
CREATE OR REPLACE FUNCTION update_payroll_rules_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for payroll_rules updated_at
CREATE TRIGGER update_payroll_rules_updated_at
  BEFORE UPDATE ON payroll_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_rules_updated_at_column();

-- Create indexes for payroll_rules
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

-- Enhance payroll_transactions table with additional fields
ALTER TABLE payroll_transactions
ADD COLUMN IF NOT EXISTS payroll_rule_id UUID REFERENCES payroll_rules(id),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('zelle', 'ach', 'stripe', 'check', 'wire')),
ADD COLUMN IF NOT EXISTS payment_reference TEXT, -- Transaction ID, check number, etc.
ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(6,2), -- For hourly rate calculations
ADD COLUMN IF NOT EXISTS service_value DECIMAL(10,2), -- Original service/invoice amount
ADD COLUMN IF NOT EXISTS calculated_amount DECIMAL(10,2), -- Amount calculated before approval
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10,2) NOT NULL DEFAULT 0; -- Final approved amount

-- Update existing records to set final_amount = amount if not set
UPDATE payroll_transactions
SET final_amount = amount
WHERE final_amount = 0 OR final_amount IS NULL;

-- Make final_amount required going forward
ALTER TABLE payroll_transactions
ALTER COLUMN final_amount SET NOT NULL;

-- Add trigger to automatically update final_amount when amount changes (if not manually set)
CREATE OR REPLACE FUNCTION update_payroll_transaction_final_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-update if final_amount hasn't been manually set or is still 0
  IF OLD.final_amount = 0 OR OLD.final_amount IS NULL OR NEW.amount != OLD.amount THEN
    NEW.final_amount = NEW.amount;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payroll_transaction_final_amount_trigger
  BEFORE UPDATE ON payroll_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_transaction_final_amount();

-- Create employee_notifications table for payout notifications
CREATE TABLE IF NOT EXISTS employee_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  agent_id UUID REFERENCES ai_agents(id),
  payroll_transaction_id UUID REFERENCES payroll_transactions(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('payout_created', 'payout_approved', 'payout_paid', 'payout_failed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure either employee_id or agent_id is provided
  CONSTRAINT employee_notifications_recipient_check CHECK (
    (employee_id IS NOT NULL AND agent_id IS NULL) OR
    (employee_id IS NULL AND agent_id IS NOT NULL)
  )
);

-- Enable RLS on employee_notifications
ALTER TABLE employee_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_notifications
CREATE POLICY "Users can access their own notifications" ON employee_notifications
  FOR ALL USING (
    (employee_id IS NOT NULL AND
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id = auth.uid()
       AND users.id = employee_notifications.employee_id
     )) OR
    (agent_id IS NOT NULL AND
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id = auth.uid()
       AND users.id = agent_notifications.agent_id
     ))
  );

CREATE POLICY "Admins and HR can access all notifications" ON employee_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'hr')
    )
  );

-- Create indexes for employee_notifications
CREATE INDEX IF NOT EXISTS idx_employee_notifications_employee_id
ON public.employee_notifications (employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_notifications_agent_id
ON public.employee_notifications (agent_id);

CREATE INDEX IF NOT EXISTS idx_employee_notifications_payroll_transaction_id
ON public.employee_notifications (payroll_transaction_id);

CREATE INDEX IF NOT EXISTS idx_employee_notifications_is_read
ON public.employee_notifications (is_read);

-- Insert some default payroll rules
INSERT INTO payroll_rules (name, role, rate_type, amount, priority) VALUES
('Default Service Agent Compensation', 'service_agent', 'percentage', 20.00, 10),
('Default Content Creator Compensation', 'content_creator', 'per-job', 150.00, 10),
('Default Developer Compensation', 'developer', 'hourly', 75.00, 10),
('Default Designer Compensation', 'designer', 'per-job', 200.00, 10),
('Default Marketing Specialist Compensation', 'marketing_specialist', 'salary', 3500.00, 10);
