#!/bin/bash

# =============================================================================
# EHR Application - First-Time Setup Script
# =============================================================================
# This script sets up the development environment from scratch.
# Run this script once after cloning the repository.
#
# SAFE TO RE-RUN: This script detects existing setup and skips completed steps.
#
# Prerequisites:
# - Docker and docker-compose installed
# - Python 3.11+ installed
# - Node.js 18+ and npm installed
#
# Usage: ./setup.sh [options]
# Options:
#   --force    Force reinstall everything
#   --check    Only check status, don't install anything
#   --help     Show this help message
# =============================================================================

# Don't use set -e as we handle errors ourselves

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
FORCE_REINSTALL=false
CHECK_ONLY=false

# Counters for summary
INSTALLED=0
ALREADY_OK=0

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_REINSTALL=true
            shift
            ;;
        --check)
            CHECK_ONLY=true
            shift
            ;;
        --help)
            echo "EHR Application - First-Time Setup Script"
            echo ""
            echo "Usage: ./setup.sh [options]"
            echo ""
            echo "Options:"
            echo "  --force    Force reinstall everything (recreate venv, reinstall npm)"
            echo "  --check    Only check status, don't install anything"
            echo "  --help     Show this help message"
            echo ""
            echo "This script is SAFE to re-run. It will skip already completed steps."
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
if [ "$CHECK_ONLY" = true ]; then
    echo -e "${CYAN}║       EHR Application - Setup Status Check               ║${NC}"
else
    echo -e "${CYAN}║       EHR Application - First-Time Setup                 ║${NC}"
fi
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$FORCE_REINSTALL" = true ]; then
    echo -e "${YELLOW}⚠️  Force mode enabled - will reinstall everything${NC}"
    echo ""
fi

# =============================================================================
# Check Running Services (Warn if services are active)
# =============================================================================
echo -e "${BLUE}🔍 Checking for running services...${NC}"
echo "----------------------------------------"

SERVICES_RUNNING=false

# Check Backend (port 8000)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    BACKEND_PID=$(lsof -t -i:8000)
    echo -e "${YELLOW}⚠️  Backend is already running (PID: $BACKEND_PID, Port: 8000)${NC}"
    SERVICES_RUNNING=true
fi

# Check Frontend (port 3000)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    FRONTEND_PID=$(lsof -t -i:3000)
    echo -e "${YELLOW}⚠️  Frontend is already running (PID: $FRONTEND_PID, Port: 3000)${NC}"
    SERVICES_RUNNING=true
fi

if [ "$SERVICES_RUNNING" = true ]; then
    echo ""
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  SERVICES ARE CURRENTLY RUNNING                        ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Running setup.sh while services are active is generally safe,${NC}"
    echo -e "${YELLOW}but may cause issues if dependencies are updated.${NC}"
    echo ""
    echo -e "Recommendation:"
    echo -e "  1. Stop services first: ${GREEN}./stop.sh${NC}"
    echo -e "  2. Then run setup:      ${GREEN}./setup.sh${NC}"
    echo ""
    
    if [ "$FORCE_REINSTALL" = true ]; then
        echo -e "${RED}⚠️  FORCE MODE + RUNNING SERVICES = HIGH RISK${NC}"
        echo -e "${RED}   Stop services now to avoid conflicts!${NC}"
        echo ""
    fi
    
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Setup cancelled. Stop services first with: ./stop.sh${NC}"
        exit 0
    fi
    echo ""
fi

if [ "$SERVICES_RUNNING" = false ]; then
    echo -e "${GREEN}✅ No services are currently running${NC}"
fi

echo ""

# =============================================================================
# Check Prerequisites
# =============================================================================
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
echo "----------------------------------------"

# Check Docker
printf "%-25s" "Docker"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
    echo -e "${GREEN}✅ Installed${NC} (v$DOCKER_VERSION)"
else
    echo -e "${RED}❌ Not installed${NC}"
    echo ""
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
printf "%-25s" "Docker Compose"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | awk '{print $4}' | tr -d ',')
    echo -e "${GREEN}✅ Installed${NC} (v$COMPOSE_VERSION)"
else
    echo -e "${RED}❌ Not installed${NC}"
    echo ""
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check Python
printf "%-25s" "Python"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    echo -e "${GREEN}✅ Installed${NC} (v$PYTHON_VERSION)"
else
    echo -e "${RED}❌ Not installed${NC}"
    echo ""
    echo "Please install Python 3.11+: https://www.python.org/downloads/"
    exit 1
fi

# Check Node.js
printf "%-25s" "Node.js"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Installed${NC} ($NODE_VERSION)"
else
    echo -e "${RED}❌ Not installed${NC}"
    echo ""
    echo "Please install Node.js 18+: https://nodejs.org/"
    exit 1
fi

# Check npm
printf "%-25s" "npm"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ Installed${NC} (v$NPM_VERSION)"
else
    echo -e "${RED}❌ Not installed${NC}"
    exit 1
fi

echo ""

# =============================================================================
# Docker Services
# =============================================================================
echo -e "${BLUE}📦 Step 1: Docker Services${NC}"
echo "----------------------------------------"

cd "$SCRIPT_DIR"

# Check Docker container status
DOCKER_RUNNING=false
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "ehr_postgres"; then
    DOCKER_RUNNING=true
fi

# Check if database is accessible
DB_READY=false
if docker exec ehr_postgres pg_isready -U ehruser -d ehrdb > /dev/null 2>&1; then
    DB_READY=true
fi

if [ "$DOCKER_RUNNING" = true ] && [ "$DB_READY" = true ]; then
    echo -e "${GREEN}✅ Docker containers already running and healthy${NC}"
    ALREADY_OK=$((ALREADY_OK+1))
elif [ "$CHECK_ONLY" = true ]; then
    echo -e "${YELLOW}⚠️  Docker containers not running${NC}"
else
    echo "Starting Docker containers..."
    docker-compose up -d
    
    echo "Waiting for PostgreSQL to be ready..."
    sleep 3
    
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker exec ehr_postgres pg_isready -U ehruser -d ehrdb > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
            INSTALLED=$((INSTALLED+1))
            break
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
fi

echo ""

# =============================================================================
# Backend Setup
# =============================================================================
echo -e "${BLUE}🐍 Step 2: Backend Setup${NC}"
echo "----------------------------------------"

cd "$BACKEND_DIR"

# Check virtual environment
VENV_EXISTS=false
VENV_VALID=false
if [ -d "venv" ]; then
    VENV_EXISTS=true
    # Check if venv is valid by checking for python
    if [ -f "venv/bin/python" ]; then
        VENV_VALID=true
    fi
fi

# Check if key packages are installed
DEPS_INSTALLED=false
if [ "$VENV_VALID" = true ]; then
    if source venv/bin/activate && python -c "import fastapi, sqlalchemy, alembic" 2>/dev/null; then
        DEPS_INSTALLED=true
    fi
fi

# Handle virtual environment
if [ "$VENV_VALID" = true ] && [ "$DEPS_INSTALLED" = true ] && [ "$FORCE_REINSTALL" = false ]; then
    echo -e "${GREEN}✅ Python virtual environment exists and valid${NC}"
    echo -e "${GREEN}✅ Python dependencies already installed${NC}"
    ALREADY_OK=$((ALREADY_OK+1))
elif [ "$CHECK_ONLY" = true ]; then
    if [ "$VENV_EXISTS" = false ]; then
        echo -e "${YELLOW}⚠️  Virtual environment not created${NC}"
    elif [ "$DEPS_INSTALLED" = false ]; then
        echo -e "${YELLOW}⚠️  Dependencies not installed${NC}"
    fi
else
    # Create or recreate venv
    if [ "$FORCE_REINSTALL" = true ] && [ -d "venv" ]; then
        echo "Removing old virtual environment..."
        rm -rf venv
    fi
    
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
        echo -e "${GREEN}✅ Virtual environment created${NC}"
    fi
    
    # Install dependencies
    echo "Installing Python dependencies..."
    source venv/bin/activate
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
    INSTALLED=$((INSTALLED+1))
fi

# Check .env file
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    ALREADY_OK=$((ALREADY_OK+1))
elif [ "$CHECK_ONLY" = true ]; then
    echo -e "${YELLOW}⚠️  .env file missing${NC}"
else
    echo "Creating .env file..."
    cat > .env << 'EOF'
# EHR Application - Backend Environment Variables

# Database
DATABASE_URL=postgresql+asyncpg://ehruser:ehrpassword@localhost:5433/ehrdb

# Security
SECRET_KEY=ehr-dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Environment
ENV=development
DEBUG=true
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
    INSTALLED=$((INSTALLED+1))
fi

# Check/run migrations
if [ "$CHECK_ONLY" = false ]; then
    source venv/bin/activate
    echo "Checking database migrations..."
    if alembic upgrade head 2>/dev/null; then
        echo -e "${GREEN}✅ Database migrations up to date${NC}"
    else
        echo -e "${YELLOW}⚠️  Migration check completed (may already be current)${NC}"
    fi
fi

echo ""

# =============================================================================
# Frontend Setup
# =============================================================================
echo -e "${BLUE}⚛️  Step 3: Frontend Setup${NC}"
echo "----------------------------------------"

cd "$FRONTEND_DIR"

# Check if node_modules exists and has packages
NODE_MODULES_VALID=false
if [ -d "node_modules" ] && [ -d "node_modules/react" ] && [ -d "node_modules/antd" ]; then
    NODE_MODULES_VALID=true
fi

if [ "$NODE_MODULES_VALID" = true ] && [ "$FORCE_REINSTALL" = false ]; then
    echo -e "${GREEN}✅ npm dependencies already installed${NC}"
    ALREADY_OK=$((ALREADY_OK+1))
elif [ "$CHECK_ONLY" = true ]; then
    echo -e "${YELLOW}⚠️  npm dependencies not installed${NC}"
else
    if [ "$FORCE_REINSTALL" = true ] && [ -d "node_modules" ]; then
        echo "Removing old node_modules..."
        rm -rf node_modules
    fi
    
    echo "Installing npm dependencies..."
    npm install
    echo -e "${GREEN}✅ npm dependencies installed${NC}"
    INSTALLED=$((INSTALLED+1))
fi

echo ""

# =============================================================================
# Make scripts executable
# =============================================================================
echo -e "${BLUE}🔧 Step 4: Making scripts executable...${NC}"
echo "----------------------------------------"

cd "$SCRIPT_DIR"
chmod +x *.sh 2>/dev/null || true
echo -e "${GREEN}✅ All scripts are now executable${NC}"

echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

if [ "$CHECK_ONLY" = true ]; then
    echo -e "${BLUE}📋 Setup Status Check Complete${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Run ${YELLOW}./setup.sh${NC} (without --check) to install missing components."
else
    # Show summary based on what happened
    if [ $INSTALLED -eq 0 ] && [ $ALREADY_OK -gt 0 ]; then
        echo -e "${GREEN}✅ Everything is already set up!${NC}"
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${YELLOW}Nothing to install - all components are already configured.${NC}"
        echo ""
        echo -e "Just run: ${GREEN}./dev-start.sh${NC}"
    else
        echo -e "${GREEN}🎉 Setup Complete!${NC}"
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${BLUE}📋 Summary:${NC}"
        echo "   Installed/Updated: $INSTALLED components"
        echo "   Already configured: $ALREADY_OK components"
        echo ""
        echo -e "${BLUE}📋 Next Steps:${NC}"
        echo ""
        echo -e "  1. Start all services:"
        echo -e "     ${YELLOW}./dev-start.sh${NC}"
        echo ""
        echo -e "  2. Check service status:"
        echo -e "     ${YELLOW}./dev-status.sh${NC}"
        echo ""
        echo "  3. Open in browser:"
        echo "     Frontend:  http://localhost:3000"
        echo "     API Docs:  http://localhost:8000/docs"
    fi
fi

echo ""
echo -e "${BLUE}🛠️  Available Scripts:${NC}"
echo "  ./dev-start.sh   - Start all services"
echo "  ./dev-stop.sh    - Stop all services"
echo "  ./dev-status.sh  - Check service status"
echo "  ./dev-logs.sh    - View service logs"
echo "  ./help.sh        - Show quick reference"
echo ""
