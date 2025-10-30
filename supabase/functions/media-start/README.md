# Media Start Edge Function

Supabase Edge Function for AI media generation (images, videos, audio) with multi-provider support and budget tracking.

## Features

- **Multi-Provider Support**: ComfyUI (local), Runway, HeyGen, ElevenLabs, OpenAI
- **Job Queue Management**: Asynchronous processing with status tracking
- **Budget Management**: Automatic cost estimation and budget checking
- **Company Isolation**: Multi-tenant with company-scoped jobs
- **Usage Logging**: Tracks costs and metadata in `api_usage` table

## API Endpoint

```
POST https://your-project.supabase.co/functions/v1/media-start
```

## Request Body

```json
{
  "companyId": "uuid-of-company",
  "jobType": "image", // "image" | "video" | "audio"
  "params": {
    "prompt": "A futuristic office", // for images/videos
    "duration": 10, // for videos/audio (seconds)
    "voice": "en-US-Neural2-D", // for audio
    "style": "realistic" // optional style hints
  },
  "provider": "comfyui" // optional: "comfyui" | "runway" | "heygen" | "elevenlabs" | "openai"
}
```

## Response

```json
{
  "success": true,
  "jobId": "uuid-of-job",
  "status": "queued",
  "provider": "comfyui",
  "estimated_cost": 0,
  "message": "Job queued for ComfyUI processing"
}
```

## Provider Configuration

### ComfyUI (Local/Free)

- **Environment**: Set `COMFY_WORKER_URL=http://localhost:8188`
- **Models**: Requires SDXL checkpoint and VAE
- **Cost**: $0 (local)
- **Setup**: Run ComfyUI with SDXL models

### SaaS Providers

Add API keys to `provider_keys` table:

```sql
INSERT INTO provider_keys (company_id, provider, key_data)
VALUES ('company-uuid', 'runway', '{"apiKey": "runway-key"}');
```

## Environment Variables

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional - for ComfyUI
COMFY_WORKER_URL=http://localhost:8188
```

## Testing

```bash
# Test image generation with ComfyUI
curl -X POST https://your-project.supabase.co/functions/v1/media-start \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "your-company-id",
    "jobType": "image",
    "params": {
      "prompt": "a futuristic office with robots"
    },
    "provider": "comfyui"
  }'

# Check job status
curl -X GET https://your-project.supabase.co/functions/v1/media-status?jobId=job-uuid \
  -H "Authorization: Bearer your-anon-key"
```

## Database Tables Used

- `media_projects`: Job queue and status tracking
- `media_assets`: Completed media files
- `api_usage`: Usage tracking and costs
- `provider_keys`: API keys per company/provider

## Job Status Flow

1. `queued` → Job created and queued
2. `processing` → Being processed by worker
3. `completed` → Successfully finished
4. `failed` → Processing failed

## Deploy

```bash
supabase functions deploy media-start
```
