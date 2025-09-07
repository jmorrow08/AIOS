// Database types
export interface Document {
  id: string;
  title: string;
  category: string;
  content: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type DocumentCategory = 'All' | 'SOPs' | 'Templates' | 'Knowledge' | 'Summaries' | 'General';

// AI and search types
export interface AIDraftRequest {
  description: string;
  category: string;
  title?: string;
}

export interface AISummaryRequest {
  documentId: string;
  content: string;
}

export interface QnARequest {
  question: string;
}

export interface QnAResponse {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    excerpt: string;
  }>;
}

// Component state types
export interface DocumentFilters {
  category: DocumentCategory;
  searchQuery: string;
}

export type EditorMode = 'view' | 'edit' | 'create' | null;

// Media Studio Types
export interface Scene {
  id: string;
  title: string;
  script: string;
  imageUrl?: string;
  imagePrompt?: string;
  audioUrl?: string;
  audioPrompt?: string;
  duration: number; // in seconds
  textOverlays?: TextOverlay[];
  order: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  startTime: number;
  endTime: number;
}

export interface MediaProjectSettings {
  imageService: 'dalle' | 'stability' | 'midjourney';
  audioService: 'elevenlabs' | 'google-tts';
  videoService: 'heygen' | 'sora' | 'hedra';
  promptRewriterEnabled: boolean;
  outputFormat: 'mp4' | 'webm';
  resolution: '1080p' | '720p' | '480p';
}

export interface VideoExportOptions {
  format: 'mp4' | 'webm';
  resolution: '1080p' | '720p' | '480p';
  quality: 'high' | 'medium' | 'low';
  includeSubtitles: boolean;
  publishToLibrary: boolean;
}

export interface RenderProgress {
  stage:
    | 'preparing'
    | 'downloading'
    | 'processing'
    | 'rendering'
    | 'uploading'
    | 'complete'
    | 'error';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // in seconds
}
