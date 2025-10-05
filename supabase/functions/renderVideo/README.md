# Render Video Function

This Supabase Edge Function renders videos by combining images and audio using FFmpeg.

## Features

- **Multi-scene video assembly**: Combines multiple images with audio into a cohesive video
- **Text overlays**: Adds subtitles and text overlays to scenes
- **Multiple output formats**: Supports MP4 and WebM formats
- **Resolution control**: 480p, 720p, and 1080p output resolutions
- **Progress tracking**: Real-time progress updates stored in Supabase
- **Error handling**: Comprehensive error handling with cleanup

## API Usage

### Request

```typescript
POST /functions/v1/renderVideo

{
  "projectId": "project-uuid",
  "scenes": [
    {
      "id": "scene-1",
      "imageUrl": "https://example.com/image1.jpg",
      "audioUrl": "https://example.com/audio1.mp3",
      "duration": 5.0,
      "textOverlays": [
        {
          "text": "Welcome to our video",
          "position": { "x": 100, "y": 100 },
          "fontSize": 24,
          "color": "#FFFFFF",
          "startTime": 0,
          "endTime": 3
        }
      ]
    }
  ],
  "outputFormat": "mp4",
  "resolution": "1080p",
  "includeSubtitles": true
}
```

### Response

```typescript
{
  "success": true,
  "videoUrl": "https://supabase-storage-url/video.mp4",
  "message": "Video rendered successfully"
}
```

## Deployment Requirements

1. **FFmpeg installation**: Ensure FFmpeg is installed on your Supabase Edge Function runtime
2. **Storage permissions**: The function needs access to the `media` bucket in Supabase Storage
3. **Database permissions**: Update permissions for the `media_projects` table to allow the function to update render progress

## Database Schema Updates

Add these columns to your `media_projects` table:

```sql
ALTER TABLE media_projects
ADD COLUMN scenes JSONB,
ADD COLUMN settings JSONB,
ADD COLUMN export_url TEXT,
ADD COLUMN export_options JSONB,
ADD COLUMN render_progress JSONB;
```

## Progress Tracking

The function updates the `render_progress` column with real-time status:

```json
{
  "stage": "rendering",
  "progress": 60,
  "message": "Rendering video...",
  "estimatedTimeRemaining": 45
}
```

Stages:

- `preparing`: Initial setup
- `downloading`: Downloading media files
- `processing`: Processing scenes
- `rendering`: FFmpeg rendering
- `uploading`: Uploading final video
- `complete`: Finished successfully

## Error Handling

If rendering fails, the project status is set to 'error' with error details in the `render_progress` field.
