# EHR Application - Docker Deployment Guide

## Quick Start (Development)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### One-Command Deployment

```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

That's it! The entire application will be running in Docker containers.

## What Gets Deployed

### Services
1. **PostgreSQL** (port 5433) - EHR database
2. **Orthanc PostgreSQL** (port 5434) - DICOM database  
3. **FastAPI Backend** (port 8000) - REST API
4. **React Frontend** (port 3000) - Web UI
5. **Orthanc PACS** (port 8042, 4242) - DICOM server
6. **OHIF Viewer** (port 3001) - Medical image viewer

### Access Points
- 🌐 **EHR Application**: http://localhost:3000
- 📚 **API Documentation**: http://localhost:8000/docs
- 🏥 **OHIF Viewer**: http://localhost:3001
- 📡 **Orthanc**: http://localhost:8042
  - Username: `orthanc`
  - Password: `orthanc`

## Portability

### Moving to Another Machine

**Option 1: Git Clone**
```bash
git clone <your-repo>
cd EHRApp
./docker-deploy.sh
```

**Option 2: Copy Files**
```bash
# On source machine
tar -czf ehrapp.tar.gz EHRApp/

# On target machine
tar -xzf ehrapp.tar.gz
cd EHRApp
./docker-deploy.sh
```

### What You Need on New Machine
- ✅ Docker & Docker Compose only
- ❌ No Python installation needed
- ❌ No Node.js installation needed
- ❌ No manual dependency installation

## Production Deployment

### Setup
1. Create production environment file:
```bash
cp .env.example .env.production
```

2. Edit `.env.production` with secure passwords:
```env
POSTGRES_PASSWORD=your_secure_password_here
SECRET_KEY=your_secret_key_here
ORTHANC_PASSWORD=your_orthanc_password
```

3. Deploy:
```bash
chmod +x docker-deploy-prod.sh
./docker-deploy-prod.sh
```

### Production Features
- ✅ Nginx serves optimized frontend build
- ✅ Automatic container restart on failure
- ✅ Optimized for performance
- ✅ Secure environment variables
- ✅ No development tools in containers

## Common Commands

### Start Services
```bash
docker-compose -f docker-compose.full.yml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.full.yml down
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.full.yml logs -f

# Specific service
docker-compose -f docker-compose.full.yml logs -f backend
docker-compose -f docker-compose.full.yml logs -f frontend-dev
```

### Restart a Service
```bash
docker-compose -f docker-compose.full.yml restart backend
```

### Access Container Shell
```bash
# Backend
docker exec -it ehr_backend /bin/bash

# Frontend
docker exec -it ehr_frontend_dev /bin/sh

# Database
docker exec -it ehr_postgres psql -U ehr_user -d ehr_db
```

### Database Operations
```bash
# Run migrations
docker exec -it ehr_backend alembic upgrade head

# Create migration
docker exec -it ehr_backend alembic revision --autogenerate -m "description"

# Seed data
docker exec -it ehr_backend python -m app.db.seed_data
```

### Reset Everything
```bash
docker-compose -f docker-compose.full.yml down -v
docker-compose -f docker-compose.full.yml up -d
```

## Data Persistence

Data is stored in Docker volumes:
- `ehr_postgres_data` - EHR database
- `ehr_orthanc_postgres_data` - DICOM database
- `ehr_orthanc_data` - DICOM files

### Backup Data
```bash
# Backup EHR database
docker exec ehr_postgres pg_dump -U ehr_user ehr_db > backup_ehr.sql

# Backup Orthanc database
docker exec ehr_orthanc_postgres pg_dump -U orthanc orthanc > backup_orthanc.sql
```

### Restore Data
```bash
# Restore EHR database
docker exec -i ehr_postgres psql -U ehr_user ehr_db < backup_ehr.sql

# Restore Orthanc database
docker exec -i ehr_orthanc_postgres psql -U orthanc orthanc < backup_orthanc.sql
```

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :3000

# Change port in docker-compose
ports:
  - "3002:3000"  # Change 3000 to any available port
```

### Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.full.yml logs backend

# Rebuild container
docker-compose -f docker-compose.full.yml build --no-cache backend
docker-compose -f docker-compose.full.yml up -d
```

### Database Connection Issues
```bash
# Check database is running
docker-compose -f docker-compose.full.yml ps postgres

# Check database logs
docker-compose -f docker-compose.full.yml logs postgres
```

## Performance Optimization

### For Development
The default `docker-compose.full.yml` uses:
- Volume mounts for hot-reload
- Development builds
- Debug logging enabled

### For Production
Use `docker-deploy-prod.sh` which:
- Builds optimized production images
- Uses Nginx for static file serving
- Disables debug logging
- Enables auto-restart on failure

## System Requirements

### Development
- CPU: 2 cores minimum
- RAM: 4GB minimum
- Disk: 10GB free space
- OS: Linux, macOS, Windows (with WSL2)

### Production
- CPU: 4+ cores recommended
- RAM: 8GB+ recommended
- Disk: 50GB+ for DICOM storage
- OS: Linux recommended

## Advantages of Dockerized Setup

1. **Portability**: Works on any machine with Docker
2. **Consistency**: Same environment everywhere
3. **Isolation**: No conflicts with system packages
4. **Easy Setup**: One command deployment
5. **Scalability**: Easy to add more containers
6. **Backup**: Simple data volume backup/restore
7. **Team Collaboration**: Everyone uses identical setup

## Next Steps

After deployment:
1. Access http://localhost:3000
2. Login with default credentials
3. Create test patients and visits
4. Upload DICOM images
5. View images in OHIF viewer

For production deployment, see the production section above.
