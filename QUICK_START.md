# EHR Application - Quick Start Guide

## 🚀 Starting the Application

All services are managed through three main scripts in the `scripts/` folder:

### 1. Start Services: `dev-start.sh`

Start all services (Docker + Backend + Frontend):
```bash
./scripts/dev-start.sh
```

**Options:**
- `--no-docker` - Skip starting Docker containers (if already running)
- `--backend-only` - Start only backend API
- `--frontend-only` - Start only frontend (React)
- `--force` - Force restart services even if already running
- `--help` - Show help

**Examples:**
```bash
# Start everything from scratch
./scripts/dev-start.sh

# Only start frontend (Docker & Backend already running)
./scripts/dev-start.sh --frontend-only

# Start backend and frontend, skip Docker
./scripts/dev-start.sh --no-docker

# Force restart everything
./scripts/dev-start.sh --force
```

### 2. Check Status: `dev-status.sh`

Check status of all services:
```bash
./scripts/dev-status.sh
```

This shows:
- ✅ Docker containers status (PostgreSQL, Orthanc, OHIF)
- ✅ Application services status (Backend, Frontend)
- ✅ Database connection and data counts
- ✅ Port usage summary
- ✅ Quick access links

### 3. Stop Services: `dev-stop.sh`

Stop services:
```bash
# Stop Backend & Frontend only (keep Docker running)
./scripts/dev-stop.sh

# Stop everything including Docker
./scripts/dev-stop.sh --all
```

**Options:**
- `--all` - Stop Docker containers too
- `--keep-docker` - Keep Docker running (default)
- `--help` - Show help

## 🌐 Service URLs

Once started, access the application at:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main EHR Application UI |
| **Backend API** | http://localhost:8000 | REST API |
| **API Docs** | http://localhost:8000/docs | Swagger/OpenAPI Documentation |
| **Orthanc PACS** | http://localhost:8042 | DICOM PACS Server |
| **OHIF Viewer** | http://localhost:3001 | Medical Image Viewer |

## 📊 Services Overview

### Docker Containers (Infrastructure)
1. **PostgreSQL** (port 5433) - Main database
2. **Orthanc PACS** (ports 8042, 4242) - DICOM image storage
3. **OHIF Viewer** (port 3001) - Medical image viewer

### Application Services
1. **Backend API** (port 8000) - FastAPI Python backend
2. **Frontend** (port 3000) - React/TypeScript UI

## 🔄 Typical Workflow

### First Time Setup
```bash
# 1. Start all services
./scripts/dev-start.sh

# 2. Wait for all services to be ready (~30 seconds)
# 3. Check status
./scripts/dev-status.sh

# 4. Open browser
# Frontend: http://localhost:3000
```

### Daily Development
```bash
# Morning: Start everything
./scripts/dev-start.sh

# During development: Check status anytime
./scripts/dev-status.sh

# Evening: Stop services (keep Docker running)
./scripts/dev-stop.sh

# Or stop everything for the day
./scripts/dev-stop.sh --all
```

### Quick Restarts
```bash
# Restart just backend (after code changes)
./scripts/dev-stop.sh
./scripts/dev-start.sh --backend-only --force

# Restart just frontend
./scripts/dev-stop.sh
./scripts/dev-start.sh --frontend-only --force

# Force restart everything
./scripts/dev-start.sh --force
```

## 📝 Logs

View logs in real-time:
```bash
# All logs
./scripts/dev-logs.sh

# Backend only
tail -f backend.log

# Frontend only
tail -f frontend.log
```

Log files location:
- `backend.log` - Backend API logs
- `frontend.log` - Frontend dev server logs

## 🐛 Troubleshooting

### Services won't start
```bash
# Check what's running
./scripts/dev-status.sh

# Stop everything and restart
./scripts/dev-stop.sh --all
./scripts/dev-start.sh
```

### Port already in use
```bash
# Force restart to kill existing processes
./scripts/dev-start.sh --force
```

### Docker containers not responding
```bash
# Restart Docker
./scripts/dev-stop.sh --all
docker-compose down
docker-compose up -d
./scripts/dev-start.sh --no-docker
```

### Check specific service health
```bash
# Backend health
curl http://localhost:8000/health

# Orthanc health
curl -u orthanc:orthanc http://localhost:8042/system

# OHIF health
curl http://localhost:3001
```

## 📦 What Each Script Does

### `dev-start.sh`
1. Creates PID directory for process tracking
2. Starts Docker containers (PostgreSQL, Orthanc, OHIF)
3. Waits for PostgreSQL to be ready
4. Starts Backend API (runs migrations first)
5. Starts Frontend dev server
6. Shows service URLs and log locations

### `dev-status.sh`
1. Checks Docker container health
2. Checks application service availability
3. Tests database connection
4. Shows data counts (tables, users, patients)
5. Reports port usage
6. Displays quick access links

### `dev-stop.sh`
1. Stops Frontend (port 3000)
2. Stops Backend (port 8000)
3. Optionally stops Docker containers
4. Cleans up PID files
5. Reports any remaining processes

## 🎯 Phase 5C Testing Workflow

For testing the new DICOM viewer integration:

```bash
# 1. Ensure all services are running
./scripts/dev-status.sh

# 2. Open frontend
# http://localhost:3000

# 3. Login to application
# Default: admin / admin

# 4. Navigate to an imaging order
# Orders → Radiology/Imaging Orders

# 5. Upload DICOM files
# Click "Upload Images" button

# 6. View images in embedded OHIF viewer
# Click "View Images" button
# Viewer opens in modal with controls
```

## 📋 Current Status

Run `./scripts/dev-status.sh` anytime to see:

```
╔═══════════════════════════════════════════════════════════╗
║          EHR Application - Service Status                 ║
╚═══════════════════════════════════════════════════════════╝

📦 Docker Containers
----------------------------------------
PostgreSQL          ✅ Healthy
Orthanc PACS        ✅ Running
OHIF Viewer         ✅ Running

🖥️  Application Services
----------------------------------------
Backend API         ✅ Running (port 8000)
Frontend            ✅ Running (port 3000)

🗄️  Database
----------------------------------------
Connection          ✅ Connected
   Tables: 50
   Users: 5
   Patients: 100

🔌 Port Usage
----------------------------------------
Port 3000  (Frontend):   In use
Port 3001  (OHIF):       In use
Port 4242  (DICOM):      In use
Port 5433  (PostgreSQL): In use
Port 8000  (Backend):    In use
Port 8042  (Orthanc):    In use
```

---

**All services are ready! 🎉**

Start developing or testing at http://localhost:3000
