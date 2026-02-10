#!/bin/bash

# ==========================================================================
# EHR App - Docker Deployment Script
# ==========================================================================

set -e

echo "=========================================="
echo "EHR Application - Docker Deployment"
echo "=========================================="

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop any running containers
echo ""
echo "📦 Stopping any existing containers..."
docker-compose -f docker-compose.full.yml down

# Build and start all services
echo ""
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.full.yml build

echo ""
echo "🚀 Starting all services..."
docker-compose -f docker-compose.full.yml up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.full.yml ps

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo "   OHIF Viewer:  http://localhost:3001"
echo "   Orthanc:      http://localhost:8042 (orthanc/orthanc)"
echo ""
echo "📝 To view logs:"
echo "   docker-compose -f docker-compose.full.yml logs -f [service-name]"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose -f docker-compose.full.yml down"
echo ""
