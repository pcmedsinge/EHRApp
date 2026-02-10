#!/bin/bash

# EHR Application - Docker Services Stop Script
# This script stops PostgreSQL and Orthanc PACS containers

echo "🛑 Stopping EHR Docker Services..."
echo "=================================="

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    exit 1
fi

# Show current container status
echo "📊 Current Container Status:"
docker ps --filter "name=ehr_" --format "table {{.Names}}\t{{.Status}}"

# Stop containers
echo ""
echo "📦 Stopping containers..."
docker-compose down

echo ""
echo "=================================="
echo "✅ Services Stopped Successfully!"
echo ""
echo "💡 Note: Data is preserved in volumes"
echo ""
echo "📋 Useful Commands:"
echo "   - Start services:       ./docker-up.sh"
echo "   - Remove volumes:       docker-compose down -v"
echo "   - View stopped:         docker ps -a"
echo "=================================="
