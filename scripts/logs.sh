#!/bin/bash

# =============================================================================
# EHR Application - Logs Viewer
# =============================================================================
# Shows logs for Backend and Frontend
#
# Usage: ./logs.sh [service]
# Services:
#   backend     Show only backend logs
#   frontend    Show only frontend logs
#   (none)      Show both logs
# =============================================================================

# Colors for output
CYAN='\033[0;36m'
NC='\033[0m'

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

SERVICE=${1:-all}

echo -e "${CYAN}"
echo "============================================================"
echo "  📋 EHR Application Logs"
echo "============================================================"
echo -e "${NC}"
echo "Press Ctrl+C to exit"
echo ""

case $SERVICE in
    backend)
        tail -f "$BACKEND_DIR/backend.log"
        ;;
    frontend)
        tail -f "$FRONTEND_DIR/frontend.log"
        ;;
    all|*)
        tail -f "$BACKEND_DIR/backend.log" "$FRONTEND_DIR/frontend.log"
        ;;
esac
