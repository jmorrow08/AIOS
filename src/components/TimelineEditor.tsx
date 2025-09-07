import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TimelineState, Track, Clip, TrackType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Grid,
  Lock,
  Unlock,
} from 'lucide-react';

interface TimelineEditorProps {
  timelineState: TimelineState;
  onTimelineChange: (newState: TimelineState) => void;
  onClipSelect: (clipIds: string[]) => void;
  onClipEdit: (clip: Clip) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  className?: string;
}

const TIMELINE_HEIGHT = 400;
const TRACK_HEIGHT = 60;
const RULER_HEIGHT = 40;

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  timelineState,
  onTimelineChange,
  onClipSelect,
  onClipEdit,
  isPlaying,
  onPlayPause,
  className = '',
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggedClip, setDraggedClip] = useState<Clip | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'left' | 'right' | null>(null);

  // Calculate total timeline width based on zoom and duration
  const timelineWidth = Math.max(
    timelineState.totalDuration * timelineState.zoom,
    1200, // minimum width
  );

  // Handle timeline click to set playhead
  const handleTimelineClick = useCallback(
    (event: React.MouseEvent) => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left + timelineState.scrollLeft;
      const time = x / timelineState.zoom;

      onTimelineChange({
        ...timelineState,
        currentTime: Math.max(0, Math.min(time, timelineState.totalDuration)),
        playheadPosition: x,
      });
    },
    [timelineState, onTimelineChange],
  );

  // Handle clip drag start
  const handleClipDragStart = useCallback(
    (clip: Clip, event: React.MouseEvent) => {
      if (isResizing) return;

      setDraggedClip(clip);
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    },
    [isResizing],
  );

  // Handle clip drag
  const handleClipDrag = useCallback(
    (event: MouseEvent) => {
      if (!draggedClip || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left - dragOffset.x + timelineState.scrollLeft;
      const y = event.clientY - rect.top - dragOffset.y;

      const newTime = Math.max(0, x / timelineState.zoom);
      const trackIndex = Math.floor(y / TRACK_HEIGHT);

      if (trackIndex >= 0 && trackIndex < timelineState.tracks.length) {
        const targetTrack = timelineState.tracks[trackIndex];

        // Check for conflicts with other clips on the target track
        const conflicts = targetTrack.clips.filter(
          (c) =>
            c.id !== draggedClip.id &&
            newTime < c.endTime &&
            newTime + draggedClip.duration > c.startTime,
        );

        if (conflicts.length === 0) {
          const updatedTracks = timelineState.tracks.map((track) => {
            if (track.id === targetTrack.id) {
              return {
                ...track,
                clips: track.clips.map((clip) =>
                  clip.id === draggedClip.id
                    ? {
                        ...clip,
                        startTime: timelineState.snapToGrid
                          ? Math.round(newTime / timelineState.gridSize) * timelineState.gridSize
                          : newTime,
                        endTime:
                          (timelineState.snapToGrid
                            ? Math.round(newTime / timelineState.gridSize) * timelineState.gridSize
                            : newTime) + clip.duration,
                        trackId: targetTrack.id,
                      }
                    : clip,
                ),
              };
            }
            // Remove from old track if moving to new track
            if (track.id === draggedClip.trackId && track.id !== targetTrack.id) {
              return {
                ...track,
                clips: track.clips.filter((clip) => clip.id !== draggedClip.id),
              };
            }
            return track;
          });

          onTimelineChange({
            ...timelineState,
            tracks: updatedTracks,
          });
        }
      }
    },
    [draggedClip, dragOffset, timelineState, onTimelineChange],
  );

  // Handle clip resize
  const handleClipResize = useCallback(
    (clip: Clip, handle: 'left' | 'right', event: MouseEvent) => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left + timelineState.scrollLeft;
      const newTime = x / timelineState.zoom;

      const updatedTracks = timelineState.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((c) => {
          if (c.id === clip.id) {
            if (handle === 'left') {
              const newStartTime = Math.max(
                0,
                timelineState.snapToGrid
                  ? Math.round(newTime / timelineState.gridSize) * timelineState.gridSize
                  : newTime,
              );
              return {
                ...c,
                startTime: newStartTime,
                duration: c.endTime - newStartTime,
              };
            } else {
              const newEndTime = Math.max(
                c.startTime + 0.1,
                timelineState.snapToGrid
                  ? Math.round(newTime / timelineState.gridSize) * timelineState.gridSize
                  : newTime,
              );
              return {
                ...c,
                duration: newEndTime - c.startTime,
                endTime: newEndTime,
              };
            }
          }
          return c;
        }),
      }));

      onTimelineChange({
        ...timelineState,
        tracks: updatedTracks,
      });
    },
    [timelineState, onTimelineChange],
  );

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (draggedClip && !isResizing) {
        handleClipDrag(event);
      } else if (isResizing && resizeHandle) {
        // Find the clip being resized
        const resizingClip = timelineState.tracks
          .flatMap((track) => track.clips)
          .find((clip) => timelineState.selectedClipIds.includes(clip.id));

        if (resizingClip) {
          handleClipResize(resizingClip, resizeHandle, event);
        }
      }
    };

    const handleMouseUp = () => {
      setDraggedClip(null);
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (draggedClip || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedClip, isResizing, resizeHandle, handleClipDrag, handleClipResize, timelineState]);

  // Handle zoom
  const handleZoom = useCallback(
    (newZoom: number) => {
      onTimelineChange({
        ...timelineState,
        zoom: Math.max(10, Math.min(200, newZoom)),
      });
    },
    [timelineState, onTimelineChange],
  );

  // Render timeline ruler
  const renderRuler = () => {
    const majorTicks = [];
    const minorTicks = [];

    for (let time = 0; time <= timelineState.totalDuration; time += timelineState.gridSize) {
      const x = time * timelineState.zoom;

      if (time % (timelineState.gridSize * 5) === 0) {
        majorTicks.push(
          <div
            key={`major-${time}`}
            className="absolute top-0 w-px h-full bg-cosmic-accent border-l border-cosmic-accent"
            style={{ left: `${x}px` }}
          >
            <div className="absolute -top-6 left-1 text-xs text-cosmic-light font-mono">
              {Math.floor(time / 60)}:{(time % 60).toFixed(1).padStart(4, '0')}
            </div>
          </div>,
        );
      } else {
        minorTicks.push(
          <div
            key={`minor-${time}`}
            className="absolute top-0 w-px h-2 bg-cosmic-light bg-opacity-30"
            style={{ left: `${x}px` }}
          />,
        );
      }
    }

    return (
      <div className="relative h-8 bg-cosmic-dark border-b border-cosmic-light">
        {majorTicks}
        {minorTicks}
      </div>
    );
  };

  // Render playhead
  const renderPlayhead = () => {
    const x = timelineState.currentTime * timelineState.zoom - timelineState.scrollLeft;

    return (
      <div
        className="absolute top-0 w-0.5 h-full bg-red-500 z-50 pointer-events-none"
        style={{ left: `${x}px` }}
      >
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
      </div>
    );
  };

  // Render tracks and clips
  const renderTracks = () => {
    return timelineState.tracks.map((track, trackIndex) => (
      <div
        key={track.id}
        className="relative border-b border-cosmic-light border-opacity-20"
        style={{ height: `${track.height}px` }}
      >
        {/* Track header */}
        <div className="absolute left-0 top-0 w-32 h-full bg-cosmic-light bg-opacity-10 border-r border-cosmic-light border-opacity-20 flex items-center px-3 z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }} />
            <span className="text-sm text-cosmic-light font-medium">{track.name}</span>
            <Button
              size="sm"
              variant="ghost"
              className="w-6 h-6 p-0 ml-auto"
              onClick={() => {
                const updatedTracks = timelineState.tracks.map((t) =>
                  t.id === track.id ? { ...t, locked: !t.locked } : t,
                );
                onTimelineChange({ ...timelineState, tracks: updatedTracks });
              }}
            >
              {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Track content area */}
        <div className="ml-32 relative h-full">
          {/* Grid lines */}
          {timelineState.snapToGrid && (
            <div className="absolute inset-0">
              {Array.from(
                {
                  length: Math.ceil(timelineWidth / (timelineState.gridSize * timelineState.zoom)),
                },
                (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px bg-cosmic-light bg-opacity-10"
                    style={{ left: `${i * timelineState.gridSize * timelineState.zoom}px` }}
                  />
                ),
              )}
            </div>
          )}

          {/* Clips */}
          {track.clips.map((clip) => {
            const x = clip.startTime * timelineState.zoom - timelineState.scrollLeft;
            const width = clip.duration * timelineState.zoom;
            const isSelected = timelineState.selectedClipIds.includes(clip.id);

            return (
              <Card
                key={clip.id}
                className={`absolute top-1 bottom-1 cursor-move transition-all duration-150 ${
                  isSelected ? 'ring-2 ring-cosmic-accent shadow-lg' : 'hover:shadow-md'
                } ${track.locked ? 'cursor-not-allowed opacity-50' : ''}`}
                style={{
                  left: `${x}px`,
                  width: `${width}px`,
                  backgroundColor: track.color + '20',
                  borderColor: track.color,
                }}
                onMouseDown={(e) => {
                  if (!track.locked) {
                    handleClipDragStart(clip, e);
                    onClipSelect([clip.id]);
                  }
                }}
                onDoubleClick={() => onClipEdit(clip)}
              >
                <CardContent className="p-2 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white truncate">{clip.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {clip.type}
                    </Badge>
                  </div>

                  {/* Clip preview */}
                  <div className="flex-1 flex items-center justify-center">
                    {clip.content.thumbnailUrl ? (
                      <img
                        src={clip.content.thumbnailUrl}
                        alt={clip.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : clip.content.mediaUrl ? (
                      <div className="w-full h-full bg-cosmic-dark rounded flex items-center justify-center">
                        <span className="text-xs text-cosmic-light">
                          {clip.type === 'audio' ? '🎵' : '🎬'}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-cosmic-light bg-opacity-20 rounded flex items-center justify-center">
                        <span className="text-xs text-cosmic-light">No media</span>
                      </div>
                    )}
                  </div>

                  {/* Resize handles */}
                  {!track.locked && (
                    <>
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-cosmic-accent hover:bg-opacity-50"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizing(true);
                          setResizeHandle('left');
                          onClipSelect([clip.id]);
                        }}
                      />
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-cosmic-accent hover:bg-opacity-50"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizing(true);
                          setResizeHandle('right');
                          onClipSelect([clip.id]);
                        }}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div
      className={`bg-cosmic-dark rounded-lg border border-cosmic-light border-opacity-20 ${className}`}
    >
      {/* Timeline Controls */}
      <div className="flex items-center justify-between p-4 border-b border-cosmic-light border-opacity-20">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onTimelineChange({
                ...timelineState,
                currentTime: 0,
                playheadPosition: 0,
              })
            }
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={isPlaying ? 'default' : 'outline'}
            onClick={onPlayPause}
            className={isPlaying ? 'bg-cosmic-accent' : ''}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onTimelineChange({
                ...timelineState,
                currentTime: timelineState.totalDuration,
                playheadPosition: timelineState.totalDuration * timelineState.zoom,
              })
            }
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <div className="ml-4 text-sm text-cosmic-light">
            {Math.floor(timelineState.currentTime / 60)}:
            {(timelineState.currentTime % 60).toFixed(1).padStart(4, '0')} /{' '}
            {timelineState.totalDuration.toFixed(1)}s
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant={timelineState.snapToGrid ? 'default' : 'outline'}
            onClick={() =>
              onTimelineChange({
                ...timelineState,
                snapToGrid: !timelineState.snapToGrid,
              })
            }
            className={timelineState.snapToGrid ? 'bg-cosmic-accent' : ''}
          >
            <Grid className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleZoom(timelineState.zoom * 0.8)}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <div className="w-24">
              <Slider
                value={[timelineState.zoom]}
                onValueChange={([value]) => handleZoom(value)}
                min={10}
                max={200}
                step={5}
                className="w-full"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleZoom(timelineState.zoom * 1.2)}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <span className="text-xs text-cosmic-light w-12 text-right">
              {timelineState.zoom}px/s
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Area */}
      <div
        ref={timelineRef}
        className="relative overflow-auto"
        style={{ height: `${TIMELINE_HEIGHT}px` }}
        onClick={handleTimelineClick}
      >
        <div style={{ width: `${timelineWidth}px`, minHeight: '100%' }}>
          {/* Ruler */}
          <div className="sticky top-0 z-20">
            <div className="ml-32">{renderRuler()}</div>
          </div>

          {/* Tracks */}
          <div className="relative">
            {renderTracks()}
            {renderPlayhead()}
          </div>
        </div>
      </div>
    </div>
  );
};
