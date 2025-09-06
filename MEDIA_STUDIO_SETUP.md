# Media Studio Setup Instructions

## Prerequisites

Before using the Media Studio page, you need to set up a Supabase storage bucket.

## 1. Create the Media Bucket

Run the provided script to create the 'media' bucket:

```bash
node create_media_bucket.js
```

**Note:** You'll need to set the `SUPABASE_SERVICE_ROLE_KEY` environment variable for bucket creation. This key should be kept secure and not committed to version control.

Alternatively, you can manually create the bucket in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket named `media`
4. Set it to public access
5. Configure the following settings:
   - Allowed MIME types: `image/*, video/*`
   - File size limit: 100MB (or your preferred limit)

## 2. Environment Variables

Make sure you have the following environment variables set:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Only needed for bucket creation
```

## 3. Features

The Media Studio now supports:

- ✅ Drag-and-drop file upload
- ✅ Image and video file previews
- ✅ Upload progress tracking
- ✅ File management (View, Delete, Generate AI Content)
- ✅ Responsive cosmic theme design
- ✅ Error handling and success messages

## 4. Usage

1. Navigate to the Media Studio page
2. Drag and drop files or click "Select Files"
3. Preview files before uploading
4. Upload individual files or remove them
5. Manage uploaded files with View, Delete, and AI Content generation

## 5. AI Content Generation

The "Generate AI Content" feature currently shows dummy content. To integrate with actual AI services like ElevenLabs or DALL·E:

1. Replace the `generateAIContent` function with actual API calls
2. Add proper error handling for API failures
3. Implement loading states for AI processing
