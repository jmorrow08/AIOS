# 🚀 Lytbub RunPod Setup — Phase 2 Automation

## Fully Automated Ollama + ComfyUI Environment with GPU Acceleration

This guide provides a complete setup for running Ollama and ComfyUI on RunPod with your Lytbub AI OS Supabase integration.

## 📋 Prerequisites

- RunPod account with GPU instance (recommended: RTX 4090 or A100)
- Ubuntu-based RunPod environment
- Git repository cloned

## 🛠️ Quick Setup (Automated)

```bash
# Run the enhanced setup script
./setup_runpod_ollama_comfy.sh

# Start all services
npm run start-services

# Preload AI models
npm run preload-models

# Verify everything works
npm run verify-services
```

## 📁 File Structure Created

```
project-root/
├── start_all.sh              # GPU-ready service launcher
├── preload_models.sh         # Model download script
├── verify_services.sh        # Service verification
├── setup_runpod_ollama_comfy.sh  # Enhanced setup script
├── logs/                     # Service logs directory
│   ├── ollama.log
│   └── comfy.log
└── ComfyUI/custom_nodes/
    └── ComfyUI-Manager/      # Plugin manager
```

## 🔧 Environment Variables Setup

### 1. Project Root (.env.local)

Since `.env.local` is in `.gitignore`, create it manually:

```bash
# RunPod Environment Configuration
OLLAMA_BASE_URL=http://127.0.0.1:11434
COMFY_WORKER_URL=http://127.0.0.1:8188
RUNPOD_MODE=true

# GPU Settings
CUDA_VISIBLE_DEVICES=0
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# Supabase Configuration (add your values)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Keys (optional - for fallback providers)
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
VITE_GOOGLE_AI_API_KEY=your-google-key
```

### 2. Supabase Functions (.env)

Create `supabase/functions/.env` manually:

```bash
# Environment variables for Supabase Edge Functions
OLLAMA_BASE_URL=http://127.0.0.1:11434
COMFY_WORKER_URL=http://127.0.0.1:8188
RUNPOD_MODE=true

# Budget mode for development (dev = prefer local, prod = use API keys)
BUDGET_MODE=dev

# Add your API keys here if using SaaS providers
# OPENAI_API_KEY=your-openai-key
# ANTHROPIC_API_KEY=your-anthropic-key
# GOOGLE_AI_API_KEY=your-google-key
```

## 🚀 Service Management

### Starting Services

```bash
# Option 1: Use npm script (recommended)
npm run start-services

# Option 2: Manual start
./start_all.sh
```

This will:

- ✅ Start Ollama on port 11434
- ✅ Start ComfyUI on port 8188
- ✅ Create log files in `logs/` directory
- ✅ Set up GPU acceleration
- ✅ Handle graceful shutdown (Ctrl+C)

### Model Management

```bash
# Preload recommended models
npm run preload-models

# Or manually
ollama pull llama3.1:8b
ollama pull mistral:7b
ollama pull codellama:7b
```

### Verification

```bash
# Check all services
npm run verify-services

# Manual checks
curl http://127.0.0.1:11434/api/tags  # Ollama
curl http://127.0.0.1:8188           # ComfyUI web interface
```

## 🔄 Supabase Functions Deployment

After setting up environment variables:

```bash
# Deploy AI generation function
npm run deploy-functions

# Or manually
supabase functions deploy ai-generate
supabase functions deploy media-start
```

## 🎨 ComfyUI Configuration

ComfyUI Manager is pre-installed for easy plugin management. Access it at:

- **Web Interface**: `http://127.0.0.1:8188`
- **Manager**: Click "Manager" button in the ComfyUI interface

### Recommended Workflows

The `media-start` function includes a basic SDXL workflow. For custom workflows:

1. Create workflow in ComfyUI web interface
2. Export as JSON
3. Update the workflow in `supabase/functions/media-start/index.ts`

## 🔍 Monitoring & Troubleshooting

### GPU Monitoring

```bash
# NVIDIA GPU stats
nvidia-smi

# Real-time GPU monitoring
nvtop

# System resources
htop
```

### Logs

```bash
# Service logs
tail -f logs/ollama.log
tail -f logs/comfy.log

# ComfyUI logs (when running)
tail -f ComfyUI/comfy.log
```

### Common Issues

#### Ollama GPU Issues

```bash
# Check CUDA
nvidia-smi

# If "old CUDA driver" warning
apt install -y nvidia-cuda-toolkit
export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH
```

#### ComfyUI Memory Issues

```bash
# Increase memory allocation
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

#### Port Conflicts

```bash
# Check what's using ports
netstat -tlnp | grep :11434
netstat -tlnp | grep :8188

# Kill conflicting processes
sudo kill -9 <PID>
```

## 📊 Performance Optimization

### GPU Settings

```bash
# Single GPU
export CUDA_VISIBLE_DEVICES=0

# Memory optimization
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

### Ollama Optimization

```bash
# Limit concurrent models
export OLLAMA_MAX_LOADED_MODELS=3

# Increase queue size
export OLLAMA_MAX_QUEUE=512
```

## 🔐 Security Notes

- Services bind to `127.0.0.1` by default (local only)
- For external access, use RunPod's TCP tunnel or change to `0.0.0.0`
- Keep API keys secure and never commit to git
- Use environment variables for all secrets

## 📚 Integration with Your App

Your existing functions already reference the correct environment variables:

- `ai-generate`: Uses `OLLAMA_BASE_URL` for local AI generation
- `media-start`: Uses `COMFY_WORKER_URL` for ComfyUI workflows

The system automatically falls back to API keys if local services are unavailable.

## 🎯 Next Steps

1. ✅ Run the setup script
2. ✅ Start services with `npm run start-services`
3. ✅ Preload models with `npm run preload-models`
4. ✅ Verify with `npm run verify-services`
5. ✅ Test AI generation in your app
6. ✅ Deploy updated functions to Supabase

## 🤝 Support

If you encounter issues:

1. Check the logs in `logs/` directory
2. Verify GPU is available with `nvidia-smi`
3. Test services individually
4. Check RunPod instance specifications

---

**Note**: This setup is optimized for RunPod's GPU instances. For local development, adjust the environment variables and startup scripts accordingly.















