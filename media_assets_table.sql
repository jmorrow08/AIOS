-- =====================
-- Media Assets table for Media Studio
-- =====================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
  prompt TEXT,
  ai_service TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on media_assets
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations on media_assets (adjust later)
CREATE POLICY "Allow all operations on media_assets"
  ON public.media_assets
  FOR ALL
  USING (true);

-- Indexes to improve search performance on media_assets
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at
  ON public.media_assets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_title
  ON public.media_assets (title);
CREATE INDEX IF NOT EXISTS idx_media_assets_media_type
  ON public.media_assets (media_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_ai_service
  ON public.media_assets (ai_service);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_media_assets_updated_at
    BEFORE UPDATE ON public.media_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
