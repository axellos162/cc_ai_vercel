#!/bin/bash

# CONCEPT COMMERCE - Startup Script
# Starts both the fashion_query_api (port 3001) and frontend (port 3000)

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 STARTING CONCEPT COMMERCE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$SCRIPT_DIR/fashion_query_api"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check if directories exist
if [ ! -d "$API_DIR" ]; then
    echo -e "${RED}✗ Error: fashion_query_api directory not found at $API_DIR${NC}"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}✗ Error: frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

# Check if ports are already in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

if check_port 3001; then
    echo -e "${YELLOW}⚠ Port 3001 is already in use (API). Killing existing process...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if check_port 3000; then
    echo -e "${YELLOW}⚠ Port 3000 is already in use (Frontend). Killing existing process...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Create log directory
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# Start the API server (port 3001)
echo -e "${GREEN}▶ Starting Fashion Query API (port 3001)...${NC}"
cd "$API_DIR"
PORT=3001 npm run dev > "$LOG_DIR/api.log" 2>&1 &
API_PID=$!
echo "  API PID: $API_PID"

# Wait for API to be ready
echo "  Waiting for API to start..."
for i in {1..30}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ API is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}  ✗ API failed to start. Check logs/api.log${NC}"
        kill $API_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Start the Frontend server (port 3000)
echo -e "${GREEN}▶ Starting Frontend (port 3000)...${NC}"
cd "$FRONTEND_DIR"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

# Wait for Frontend to be ready
echo "  Waiting for Frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Frontend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}  ✗ Frontend failed to start. Check logs/frontend.log${NC}"
        kill $API_PID $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ CONCEPT COMMERCE IS RUNNING!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:3001"
echo ""
echo "  API PID:       $API_PID"
echo "  Frontend PID:  $FRONTEND_PID"
echo ""
echo "  Logs:"
echo "    API:       $LOG_DIR/api.log"
echo "    Frontend:  $LOG_DIR/frontend.log"
echo ""
echo "  To view logs in real-time:"
echo "    tail -f logs/api.log"
echo "    tail -f logs/frontend.log"
echo ""
echo "  To stop all servers:"
echo "    kill $API_PID $FRONTEND_PID"
echo "    or run: ./stop.sh"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Save PIDs to file for stop script
echo "$API_PID" > "$SCRIPT_DIR/.api.pid"
echo "$FRONTEND_PID" > "$SCRIPT_DIR/.frontend.pid"

# Keep script running and handle Ctrl+C
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $API_PID $FRONTEND_PID 2>/dev/null || true
    rm -f "$SCRIPT_DIR/.api.pid" "$SCRIPT_DIR/.frontend.pid"
    echo "Servers stopped."
    exit 0
}

trap cleanup INT TERM

# Wait for both processes
wait
