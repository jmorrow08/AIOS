-- =====================
-- Multi-Tenant RLS Policies Update
-- Comprehensive RLS policies for company data isolation
-- =====================

-- Drop existing policies (we'll recreate them more comprehensively)
DROP POLICY IF EXISTS "Admins have full access to companies" ON companies;
DROP POLICY IF EXISTS "Clients see their own company" ON companies;

DROP POLICY IF EXISTS "Admins have full access to users" ON users;
DROP POLICY IF EXISTS "Clients see users in their company" ON users;
DROP POLICY IF EXISTS "Agents see themselves" ON users;

DROP POLICY IF EXISTS "Admins have full access to services" ON services;
DROP POLICY IF EXISTS "Clients see services for their company" ON services;

DROP POLICY IF EXISTS "Admins have full access to invoices" ON invoices;
DROP POLICY IF EXISTS "Clients see invoices for their company" ON invoices;

DROP POLICY IF EXISTS "Admins have full access to transactions" ON transactions;
DROP POLICY IF EXISTS "Clients see transactions for their company" ON transactions;

DROP POLICY IF EXISTS "Admins have full access to ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "Agents have access to ai_agents" ON ai_agents;

DROP POLICY IF EXISTS "Admins have full access to agent_logs" ON agent_logs;
DROP POLICY IF EXISTS "Agents see their own logs" ON agent_logs;

DROP POLICY IF EXISTS "Admins have full access to meeting_logs" ON meeting_logs;

DROP POLICY IF EXISTS "Users can access their own media projects" ON media_projects;
DROP POLICY IF EXISTS "Allow all operations on media_assets" ON media_assets;
DROP POLICY IF EXISTS "Allow all operations on api_usage" ON api_usage;

-- Companies Policies
CREATE POLICY "Admins have full access to companies" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see their own company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = companies.id
    )
  );

-- Users Policies
CREATE POLICY "Admins have full access to users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see users in their company" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.company_id = users.company_id
    )
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (users.id = auth.uid());

-- Services Policies
CREATE POLICY "Admins have full access to services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see services for their company" ON services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = services.company_id
    )
  );

CREATE POLICY "Users can insert services for their company" ON services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = services.company_id
    )
  );

CREATE POLICY "Users can update services for their company" ON services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = services.company_id
    )
  );

-- Invoices Policies
CREATE POLICY "Admins have full access to invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see invoices for their company" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = invoices.company_id
    )
  );

CREATE POLICY "Users can insert invoices for their company" ON invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = invoices.company_id
    )
  );

-- Transactions Policies
CREATE POLICY "Admins have full access to transactions" ON transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see transactions for their company" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u, invoices i
      WHERE u.id = auth.uid()
      AND u.company_id = i.company_id
      AND i.id = transactions.invoice_id
    )
  );

-- AI Agents Policies
CREATE POLICY "Admins have full access to ai_agents" ON ai_agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see AI agents for their company" ON ai_agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = ai_agents.company_id
    )
  );

CREATE POLICY "Users can manage AI agents for their company" ON ai_agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = ai_agents.company_id
    )
  );

-- Agent Logs Policies
CREATE POLICY "Admins have full access to agent_logs" ON agent_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see agent logs for their company" ON agent_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u, ai_agents a
      WHERE u.id = auth.uid()
      AND u.company_id = a.company_id
      AND a.id = agent_logs.agent_id
    )
  );

-- Meeting Logs Policies
CREATE POLICY "Admins have full access to meeting_logs" ON meeting_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see meeting logs for their company" ON meeting_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = meeting_logs.company_id
    )
  );

-- Media Projects Policies
CREATE POLICY "Admins have full access to media_projects" ON media_projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see media projects for their company" ON media_projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = media_projects.company_id
    )
  );

-- Media Assets Policies
CREATE POLICY "Admins have full access to media_assets" ON media_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see media assets for their company" ON media_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = media_assets.company_id
    )
  );

CREATE POLICY "Users can manage media assets for their company" ON media_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = media_assets.company_id
    )
  );

-- API Usage Policies
CREATE POLICY "Admins have full access to api_usage" ON api_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see api usage for their company" ON api_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = api_usage.company_id
    )
  );

-- Company Plans Policies
CREATE POLICY "Admins have full access to company_plans" ON company_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users see company plan for their company" ON company_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = company_plans.company_id
    )
  );

-- Company Config Policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_config') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Admins have full access to company_config" ON company_config;
    DROP POLICY IF EXISTS "Users see company_config for their company" ON company_config;

    -- Create new policies
    EXECUTE 'CREATE POLICY "Admins have full access to company_config" ON company_config
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = ''admin''
        )
      )';

    EXECUTE 'CREATE POLICY "Users see company_config for their company" ON company_config
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.company_id = company_config.company_id
        )
      )';
  END IF;
END $$;
