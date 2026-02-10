# Phase 1A: Infrastructure Setup

**Sub-Phase:** 1A  
**Estimated Time:** 2-3 hours  
**Prerequisites:** None

---

## 1. Objective

Set up the foundational project structure, virtual environment, and Docker infrastructure for PostgreSQL and Orthanc.

---

## 2. Deliverables

- [ ] Project folder structure created
- [ ] Python virtual environment configured
- [ ] Docker Compose file with PostgreSQL and Orthanc
- [ ] Environment configuration files (.env)
- [ ] .gitignore file
- [ ] README.md with setup instructions

---

## 3. Project Structure

```
EHRApp/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api/
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   └── __init__.py
│   │   ├── models/
│   │   │   └── __init__.py
│   │   └── schemas/
│   │       └── __init__.py
│   ├── alembic/
│   ├── requirements.txt
│   ├── .env.example
│   └── .env (gitignored)
│
├── frontend/
│   └── (will be created in 1E)
│
├── docker/
│   └── docker-compose.yml
│
├── docs/
│   └── (already exists)
│
├── .gitignore
└── README.md
```

---

## 4. Step-by-Step Implementation

### Step 1: Create Folder Structure

```bash
cd /home/linuxdev1/PracticeApps/EHRApp

# Backend folders
mkdir -p backend/app/{api,core,models,schemas}
mkdir -p backend/alembic

# Docker folder
mkdir -p docker

# Create __init__.py files
touch backend/app/__init__.py
touch backend/app/api/__init__.py
touch backend/app/core/__init__.py
touch backend/app/models/__init__.py
touch backend/app/schemas/__init__.py
```

### Step 2: Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### Step 3: Create requirements.txt

File: `backend/requirements.txt`

```txt
# FastAPI and server
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-multipart>=0.0.6

# Database
sqlalchemy>=2.0.25
asyncpg>=0.29.0
alembic>=1.13.0
psycopg2-binary>=2.9.9

# Validation and settings
pydantic>=2.5.0
pydantic-settings>=2.1.0

# Authentication
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4

# HTTP client for Orthanc
httpx>=0.26.0

# DICOM (for Phase 5, install now)
pydicom>=2.4.4

# Utilities
python-dateutil>=2.8.2
```

### Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 5: Create Docker Compose File

File: `docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15.10-alpine
    container_name: ehr_postgres
    environment:
      POSTGRES_DB: ehr_db
      POSTGRES_USER: ehr_user
      POSTGRES_PASSWORD: ehr_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ehr_user -d ehr_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  orthanc:
    image: orthancteam/orthanc:25.12.3
    container_name: ehr_orthanc
    ports:
      - "8042:8042"  # REST API & Web UI
      - "4242:4242"  # DICOM protocol
    environment:
      ORTHANC__NAME: "EHR_PACS"
      ORTHANC__DICOM_WEB__ENABLE: "true"
      ORTHANC__DICOM_WEB__ROOT: "/dicom-web/"
      ORTHANC__DICOM_WEB__ENABLE_WADO: "true"
      ORTHANC__DICOM_WEB__WADO_ROOT: "/wado"
      ORTHANC__REGISTERED_USERS: |
        {
          "ehr": "ehr_password"
        }
    volumes:
      - orthanc_data:/var/lib/orthanc/db
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8042/system || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  orthanc_data:
```

### Step 6: Create Environment Files

File: `backend/.env.example`

```env
# Database
DATABASE_URL=postgresql+asyncpg://ehr_user:ehr_password@localhost:5432/ehr_db

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Orthanc PACS
ORTHANC_URL=http://localhost:8042
ORTHANC_USERNAME=ehr
ORTHANC_PASSWORD=ehr_password

# Application
APP_NAME=EHR System
APP_VERSION=1.0.0
DEBUG=true
```

File: `backend/.env`

```bash
# Copy from example
cp backend/.env.example backend/.env

# Generate secure secret key
SECRET_KEY=$(openssl rand -hex 32)
echo "SECRET_KEY=$SECRET_KEY" >> backend/.env
```

### Step 7: Create .gitignore

File: `.gitignore`

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
.venv

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Database
*.db
*.sqlite

# Alembic
alembic/versions/*.pyc

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# Node (for frontend later)
node_modules/
dist/
build/
*.tgz

# Docker
docker-compose.override.yml
```

### Step 8: Create README

File: `README.md`

```markdown
# EHR Application

Modern Electronic Health Record system with OPD workflow support and DICOM integration.

## Tech Stack

- **Backend:** Python 3.12 + FastAPI + SQLAlchemy 2.0
- **Frontend:** React 18 + TypeScript + Ant Design
- **Database:** PostgreSQL 15
- **PACS:** Orthanc
- **Containerization:** Docker + Docker Compose

## Prerequisites

- Python 3.12+
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repo-url>
cd EHRApp
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and set SECRET_KEY
```

### 3. Start Docker Services

```bash
cd docker
docker-compose up -d

# Verify services
docker ps
```

### 4. Run Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Backend will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

### 5. Frontend Setup (Phase 1E)

```bash
cd frontend
npm install
npm run dev
```

## Database Access

- **PostgreSQL:** localhost:5432
- **Database:** ehr_db
- **User:** ehr_user
- **Password:** ehr_password

## Orthanc PACS

- **Web UI:** http://localhost:8042
- **Username:** ehr
- **Password:** ehr_password
- **DICOM Port:** 4242

## Development

### Run Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Run Frontend

```bash
cd frontend
npm run dev
```

### Database Migrations

```bash
cd backend
source venv/bin/activate

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Project Structure

See `docs/phases/phase1/Phase1A_Infrastructure.md` for details.

## Documentation

- Main PRD: `docs/EHR_PRD.md`
- Phase Documents: `docs/phases/`

## License

[Your License]
```

---

## 5. Verification Steps

```bash
# 1. Check folder structure
ls -R EHRApp/backend/app

# 2. Verify virtual environment
source backend/venv/bin/activate
python --version  # Should show 3.12.x
pip list  # Should show installed packages

# 3. Start Docker services
cd docker
docker-compose up -d

# 4. Verify containers
docker ps
# Should show: ehr_postgres and ehr_orthanc running

# 5. Test PostgreSQL connection
docker exec -it ehr_postgres psql -U ehr_user -d ehr_db -c "SELECT version();"

# 6. Test Orthanc
curl http://localhost:8042/system

# 7. Access Orthanc Web UI
# Open browser: http://localhost:8042
# Login: ehr / ehr_password
```

---

## 6. Expected Output

### Docker PS Output
```
CONTAINER ID   IMAGE                     STATUS                   PORTS
abc123def456   postgres:15               Up (healthy)             0.0.0.0:5432->5432/tcp
def456abc789   orthancteam/orthanc       Up (healthy)             0.0.0.0:8042->8042/tcp, 0.0.0.0:4242->4242/tcp
```

### Orthanc System Response
```json
{
  "Name": "EHR_PACS",
  "Version": "1.12.x",
  "DicomPort": 4242,
  "HttpPort": 8042
}
```

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5432 already in use | Stop local PostgreSQL: `sudo systemctl stop postgresql` |
| Port 8042 already in use | Change port in docker-compose.yml |
| Permission denied on Docker | Add user to docker group: `sudo usermod -aG docker $USER` |
| Virtual env not activating | Use full path: `source /full/path/to/venv/bin/activate` |

---

## 8. Next Sub-Phase

Once verified, proceed to **Phase 1B: Backend Core**

---

## 9. Checklist

- [ ] Folder structure created
- [ ] Virtual environment activated
- [ ] Dependencies installed
- [ ] Docker Compose created
- [ ] .env files configured
- [ ] .gitignore created
- [ ] README.md created
- [ ] Docker containers running
- [ ] PostgreSQL accessible
- [ ] Orthanc web UI accessible

---

*End of Phase 1A*
