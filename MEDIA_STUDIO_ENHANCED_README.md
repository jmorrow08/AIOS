# Enhanced Media Studio

A comprehensive AI-powered media creation pipeline with timeline editing, prompt rewriting, and video assembly capabilities.

## 🚀 Features

### 1. **Timeline Editor**

- **Drag & Drop Interface**: Visual scene management with intuitive card-based UI
- **Scene Management**: Add, edit, reorder, and delete scenes with ease
- **Multi-Modal Content**: Each scene supports script, image, and audio
- **Duration Control**: Set custom durations for each scene (in seconds)
- **Real-time Preview**: Instant preview of scene sequence and timing

### 2. **AI Prompt Rewriter**

- **GPT-4 Integration**: Automatically enhances prompts for better AI generation
- **Context-Aware**: Different rewriting strategies for image, audio, and video content
- **Toggle Control**: Enable/disable prompt rewriting per project
- **Cost Tracking**: Integrated with budget management system

### 3. **Tool Switching**

- **Multiple AI Services**:
  - **Image**: DALL-E, Stability AI, Midjourney
  - **Audio**: ElevenLabs, Google Text-to-Speech
  - **Video**: HeyGen, Sora, Hedra
- **Supabase Persistence**: Settings saved automatically to user preferences
- **Fallback Support**: Automatic fallback to alternative services if primary fails

### 4. **Video Assembly**

- **FFmpeg Backend**: Server-side video rendering with FFmpeg
- **Multi-Format Support**: MP4 and WebM output formats
- **Resolution Options**: 480p, 720p, 1080p output resolutions
- **Progress Tracking**: Real-time rendering progress with detailed status updates
- **Error Handling**: Comprehensive error recovery and cleanup

### 5. **Export & Publishing**

- **Direct Download**: Download rendered videos to local storage
- **Knowledge Library Integration**: One-click publishing to Knowledge Library
- **Multiple Formats**: Support for different video formats and qualities
- **Supabase Storage**: Secure cloud storage with public URLs

## 🛠️ Technical Architecture

### Frontend Components

- **React + TypeScript**: Type-safe component architecture
- **Shadcn/UI**: Consistent, accessible UI components
- **Tailwind CSS**: Responsive design with cosmic theme
- **Functional Components**: Modern React patterns with hooks

### Backend Services

- **Supabase Edge Functions**: Serverless video rendering
- **Supabase Storage**: File storage and delivery
- **Supabase Database**: Project and asset metadata
- **FFmpeg**: Video processing and assembly

### AI Service Integration

- **OpenAI GPT-4**: Script generation and prompt rewriting
- **DALL-E**: High-quality image generation
- **Stability AI**: Alternative image generation
- **ElevenLabs**: Professional voice synthesis
- **Google TTS**: Cost-effective audio generation

## 📋 Workflow

### Video Creation Pipeline

1. **Setup Phase**

   - Choose AI tools (image, audio, video services)
   - Configure prompt rewriting preferences
   - Enter project brief and basic information

2. **Script Generation**

   - AI generates structured script with scene breakdowns
   - Automatic parsing into editable scenes
   - Manual editing and refinement capabilities

3. **Timeline Editing**

   - Add/edit/delete scenes as needed
   - Set scene durations and reorder sequence
   - Generate images and audio for each scene
   - Preview timeline with visual thumbnails

4. **Content Generation**

   - **Images**: AI-generated visuals for each scene
   - **Audio**: Professional narration with voice selection
   - **Prompt Rewriting**: Optional enhancement of all prompts

5. **Video Assembly**

   - Backend rendering with FFmpeg
   - Progress tracking and status updates
   - Error handling and retry mechanisms

6. **Export & Publishing**
   - Download rendered video locally
   - Publish to Knowledge Library
   - Share public URLs

### Image Creation Pipeline

1. **Configuration**: Select AI service and enable prompt rewriting
2. **Generation**: Single image creation with optional variations
3. **Export**: Save to project library or download directly

## 🔧 Configuration

### API Keys Setup

Configure API keys in the Media Studio settings panel:

- `openai_api_key`: For GPT-4 script generation and prompt rewriting
- `dalle_api_key`: For DALL-E image generation
- `stability_api_key`: For Stability AI image generation
- `elevenlabs_api_key`: For ElevenLabs voice synthesis

### Project Settings

Each project supports:

- **AI Service Selection**: Choose preferred services per media type
- **Prompt Rewriting**: Enable/disable automatic prompt enhancement
- **Output Format**: MP4/WebM selection
- **Resolution**: 480p/720p/1080p options

## 📊 Database Schema

### Enhanced media_projects Table

```sql
ALTER TABLE media_projects
ADD COLUMN scenes JSONB,           -- Scene data with media URLs
ADD COLUMN settings JSONB,         -- AI service preferences
ADD COLUMN export_url TEXT,        -- Rendered video URL
ADD COLUMN export_options JSONB,   -- Export configuration
ADD COLUMN render_progress JSONB;  -- Rendering status
```

### Scene Data Structure

```typescript
interface Scene {
  id: string;
  title: string;
  script: string;
  imageUrl?: string;
  imagePrompt?: string;
  audioUrl?: string;
  audioPrompt?: string;
  duration: number;
  textOverlays?: TextOverlay[];
  order: number;
}
```

## 🚀 Deployment

### Prerequisites

1. **Supabase Project**: Active Supabase project with database and storage
2. **FFmpeg**: Installed on Supabase Edge Function runtime
3. **API Keys**: Valid API keys for selected AI services

### Setup Steps

1. Run database migration: `20250120_media_studio_enhancements.sql`
2. Deploy Edge Function: `renderVideo/index.ts`
3. Configure environment variables for API keys
4. Update storage bucket permissions for media uploads

### Environment Variables

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
DALLE_API_KEY=your_dalle_key
STABILITY_API_KEY=your_stability_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

## 💰 Cost Estimation

### Per Project Costs (Approximate)

- **Script Generation**: $0.02 (GPT-4)
- **Image Generation**: $0.04/image (DALL-E) or $0.03 (Stability AI)
- **Audio Generation**: $0.15/minute (ElevenLabs)
- **Prompt Rewriting**: $0.01 per rewrite (GPT-4)
- **Video Storage**: Supabase Storage costs

### Budget Management

- Integrated with existing budget tracking system
- Real-time cost calculation and warnings
- Automatic fallback to cheaper alternatives
- Usage logging for all AI service calls

## 🎯 Best Practices

### Content Creation

1. **Start with Clear Briefs**: Well-defined project briefs yield better AI-generated content
2. **Iterate on Scenes**: Use the timeline editor to refine scenes before generation
3. **Enable Prompt Rewriting**: Improves quality of AI-generated content
4. **Test Small First**: Generate single scenes before full video production

### Performance Optimization

1. **Batch Generation**: Generate multiple scenes in sequence for efficiency
2. **Caching**: Reuse generated assets across projects when possible
3. **Resolution Planning**: Choose appropriate resolution based on target platform
4. **Storage Management**: Regularly clean up unused assets

### Error Handling

1. **Fallback Services**: Configure multiple AI services for redundancy
2. **Progress Monitoring**: Use real-time progress tracking for long operations
3. **Retry Mechanisms**: Automatic retry for transient failures
4. **Cost Monitoring**: Set budget limits to prevent unexpected charges

## 🔮 Future Enhancements

### Planned Features

- **Advanced Timeline Editing**: Drag-and-drop reordering with visual timeline
- **Text Overlay Editor**: Visual text overlay positioning and animation
- **Multi-track Audio**: Background music and sound effects support
- **Batch Processing**: Generate multiple projects simultaneously
- **Template System**: Reusable project templates and presets
- **Collaboration**: Multi-user project editing and review
- **Analytics**: Usage statistics and performance metrics

### Integration Opportunities

- **HeyGen API**: Real video generation with avatars
- **Sora Integration**: Advanced video generation capabilities
- **Zapier Integration**: Workflow automation and third-party connections
- **Social Media Publishing**: Direct publishing to platforms

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**: Verify API keys are correctly configured in settings
2. **Rendering Failures**: Check FFmpeg installation and video format compatibility
3. **Storage Upload Errors**: Verify Supabase storage permissions and quota
4. **Budget Exceeded**: Monitor usage and adjust budget limits as needed

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` for detailed error information.

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Supabase function logs for backend errors
3. Verify API key validity and permissions
4. Check network connectivity for external API calls

---

_This enhanced Media Studio provides a complete AI-powered content creation pipeline, from concept to final video, with professional-grade tools and seamless integration._
