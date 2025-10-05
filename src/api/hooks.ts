import { supabase } from '@/lib/supabaseClient';
import { logApiUsageAndUpdateBudget } from '@/api/apiUsage';

// Event types for webhook triggers
export type HookEventType =
  | 'client_created'
  | 'invoice_created'
  | 'invoice_overdue'
  | 'job_created'
  | 'job_completed'
  | 'document_uploaded'
  | 'media_generated';

// Payload interfaces for different event types
export interface ClientCreatedPayload {
  client_id: string;
  client_name: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
}

export interface InvoiceCreatedPayload {
  invoice_id: string;
  client_id: string;
  client_name: string;
  amount: number;
  currency: string;
  due_date: string;
  status: string;
  created_at: string;
}

export interface InvoiceOverduePayload {
  invoice_id: string;
  client_id: string;
  client_name: string;
  amount: number;
  currency: string;
  due_date: string;
  days_overdue: number;
  status: string;
}

export interface JobCreatedPayload {
  job_id: string;
  job_title: string;
  client_id?: string;
  client_name?: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface JobCompletedPayload {
  job_id: string;
  job_title: string;
  client_id?: string;
  client_name?: string;
  completed_at: string;
  status: string;
}

export interface DocumentUploadedPayload {
  document_id: string;
  title: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

export interface MediaGeneratedPayload {
  media_id: string;
  media_type: 'image' | 'video' | 'audio';
  ai_service: string;
  prompt: string;
  file_url: string;
  generated_at: string;
}

// Union type for all possible payloads
export type HookPayload =
  | ClientCreatedPayload
  | InvoiceCreatedPayload
  | InvoiceOverduePayload
  | JobCreatedPayload
  | JobCompletedPayload
  | DocumentUploadedPayload
  | MediaGeneratedPayload;

// Hook response interface
export interface HookResponse {
  success: boolean;
  message: string;
  webhook_id?: string;
  error?: string;
}

// Configuration interface for webhook endpoints
export interface WebhookConfig {
  zapier: {
    enabled: boolean;
    webhook_url?: string;
    api_key?: string;
  };
  tasker: {
    enabled: boolean;
    webhook_url?: string;
    api_key?: string;
  };
}

// Default webhook configuration
const defaultWebhookConfig: WebhookConfig = {
  zapier: {
    enabled: false,
  },
  tasker: {
    enabled: false,
  },
};

// Get webhook configuration from environment or database
const getWebhookConfig = async (): Promise<WebhookConfig> => {
  try {
    // Try to get from Supabase settings table first
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['zapier_webhook_url', 'zapier_api_key', 'tasker_webhook_url', 'tasker_api_key']);

    if (error) {
      console.warn('Error fetching webhook config from database:', error);
    }

    const config = { ...defaultWebhookConfig };

    if (data) {
      data.forEach((setting) => {
        if (setting.key === 'zapier_webhook_url') {
          config.zapier.webhook_url = setting.value;
          config.zapier.enabled = !!setting.value;
        } else if (setting.key === 'zapier_api_key') {
          config.zapier.api_key = setting.value;
        } else if (setting.key === 'tasker_webhook_url') {
          config.tasker.webhook_url = setting.value;
          config.tasker.enabled = !!setting.value;
        } else if (setting.key === 'tasker_api_key') {
          config.tasker.api_key = setting.value;
        }
      });
    }

    // Fallback to environment variables
    if (!config.zapier.webhook_url) {
      config.zapier.webhook_url = import.meta.env.VITE_ZAPIER_WEBHOOK_URL;
      config.zapier.enabled = !!config.zapier.webhook_url;
    }
    if (!config.zapier.api_key) {
      config.zapier.api_key = import.meta.env.VITE_ZAPIER_API_KEY;
    }
    if (!config.tasker.webhook_url) {
      config.tasker.webhook_url = import.meta.env.VITE_TASKER_WEBHOOK_URL;
      config.tasker.enabled = !!config.tasker.webhook_url;
    }
    if (!config.tasker.api_key) {
      config.tasker.api_key = import.meta.env.VITE_TASKER_API_KEY;
    }

    return config;
  } catch (error) {
    console.error('Error getting webhook config:', error);
    return defaultWebhookConfig;
  }
};

/**
 * Send event to Zapier webhook
 */
export const sendZapierEvent = async (
  eventType: HookEventType,
  payload: HookPayload,
): Promise<HookResponse> => {
  try {
    const config = await getWebhookConfig();

    if (!config.zapier.enabled || !config.zapier.webhook_url) {
      return {
        success: false,
        message: 'Zapier webhook not configured',
        error: 'Webhook URL not set',
      };
    }

    const webhookData = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      source: 'ai_os_supabase',
      payload,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.zapier.api_key) {
      headers['Authorization'] = `Bearer ${config.zapier.api_key}`;
    }

    const response = await fetch(config.zapier.webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json().catch(() => ({}));

    // Log webhook usage (typically low/no cost, but track for monitoring)
    await logApiUsageAndUpdateBudget({
      service: 'Webhook',
      description: `Zapier webhook: ${eventType}`,
      cost: 0, // Webhooks are typically free or very low cost
      metadata: {
        event_type: eventType,
        service: 'zapier',
        webhook_url: config.zapier.webhook_url,
      },
    });

    return {
      success: true,
      message: 'Event sent to Zapier successfully',
      webhook_id: responseData.id || `zapier-${Date.now()}`,
    };
  } catch (error) {
    console.error('Error sending Zapier event:', error);
    return {
      success: false,
      message: 'Failed to send event to Zapier',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Send event to Tasker webhook
 */
export const sendTaskerEvent = async (
  eventType: HookEventType,
  payload: HookPayload,
): Promise<HookResponse> => {
  try {
    const config = await getWebhookConfig();

    if (!config.tasker.enabled || !config.tasker.webhook_url) {
      return {
        success: false,
        message: 'Tasker webhook not configured',
        error: 'Webhook URL not set',
      };
    }

    const webhookData = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      source: 'ai_os_supabase',
      payload,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.tasker.api_key) {
      headers['Authorization'] = `Bearer ${config.tasker.api_key}`;
    }

    const response = await fetch(config.tasker.webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json().catch(() => ({}));

    // Log webhook usage (typically low/no cost, but track for monitoring)
    await logApiUsageAndUpdateBudget({
      service: 'Webhook',
      description: `Tasker webhook: ${eventType}`,
      cost: 0, // Webhooks are typically free or very low cost
      metadata: {
        event_type: eventType,
        service: 'tasker',
        webhook_url: config.tasker.webhook_url,
      },
    });

    return {
      success: true,
      message: 'Event sent to Tasker successfully',
      webhook_id: responseData.id || `tasker-${Date.now()}`,
    };
  } catch (error) {
    console.error('Error sending Tasker event:', error);
    return {
      success: false,
      message: 'Failed to send event to Tasker',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Send event to all configured webhooks
 */
export const sendEventToAllWebhooks = async (
  eventType: HookEventType,
  payload: HookPayload,
): Promise<HookResponse[]> => {
  const results: HookResponse[] = [];

  // Send to Zapier
  const zapierResult = await sendZapierEvent(eventType, payload);
  results.push(zapierResult);

  // Send to Tasker
  const taskerResult = await sendTaskerEvent(eventType, payload);
  results.push(taskerResult);

  return results;
};

/**
 * Trigger hooks for client creation
 */
export const triggerClientCreated = async (clientData: ClientCreatedPayload): Promise<void> => {
  console.log('Triggering client created hooks:', clientData);

  await sendEventToAllWebhooks('client_created', clientData);
};

/**
 * Trigger hooks for invoice creation
 */
export const triggerInvoiceCreated = async (invoiceData: InvoiceCreatedPayload): Promise<void> => {
  console.log('Triggering invoice created hooks:', invoiceData);

  await sendEventToAllWebhooks('invoice_created', invoiceData);
};

/**
 * Trigger hooks for invoice overdue
 */
export const triggerInvoiceOverdue = async (invoiceData: InvoiceOverduePayload): Promise<void> => {
  console.log('Triggering invoice overdue hooks:', invoiceData);

  await sendEventToAllWebhooks('invoice_overdue', invoiceData);
};

/**
 * Trigger hooks for job creation
 */
export const triggerJobCreated = async (jobData: JobCreatedPayload): Promise<void> => {
  console.log('Triggering job created hooks:', jobData);

  await sendEventToAllWebhooks('job_created', jobData);
};

/**
 * Trigger hooks for job completion
 */
export const triggerJobCompleted = async (jobData: JobCompletedPayload): Promise<void> => {
  console.log('Triggering job completed hooks:', jobData);

  await sendEventToAllWebhooks('job_completed', jobData);
};

/**
 * Trigger hooks for document upload
 */
export const triggerDocumentUploaded = async (
  documentData: DocumentUploadedPayload,
): Promise<void> => {
  console.log('Triggering document uploaded hooks:', documentData);

  await sendEventToAllWebhooks('document_uploaded', documentData);
};

/**
 * Trigger hooks for media generation
 */
export const triggerMediaGenerated = async (mediaData: MediaGeneratedPayload): Promise<void> => {
  console.log('Triggering media generated hooks:', mediaData);

  await sendEventToAllWebhooks('media_generated', mediaData);
};

/**
 * Update webhook configuration
 */
export const updateWebhookConfig = async (
  config: Partial<WebhookConfig>,
): Promise<HookResponse> => {
  try {
    const updates: Array<{ key: string; value: string }> = [];

    if (config.zapier?.webhook_url !== undefined) {
      updates.push({
        key: 'zapier_webhook_url',
        value: config.zapier.webhook_url,
      });
    }

    if (config.zapier?.api_key !== undefined) {
      updates.push({
        key: 'zapier_api_key',
        value: config.zapier.api_key,
      });
    }

    if (config.tasker?.webhook_url !== undefined) {
      updates.push({
        key: 'tasker_webhook_url',
        value: config.tasker.webhook_url,
      });
    }

    if (config.tasker?.api_key !== undefined) {
      updates.push({
        key: 'tasker_api_key',
        value: config.tasker.api_key,
      });
    }

    if (updates.length > 0) {
      const { error } = await supabase.from('settings').upsert(updates, {
        onConflict: 'key',
      });

      if (error) {
        throw error;
      }
    }

    return {
      success: true,
      message: 'Webhook configuration updated successfully',
    };
  } catch (error) {
    console.error('Error updating webhook config:', error);
    return {
      success: false,
      message: 'Failed to update webhook configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Test webhook configuration
 */
export const testWebhook = async (service: 'zapier' | 'tasker'): Promise<HookResponse> => {
  const testPayload = {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'Test webhook from AI OS',
  };

  if (service === 'zapier') {
    return await sendZapierEvent('client_created' as HookEventType, testPayload as any);
  } else {
    return await sendTaskerEvent('client_created' as HookEventType, testPayload as any);
  }
};
