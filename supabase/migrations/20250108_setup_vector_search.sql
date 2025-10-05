-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge_vectors table for storing document embeddings
CREATE TABLE IF NOT EXISTS knowledge_vectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1536), -- text-embedding-3-small has 1536 dimensions
    title TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('notion', 'google-drive', 'internal')),
    url TEXT,
    document_id TEXT NOT NULL,
    chunk_index INTEGER,
    total_chunks INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS knowledge_vectors_embedding_idx
ON knowledge_vectors USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS knowledge_vectors_source_idx ON knowledge_vectors(source);

-- Create index for document_id for efficient lookups
CREATE INDEX IF NOT EXISTS knowledge_vectors_document_id_idx ON knowledge_vectors(document_id);

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION search_knowledge_vectors(
    query_embedding vector(1536),
    similarity_threshold float DEFAULT 0.7,
    max_results integer DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    content TEXT,
    title TEXT,
    source TEXT,
    url TEXT,
    document_id TEXT,
    chunk_index INTEGER,
    total_chunks INTEGER,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kv.id,
        kv.content,
        kv.title,
        kv.source,
        kv.url,
        kv.document_id,
        kv.chunk_index,
        kv.total_chunks,
        1 - (kv.embedding <=> query_embedding) as similarity
    FROM knowledge_vectors kv
    WHERE 1 - (kv.embedding <=> query_embedding) > similarity_threshold
    ORDER BY kv.embedding <=> query_embedding
    LIMIT max_results;
END;
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_knowledge_vectors_updated_at
    BEFORE UPDATE ON knowledge_vectors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE knowledge_vectors ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all knowledge vectors
CREATE POLICY "Allow authenticated users to read knowledge vectors"
ON knowledge_vectors
FOR SELECT
TO authenticated
USING (true);

-- Policy for authenticated users to insert knowledge vectors
CREATE POLICY "Allow authenticated users to insert knowledge vectors"
ON knowledge_vectors
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for authenticated users to update knowledge vectors
CREATE POLICY "Allow authenticated users to update knowledge vectors"
ON knowledge_vectors
FOR UPDATE
TO authenticated
USING (true);

-- Policy for authenticated users to delete knowledge vectors
CREATE POLICY "Allow authenticated users to delete knowledge vectors"
ON knowledge_vectors
FOR DELETE
TO authenticated
USING (true);

-- Create a view for easier querying with source information
CREATE OR REPLACE VIEW knowledge_search_view AS
SELECT
    id,
    content,
    title,
    source,
    url,
    document_id,
    chunk_index,
    total_chunks,
    created_at,
    CASE
        WHEN source = 'notion' THEN '📝'
        WHEN source = 'google-drive' THEN '📁'
        WHEN source = 'internal' THEN '💼'
        ELSE '📄'
    END as source_icon
FROM knowledge_vectors;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON knowledge_vectors TO authenticated;
GRANT SELECT ON knowledge_search_view TO authenticated;
