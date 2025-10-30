# Social Post Scheduler

This Edge function runs as a cron job to automatically check for due scheduled social media posts and send them to n8n for processing and publishing.

## Purpose

The social post scheduler enables automated publishing of content at scheduled times by:

1. Checking for posts with `status = 'pending'` and `scheduled_at <= now()`
2. Updating their status to `'queued'`
3. Sending batches of due posts to the configured n8n webhook
4. Handling webhook failures by marking posts as `'failed'`

## Cron Configuration

This function should be configured to run every 10 minutes via Supabase cron:

```sql
-- Example cron configuration (adjust timing as needed)
SELECT cron.schedule(
  'social-post-scheduler',
  '*/10 * * * *', -- Every 10 minutes
  'SELECT net.http_post(
    url := ''https://your-project.supabase.co/functions/v1/social-post-scheduler'',
    headers := ''{"Content-Type": "application/json", "Authorization": "Bearer your-anon-key"}''::jsonb,
    body := ''{}''::jsonb
  );'
);
```

## Required Settings

The following settings must be configured in the `settings` table:

- `n8n_base_url`: Base URL of your n8n instance (e.g., `https://n8n.yourdomain.com`)
- `n8n_webhook_secret`: Shared secret for webhook authentication

## n8n Workflow Requirements

Your n8n workflow should:

1. **Trigger**: Webhook trigger listening on `/webhook/social-post-scheduler`
2. **Authentication**: Verify `Authorization: Bearer <n8n_webhook_secret>` header
3. **Processing**: Handle the batch of posts in the payload
4. **Actions**: Post to appropriate social media platforms
5. **Callback**: Send results back via the `n8n-webhook-proxy` function

## Expected n8n Payload

```json
{
  "event": "posts_ready_for_scheduling",
  "data": {
    "posts": [
      {
        "id": "uuid",
        "companyId": "uuid",
        "platform": "twitter|linkedin|facebook|instagram|tiktok|youtube",
        "content": "Post content here...",
        "mediaAssetId": "uuid", // Optional
        "scheduledAt": "2024-01-01T10:00:00Z",
        "externalIds": {}
      }
    ],
    "batchId": "batch_1704110400000",
    "totalCount": 1
  },
  "timestamp": "2024-01-01T09:50:00Z",
  "source": "social-post-scheduler"
}
```

## Response

Successful execution returns HTTP 200 with:

```json
{
  "success": true,
  "message": "Processed X scheduled posts",
  "results": {
    "total": 5,
    "successful": 5,
    "failed": 0,
    "sent_to_n8n": 5
  },
  "details": [
    {
      "postId": "uuid",
      "success": true,
      "status": "queued"
    }
  ]
}
```

## Error Handling

- **Configuration Errors**: Returns 500 if n8n settings are missing
- **Database Errors**: Returns 500 if unable to query/update posts
- **Webhook Errors**: Marks affected posts as `'failed'` with error details

## Manual Testing

You can manually trigger the scheduler by calling the function endpoint:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/social-post-scheduler \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json"
```

## Database Impact

The scheduler updates the `scheduled_posts` table:

- `status`: `'pending'` → `'queued'` (on success) or `'failed'` (on error)
- `error`: Populated with error messages when applicable
- `updated_at`: Timestamp of processing

## Monitoring

Monitor the function logs for:

- Number of posts processed per run
- Webhook success/failure rates
- Any configuration or connectivity issues


