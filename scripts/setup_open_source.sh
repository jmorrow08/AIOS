#!/bin/bash

# LytbuB Open-Source Setup Script
# Sets up Ollama and ComfyUI for local testing

set -e

echo "🚀 Setting up Open-Source AI Tools for LytbuB Testing"
echo "=================================================="

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📍 Detected macOS"

    # Check if Ollama is already installed
    if ! command -v ollama &> /dev/null; then
        echo "📦 Installing Ollama..."

        # Try Homebrew first
        if command -v brew &> /dev/null; then
            echo "Using Homebrew to install Ollama..."
            brew install ollama
        else
            echo "Homebrew not found. Please install Ollama manually:"
            echo "1. Visit: https://ollama.ai/download"
            echo "2. Download and install the macOS version"
            echo "3. Then run this script again"
            exit 1
        fi
    else
        echo "✅ Ollama already installed"
    fi

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📍 Detected Linux"

    if ! command -v ollama &> /dev/null; then
        echo "📦 Installing Ollama for Linux..."
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        echo "✅ Ollama already installed"
    fi

else
    echo "❌ Unsupported OS: $OSTYPE"
    echo "Please install Ollama manually from: https://ollama.ai/download"
    exit 1
fi

echo ""
echo "🤖 Setting up Ollama models..."

# Start Ollama service
echo "Starting Ollama service..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # On macOS, Ollama runs as a service
    ollama serve &
    sleep 2
else
    # On Linux, start service
    sudo systemctl start ollama
    sudo systemctl enable ollama
fi

# Pull required models
echo "Pulling Llama 3.1 8B model (good balance of quality/speed)..."
ollama pull llama3.1:8b

echo "Pulling Llama 3.2 3B model (faster, good for testing)..."
ollama pull llama3.2:3b

echo ""
echo "🎨 Setting up ComfyUI..."

# Check if ComfyUI directory exists
if [ ! -d "ComfyUI" ]; then
    echo "Cloning ComfyUI repository..."
    git clone https://github.com/comfyanonymous/ComfyUI.git
else
    echo "✅ ComfyUI directory already exists"
fi

cd ComfyUI

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment and installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "⚙️ Configuration..."

# Create .env.local with OSS settings
cd ..
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local with open-source configuration..."
    cat > .env.local << EOL
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Open-Source AI Configuration (For Testing)
BUDGET_MODE=dev
OLLAMA_BASE_URL=http://localhost:11434
COMFY_WORKER_URL=http://localhost:8188

# Optional: Paid Cloud Alternatives (Hourly Billing)
# RUNPOD_API_KEY=your_runpod_key
# RUNPOD_ENDPOINT=https://your-runpod-endpoint
# MODAL_TOKEN_ID=your_modal_token
# MODAL_TOKEN_SECRET=your_modal_secret

# Stripe (for billing features - optional for testing)
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...
EOL
    echo "✅ Created .env.local - Please fill in your Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎯 Setup Complete!"
echo "================="
echo ""
echo "Next Steps:"
echo "1. Fill in your Supabase URL and anon key in .env.local"
echo "2. Start ComfyUI: cd ComfyUI && source venv/bin/activate && python main.py"
echo "3. In another terminal: npm run dev"
echo "4. Test with: curl to your Supabase edge functions"
echo ""
echo "For paid hourly compute alternatives:"
echo "- RunPod: https://runpod.io (GPU instances from \$0.17/hour)"
echo "- Modal: https://modal.com (Serverless GPUs from \$0.000018/second)"
echo "- Vast.ai: https://vast.ai (Spot GPU instances, very cheap)"
echo ""
echo "To use these, set COMFY_WORKER_URL to your cloud endpoint instead of localhost"