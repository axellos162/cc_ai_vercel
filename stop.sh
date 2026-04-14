#!/bin/bash

# CONCEPT COMMERCE - Stop Script
# Stops both the fashion_query_api and frontend servers

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  🛑 STOPPING CONCEPT COMMERCE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill process by PID file
kill_by_pid_file() {
    local PID_FILE=$1
    local SERVICE_NAME=$2
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $SERVICE_NAME (PID: $PID)...${NC}"
            kill $PID 2>/dev/null || true
            sleep 1
            # Force kill if still running
            if ps -p $PID > /dev/null 2>&1; then
                kill -9 $PID 2>/dev/null || true
            fi
            echo -e "${GREEN}✓ $SERVICE_NAME stopped${NC}"
        else
            echo -e "${YELLOW}⚠ $SERVICE_NAME is not running (stale PID file)${NC}"
        fi
        rm -f "$PID_FILE"
    else
        echo -e "${YELLOW}⚠ No PID file found for $SERVICE_NAME${NC}"
    fi
}

# Function to kill by port
kill_by_port() {
    local PORT=$1
    local SERVICE_NAME=$2
    
    if lsof -ti:$PORT > /dev/null 2>&1; then
        echo -e "${YELLOW}Killing process on port $PORT ($SERVICE_NAME)...${NC}"
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓ Port $PORT freed${NC}"
    fi
}

# Stop by PID files first
kill_by_pid_file "$SCRIPT_DIR/.api.pid" "API"
kill_by_pid_file "$SCRIPT_DIR/.frontend.pid" "Frontend"

# Double check and kill by port if needed
kill_by_port 3001 "API"
kill_by_port 3000 "Frontend"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ ALL SERVERS STOPPED${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
