# n8n Webhook Proxy

This Edge function acts as a secure proxy between n8n workflows and the AI OS internal APIs. It validates webhook requests using a shared secret and forwards validated events to update the database.

## Purpose

The n8n webhook proxy enables secure communication between n8n automation workflows and the AI OS database, specifically for:

- Social media post completion updates
- Content performance metrics collection
- General automation status tracking

## Authentication

Requests must include a `Bearer` token in the `Authorization` header that matches the `N8N_WEBHOOK_SECRET` environment variable.

## Supported Events

### `social_post_completed`

Updates scheduled posts with completion status and external platform IDs.

**Payload:**

```json
{
  "event": "social_post_completed",
  "data": {
    "results": [
      {
        "postId": "uuid",
        "platform": "twitter|linkedin|facebook|instagram|tiktok|youtube",
        "status": "posted|failed",
        "externalPostId": "platform-specific-id",
        "error": "error message if failed"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### `content_performance_updated`

Inserts content performance metrics from social platforms.

**Payload:**

```json
{
  "event": "content_performance_updated",
  "data": {
    "performance": [
      {
        "postId": "uuid",
        "platform": "twitter|linkedin|facebook|instagram|tiktok|youtube",
        "metrics": {
          "likes": 42,
          "shares": 12,
          "comments": 8,
          "views": 1500
        },
        "capturedAt": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### `automation_status_update`

Logs general automation workflow status updates.

**Payload:**

```json
{
  "event": "automation_status_update",
  "data": {
    "automationId": "workflow-id",
    "status": "completed|failed|running",
    "details": {
      "custom": "data"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Environment Variables

- `N8N_WEBHOOK_SECRET`: Shared secret for webhook authentication
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Usage in n8n

Create an HTTP Request node in n8n with:

- **Method**: POST
- **URL**: `https://your-project.supabase.co/functions/v1/n8n-webhook-proxy`
- **Headers**:
  - `Authorization`: `Bearer your-webhook-secret`
  - `Content-Type`: `application/json`
- **Body**: JSON payload matching the event format above

## Response

All successful requests return HTTP 200 with:

```json
{
  "success": true,
  "message": "Description of what was processed",
  "results": [...] // Array of individual operation results
}
```

Failed requests return appropriate HTTP error codes (400, 401, 500) with error details.


