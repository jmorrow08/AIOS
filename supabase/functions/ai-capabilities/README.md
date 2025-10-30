# AI Capabilities Function

Returns comprehensive information about available AI models across all supported providers, including live Ollama models and provider availability based on API key configuration.

## Endpoint

```
GET /functions/v1/ai-capabilities
```

## Authentication

Requires Bearer token authentication.

## Response Format

```json
{
  "success": true,
  "models": [
    {
      "id": "gpt-4o",
      "provider": "openai",
      "model": "gpt-4o",
      "displayName": "GPT-4o",
      "capabilities": {
        "strengths": ["chat", "creative", "analysis", "reasoning", "multimodal"],
        "capable": ["translation", "summarization"],
        "weaknesses": ["long_context"],
        "features": ["Function calling", "Vision", "Streaming"],
        "limitations": ["Knowledge cutoff: October 2023"]
      },
      "pricing": {
        "input": 2.50,
        "output": 10.00
      },
      "metadata": {
        "contextWindow": 128000,
        "latency": "balanced",
        "knowledgeCutoff": "2023-10",
        "functionCalling": true,
        "vision": true,
        "streaming": true,
        "size": "large"
      },
      "available": true,
      "releaseDate": "2024-05"
    }
  ],
  "modelsByProvider": {
    "openai": [...],
    "claude": [...],
    "gemini": [...]
  },
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "description": "Industry-leading models with excellent performance",
      "requiresApiKey": true,
      "localOnly": false
    }
  ],
  "providerAvailability": {
    "openai": true,
    "claude": true,
    "gemini": false
  },
  "recommendations": {
    "chat": [...],
    "code": [...],
    "creative": [...],
    "fast": [...],
    "budget": [...]
  },
  "metadata": {
    "totalModels": 15,
    "ollamaModelsCount": 3,
    "staticModelsCount": 12,
    "lastUpdated": "2024-12-29T10:30:00Z"
  }
}
```

## Features

- **Live Ollama Integration**: Fetches currently available models from Ollama `/api/tags` endpoint
- **Provider Availability**: Checks API key availability for cloud providers
- **Smart Recommendations**: Provides model suggestions for common use cases
- **Comprehensive Metadata**: Includes pricing, capabilities, and technical specs
- **Cost Awareness**: All models include accurate pricing information

## Model Capabilities

Models are categorized by their strengths and use cases:

- **chat**: General conversation
- **code**: Programming, debugging, code generation
- **creative**: Writing, brainstorming, creative tasks
- **analysis**: Data analysis, research, summarization
- **reasoning**: Complex reasoning, math, logic
- **fast**: Quick responses, simple tasks
- **vision**: Image understanding, analysis
- **multimodal**: Text + images + potentially video/audio
- **long_context**: Documents, books, large datasets
- **coding_assistant**: IDE integration, code completion
- **research**: Academic research, citations
- **translation**: Language translation, localization
- **summarization**: Document summarization, TL;DR
- **question_answering**: Q&A, factual responses
- **agent_workflows**: Multi-step tasks, tool use
- **real_time**: Live conversation, streaming
- **batch_processing**: Large scale data processing

## Supported Providers

1. **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
2. **Anthropic Claude**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
3. **Google Gemini**: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash
4. **Meta Llama**: Llama 3.1 models via Ollama
5. **Mistral**: Mistral models via Ollama
6. **Qwen**: Alibaba's Qwen models via Ollama

## Environment Variables

- `OLLAMA_BASE_URL`: Base URL for Ollama API (default: http://localhost:11434)

## Error Responses

- `401`: Invalid or missing authentication
- `400`: User has no company association
- `500`: Internal server error
