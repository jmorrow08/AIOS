-- Automation Flows Table
-- Stores the main automation flow definitions

CREATE TABLE IF NOT EXISTS automation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_flows_company_id ON automation_flows(company_id);
CREATE INDEX IF NOT EXISTS idx_automation_flows_enabled ON automation_flows(enabled);

-- Enable RLS (Row Level Security)
ALTER TABLE automation_flows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view automation flows from their company"
  ON automation_flows FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM employees WHERE user_id = auth.uid()
    UNION
    SELECT id FROM companies WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert automation flows for their company"
  ON automation_flows FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM employees WHERE user_id = auth.uid()
    UNION
    SELECT id FROM companies WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can update automation flows from their company"
  ON automation_flows FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM employees WHERE user_id = auth.uid()
    UNION
    SELECT id FROM companies WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete automation flows from their company"
  ON automation_flows FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM employees WHERE user_id = auth.uid()
    UNION
    SELECT id FROM companies WHERE owner_id = auth.uid()
  ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_automation_flows_updated_at
  BEFORE UPDATE ON automation_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_flows_updated_at();
