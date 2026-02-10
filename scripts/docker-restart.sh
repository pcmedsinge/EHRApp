#!/bin/bash

# EHR Application - Docker Services Restart Script
# This script restarts PostgreSQL and Orthanc PACS containers

echo "🔄 Restarting EHR Docker Services..."
echo "=================================="

# Stop services
./docker-down.sh

# Wait a moment
echo ""
echo "⏳ Waiting 2 seconds..."
sleep 2

# Start services
echo ""
./docker-up.sh
