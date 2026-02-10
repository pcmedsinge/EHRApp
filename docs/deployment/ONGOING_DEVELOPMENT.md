# EHR Application - Ongoing Development with Docker

## 📖 Overview

**Good news!** The Docker setup is designed to support ongoing development. You can continue building new phases while using Docker containers.

---

## 🎯 Key Point: Development Continues Normally

**Nothing changes in your development workflow!**

- ✅ You still edit code in VS Code or any editor
- ✅ You still create new features
- ✅ You still run migrations
- ✅ You still test your changes
- ✅ **Docker automatically picks up your changes!**

---

## 🔄 How It Works

### Local Development Setup

The Docker configuration includes **live code reloading**:

**Backend (FastAPI):**
```yaml
# In docker-compose.yml
backend:
  volumes:
    - ./backend:/app  # Maps your local code to container
  command: uvicorn app.main:app --host 0.0.0.0 --reload
```

**What this means:**
- When you edit a `.py` file in `backend/` folder
- The container automatically detects the change
- Backend restarts with your new code
- **No need to rebuild Docker image!**

**Frontend (React):**
```yaml
frontend-dev:
  volumes:
    - ./frontend:/app  # Maps your local code to container
  command: npm run dev
```

**What this means:**
- When you edit a `.tsx` or `.ts` file in `frontend/` folder
- Vite detects the change instantly
- Browser refreshes automatically
- **Hot reload just like normal development!**

---

## 💻 Development Workflow

### Step 1: Start Docker containers

```bash
# Start all services
docker-compose -f docker-compose.yml up -d

# View logs (optional)
docker-compose -f docker-compose.yml logs -f
```

### Step 2: Edit code normally

**Backend example:**
```bash
# Open your editor
code backend/app/api/v1/patients/router.py

# Make changes
# Save file
# Backend automatically restarts with your changes!
```

**Frontend example:**
```bash
# Open your editor
code frontend/src/components/patients/PatientList.tsx

# Make changes
# Save file
# Browser automatically refreshes!
```

### Step 3: Test your changes

- Frontend: Refresh http://localhost:3000 (or it auto-refreshes)
- Backend: Check http://localhost:8000/docs

---

## 🗄️ Working with Database Changes

### Creating new migrations

**Option 1: Using container (Recommended)**
```bash
# Connect to backend container
docker exec -it ehr_backend bash

# Create migration
alembic revision --autogenerate -m "Add new patient fields"

# Exit container
exit
```

**Option 2: From host machine**
```bash
# Create migration directly
docker exec -it ehr_backend alembic revision --autogenerate -m "Add new patient fields"
```

**The migration file is created in your local folder** (`backend/alembic/versions/`)

### Running migrations

```bash
# Apply migration
docker exec -it ehr_backend alembic upgrade head

# Or restart backend (migrations run automatically on startup)
docker-compose -f docker-compose.yml restart backend
```

### Rolling back migrations

```bash
# Rollback one version
docker exec -it ehr_backend alembic downgrade -1

# Rollback to specific version
docker exec -it ehr_backend alembic downgrade abc123def456
```

---

## 📦 Adding New Dependencies

### Backend - Adding Python packages

**Step 1:** Add package to requirements
```bash
# Edit backend/requirements.txt
code backend/requirements.txt

# Add your new package
pandas==2.0.0
```

**Step 2:** Rebuild backend container
```bash
# Rebuild and restart backend
docker-compose -f docker-compose.yml up -d --build backend
```

**Alternative: Install without rebuild**
```bash
# Install inside running container
docker exec -it ehr_backend pip install pandas==2.0.0

# Note: This is temporary, add to requirements.txt for permanent
```

---

### Frontend - Adding npm packages

**Step 1:** Install package
```bash
# Option 1: Install in running container
docker exec -it ehr_frontend_dev npm install axios

# Option 2: Install locally and rebuild
cd frontend
npm install axios
docker-compose -f docker-compose.yml restart frontend-dev
```

**The package.json is updated automatically in your local folder**

---

## 🆕 Adding New Phases

### Example: Adding Phase 6 - Billing Module

**Step 1: Create backend files**
```bash
# Create new files locally (not in container)
mkdir backend/app/api/v1/billing
touch backend/app/api/v1/billing/__init__.py
touch backend/app/api/v1/billing/router.py
touch backend/app/api/v1/billing/crud.py
```

**Step 2: Create database models**
```python
# Edit backend/app/models/billing.py
# Add your Billing model

# Create migration
docker exec -it ehr_backend alembic revision --autogenerate -m "Add billing tables"

# Run migration
docker exec -it ehr_backend alembic upgrade head
```

**Step 3: Create frontend components**
```bash
# Create new components locally
mkdir frontend/src/components/billing
touch frontend/src/components/billing/BillingList.tsx
touch frontend/src/components/billing/InvoiceModal.tsx
```

**Step 4: Test your changes**
- Backend changes: http://localhost:8000/docs
- Frontend changes: http://localhost:3000

**No Docker changes needed!** Your new phase works automatically.

---

## 🧪 Running Tests

### Backend tests

```bash
# Run all tests
docker exec -it ehr_backend pytest

# Run specific test file
docker exec -it ehr_backend pytest tests/test_patients.py

# Run with coverage
docker exec -it ehr_backend pytest --cov=app tests/
```

### Frontend tests

```bash
# Run tests
docker exec -it ehr_frontend_dev npm run test

# Run tests in watch mode
docker exec -it ehr_frontend_dev npm run test:watch
```

---

## 🐛 Debugging

### Backend debugging

**View logs:**
```bash
# Real-time logs
docker-compose -f docker-compose.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.yml logs --tail=100 backend
```

**Interactive debugging:**
```bash
# Connect to backend container
docker exec -it ehr_backend bash

# Run Python commands
python -c "from app.db.session import engine; print(engine)"

# Check environment variables
env | grep DATABASE

# Exit
exit
```

### Frontend debugging

**View logs:**
```bash
# Real-time logs
docker-compose -f docker-compose.yml logs -f frontend-dev
```

**Access container:**
```bash
# Connect to frontend container
docker exec -it ehr_frontend_dev sh

# Check installed packages
npm list

# Exit
exit
```

### Database access

```bash
# Connect to PostgreSQL
docker exec -it ehr_postgres psql -U ehr_user -d ehr_db

# Run SQL queries
SELECT * FROM patients LIMIT 5;

# View tables
\dt

# Exit
\q
```

---

## 🔧 Common Development Tasks

### Task 1: Reset database completely

```bash
# Stop containers
docker-compose -f docker-compose.yml down -v

# Start fresh (migrations run automatically)
docker-compose -f docker-compose.yml up -d

# Seed data
docker exec -it ehr_backend python -m app.db.seed_data
```

### Task 2: Seed new reference data

```bash
# Run seed script
docker exec -it ehr_backend python -m app.db.seed_orders_data

# Or create custom seed script
docker exec -it ehr_backend python -m app.db.seed_phase6_data
```

### Task 3: View all endpoints

```bash
# List all routes
docker exec -it ehr_backend python -c "from app.main import app; print([route.path for route in app.routes])"
```

### Task 4: Check database schema

```bash
# Show current migration version
docker exec -it ehr_backend alembic current

# Show migration history
docker exec -it ehr_backend alembic history
```

### Task 5: Clear frontend cache

```bash
# Rebuild frontend container
docker-compose -f docker-compose.yml up -d --build frontend-dev

# Or clear npm cache
docker exec -it ehr_frontend_dev npm cache clean --force
```

---

## 🚀 Completing New Phases

### Workflow for each phase:

**Phase starts:**
1. ✅ Start Docker containers (`docker-compose up -d`)
2. ✅ Create new models/schemas/routes
3. ✅ Create Alembic migration
4. ✅ Run migration
5. ✅ Create frontend components
6. ✅ Test in browser (auto-reloads)
7. ✅ Commit changes to Git
8. ✅ **No Docker configuration changes needed!**

**Phase complete:**
- ✅ All code changes are in local files
- ✅ Migrations are version controlled
- ✅ Anyone can pull and run: `./docker-deploy.sh`
- ✅ Same environment everywhere

---

## 📝 When to Update Docker Configuration

You **rarely** need to change Docker files. Only change when:

### Update backend/Dockerfile IF:
- Changing Python version (e.g., 3.11 → 3.12)
- Adding system-level packages (e.g., `apt-get install libxml2-dev`)
- Changing startup logic

**Normal Python packages** don't need Dockerfile changes, just update requirements.txt

### Update frontend/Dockerfile IF:
- Changing Node.js version (e.g., 18 → 20)
- Changing build process
- Adding system packages

**Normal npm packages** don't need Dockerfile changes, just update package.json

### Update docker-compose.yml IF:
- Adding new service (e.g., Redis cache, Elasticsearch)
- Changing ports
- Adding environment variables
- Changing volume mounts

**Normal development** doesn't need docker-compose changes

---

## 🌐 Team Development

### Multiple developers working together:

**Developer 1:**
```bash
# Makes changes to backend
git add backend/
git commit -m "Add billing API"
git push
```

**Developer 2:**
```bash
# Gets latest changes
git pull

# Restart containers to pick up changes
docker-compose -f docker-compose.yml restart

# If new migrations exist
docker exec -it ehr_backend alembic upgrade head
```

**Everyone has identical environment!**

---

## 📊 Performance Considerations

### Development mode (current setup):
- ✅ Fast code reloading
- ✅ Hot module replacement
- ✅ Source maps enabled
- ✅ Debug logging
- ⚠️ Not optimized for performance

### Production mode (when deploying):
- ✅ Optimized builds
- ✅ Minified code
- ✅ No debug logging
- ✅ Cached static assets

**Use different docker-compose files for different environments**

---

## 🎯 Best Practices for Ongoing Development

### DO:
- ✅ Keep Docker containers running during development
- ✅ Edit code in your local folders (not inside containers)
- ✅ Commit docker-compose and Dockerfile changes to Git
- ✅ Document new environment variables
- ✅ Run migrations through Docker
- ✅ Test in Docker before deploying

### DON'T:
- ❌ Manually install packages inside containers (add to requirements/package.json)
- ❌ Edit code inside running containers
- ❌ Store sensitive data in Dockerfiles
- ❌ Commit large files to Docker images
- ❌ Skip testing in Docker environment

---

## 🔄 Updating Deployment Scripts

### If you add new services (e.g., Redis):

**Step 1:** Add to docker-compose.yml
```yaml
redis:
  image: redis:7-alpine
  container_name: ehr_redis
  ports:
    - "6379:6379"
  networks:
    - ehr-network
```

**Step 2:** Update deployment script
```bash
# Edit docker-deploy.sh
# Add health check for Redis
echo -n "   Redis: "
until redis-cli -h localhost ping >/dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo " ✅"
```

**Step 3:** Update documentation
- Edit DOCKER_DEPLOYMENT.md
- Add Redis to services list
- Document how to use it

---

## 📚 Summary

**Key Takeaways:**

1. **Development workflow doesn't change**
   - Edit code locally → Docker picks up changes automatically

2. **New phases work automatically**
   - No Docker configuration changes needed for normal development

3. **All team members have identical environment**
   - Same database, same versions, same configuration

4. **Easy to reset if something breaks**
   - `docker-compose down -v` → `docker-compose up -d`

5. **Production deployment stays in sync**
   - Same Docker files work everywhere

**You can confidently continue development while using Docker! 🚀**

---

## 🆘 FAQ

**Q: Do I need to rebuild Docker images every time I change code?**
A: No! Only rebuild when you change requirements.txt, package.json, or Dockerfiles.

**Q: Can I use my normal IDE debugger?**
A: Yes! Attach debugger to port 8000 (backend) or use browser DevTools (frontend).

**Q: What if I need a new Python/npm package?**
A: Add to requirements.txt or package.json, then rebuild that specific container.

**Q: Can I run backend/frontend locally instead of Docker?**
A: Yes, but then you lose environment consistency. Docker is recommended.

**Q: How do I share my database with team members?**
A: Export SQL dump, share file, team member imports it.

**Q: What if Docker is too slow on my machine?**
A: Allocate more resources in Docker Desktop settings (4GB RAM minimum).

**Q: Can I deploy to cloud (AWS, Azure, Google Cloud)?**
A: Yes! These same Docker files work on any cloud platform.

---

**Bottom Line: Continue your development normally. Docker handles the environment management automatically! 🎉**
