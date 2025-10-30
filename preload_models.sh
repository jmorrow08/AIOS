#!/bin/bash
echo "🤖 Preloading Ollama models..."

# Function to check if Ollama is running
check_ollama() {
    if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null; then
        echo "❌ Ollama is not running. Please start it first with: ./start_all.sh"
        exit 1
    fi
}

# Function to pull model with progress
pull_model() {
    local model=$1
    echo "📥 Pulling $model..."
    if ollama pull "$model"; then
        echo "✅ Successfully pulled $model"
    else
        echo "❌ Failed to pull $model"
        return 1
    fi
}

# Check if Ollama is running
check_ollama

# List of models to preload
models=(
    "llama3.1:8b"
    "mistral:7b"
    "codellama:7b"
)

echo "🎯 Starting model preload process..."
echo "📊 This may take several minutes depending on your internet connection"

# Pull models
for model in "${models[@]}"; do
    if pull_model "$model"; then
        echo "✅ $model ready"
    else
        echo "⚠️  Skipped $model due to error"
    fi
done

# Verify models are available
echo "🔍 Verifying installed models..."
installed_models=$(curl -s http://127.0.0.1:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "")

if [ -n "$installed_models" ]; then
    echo "📋 Available models:"
    echo "$installed_models"
    echo "✅ Model preload complete!"
else
    echo "⚠️  Could not verify models - check Ollama status"
fi















