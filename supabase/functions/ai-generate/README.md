# AI Generate Edge Function

Supabase Edge Function for AI text generation with multi-provider support (OpenAI, Claude, Gemini, Ollama) and budget tracking.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic Claude, Google Gemini, and local Ollama
- **Budget Management**: Automatic budget checking and usage tracking
- **Company Isolation**: Multi-tenant with company-scoped API keys and budgets
- **Agent Integration**: Logs to `agent_runs` table for agent interactions
- **Usage Logging**: Tracks costs, tokens, and metadata in `api_usage` table

## API Endpoint

```
POST https://your-project.supabase.co/functions/v1/ai-generate
```

## Request Body

```json
{
  "companyId": "uuid-of-company",
  "agentId": "uuid-of-agent", // optional
  "agentName": "Agent Name", // optional
  "input": "Your prompt here",
  "provider": "ollama", // optional: "openai" | "claude" | "gemini" | "ollama"
  "model": "llama3.1:8b", // optional: specific model to use
  "systemPrompt": "You are a helpful assistant" // optional
}
```

## Response

```json
{
  "success": true,
  "content": "Generated response text",
  "usage": {
    "tokens_used": 150,
    "cost": 0.0023,
    "provider": "ollama"
  },
  "budget_status": {
    "current_spend": 45.67,
    "budget_limit": 100.0,
    "percentage_used": 45.7
  }
}
```

## Provider Configuration

### Ollama (Local/Free)

- **Environment**: Set `BUDGET_MODE=dev`
- **Default Model**: `llama3.1:8b`
- **Cost**: $0 (local)
- **Setup**: Run `ollama pull llama3.1:8b` and start Ollama service

### OpenAI (SaaS)

- **API Key**: Store in `provider_keys` table with provider="openai"
- **Default Model**: `gpt-4`
- **Cost**: Standard OpenAI pricing

### Other Providers

Add API keys to `provider_keys` table:

```sql
INSERT INTO provider_keys (company_id, provider, key_data)
VALUES ('company-uuid', 'openai', '{"apiKey": "sk-..."}');
```

## Environment Variables

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional - for Ollama
OLLAMA_BASE_URL=http://localhost:11434
BUDGET_MODE=dev

# Optional - fallback API keys (if not in provider_keys table)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
```

## Testing

```bash
# Test with Ollama (local)
curl -X POST https://your-project.supabase.co/functions/v1/ai-generate \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "your-company-id",
    "input": "Hello, how are you?",
    "provider": "ollama"
  }'

# Test with OpenAI (SaaS)
curl -X POST https://your-project.supabase.co/functions/v1/ai-generate \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "your-company-id",
    "input": "Hello, how are you?",
    "provider": "openai"
  }'
```

## Database Tables Used

- `provider_keys`: API keys per company/provider
- `api_usage`: Usage tracking and costs
- `agent_runs`: Agent interaction logs (if agentId provided)
- `company_config`: Budget configuration

## Deploy

```bash
supabase functions deploy ai-generate
```
