-- SOP Documents System Migration
-- Migration: 20250121_sop_documents.sql

-- Create sop_docs table for storing Standard Operating Procedures
CREATE TABLE sop_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    content TEXT NOT NULL,
    audience TEXT NOT NULL CHECK (audience IN ('employee', 'client', 'agent')),
    topic TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'published')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on audience and topic for better query performance
CREATE INDEX idx_sop_docs_audience ON sop_docs(audience);
CREATE INDEX idx_sop_docs_topic ON sop_docs(topic);
CREATE INDEX idx_sop_docs_status ON sop_docs(status);
CREATE INDEX idx_sop_docs_created_by ON sop_docs(created_by);

-- Enable Row Level Security
ALTER TABLE sop_docs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sop_docs
-- Admins have full access
CREATE POLICY "Admins have full access to sop_docs" ON sop_docs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'agent')
        )
    );

-- HR roles can create and view SOPs
CREATE POLICY "HR can manage sop_docs" ON sop_docs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'agent')
        ) OR sop_docs.created_by = auth.uid()
    );

-- All users can view published SOPs
CREATE POLICY "Users can view published sop_docs" ON sop_docs
    FOR SELECT USING (
        status = 'published'
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sop_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_sop_updated_at
    BEFORE UPDATE ON sop_docs
    FOR EACH ROW
    EXECUTE FUNCTION update_sop_updated_at();

-- Insert sample SOP Bot into ai_agents table
INSERT INTO ai_agents (
    id,
    name,
    role,
    description,
    prompt,
    capabilities_json,
    status,
    llm_provider,
    llm_model,
    created_by
) VALUES (
    gen_random_uuid(),
    'SOP Bot',
    'documentation_specialist',
    'AI-powered Standard Operating Procedure generator and documentation specialist',
    'You are an expert documentation specialist focused on creating clear, comprehensive Standard Operating Procedures (SOPs). You excel at analyzing processes, identifying best practices, and generating structured documentation that is easy to follow. You have access to the company knowledge library and can generate SOPs for employees, clients, and other agents. Always structure your SOPs with clear sections, step-by-step instructions, and include relevant context from the knowledge library.',
    '["chat", "sop_generation", "documentation", "process_analysis", "version_control", "rag_search", "markdown_generation", "pdf_export"]'::jsonb,
    'active',
    'openai',
    'gpt-4',
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- Create a function to get latest SOP version
CREATE OR REPLACE FUNCTION get_latest_sop_version(topic_param TEXT, audience_param TEXT)
RETURNS TEXT AS $$
DECLARE
    latest_version TEXT;
BEGIN
    SELECT version INTO latest_version
    FROM sop_docs
    WHERE topic = topic_param AND audience = audience_param
    ORDER BY created_at DESC
    LIMIT 1;

    IF latest_version IS NULL THEN
        RETURN '1.0';
    END IF;

    -- Simple version increment (you might want to make this more sophisticated)
    RETURN latest_version;
END;
$$ LANGUAGE plpgsql;
