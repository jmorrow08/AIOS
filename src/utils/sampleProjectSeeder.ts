import { TimelineState, Clip, Track } from '@/lib/types';
import { createDefaultTimeline, addClipToTrack } from './timelineUtils';
import { getDefaultProjectSettings } from './mediaServices';

/**
 * Creates a sample timeline with pre-populated clips for testing Media Studio V2
 */
export const createSampleTimeline = (): TimelineState => {
  const settings = getDefaultProjectSettings();
  let timelineState = createDefaultTimeline(settings);

  // Sample video clips
  const sampleVideoClips: Partial<Clip>[] = [
    {
      title: 'Introduction',
      startTime: 0,
      duration: 8,
      content: {
        prompt: 'A cinematic introduction scene with cosmic background and title overlay',
        text: 'Welcome to Media Studio V2',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
    {
      title: 'Main Content',
      startTime: 8,
      duration: 12,
      content: {
        prompt: 'Professional business presentation with modern office setting',
        text: 'Discover the power of AI-driven content creation',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
    {
      title: 'Features Demo',
      startTime: 20,
      duration: 10,
      content: {
        prompt: 'Technology interface showing AI tools and automation features',
        text: 'Advanced timeline editing with drag-and-drop functionality',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
    {
      title: 'Conclusion',
      startTime: 30,
      duration: 6,
      content: {
        prompt: 'Motivational ending scene with call-to-action overlay',
        text: 'Start creating amazing content today!',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
  ];

  // Sample audio clips
  const sampleAudioClips: Partial<Clip>[] = [
    {
      title: 'Intro Narration',
      startTime: 0,
      duration: 8,
      content: {
        prompt: 'Warm, professional male voice introducing the product',
        text: 'Welcome to the next generation of content creation with Media Studio V2',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
    {
      title: 'Main Narration',
      startTime: 8,
      duration: 12,
      content: {
        prompt: 'Clear, engaging female voice explaining features',
        text: 'Our AI-powered platform makes it easy to create professional videos, images, and audio content',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
    {
      title: 'Demo Narration',
      startTime: 20,
      duration: 10,
      content: {
        prompt: 'Enthusiastic voice demonstrating features',
        text: 'Watch as we showcase the powerful timeline editor with multi-track support',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
    {
      title: 'Outro Narration',
      startTime: 30,
      duration: 6,
      content: {
        prompt: 'Motivational closing voice',
        text: 'Join thousands of creators who trust Media Studio V2 for their content needs',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
  ];

  // Sample text clips
  const sampleTextClips: Partial<Clip>[] = [
    {
      title: 'Title Card',
      startTime: 2,
      duration: 4,
      content: {
        text: 'MEDIA STUDIO V2\nThe Future of Content Creation',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
    {
      title: 'Feature Highlight',
      startTime: 22,
      duration: 3,
      content: {
        text: '✨ AI-Powered\n🎬 Professional Timeline\n🚀 One-Click Export',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
    {
      title: 'Call to Action',
      startTime: 32,
      duration: 4,
      content: {
        text: 'START CREATING\nGet Started Today →',
      },
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    },
  ];

  // Add video clips
  const videoTrack = timelineState.tracks.find((t) => t.type === 'video');
  if (videoTrack) {
    sampleVideoClips.forEach((clipData) => {
      const clip: Clip = {
        id: `sample-video-${Date.now()}-${Math.random()}`,
        trackId: videoTrack.id,
        type: 'video',
        ...clipData,
        endTime: (clipData.startTime || 0) + (clipData.duration || 5),
        content: clipData.content || {},
        effects: {},
        metadata: clipData.metadata || {
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          aiGenerated: false,
        },
      };
      timelineState = addClipToTrack(timelineState, videoTrack.id, clip);
    });
  }

  // Add audio clips
  const audioTrack = timelineState.tracks.find((t) => t.type === 'audio');
  if (audioTrack) {
    sampleAudioClips.forEach((clipData) => {
      const clip: Clip = {
        id: `sample-audio-${Date.now()}-${Math.random()}`,
        trackId: audioTrack.id,
        type: 'audio',
        ...clipData,
        endTime: (clipData.startTime || 0) + (clipData.duration || 5),
        content: clipData.content || {},
        effects: {},
        metadata: clipData.metadata || {
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          aiGenerated: false,
        },
      };
      timelineState = addClipToTrack(timelineState, audioTrack.id, clip);
    });
  }

  // Add text clips
  const textTrack = timelineState.tracks.find((t) => t.type === 'text');
  if (textTrack) {
    sampleTextClips.forEach((clipData) => {
      const clip: Clip = {
        id: `sample-text-${Date.now()}-${Math.random()}`,
        trackId: textTrack.id,
        type: 'text',
        ...clipData,
        endTime: (clipData.startTime || 0) + (clipData.duration || 5),
        content: clipData.content || {},
        effects: {},
        metadata: clipData.metadata || {
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          aiGenerated: false,
        },
      };
      timelineState = addClipToTrack(timelineState, textTrack.id, clip);
    });
  }

  // Update total duration
  const allClips = timelineState.tracks.flatMap((track) => track.clips);
  const maxEndTime = Math.max(...allClips.map((clip) => clip.endTime), 60);

  return {
    ...timelineState,
    totalDuration: maxEndTime,
  };
};

/**
 * Seeds the Media Studio with a complete sample project for demonstration
 */
export const seedSampleProject = () => {
  const sampleTimeline = createSampleTimeline();

  return {
    timeline: sampleTimeline,
    metadata: {
      title: 'Media Studio V2 Demo Project',
      description:
        'A sample project showcasing timeline editing, multi-track support, and AI content generation',
      tags: ['demo', 'tutorial', 'media-studio-v2'],
      createdAt: new Date().toISOString(),
    },
  };
};
