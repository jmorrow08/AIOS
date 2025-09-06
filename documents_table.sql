-- =====================
-- Documents table for KnowledgeLibrary
-- =====================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on documents (adjust later)
CREATE POLICY "Allow all operations on documents"
  ON public.documents
  FOR ALL
  USING (true);

-- Indexes to improve search performance on documents
CREATE INDEX IF NOT EXISTS idx_documents_created_at
  ON public.documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_title
  ON public.documents (title);
CREATE INDEX IF NOT EXISTS idx_documents_description
  ON public.documents (description);
