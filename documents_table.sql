-- =====================
-- Documents table for KnowledgeLibrary
-- =====================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  content TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on documents (adjust later)
CREATE POLICY "Allow all operations on documents"
  ON public.documents
  FOR ALL
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on row changes
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes to improve search performance on documents
CREATE INDEX IF NOT EXISTS idx_documents_created_at
  ON public.documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at
  ON public.documents (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_title
  ON public.documents (title);
CREATE INDEX IF NOT EXISTS idx_documents_category
  ON public.documents (category);
CREATE INDEX IF NOT EXISTS idx_documents_description
  ON public.documents (description);
CREATE INDEX IF NOT EXISTS idx_documents_content
  ON public.documents USING GIN (to_tsvector('english', content));
