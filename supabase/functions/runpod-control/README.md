# RunPod Control Function

This Supabase Edge Function provides control over RunPod GPU instances for AI services.

## Endpoints

### POST /

Perform pod control actions (start, stop, status).

**Request Body:**

```json
{
  "action": "start" | "stop" | "status",
  "podId": "string" // Required for start/stop, optional for status
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "pod-id",
    "status": "RUNNING" | "STOPPED" | "STARTING" | "STOPPING",
    "uptime": 3600,
    "ports": [
      {
        "privatePort": 11434,
        "publicPort": 11434,
        "type": "tcp"
      }
    ],
    "lastStatusChange": "2024-01-01T00:00:00Z"
  }
}
```

### GET /

Get current pod status using persisted podId.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "pod-id",
    "name": "pod-name",
    "status": "RUNNING",
    "uptime": 3600,
    "ports": [...],
    "desiredState": "running",
    "lastStatusChange": "2024-01-01T00:00:00Z"
  }
}
```

## Environment Variables

- `RUNPOD_API_KEY`: Your RunPod API key
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Error Codes

- `INVALID_ACTION`: Invalid action parameter
- `MISSING_POD_ID`: podId required but not provided
- `NO_POD_ID`: No podId in request or persisted state
- `RUNPOD_API_ERROR`: Error from RunPod API
- `STATUS_CHECK_ERROR`: Error checking pod status
- `INTERNAL_ERROR`: Internal server error

