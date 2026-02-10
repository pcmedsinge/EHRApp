# Deployment Documentation

This folder contains all documentation related to deploying and running the EHR Application using Docker.

---

## 📚 Documentation Overview

### 🚀 Getting Started

**1. [SETUP_GUIDE_FOR_NEW_MACHINE.md](SETUP_GUIDE_FOR_NEW_MACHINE.md)** ⭐ **START HERE**
- Complete step-by-step setup guide for beginners
- Installing Docker Desktop (Windows/Mac/Linux)
- Getting and running the application
- Troubleshooting common issues
- **Audience:** Non-technical users, first-time setup

**2. [ONGOING_DEVELOPMENT.md](ONGOING_DEVELOPMENT.md)**
- Continuing development with Docker
- Adding new features and phases
- Database migrations, testing, debugging
- **Audience:** Developers building new features

**3. [QUICK_REFERENCE.md](QUICK_REFERENCE.md)**
- Common commands cheat sheet
- Quick troubleshooting
- Daily usage reference
- **Audience:** Everyone (daily reference)

---

### 📖 Detailed Documentation

**4. [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)**
- Technical deployment details
- Production setup
- Backup and restore
- Performance optimization
- **Audience:** DevOps, System administrators

**5. [DOCKER_ARCHITECTURE.txt](DOCKER_ARCHITECTURE.txt)**
- Visual system architecture
- Service connections
- Data flow diagrams
- **Audience:** Visual learners, architects

**6. [DOCS_INDEX.md](DOCS_INDEX.md)**
- Navigation guide for all documentation
- Quick answers to common questions
- Learning paths
- **Audience:** Anyone looking for specific information

---

## 🎯 Quick Navigation

### I want to...

**Set up the app on a new machine**
→ Read [SETUP_GUIDE_FOR_NEW_MACHINE.md](SETUP_GUIDE_FOR_NEW_MACHINE.md)

**Continue development and add new phases**
→ Read [ONGOING_DEVELOPMENT.md](ONGOING_DEVELOPMENT.md)

**Find a specific command**
→ Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**Deploy to production**
→ Follow [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

**Understand the architecture**
→ View [DOCKER_ARCHITECTURE.txt](DOCKER_ARCHITECTURE.txt)

**Navigate all docs**
→ Start with [DOCS_INDEX.md](DOCS_INDEX.md)

---

## 📋 Documentation Tree

```
docs/deployment/
├── README.md                          # This file - overview
├── DOCS_INDEX.md                      # Navigation guide
│
├── SETUP_GUIDE_FOR_NEW_MACHINE.md     # ⭐ Beginner setup (15KB)
├── ONGOING_DEVELOPMENT.md             # Development workflow (13KB)
├── QUICK_REFERENCE.md                 # Command reference (7KB)
│
├── DOCKER_DEPLOYMENT.md               # Technical docs (6KB)
└── DOCKER_ARCHITECTURE.txt            # Architecture diagrams (11KB)
```

---

## 🚀 Essential Files for Deployment

To deploy on a new machine, you need:

### Required Files (Must Copy)
```
EHRApp/
├── backend/                    # Backend source code
├── frontend/                   # Frontend source code
├── config/                     # Configuration files
├── docker-compose.yml     # Docker services configuration
├── docker-deploy.sh            # Deployment script
└── docs/deployment/            # This documentation folder
```

### Generated/Optional (Don't Need to Copy)
```
❌ backend/venv/               # Virtual environment (Docker creates it)
❌ backend/__pycache__/        # Python cache (regenerated)
❌ frontend/node_modules/      # npm packages (Docker installs)
❌ frontend/dist/              # Build output (Docker generates)
❌ backend/.env                # Environment (Docker creates)
```

---

## 💾 What to Copy to New Machine

### Method 1: Using Git (Recommended)
```bash
# On new machine
git clone <repository-url>
cd EHRApp
./docker-deploy.sh
```
✅ Automatically gets all required files
✅ Easy to update with `git pull`

### Method 2: Manual Copy
```bash
# Copy these folders/files:
✅ backend/           (except venv, __pycache__, .env)
✅ frontend/          (except node_modules, dist)
✅ config/
✅ docker-compose.yml
✅ docker-deploy.sh
✅ docs/              (for reference)
✅ alembic.ini        (if exists)

# Then on new machine:
cd EHRApp
./docker-deploy.sh
```

### Method 3: Create Archive
```bash
# On source machine
tar --exclude='backend/venv' \
    --exclude='backend/__pycache__' \
    --exclude='frontend/node_modules' \
    --exclude='frontend/dist' \
    --exclude='.git' \
    -czf ehrapp-portable.tar.gz EHRApp/

# On target machine
tar -xzf ehrapp-portable.tar.gz
cd EHRApp
./docker-deploy.sh
```

---

## 📖 Reading Order

### For First-Time Users:
1. This README (you are here)
2. [SETUP_GUIDE_FOR_NEW_MACHINE.md](SETUP_GUIDE_FOR_NEW_MACHINE.md) - Complete setup
3. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Bookmark for daily use

### For Developers:
1. [ONGOING_DEVELOPMENT.md](ONGOING_DEVELOPMENT.md) - Development workflow
2. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command reference
3. [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Advanced topics

### For DevOps:
1. [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Full technical details
2. [DOCKER_ARCHITECTURE.txt](DOCKER_ARCHITECTURE.txt) - System design
3. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Operations commands

---

## 🔗 Related Documentation

- **[Main README](../../README.md)** - Project overview
- **[Phase Documentation](../phases/)** - Implementation phases
- **[API Documentation](http://localhost:8000/docs)** - Backend API (when running)

---

## ✅ Quick Verification

After deployment, verify everything works:

```bash
# Check all services
docker-compose -f docker-compose.yml ps

# Should see all services "Up":
✅ ehr_backend
✅ ehr_frontend_dev
✅ ehr_postgres
✅ ehr_orthanc
✅ ehr_ohif
✅ orthanc_postgres

# Access applications:
✅ Frontend:    http://localhost:3000
✅ Backend API: http://localhost:8000/docs
✅ OHIF Viewer: http://localhost:3001
✅ Orthanc:     http://localhost:8042
```

---

## 📞 Support

If you encounter issues:

1. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) troubleshooting section
2. Review logs: `docker-compose -f docker-compose.yml logs -f`
3. Try restart: `docker-compose -f docker-compose.yml restart`
4. Complete reset: `docker-compose -f docker-compose.yml down -v && ./docker-deploy.sh`

---

**All documentation is kept up-to-date with the latest deployment practices.**
