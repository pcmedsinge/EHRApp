#!/bin/bash

# =============================================================================
# EHR Application - View Logs Script
# =============================================================================
# This script displays logs from EHR application services.
#
# Usage: ./dev-logs.sh [service]
# Services: backend, frontend, postgres, orthanc, all
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default to showing all
SERVICE=${1:-"menu"}

show_menu() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║          EHR Application - Service Logs                   ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Select a service to view logs:"
    echo ""
    echo "  1) Backend API     (FastAPI/Uvicorn)"
    echo "  2) Frontend        (Vite)"
    echo "  3) PostgreSQL      (Docker)"
    echo "  4) Orthanc PACS    (Docker)"
    echo "  5) All Docker      (All containers)"
    echo "  6) Exit"
    echo ""
    read -p "Enter choice [1-6]: " choice
    
    case $choice in
        1) SERVICE="backend" ;;
        2) SERVICE="frontend" ;;
        3) SERVICE="postgres" ;;
        4) SERVICE="orthanc" ;;
        5) SERVICE="docker" ;;
        6) exit 0 ;;
        *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
    esac
}

# Parse command line or show menu
case $SERVICE in
    backend|frontend|postgres|orthanc|docker|all)
        # Valid service specified
        ;;
    menu|"")
        show_menu
        ;;
    --help|-h)
        echo "Usage: ./dev-logs.sh [service]"
        echo ""
        echo "Services:"
        echo "  backend   - FastAPI/Uvicorn logs"
        echo "  frontend  - Vite dev server logs"
        echo "  postgres  - PostgreSQL container logs"
        echo "  orthanc   - Orthanc PACS container logs"
        echo "  docker    - All Docker container logs"
        echo "  all       - All logs (tailed)"
        echo ""
        exit 0
        ;;
    *)
        echo -e "${RED}Unknown service: $SERVICE${NC}"
        echo "Use: backend, frontend, postgres, orthanc, docker, all"
        exit 1
        ;;
esac

# Show logs based on selection
case $SERVICE in
    backend)
        echo -e "${BLUE}📋 Backend API Logs${NC}"
        echo "=========================================="
        if [ -f /tmp/ehr-backend.log ]; then
            tail -f /tmp/ehr-backend.log
        else
            echo -e "${YELLOW}No backend log file found${NC}"
            echo "Backend may not have been started with dev-start.sh"
        fi
        ;;
    frontend)
        echo -e "${BLUE}📋 Frontend Logs${NC}"
        echo "=========================================="
        if [ -f /tmp/ehr-frontend.log ]; then
            tail -f /tmp/ehr-frontend.log
        else
            echo -e "${YELLOW}No frontend log file found${NC}"
            echo "Frontend may not have been started with dev-start.sh"
        fi
        ;;
    postgres)
        echo -e "${BLUE}📋 PostgreSQL Logs${NC}"
        echo "=========================================="
        docker logs -f ehr_postgres 2>&1
        ;;
    orthanc)
        echo -e "${BLUE}📋 Orthanc PACS Logs${NC}"
        echo "=========================================="
        docker logs -f ehr_orthanc 2>&1
        ;;
    docker)
        echo -e "${BLUE}📋 All Docker Container Logs${NC}"
        echo "=========================================="
        docker-compose logs -f
        ;;
    all)
        echo -e "${BLUE}📋 All Service Logs (last 20 lines each)${NC}"
        echo "=========================================="
        echo ""
        echo -e "${CYAN}--- Backend ---${NC}"
        if [ -f /tmp/ehr-backend.log ]; then
            tail -20 /tmp/ehr-backend.log
        else
            echo "(no log file)"
        fi
        echo ""
        echo -e "${CYAN}--- Frontend ---${NC}"
        if [ -f /tmp/ehr-frontend.log ]; then
            tail -20 /tmp/ehr-frontend.log
        else
            echo "(no log file)"
        fi
        echo ""
        echo -e "${CYAN}--- PostgreSQL ---${NC}"
        docker logs --tail 20 ehr_postgres 2>&1
        echo ""
        echo -e "${CYAN}--- Orthanc ---${NC}"
        docker logs --tail 20 ehr_orthanc 2>&1
        ;;
esac
