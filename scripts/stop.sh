#!/bin/bash

# =============================================================================
# EHR Application - Stop Script
# =============================================================================
# Stops all services (Backend API, Frontend, Docker containers)
#
# Usage: ./stop.sh [options]
# Options:
#   --keep-db    Keep Docker containers running (only stop app services)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Options
KEEP_DB=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-db)
            KEEP_DB=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}"
echo "============================================================"
echo "  🛑 Stopping EHR Application"
echo "============================================================"
echo -e "${NC}"

# =============================================================================
# 1. Stop Frontend
# =============================================================================

echo -e "${BLUE}⚛️  Stopping Frontend...${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    kill $(lsof -t -i:3000) 2>/dev/null || true
    echo -e "${GREEN}   ✅ Frontend stopped${NC}"
else
    echo -e "${YELLOW}   ⏭️  Frontend not running${NC}"
fi

# =============================================================================
# 2. Stop Backend
# =============================================================================

echo -e "\n${BLUE}🔧 Stopping Backend API...${NC}"
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    kill $(lsof -t -i:8000) 2>/dev/null || true
    echo -e "${GREEN}   ✅ Backend stopped${NC}"
else
    echo -e "${YELLOW}   ⏭️  Backend not running${NC}"
fi

# =============================================================================
# 3. Stop Docker Containers (optional)
# =============================================================================

if [ "$KEEP_DB" = false ]; then
    echo -e "\n${BLUE}📦 Stopping Docker containers...${NC}"
    cd "$SCRIPT_DIR"
    
    if docker-compose ps | grep -q "Up"; then
        docker-compose stop
        echo -e "${GREEN}   ✅ Docker containers stopped${NC}"
    else
        echo -e "${YELLOW}   ⏭️  Docker containers not running${NC}"
    fi
fi

# =============================================================================
# Summary
# =============================================================================

echo -e "\n${CYAN}"
echo "============================================================"
echo "  ✅ EHR Application Stopped"
echo "============================================================"
echo -e "${NC}"

if [ "$KEEP_DB" = true ]; then
    echo -e "${YELLOW}ℹ️  Database containers are still running${NC}"
    echo -e "   Stop them with: docker-compose stop"
fi

echo ""
echo -e "${BLUE}💡 To restart:${NC}"
echo -e "   ./start.sh"
echo ""
