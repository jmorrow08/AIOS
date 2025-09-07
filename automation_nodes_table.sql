-- Automation Nodes Table
-- Stores individual nodes within automation flows

CREATE TABLE IF NOT EXISTS automation_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('trigger', 'action', 'condition')),
  node_type VARCHAR(100) NOT NULL, -- e.g., 'new_service', 'send_email', 'budget_warning'
  label VARCHAR(255) NOT NULL,
  config JSONB DEFAULT '{}', -- Node-specific configuration
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}', -- Position in the flow editor
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_nodes_flow_id ON automation_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_automation_nodes_type ON automation_nodes(type);
CREATE INDEX IF NOT EXISTS idx_automation_nodes_node_type ON automation_nodes(node_type);

-- Enable RLS (Row Level Security)
ALTER TABLE automation_nodes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view automation nodes from their company flows"
  ON automation_nodes FOR SELECT
  USING (flow_id IN (
    SELECT af.id FROM automation_flows af
    WHERE af.company_id IN (
      SELECT company_id FROM employees WHERE user_id = auth.uid()
      UNION
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert automation nodes for their company flows"
  ON automation_nodes FOR INSERT
  WITH CHECK (flow_id IN (
    SELECT af.id FROM automation_flows af
    WHERE af.company_id IN (
      SELECT company_id FROM employees WHERE user_id = auth.uid()
      UNION
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update automation nodes from their company flows"
  ON automation_nodes FOR UPDATE
  USING (flow_id IN (
    SELECT af.id FROM automation_flows af
    WHERE af.company_id IN (
      SELECT company_id FROM employees WHERE user_id = auth.uid()
      UNION
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete automation nodes from their company flows"
  ON automation_nodes FOR DELETE
  USING (flow_id IN (
    SELECT af.id FROM automation_flows af
    WHERE af.company_id IN (
      SELECT company_id FROM employees WHERE user_id = auth.uid()
      UNION
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_automation_nodes_updated_at
  BEFORE UPDATE ON automation_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_nodes_updated_at();
