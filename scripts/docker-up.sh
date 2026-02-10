#!/bin/bash

# EHR Application - Docker Services Start Script
# This script starts PostgreSQL and Orthanc PACS containers

echo "🚀 Starting EHR Docker Services..."
echo "=================================="

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Start containers
echo "📦 Starting containers..."
docker-compose up -d

# Wait for containers to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check container status
echo ""
echo "📊 Container Status:"
docker ps --filter "name=ehr_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test PostgreSQL connection
echo ""
echo "🔍 Testing PostgreSQL connection..."
if docker exec ehr_postgres pg_isready -U ehr_user &> /dev/null; then
    echo "✅ PostgreSQL is ready (port 5433)"
else
    echo "⚠️  PostgreSQL is starting up..."
fi

# Test Orthanc connection
echo ""
echo "🔍 Testing Orthanc PACS connection..."
if curl -s -u ehr:ehr_password http://localhost:8043/system &> /dev/null; then
    echo "✅ Orthanc PACS is ready (port 8043)"
else
    echo "⚠️  Orthanc is starting up..."
fi

echo ""
echo "=================================="
echo "✅ Services Started Successfully!"
echo ""
echo "📝 Quick Access:"
echo "   - Orthanc Web UI: http://localhost:8043"
echo "   - PostgreSQL:     localhost:5433"
echo "   - Username/Pass:  ehr/ehr_password"
echo ""
echo "📋 Useful Commands:"
echo "   - View logs:      docker-compose logs -f"
echo "   - Stop services:  ./docker-down.sh"
echo "   - Check status:   docker ps"
echo "=================================="
