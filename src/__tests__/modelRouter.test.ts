import { describe, it, expect } from 'vitest';
import {
  selectModel,
  type TaskType,
  type LatencyTolerance,
  type CostMode,
} from '../lib/modelRouter';

describe('Model Router', () => {
  it('should select a model for chat task', async () => {
    const criteria = {
      taskType: 'chat' as TaskType,
      latencyTolerance: 'normal' as LatencyTolerance,
      costMode: 'balanced' as CostMode,
      runpodEnabled: false,
      providerAvailability: {
        openai: true,
        claude: true,
        gemini: true,
        ollama: false,
      },
    };

    const model = await selectModel(criteria);
    expect(model).toBeDefined();
    expect(model?.capabilities).toContain('chat');
  });

  it('should prefer Ollama when runpod is enabled', async () => {
    const criteria = {
      taskType: 'chat' as TaskType,
      latencyTolerance: 'normal' as LatencyTolerance,
      costMode: 'budget' as CostMode,
      runpodEnabled: true,
      providerAvailability: {
        openai: true,
        claude: true,
        gemini: true,
        ollama: true,
      },
    };

    const model = await selectModel(criteria);
    expect(model).toBeDefined();
    // Should prefer Ollama when runpod is enabled and cost mode is budget
    expect(model?.provider).toBe('ollama');
  });

  it('should return null when no models are available', async () => {
    const criteria = {
      taskType: 'chat' as TaskType,
      latencyTolerance: 'normal' as LatencyTolerance,
      costMode: 'balanced' as CostMode,
      runpodEnabled: false,
      providerAvailability: {
        openai: false,
        claude: false,
        gemini: false,
        ollama: false,
      },
    };

    const model = await selectModel(criteria);
    expect(model).toBeNull();
  });
});


