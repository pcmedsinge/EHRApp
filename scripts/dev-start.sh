#!/bin/bash

# EHR Application - Development Environment Startup Script (Robust Version)
# This script starts all components with proper error handling and PID management

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
PID_DIR="$PROJECT_ROOT/.pids"

# Create PID directory
mkdir -p "$PID_DIR"

# Default options
START_DOCKER=true
START_BACKEND=true
START_FRONTEND=true
FORCE_RESTART=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-docker) START_DOCKER=false; shift ;;
        --backend-only) START_FRONTEND=false; shift ;;
        --frontend-only) START_BACKEND=false; START_DOCKER=false; shift ;;
        --force) FORCE_RESTART=true; shift ;;
        --help)
            echo "Usage: ./dev-start.sh [options]"
            echo "Options:"
            echo "  --no-docker      Skip Docker containers"
            echo "  --backend-only   Start only backend"
            echo "  --frontend-only  Start only frontend"
            echo "  --force          Force restart"
            echo "  --help           Show help"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Header
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          EHR Application - Development Server             ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}Stopping process on port $port...${NC}"
        kill -9 $pids 2>/dev/null || true
        sleep 2
    fi
}

# Wait for service with improved checking
wait_for_service() {
    local url="$1"
    local name="$2"
    local log_file="$3"
    local max_attempts=60
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for $name...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if [ -n "$log_file" ] && [ -f "$log_file" ]; then
            if grep -qi "error\|exception\|traceback" "$log_file" 2>/dev/null; then
                echo -e "${RED}❌ $name error detected${NC}"
                echo "Last 20 lines:"
                tail -20 "$log_file"
                return 1
            fi
        fi
        
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name ready!${NC}"
            return 0
        fi
        
        if [ $attempt -eq 30 ]; then
            echo -e "${YELLOW}Still waiting...${NC}"
        fi
        
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $name failed to start${NC}"
    return 1
}

# Start Docker
if [ "$START_DOCKER" = true ]; then
    echo -e "${BLUE}📦 Starting Docker containers...${NC}"
    echo "----------------------------------------"
    
    if ! docker info &> /dev/null 2>&1; then
        echo -e "${RED}❌ Docker not running${NC}"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    docker-compose up -d
    
    echo "Waiting for PostgreSQL..."
    sleep 3
    
    for i in {1..30}; do
        if docker exec ehr_postgres pg_isready -U ehruser -d ehrdb > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL ready!${NC}"
            break
        fi
        sleep 1
    done
    
    echo ""
fi

# Start Backend
if [ "$START_BACKEND" = true ]; then
    echo -e "${BLUE}🐍 Starting Backend...${NC}"
    echo "----------------------------------------"
    
    cd "$BACKEND_DIR"
    
    if [ ! -d "venv" ]; then
        echo -e "${RED}❌ venv not found${NC}"
        exit 1
    fi
    
    BACKEND_LOG="$PROJECT_ROOT/backend.log"
    BACKEND_PID_FILE="$PID_DIR/backend.pid"
    
    if check_port 8000; then
        if [ "$FORCE_RESTART" = true ]; then
            echo "Forcing restart..."
            kill_port 8000
        else
            echo -e "${YELLOW}⚠️  Port 8000 in use (use --force to restart)${NC}"
            PID=$(lsof -ti:8000 2>/dev/null | head -1)
            [ ! -z "$PID" ] && echo $PID > "$BACKEND_PID_FILE"
        fi
    fi
    
    if ! check_port 8000; then
        echo "Starting uvicorn..."
        source venv/bin/activate
        
        echo "Running migrations..."
        alembic upgrade head >> "$BACKEND_LOG" 2>&1 || true
        
        > "$BACKEND_LOG"
        
        nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 >> "$BACKEND_LOG" 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > "$BACKEND_PID_FILE"
        echo -e "${GREEN}Backend PID: $BACKEND_PID${NC}"
        
        if ! wait_for_service "http://localhost:8000/health" "Backend" "$BACKEND_LOG"; then
            kill $BACKEND_PID 2>/dev/null || true
            rm -f "$BACKEND_PID_FILE"
            exit 1
        fi
    fi
    
    echo ""
fi

# Start Frontend
if [ "$START_FRONTEND" = true ]; then
    echo -e "${BLUE}⚛️  Starting Frontend...${NC}"
    echo "----------------------------------------"
    
    cd "$FRONTEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi
    
    FRONTEND_LOG="$PROJECT_ROOT/frontend.log"
    FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
    
    if check_port 3000; then
        if [ "$FORCE_RESTART" = true ]; then
            echo "Forcing restart..."
            kill_port 3000
        else
            echo -e "${YELLOW}⚠️  Port 3000 in use (use --force to restart)${NC}"
            PID=$(lsof -ti:3000 2>/dev/null | head -1)
            [ ! -z "$PID" ] && echo $PID > "$FRONTEND_PID_FILE"
        fi
    fi
    
    if ! check_port 3000; then
        > "$FRONTEND_LOG"
        
        echo "Starting Vite..."
        nohup npm run dev >> "$FRONTEND_LOG" 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
        echo -e "${GREEN}Frontend PID: $FRONTEND_PID${NC}"
        
        sleep 5
        if ! wait_for_service "http://localhost:3000" "Frontend" "$FRONTEND_LOG"; then
            kill $FRONTEND_PID 2>/dev/null || true
            rm -f "$FRONTEND_PID_FILE"
            exit 1
        fi
    fi
    
    echo ""
fi

# Summary
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 EHR Development Environment Started!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo "   Orthanc PACS: http://localhost:8042"
echo "   OHIF Viewer:  http://localhost:3001"
echo ""
echo -e "${BLUE}📋 Commands:${NC}"
echo "   ./dev-stop.sh      - Stop services"
echo "   ./dev-status.sh    - Check status"
echo "   ./dev-logs.sh      - View logs"
echo ""
echo -e "${BLUE}📁 Logs:${NC}"
echo "   Backend:  $PROJECT_ROOT/backend.log"
echo "   Frontend: $PROJECT_ROOT/frontend.log"
echo ""
