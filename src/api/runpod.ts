import { supabase } from '@/lib/supabaseClient';

export interface RunPodServiceStatus {
  ollama: boolean;
  comfyui: boolean;
  gpu_available: boolean;
  instance_running: boolean;
}

export interface RunPodStatusResponse {
  data: RunPodServiceStatus | null;
  error: string | null;
}

/**
 * Check the status of RunPod services
 */
export const checkRunPodServices = async (): Promise<RunPodStatusResponse> => {
  try {
    // Check Ollama status
    let ollamaStatus = false;
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      ollamaStatus = ollamaResponse.ok;
    } catch (error) {
      console.warn('Ollama service check failed:', error);
    }

    // Check ComfyUI status
    let comfyuiStatus = false;
    try {
      const comfyResponse = await fetch('http://localhost:8188/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      comfyuiStatus = comfyResponse.ok;
    } catch (error) {
      console.warn('ComfyUI service check failed:', error);
    }

    // GPU availability check (simplified)
    const gpuAvailable = true; // Assume GPU is available for now

    // Instance running status (based on services being accessible)
    const instanceRunning = ollamaStatus || comfyuiStatus;

    return {
      data: {
        ollama: ollamaStatus,
        comfyui: comfyuiStatus,
        gpu_available: gpuAvailable,
        instance_running: instanceRunning,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error checking RunPod services:', error);
    return {
      data: null,
      error: 'Failed to check RunPod service status',
    };
  }
};

/**
 * Test AI generation with RunPod services
 */
export const testRunPodGeneration = async (
  type: 'chat' | 'image',
  prompt: string,
): Promise<{ data: any; error: string | null }> => {
  try {
    if (type === 'chat') {
      // Test Ollama chat
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.1:8b',
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: { response: data.response }, error: null };
    } else if (type === 'image') {
      // Test ComfyUI image generation (simplified)
      const workflow = {
        '1': {
          inputs: {
            ckpt_name: 'sdxl_base_1.0.safetensors',
          },
          class_type: 'CheckpointLoaderSimple',
          _meta: { title: 'Load Checkpoint' },
        },
        '2': {
          inputs: {
            text: prompt,
            clip: ['1', 1],
          },
          class_type: 'CLIPTextEncode',
          _meta: { title: 'Positive Prompt' },
        },
        '3': {
          inputs: {
            text: 'blurry, ugly, deformed',
            clip: ['1', 1],
          },
          class_type: 'CLIPTextEncode',
          _meta: { title: 'Negative Prompt' },
        },
        '4': {
          inputs: {
            seed: Math.floor(Math.random() * 1000000),
            steps: 10,
            cfg: 7,
            sampler_name: 'euler',
            scheduler: 'normal',
            denoise: 1,
            model: ['1', 0],
            positive: ['2', 0],
            negative: ['3', 0],
            latent_image: ['5', 0],
          },
          class_type: 'KSampler',
          _meta: { title: 'KSampler' },
        },
        '5': {
          inputs: {
            width: 512,
            height: 512,
            batch_size: 1,
          },
          class_type: 'EmptyLatentImage',
          _meta: { title: 'Empty Latent Image' },
        },
        '6': {
          inputs: {
            samples: ['4', 0],
            vae: ['1', 2],
          },
          class_type: 'VAEDecode',
          _meta: { title: 'VAE Decode' },
        },
        '7': {
          inputs: {
            filename_prefix: `test_${Date.now()}`,
            images: ['6', 0],
          },
          class_type: 'SaveImage',
          _meta: { title: 'Save Image' },
        },
      };

      const response = await fetch('http://localhost:8188/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: workflow }),
      });

      if (!response.ok) {
        throw new Error(`ComfyUI API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: { prompt_id: data.prompt_id }, error: null };
    }

    return { data: null, error: 'Unsupported test type' };
  } catch (error) {
    console.error('Error testing RunPod generation:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to test RunPod generation',
    };
  }
};

/**
 * Start RunPod services (if configured)
 */
export const startRunPodServices = async (): Promise<{
  success: boolean;
  error: string | null;
}> => {
  try {
    // This would typically make API calls to RunPod to start instances
    // For now, we'll assume local services are started manually
    console.log('RunPod service start requested - local services should be running');

    return { success: true, error: null };
  } catch (error) {
    console.error('Error starting RunPod services:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start RunPod services',
    };
  }
};








