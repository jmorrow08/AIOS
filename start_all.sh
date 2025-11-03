#!/bin/bash
echo "🚀 Starting Ollama + ComfyUI services..."

# Create logs directory
mkdir -p logs

# Set environment variables
export OLLAMA_HOST=0.0.0.0
export CUDA_VISIBLE_DEVICES=0
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# Start Ollama in background
echo "📦 Starting Ollama server..."
nohup ollama serve > logs/ollama.log 2>&1 &
OLLAMA_PID=$!

# Wait for Ollama to start
sleep 5

# Test Ollama connection
if curl -s http://127.0.0.1:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running on port 11434"
else
    echo "❌ Ollama failed to start - check logs/ollama.log"
fi

# Start ComfyUI in background
echo "🎨 Starting ComfyUI server..."
cd ComfyUI
nohup python main.py --listen 0.0.0.0 --port 8188 > ../logs/comfy.log 2>&1 &
COMFY_PID=$!

# Wait for ComfyUI to start
sleep 10

# Test ComfyUI connection
if curl -s http://127.0.0.1:8188 > /dev/null; then
    echo "✅ ComfyUI is running on port 8188"
else
    echo "❌ ComfyUI failed to start - check logs/comfy.log"
fi

echo "🎉 Services launched successfully!"
echo "📊 Ollama PID: $OLLAMA_PID"
echo "🎨 ComfyUI PID: $COMFY_PID"
echo "📝 Check logs/ollama.log and logs/comfy.log for details"

# Function to stop services
stop_services() {
    echo "🛑 Stopping services..."
    kill $OLLAMA_PID $COMFY_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Trap SIGINT (Ctrl+C) to stop services
trap stop_services SIGINT

# Keep script running
echo "💡 Press Ctrl+C to stop services"
wait
















