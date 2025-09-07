import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface RenderRequest {
  projectId: string;
  scenes: Array<{
    id: string;
    imageUrl: string;
    audioUrl?: string;
    duration: number;
    textOverlays?: Array<{
      text: string;
      position: { x: number; y: number };
      fontSize: number;
      color: string;
      startTime: number;
      endTime: number;
    }>;
  }>;
  outputFormat: 'mp4' | 'webm';
  resolution: '1080p' | '720p' | '480p';
  includeSubtitles: boolean;
}

interface RenderProgress {
  stage: 'preparing' | 'downloading' | 'processing' | 'rendering' | 'uploading' | 'complete';
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    );

    const { projectId, scenes, outputFormat, resolution, includeSubtitles }: RenderRequest =
      await req.json();

    // Update project status to rendering
    await supabaseClient
      .from('media_projects')
      .update({
        status: 'rendering',
        render_progress: {
          stage: 'preparing',
          progress: 0,
          message: 'Preparing render job...',
        },
      })
      .eq('id', projectId);

    // Step 1: Download all media files
    await updateProgress(supabaseClient, projectId, {
      stage: 'downloading',
      progress: 10,
      message: 'Downloading media files...',
    });

    const downloadedFiles: Array<{ path: string; type: 'image' | 'audio' }> = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];

      // Download image
      const imageResponse = await fetch(scene.imageUrl);
      const imageBlob = await imageResponse.blob();
      const imagePath = `/tmp/scene_${i}_image.${getExtension(scene.imageUrl)}`;
      await Deno.writeFile(imagePath, new Uint8Array(await imageBlob.arrayBuffer()));
      downloadedFiles.push({ path: imagePath, type: 'image' });

      // Download audio if exists
      if (scene.audioUrl) {
        const audioResponse = await fetch(scene.audioUrl);
        const audioBlob = await audioResponse.blob();
        const audioPath = `/tmp/scene_${i}_audio.${getExtension(scene.audioUrl)}`;
        await Deno.writeFile(audioPath, new Uint8Array(await audioBlob.arrayBuffer()));
        downloadedFiles.push({ path: audioPath, type: 'audio' });
      }
    }

    // Step 2: Process and render video
    await updateProgress(supabaseClient, projectId, {
      stage: 'processing',
      progress: 30,
      message: 'Processing scenes...',
    });

    const resolutionSettings = getResolutionSettings(resolution);
    const outputPath = `/tmp/output_${projectId}.${outputFormat}`;

    // Build FFmpeg command
    const ffmpegCommand = await buildFFmpegCommand(
      scenes,
      downloadedFiles,
      outputPath,
      resolutionSettings,
      outputFormat,
      includeSubtitles,
    );

    // Execute FFmpeg command
    await updateProgress(supabaseClient, projectId, {
      stage: 'rendering',
      progress: 60,
      message: 'Rendering video...',
    });

    const process = new Deno.Command('ffmpeg', {
      args: ffmpegCommand,
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code, stdout, stderr } = await process.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      throw new Error(`FFmpeg failed: ${errorText}`);
    }

    // Step 3: Upload final video to Supabase Storage
    await updateProgress(supabaseClient, projectId, {
      stage: 'uploading',
      progress: 90,
      message: 'Uploading final video...',
    });

    const videoFile = await Deno.readFile(outputPath);
    const fileName = `videos/${projectId}_${Date.now()}.${outputFormat}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('media')
      .upload(fileName, videoFile, {
        contentType: `video/${outputFormat}`,
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage.from('media').getPublicUrl(fileName);

    // Step 4: Update project with final video URL
    await supabaseClient
      .from('media_projects')
      .update({
        status: 'completed',
        export_url: urlData.publicUrl,
        render_progress: {
          stage: 'complete',
          progress: 100,
          message: 'Video rendering completed successfully!',
        },
      })
      .eq('id', projectId);

    // Clean up temporary files
    await cleanupFiles(downloadedFiles.map((f) => f.path).concat([outputPath]));

    return new Response(
      JSON.stringify({
        success: true,
        videoUrl: urlData.publicUrl,
        message: 'Video rendered successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Render error:', error);

    // Update project with error status
    if (req.headers.get('Authorization')) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: req.headers.get('Authorization')! },
          },
        },
      );

      const { projectId } = await req.json();
      if (projectId) {
        await supabaseClient
          .from('media_projects')
          .update({
            status: 'error',
            render_progress: {
              stage: 'error',
              progress: 0,
              message: error.message,
            },
          })
          .eq('id', projectId);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

async function updateProgress(supabaseClient: any, projectId: string, progress: RenderProgress) {
  await supabaseClient
    .from('media_projects')
    .update({ render_progress: progress })
    .eq('id', projectId);
}

function getExtension(url: string): string {
  const extension = url.split('.').pop()?.split('?')[0];
  return extension || 'jpg';
}

function getResolutionSettings(resolution: string): { width: number; height: number } {
  switch (resolution) {
    case '480p':
      return { width: 854, height: 480 };
    case '720p':
      return { width: 1280, height: 720 };
    case '1080p':
      return { width: 1920, height: 1080 };
    default:
      return { width: 1920, height: 1080 };
  }
}

async function buildFFmpegCommand(
  scenes: any[],
  downloadedFiles: Array<{ path: string; type: 'image' | 'audio' }>,
  outputPath: string,
  resolution: { width: number; height: number },
  outputFormat: string,
  includeSubtitles: boolean,
): Promise<string[]> {
  const command: string[] = [];

  // Input files
  const imageFiles = downloadedFiles.filter((f) => f.type === 'image');
  const audioFiles = downloadedFiles.filter((f) => f.type === 'audio');

  // Add image inputs
  imageFiles.forEach((file) => {
    command.push('-loop', '1', '-i', file.path);
  });

  // Add audio inputs
  audioFiles.forEach((file) => {
    command.push('-i', file.path);
  });

  // Set video codec and quality
  command.push(
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-pix_fmt',
    'yuv420p',
  );

  // Set resolution
  command.push('-s', `${resolution.width}x${resolution.height}`);

  // Handle multiple scenes with different durations
  if (scenes.length > 1) {
    let filterComplex = '';

    // Build filter complex for concatenating scenes
    for (let i = 0; i < scenes.length; i++) {
      const duration = scenes[i].duration;
      if (i === 0) {
        filterComplex += `[${i}:v]trim=0:${duration},setpts=PTS-STARTPTS[v${i}];`;
      } else {
        const prevDuration = scenes.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
        filterComplex += `[${i}:v]trim=${prevDuration}:${
          prevDuration + duration
        },setpts=PTS-STARTPTS[v${i}];`;
      }
    }

    // Concatenate video streams
    const videoLabels = scenes.map((_, i) => `[v${i}]`).join('');
    filterComplex += `${videoLabels}concat=n=${scenes.length}:v=1:a=0[vout]`;

    command.push('-filter_complex', filterComplex, '-map', '[vout]');

    // Handle audio concatenation if multiple audio files
    if (audioFiles.length > 1) {
      const audioLabels = scenes.map((_, i) => `[${scenes.length + i}:a]`).join('');
      const audioConcat = `${audioLabels}concat=n=${audioFiles.length}:v=0:a=1[aout]`;
      command.push('-filter_complex', `${filterComplex};${audioConcat}`, '-map', '[aout]');
    } else if (audioFiles.length === 1) {
      command.push('-map', `${scenes.length}:a`);
    }
  } else {
    // Single scene
    command.push('-t', scenes[0].duration.toString());
    if (audioFiles.length > 0) {
      command.push('-map', '1:a');
    }
  }

  // Output format specific settings
  if (outputFormat === 'webm') {
    command.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
  }

  // Output file
  command.push('-y', outputPath);

  return command;
}

async function cleanupFiles(filePaths: string[]) {
  for (const path of filePaths) {
    try {
      await Deno.remove(path);
    } catch (error) {
      console.warn(`Failed to cleanup ${path}:`, error);
    }
  }
}
