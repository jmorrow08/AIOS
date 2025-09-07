-- =====================
-- Media Projects table for saving complete media creation projects
-- =====================
CREATE TABLE IF NOT EXISTS public.media_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio')),
  description TEXT,
  brief TEXT, -- Project brief for video projects
  script TEXT, -- Generated/edited script for video projects
  image_paths TEXT[], -- Array of image URLs/paths for video projects or single image for image projects
  audio_path TEXT, -- Audio file URL/path for video/audio projects
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'exported')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on media_projects
ALTER TABLE public.media_projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own projects
CREATE POLICY "Users can access their own media projects"
  ON public.media_projects
  FOR ALL
  USING (auth.uid() = created_by);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_projects_type
  ON public.media_projects (type);
CREATE INDEX IF NOT EXISTS idx_media_projects_status
  ON public.media_projects (status);
CREATE INDEX IF NOT EXISTS idx_media_projects_created_by
  ON public.media_projects (created_by);
CREATE INDEX IF NOT EXISTS idx_media_projects_created_at
  ON public.media_projects (created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_projects_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_media_projects_updated_at
    BEFORE UPDATE ON public.media_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_media_projects_updated_at_column();
