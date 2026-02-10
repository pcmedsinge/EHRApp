# EHR Application Scripts

This directory contains all helper scripts for managing the EHR application.

## 📋 Quick Reference

### Main Scripts (Recommended)

| Script | Purpose | Usage |
|--------|---------|-------|
| `dev-start.sh` | Start all development services | `./dev-start.sh` |
| `dev-stop.sh` | Stop all services (keep Docker) | `./dev-stop.sh` |
| `dev-status.sh` | Check status of all services | `./dev-status.sh` |
| `dev-logs.sh` | View application logs | `./dev-logs.sh` |
| `setup.sh` | First-time setup | `./setup.sh` |

### Docker Management

| Script | Purpose |
|--------|---------|
| `docker-up.sh` | Start Docker containers only |
| `docker-down.sh` | Stop Docker containers |
| `docker-restart.sh` | Restart Docker containers |
| `docker-logs.sh` | View Docker logs |

### Legacy Scripts (Simpler)

| Script | Purpose |
|--------|---------|
| `start.sh` | Simple start (less checks) |
| `stop.sh` | Simple stop |
| `logs.sh` | Simple log viewer |

### Testing Scripts

| Script | Purpose |
|--------|---------|
| `test-login.sh` | Test authentication |
| `test_vitals_api.sh` | Test vitals API endpoints |

### Utility Scripts

| Script | Purpose |
|--------|---------|
| `help.sh` | Display help and usage info |

## 🔧 Usage

### From Project Root

You can run scripts directly from the root directory using wrappers:

```bash
# These work from root directory
./setup.sh
./dev-start.sh
./dev-status.sh
./dev-stop.sh
```

### From Scripts Directory

Or run them directly from this directory:

```bash
cd scripts
./dev-start.sh
```

## 📝 Script Details

### Development Scripts

**`dev-start.sh`** - Comprehensive startup script
- Checks prerequisites
- Starts Docker containers
- Starts backend API
- Starts frontend
- Options: `--no-docker`, `--backend-only`, `--frontend-only`

**`dev-stop.sh`** - Graceful shutdown
- Stops frontend and backend
- Keeps Docker running by default
- Use `--all` to stop Docker too

**`dev-status.sh`** - Status dashboard
- Shows Docker container status
- Shows application service status
- Shows database connection
- Shows port usage

**`dev-logs.sh`** - Interactive log viewer
- View backend logs
- View frontend logs
- Tail logs in real-time

### Setup Scripts

**`setup.sh`** - First-time setup wizard
- Checks prerequisites (Docker, Python, Node.js)
- Creates virtual environment
- Installs dependencies
- Creates `.env` file
- Runs database migrations
- Seeds initial data

### Docker Scripts

**`docker-up.sh`** - Start containers
- PostgreSQL (port 5433)
- Orthanc PACS (port 8043)

**`docker-down.sh`** - Stop containers
- Gracefully stops all containers
- Preserves data volumes

**`docker-restart.sh`** - Restart containers
- Stops and starts containers
- Useful for configuration changes

**`docker-logs.sh`** - View container logs
- PostgreSQL logs
- Orthanc logs

### Testing Scripts

**`test-login.sh`** - Authentication test
- Tests login endpoint
- Verifies JWT token generation
- Checks user authentication

**`test_vitals_api.sh`** - Vitals API test
- Tests all vitals endpoints
- Creates test data
- Verifies BMI calculation
- Tests CRUD operations

## 🎯 Common Workflows

### First Time Setup
```bash
./setup.sh
./dev-start.sh
```

### Daily Development
```bash
# Start
./dev-start.sh

# Check status
./dev-status.sh

# View logs
./dev-logs.sh

# Stop
./dev-stop.sh
```

### Troubleshooting
```bash
# Check what's running
./dev-status.sh

# View logs
./dev-logs.sh

# Full restart
./dev-stop.sh --all
./dev-start.sh
```

### Database Reset
```bash
./dev-stop.sh --all
docker volume rm ehrapp_postgres_data
./dev-start.sh
```

## 📌 Notes

- All scripts are executable (`chmod +x`)
- Scripts use absolute paths (work from any directory)
- Wrappers in root directory for backward compatibility
- Scripts detect running services to avoid conflicts
- Use `--help` flag on any script for detailed usage

## 🔗 Related Documentation

- [Main README](../README.md) - Project overview
- [QUICKSTART](../QUICKSTART.md) - Quick start guide
- [Phase Documentation](../docs/phases/) - Implementation details
