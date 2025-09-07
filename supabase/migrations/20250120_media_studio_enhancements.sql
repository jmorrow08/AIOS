-- Add new columns to media_projects table for enhanced Media Studio functionality
ALTER TABLE media_projects
ADD COLUMN IF NOT EXISTS scenes JSONB,
ADD COLUMN IF NOT EXISTS settings JSONB,
ADD COLUMN IF NOT EXISTS export_url TEXT,
ADD COLUMN IF NOT EXISTS export_options JSONB,
ADD COLUMN IF NOT EXISTS render_progress JSONB;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_media_projects_scenes ON media_projects USING GIN (scenes);
CREATE INDEX IF NOT EXISTS idx_media_projects_settings ON media_projects USING GIN (settings);

-- Update existing records to have default settings if they don't have any
UPDATE media_projects
SET settings = '{
  "imageService": "dalle",
  "audioService": "elevenlabs",
  "videoService": "heygen",
  "promptRewriterEnabled": true,
  "outputFormat": "mp4",
  "resolution": "1080p"
}'::jsonb
WHERE settings IS NULL;

UPDATE media_projects
SET export_options = '{
  "format": "mp4",
  "resolution": "1080p",
  "quality": "high",
  "includeSubtitles": false,
  "publishToLibrary": false
}'::jsonb
WHERE export_options IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN media_projects.scenes IS 'JSON array containing scene data with script, image, audio, and metadata';
COMMENT ON COLUMN media_projects.settings IS 'JSON object containing AI service settings and project preferences';
COMMENT ON COLUMN media_projects.export_url IS 'URL of the rendered video file in Supabase Storage';
COMMENT ON COLUMN media_projects.export_options IS 'JSON object containing export configuration options';
COMMENT ON COLUMN media_projects.render_progress IS 'JSON object tracking video rendering progress and status';
