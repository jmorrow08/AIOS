import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CosmicBackground } from '@/components/CosmicBackground';
import { RadialMenu } from '@/components/RadialMenu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// V2 Components
import { TimelineEditor } from '@/components/TimelineEditor';
import PromptRewriter from '@/components/PromptRewriter';
import MultiToolSelector from '@/components/MultiToolSelector';
import ExportPanel from '@/components/ExportPanel';

// API and utilities
import { createMediaAsset, getMediaAssets, MediaAsset } from '@/api/mediaAssets';
import {
  createMediaProject,
  getMediaProjects,
  updateMediaProject,
  MediaProject,
} from '@/api/mediaProjects';
import { getSettingsByCategory, upsertSetting, Setting } from '@/api/settings';
import {
  Scene,
  MediaProjectSettings,
  VideoExportOptions,
  RenderProgress,
  TextOverlay,
  TimelineState,
  Clip,
  TrackType,
  MediaStudioV2State,
} from '@/lib/types';
import {
  rewritePrompt,
  generateImage,
  generateAudio,
  uploadMediaToStorage,
  validateScene,
  getDefaultProjectSettings,
  saveProjectSettings,
  loadProjectSettings,
} from '@/utils/mediaServices';
import {
  createDefaultTimeline,
  addTrack,
  addClipToTrack,
  removeClip,
  updateClip,
  moveClip,
  autoSyncAudio,
  calculateTotalDuration as calculateTimelineDuration,
} from '@/utils/timelineUtils';
import { seedSampleProject } from '@/utils/sampleProjectSeeder';

// V2 State management
const MediaStudio: React.FC = () => {
  const [studioState, setStudioState] = useState<MediaStudioV2State>({
    currentTab: 'projects',
    timelineState: createDefaultTimeline(getDefaultProjectSettings()),
    selectedProject: undefined,
    isGeneratingClip: false,
    isExporting: false,
  });

  // Legacy state for backward compatibility (will be phased out)
  const [activeTab, setActiveTab] = useState<'create' | 'library'>('create');
  const [project, setProject] = useState<any>({
    type: 'image',
    title: '',
    brief: '',
    script: '',
    scenes: [],
    settings: getDefaultProjectSettings(),
    exportOptions: {
      format: 'mp4',
      resolution: '1080p',
      quality: 'high',
      includeSubtitles: false,
      publishToLibrary: false,
      publishToSocial: false,
      socialPlatforms: [],
      metadata: {
        title: '',
        description: '',
        tags: [],
      },
    },
    currentVideoStep: 'setup',
    isGenerating: false,
    isRendering: false,
  });
  const [mediaProjects, setMediaProjects] = useState<MediaProject[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({
    openai_api_key: '',
    stability_api_key: '',
    elevenlabs_api_key: '',
    dalle_api_key: '',
  });
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadProjects();
    loadMediaAssets();
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    const { data, error } = await getSettingsByCategory('ai_api_keys');
    if (!error && data) {
      const keys = (data as Setting[]).reduce((acc, setting) => {
        acc[setting.key] = setting.value || '';
        return acc;
      }, {} as { [key: string]: string });
      setApiKeys((prev) => ({ ...prev, ...keys }));
    }
  };

  const loadProjects = async () => {
    const { data, error } = await getMediaProjects();
    if (!error && data) {
      setMediaProjects(data as MediaProject[]);
    }
  };

  const loadMediaAssets = async () => {
    const { data, error } = await getMediaAssets();
    if (!error && data) {
      setMediaAssets(data as MediaAsset[]);
    }
  };

  const updateProject = (updates: Partial<any>) => {
    setProject((prev) => ({ ...prev, ...updates }));
  };

  // V2 State management methods
  const updateStudioState = (updates: Partial<MediaStudioV2State>) => {
    setStudioState((prev) => ({ ...prev, ...updates }));
  };

  const updateTimelineState = (newTimelineState: TimelineState) => {
    updateStudioState({ timelineState: newTimelineState });
  };

  // Timeline management methods
  const handleClipSelect = useCallback(
    (clipIds: string[]) => {
      updateTimelineState({
        ...studioState.timelineState,
        selectedClipIds: clipIds,
      });
    },
    [studioState.timelineState],
  );

  const handleClipEdit = useCallback((clip: Clip) => {
    // Open clip editing dialog (to be implemented)
    console.log('Edit clip:', clip);
  }, []);

  const handlePlayPause = useCallback(() => {
    updateTimelineState({
      ...studioState.timelineState,
      isPlaying: !studioState.timelineState.isPlaying,
    });
  }, [studioState.timelineState]);

  // Generate content for timeline
  const generateClipContent = async (clip: Clip, prompt: string) => {
    updateStudioState({ isGeneratingClip: true });

    try {
      let result;

      switch (clip.type) {
        case 'video':
          result = await generateImage(prompt, project.settings.imageService, {
            agentId: 'media-studio-v2',
          });
          if (result.success && result.imageUrl) {
            updateClip(studioState.timelineState, clip.id, {
              content: { ...clip.content, mediaUrl: result.imageUrl, prompt },
              metadata: {
                ...clip.metadata,
                aiGenerated: true,
                serviceUsed: project.settings.imageService,
                modifiedAt: new Date().toISOString(),
              },
            });
          }
          break;

        case 'audio':
          result = await generateAudio(prompt, project.settings.audioService, {
            agentId: 'media-studio-v2',
          });
          if (result.success && result.audioUrl) {
            updateClip(studioState.timelineState, clip.id, {
              content: { ...clip.content, mediaUrl: result.audioUrl, prompt },
              metadata: {
                ...clip.metadata,
                aiGenerated: true,
                serviceUsed: project.settings.audioService,
                modifiedAt: new Date().toISOString(),
              },
            });
          }
          break;

        case 'text':
          // For text clips, just update the content
          updateClip(studioState.timelineState, clip.id, {
            content: { ...clip.content, text: prompt },
            metadata: {
              ...clip.metadata,
              modifiedAt: new Date().toISOString(),
            },
          });
          break;
      }
    } catch (error) {
      console.error('Content generation error:', error);
      updateProject({
        message: { type: 'error', text: 'Failed to generate content' },
      });
    } finally {
      updateStudioState({ isGeneratingClip: false });
    }
  };

  // Add new clip to timeline
  const addNewClip = (trackType: TrackType, title: string = 'New Clip') => {
    const videoTracks = studioState.timelineState.tracks.filter((t) => t.type === 'video');
    const targetTrack =
      videoTracks.length > 0 ? videoTracks[0] : studioState.timelineState.tracks[0];

    if (!targetTrack) return;

    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      trackId: targetTrack.id,
      type: trackType,
      title,
      startTime: studioState.timelineState.currentTime,
      duration: 5,
      endTime: studioState.timelineState.currentTime + 5,
      content: {},
      effects: {},
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        aiGenerated: false,
      },
    };

    updateTimelineState(addClipToTrack(studioState.timelineState, targetTrack.id, newClip));
  };

  const setProjectType = (type: ProjectType) => {
    updateProject({
      type,
      currentVideoStep: type === 'video' ? 'setup' : 'setup',
      title: '',
      brief: '',
      script: '',
      scenes: [],
      settings: getDefaultProjectSettings(),
      exportOptions: {
        format: 'mp4',
        resolution: '1080p',
        quality: 'high',
        includeSubtitles: false,
        publishToLibrary: false,
      },
    });
  };

  const saveApiKey = async (key: string, value: string) => {
    const { error } = await upsertSetting(key, {
      value,
      description: `${key.replace('_', ' ').toUpperCase()} for AI services`,
      category: 'ai_api_keys',
      is_encrypted: true,
    });

    if (error) {
      updateProject({ message: { type: 'error', text: 'Failed to save API key' } });
    } else {
      setApiKeys((prev) => ({ ...prev, [key]: value }));
      updateProject({ message: { type: 'success', text: 'API key saved successfully' } });
    }
  };

  const checkApiKey = (service: string): boolean => {
    const keyMap: { [key: string]: string } = {
      openai: 'openai_api_key',
      stability: 'stability_api_key',
      dalle: 'dalle_api_key',
      elevenlabs: 'elevenlabs_api_key',
    };

    const keyName = keyMap[service];
    if (!keyName || !apiKeys[keyName]) {
      updateProject({
        message: {
          type: 'error',
          text: `Please set your ${service.toUpperCase()} API key in settings`,
        },
      });
      setShowApiSettings(true);
      return false;
    }
    return true;
  };

  // Generate script and convert to scenes
  const generateScript = async () => {
    if (!project.brief.trim()) {
      updateProject({ message: { type: 'error', text: 'Please enter a project brief' } });
      return;
    }

    if (!checkApiKey('openai')) return;

    updateProject({ isGenerating: true, message: undefined });

    try {
      // TODO: Replace with actual OpenAI API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockScript = `Scene 1: Introduction to ${project.brief}

      Welcome to our comprehensive guide about ${project.brief}. In this video, we'll explore the key concepts and practical applications that make this topic essential for modern understanding.

      Scene 2: Key Concepts

      Let's dive into the fundamental principles. The core elements include strategic planning, implementation strategies, and continuous improvement methodologies.

      Scene 3: Real-world Applications

      In practice, these concepts manifest in various scenarios. Organizations worldwide have successfully adopted these approaches to achieve remarkable results.

      Scene 4: Future Outlook

      Looking ahead, the landscape continues to evolve. Emerging technologies and innovative approaches promise to further enhance our capabilities.

      Scene 5: Conclusion

      In summary, mastering ${project.brief} opens doors to unprecedented opportunities. The journey of continuous learning and adaptation is just beginning.`;

      // Parse script into scenes
      const scenes = parseScriptIntoScenes(mockScript);

      updateProject({
        script: mockScript,
        scenes,
        currentVideoStep: 'timeline',
        isGenerating: false,
        message: {
          type: 'success',
          text: 'Script generated successfully! Scenes created for timeline editing.',
        },
      });
    } catch (error) {
      updateProject({
        isGenerating: false,
        message: { type: 'error', text: 'Failed to generate script' },
      });
    }
  };

  // Parse script text into Scene objects
  const parseScriptIntoScenes = (script: string): Scene[] => {
    const sceneBlocks = script.split(/\n\s*Scene \d+:/).filter((block) => block.trim());
    const sceneTitles = script.match(/Scene \d+:\s*[^\n]+/g) || [];

    return sceneBlocks.map((content, index) => ({
      id: `scene-${Date.now()}-${index}`,
      title: sceneTitles[index]?.replace(/Scene \d+:\s*/, '') || `Scene ${index + 1}`,
      script: content.trim(),
      duration: 5, // Default 5 seconds per scene
      order: index,
    }));
  };

  // Generate image for a scene with optional prompt rewriting
  const generateSceneImage = async (sceneIndex: number) => {
    const scene = project.scenes[sceneIndex];
    if (!scene) return;

    let promptToUse = scene.imagePrompt || scene.script;

    // Apply prompt rewriting if enabled
    if (project.settings.promptRewriterEnabled) {
      updateProject({
        isGenerating: true,
        message: { type: 'info', text: 'Rewriting prompt for better results...' },
      });

      const rewriteResult = await rewritePrompt(promptToUse, 'image');
      if (rewriteResult.success && rewriteResult.rewrittenPrompt) {
        promptToUse = rewriteResult.rewrittenPrompt;
        // Update the scene with the rewritten prompt
        updateScene(sceneIndex, { imagePrompt: promptToUse });
      }
    }

    updateProject({ isGenerating: true, message: { type: 'info', text: 'Generating image...' } });

    try {
      const result = await generateImage(promptToUse, project.settings.imageService, {
        agentId: 'media-studio',
      });

      if (result.success && result.imageUrl) {
        updateScene(sceneIndex, { imageUrl: result.imageUrl });
        updateProject({
          isGenerating: false,
          message: { type: 'success', text: 'Image generated successfully!' },
        });
      } else {
        throw new Error(result.error || 'Failed to generate image');
      }
    } catch (error) {
      updateProject({
        isGenerating: false,
        message: { type: 'error', text: 'Failed to generate image' },
      });
    }
  };

  // Update a specific scene
  const updateScene = (sceneIndex: number, updates: Partial<Scene>) => {
    const updatedScenes = [...project.scenes];
    updatedScenes[sceneIndex] = { ...updatedScenes[sceneIndex], ...updates };
    updateProject({ scenes: updatedScenes });
  };

  const generateImageForProject = async () => {
    if (project.type === 'image') {
      // For image projects, create a single scene
      if (project.scenes.length === 0) {
        const newScene: Scene = {
          id: `scene-${Date.now()}`,
          title: 'Generated Image',
          script: project.brief,
          duration: 5,
          order: 0,
          imagePrompt: project.brief,
        };
        updateProject({ scenes: [newScene] });
      }

      await generateSceneImage(0);
    } else if (project.type === 'video') {
      // For video projects, generate images for all scenes
      if (project.scenes.length === 0) {
        updateProject({
          message: { type: 'error', text: 'No scenes found. Please generate a script first.' },
        });
        return;
      }

      for (let i = 0; i < project.scenes.length; i++) {
        if (!project.scenes[i].imageUrl) {
          await generateSceneImage(i);
        }
      }
    }
  };

  // Generate audio for a scene with optional prompt rewriting
  const generateSceneAudio = async (sceneIndex: number) => {
    const scene = project.scenes[sceneIndex];
    if (!scene) return;

    let textToUse = scene.script;

    // Apply prompt rewriting if enabled
    if (project.settings.promptRewriterEnabled) {
      updateProject({
        isGenerating: true,
        message: { type: 'info', text: 'Rewriting script for better narration...' },
      });

      const rewriteResult = await rewritePrompt(textToUse, 'audio');
      if (rewriteResult.success && rewriteResult.rewrittenPrompt) {
        textToUse = rewriteResult.rewrittenPrompt;
      }
    }

    updateProject({
      isGenerating: true,
      message: { type: 'info', text: 'Generating audio narration...' },
    });

    try {
      const result = await generateAudio(textToUse, project.settings.audioService, {
        agentId: 'media-studio',
      });

      if (result.success && result.audioUrl) {
        updateScene(sceneIndex, { audioUrl: result.audioUrl, audioPrompt: textToUse });
        updateProject({
          isGenerating: false,
          message: { type: 'success', text: 'Audio generated successfully!' },
        });
      } else {
        throw new Error(result.error || 'Failed to generate audio');
      }
    } catch (error) {
      updateProject({
        isGenerating: false,
        message: { type: 'error', text: 'Failed to generate audio' },
      });
    }
  };

  // Generate audio for all scenes
  const generateAllAudio = async () => {
    for (let i = 0; i < project.scenes.length; i++) {
      await generateSceneAudio(i);
    }
    updateProject({ currentVideoStep: 'preview' });
  };

  // Timeline management functions
  const addScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: `Scene ${project.scenes.length + 1}`,
      script: '',
      duration: 5,
      order: project.scenes.length,
    };
    updateProject({ scenes: [...project.scenes, newScene] });
  };

  const deleteScene = (sceneIndex: number) => {
    const updatedScenes = project.scenes.filter((_, index) => index !== sceneIndex);
    updateProject({ scenes: updatedScenes });
  };

  const reorderScenes = (fromIndex: number, toIndex: number) => {
    const updatedScenes = [...project.scenes];
    const [movedScene] = updatedScenes.splice(fromIndex, 1);
    updatedScenes.splice(toIndex, 0, movedScene);

    // Update order property
    updatedScenes.forEach((scene, index) => {
      scene.order = index;
    });

    updateProject({ scenes: updatedScenes });
  };

  // Render video using the backend function
  const renderVideo = async () => {
    if (!project.id) {
      updateProject({ message: { type: 'error', text: 'Please save the project first' } });
      return;
    }

    // Validate that all scenes have required assets
    const invalidScenes = project.scenes.filter(
      (scene) => !scene.imageUrl || !scene.audioUrl || !validateScene(scene).isValid,
    );

    if (invalidScenes.length > 0) {
      updateProject({
        message: {
          type: 'error',
          text: 'Please ensure all scenes have images and audio generated',
        },
      });
      return;
    }

    updateProject({
      isRendering: true,
      renderProgress: { stage: 'preparing', progress: 0, message: 'Preparing render...' },
    });

    try {
      const renderRequest = {
        projectId: project.id,
        scenes: project.scenes.map((scene) => ({
          id: scene.id,
          imageUrl: scene.imageUrl!,
          audioUrl: scene.audioUrl!,
          duration: scene.duration,
          textOverlays: scene.textOverlays || [],
        })),
        outputFormat: project.exportOptions.format,
        resolution: project.exportOptions.resolution,
        includeSubtitles: project.exportOptions.includeSubtitles,
      };

      const { data, error } = await supabase.functions.invoke('renderVideo', {
        body: renderRequest,
      });

      if (error) throw error;

      if (data.success) {
        updateProject({
          isRendering: false,
          renderProgress: {
            stage: 'complete',
            progress: 100,
            message: 'Video rendered successfully!',
          },
          currentVideoStep: 'export',
          message: { type: 'success', text: 'Video rendered successfully!' },
        });
      } else {
        throw new Error(data.error || 'Render failed');
      }
    } catch (error) {
      console.error('Render error:', error);
      updateProject({
        isRendering: false,
        renderProgress: { stage: 'error', progress: 0, message: 'Render failed' },
        message: { type: 'error', text: 'Failed to render video' },
      });
    }
  };

  // Export and publish functions
  const exportVideo = async () => {
    if (!project.id) return;

    try {
      // Get the rendered video URL from the project
      const { data: projectData, error } = await supabase
        .from('media_projects')
        .select('export_url')
        .eq('id', project.id)
        .single();

      if (error || !projectData?.export_url) {
        throw new Error('No rendered video found');
      }

      // Download the video
      const response = await fetch(projectData.export_url);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      updateProject({ message: { type: 'success', text: 'Video downloaded successfully!' } });
    } catch (error) {
      updateProject({ message: { type: 'error', text: 'Failed to download video' } });
    }
  };

  const publishToLibrary = async () => {
    if (!project.id) return;

    try {
      const { data: projectData, error } = await supabase
        .from('media_projects')
        .select('export_url')
        .eq('id', project.id)
        .single();

      if (error || !projectData?.export_url) {
        throw new Error('No rendered video found');
      }

      // Create media asset entry
      await createMediaAsset({
        title: project.title,
        description: project.brief,
        file_url: projectData.export_url,
        file_name: `${project.title}.mp4`,
        file_type: 'video/mp4',
        media_type: 'video',
        ai_service: 'MediaStudio',
      });

      updateProject({
        message: { type: 'success', text: 'Video published to Knowledge Library!' },
      });
    } catch (error) {
      updateProject({ message: { type: 'error', text: 'Failed to publish to library' } });
    }
  };

  // Save Project
  const saveProject = async () => {
    if (!project.title.trim()) {
      updateProject({ message: { type: 'error', text: 'Please enter a project title' } });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare project data with new structure
      const projectData = {
        title: project.title,
        type: project.type,
        description: `AI-generated ${project.type} project`,
        brief: project.brief,
        script: project.script,
        scenes: project.scenes,
        settings: project.settings,
        export_options: project.exportOptions,
        status: (project.type === 'video' && project.currentVideoStep === 'export'
          ? 'completed'
          : 'draft') as 'draft' | 'completed' | 'exported',
      };

      let savedProject;
      if (project.id) {
        // Update existing project
        const result = await updateMediaProject(project.id, projectData);
        if (result.error) throw result.error;
        savedProject = result.data;
      } else {
        // Create new project
        const result = await createMediaProject(projectData);
        if (result.error) throw result.error;
        savedProject = result.data;
      }

      // Update project with ID
      updateProject({
        id: savedProject.id,
        message: { type: 'success', text: 'Project saved successfully!' },
      });

      // Reload projects
      loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      updateProject({ message: { type: 'error', text: 'Failed to save project' } });
    } finally {
      setIsLoading(false);
    }
  };

  const renderProjectSetup = () => (
    <div className="space-y-6">
      <div className="bg-cosmic-light bg-opacity-10 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-cosmic-highlight mb-4">New Project</h2>

        <div className="space-y-4">
          <div>
            <Label className="text-cosmic-light">Project Type</Label>
            <div className="flex gap-4 mt-2">
              {[
                { type: 'image' as ProjectType, label: 'Image Creation', icon: '🖼️' },
                { type: 'video' as ProjectType, label: 'Video Slideshow', icon: '🎬' },
                { type: 'audio' as ProjectType, label: 'Audio Generation', icon: '🎵' },
              ].map(({ type, label, icon }) => (
                <Button
                  key={type}
                  onClick={() => setProjectType(type)}
                  variant={project.type === type ? 'default' : 'outline'}
                  className={`flex-1 ${
                    project.type === type
                      ? 'bg-cosmic-accent hover:bg-cosmic-accent-hover'
                      : 'border-cosmic-light text-cosmic-light hover:bg-cosmic-light hover:bg-opacity-20'
                  }`}
                >
                  {icon} {label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="title" className="text-cosmic-light">
              Project Title
            </Label>
            <Input
              id="title"
              placeholder="Enter project title..."
              value={project.title}
              onChange={(e) => updateProject({ title: e.target.value })}
              className="bg-cosmic-dark border-cosmic-light text-white mt-1"
            />
          </div>

          {project.type === 'video' && (
            <div>
              <Label htmlFor="brief" className="text-cosmic-light">
                Project Brief
              </Label>
              <Textarea
                id="brief"
                placeholder="Describe what your video should be about..."
                value={project.brief}
                onChange={(e) => updateProject({ brief: e.target.value })}
                className="bg-cosmic-dark border-cosmic-light text-white mt-1 min-h-[80px]"
              />
            </div>
          )}

          {project.type === 'image' && (
            <div>
              <Label htmlFor="brief" className="text-cosmic-light">
                Image Description
              </Label>
              <Textarea
                id="brief"
                placeholder="Describe the image you want to generate..."
                value={project.brief}
                onChange={(e) => updateProject({ brief: e.target.value })}
                className="bg-cosmic-dark border-cosmic-light text-white mt-1 min-h-[80px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderVideoWizard = () => {
    const steps = [
      { id: 'setup', label: 'Setup', icon: '⚙️' },
      { id: 'timeline', label: 'Timeline', icon: '🎬' },
      { id: 'preview', label: 'Preview', icon: '▶️' },
      { id: 'export', label: 'Export', icon: '📤' },
    ];

    return (
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => {
            const isActive = step.id === project.currentVideoStep;
            const isCompleted = steps.findIndex((s) => s.id === project.currentVideoStep) > index;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted
                      ? 'bg-green-500'
                      : isActive
                      ? 'bg-cosmic-accent'
                      : 'bg-cosmic-light bg-opacity-20'
                  }`}
                >
                  {step.icon}
                </div>
                <span
                  className={`text-sm ${isActive ? 'text-cosmic-accent' : 'text-cosmic-light'}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Setup Step */}
        {project.currentVideoStep === 'setup' && (
          <div className="space-y-6">
            {/* Tool Settings */}
            <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
              <CardHeader>
                <CardTitle className="text-cosmic-highlight">AI Tool Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-cosmic-light">Image Service</Label>
                    <Select
                      value={project.settings.imageService}
                      onValueChange={(value: any) =>
                        updateProject({
                          settings: { ...project.settings, imageService: value },
                        })
                      }
                    >
                      <SelectTrigger className="bg-cosmic-dark border-cosmic-light text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dalle">DALL-E</SelectItem>
                        <SelectItem value="stability">Stability AI</SelectItem>
                        <SelectItem value="midjourney">Midjourney</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-cosmic-light">Audio Service</Label>
                    <Select
                      value={project.settings.audioService}
                      onValueChange={(value: any) =>
                        updateProject({
                          settings: { ...project.settings, audioService: value },
                        })
                      }
                    >
                      <SelectTrigger className="bg-cosmic-dark border-cosmic-light text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                        <SelectItem value="google-tts">Google TTS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-cosmic-light">Video Service</Label>
                    <Select
                      value={project.settings.videoService}
                      onValueChange={(value: any) =>
                        updateProject({
                          settings: { ...project.settings, videoService: value },
                        })
                      }
                    >
                      <SelectTrigger className="bg-cosmic-dark border-cosmic-light text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heygen">HeyGen</SelectItem>
                        <SelectItem value="sora">Sora</SelectItem>
                        <SelectItem value="hedra">Hedra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="promptRewriter"
                    checked={project.settings.promptRewriterEnabled}
                    onChange={(e) =>
                      updateProject({
                        settings: { ...project.settings, promptRewriterEnabled: e.target.checked },
                      })
                    }
                    className="rounded border-cosmic-light"
                  />
                  <Label htmlFor="promptRewriter" className="text-cosmic-light">
                    Enable AI Prompt Rewriter (enhances prompts for better results)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Script Generation */}
            <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
              <CardHeader>
                <CardTitle className="text-cosmic-highlight">Generate Script</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={generateScript}
                  disabled={project.isGenerating || !project.brief.trim()}
                  className="bg-cosmic-accent hover:bg-cosmic-accent-hover"
                >
                  {project.isGenerating ? 'Generating...' : 'Generate Draft Script'}
                </Button>

                {project.script && (
                  <div>
                    <Label className="text-cosmic-light">Generated Script (Edit as needed)</Label>
                    <Textarea
                      value={project.script}
                      onChange={(e) => updateProject({ script: e.target.value })}
                      className="bg-cosmic-dark border-cosmic-light text-white mt-1 min-h-[200px]"
                    />
                    <Button
                      onClick={() => updateProject({ currentVideoStep: 'timeline' })}
                      className="mt-4 bg-green-600 hover:bg-green-700"
                    >
                      Proceed to Timeline →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timeline Editor Step */}
        {project.currentVideoStep === 'timeline' && (
          <div className="space-y-6">
            <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
              <CardHeader>
                <CardTitle className="text-cosmic-highlight flex justify-between items-center">
                  Scene Timeline
                  <Button onClick={addScene} size="sm" className="bg-cosmic-accent">
                    + Add Scene
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.scenes.map((scene, index) => (
                    <Card key={scene.id} className="bg-cosmic-dark border-cosmic-light">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Scene Info */}
                          <div className="space-y-2">
                            <Label className="text-cosmic-light">Scene {index + 1}</Label>
                            <Input
                              placeholder="Scene title"
                              value={scene.title}
                              onChange={(e) => updateScene(index, { title: e.target.value })}
                              className="bg-cosmic-light bg-opacity-10 border-cosmic-light text-white"
                            />
                            <Input
                              type="number"
                              placeholder="Duration (sec)"
                              value={scene.duration}
                              onChange={(e) =>
                                updateScene(index, { duration: parseInt(e.target.value) || 5 })
                              }
                              className="bg-cosmic-light bg-opacity-10 border-cosmic-light text-white"
                            />
                          </div>

                          {/* Script */}
                          <div className="space-y-2">
                            <Label className="text-cosmic-light">Script</Label>
                            <Textarea
                              placeholder="Scene script..."
                              value={scene.script}
                              onChange={(e) => updateScene(index, { script: e.target.value })}
                              className="bg-cosmic-light bg-opacity-10 border-cosmic-light text-white min-h-[80px]"
                            />
                          </div>

                          {/* Image */}
                          <div className="space-y-2">
                            <Label className="text-cosmic-light">Image</Label>
                            {scene.imageUrl ? (
                              <div className="space-y-2">
                                <img
                                  src={scene.imageUrl}
                                  alt={scene.title}
                                  className="w-full h-20 object-cover rounded"
                                />
                                <Button
                                  onClick={() => generateSceneImage(index)}
                                  disabled={project.isGenerating}
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                >
                                  Regenerate
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => generateSceneImage(index)}
                                disabled={project.isGenerating}
                                className="w-full bg-cosmic-accent"
                              >
                                Generate Image
                              </Button>
                            )}
                          </div>

                          {/* Audio */}
                          <div className="space-y-2">
                            <Label className="text-cosmic-light">Audio</Label>
                            {scene.audioUrl ? (
                              <div className="space-y-2">
                                <audio controls className="w-full">
                                  <source src={scene.audioUrl} type="audio/mpeg" />
                                </audio>
                                <Button
                                  onClick={() => generateSceneAudio(index)}
                                  disabled={project.isGenerating}
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                >
                                  Regenerate
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => generateSceneAudio(index)}
                                disabled={project.isGenerating}
                                className="w-full bg-cosmic-accent"
                              >
                                Generate Audio
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteScene(index)}
                              size="sm"
                              variant="destructive"
                              className="w-full"
                            >
                              Delete Scene
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between mt-6">
                  <Button
                    onClick={() => updateProject({ currentVideoStep: 'setup' })}
                    variant="outline"
                  >
                    ← Back to Setup
                  </Button>
                  <Button
                    onClick={() => updateProject({ currentVideoStep: 'preview' })}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Proceed to Preview →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Step */}
        {project.currentVideoStep === 'preview' && (
          <div className="space-y-6">
            <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
              <CardHeader>
                <CardTitle className="text-cosmic-highlight">Project Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preview Player */}
                <div className="bg-cosmic-dark rounded-lg p-4">
                  <h4 className="text-cosmic-light font-semibold mb-4">Video Preview</h4>

                  {project.scenes.length > 0 ? (
                    <div className="relative">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative">
                        {project.scenes.map(
                          (scene, index) =>
                            scene.imageUrl && (
                              <img
                                key={scene.id}
                                src={scene.imageUrl}
                                alt={`Scene ${index + 1}`}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                                  index === 0 ? 'opacity-100' : 'opacity-0'
                                }`}
                                style={{ zIndex: project.scenes.length - index }}
                              />
                            ),
                        )}
                      </div>

                      <div className="flex justify-center gap-4">
                        <Button className="bg-cosmic-accent">▶️ Play Preview</Button>
                        <Button variant="outline">⏸️ Pause</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-cosmic-light bg-opacity-20 rounded-lg flex items-center justify-center">
                      <p className="text-cosmic-light">No scenes available for preview</p>
                    </div>
                  )}
                </div>

                {/* Timeline Overview */}
                <div className="bg-cosmic-dark rounded-lg p-4">
                  <h4 className="text-cosmic-light font-semibold mb-4">Timeline Overview</h4>
                  <div className="space-y-2">
                    {project.scenes.map((scene, index) => (
                      <div
                        key={scene.id}
                        className="flex items-center gap-3 p-2 bg-cosmic-light bg-opacity-10 rounded"
                      >
                        <span className="text-cosmic-accent font-mono text-sm w-12">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {scene.imageUrl && (
                          <img
                            src={scene.imageUrl}
                            alt={scene.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-cosmic-light font-medium">{scene.title}</p>
                          <p className="text-cosmic-light text-sm opacity-75">
                            {scene.duration}s • {scene.script.slice(0, 50)}...
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={scene.imageUrl ? 'default' : 'secondary'}>
                            {scene.imageUrl ? '✓' : '✗'} Image
                          </Badge>
                          <Badge variant={scene.audioUrl ? 'default' : 'secondary'}>
                            {scene.audioUrl ? '✓' : '✗'} Audio
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={() => updateProject({ currentVideoStep: 'timeline' })}
                    variant="outline"
                  >
                    ← Back to Timeline
                  </Button>
                  <Button
                    onClick={renderVideo}
                    disabled={project.isRendering}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {project.isRendering ? 'Rendering...' : 'Render Video'}
                  </Button>
                </div>

                {/* Render Progress */}
                {project.isRendering && project.renderProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-cosmic-light">{project.renderProgress.message}</span>
                      <span className="text-cosmic-accent">{project.renderProgress.progress}%</span>
                    </div>
                    <Progress value={project.renderProgress.progress} className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export Step */}
        {project.currentVideoStep === 'export' && (
          <div className="space-y-6">
            <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
              <CardHeader>
                <CardTitle className="text-cosmic-highlight">Export & Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Export Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-cosmic-light">Output Format</Label>
                    <Select
                      value={project.exportOptions.format}
                      onValueChange={(value: any) =>
                        updateProject({
                          exportOptions: { ...project.exportOptions, format: value },
                        })
                      }
                    >
                      <SelectTrigger className="bg-cosmic-dark border-cosmic-light text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4</SelectItem>
                        <SelectItem value="webm">WebM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-cosmic-light">Resolution</Label>
                    <Select
                      value={project.exportOptions.resolution}
                      onValueChange={(value: any) =>
                        updateProject({
                          exportOptions: { ...project.exportOptions, resolution: value },
                        })
                      }
                    >
                      <SelectTrigger className="bg-cosmic-dark border-cosmic-light text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="480p">480p</SelectItem>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Export Actions */}
                <div className="flex gap-4">
                  <Button onClick={exportVideo} className="flex-1 bg-cosmic-accent">
                    📥 Download Video
                  </Button>
                  <Button
                    onClick={publishToLibrary}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    📚 Publish to Library
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={() => updateProject({ currentVideoStep: 'preview' })}
                    variant="outline"
                  >
                    ← Back to Preview
                  </Button>
                  <Button
                    onClick={saveProject}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? 'Saving...' : 'Save Project'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderImageProject = () => (
    <div className="space-y-6">
      <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
        <CardHeader>
          <CardTitle className="text-cosmic-highlight">Image Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tool Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-cosmic-light">Image Service</Label>
              <Select
                value={project.settings.imageService}
                onValueChange={(value: any) =>
                  updateProject({
                    settings: { ...project.settings, imageService: value },
                  })
                }
              >
                <SelectTrigger className="bg-cosmic-dark border-cosmic-light text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dalle">DALL-E</SelectItem>
                  <SelectItem value="stability">Stability AI</SelectItem>
                  <SelectItem value="midjourney">Midjourney</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="imagePromptRewriter"
                checked={project.settings.promptRewriterEnabled}
                onChange={(e) =>
                  updateProject({
                    settings: { ...project.settings, promptRewriterEnabled: e.target.checked },
                  })
                }
                className="rounded border-cosmic-light"
              />
              <Label htmlFor="imagePromptRewriter" className="text-cosmic-light text-sm">
                Enable AI Prompt Rewriter
              </Label>
            </div>
          </div>

          <Button
            onClick={generateImageForProject}
            disabled={project.isGenerating || !project.brief.trim()}
            className="bg-cosmic-accent hover:bg-cosmic-accent-hover"
          >
            {project.isGenerating ? 'Generating...' : 'Generate Image'}
          </Button>

          {project.scenes.length > 0 && project.scenes[0].imageUrl && (
            <div>
              <h4 className="text-lg font-semibold text-cosmic-light mb-4">Generated Image</h4>
              <div className="bg-cosmic-dark rounded-lg p-4 inline-block">
                <img
                  src={project.scenes[0].imageUrl}
                  alt={project.scenes[0].imagePrompt || project.brief}
                  className="w-64 h-64 object-cover rounded mb-4"
                />
                <div className="space-y-2">
                  <Button
                    onClick={generateImageForProject}
                    disabled={project.isGenerating}
                    size="sm"
                    variant="outline"
                  >
                    Generate Variation
                  </Button>
                  <Button
                    onClick={saveProject}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 w-full"
                  >
                    {isLoading ? 'Saving...' : 'Save Project'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderMediaLibrary = () => (
    <div className="space-y-6">
      <div className="bg-cosmic-light bg-opacity-10 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-cosmic-highlight mb-4">Media Library</h2>

        {mediaProjects.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-cosmic-light mb-4">Saved Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaProjects.map((savedProject) => (
                <div key={savedProject.id} className="bg-cosmic-dark rounded-lg p-4">
                  <div className="aspect-video bg-cosmic-light bg-opacity-20 rounded mb-3 overflow-hidden">
                    {savedProject.image_paths && savedProject.image_paths.length > 0 ? (
                      <img
                        src={savedProject.image_paths[0]}
                        alt={savedProject.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {savedProject.type === 'video'
                          ? '🎬'
                          : savedProject.type === 'audio'
                          ? '🎵'
                          : '🖼️'}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-cosmic-highlight">{savedProject.title}</h4>
                    <p className="text-sm text-cosmic-light capitalize">
                      {savedProject.type} Project
                    </p>
                    <p className="text-xs text-cosmic-light">
                      {new Date(savedProject.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      onClick={() => {
                        /* TODO: Load project */
                      }}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      Load Project
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mediaAssets.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-cosmic-light mb-4">Individual Assets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaAssets.map((asset) => (
                <div key={asset.id} className="bg-cosmic-dark rounded-lg p-4">
                  <div className="aspect-video bg-cosmic-light bg-opacity-20 rounded mb-3 overflow-hidden">
                    {asset.media_type === 'image' && (
                      <img
                        src={asset.file_url}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {asset.media_type === 'video' && (
                      <video src={asset.file_url} className="w-full h-full object-cover" />
                    )}
                    {asset.media_type === 'audio' && (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🎵
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4
                      className="font-semibold text-cosmic-highlight truncate"
                      title={asset.title}
                    >
                      {asset.title}
                    </h4>
                    <p className="text-sm text-cosmic-light">{asset.ai_service}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => window.open(asset.file_url, '_blank')}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        View
                      </Button>
                      <Button
                        onClick={() => window.open(asset.file_url, '_blank')}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-cosmic-dark text-white">
      <CosmicBackground />
      <RadialMenu />

      <div className="relative z-10 p-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-cosmic-highlight mb-2">Media Studio</h1>
              <p className="text-xl text-cosmic-accent">
                Create professional multimedia content with AI-powered tools
              </p>
            </div>
            <Button
              onClick={() => setShowApiSettings(!showApiSettings)}
              variant="outline"
              className="border-cosmic-light text-cosmic-light hover:bg-cosmic-light hover:bg-opacity-20"
            >
              ⚙️ API Settings
            </Button>
          </div>

          {/* API Settings Panel */}
          {showApiSettings && (
            <div className="bg-cosmic-light bg-opacity-10 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-cosmic-highlight mb-4">API Configuration</h3>
              <p className="text-cosmic-light mb-4">
                Configure your API keys for AI services. Keys are stored securely in your database.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: 'openai_api_key',
                    label: 'OpenAI API Key',
                    service: 'GPT Script Generation',
                  },
                  { key: 'dalle_api_key', label: 'DALL-E API Key', service: 'Image Generation' },
                  {
                    key: 'stability_api_key',
                    label: 'Stability AI API Key',
                    service: 'Alternative Image Generation',
                  },
                  {
                    key: 'elevenlabs_api_key',
                    label: 'ElevenLabs API Key',
                    service: 'Text-to-Speech',
                  },
                ].map(({ key, label, service }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-cosmic-light text-sm">
                      {label} <span className="text-xs text-cosmic-accent">({service})</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={key}
                        type="password"
                        placeholder={`Enter ${label}`}
                        value={apiKeys[key] || ''}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="bg-cosmic-dark border-cosmic-light text-white flex-1"
                      />
                      <Button
                        onClick={() => saveApiKey(key, apiKeys[key] || '')}
                        disabled={!apiKeys[key]?.trim()}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-cosmic-dark rounded text-sm text-cosmic-light">
                <strong>Cost Estimation:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Script Generation: ~$0.02 per request (OpenAI GPT)</li>
                  <li>• Image Generation: ~$0.04 per image (DALL-E) or ~$0.03 (Stability AI)</li>
                  <li>• Audio Generation: ~$0.15 per minute (ElevenLabs)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Message Display */}
        {project.message && (
          <Alert
            className={`mb-6 ${
              project.message.type === 'success'
                ? 'border-green-500 bg-green-500 bg-opacity-20 text-green-300'
                : project.message.type === 'error'
                ? 'border-red-500 bg-red-500 bg-opacity-20 text-red-300'
                : 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-300'
            }`}
          >
            <AlertDescription>
              {project.message.text}
              <button
                onClick={() => updateProject({ message: undefined })}
                className="float-right ml-4 text-xl font-bold hover:opacity-75"
              >
                ×
              </button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          value={studioState.currentTab}
          onValueChange={(value) =>
            updateStudioState({ currentTab: value as 'projects' | 'timeline' | 'exports' })
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-cosmic-light bg-opacity-20">
            <TabsTrigger value="projects" className="data-[state=active]:bg-cosmic-accent">
              📁 Projects
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-cosmic-accent">
              🎬 Timeline
            </TabsTrigger>
            <TabsTrigger value="exports" className="data-[state=active]:bg-cosmic-accent">
              📤 Exports
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
              <CardHeader>
                <CardTitle className="text-cosmic-highlight">Project Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Creation */}
                <div className="space-y-4">
                  <div className="flex gap-4 flex-wrap">
                    <Button
                      onClick={() => addNewClip('video', 'New Video Clip')}
                      className="bg-cosmic-accent hover:bg-cosmic-accent-hover"
                    >
                      🎬 New Video Clip
                    </Button>
                    <Button
                      onClick={() => addNewClip('audio', 'New Audio Clip')}
                      variant="outline"
                      className="border-cosmic-light text-cosmic-light"
                    >
                      🎵 New Audio Clip
                    </Button>
                    <Button
                      onClick={() => addNewClip('text', 'New Text Clip')}
                      variant="outline"
                      className="border-cosmic-light text-cosmic-light"
                    >
                      📝 New Text Clip
                    </Button>
                    <Button
                      onClick={() => {
                        const sampleProject = seedSampleProject();
                        updateStudioState({
                          timelineState: sampleProject.timeline,
                          currentTab: 'timeline',
                        });
                        updateProject({
                          title: sampleProject.metadata.title,
                          brief: sampleProject.metadata.description,
                          message: {
                            type: 'success',
                            text: 'Sample project loaded! Switch to Timeline tab to explore.',
                          },
                        });
                      }}
                      variant="outline"
                      className="border-green-500 text-green-500 hover:bg-green-500 hover:bg-opacity-20"
                    >
                      🚀 Load Sample Project
                    </Button>
                  </div>

                  {/* AI Service Configuration */}
                  <MultiToolSelector
                    settings={project.settings}
                    onSettingsUpdate={(settings) => updateProject({ settings })}
                  />

                  {/* Legacy Project Setup (for backward compatibility) */}
                  <div className="border-t border-cosmic-light border-opacity-20 pt-6">
                    <h3 className="text-lg font-semibold text-cosmic-highlight mb-4">
                      Legacy Project Setup
                    </h3>
                    {renderProjectSetup()}
                    {project.type === 'video' && renderVideoWizard()}
                    {project.type === 'image' && renderImageProject()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Library */}
            {renderMediaLibrary()}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <div className="space-y-6">
              {/* Timeline Controls */}
              <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
                <CardHeader>
                  <CardTitle className="text-cosmic-highlight flex justify-between items-center">
                    Timeline Editor V2
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateTimelineState(addTrack(studioState.timelineState, 'video'))
                        }
                        className="border-cosmic-light text-cosmic-light"
                      >
                        + Video Track
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateTimelineState(addTrack(studioState.timelineState, 'audio'))
                        }
                        className="border-cosmic-light text-cosmic-light"
                      >
                        + Audio Track
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateTimelineState(autoSyncAudio(studioState.timelineState))
                        }
                        className="border-cosmic-light text-cosmic-light"
                      >
                        🔄 Auto-Sync Audio
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Timeline Editor */}
              <TimelineEditor
                timelineState={studioState.timelineState}
                onTimelineChange={updateTimelineState}
                onClipSelect={handleClipSelect}
                onClipEdit={handleClipEdit}
                isPlaying={studioState.timelineState.isPlaying}
                onPlayPause={handlePlayPause}
              />

              {/* Clip Content Generation */}
              {studioState.timelineState.selectedClipIds.length > 0 && (
                <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
                  <CardHeader>
                    <CardTitle className="text-cosmic-highlight">
                      Generate Content for Selected Clip
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PromptRewriter
                      initialPrompt=""
                      context={
                        studioState.timelineState.tracks
                          .flatMap((t) => t.clips)
                          .find((c) => c.id === studioState.timelineState.selectedClipIds[0])
                          ?.type || 'image'
                      }
                      onPromptUpdate={(prompt) => {
                        const selectedClip = studioState.timelineState.tracks
                          .flatMap((t) => t.clips)
                          .find((c) => c.id === studioState.timelineState.selectedClipIds[0]);
                        if (selectedClip) {
                          generateClipContent(selectedClip, prompt);
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Exports Tab */}
          <TabsContent value="exports" className="space-y-6">
            <ExportPanel
              timelineState={studioState.timelineState}
              exportOptions={project.exportOptions}
              onExportOptionsUpdate={(options) => updateProject({ exportOptions: options })}
              onExportComplete={(exportUrl) => {
                console.log('Export completed:', exportUrl);
                // Handle export completion
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MediaStudio;
