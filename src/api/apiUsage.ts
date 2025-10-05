import { supabase } from '@/lib/supabaseClient';
import { createNotification } from '@/api/notifications';

// Cost calculator interfaces
export interface CostCalculation {
  cost: number;
  tokens_used?: number;
  images_generated?: number;
  requests_count?: number;
  details: string;
}

export interface BudgetCheckResult {
  can_proceed: boolean;
  budget_limit: number;
  current_spend: number;
  projected_spend: number;
  percentage_used: number;
  alert_level: 'normal' | 'warning' | 'critical';
  alerts_enabled: boolean;
}

/**
 * Cost Calculators for different AI services
 */
export const costCalculators = {
  /**
   * OpenAI GPT models cost calculator
   */
  openai: {
    gpt3_5_turbo: (inputTokens: number, outputTokens: number): CostCalculation => {
      const inputCost = (inputTokens / 1000) * 0.002; // $0.002 per 1K input tokens
      const outputCost = (outputTokens / 1000) * 0.002; // $0.002 per 1K output tokens
      const totalCost = inputCost + outputCost;
      const totalTokens = inputTokens + outputTokens;

      return {
        cost: totalCost,
        tokens_used: totalTokens,
        requests_count: 1,
        details: `GPT-3.5 Turbo: ${inputTokens} input + ${outputTokens} output tokens`,
      };
    },

    gpt4: (inputTokens: number, outputTokens: number): CostCalculation => {
      const inputCost = (inputTokens / 1000) * 0.03; // $0.03 per 1K input tokens
      const outputCost = (outputTokens / 1000) * 0.06; // $0.06 per 1K output tokens
      const totalCost = inputCost + outputCost;
      const totalTokens = inputTokens + outputTokens;

      return {
        cost: totalCost,
        tokens_used: totalTokens,
        requests_count: 1,
        details: `GPT-4: ${inputTokens} input + ${outputTokens} output tokens`,
      };
    },

    gpt4_turbo: (inputTokens: number, outputTokens: number): CostCalculation => {
      const inputCost = (inputTokens / 1000) * 0.01; // $0.01 per 1K input tokens
      const outputCost = (outputTokens / 1000) * 0.03; // $0.03 per 1K output tokens
      const totalCost = inputCost + outputCost;
      const totalTokens = inputTokens + outputTokens;

      return {
        cost: totalCost,
        tokens_used: totalTokens,
        requests_count: 1,
        details: `GPT-4 Turbo: ${inputTokens} input + ${outputTokens} output tokens`,
      };
    },

    embeddings: (tokens: number): CostCalculation => {
      const cost = (tokens / 1000) * 0.00002; // $0.00002 per 1K tokens

      return {
        cost,
        tokens_used: tokens,
        requests_count: 1,
        details: `Embeddings: ${tokens} tokens`,
      };
    },
  },

  /**
   * Anthropic Claude cost calculator
   */
  claude: {
    sonnet: (inputTokens: number, outputTokens: number): CostCalculation => {
      const inputCost = (inputTokens / 1000000) * 3.0; // $3.00 per million input tokens
      const outputCost = (outputTokens / 1000000) * 15.0; // $15.00 per million output tokens
      const totalCost = inputCost + outputCost;
      const totalTokens = inputTokens + outputTokens;

      return {
        cost: totalCost,
        tokens_used: totalTokens,
        requests_count: 1,
        details: `Claude Sonnet: ${inputTokens} input + ${outputTokens} output tokens`,
      };
    },

    haiku: (inputTokens: number, outputTokens: number): CostCalculation => {
      const inputCost = (inputTokens / 1000000) * 0.25; // $0.25 per million input tokens
      const outputCost = (outputTokens / 1000000) * 1.25; // $1.25 per million output tokens
      const totalCost = inputCost + outputCost;
      const totalTokens = inputTokens + outputTokens;

      return {
        cost: totalCost,
        tokens_used: totalTokens,
        requests_count: 1,
        details: `Claude Haiku: ${inputTokens} input + ${outputTokens} output tokens`,
      };
    },
  },

  /**
   * Google Gemini cost calculator
   */
  gemini: {
    pro: (inputTokens: number, outputTokens: number): CostCalculation => {
      const inputCost = (inputTokens / 1000) * 0.00025; // $0.00025 per 1K input tokens
      const outputCost = (outputTokens / 1000) * 0.0005; // $0.0005 per 1K output tokens
      const totalCost = inputCost + outputCost;
      const totalTokens = inputTokens + outputTokens;

      return {
        cost: totalCost,
        tokens_used: totalTokens,
        requests_count: 1,
        details: `Gemini Pro: ${inputTokens} input + ${outputTokens} output tokens`,
      };
    },
  },

  /**
   * ElevenLabs TTS cost calculator
   */
  elevenlabs: {
    tts: (characters: number): CostCalculation => {
      // ElevenLabs charges ~$5/mo for 30k characters, then pay-as-you-go
      const costPerThousandChars = 0.1667; // Roughly $5/30k = $0.1667 per 1k chars
      const cost = (characters / 1000) * costPerThousandChars;

      return {
        cost,
        requests_count: 1,
        details: `ElevenLabs TTS: ${characters} characters`,
      };
    },
  },

  /**
   * Stability AI cost calculator
   */
  stability: {
    image_generation: (
      imageCount: number = 1,
      resolution: 'standard' | 'high' = 'standard',
    ): CostCalculation => {
      // Stability AI charges ~$10 for 1000 credits, 1-2 credits per image depending on resolution
      const creditsPerImage = resolution === 'high' ? 2 : 1;
      const totalCredits = creditsPerImage * imageCount;
      const costPerCredit = 0.01; // $10/1000 = $0.01 per credit
      const cost = totalCredits * costPerCredit;

      return {
        cost,
        images_generated: imageCount,
        requests_count: 1,
        details: `Stability AI: ${imageCount} images (${resolution} resolution)`,
      };
    },
  },

  /**
   * HeyGen video generation cost calculator
   */
  heygen: {
    video_generation: (videoMinutes: number): CostCalculation => {
      // HeyGen charges based on video minutes, ~$30/mo for basic plan
      const costPerMinute = 0.5; // Approximate cost per minute
      const cost = videoMinutes * costPerMinute;

      return {
        cost,
        requests_count: 1,
        details: `HeyGen Video: ${videoMinutes} minutes`,
      };
    },
  },

  /**
   * OpenAI Whisper STT cost calculator
   */
  whisper: {
    transcription: (audioMinutes: number): CostCalculation => {
      const cost = audioMinutes * 0.006; // $0.006 per minute

      return {
        cost,
        requests_count: 1,
        details: `Whisper STT: ${audioMinutes} minutes`,
      };
    },
  },

  /**
   * Gamma (presentation generation)
   */
  gamma: {
    presentation: (): CostCalculation => {
      // Gamma is subscription-based, no per-use cost
      return {
        cost: 0,
        requests_count: 1,
        details: 'Gamma presentation generation (subscription-based)',
      };
    },
  },
};

export interface ApiUsageRecord {
  id: string;
  date: string;
  service: string;
  agent_id?: string;
  agent?: string;
  description: string;
  cost: number;
  tokens_used?: number;
  images_generated?: number;
  requests_count?: number;
  metadata?: any;
  created_at: string;
}

export interface ApiUsageSummary {
  service: string;
  totalCost: number;
  tokensUsed?: number;
  imagesGenerated?: number;
  requestsCount: number;
}

export interface ApiUsageResponse {
  data: ApiUsageRecord | ApiUsageRecord[] | null;
  error: string | null;
}

export interface CreateApiUsageData {
  service: string;
  agent_id?: string;
  agent?: string;
  description: string;
  cost: number;
  tokens_used?: number;
  images_generated?: number;
  requests_count?: number;
  metadata?: any;
}

/**
 * Log API usage
 */
/**
 * Check budget before API action
 */
export const checkBudgetBeforeAction = async (
  service: string,
  estimatedCost: number,
  agentId?: string,
): Promise<{
  data: BudgetCheckResult | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase.rpc('check_budget_before_usage', {
      p_agent_id: agentId || null,
      p_estimated_cost: estimatedCost,
    });

    if (error) {
      console.error('Error checking budget:', error);
      return {
        data: null,
        error: error.message || 'Failed to check budget',
      };
    }

    return {
      data: data as BudgetCheckResult,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error checking budget:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while checking budget',
    };
  }
};

/**
 * Log API usage and update budget
 */
export const logApiUsage = async (
  usageData: CreateApiUsageData,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('api_usage').insert([
      {
        ...usageData,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      },
    ]);

    if (error) {
      console.error('Error logging API usage:', error);
      return {
        success: false,
        error: error.message || 'Failed to log API usage',
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error logging API usage:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while logging API usage',
    };
  }
};

/**
 * Log API usage and update budget using database function
 */
export const logApiUsageAndUpdateBudget = async (
  usageData: CreateApiUsageData,
): Promise<{ success: boolean; error: string | null; usageId?: string }> => {
  try {
    const { data, error } = await supabase.rpc('log_api_usage_and_update_budget', {
      p_service: usageData.service,
      p_agent_id: usageData.agent_id || null,
      p_agent_name: usageData.agent || null,
      p_description: usageData.description,
      p_cost: usageData.cost,
      p_tokens_used: usageData.tokens_used || 0,
      p_images_generated: usageData.images_generated || 0,
      p_requests_count: usageData.requests_count || 1,
      p_metadata: usageData.metadata || {},
    });

    if (error) {
      console.error('Error logging API usage and updating budget:', error);
      return {
        success: false,
        error: error.message || 'Failed to log API usage and update budget',
      };
    }

    // Check if budget notifications need to be sent
    try {
      await checkAndNotifyBudgetThresholds();
    } catch (notificationError) {
      console.error('Error checking budget notifications:', notificationError);
      // Don't fail the usage logging if notifications fail
    }

    return {
      success: true,
      error: null,
      usageId: data,
    };
  } catch (error) {
    console.error('Unexpected error logging API usage and updating budget:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while logging API usage and updating budget',
    };
  }
};

/**
 * Get API usage records for a date range
 */
export const getApiUsage = async (
  startDate?: string,
  endDate?: string,
  service?: string,
): Promise<ApiUsageResponse> => {
  try {
    let query = supabase.from('api_usage').select('*').order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (service) {
      query = query.eq('service', service);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching API usage:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch API usage',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching API usage:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching API usage',
    };
  }
};

/**
 * Get API usage summary by service for a date range
 */
export const getApiUsageSummary = async (
  startDate?: string,
  endDate?: string,
): Promise<{ data: ApiUsageSummary[] | null; error: string | null }> => {
  try {
    const { data, error } = await getApiUsage(startDate, endDate);

    if (error) {
      return { data: null, error };
    }

    if (!data || !Array.isArray(data)) {
      return { data: [], error: null };
    }

    const usageRecords = data as ApiUsageRecord[];

    // Group by service
    const serviceGroups: { [key: string]: ApiUsageSummary } = {};

    usageRecords.forEach((record) => {
      if (!serviceGroups[record.service]) {
        serviceGroups[record.service] = {
          service: record.service,
          totalCost: 0,
          tokensUsed: 0,
          imagesGenerated: 0,
          requestsCount: 0,
        };
      }

      serviceGroups[record.service].totalCost += record.cost;
      serviceGroups[record.service].tokensUsed! += record.tokens_used || 0;
      serviceGroups[record.service].imagesGenerated! += record.images_generated || 0;
      serviceGroups[record.service].requestsCount += record.requests_count || 1;
    });

    const summary = Object.values(serviceGroups);

    return {
      data: summary,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching API usage summary:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching API usage summary',
    };
  }
};

/**
 * Get total API cost for a date range
 */
export const getTotalApiCost = async (
  startDate?: string,
  endDate?: string,
): Promise<{ data: number | null; error: string | null }> => {
  try {
    const { data, error } = await getApiUsage(startDate, endDate);

    if (error) {
      return { data: null, error };
    }

    if (!data || !Array.isArray(data)) {
      return { data: 0, error: null };
    }

    const usageRecords = data as ApiUsageRecord[];
    const totalCost = usageRecords.reduce((sum, record) => sum + record.cost, 0);

    return {
      data: totalCost,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching total API cost:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching total API cost',
    };
  }
};

/**
 * Get budget configuration
 */
export const getBudgetConfig = async (): Promise<{
  data: {
    monthly_budget_usd: number;
    current_spend_usd: number;
    alerts_enabled: boolean;
    alert_thresholds: { warning: number; critical: number };
  } | null;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('company_config')
      .select('key, value')
      .in('key', ['monthly_budget_usd', 'current_spend_usd', 'alerts_enabled', 'alert_thresholds'])
      .eq('is_enabled', true);

    if (error) {
      console.error('Error fetching budget config:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch budget configuration',
      };
    }

    const config: any = {};
    data?.forEach((item) => {
      if (item.key === 'alert_thresholds') {
        config[item.key] = JSON.parse(item.value?.value || '{"warning": 80, "critical": 95}');
      } else {
        config[item.key] = JSON.parse(item.value?.value || '0');
      }
    });

    return {
      data: {
        monthly_budget_usd: config.monthly_budget_usd || 100.0,
        current_spend_usd: config.current_spend_usd || 0.0,
        alerts_enabled: config.alerts_enabled ?? true,
        alert_thresholds: config.alert_thresholds || { warning: 80, critical: 95 },
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching budget config:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching budget configuration',
    };
  }
};

/**
 * Update budget configuration
 */
export const updateBudgetConfig = async (
  config: Partial<{
    monthly_budget_usd: number;
    alerts_enabled: boolean;
    alert_thresholds: { warning: number; critical: number };
  }>,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const updates: Array<{ key: string; value: any }> = [];

    if (config.monthly_budget_usd !== undefined) {
      updates.push({
        key: 'monthly_budget_usd',
        value: { value: config.monthly_budget_usd.toString() },
      });
    }

    if (config.alerts_enabled !== undefined) {
      updates.push({
        key: 'alerts_enabled',
        value: { value: config.alerts_enabled.toString() },
      });
    }

    if (config.alert_thresholds !== undefined) {
      updates.push({
        key: 'alert_thresholds',
        value: { value: JSON.stringify(config.alert_thresholds) },
      });
    }

    if (updates.length > 0) {
      const { error } = await supabase
        .from('company_config')
        .upsert(updates, { onConflict: 'key' });

      if (error) {
        console.error('Error updating budget config:', error);
        return {
          success: false,
          error: error.message || 'Failed to update budget configuration',
        };
      }
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating budget config:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while updating budget configuration',
    };
  }
};

/**
 * Check if current usage is within budget
 */
export const checkBudgetLimit = async (
  costToAdd: number = 0,
): Promise<{
  data: {
    currentUsage: number;
    budgetLimit: number;
    isWithinBudget: boolean;
    projectedUsage: number;
  } | null;
  error: string | null;
}> => {
  try {
    // Get current month dates
    const now = new Date();
    const startOfMonth =
      now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';

    // Get current usage for this month
    const { data: currentUsage, error: usageError } = await getTotalApiCost(startOfMonth);

    if (usageError) {
      return { data: null, error: usageError };
    }

    // Get budget limit from settings
    const { data: budgetSetting, error: budgetError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'api_budget_limit')
      .single();

    const budgetLimit = budgetSetting ? parseFloat(budgetSetting.value) || 0 : 0;

    const actualCurrentUsage = currentUsage || 0;
    const projectedUsage = actualCurrentUsage + costToAdd;
    const isWithinBudget = projectedUsage <= budgetLimit;

    return {
      data: {
        currentUsage: actualCurrentUsage,
        budgetLimit,
        isWithinBudget,
        projectedUsage,
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error checking budget limit:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while checking budget limit',
    };
  }
};

/**
 * Check budget thresholds and send notifications if needed
 */
const checkAndNotifyBudgetThresholds = async (): Promise<void> => {
  try {
    // Get current budget status
    const { data: budgetCheck } = await checkBudgetLimit();

    if (!budgetCheck) return;

    const { currentUsage, budgetLimit, projectedUsage } = budgetCheck;
    const percentageUsed = (currentUsage / budgetLimit) * 100;

    // Get budget config for thresholds
    const { data: budgetConfig } = await getBudgetConfig();

    if (!budgetConfig?.alerts_enabled) return;

    const { alert_thresholds } = budgetConfig;
    const warningThreshold = alert_thresholds.warning;
    const criticalThreshold = alert_thresholds.critical;

    // Check if we should send warnings
    let shouldSendWarning = false;
    let warningLevel = '';

    if (percentageUsed >= criticalThreshold) {
      shouldSendWarning = true;
      warningLevel = 'critical';
    } else if (percentageUsed >= warningThreshold) {
      shouldSendWarning = true;
      warningLevel = 'warning';
    }

    if (shouldSendWarning) {
      // Get admin users to notify
      const { data: adminUsers } = await supabase.from('profiles').select('id').eq('role', 'admin');

      if (adminUsers) {
        const message = `Budget usage alert: ${percentageUsed.toFixed(
          1,
        )}% of monthly budget used ($${currentUsage.toFixed(2)} / $${budgetLimit.toFixed(2)})`;

        for (const admin of adminUsers) {
          await createNotification(
            admin.id,
            'budget',
            `Budget ${warningLevel.charAt(0).toUpperCase() + warningLevel.slice(1)} Alert`,
            message,
            '/admin/budget',
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget thresholds:', error);
    // Don't throw - budget notifications are not critical
  }
};
