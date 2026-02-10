# EHR System

Electronic Health Record (EHR) system for Outpatient Department (OPD) clinics.

---

## 🐳 **NEW: One-Command Docker Deployment** (Recommended)

**Fully portable setup - works on any machine with Docker!**

```bash
# 1. Install Docker Desktop (one-time): https://www.docker.com/products/docker-desktop
# 2. Clone repository
# 3. Deploy everything:
./docker-deploy.sh

# Access at: http://localhost:3000
```

**📖 Complete Guides:**
- **[Setup Guide for New Machine](docs/deployment/SETUP_GUIDE_FOR_NEW_MACHINE.md)** - Beginner-friendly, step-by-step instructions
- **[Ongoing Development Guide](docs/deployment/ONGOING_DEVELOPMENT.md)** - Continue building new phases with Docker
- **[Quick Reference Card](docs/deployment/QUICK_REFERENCE.md)** - Common commands and troubleshooting
- **[Docker Deployment Guide](docs/deployment/DOCKER_DEPLOYMENT.md)** - Technical documentation
- **[All Deployment Docs](docs/deployment/)** - Complete deployment documentation index

**Why Docker?**
- ✅ Works on any machine (Windows, Mac, Linux)
- ✅ No manual Python/Node.js installation
- ✅ One command deployment
- ✅ Identical environment for entire team
- ✅ Easy backup and restore
- ✅ Production-ready

---

## 🚀 Alternative: Manual Development Setup

<details>
<summary>Click to expand manual setup instructions (traditional method)</summary>

### Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Docker | Latest | `docker --version` |
| Docker Compose | Latest | `docker-compose --version` |
| Python | 3.11+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |

### First-Time Setup

Run the setup script to configure everything automatically:

```bash
cd scripts
./setup.sh
```

This will:
- ✅ Check all prerequisites
- ✅ Start Docker containers (PostgreSQL, Orthanc)
- ✅ Create Python virtual environment
- ✅ Install Python dependencies
- ✅ Create `.env` configuration file
- ✅ Run database migrations
- ✅ Install npm dependencies

### Start Development Server

```bash
cd scripts
./dev-start.sh
```

This starts all services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Orthanc PACS**: http://localhost:8043

### Stop Development Server

```bash
cd scripts
./dev-stop.sh           # Keep Docker running
./dev-stop.sh --all     # Stop everything including Docker
```

### Check Service Status

```bash
./scripts/dev-status.sh
```

</details>

---

## 📁 Project Structure

```
EHRApp/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   │   ├── auth/       # Authentication
│   │   │   └── patients/   # Patient management
│   │   ├── core/           # Configuration
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── utils/          # Utilities
│   ├── alembic/            # Database migrations
│   ├── venv/               # Python virtual environment
│   ├── requirements.txt
│   └── .env
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── common/     # Shared components
│   │   │   └── layout/     # Layout components
│   │   ├── config/         # Configuration
│   │   ├── services/       # API services
│   │   ├── theme/          # Design system
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilities
│   ├── package.json
│   └── vite.config.ts
│
├── docker/                 # Docker configurations
│   ├── postgres/
│   └── orthanc/
│
├── docs/                   # Documentation
│   └── phases/             # Implementation phases
│
├── docker-compose.yml      # Docker services
├── scripts/               # Helper scripts
│   ├── setup.sh           # First-time setup
│   ├── dev-start.sh       # Start all services
│   ├── dev-stop.sh        # Stop all services
│   ├── dev-status.sh      # Check service status
│   └── dev-logs.sh        # View service logs
└── README.md
```

---

## 🛠️ Development Scripts

| Script | Description |
|--------|-------------|
| `cd scripts && ./setup.sh` | First-time environment setup |
| `cd scripts && ./dev-start.sh` | Start all services |
| `cd scripts && ./dev-stop.sh` | Stop backend & frontend (keeps Docker) |
| `cd scripts && ./dev-stop.sh --all` | Stop everything including Docker |
| `cd scripts && ./dev-status.sh` | Check all service statuses |
| `cd scripts && ./dev-logs.sh` | Interactive log viewer |
| `cd scripts && ./docker-up.sh` | Start Docker containers only |
| `cd scripts && ./docker-down.sh` | Stop Docker containers |
| `cd scripts && ./docker-logs.sh` | View Docker container logs |

### Startup Options

```bash
cd scripts

# Start everything (default)
./dev-start.sh

# Start without Docker (if already running)
./dev-start.sh --no-docker

# Start backend only
./dev-start.sh --backend-only

# Start frontend only
./dev-start.sh --frontend-only
```

---

## 🔌 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8000 | http://localhost:8000 |
| API Documentation | 8000 | http://localhost:8000/docs |
| PostgreSQL | 5433 | `localhost:5433` |
| Orthanc PACS HTTP | 8043 | http://localhost:8043 |
| Orthanc DICOM | 4243 | `localhost:4243` |

---

## 🗄️ Database

**Connection Details:**
- Host: `localhost`
- Port: `5433`
- Database: `ehrdb`
- User: `ehruser`
- Password: `ehrpassword`

**Connection String:**
```
postgresql://ehruser:ehrpassword@localhost:5433/ehrdb
```

**Access PostgreSQL CLI:**
```bash
docker exec -it ehr_postgres psql -U ehruser -d ehrdb
```

---

## 👤 Default Users

After running migrations, these test users are available:

| Username | Password | Role |
|----------|----------|------|
| admin | Admin123! | Admin |
| dr_sharma | Doctor123! | Doctor |
| nurse_priya | Nurse123! | Nurse |

---

## 📋 Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1A | Infrastructure Setup | ✅ Complete |
| 1B | Backend Core | ✅ Complete |
| 1C | Authentication Backend | ✅ Complete |
| 1D | Patient Backend | ✅ Complete |
| 1E | Frontend Core | ✅ Complete |
| 1F | Authentication UI | 🔄 In Progress |
| 1G | Patient UI | ⬜ Pending |
| 2 | Visit Management | ⬜ Pending |
| 3 | Clinical Documentation | ⬜ Pending |
| 4 | Imaging Orders | ⬜ Pending |
| 5 | DICOM Integration | ⬜ Pending |
| 6 | Discharge & Summaries | ⬜ Pending |

See [docs/phases/](docs/phases/) for detailed implementation guides.

---

## 🔧 Technology Stack

### Backend
- **FastAPI** - Modern async web framework
- **SQLAlchemy 2.0** - Async ORM
- **PostgreSQL 15** - Database
- **Alembic** - Database migrations
- **Argon2** - Password hashing
- **python-jose** - JWT tokens

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Ant Design** - Component library
- **React Router** - Navigation
- **React Query** - Server state
- **Axios** - HTTP client

### Infrastructure
- **Docker Compose** - Container orchestration
- **Orthanc** - PACS server

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check if PostgreSQL container is running
docker ps | grep ehr_postgres

# Restart containers
./docker-restart.sh
```

### Frontend Build Errors

```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules
npm install
```

### Backend Import Errors

```bash
# Ensure virtual environment is activated
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

---

## 📄 License

Private - Clinic Internal Use
