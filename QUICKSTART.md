# EHR Application - Quick Start Guide

## ⚠️ Important Notes

### Safe to Re-run
- **`cd scripts && ./setup.sh`** - Checks for running services and warns you before proceeding
- **`cd scripts && ./start.sh`** - Detects running services and skips them (safe to run multiple times)
- **`cd scripts && ./stop.sh`** - Safely stops all services

### Best Practice
Always stop services before running setup:
```bash
cd scripts
./stop.sh    # Stop everything first
./setup.sh   # Then run setup
./start.sh   # Then start services
```

## 🚀 Starting the Application

### First Time Setup
```bash
./setup.sh
```

**What it checks:**
- ✅ Detects running services and warns you
- ✅ Skips already-installed components
- ✅ Safe to re-run (won't break existing setup)
- ⚠️ Will prompt for confirmation if services are running

### Starting All Services
```bash
./start.sh
```

This will:
- ✅ Start Docker containers (PostgreSQL + Orthanc)
- ✅ Run database migrations
- ✅ Start Backend API (port 8000)
- ✅ Start Frontend (port 3000)

### Starting with Fresh Data
```bash
cd scripts
./start.sh --reset
```

This will reset and re-seed the database with default users and sample patients.

### Stopping All Services
```bash
./stop.sh
```

To keep database running:
```bash
./stop.sh --keep-db
```

### Viewing Logs
```bash
# View all logs
./logs.sh

# View only backend logs
./logs.sh backend

# View only frontend logs
./logs.sh frontend
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React application |
| **Backend API** | http://localhost:8000 | FastAPI server |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **Database** | localhost:5433 | PostgreSQL (ehr_db) |
| **Orthanc** | http://localhost:8043 | PACS server |

## 🔐 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Doctor** | `dr_sharma` | `doctor123` |
| **Nurse** | `nurse_priya` | `nurse123` |
| **Receptionist** | `reception` | `reception123` |

## 🛠️ Manual Commands

### Backend Only
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Only
```bash
cd frontend
npm run dev
```

### Database Operations
```bash
# Seed/Reset Database
cd backend
source venv/bin/activate
python seed_data.py          # Update existing users
python seed_data.py --reset  # Reset and re-seed

# Run Migrations
cd backend
source venv/bin/activate
alembic upgrade head
```

### Docker Containers
```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose stop

# View container status
docker-compose ps

# View container logs
docker-compose logs -f postgres
docker-compose logs -f orthanc
```

## 📝 Development Workflow

1. **Start services**
   ```bash
   ./start.sh
   ```

2. **Make changes**
   - Backend: Files auto-reload via uvicorn --reload
   - Frontend: Files auto-reload via Vite HMR

3. **View logs**
   ```bash
   ./logs.sh
   ```

4. **Stop services**
   ```bash
   ./stop.sh
   ```

## ⚠️ Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000 (backend)
kill $(lsof -t -i:8000)

# Kill process on port 3000 (frontend)
kill $(lsof -t -i:3000)
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check PostgreSQL logs
docker-compose logs postgres
```

### Password Not Working
```bash
# Reset passwords to defaults
cd backend
source venv/bin/activate
python seed_data.py
```

The seed script will update all user passwords to their default values.

### Frontend White Screen
```bash
# Check for errors
./logs.sh frontend

# Restart frontend
kill $(lsof -t -i:3000)
cd frontend && npm run dev
```

## 📚 Project Structure

```
EHRApp/
├── scripts/              # Helper scripts
│   ├── start.sh          # Start all services
│   ├── stop.sh           # Stop all services
│   └── logs.sh           # View logs
├── setup.sh              # First-time setup
├── docker-compose.yml    # Docker services
├── backend/
│   ├── app/              # FastAPI application
│   ├── alembic/          # Database migrations
│   ├── seed_data.py      # Database seeding
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/              # React application
│   └── package.json      # Node dependencies
└── docs/                 # Documentation
```

## 🎯 Common Tasks

### Add New User
```bash
cd backend
source venv/bin/activate
python -c "
from app.core.security import get_password_hash
print(get_password_hash('your_password'))
"
# Then run SQL to insert user with the hash
```

### Reset Admin Password
```bash
cd backend
source venv/bin/activate
python seed_data.py  # Updates admin password to admin123
```

### Create Database Backup
```bash
docker exec ehr_postgres pg_dump -U ehr_user ehr_db > backup_$(date +%Y%m%d).sql
```

### Restore Database Backup
```bash
docker exec -i ehr_postgres psql -U ehr_user ehr_db < backup_20260203.sql
```
