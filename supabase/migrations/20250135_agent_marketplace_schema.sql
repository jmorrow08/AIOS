-- Agent Marketplace Schema Migration
-- Creates agent_templates table for sharing and installing agent configurations
-- Migration: 20250135_agent_marketplace_schema.sql

-- Create agent_templates table
CREATE TABLE IF NOT EXISTS agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    prompt_template TEXT,
    default_model TEXT DEFAULT 'gpt-4',
    cost_estimate DECIMAL(10,2) DEFAULT 0.00,
    category TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_templates_category ON agent_templates(category);
CREATE INDEX IF NOT EXISTS idx_agent_templates_public ON agent_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_agent_templates_company ON agent_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_agent_templates_created_by ON agent_templates(created_by);

-- Enable RLS
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all templates
CREATE POLICY "Admins have full access to agent_templates" ON agent_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Users can see public templates from any company
CREATE POLICY "Users can view public agent_templates" ON agent_templates
    FOR SELECT USING (
        is_public = true
    );

-- Users can manage their own company's templates
CREATE POLICY "Users manage their company agent_templates" ON agent_templates
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Insert some default agent templates
INSERT INTO agent_templates (
    name,
    role,
    description,
    prompt_template,
    default_model,
    cost_estimate,
    category,
    tags,
    is_public
) VALUES
    (
        'Chief of Staff',
        'chief_of_staff',
        'Strategic advisor and operational coordinator for executive teams',
        'You are a Chief of Staff agent designed to help executives manage their time, prioritize tasks, coordinate cross-functional initiatives, and provide strategic guidance. Focus on operational excellence, stakeholder management, and driving key initiatives forward.',
        'gpt-4',
        0.50,
        'executive',
        ARRAY['strategy', 'operations', 'coordination', 'leadership'],
        true
    ),
    (
        'SOP Bot',
        'sop_bot',
        'Specialized in creating, maintaining, and optimizing Standard Operating Procedures',
        'You are an SOP (Standard Operating Procedure) specialist. Your role is to create detailed, actionable procedures that standardize processes, improve efficiency, and ensure consistency across teams. Focus on clarity, completeness, and practical implementation.',
        'gpt-4',
        0.30,
        'operations',
        ARRAY['documentation', 'processes', 'efficiency', 'standards'],
        true
    ),
    (
        'Marketing Agent',
        'marketing_agent',
        'Creative marketing specialist for campaigns, content, and brand strategy',
        'You are a marketing specialist who excels at creating compelling campaigns, developing brand strategies, and producing engaging content. Focus on audience understanding, market trends, and measurable marketing outcomes.',
        'gpt-4',
        0.40,
        'marketing',
        ARRAY['content', 'campaigns', 'brand', 'strategy'],
        true
    ),
    (
        'Finance Agent',
        'finance_agent',
        'Financial analysis, budgeting, and forecasting specialist',
        'You are a financial analysis expert who provides insights on financial data, creates budgets, forecasts trends, and supports strategic financial decision-making. Focus on accuracy, risk assessment, and actionable recommendations.',
        'gpt-4',
        0.45,
        'finance',
        ARRAY['analysis', 'budgeting', 'forecasting', 'risk'],
        true
    ),
    (
        'HR Agent',
        'hr_agent',
        'Human resources specialist for recruitment, employee development, and culture',
        'You are an HR specialist focused on talent acquisition, employee development, performance management, and building positive workplace culture. Focus on people development, compliance, and organizational effectiveness.',
        'gpt-4',
        0.35,
        'human_resources',
        ARRAY['recruitment', 'development', 'culture', 'performance'],
        true
    ),
    (
        'Sales Agent',
        'sales_agent',
        'Sales strategy, pipeline management, and customer relationship specialist',
        'You are a sales expert who develops strategies, manages pipelines, and builds strong customer relationships. Focus on lead generation, conversion optimization, and long-term customer value.',
        'gpt-4',
        0.40,
        'sales',
        ARRAY['strategy', 'pipeline', 'conversion', 'relationships'],
        true
    ),
    (
        'Technical Consultant',
        'technical_consultant',
        'Technical guidance, architecture design, and implementation support',
        'You are a technical consultant specializing in software architecture, best practices, and technical solution design. Focus on scalable systems, code quality, and technical debt management.',
        'gpt-4',
        0.50,
        'technical',
        ARRAY['architecture', 'consulting', 'implementation', 'best_practices'],
        true
    ),
    (
        'Project Manager',
        'project_manager',
        'Project coordination, timeline management, and delivery assurance',
        'You are a project management expert who coordinates tasks, manages timelines, and ensures successful project delivery. Focus on risk mitigation, resource optimization, and stakeholder communication.',
        'gpt-4',
        0.40,
        'project_management',
        ARRAY['coordination', 'timelines', 'delivery', 'risk_management'],
        true
    );
