# Deployment Environment Configuration

## Phase 0: RunPod GPU Setup

Update your Supabase Edge Function environment variables:

```bash
# In supabase/functions/.env
OLLAMA_BASE_URL=https://your-runpod-ollama-endpoint
COMFY_WORKER_URL=https://your-runpod-comfy-endpoint:8188
```

## Phase 1: Observability & Orchestration

Add these to your Supabase Edge Function environment:

```bash
# Langfuse (Cloud Observability)
LANGFUSE_PUBLIC_KEY=pk-lf-xxxxx
LANGFUSE_SECRET_KEY=sk-lf-xxxxx
LANGFUSE_HOST=https://cloud.langfuse.com

# Temporal Cloud (Workflow Engine)
TEMPORAL_NAMESPACE=your-namespace
TEMPORAL_ADDRESS=your-namespace.tmprl.cloud:7233
TEMPORAL_CERT_PATH=/path/to/cert
TEMPORAL_KEY_PATH=/path/to/key
```

## Cost Optimization Strategy

1. **Start with RunPod**: ~$0.50-1.50/hour for GPU compute
2. **Add Langfuse**: ~$100/month for observability
3. **Add Temporal**: ~$50/month for workflows
4. **Total Phase 0-2**: ~$200-300/month + variable GPU usage

## Next Steps

1. Launch RunPod pods and get endpoints
2. Update environment variables in Supabase
3. Test connectivity with existing chat interface
4. Begin Langfuse integration for tracing

















