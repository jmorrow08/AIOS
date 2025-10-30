#!/bin/bash

# 🚀 RunPod Startup Manager - Phase 3 Persistent Auto-Startup & Supabase Sync
# Author: Lytbub AI OS
# Description: Manages RunPod startup, monitoring, and Supabase synchronization

set -e  # Exit on any error

# Configuration
WORKSPACE="/workspace"
LOG_DIR="$WORKSPACE/logs"
START_SCRIPT="$WORKSPACE/start_all.sh"
SYSTEM_LOG="$LOG_DIR/system.log"
SERVICE_CHECK_FILE="$WORKSPACE/.servicecheck"
OLLAMA_MODELS="$WORKSPACE/models"

# Environment setup
export OLLAMA_MODELS="$OLLAMA_MODELS"
export OLLAMA_HOST=0.0.0.0
export CUDA_VISIBLE_DEVICES=0
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# Load environment variables
if [ -f "$WORKSPACE/.env" ]; then
    source "$WORKSPACE/.env"
elif [ -f "$WORKSPACE/.env.local" ]; then
    source "$WORKSPACE/.env.local"
fi

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$SYSTEM_LOG"
    echo "[$timestamp] [$level] $message"
}

# Network validation function
validate_network() {
    log "INFO" "Validating network connectivity..."

    # Test Supabase connectivity
    if [ -n "$SUPABASE_URL" ]; then
        if curl -s --max-time 10 "$SUPABASE_URL/rest/v1/" > /dev/null; then
            log "INFO" "✅ Supabase endpoint reachable"
        else
            log "ERROR" "❌ Supabase endpoint unreachable: $SUPABASE_URL"
            return 1
        fi
    else
        log "WARN" "SUPABASE_URL not set, skipping Supabase connectivity test"
    fi

    # Test Ollama endpoint (local)
    if curl -s --max-time 5 http://127.0.0.1:11434/api/tags > /dev/null; then
        log "INFO" "✅ Ollama endpoint reachable"
    else
        log "WARN" "❌ Ollama endpoint not yet reachable (expected if services not started)"
    fi

    return 0
}

# GPU/Memory monitoring function
collect_system_stats() {
    local runtime_log="$LOG_DIR/runtime_$(date +%F).log"

    # GPU stats (if nvidia-smi available)
    local gpu_util="N/A"
    local memory_used="N/A"

    if command -v nvidia-smi &> /dev/null; then
        gpu_util=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits | head -n1 | tr -d ' ')
        memory_used=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits | head -n1 | tr -d ' ')
    fi

    # System memory
    local system_memory=$(free -m | awk 'NR==2{printf "%.1f", $3}')
    local uptime_seconds=$(cut -d. -f1 /proc/uptime)

    # Log to runtime log
    echo "$(date '+%Y-%m-%d %H:%M:%S'),GPU_UTIL=$gpu_util,MEMORY_USED=$memory_used,SYSTEM_MEMORY=$system_memory,UPTIME=$uptime_seconds" >> "$runtime_log"

    # Return values for Supabase sync
    echo "$gpu_util:$memory_used:$system_memory:$uptime_seconds"
}

# Supabase sync function
sync_to_supabase() {
    local stats="$1"
    local pod_id="${RUNPOD_POD_ID:-$(hostname)}"

    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        log "WARN" "Supabase credentials not configured, skipping sync"
        return 0
    fi

    IFS=':' read -r gpu_util memory_used system_memory uptime_seconds <<< "$stats"

    # Prepare payload
    local payload=$(cat <<EOF
{
    "gpu_util": ${gpu_util:-0},
    "memory_used": ${memory_used:-0},
    "system_memory": ${system_memory:-0},
    "uptime": $uptime_seconds,
    "pod_id": "$pod_id",
    "timestamp": "$(date -Iseconds)"
}
EOF
    )

    # Send to Supabase
    local response=$(curl -s -X POST "$SUPABASE_URL/rest/v1/runtime_logs" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "$payload")

    if [ $? -eq 0 ]; then
        log "INFO" "✅ Successfully synced runtime stats to Supabase"
    else
        log "ERROR" "❌ Failed to sync to Supabase: $response"
    fi
}

# Heartbeat function
create_heartbeat() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$timestamp - $(hostname) - $(uptime -p)" > "$SERVICE_CHECK_FILE"
    log "INFO" "💓 Heartbeat created: $SERVICE_CHECK_FILE"
}

# Main startup function
main() {
    log "INFO" "🚀 Starting RunPod Startup Manager (Phase 3)"

    # Create log directory
    mkdir -p "$LOG_DIR"

    # Validate network
    if ! validate_network; then
        log "ERROR" "Network validation failed, but continuing..."
    fi

    # Check for start_all.sh
    if [ -f "$START_SCRIPT" ]; then
        log "INFO" "✅ Found start_all.sh, launching services..."

        # Collect initial stats
        local initial_stats=$(collect_system_stats)
        sync_to_supabase "$initial_stats"

        # Launch services in background
        nohup bash "$START_SCRIPT" > "$LOG_DIR/startup.log" 2>&1 &
        STARTUP_PID=$!

        log "INFO" "🎯 Services launched with PID: $STARTUP_PID"

        # Wait a bit for services to start
        sleep 30

        # Collect post-startup stats
        local post_stats=$(collect_system_stats)
        sync_to_supabase "$post_stats"

        log "INFO" "✅ Startup sequence completed"

    else
        log "ERROR" "❌ start_all.sh not found at $START_SCRIPT"
        log "ERROR" "Cannot start services automatically"
        exit 1
    fi

    # Create initial heartbeat
    create_heartbeat

    # Main monitoring loop (runs indefinitely)
    log "INFO" "🔄 Starting monitoring loop..."

    while true; do
        # Collect and sync stats every 5 minutes
        local current_stats=$(collect_system_stats)
        sync_to_supabase "$current_stats"

        # Update heartbeat every 10 minutes
        create_heartbeat

        # Sleep for 5 minutes
        sleep 300
    done
}

# Cleanup function
cleanup() {
    log "INFO" "🛑 Received shutdown signal, cleaning up..."
    # Kill any child processes
    pkill -P $$ 2>/dev/null || true
    exit 0
}

# Trap signals
trap cleanup SIGINT SIGTERM

# Run main function
main "$@"








