-- Expand AI Agents table for enhanced agent builder functionality
-- Migration: 20250907_expand_agents.sql

-- Add new columns to ai_agents table
ALTER TABLE ai_agents
ADD COLUMN description TEXT,
ADD COLUMN capabilities_json JSONB DEFAULT '[]'::jsonb,
ADD COLUMN created_by UUID REFERENCES users(id),
ADD COLUMN llm_model TEXT DEFAULT 'gpt-4';

-- Create conversation_logs table for enhanced conversation tracking
CREATE TABLE conversation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_title TEXT,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_logs table for autonomous task tracking
CREATE TABLE task_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    task_plan JSONB,
    status TEXT DEFAULT 'pending',
    results JSONB,
    sub_tasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_logs
CREATE POLICY "Admins have full access to conversation_logs" ON conversation_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users see their own conversation_logs" ON conversation_logs
    FOR ALL USING (
        conversation_logs.user_id = auth.uid()
    );

-- RLS Policies for task_logs
CREATE POLICY "Admins have full access to task_logs" ON task_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users see their own task_logs" ON task_logs
    FOR ALL USING (
        task_logs.user_id = auth.uid()
    );

-- Update existing ai_agents records to have default capabilities
UPDATE ai_agents
SET capabilities_json = '["chat", "basic_task_execution"]'::jsonb
WHERE capabilities_json IS NULL;

-- Add some sample agent roles with enhanced data
INSERT INTO ai_agents (id, name, role, description, prompt, capabilities_json, status, llm_provider, llm_model)
VALUES
    (gen_random_uuid(), 'Content Creator', 'content_creator', 'Specialized in creating engaging content across various formats', 'You are a creative content creator who excels at writing, ideation, and multimedia content creation.', '["chat", "content_generation", "creative_writing", "multimedia_design"]'::jsonb, 'active', 'openai', 'gpt-4'),
    (gen_random_uuid(), 'Financial Analyst', 'financial_analyst', 'Expert in financial analysis, reporting, and data insights', 'You are a financial analysis expert who provides insights on financial data, trends, and strategic recommendations.', '["chat", "financial_analysis", "data_processing", "report_generation", "market_research"]'::jsonb, 'active', 'openai', 'gpt-4'),
    (gen_random_uuid(), 'Technical Consultant', 'technical_consultant', 'Provides technical guidance and implementation strategies', 'You are a technical consultant specializing in software architecture, best practices, and technical solution design.', '["chat", "technical_consulting", "code_review", "architecture_design", "system_analysis"]'::jsonb, 'active', 'openai', 'gpt-4'),
    (gen_random_uuid(), 'Project Manager', 'project_manager', 'Manages projects, coordinates teams, and ensures delivery', 'You are a project management expert who coordinates tasks, manages timelines, and ensures successful project delivery.', '["chat", "project_management", "task_coordination", "risk_assessment", "resource_planning", "sub_agent_coordination"]'::jsonb, 'active', 'openai', 'gpt-4'),
    (gen_random_uuid(), 'Data Scientist', 'data_scientist', 'Analyzes data, builds models, and provides insights', 'You are a data science expert who analyzes complex datasets, builds predictive models, and provides actionable insights.', '["chat", "data_analysis", "machine_learning", "statistical_modeling", "data_visualization"]'::jsonb, 'active', 'openai', 'gpt-4');
