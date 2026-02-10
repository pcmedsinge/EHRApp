#!/bin/bash

# EHR Application - Development Environment Stop Script (Robust Version)
# This script stops all running development services

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
PID_DIR="$PROJECT_ROOT/.pids"

# Default options
STOP_DOCKER=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all) STOP_DOCKER=true; shift ;;
        --keep-docker) STOP_DOCKER=false; shift ;;
        --help)
            echo "Usage: ./dev-stop.sh [options]"
            echo "Options:"
            echo "  --all          Stop Docker too"
            echo "  --keep-docker  Keep Docker (default)"
            echo "  --help         Show help"
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
echo -e "${CYAN}║          EHR Application - Stopping Services              ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop Frontend
echo -e "${BLUE}⚛️  Stopping Frontend...${NC}"
STOPPED=false

if [ -f "$PID_DIR/frontend.pid" ]; then
    PID=$(cat "$PID_DIR/frontend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null || true
        sleep 2
        kill -9 "$PID" 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend stopped (PID: $PID)${NC}"
        STOPPED=true
    fi
    rm -f "$PID_DIR/frontend.pid"
fi

PIDS=$(lsof -ti:3000 2>/dev/null || true)
if [ ! -z "$PIDS" ]; then
    for PID in $PIDS; do
        kill -9 "$PID" 2>/dev/null || true
    done
    STOPPED=true
    echo -e "${GREEN}✅ Killed processes on port 3000${NC}"
fi

if [ "$STOPPED" = false ]; then
    echo -e "${YELLOW}No frontend process found${NC}"
fi

# Stop Backend
echo -e "${BLUE}🐍 Stopping Backend...${NC}"
STOPPED=false

if [ -f "$PID_DIR/backend.pid" ]; then
    PID=$(cat "$PID_DIR/backend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null || true
        sleep 2
        kill -9 "$PID" 2>/dev/null || true
        echo -e "${GREEN}✅ Backend stopped (PID: $PID)${NC}"
        STOPPED=true
    fi
    rm -f "$PID_DIR/backend.pid"
fi

PIDS=$(lsof -ti:8000 2>/dev/null || true)
if [ ! -z "$PIDS" ]; then
    for PID in $PIDS; do
        kill -9 "$PID" 2>/dev/null || true
    done
    STOPPED=true
    echo -e "${GREEN}✅ Killed processes on port 8000${NC}"
fi

if [ "$STOPPED" = false ]; then
    echo -e "${YELLOW}No backend process found${NC}"
fi

# Stop Docker
if [ "$STOP_DOCKER" = true ]; then
    echo -e "${BLUE}📦 Stopping Docker containers...${NC}"
    cd "$PROJECT_ROOT"
    
    # List containers before stopping
    echo "Stopping containers: ehr_postgres, ehr_orthanc, ehr_ohif..."
    docker-compose down
    echo -e "${GREEN}✅ Docker containers stopped${NC}"
else
    echo -e "${YELLOW}📦 Docker containers kept running (use --all to stop)${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}🛑 All development services stopped!${NC}"
echo ""

# Check remaining processes
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 8000 still in use${NC}"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 still in use${NC}"
fi
