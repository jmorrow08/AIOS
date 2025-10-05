# Webhooks & Automation Hooks

This document describes the webhook system for integrating AI OS with external automation services like Zapier and Tasker.

## Overview

The webhook system allows AI OS to automatically trigger events in external services when certain actions occur within the application. This enables seamless automation workflows for notifications, data synchronization, and business process automation.

## Supported Services

### Zapier

Zapier is a popular automation platform that connects different apps and services. Use Zapier webhooks to:

- Send notifications to Slack, email, or SMS
- Create records in CRM systems (HubSpot, Salesforce)
- Trigger workflows in project management tools (Trello, Asana)
- Send data to Google Sheets or Airtable

### Tasker

Tasker is an Android automation app that can perform actions on your phone or tablet. Use Tasker webhooks to:

- Send push notifications to your device
- Control smart home devices
- Run custom scripts or commands
- Trigger phone-based automations

## Setup

### 1. Database Setup

Run the settings table migration:

```sql
-- Execute the settings_table.sql file
-- This creates the settings table for storing webhook configurations
```

### 2. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Zapier Configuration
VITE_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/your-webhook-id/
VITE_ZAPIER_API_KEY=your-zapier-api-key

# Tasker Configuration
VITE_TASKER_WEBHOOK_URL=https://your-tasker-webhook-url
VITE_TASKER_API_KEY=your-tasker-api-key
```

### 3. Webhook URLs

#### Zapier Setup

1. Go to [Zapier](https://zapier.com) and create a new Zap
2. Choose "Webhooks by Zapier" as the trigger
3. Copy the webhook URL and paste it as `VITE_ZAPIER_WEBHOOK_URL`
4. Set up your Zap to respond to the events you want

#### Tasker Setup

1. In Tasker, create a new profile with HTTP Request context
2. Set the URL to receive webhook events
3. Copy that URL and set it as `VITE_TASKER_WEBHOOK_URL`
4. Configure Tasker to perform desired actions when events are received

## Event Types

The following events are automatically triggered:

### Client Events

- `client_created`: When a new client/company is created
- Payload: `ClientCreatedPayload`

### Invoice Events

- `invoice_created`: When a new invoice is created
- `invoice_overdue`: When an invoice becomes overdue
- Payload: `InvoiceCreatedPayload` | `InvoiceOverduePayload`

### Job Events

- `job_created`: When a new job is created
- `job_completed`: When a job is marked as completed
- Payload: `JobCreatedPayload` | `JobCompletedPayload`

### Document Events

- `document_uploaded`: When a document is uploaded to the knowledge library
- Payload: `DocumentUploadedPayload`

### Media Events

- `media_generated`: When AI-generated media is created
- Payload: `MediaGeneratedPayload`

## Usage Examples

### Basic Usage

```typescript
import { triggerClientCreated, sendZapierEvent } from '@/api/hooks';

// Trigger a client created event
await triggerClientCreated({
  client_id: '123',
  client_name: 'ABC Company',
  contact_email: 'contact@abc.com',
  created_at: new Date().toISOString(),
});

// Send a custom event
await sendZapierEvent('custom_event', {
  message: 'Custom event triggered',
  data: { key: 'value' },
});
```

### Integration with Existing APIs

To integrate webhooks with existing API functions, add the trigger calls after successful operations:

```typescript
// In src/api/companies.ts
export const createCompany = async (companyData: CreateCompanyData) => {
  // ... existing code ...

  if (data) {
    await triggerClientCreated({
      client_id: data.id,
      client_name: data.name,
      contact_email: data.contact_info?.email,
      created_at: data.created_at,
    });
  }

  return { data, error: null };
};
```

### Configuration Management

```typescript
import { updateWebhookConfig, testWebhook } from '@/api/hooks';

// Update webhook configuration
await updateWebhookConfig({
  zapier: {
    enabled: true,
    webhook_url: 'https://hooks.zapier.com/hooks/catch/...',
    api_key: 'your-api-key',
  },
});

// Test webhook configuration
const result = await testWebhook('zapier');
console.log('Test result:', result);
```

## Webhook Payload Structure

All webhook payloads follow this structure:

```typescript
{
  event_type: string,        // The event type (e.g., 'client_created')
  timestamp: string,         // ISO timestamp of when the event occurred
  source: 'ai_os_supabase',  // Identifies the source system
  payload: object           // Event-specific payload data
}
```

## Error Handling

The webhook system includes comprehensive error handling:

- If a webhook service is not configured, the trigger functions will return early without errors
- Failed webhook requests are logged but don't interrupt the main application flow
- Configuration errors are handled gracefully with fallback to environment variables

## Security Considerations

- Webhook URLs and API keys should be kept secure
- Use HTTPS for all webhook endpoints
- Consider implementing webhook signature verification for production use
- Regularly rotate API keys

## Testing

Use the `testWebhook` function to verify your webhook configuration:

```typescript
import { testWebhook } from '@/api/hooks';

const result = await testWebhook('zapier');
if (result.success) {
  console.log('Webhook test successful!');
} else {
  console.error('Webhook test failed:', result.error);
}
```

## Troubleshooting

### Common Issues

1. **Webhook not triggering**: Check that the webhook URL is correctly configured
2. **Authentication errors**: Verify API keys are correct
3. **Network errors**: Ensure the webhook service is accessible
4. **Payload format issues**: Check that your Zap/Tasker configuration expects the correct payload structure

### Debugging

Enable detailed logging by checking the browser console for webhook-related messages. All webhook operations are logged with their results.

## Advanced Usage

### Custom Event Types

You can extend the system with custom event types:

```typescript
import { sendZapierEvent, HookEventType } from '@/api/hooks';

const customEvent: HookEventType = 'custom_event' as HookEventType;

await sendZapierEvent(customEvent, {
  custom_data: 'your custom payload',
});
```

### Batch Webhook Operations

For high-volume operations, consider batching webhook calls:

```typescript
import { sendEventToAllWebhooks } from '@/api/hooks';

const events = [
  { type: 'client_created', payload: clientData },
  { type: 'invoice_created', payload: invoiceData },
];

for (const event of events) {
  await sendEventToAllWebhooks(event.type, event.payload);
}
```
