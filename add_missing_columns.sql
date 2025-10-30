-- Add missing columns to ai_agents table
ALTER TABLE ai_agents 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS capabilities_json JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS llm_provider TEXT DEFAULT 'openai',
ADD COLUMN IF NOT EXISTS llm_model TEXT DEFAULT 'gpt-4';

-- Update existing records
UPDATE ai_agents 
SET capabilities_json = '["chat", "basic_task_execution"]'::jsonb 
WHERE capabilities_json IS NULL OR capabilities_json = '[]'::jsonb;
