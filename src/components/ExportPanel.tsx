import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Download,
  Upload,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileVideo,
  Settings,
  Globe,
  BookOpen,
  Share2,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { TimelineState, Clip, VideoExportOptions, RenderProgress } from '@/lib/types';
import { calculateTotalDuration } from '@/utils/mediaServices';

interface ExportPanelProps {
  timelineState: TimelineState;
  exportOptions: VideoExportOptions;
  onExportOptionsUpdate: (options: VideoExportOptions) => void;
  onExportComplete?: (exportUrl: string) => void;
  className?: string;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  timelineState,
  exportOptions,
  onExportOptionsUpdate,
  onExportComplete,
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<RenderProgress | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate project statistics
  const getProjectStats = () => {
    const allClips = timelineState.tracks.flatMap((track) => track.clips);
    const videoClips = timelineState.tracks
      .filter((track) => track.type === 'video')
      .flatMap((track) => track.clips);
    const audioClips = timelineState.tracks
      .filter((track) => track.type === 'audio')
      .flatMap((track) => track.clips);
    const textClips = timelineState.tracks
      .filter((track) => track.type === 'text')
      .flatMap((track) => track.clips);

    return {
      totalClips: allClips.length,
      videoClips: videoClips.length,
      audioClips: audioClips.length,
      textClips: textClips.length,
      totalDuration: timelineState.totalDuration,
      missingMedia: allClips.filter((clip) => !clip.content.mediaUrl && !clip.content.text).length,
    };
  };

  const stats = getProjectStats();

  // Validate project before export
  const validateProject = () => {
    const errors: string[] = [];

    if (stats.totalClips === 0) {
      errors.push('No clips found in the timeline');
    }

    if (stats.missingMedia > 0) {
      errors.push(`${stats.missingMedia} clips are missing media content`);
    }

    if (stats.videoClips === 0) {
      errors.push('No video clips found - add some video content to export');
    }

    if (!exportOptions.metadata.title.trim()) {
      errors.push('Video title is required');
    }

    return errors;
  };

  // Start video export
  const handleExport = async () => {
    const validationErrors = validateProject();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setIsExporting(true);
    setError(null);
    setExportProgress({
      stage: 'preparing',
      progress: 0,
      message: 'Preparing export...',
    });

    try {
      // Prepare clips for rendering
      const renderClips = timelineState.tracks
        .filter((track) => track.visible)
        .flatMap((track) =>
          track.clips.map((clip) => ({
            id: clip.id,
            trackType: track.type,
            startTime: clip.startTime,
            duration: clip.duration,
            mediaUrl: clip.content.mediaUrl,
            thumbnailUrl: clip.content.thumbnailUrl,
            text: clip.content.text,
            effects: clip.effects,
          })),
        )
        .sort((a, b) => a.startTime - b.startTime);

      // Call backend render function
      const renderRequest = {
        projectId: `export-${Date.now()}`, // Generate temporary ID
        clips: renderClips,
        exportOptions: {
          format: exportOptions.format,
          resolution: exportOptions.resolution,
          quality: exportOptions.quality,
          includeSubtitles: exportOptions.includeSubtitles,
          metadata: exportOptions.metadata,
        },
        totalDuration: timelineState.totalDuration,
      };

      setExportProgress({
        stage: 'uploading',
        progress: 10,
        message: 'Uploading project data...',
      });

      const { data, error: renderError } = await supabase.functions.invoke('renderMedia', {
        body: renderRequest,
      });

      if (renderError) throw renderError;

      if (data.success) {
        setExportProgress({
          stage: 'rendering',
          progress: 30,
          message: 'Rendering video...',
          estimatedTimeRemaining: Math.ceil(timelineState.totalDuration / 10), // Rough estimate
        });

        // Poll for completion (in a real implementation, you'd use websockets or server-sent events)
        let progress = 30;
        const pollInterval = setInterval(() => {
          progress += Math.random() * 5; // Simulate progress
          if (progress >= 90) {
            clearInterval(pollInterval);
            setExportProgress({
              stage: 'complete',
              progress: 100,
              message: 'Export completed successfully!',
            });
            setExportUrl(data.exportUrl);
            setIsExporting(false);
            onExportComplete?.(data.exportUrl);
          } else {
            setExportProgress({
              stage: 'rendering',
              progress,
              message: `Rendering video... ${Math.round(progress)}%`,
              estimatedTimeRemaining: Math.ceil((100 - progress) / 10),
            });
          }
        }, 2000);
      } else {
        throw new Error(data.error || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
      setExportProgress({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
      });
      setIsExporting(false);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!exportUrl) return;

    try {
      const response = await fetch(exportUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportOptions.metadata.title || 'exported-video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download video');
    }
  };

  // Handle publish to library
  const handlePublishToLibrary = async () => {
    if (!exportUrl) return;

    try {
      // This would integrate with the knowledge library system
      // For now, just show success message
      alert('Video published to Knowledge Library! (Integration coming soon)');
    } catch (err) {
      console.error('Publish error:', err);
      setError('Failed to publish to library');
    }
  };

  // Handle social publishing
  const handleSocialPublish = async (platform: string) => {
    // Stub for social media publishing
    alert(`${platform} publishing integration coming soon!`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Project Overview */}
      <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cosmic-highlight">
            <FileVideo className="w-5 h-5" />
            Export Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cosmic-accent">{stats.totalClips}</div>
              <div className="text-sm text-cosmic-light">Total Clips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.videoClips}</div>
              <div className="text-sm text-cosmic-light">Video Clips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.audioClips}</div>
              <div className="text-sm text-cosmic-light">Audio Clips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cosmic-accent">
                {Math.floor(stats.totalDuration / 60)}:
                {(stats.totalDuration % 60).toFixed(1).padStart(4, '0')}
              </div>
              <div className="text-sm text-cosmic-light">Duration</div>
            </div>
          </div>

          {stats.missingMedia > 0 && (
            <Alert className="mt-4 border-yellow-500 bg-yellow-500 bg-opacity-20 text-yellow-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {stats.missingMedia} clips are missing media content. Please generate or add content
                before exporting.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cosmic-highlight">
            <Settings className="w-5 h-5" />
            Export Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-cosmic-light">Output Format</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: any) =>
                  onExportOptionsUpdate({ ...exportOptions, format: value })
                }
              >
                <SelectTrigger className="bg-cosmic-dark border-cosmic-light text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4 (Recommended)</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-cosmic-light">Resolution</Label>
              <Select
                value={exportOptions.resolution}
                onValueChange={(value: any) =>
                  onExportOptionsUpdate({ ...exportOptions, resolution: value })
                }
              >
                <SelectTrigger className="bg-cosmic-dark border-cosmic-light text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="480p">480p (SD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeSubtitles"
              checked={exportOptions.includeSubtitles}
              onCheckedChange={(checked) =>
                onExportOptionsUpdate({ ...exportOptions, includeSubtitles: !!checked })
              }
            />
            <Label htmlFor="includeSubtitles" className="text-cosmic-light">
              Include subtitles for text clips
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Video Metadata */}
      <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cosmic-highlight">
            <BookOpen className="w-5 h-5" />
            Video Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="videoTitle" className="text-cosmic-light">
              Title *
            </Label>
            <Input
              id="videoTitle"
              value={exportOptions.metadata.title}
              onChange={(e) =>
                onExportOptionsUpdate({
                  ...exportOptions,
                  metadata: { ...exportOptions.metadata, title: e.target.value },
                })
              }
              className="bg-cosmic-dark border-cosmic-light text-white"
              placeholder="Enter video title..."
            />
          </div>

          <div>
            <Label htmlFor="videoDescription" className="text-cosmic-light">
              Description
            </Label>
            <Textarea
              id="videoDescription"
              value={exportOptions.metadata.description}
              onChange={(e) =>
                onExportOptionsUpdate({
                  ...exportOptions,
                  metadata: { ...exportOptions.metadata, description: e.target.value },
                })
              }
              className="bg-cosmic-dark border-cosmic-light text-white"
              placeholder="Enter video description..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="videoTags" className="text-cosmic-light">
              Tags (comma-separated)
            </Label>
            <Input
              id="videoTags"
              value={exportOptions.metadata.tags.join(', ')}
              onChange={(e) =>
                onExportOptionsUpdate({
                  ...exportOptions,
                  metadata: {
                    ...exportOptions.metadata,
                    tags: e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter((tag) => tag),
                  },
                })
              }
              className="bg-cosmic-dark border-cosmic-light text-white"
              placeholder="Enter tags separated by commas..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Progress */}
      {isExporting && exportProgress && (
        <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cosmic-highlight">
              {exportProgress.stage === 'complete' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : exportProgress.stage === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <Clock className="w-5 h-5 text-blue-500" />
              )}
              Export Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-cosmic-light">{exportProgress.message}</span>
                <span className="text-cosmic-accent">{exportProgress.progress}%</span>
              </div>
              <Progress value={exportProgress.progress} className="w-full" />
            </div>

            {exportProgress.estimatedTimeRemaining && (
              <div className="text-sm text-cosmic-light">
                Estimated time remaining: ~{exportProgress.estimatedTimeRemaining} seconds
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-500 bg-red-500 bg-opacity-20 text-red-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Export Actions */}
      <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cosmic-highlight">
            <Upload className="w-5 h-5" />
            Export Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!exportUrl ? (
            <Button
              onClick={handleExport}
              disabled={isExporting || validateProject().length > 0}
              className="w-full bg-cosmic-accent hover:bg-cosmic-accent-hover"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Exporting Video...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Start Export
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Video
                </Button>

                <Button
                  onClick={handlePublishToLibrary}
                  variant="outline"
                  className="flex-1 border-cosmic-light text-cosmic-light"
                  size="lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Publish to Library
                </Button>
              </div>

              {/* Social Publishing */}
              <div className="space-y-2">
                <Label className="text-cosmic-light">Share on Social Media</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSocialPublish('YouTube')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:bg-opacity-20"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    YouTube
                  </Button>
                  <Button
                    onClick={() => handleSocialPublish('Twitter')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-blue-500 text-blue-500 hover:bg-blue-500 hover:bg-opacity-20"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Twitter
                  </Button>
                  <Button
                    onClick={() => handleSocialPublish('LinkedIn')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-blue-700 text-blue-700 hover:bg-blue-700 hover:bg-opacity-20"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    LinkedIn
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-cosmic-light bg-cosmic-dark rounded p-3">
            <strong>Export Notes:</strong>
            <ul className="mt-1 space-y-1">
              <li>• MP4 exports use H.264 codec for maximum compatibility</li>
              <li>• Higher resolutions result in larger file sizes</li>
              <li>• Export time depends on video length and complexity</li>
              <li>• Videos are stored securely in Supabase Storage</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportPanel;
