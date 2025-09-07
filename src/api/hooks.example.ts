/**
 * Example usage of webhook hooks in the AI OS application
 *
 * This file demonstrates how to integrate webhook triggers into existing
 * API functions and components.
 */

import {
  triggerClientCreated,
  triggerInvoiceCreated,
  triggerInvoiceOverdue,
  triggerJobCreated,
  triggerJobCompleted,
  triggerDocumentUploaded,
  triggerMediaGenerated,
  sendZapierEvent,
  sendTaskerEvent,
  updateWebhookConfig,
  testWebhook,
} from './hooks';

// Example: Integrate with companies API
// In src/api/companies.ts, modify the createCompany function:

// Original createCompany function (modify to add webhook trigger)
/*
export const createCompany = async (companyData: CreateCompanyData): Promise<CompanyResponse> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return {
        data: null,
        error: error.message || 'Failed to create company',
      };
    }

    // Trigger webhook after successful creation
    if (data) {
      await triggerClientCreated({
        client_id: data.id,
        client_name: data.name,
        contact_email: data.contact_info?.email,
        contact_phone: data.contact_info?.phone,
        created_at: data.created_at,
      });
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating company:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the company',
    };
  }
};
*/

// Example: Integrate with invoices API
// In src/api/invoices.ts, modify invoice-related functions:

/*
// Trigger when invoice is created
export const createInvoice = async (invoiceData: CreateInvoiceData): Promise<InvoiceResponse> => {
  // ... existing code ...

  if (data) {
    await triggerInvoiceCreated({
      invoice_id: data.id,
      client_id: data.client_id,
      client_name: data.client_name,
      amount: data.amount,
      currency: data.currency || 'USD',
      due_date: data.due_date,
      status: data.status,
      created_at: data.created_at,
    });
  }

  // ... rest of function ...
};

// Check for overdue invoices and trigger webhooks
export const checkOverdueInvoices = async (): Promise<void> => {
  const { data: overdueInvoices, error } = await supabase
    .from('invoices')
    .select('*')
    .lt('due_date', new Date().toISOString())
    .eq('status', 'sent');

  if (error) {
    console.error('Error checking overdue invoices:', error);
    return;
  }

  for (const invoice of overdueInvoices || []) {
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    await triggerInvoiceOverdue({
      invoice_id: invoice.id,
      client_id: invoice.client_id,
      client_name: invoice.client_name,
      amount: invoice.amount,
      currency: invoice.currency || 'USD',
      due_date: invoice.due_date,
      days_overdue: daysOverdue,
      status: invoice.status,
    });
  }
};
*/

// Example: Integrate with jobs API
/*
export const createJob = async (jobData: CreateJobData): Promise<JobResponse> => {
  // ... existing code ...

  if (data) {
    await triggerJobCreated({
      job_id: data.id,
      job_title: data.title,
      client_id: data.client_id,
      client_name: data.client_name,
      priority: data.priority || 'medium',
      status: data.status,
      created_at: data.created_at,
    });
  }

  // ... rest of function ...
};

export const updateJobStatus = async (jobId: string, newStatus: string): Promise<JobResponse> => {
  // ... existing code ...

  if (data && newStatus === 'completed') {
    await triggerJobCompleted({
      job_id: data.id,
      job_title: data.title,
      client_id: data.client_id,
      client_name: data.client_name,
      completed_at: new Date().toISOString(),
      status: newStatus,
    });
  }

  // ... rest of function ...
};
*/

// Example: Integrate with documents API
/*
export const uploadDocument = async (file: File, metadata: DocumentMetadata): Promise<DocumentResponse> => {
  // ... existing code ...

  if (data) {
    await triggerDocumentUploaded({
      document_id: data.id,
      title: data.title,
      file_name: data.file_name,
      file_size: data.file_size,
      file_type: data.file_type,
      uploaded_at: data.created_at,
    });
  }

  // ... rest of function ...
};
*/

// Example: Integrate with media assets API
/*
export const createMediaAsset = async (assetData: CreateMediaAssetData): Promise<MediaAssetResponse> => {
  // ... existing code ...

  if (data) {
    await triggerMediaGenerated({
      media_id: data.id,
      media_type: data.media_type,
      ai_service: data.ai_service,
      prompt: data.prompt,
      file_url: data.file_url,
      generated_at: data.created_at,
    });
  }

  // ... rest of function ...
};
*/

// Example: Manual webhook triggering
/*
const exampleUsage = async () => {
  // Send custom event to Zapier
  const zapierResult = await sendZapierEvent('client_created', {
    client_id: '123',
    client_name: 'Example Client',
    created_at: new Date().toISOString(),
  });

  // Send custom event to Tasker
  const taskerResult = await sendTaskerEvent('invoice_created', {
    invoice_id: '456',
    client_id: '123',
    amount: 1000,
    currency: 'USD',
  });

  // Update webhook configuration
  await updateWebhookConfig({
    zapier: {
      enabled: true,
      webhook_url: 'https://hooks.zapier.com/hooks/catch/...',
      api_key: 'your-zapier-api-key',
    },
    tasker: {
      enabled: true,
      webhook_url: 'https://your-tasker-webhook-url',
      api_key: 'your-tasker-api-key',
    },
  });

  // Test webhook configuration
  const testResult = await testWebhook('zapier');
  console.log('Webhook test result:', testResult);
};
*/

// Environment variables needed:
// VITE_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
// VITE_ZAPIER_API_KEY=your-zapier-api-key
// VITE_TASKER_WEBHOOK_URL=https://your-tasker-webhook-url
// VITE_TASKER_API_KEY=your-tasker-api-key

export {}; // Make this a module
