#!/bin/bash

# ==========================================================================
# EHR Application - Complete Dockerized Deployment
# ==========================================================================

set -e

echo "=========================================="
echo "  EHR Application - Docker Deployment"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.full.yml down -v 2>/dev/null || true
echo ""

# Build images
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.full.yml build
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.full.yml up -d
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
echo -n "   Postgres: "
until docker exec ehr_postgres pg_isready -U ehr_user -d ehr_db >/dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo " ✅"

echo -n "   Orthanc: "
until curl -s http://localhost:8042/system >/dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo " ✅"

echo -n "   Backend: "
until curl -s http://localhost:8000/docs >/dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo " ✅"

echo -n "   Frontend: "
until curl -s http://localhost:3000 >/dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " ✅"

echo ""
echo "=========================================="
echo "  🎉 Deployment Complete!"
echo "=========================================="
echo ""
echo "Services are now running:"
echo "  📊 EHR Backend API:    http://localhost:8000"
echo "  📊 API Documentation:  http://localhost:8000/docs"
echo "  🖥️  EHR Frontend:       http://localhost:3000"
echo "  🏥 Orthanc PACS:       http://localhost:8042"
echo "  👁️  OHIF Viewer:        http://localhost:3001"
echo "  🗄️  PostgreSQL:         localhost:5433"
echo ""
echo "Default Credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "To view logs:         docker-compose -f docker-compose.full.yml logs -f"
echo "To stop services:     docker-compose -f docker-compose.full.yml down"
echo "To restart services:  docker-compose -f docker-compose.full.yml restart"
echo ""
