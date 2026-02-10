#!/bin/bash

# =============================================================================
# EHR Application - Startup Script
# =============================================================================
# Starts all services (Docker containers, Backend API, Frontend)
#
# Usage: ./start.sh [options]
# Options:
#   --seed     Seed database with initial data after starting
#   --reset    Reset and re-seed database
#   --logs     Show logs after starting
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Options
SEED_DB=false
RESET_DB=false
SHOW_LOGS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --seed)
            SEED_DB=true
            shift
            ;;
        --reset)
            RESET_DB=true
            SEED_DB=true
            shift
            ;;
        --logs)
            SHOW_LOGS=true
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
echo "  🚀 EHR Application Startup"
echo "============================================================"
echo -e "${NC}"

# =============================================================================
# 0. Pre-flight Check - Detect Running Services
# =============================================================================

echo -e "${BLUE}🔍 Pre-flight: Checking for running services...${NC}"

BACKEND_RUNNING=false
FRONTEND_RUNNING=false
DOCKER_RUNNING=false

if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    BACKEND_RUNNING=true
    BACKEND_PID=$(lsof -t -i:8000)
    echo -e "${YELLOW}   ⚠️  Backend already running (PID: $BACKEND_PID)${NC}"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    FRONTEND_RUNNING=true
    FRONTEND_PID=$(lsof -t -i:3000)
    echo -e "${YELLOW}   ⚠️  Frontend already running (PID: $FRONTEND_PID)${NC}"
fi

if docker-compose ps | grep -q "Up"; then
    DOCKER_RUNNING=true
    echo -e "${YELLOW}   ⚠️  Docker containers already running${NC}"
fi

if [ "$BACKEND_RUNNING" = true ] || [ "$FRONTEND_RUNNING" = true ] || [ "$DOCKER_RUNNING" = true ]; then
    echo ""
    echo -e "${BLUE}ℹ️  Some services are already running.${NC}"
    echo -e "   This is safe - start.sh will skip already-running services."
    echo ""
    sleep 2
fi

echo ""

# =============================================================================
# 1. Start Docker Containers
# =============================================================================

echo -e "${BLUE}📦 Step 1: Starting Docker containers...${NC}"
cd "$SCRIPT_DIR"

if docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}   ⚠️  Containers already running${NC}"
else
    docker-compose up -d
    echo -e "${GREEN}   ✅ Docker containers started${NC}"
fi

# Wait for PostgreSQL to be ready
echo -e "${BLUE}   ⏳ Waiting for PostgreSQL...${NC}"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U ehr_user -d ehr_db > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ PostgreSQL is ready${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}   ❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
done

# =============================================================================
# 2. Run Migrations
# =============================================================================

echo -e "\n${BLUE}📊 Step 2: Running database migrations...${NC}"
cd "$BACKEND_DIR"

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo -e "${RED}   ❌ Virtual environment not found. Run ./setup.sh first${NC}"
    exit 1
fi

# Run migrations
alembic upgrade head
echo -e "${GREEN}   ✅ Migrations completed (passwords synced)${NC}"

# =============================================================================
# 3. Seed Database (if requested)
# =============================================================================

if [ "$SEED_DB" = true ]; then
    echo -e "\n${BLUE}🌱 Step 3: Seeding database...${NC}"
    
    if [ "$RESET_DB" = true ]; then
        python seed_data.py --reset
    else
        python seed_data.py
    fi
fi

# =============================================================================
# 4. Start Backend API
# =============================================================================

echo -e "\n${BLUE}🔧 Step 4: Starting Backend API...${NC}"

# Check if backend is already running
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  Backend already running on port 8000${NC}"
    echo -e "${YELLOW}      Kill it with: kill \$(lsof -t -i:8000)${NC}"
else
    # Start backend in background
    cd "$BACKEND_DIR"
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    echo -e "${BLUE}   ⏳ Waiting for backend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Backend API started (PID: $BACKEND_PID)${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}   ❌ Backend failed to start${NC}"
            exit 1
        fi
    done
fi

# =============================================================================
# 5. Start Frontend
# =============================================================================

echo -e "\n${BLUE}⚛️  Step 5: Starting Frontend...${NC}"

# Check if frontend is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  Frontend already running on port 3000${NC}"
    echo -e "${YELLOW}      Kill it with: kill \$(lsof -t -i:3000)${NC}"
else
    # Start frontend in background
    cd "$FRONTEND_DIR"
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    echo -e "${BLUE}   ⏳ Waiting for frontend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Frontend started (PID: $FRONTEND_PID)${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}   ❌ Frontend failed to start${NC}"
            exit 1
        fi
    done
fi

# =============================================================================
# Summary
# =============================================================================

echo -e "\n${CYAN}"
echo "============================================================"
echo "  ✅ EHR Application Started Successfully!"
echo "============================================================"
echo -e "${NC}"
echo -e "🌐 ${GREEN}Frontend:${NC}  http://localhost:3000"
echo -e "🔧 ${GREEN}Backend:${NC}   http://localhost:8000"
echo -e "📚 ${GREEN}API Docs:${NC}  http://localhost:8000/docs"
echo -e "🗄️  ${GREEN}Database:${NC}  localhost:5433 (ehr_db)"
echo -e "📊 ${GREEN}Orthanc:${NC}   http://localhost:8043"
echo ""
echo -e "${YELLOW}📝 Default Login Credentials:${NC}"
echo -e "   Admin:        admin / admin123"
echo -e "   Doctor:       dr_sharma / doctor123"
echo -e "   Nurse:        nurse_priya / nurse123"
echo -e "   Receptionist: reception / reception123"
echo ""
echo -e "${BLUE}💡 Useful Commands:${NC}"
echo -e "   View logs:     ./logs.sh"
echo -e "   Stop all:      ./stop.sh"
echo -e "   Restart:       ./stop.sh && ./start.sh"
echo -e "   Reset DB:      ./start.sh --reset"
echo ""

# Show logs if requested
if [ "$SHOW_LOGS" = true ]; then
    echo -e "${BLUE}📋 Showing logs (Ctrl+C to exit)...${NC}"
    tail -f "$BACKEND_DIR/backend.log" "$FRONTEND_DIR/frontend.log"
fi
