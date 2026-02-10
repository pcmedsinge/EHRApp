#!/bin/bash

# EHR Application - Docker Logs Viewer
# This script shows logs from PostgreSQL and Orthanc containers

echo "📜 EHR Docker Services Logs"
echo "=================================="
echo "Press Ctrl+C to exit"
echo "=================================="
echo ""

# Check if a specific service is requested
if [ -n "$1" ]; then
    case $1 in
        postgres|pg|db)
            echo "📊 Showing PostgreSQL logs..."
            docker-compose logs -f postgres
            ;;
        orthanc|pacs)
            echo "📊 Showing Orthanc logs..."
            docker-compose logs -f orthanc
            ;;
        *)
            echo "❌ Unknown service: $1"
            echo "Available services: postgres, orthanc"
            exit 1
            ;;
    esac
else
    # Show all logs
    echo "📊 Showing all service logs..."
    docker-compose logs -f
fi
