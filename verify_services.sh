#!/bin/bash
echo "🔍 Verifying Ollama and ComfyUI services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local service_name=$2
    local expected_status=${3:-200}

    echo -n "Testing $service_name ($url)... "

    if curl -s --max-time 10 --head "$url" | head -n 1 | grep -q "$expected_status\|302\|301"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Test Ollama
ollama_ok=false
if test_endpoint "http://127.0.0.1:11434/api/tags" "Ollama API"; then
    ollama_ok=true

    # Get model list
    models=$(curl -s http://127.0.0.1:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "")
    if [ -n "$models" ]; then
        echo "📋 Available Ollama models:"
        echo "$models" | sed 's/^/  - /'
    else
        echo "⚠️  Could not retrieve model list"
    fi
fi

# Test ComfyUI
comfy_ok=false
if test_endpoint "http://127.0.0.1:8188" "ComfyUI Web Interface"; then
    comfy_ok=true

    # Test ComfyUI API
    if curl -s --max-time 5 "http://127.0.0.1:8188/object_info" > /dev/null; then
        echo -e "ComfyUI API: ${GREEN}✅ OK${NC}"
    else
        echo -e "ComfyUI API: ${YELLOW}⚠️  Web interface OK, API check failed${NC}"
    fi
fi

# Summary
echo ""
echo "📊 Service Status Summary:"
if $ollama_ok; then
    echo -e "🤖 Ollama: ${GREEN}RUNNING${NC} (Port 11434)"
else
    echo -e "🤖 Ollama: ${RED}NOT RUNNING${NC} (Port 11434)"
fi

if $comfy_ok; then
    echo -e "🎨 ComfyUI: ${GREEN}RUNNING${NC} (Port 8188)"
else
    echo -e "🎨 ComfyUI: ${RED}NOT RUNNING${NC} (Port 8188)"
fi

echo ""
if $ollama_ok && $comfy_ok; then
    echo -e "${GREEN}🎉 All services are running correctly!${NC}"
    echo "💡 You can now use AI generation and media processing features."
    exit 0
else
    echo -e "${YELLOW}⚠️  Some services are not running.${NC}"
    echo "💡 Try running: ./start_all.sh"
    echo "🔍 Check logs in the 'logs/' directory for details."
    exit 1
fi















