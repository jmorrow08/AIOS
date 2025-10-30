#!/bin/bash
# Enhanced RunPod Ollama + ComfyUI setup script
# (Run this after connecting to your RunPod terminal)

set -e  # Exit on any error

echo "🚀 Enhanced RunPod Setup: Ollama + ComfyUI with GPU acceleration"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check command success
check_command() {
    if [ $? -eq 0 ]; then
        print_success "$1 completed successfully"
    else
        print_error "$1 failed"
        exit 1
    fi
}

# 1. Update system and install dependencies
print_status "Updating system and installing dependencies..."
apt update && apt install -y curl git ffmpeg jq nvtop htop
check_command "System update"

# 2. Install Ollama
print_status "Installing Ollama..."
if command -v ollama &> /dev/null; then
    print_warning "Ollama already installed"
else
    curl -fsSL https://ollama.com/install.sh | sh
    check_command "Ollama installation"
fi

# 3. GPU Setup
print_status "Configuring GPU settings..."
export CUDA_VISIBLE_DEVICES=0
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# Check CUDA availability
if command -v nvidia-smi &> /dev/null; then
    print_success "NVIDIA GPU detected"
    nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader,nounits || true
else
    print_warning "NVIDIA GPU not detected - using CPU mode"
fi

# 4. Start Ollama with GPU support
print_status "Starting Ollama server..."
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_MAX_LOADED_MODELS=3
export OLLAMA_MAX_QUEUE=512

# Kill any existing Ollama processes
pkill -f ollama || true
sleep 2

nohup ollama serve > ollama.log 2>&1 &
OLLAMA_PID=$!
print_success "Ollama started (PID: $OLLAMA_PID)"

# 5. Verify Ollama
print_status "Verifying Ollama..."
sleep 5
if curl -s --max-time 10 http://localhost:11434/api/tags > /dev/null; then
    print_success "Ollama is responding"
else
    print_error "Ollama verification failed"
    cat ollama.log | tail -20
    exit 1
fi

# 6. Verify ComfyUI exists and is set up
print_status "Checking ComfyUI setup..."
if [ ! -d "ComfyUI" ]; then
    print_error "ComfyUI directory not found. Please run this script from the project root."
    exit 1
fi

# 7. Install/update ComfyUI Manager plugin
print_status "Setting up ComfyUI Manager plugin..."
cd ComfyUI/custom_nodes
if [ -d "ComfyUI-Manager" ]; then
    print_warning "ComfyUI-Manager already exists - updating..."
    cd ComfyUI-Manager
    git pull
    cd ..
else
    git clone https://github.com/ltdrdata/ComfyUI-Manager.git
    check_command "ComfyUI-Manager installation"
fi

# 8. Verify ComfyUI can start
print_status "Testing ComfyUI startup..."
cd ..
timeout 30s python main.py --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "ComfyUI installation verified"
else
    print_error "ComfyUI verification failed"
    exit 1
fi

# 9. Create environment file for reference
print_status "Creating environment configuration..."
cat > .env.local << 'EOF'
# RunPod Environment Configuration
OLLAMA_BASE_URL=http://127.0.0.1:11434
COMFY_WORKER_URL=http://127.0.0.1:8188
RUNPOD_MODE=true

# GPU Settings
CUDA_VISIBLE_DEVICES=0
PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# Add your Supabase and API keys below:
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# VITE_OPENAI_API_KEY=your-openai-key
EOF
print_success "Environment file created (.env.local)"

# 10. Display setup summary
echo ""
print_success "🎉 Setup complete!"
echo ""
echo "📊 Services Status:"
echo "  🤖 Ollama: Running on port 11434 (PID: $OLLAMA_PID)"
echo "  🎨 ComfyUI: Ready to start on port 8188"
echo ""
echo "🚀 Next Steps:"
echo "  1. Start ComfyUI: cd ComfyUI && python main.py --listen 0.0.0.0 --port 8188"
echo "  2. Preload models: ollama pull llama3.1:8b"
echo "  3. Verify setup: curl http://localhost:11434/api/tags"
echo "  4. Use npm scripts: npm run start-services, npm run preload-models"
echo ""
echo "📁 Logs: ollama.log, ComfyUI logs in ComfyUI/"
echo "🔧 GPU Monitoring: nvidia-smi or nvtop"
