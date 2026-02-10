# EHR Application - Quick Reference Card

## 🚀 Quick Start (New Machine)

```bash
# 1. Install Docker Desktop (one-time)
#    Download from: https://www.docker.com/products/docker-desktop

# 2. Get the code
git clone <repo-url>
cd EHRApp

# 3. Deploy everything
./docker-deploy.sh

# 4. Access application
#    Open browser: http://localhost:3000
```

---

## 📋 Common Commands

### Starting & Stopping

```bash
# Start all services
docker-compose -f docker-compose.yml up -d

# Stop all services
docker-compose -f docker-compose.yml down

# Restart specific service
docker-compose -f docker-compose.yml restart backend

# View status
docker-compose -f docker-compose.yml ps
```

### Viewing Logs

```bash
# All services
docker-compose -f docker-compose.yml logs -f

# Specific service
docker-compose -f docker-compose.yml logs -f backend
docker-compose -f docker-compose.yml logs -f frontend-dev

# Last 50 lines
docker-compose -f docker-compose.yml logs --tail=50 backend
```

### Database Operations

```bash
# Connect to database
docker exec -it ehr_postgres psql -U ehr_user -d ehr_db

# Run migration
docker exec -it ehr_backend alembic upgrade head

# Create migration
docker exec -it ehr_backend alembic revision --autogenerate -m "description"

# Seed data
docker exec -it ehr_backend python -m app.db.seed_data
```

### Development Tasks

```bash
# Access backend shell
docker exec -it ehr_backend bash

# Access frontend shell
docker exec -it ehr_frontend_dev sh

# Install Python package (temporary)
docker exec -it ehr_backend pip install package-name

# Install npm package
docker exec -it ehr_frontend_dev npm install package-name

# Run tests
docker exec -it ehr_backend pytest
docker exec -it ehr_frontend_dev npm run test
```

### Rebuilding

```bash
# Rebuild all images
docker-compose -f docker-compose.yml build

# Rebuild specific service
docker-compose -f docker-compose.yml build backend

# Rebuild and restart
docker-compose -f docker-compose.yml up -d --build
```

### Emergency Reset

```bash
# Nuclear option - wipes everything
docker-compose -f docker-compose.yml down -v

# Start fresh
./docker-deploy.sh
```

---

## 🌐 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | admin / admin123 |
| **Backend API** | http://localhost:8000 | - |
| **API Docs** | http://localhost:8000/docs | - |
| **OHIF Viewer** | http://localhost:3001 | - |
| **Orthanc PACS** | http://localhost:8042 | orthanc / orthanc |

---

## 🔧 Troubleshooting

### Issue: Port already in use
```bash
# Stop containers
docker-compose -f docker-compose.yml down

# Find and kill process using port
sudo lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows
```

### Issue: Container won't start
```bash
# View logs
docker-compose -f docker-compose.yml logs service-name

# Rebuild container
docker-compose -f docker-compose.yml build --no-cache service-name
docker-compose -f docker-compose.yml up -d
```

### Issue: Database connection error
```bash
# Check database is running
docker-compose -f docker-compose.yml ps postgres

# Restart database
docker-compose -f docker-compose.yml restart postgres

# Wait 10 seconds, then restart backend
docker-compose -f docker-compose.yml restart backend
```

### Issue: Changes not appearing
```bash
# Backend: Restart to reload code
docker-compose -f docker-compose.yml restart backend

# Frontend: Clear cache and rebuild
docker-compose -f docker-compose.yml restart frontend-dev
```

---

## 📦 Adding Dependencies

### Python Package
```bash
# 1. Add to backend/requirements.txt
echo "pandas==2.0.0" >> backend/requirements.txt

# 2. Rebuild backend
docker-compose -f docker-compose.yml up -d --build backend
```

### Node Package
```bash
# 1. Install package
docker exec -it ehr_frontend_dev npm install axios

# 2. Commit package.json and package-lock.json
git add frontend/package*.json
git commit -m "Add axios"
```

---

## 🗄️ Database Migrations

```bash
# Create new migration
docker exec -it ehr_backend alembic revision --autogenerate -m "Add user table"

# Apply migrations
docker exec -it ehr_backend alembic upgrade head

# Rollback one version
docker exec -it ehr_backend alembic downgrade -1

# Check current version
docker exec -it ehr_backend alembic current

# View migration history
docker exec -it ehr_backend alembic history
```

---

## 💾 Backup & Restore

### Backup
```bash
# Backup EHR database
docker exec ehr_postgres pg_dump -U ehr_user ehr_db > backup_$(date +%Y%m%d).sql

# Backup Orthanc database
docker exec ehr_orthanc_postgres pg_dump -U orthanc orthanc > backup_orthanc_$(date +%Y%m%d).sql
```

### Restore
```bash
# Stop containers
docker-compose -f docker-compose.yml down

# Remove volumes
docker volume rm ehr_postgres_data

# Start containers (creates fresh database)
docker-compose -f docker-compose.yml up -d

# Wait for database to be ready
sleep 10

# Restore data
docker exec -i ehr_postgres psql -U ehr_user ehr_db < backup_20260210.sql
```

---

## 🔄 Team Workflow

### Pulling Changes
```bash
# Get latest code
git pull

# Restart services
docker-compose -f docker-compose.yml restart

# Apply any new migrations
docker exec -it ehr_backend alembic upgrade head
```

### Pushing Changes
```bash
# Commit your changes
git add .
git commit -m "Add feature"
git push

# Tell team to pull and restart
```

---

## 🚀 Production Deployment

```bash
# 1. Create production environment file
cp .env.example .env.production

# 2. Edit with secure passwords
nano .env.production

# 3. Deploy
./docker-deploy-prod.sh
```

---

## 📊 Health Checks

```bash
# Check all services
docker-compose -f docker-compose.yml ps

# Check specific service health
curl http://localhost:8000/docs  # Backend
curl http://localhost:3000       # Frontend
curl http://localhost:8042       # Orthanc

# Check database connectivity
docker exec ehr_postgres pg_isready
```

---

## 🎯 Development Workflow

```
1. Start Docker containers → docker-compose up -d
2. Edit code in your IDE → Changes auto-reload
3. Test in browser → http://localhost:3000
4. View logs if needed → docker-compose logs -f
5. Commit changes → git commit
```

**No need to restart containers unless:**
- Added new dependencies (requirements.txt / package.json)
- Changed environment variables
- Changed Docker configuration

---

## 📞 Getting Help

1. Check logs: `docker-compose logs -f service-name`
2. Check service status: `docker-compose ps`
3. Try restart: `docker-compose restart service-name`
4. Try rebuild: `docker-compose up -d --build service-name`
5. Last resort: Complete reset (see Emergency Reset above)

---

## 📚 Full Documentation

- **[Setup Guide for New Machine](SETUP_GUIDE_FOR_NEW_MACHINE.md)** - Detailed step-by-step for beginners
- **[Ongoing Development](ONGOING_DEVELOPMENT.md)** - Working with Docker during active development
- **[Docker Deployment Guide](DOCKER_DEPLOYMENT.md)** - Complete deployment documentation

---

**Print this card and keep it handy! 📌**
