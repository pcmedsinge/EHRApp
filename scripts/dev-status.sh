#!/bin/bash

# =============================================================================
# EHR Application - Service Status Check Script
# =============================================================================
# This script checks the status of all EHR application services.
#
# Usage: ./dev-status.sh
# =============================================================================

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$PROJECT_ROOT/.pids"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Header
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          EHR Application - Service Status                 ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check service
check_service() {
    local name=$1
    local url=$2
    local port=$3
    local pid_file=$4
    
    printf "%-20s" "$name"
    
    # Check if URL responds
    if curl -s "$url" > /dev/null 2>&1; then
        # Get PID from port
        local pid=$(lsof -ti:$port 2>/dev/null | head -1)
        echo -e "${GREEN}✅ Running${NC} (port $port, PID: ${pid:-unknown})"
        
        # Update PID file if exists
        if [ ! -z "$pid" ] && [ ! -z "$pid_file" ]; then
            mkdir -p "$(dirname "$pid_file")"
            echo "$pid" > "$pid_file"
        fi
        return 0
    else
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local pid=$(lsof -ti:$port 2>/dev/null | head -1)
            echo -e "${YELLOW}⚠️  Port in use but not responding${NC} (PID: $pid)"
        else
            echo -e "${RED}❌ Not running${NC}"
            # Clean up stale PID file
            if [ -f "$pid_file" ]; then
                rm -f "$pid_file"
            fi
        fi
        return 1
    fi
}

# Function to check Docker container
check_container() {
    local name=$1
    local container=$2
    
    printf "%-20s" "$name"
    
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${container}$"; then
        local status=$(docker inspect -f '{{.State.Health.Status}}' $container 2>/dev/null || echo "running")
        if [ "$status" = "healthy" ]; then
            echo -e "${GREEN}✅ Healthy${NC}"
        else
            echo -e "${GREEN}✅ Running${NC} ($status)"
        fi
        return 0
    else
        echo -e "${RED}❌ Not running${NC}"
        return 1
    fi
}

# =============================================================================
# Docker Containers
# =============================================================================
echo -e "${BLUE}📦 Docker Containers${NC}"
echo "----------------------------------------"
check_container "PostgreSQL" "ehr_postgres"
check_container "Orthanc PACS" "ehr_orthanc"
check_container "OHIF Viewer" "ehr_ohif"
echo ""

# =============================================================================
# Application Services
# =============================================================================
echo -e "${BLUE}🖥️  Application Services${NC}"
echo "----------------------------------------"
check_service "Backend API" "http://localhost:8000/health" "8000" "$PID_DIR/backend.pid"
check_service "Frontend" "http://localhost:3000" "3000" "$PID_DIR/frontend.pid"
echo ""

# =============================================================================
# Database Connection
# =============================================================================
echo -e "${BLUE}🗄️  Database${NC}"
echo "----------------------------------------"
printf "%-20s" "Connection"
if docker exec ehr_postgres pg_isready -U ehr_user -d ehr_db > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connected${NC}"
    
    # Show table count
    TABLE_COUNT=$(docker exec ehr_postgres psql -U ehr_user -d ehr_db -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    echo -e "   Tables: $TABLE_COUNT"
    
    # Show user count
    USER_COUNT=$(docker exec ehr_postgres psql -U ehr_user -d ehr_db -t -c "SELECT count(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
    echo -e "   Users: $USER_COUNT"
    
    # Show patient count
    PATIENT_COUNT=$(docker exec ehr_postgres psql -U ehr_user -d ehr_db -t -c "SELECT count(*) FROM patients;" 2>/dev/null | tr -d ' ' || echo "0")
    echo -e "   Patients: $PATIENT_COUNT"
else
    echo -e "${RED}❌ Not connected${NC}"
fi
echo ""

# =============================================================================
# Port Summary
# =============================================================================
echo -e "${BLUE}🔌 Port Usage${NC}"
echo "----------------------------------------"

# Check if port is in use (including Docker mapped ports)
check_port_usage() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}In use${NC}"
    else
        echo -e "${YELLOW}Free${NC}"
    fi
}

echo "Port 3000  (Frontend):   $(check_port_usage 3000)"
echo "Port 3001  (OHIF):       $(check_port_usage 3001)"
echo "Port 4242  (DICOM):      $(check_port_usage 4242)"
echo "Port 5433  (PostgreSQL): $(check_port_usage 5433)"
echo "Port 8000  (Backend):    $(check_port_usage 8000)"
echo "Port 8042  (Orthanc):    $(check_port_usage 8042)"
echo ""

# =============================================================================
# Quick Links
# =============================================================================
echo -e "${BLUE}🔗 Quick Links${NC}"
echo "----------------------------------------"
echo "Frontend:     http://localhost:3000"
echo "Backend API:  http://localhost:8000"
echo "API Docs:     http://localhost:8000/docs"
echo "Orthanc PACS: http://localhost:8042"
echo "OHIF Viewer:  http://localhost:3001"
echo ""
