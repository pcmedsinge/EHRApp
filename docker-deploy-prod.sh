#!/bin/bash

# ==========================================================================
# EHR App - Production Docker Deployment
# ==========================================================================

set -e

echo "=========================================="
echo "EHR Application - Production Deployment"
echo "=========================================="

# Create production docker-compose file
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15.10-alpine
    container_name: ehr_postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-ehr_db}
      POSTGRES_USER: ${POSTGRES_USER:-ehr_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ehr-network
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 10s
      timeout: 5s
      retries: 5

  orthanc_postgres:
    image: postgres:15.10-alpine
    container_name: ehr_orthanc_postgres
    environment:
      POSTGRES_DB: orthanc
      POSTGRES_USER: orthanc
      POSTGRES_PASSWORD: ${ORTHANC_DB_PASSWORD}
    volumes:
      - orthanc_postgres_data:/var/lib/postgresql/data
    networks:
      - ehr-network
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ehr_backend
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      SECRET_KEY: ${SECRET_KEY}
      ORTHANC_URL: http://orthanc:8042
      ORTHANC_USERNAME: ${ORTHANC_USERNAME:-orthanc}
      ORTHANC_PASSWORD: ${ORTHANC_PASSWORD}
    networks:
      - ehr-network
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ehr_frontend
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - ehr-network
    restart: always

  orthanc:
    image: orthancteam/orthanc:25.12.3
    container_name: ehr_orthanc
    depends_on:
      - orthanc_postgres
    ports:
      - "8042:8042"
      - "4242:4242"
    environment:
      ORTHANC__REGISTERED_USERS: |
        {
          "${ORTHANC_USERNAME}": "${ORTHANC_PASSWORD}"
        }
      ORTHANC__POSTGRESQL__HOST: "orthanc_postgres"
      ORTHANC__POSTGRESQL__PASSWORD: "${ORTHANC_DB_PASSWORD}"
    volumes:
      - orthanc_data:/var/lib/orthanc/db
    networks:
      - ehr-network
    restart: always

  ohif-viewer:
    image: ohif/viewer:v4.12.51.21579
    container_name: ehr_ohif
    depends_on:
      - orthanc
    ports:
      - "3001:80"
    volumes:
      - ./config/ohif-config.js:/usr/share/nginx/html/app-config.js:ro
    networks:
      - ehr-network
    restart: always

networks:
  ehr-network:
    driver: bridge

volumes:
  postgres_data:
  orthanc_postgres_data:
  orthanc_data:
EOF

# Check for .env.production file
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "Creating template..."
    cat > .env.production << 'ENVEOF'
# Database
POSTGRES_DB=ehr_db
POSTGRES_USER=ehr_user
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD

# Backend
SECRET_KEY=CHANGE_THIS_TO_RANDOM_STRING

# Orthanc
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=CHANGE_THIS_PASSWORD
ORTHANC_DB_PASSWORD=CHANGE_THIS_PASSWORD
ENVEOF
    echo "⚠️  Please edit .env.production with secure passwords!"
    exit 1
fi

# Load environment variables
source .env.production

# Build and deploy
echo "🏗️  Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Production deployment complete!"
echo "   Access your application at: http://your-server-ip"
