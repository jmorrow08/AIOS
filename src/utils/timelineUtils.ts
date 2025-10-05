import { TimelineState, Track, Clip, TrackType, MediaProjectSettings } from '@/lib/types';

/**
 * Create a default timeline state with standard tracks
 */
export const createDefaultTimeline = (settings: MediaProjectSettings): TimelineState => {
  const defaultTracks: Track[] = [
    {
      id: 'video-track-1',
      type: 'video',
      name: 'Video Track 1',
      height: settings.defaultTrackHeight,
      color: '#3B82F6', // blue-500
      locked: false,
      visible: true,
      clips: [],
    },
    {
      id: 'audio-track-1',
      type: 'audio',
      name: 'Audio Track 1',
      height: settings.defaultTrackHeight,
      color: '#10B981', // emerald-500
      locked: false,
      visible: true,
      clips: [],
    },
    {
      id: 'text-track-1',
      type: 'text',
      name: 'Text Track 1',
      height: settings.defaultTrackHeight,
      color: '#F59E0B', // amber-500
      locked: false,
      visible: true,
      clips: [],
    },
  ];

  return {
    tracks: defaultTracks,
    totalDuration: 60, // 1 minute default
    currentTime: 0,
    zoom: settings.timelineZoom,
    scrollLeft: 0,
    selectedClipIds: [],
    playheadPosition: 0,
    isPlaying: false,
    snapToGrid: settings.snapToGrid,
    gridSize: settings.gridSize,
  };
};

/**
 * Add a new track to the timeline
 */
export const addTrack = (
  timelineState: TimelineState,
  type: TrackType,
  name?: string,
): TimelineState => {
  const trackColors = {
    video: '#3B82F6', // blue
    audio: '#10B981', // emerald
    text: '#F59E0B', // amber
  };

  const trackNumber = timelineState.tracks.filter((t) => t.type === type).length + 1;
  const defaultName =
    name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${trackNumber}`;

  const newTrack: Track = {
    id: `${type}-track-${Date.now()}`,
    type,
    name: defaultName,
    height: timelineState.tracks[0]?.height || 60,
    color: trackColors[type],
    locked: false,
    visible: true,
    clips: [],
  };

  return {
    ...timelineState,
    tracks: [...timelineState.tracks, newTrack],
  };
};

/**
 * Remove a track from the timeline
 */
export const removeTrack = (timelineState: TimelineState, trackId: string): TimelineState => {
  const updatedTracks = timelineState.tracks.filter((track) => track.id !== trackId);

  // Clear selection if selected clips were on the removed track
  const selectedClipIds = timelineState.selectedClipIds.filter((clipId) => {
    return !timelineState.tracks.find((t) => t.id === trackId)?.clips.some((c) => c.id === clipId);
  });

  return {
    ...timelineState,
    tracks: updatedTracks,
    selectedClipIds,
  };
};

/**
 * Add a clip to a specific track
 */
export const addClipToTrack = (
  timelineState: TimelineState,
  trackId: string,
  clipData: Partial<Clip>,
): TimelineState => {
  const track = timelineState.tracks.find((t) => t.id === trackId);
  if (!track) return timelineState;

  const newClip: Clip = {
    id: clipData.id || `clip-${Date.now()}`,
    trackId,
    type: track.type,
    title: clipData.title || 'New Clip',
    startTime: clipData.startTime || timelineState.currentTime,
    duration: clipData.duration || 5,
    endTime: (clipData.startTime || timelineState.currentTime) + (clipData.duration || 5),
    content: clipData.content || {},
    effects: clipData.effects || {},
    metadata: {
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      aiGenerated: clipData.metadata?.aiGenerated || false,
      serviceUsed: clipData.metadata?.serviceUsed,
    },
    ...clipData,
  };

  // Check for conflicts
  const conflicts = track.clips.filter(
    (existingClip) =>
      newClip.startTime < existingClip.endTime && newClip.endTime > existingClip.startTime,
  );

  if (conflicts.length > 0) {
    // Auto-adjust position to avoid conflicts
    const lastClip = track.clips[track.clips.length - 1];
    newClip.startTime = lastClip ? lastClip.endTime : 0;
    newClip.endTime = newClip.startTime + newClip.duration;
  }

  const updatedTracks = timelineState.tracks.map((t) =>
    t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t,
  );

  // Update total duration if needed
  const maxEndTime = Math.max(
    ...updatedTracks.flatMap((t) => t.clips.map((c) => c.endTime)),
    timelineState.totalDuration,
  );

  return {
    ...timelineState,
    tracks: updatedTracks,
    totalDuration: Math.max(timelineState.totalDuration, maxEndTime),
  };
};

/**
 * Remove a clip from the timeline
 */
export const removeClip = (timelineState: TimelineState, clipId: string): TimelineState => {
  const updatedTracks = timelineState.tracks.map((track) => ({
    ...track,
    clips: track.clips.filter((clip) => clip.id !== clipId),
  }));

  return {
    ...timelineState,
    tracks: updatedTracks,
    selectedClipIds: timelineState.selectedClipIds.filter((id) => id !== clipId),
  };
};

/**
 * Update a clip's properties
 */
export const updateClip = (
  timelineState: TimelineState,
  clipId: string,
  updates: Partial<Clip>,
): TimelineState => {
  const updatedTracks = timelineState.tracks.map((track) => ({
    ...track,
    clips: track.clips.map((clip) =>
      clip.id === clipId
        ? {
            ...clip,
            ...updates,
            metadata: {
              ...clip.metadata,
              modifiedAt: new Date().toISOString(),
            },
          }
        : clip,
    ),
  }));

  return {
    ...timelineState,
    tracks: updatedTracks,
  };
};

/**
 * Move a clip to a different track and/or time position
 */
export const moveClip = (
  timelineState: TimelineState,
  clipId: string,
  newTrackId: string,
  newStartTime: number,
): TimelineState => {
  const sourceTrack = timelineState.tracks.find((t) => t.clips.some((c) => c.id === clipId));
  const targetTrack = timelineState.tracks.find((t) => t.id === newTrackId);

  if (!sourceTrack || !targetTrack) return timelineState;

  const clip = sourceTrack.clips.find((c) => c.id === clipId);
  if (!clip) return timelineState;

  // Check for conflicts on target track
  const conflicts = targetTrack.clips.filter(
    (c) =>
      c.id !== clipId && newStartTime < c.endTime && newStartTime + clip.duration > c.startTime,
  );

  if (conflicts.length > 0) {
    // Find next available slot
    const sortedClips = [...targetTrack.clips].sort((a, b) => a.startTime - b.startTime);
    let availableStartTime = newStartTime;

    for (const existingClip of sortedClips) {
      if (availableStartTime + clip.duration <= existingClip.startTime) {
        break;
      }
      availableStartTime = existingClip.endTime;
    }

    newStartTime = availableStartTime;
  }

  const updatedClip = {
    ...clip,
    trackId: newTrackId,
    startTime: newStartTime,
    endTime: newStartTime + clip.duration,
  };

  const updatedTracks = timelineState.tracks.map((track) => {
    if (track.id === sourceTrack.id) {
      // Remove from source track
      return {
        ...track,
        clips: track.clips.filter((c) => c.id !== clipId),
      };
    } else if (track.id === targetTrack.id) {
      // Add to target track
      return {
        ...track,
        clips: [...track.clips, updatedClip],
      };
    }
    return track;
  });

  return {
    ...timelineState,
    tracks: updatedTracks,
  };
};

/**
 * Split a clip at a specific time
 */
export const splitClip = (
  timelineState: TimelineState,
  clipId: string,
  splitTime: number,
): TimelineState => {
  const track = timelineState.tracks.find((t) => t.clips.some((c) => c.id === clipId));

  if (!track) return timelineState;

  const clip = track.clips.find((c) => c.id === clipId);
  if (!clip || splitTime <= clip.startTime || splitTime >= clip.endTime) {
    return timelineState;
  }

  const firstClip: Clip = {
    ...clip,
    id: `${clip.id}-1`,
    duration: splitTime - clip.startTime,
    endTime: splitTime,
    metadata: {
      ...clip.metadata,
      modifiedAt: new Date().toISOString(),
    },
  };

  const secondClip: Clip = {
    ...clip,
    id: `${clip.id}-2`,
    startTime: splitTime,
    duration: clip.endTime - splitTime,
    metadata: {
      ...clip.metadata,
      modifiedAt: new Date().toISOString(),
    },
  };

  const updatedTracks = timelineState.tracks.map((t) =>
    t.id === track.id
      ? {
          ...t,
          clips: [...t.clips.filter((c) => c.id !== clipId), firstClip, secondClip].sort(
            (a, b) => a.startTime - b.startTime,
          ),
        }
      : t,
  );

  return {
    ...timelineState,
    tracks: updatedTracks,
    selectedClipIds: [firstClip.id, secondClip.id],
  };
};

/**
 * Duplicate a clip
 */
export const duplicateClip = (
  timelineState: TimelineState,
  clipId: string,
  offset: number = 1,
): TimelineState => {
  const track = timelineState.tracks.find((t) => t.clips.some((c) => c.id === clipId));

  if (!track) return timelineState;

  const originalClip = track.clips.find((c) => c.id === clipId);
  if (!originalClip) return timelineState;

  const duplicatedClip: Clip = {
    ...originalClip,
    id: `clip-${Date.now()}`,
    title: `${originalClip.title} (Copy)`,
    startTime: originalClip.endTime + offset,
    endTime: originalClip.endTime + offset + originalClip.duration,
    metadata: {
      ...originalClip.metadata,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    },
  };

  const updatedTracks = timelineState.tracks.map((t) =>
    t.id === track.id ? { ...t, clips: [...t.clips, duplicatedClip] } : t,
  );

  // Update total duration if needed
  const maxEndTime = Math.max(
    ...updatedTracks.flatMap((t) => t.clips.map((c) => c.endTime)),
    timelineState.totalDuration,
  );

  return {
    ...timelineState,
    tracks: updatedTracks,
    totalDuration: Math.max(timelineState.totalDuration, maxEndTime),
  };
};

/**
 * Auto-sync audio clips with video clips
 */
export const autoSyncAudio = (timelineState: TimelineState): TimelineState => {
  const videoTracks = timelineState.tracks.filter((t) => t.type === 'video');
  const audioTracks = timelineState.tracks.filter((t) => t.type === 'audio');

  if (videoTracks.length === 0 || audioTracks.length === 0) {
    return timelineState;
  }

  let updatedTracks = [...timelineState.tracks];

  // For each video clip, try to sync audio clips
  for (const videoTrack of videoTracks) {
    for (const videoClip of videoTrack.clips) {
      // Find audio clips that should be synced
      for (const audioTrack of audioTracks) {
        const syncedClips = audioTrack.clips.map((audioClip) => {
          // If audio clip overlaps with video clip, adjust its timing
          if (audioClip.startTime < videoClip.endTime && audioClip.endTime > videoClip.startTime) {
            return {
              ...audioClip,
              startTime: videoClip.startTime,
              endTime: videoClip.startTime + audioClip.duration,
            };
          }
          return audioClip;
        });

        updatedTracks = updatedTracks.map((t) =>
          t.id === audioTrack.id ? { ...t, clips: syncedClips } : t,
        );
      }
    }
  }

  return {
    ...timelineState,
    tracks: updatedTracks,
  };
};

/**
 * Calculate the total duration of all clips in the timeline
 */
export const calculateTotalDuration = (tracks: Track[]): number => {
  const allClips = tracks.flatMap((track) => track.clips);
  if (allClips.length === 0) return 60; // default 1 minute

  const maxEndTime = Math.max(...allClips.map((clip) => clip.endTime));
  return Math.max(maxEndTime, 60); // minimum 1 minute
};

/**
 * Validate timeline state for conflicts and issues
 */
export const validateTimeline = (timelineState: TimelineState) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for overlapping clips on the same track
  for (const track of timelineState.tracks) {
    const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime);

    for (let i = 0; i < sortedClips.length - 1; i++) {
      const currentClip = sortedClips[i];
      const nextClip = sortedClips[i + 1];

      if (currentClip.endTime > nextClip.startTime) {
        warnings.push(
          `Overlapping clips on ${track.name}: "${currentClip.title}" and "${nextClip.title}"`,
        );
      }
    }
  }

  // Check for clips with missing media
  const clipsWithoutMedia = timelineState.tracks
    .flatMap((track) => track.clips)
    .filter((clip) => !clip.content.mediaUrl && !clip.content.text);

  if (clipsWithoutMedia.length > 0) {
    warnings.push(`${clipsWithoutMedia.length} clips are missing media content`);
  }

  return { errors, warnings };
};
