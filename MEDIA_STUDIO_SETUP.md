# Media Studio Setup Instructions

The Media Studio is a comprehensive AI-powered media generation platform with support for images, videos, and audio content creation.

## 🚀 Features

### AI Generation

- **Image Generation**: MidJourney/Ideogram integration stubs
- **Video Generation**: HeyGen/Sora integration stubs
- **Audio Generation**: ElevenLabs integration stubs
- **Prompt-based Creation**: Natural language prompts for content generation
- **Real-time Preview**: Instant preview of generated media
- **Save to Library**: Store generated content in organized library

### File Management

- **Drag-and-drop Upload**: Easy file upload interface
- **Media Library**: Organized storage of generated and uploaded media
- **Asset Management**: View, download, and manage all media assets
- **File Organization**: Automatic categorization by media type

## 🛠️ Setup

### Prerequisites

Before using the Media Studio, you need to set up the required database tables and storage buckets.

### 1. Database Setup

Run the database setup to create the required tables:

```bash
npm run setup-db
```

This creates the following tables:

- `public.media_assets` - Stores metadata for generated and uploaded media
- `public.company_config` - Stores system configuration settings

Execute the media assets table migration:

```sql
-- Run the contents of media_assets_table.sql
-- This creates the media_assets table for storing AI-generated content
```

Execute the company config table migration:

```sql
-- Run the contents of company_config_table.sql
-- This creates the company_config table for system settings
```

### 2. Storage Bucket Setup

Create the media storage bucket:

```bash
node create_media_bucket.js
```

**Note:** You'll need to set the `SUPABASE_SERVICE_ROLE_KEY` environment variable for bucket creation.

Alternatively, manually create the bucket:

1. Go to your Supabase project dashboard
2. Navigate to **Storage**
3. Create a new bucket named `media`
4. Set it to **public access**
5. Configure settings:
   - Allowed MIME types: `image/*, video/*, audio/*`
   - File size limit: 100MB (or your preferred limit)

### 3. Environment Variables

Set the following environment variables in your `.env.local` file:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Provider APIs (Optional - for real AI generation)
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_MIDJOURNEY_API_KEY=your_midjourney_api_key
VITE_IDEOGRAM_API_KEY=your_ideogram_api_key
VITE_HEYGEN_API_KEY=your_heygen_api_key
VITE_SORA_API_KEY=your_sora_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Supabase Service Role (Required for bucket creation)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🎨 Usage

### AI Generation

1. **Navigate to Media Studio**

   - Access the Media Studio page from the main navigation

2. **Select Generation Type**

   - Choose from three tabs: Image, Video, or Audio generation

3. **Create Content**

   - Enter a natural language prompt describing your desired content
   - Click "Generate" to create the media
   - View real-time preview of generated content

4. **Save to Library**
   - Click "Save to Library" on any generated media
   - Content is automatically uploaded to Supabase Storage
   - Metadata is stored in the media_assets table

### File Upload

1. **Upload Existing Media**

   - Drag and drop files onto the upload zone
   - Or click "Select Files" to browse your computer
   - Supported formats: Images, Videos, Audio files

2. **Manage Library**
   - View all uploaded and generated media
   - Download files directly from the library
   - Organize content by type and creation date

## 🔧 Integration

### AI Service Integration

The Media Studio includes integration stubs for major AI services. To enable real AI generation:

#### Image Generation

```typescript
// Replace in src/pages/MediaStudio.tsx
const generateImage = async (prompt: string) => {
  // MidJourney/Ideogram API integration
  const response = await fetch('https://api.midjourney.com/generate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_MIDJOURNEY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const result = await response.json();
  return result.imageUrl;
};
```

#### Video Generation

```typescript
// Replace in src/pages/MediaStudio.tsx
const generateVideo = async (prompt: string) => {
  // HeyGen/Sora API integration
  const response = await fetch('https://api.heygen.com/generate-video', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_HEYGEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const result = await response.json();
  return result.videoUrl;
};
```

#### Audio Generation

```typescript
// Replace in src/pages/MediaStudio.tsx
const generateAudio = async (prompt: string) => {
  // ElevenLabs API integration
  const response = await fetch('https://api.elevenlabs.io/generate-audio', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_ELEVENLABS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const result = await response.json();
  return result.audioUrl;
};
```

## 📊 Database Schema

### media_assets Table

```sql
CREATE TABLE public.media_assets (
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
```

### company_config Table

```sql
CREATE TABLE public.company_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔒 Security Considerations

- **File Upload Limits**: Configure appropriate file size limits in Supabase Storage
- **MIME Type Validation**: Only allow safe file types for upload
- **Access Control**: Use Supabase RLS policies to control media access
- **API Keys**: Store AI service API keys securely as environment variables
- **Rate Limiting**: Implement rate limiting for AI generation requests

## 🎯 Current Status

### Implemented Features

- ✅ Tabbed interface for different media types
- ✅ Prompt-based AI generation (stubs)
- ✅ Real-time media preview
- ✅ Save to library functionality
- ✅ Media library with organization
- ✅ Drag-and-drop file upload
- ✅ Supabase Storage integration
- ✅ Database integration for asset management
- ✅ Responsive cosmic theme design
- ✅ Error handling and success messages

### Ready for Integration

- 🔄 MidJourney/Ideogram API integration points
- 🔄 HeyGen/Sora API integration points
- 🔄 ElevenLabs API integration points
- 🔄 Webhook triggers for media generation events

## 🐛 Troubleshooting

### Common Issues

1. **Generation Not Working**

   - Check that AI service API keys are configured
   - Verify network connectivity to AI services
   - Check browser console for error messages

2. **Upload Failures**

   - Ensure Supabase Storage bucket is created
   - Check file size limits
   - Verify MIME type permissions

3. **Database Errors**
   - Ensure media_assets table is created
   - Check Supabase connection settings
   - Verify RLS policies are configured

### Debug Mode

Enable debug logging by checking the browser console. All Media Studio operations include detailed logging for troubleshooting.

## 🚀 Future Enhancements

- **Batch Generation**: Generate multiple assets simultaneously
- **Template System**: Save and reuse successful prompts
- **Collaboration**: Share generated content with team members
- **Analytics**: Track generation success rates and usage patterns
- **Advanced Filtering**: Filter media library by date, type, AI service
- **Export Options**: Bulk download and export capabilities
