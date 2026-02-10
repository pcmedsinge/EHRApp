# Files Needed for Deployment on New Machine# Files Needed for Deployment on New Machine









































































































































































































































































































































































































































**Your application is fully portable! Just Docker + these files = running application on any machine! 🚀**---- **Subsequent:** 30 seconds - 2 minutes- **First time:** 10-15 minutes### Time Required:**Git Clone** - Gets everything automatically, easy to update### Best Method:| **Total** | **~5-10 MB** | - || `docker-deploy.sh` | Deployment | ~2 KB || `docker-compose.yml` | Services | ~5 KB || `config/` | Configuration | ~5 KB || `frontend/package.json` | Dependencies | ~2 KB || `frontend/Dockerfile` | Container config | ~1 KB || `frontend/src/` | Frontend code | ~2-3 MB || `backend/requirements.txt` | Dependencies | ~2 KB || `backend/Dockerfile` | Container config | ~1 KB || `backend/alembic/` | Migrations | ~100 KB || `backend/app/` | Backend code | ~1-2 MB ||------------|---------|------|| File/Folder | Purpose | Size |### Minimum Required Files:## 🎯 Summary---- **[Deployment Docs Index](docs/deployment/)** - All deployment documentation- **[Docker Deployment](docs/deployment/DOCKER_DEPLOYMENT.md)** - Technical details- **[Quick Reference](docs/deployment/QUICK_REFERENCE.md)** - Command cheat sheet- **[Ongoing Development](docs/deployment/ONGOING_DEVELOPMENT.md)** - Continue development- **[Setup Guide for New Machine](docs/deployment/SETUP_GUIDE_FOR_NEW_MACHINE.md)** - Complete beginner guide## 📚 Related Documentation---```./docker-deploy.shdocker-compose -f docker-compose.yml down -v```bash→ Try complete reset:### "Services won't start"→ Check logs: `docker-compose -f docker-compose.yml logs`### "Build failed"→ Something else using port. Stop other services or change port in docker-compose.yml### "Port 3000 already in use"→ Docker Desktop is not running. Start it and wait for ready status.### "Cannot connect to Docker daemon"→ Docker not installed. Install Docker Desktop first.### "docker: command not found"## 🆘 Troubleshooting---```□ Dashboard appears ✅□ Password: admin123□ Username: admin# Try logging in:□ Orthanc:     http://localhost:8042  (orthanc/orthanc)□ OHIF Viewer: http://localhost:3001  (viewer loads)□ Backend API: http://localhost:8000/docs  (API docs appear)□ Frontend:    http://localhost:3000  (login page appears)# Test access:□ ehr_ohif□ ehr_orthanc□ ehr_frontend_dev□ ehr_backend□ orthanc_postgres□ ehr_postgres# Should see 6-7 services "Up":docker-compose -f docker-compose.yml ps# Check all services are running```bashAfter deployment on new machine:## ✅ Verification Checklist---```./docker-deploy.shcd EHRApp# Restarttar -xzf ehrapp-portable-NEW.tar.gz# Extract new versionmv EHRApp EHRApp.backupcd ..# Backup current version (optional)docker-compose -f docker-compose.yml downcd EHRApp# Stop services```bash### Using Archive```docker exec -it ehr_backend alembic upgrade head# Apply any new migrationsdocker-compose -f docker-compose.yml up -d --build# Rebuild and restartgit pull origin main# Get latest codedocker-compose -f docker-compose.yml down# Stop servicescd EHRApp```bash### Using Git## 🔄 Updating Application on Existing Machine---```  👁️  OHIF:       http://localhost:3001  🏥 Orthanc:     http://localhost:8042  📊 Backend API: http://localhost:8000/docs  📊 Frontend:    http://localhost:3000Services are now running:✅ Deployment Complete!   Frontend: ✅   Backend: ✅   Orthanc: ✅   Postgres: ✅⏳ Waiting for services to be healthy...✔ Container ehr_ohif             Started✔ Container ehr_orthanc          Started✔ Container ehr_frontend_dev     Started✔ Container ehr_backend          Started✔ Container orthanc_postgres     Started✔ Container ehr_postgres         Started[+] Running 7/7🚀 Starting all services...[+] Building 45.2s (23/23) FINISHED🏗️  Building Docker images...```### Output You Should See```# Time: 5-15 minutes (depending on internet speed)# - Verifies health# - Runs database migrations# - Starts all services# - Builds frontend container# - Builds backend container# - Downloads base images (Python, Node.js, PostgreSQL, etc.) ~2-3 GB# What happens:./docker-deploy.sh# 3. Deploy# Check: Docker icon in system tray should be steady (not animated)# 2. Make sure Docker Desktop is runningcd /path/to/EHRApp# 1. Navigate to EHRApp folder```bash### First-Time Deployment## 🚀 After Copying Files---- `.git/` history: ~50-100 MB- `venv/` alone: ~150-300 MB- `node_modules/` alone: ~200-400 MB**Key Savings:**| **Manual Copy** | ~5-10 MB | ~500-1000 MB || **Tar Archive** | ~5-10 MB | ~500-1000 MB || **Git Clone** | ~5-10 MB | ~5-10 MB ||------|--------------------|--------------------|| What | With Excluded Files | Without Exclusions |## 📊 File Size Comparison---- **Option C:** Copied folders (manual)- **Option B:** Portable archive file (.tar.gz)- **Option A:** Git repository access### Source Files (Choose One Method)3. **10GB free disk space**2. **4GB RAM minimum** (8GB recommended)1. **Docker Desktop** - Download from: https://www.docker.com/products/docker-desktop### Prerequisites (All Machines)## 💾 What Each Machine Needs---```❌ .git/❌ frontend/dist/❌ frontend/node_modules/❌ backend/__pycache__/❌ backend/venv/```**Skip these folders:**```✅ README.md (optional)✅ docs/ (optional)✅ docker-deploy-prod.sh✅ docker-deploy.sh✅ docker-compose.yml✅ config/✅ frontend/index.html✅ frontend/vite.config.ts✅ frontend/tsconfig.json✅ frontend/package-lock.json✅ frontend/package.json✅ frontend/.dockerignore✅ frontend/nginx.conf✅ frontend/Dockerfile✅ frontend/public/✅ frontend/src/✅ backend/alembic.ini✅ backend/requirements.txt✅ backend/.dockerignore✅ backend/Dockerfile✅ backend/alembic/✅ backend/app/```**Copy these folders:****Only use if Git and tar are not available**### Method 3: Manual Copy (Not Recommended)---**Time:** 10-15 minutes first time```# Open browser: http://localhost:3000# 5. Access application./docker-deploy.sh# 4. Deploychmod +x docker-deploy.sh docker-deploy-prod.sh# 3. Make scripts executablecd EHRApptar -xzf ehrapp-portable-20260210.tar.gz# 2. Extract archive# 1. Install Docker Desktop (one-time)```bash**Steps on Target Machine:**```# Result: ehrapp-portable-20260210.tar.gz (about 5-10 MB)    -czf ehrapp-portable-$(date +%Y%m%d).tar.gz EHRApp/    --exclude='.vscode' \    --exclude='.git' \    --exclude='frontend/dist' \    --exclude='frontend/node_modules' \    --exclude='backend/.env' \    --exclude='backend/**/*.pyc' \    --exclude='backend/__pycache__' \tar --exclude='backend/venv' \# Create portable archive (excludes unnecessary files)cd /path/to/EHRApp/..```bash**Steps on Source Machine:**- ✅ Excludes junk files automatically- ✅ Single file to transfer- ✅ No Git needed**Advantages:**### Method 2: Create Portable Archive---**Time:** 10-15 minutes first time```# Open browser: http://localhost:3000# 4. Access application./docker-deploy.sh# 3. Deploycd EHRAppgit clone <your-repository-url># 2. Clone repository# Download: https://www.docker.com/products/docker-desktop# 1. Install Docker Desktop (one-time)```bash**Steps:**- ✅ Doesn't copy unnecessary files- ✅ Easy to update (`git pull`)- ✅ Gets exact versions- ✅ Easiest method**Advantages:**### Method 1: Git Clone (Best - Recommended)## 🎯 Three Methods to Deploy on New Machine---```❌ .git/                               # Git history (use git clone instead)❌ frontend/.vite/                     # Vite cache❌ frontend/dist/                      # Build output❌ frontend/node_modules/              # npm packages (huge!)❌ backend/logs/                       # Log files❌ backend/.env                        # Environment variables (Docker creates)❌ backend/**/*.pyc                    # Compiled Python files❌ backend/__pycache__/                # Python bytecode cache❌ backend/venv/                       # Python virtual environment```## ❌ NOT Needed (Don't Copy - Generated by Docker)---```└── EHRPrd.md                          # Project documentation├── .gitignore                         # Git ignore file├── README.md                          # Project documentation││   └── deployment/                    # Deployment guides├── docs/                              # Documentation (optional but helpful)│├── docker-deploy-prod.sh              # Production script├── docker-deploy.sh                   # Deployment script ⭐⭐⭐├── docker-compose.yml                 # Partial Docker (optional)├── docker-compose.yml            # Docker services ⭐⭐⭐││   └── ohif-config.js                # OHIF viewer config├── config/                            # Application configuration││   └── index.html                    # HTML template│   ├── .dockerignore                 # Docker ignore file│   ├── vite.config.ts                # Build tool config│   ├── tsconfig.json                 # TypeScript config│   ├── package-lock.json             # Locked versions│   ├── package.json                  # npm dependencies│   ├── nginx.conf                    # Web server config ⭐│   ├── Dockerfile                    # Frontend container config ⭐│   ├── public/                       # Static assets│   │   └── main.tsx                  # Application entry│   │   ├── types/                    # TypeScript types│   │   ├── services/                 # API services│   │   ├── components/               # React components│   ├── src/                          # TypeScript/React source├── frontend/                          # Frontend application││   └── alembic.ini                   # Migration config│   ├── .dockerignore                 # Docker ignore file│   ├── requirements.txt              # Python dependencies│   ├── Dockerfile                    # Backend container config ⭐│   │   └── versions/                 # Migration files│   ├── alembic/                      # Database migrations│   │   └── main.py                   # Application entry│   │   ├── core/                     # Configuration│   │   ├── schemas/                  # Pydantic schemas│   │   ├── models/                   # Database models│   │   ├── api/                      # API endpoints│   ├── app/                          # Python source code├── backend/                           # Backend applicationEHRApp/```### ✅ Required Files (Must Copy)## 📋 Detailed File List---✅ Automatically gets everything needed```./docker-deploy.shcd EHRAppgit clone <repository-url>```bash**Use Git (Recommended):**## 📦 Quick Answer
## 🎯 Quick Answer

**Using Git (Recommended):**
```bash
git clone <repository-url>
cd EHRApp
./docker-deploy.sh
```
✅ **That's it!** Git automatically gets all required files.

---

## 📦 What Files to Copy

### ✅ Required Files (Must Copy)

```
EHRApp/
├── backend/                      # All Python source code
│   ├── app/                      # Application code
│   ├── alembic/                  # Database migrations
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Backend container config
│   └── .dockerignore             # Docker ignore rules
│
├── frontend/                     # All React source code
│   ├── src/                      # Frontend application code
│   ├── public/                   # Static assets
│   ├── package.json              # npm dependencies
│   ├── package-lock.json         # npm lock file
│   ├── vite.config.ts            # Vite build config
│   ├── tsconfig.json             # TypeScript config
│   ├── Dockerfile                # Frontend container config
│   ├── nginx.conf                # Nginx web server config
│   └── .dockerignore             # Docker ignore rules
│
├── config/                       # Configuration files
│   └── ohif-config.js            # OHIF viewer configuration
│
├── docs/                         # Documentation (optional but helpful)
│   └── deployment/               # All deployment guides
│
├── docker-compose.yml       # Docker services configuration
├── docker-deploy.sh              # Deployment script (executable)
├── docker-deploy-prod.sh         # Production deployment script
├── alembic.ini                   # Alembic configuration
└── README.md                     # Project documentation
```

**Total size:** ~50-100 MB (without node_modules, venv, git history)

---

### ❌ DO NOT Copy (Auto-Generated)

These files/folders are automatically created by Docker:

```
❌ backend/venv/                  # Python virtual environment
❌ backend/__pycache__/           # Python bytecode cache
❌ backend/**/*.pyc               # Python compiled files
❌ backend/.env                   # Environment variables (created by Docker)
❌ backend/logs/                  # Log files

❌ frontend/node_modules/         # npm packages (1GB+)
❌ frontend/dist/                 # Build output
❌ frontend/.vite/                # Vite cache

❌ .git/                          # Git history (300MB+, use git clone instead)
```

---

## 📋 Three Methods to Copy Files

### Method 1: Using Git (Best)

**On new machine:**
```bash
# Clone repository
git clone https://github.com/your-org/EHRApp.git
cd EHRApp

# Deploy
./docker-deploy.sh
```

**Advantages:**
- ✅ Fastest and easiest
- ✅ Gets exact right files
- ✅ Easy to update later with `git pull`
- ✅ Preserves file permissions
- ✅ Version controlled

---

### Method 2: Create Portable Archive

**On source machine:**
```bash
cd /path/to/EHRApp

# Create archive excluding unnecessary files
tar --exclude='backend/venv' \
    --exclude='backend/__pycache__' \
    --exclude='backend/**/*.pyc' \
    --exclude='backend/.env' \
    --exclude='frontend/node_modules' \
    --exclude='frontend/dist' \
    --exclude='frontend/.vite' \
    --exclude='.git' \
    -czf ehrapp-portable.tar.gz .

# Archive ready: ehrapp-portable.tar.gz (~50-100 MB)
```

**Transfer to new machine** (USB drive, network share, email, etc.)

**On target machine:**
```bash
# Extract archive
tar -xzf ehrapp-portable.tar.gz
cd EHRApp

# Make scripts executable
chmod +x docker-deploy.sh docker-deploy-prod.sh

# Deploy
./docker-deploy.sh
```

**Advantages:**
- ✅ Works without internet access
- ✅ Single file to transfer
- ✅ Small size (~50-100 MB)

---

### Method 3: Manual Copy via Network/USB

**Copy these folders/files:**

```bash
# Using rsync (Linux/Mac)
rsync -av --exclude='venv' \
          --exclude='__pycache__' \
          --exclude='node_modules' \
          --exclude='dist' \
          --exclude='.git' \
          /source/EHRApp/ /destination/EHRApp/

# Or using SCP
scp -r EHRApp/ user@newmachine:/path/to/destination/

# Or using Windows file explorer
# Just drag and drop the EHRApp folder
# (Windows will automatically skip hidden folders)
```

**On new machine:**
```bash
cd EHRApp
chmod +x docker-deploy.sh docker-deploy-prod.sh
./docker-deploy.sh
```

---

## 🔑 Important Files Explained

### Must Have:
| File | Purpose | Why Needed |
|------|---------|------------|
| `docker-compose.yml` | Defines all services | Docker reads this to create containers |
| `docker-deploy.sh` | Deployment script | Automates setup process |
| `backend/Dockerfile` | Backend container config | Tells Docker how to build backend |
| `frontend/Dockerfile` | Frontend container config | Tells Docker how to build frontend |
| `backend/requirements.txt` | Python dependencies | Docker installs these packages |
| `frontend/package.json` | Node.js dependencies | Docker installs these packages |
| `backend/alembic/` | Database migrations | Creates database schema |
| `config/ohif-config.js` | OHIF config | Configures medical image viewer |

### Optional but Recommended:
| File/Folder | Purpose |
|-------------|---------|
| `docs/deployment/` | All deployment guides and documentation |
| `README.md` | Project overview |
| `alembic.ini` | Alembic migration configuration |
| `.dockerignore` | Optimizes Docker builds |

---

## 🚀 Quick Deployment Checklist

On the new machine:

### ☑️ Pre-Requirements
- [ ] Docker Desktop installed
- [ ] Docker Desktop is running
- [ ] At least 4GB RAM available
- [ ] At least 10GB disk space free

### ☑️ File Transfer
- [ ] All required files copied (see list above)
- [ ] Deployment scripts are executable (`chmod +x *.sh`)
- [ ] In correct directory (`cd EHRApp`)

### ☑️ Deployment
- [ ] Run `./docker-deploy.sh`
- [ ] Wait 5-10 minutes (first time)
- [ ] Check services: `docker-compose -f docker-compose.yml ps`
- [ ] All services show "Up" status

### ☑️ Verification
- [ ] Frontend accessible: http://localhost:3000
- [ ] Backend API accessible: http://localhost:8000/docs
- [ ] OHIF Viewer accessible: http://localhost:3001
- [ ] Can login with admin/admin123
- [ ] Can create test patient

---

## 📊 File Size Reference

```
Component                   Size
─────────────────────────────────────
backend/app/               ~5 MB     ✅ Copy
backend/venv/              ~500 MB   ❌ Don't copy
frontend/src/              ~10 MB    ✅ Copy
frontend/node_modules/     ~1 GB     ❌ Don't copy
config/                    ~50 KB    ✅ Copy
docker configs             ~10 KB    ✅ Copy
docs/                      ~100 KB   ✅ Copy (optional)
.git/                      ~300 MB   ❌ Use git clone instead
─────────────────────────────────────
Required files only:       ~50-100 MB
With Git history:          ~350 MB
With generated files:      ~2-3 GB
```

---

## 🌐 Portability Checklist

What works on the new machine:

- ✅ **Same on Windows, Mac, Linux** - Docker ensures compatibility
- ✅ **No Python installation needed** - Docker provides Python 3.11
- ✅ **No Node.js installation needed** - Docker provides Node.js 18
- ✅ **Database auto-created** - PostgreSQL runs in container
- ✅ **Migrations run automatically** - On container startup
- ✅ **Same versions everywhere** - Docker locks versions
- ✅ **Same configuration** - All in docker-compose file

What may differ:
- ⚠️ **Port availability** - Check if ports 3000, 8000, 8042 are free
- ⚠️ **Docker resources** - Allocate at least 4GB RAM in Docker Desktop
- ⚠️ **Disk space** - Ensure 10GB free for Docker images

---

## 🎯 Summary

### Simplest Method:
```bash
# On new machine with Docker and Git
git clone <repo-url>
cd EHRApp
./docker-deploy.sh
```

### Without Git:
```bash
# On source machine
tar --exclude='venv' --exclude='node_modules' --exclude='.git' \
    -czf ehrapp.tar.gz EHRApp/

# Transfer ehrapp.tar.gz to new machine

# On new machine
tar -xzf ehrapp.tar.gz
cd EHRApp
./docker-deploy.sh
```

### Files You Need:
- ✅ Source code (backend/, frontend/)
- ✅ Docker configs (docker-compose.yml, Dockerfiles)
- ✅ Configuration (config/, alembic.ini)
- ✅ Deployment scripts (docker-deploy.sh)
- ❌ NO venv, node_modules, __pycache__, .git

**That's it! With Docker, the application is truly portable! 🚀**

---

## 📚 Related Documentation

- [Complete Setup Guide](SETUP_GUIDE_FOR_NEW_MACHINE.md) - Step-by-step for beginners
- [Quick Reference](QUICK_REFERENCE.md) - Common commands
- [Deployment Docs Index](README.md) - All deployment documentation

---

**For detailed step-by-step instructions, see [SETUP_GUIDE_FOR_NEW_MACHINE.md](SETUP_GUIDE_FOR_NEW_MACHINE.md)**
