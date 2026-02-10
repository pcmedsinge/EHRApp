# Development Scripts - Robust Version

## Overview

The EHR Application now has improved, production-ready development scripts with:
- ✅ Proper PID file management
- ✅ Port conflict detection and handling
- ✅ Force restart capability
- ✅ Better error handling and logging
- ✅ Service health checking
- ✅ Graceful shutdown

## Key Improvements

### 1. PID Management
- PID files stored in `.pids/` directory (not `/tmp`)
- Persistent across reboots
- Proper cleanup on stop

### 2. Port Handling
- Detects if ports are already in use
- Option to force restart with `--force` flag
- Cleans up orphaned processes

### 3. Error Handling
- No more `set -e` causing premature exits
- Checks for errors in log files during startup
- Provides helpful error messages with log locations

### 4. Health Checking
- Waits up to 60 seconds for services to become healthy
- Checks both URL response and log file for errors
- Provides progress updates every 10 seconds

## Usage

### Start All Services
```bash
./scripts/dev-start.sh
```

### Start with Options
```bash
./scripts/dev-start.sh --force              # Force restart if running
./scripts/dev-start.sh --no-docker          # Skip Docker
./scripts/dev-start.sh --backend-only       # Backend only
./scripts/dev-start.sh --frontend-only      # Frontend only
```

### Stop All Services
```bash
./scripts/dev-stop.sh
```

### Stop with Options
```bash
./scripts/dev-stop.sh --all                 # Also stop Docker
./scripts/dev-stop.sh --keep-docker         # Keep Docker (default)
```

### Check Status
```bash
./scripts/dev-status.sh
```

### View Logs
```bash
./scripts/dev-logs.sh                       # Follow all logs
./scripts/dev-logs.sh backend               # Backend only
./scripts/dev-logs.sh frontend              # Frontend only
```

## File Locations

### PID Files
- Backend: `.pids/backend.pid`
- Frontend: `.pids/frontend.pid`

### Log Files
- Backend: `backend.log` (in project root)
- Frontend: `frontend.log` (in project root)

## Troubleshooting

### Ports Already in Use
If you see "Port 8000/3000 in use":
```bash
./scripts/dev-start.sh --force
```

### Services Won't Start
1. Check logs:
   ```bash
   tail -50 backend.log
   tail -50 frontend.log
   ```

2. Check Docker:
   ```bash
   docker ps
   docker logs ehr_postgres
   ```

3. Manually stop everything:
   ```bash
   ./scripts/dev-stop.sh --all
   pkill -9 -f uvicorn
   pkill -9 -f vite
   ```

### Clean Restart
```bash
./scripts/dev-stop.sh --all
sleep 2
./scripts/dev-start.sh --force
```

## Testing the Scripts

```bash
# Full test cycle
./scripts/dev-start.sh
./scripts/dev-status.sh
curl http://localhost:8000/health
curl http://localhost:3000
./scripts/dev-stop.sh
./scripts/dev-status.sh
```

## What Was Fixed

### Before (Issues)
- ❌ PID files in `/tmp` - lost on reboot
- ❌ `set -e` caused script to exit on any error
- ❌ No force restart option
- ❌ Poor error messages
- ❌ Syntax errors with special characters in echo statements
- ❌ No cleanup of orphaned processes
- ❌ Hard-coded 30 second timeout

### After (Improvements)
- ✅ PID files in `.pids/` directory
- ✅ Graceful error handling
- ✅ `--force` flag for restarts
- ✅ Detailed error messages with log locations
- ✅ Clean script syntax
- ✅ Kills orphaned processes on ports
- ✅ 60 second timeout with progress updates
- ✅ Validates startup by checking URLs and logs

## Technical Details

### Startup Process
1. Parse command line arguments
2. Start Docker containers (if enabled)
3. Wait for PostgreSQL to be ready
4. Check if ports are in use
5. Start backend:
   - Run migrations
   - Start uvicorn in background
   - Save PID to file
   - Wait for health endpoint
6. Start frontend:
   - Start Vite in background
   - Save PID to file
   - Wait for URL to respond
7. Display summary with URLs and commands

### Shutdown Process
1. Read PID files
2. Try graceful shutdown (SIGTERM)
3. Wait 2 seconds
4. Force kill if still running (SIGKILL)
5. Kill any remaining processes on ports
6. Remove PID files
7. Optionally stop Docker

### Health Checking
- Attempts: 60 (1 per second)
- Checks: URL response + log file errors
- Progress: Update every 10 attempts
- Failure: Shows last 20 lines of log

## Example Output

### Successful Start
```
╔═══════════════════════════════════════════════════════════╗
║          EHR Application - Development Server             ║
╚═══════════════════════════════════════════════════════════╝

📦 Starting Docker containers...
✅ PostgreSQL ready!

🐍 Starting Backend...
Backend PID: 12345
⏳ Waiting for Backend...
✅ Backend ready!

⚛️  Starting Frontend...
Frontend PID: 12346
⏳ Waiting for Frontend...
✅ Frontend ready!

🎉 EHR Development Environment Started!
```

### Successful Stop
```
╔═══════════════════════════════════════════════════════════╗
║          EHR Application - Stopping Services              ║
╚═══════════════════════════════════════════════════════════╝

⚛️  Stopping Frontend...
✅ Frontend stopped (PID: 12346)

🐍 Stopping Backend...
✅ Backend stopped (PID: 12345)

🛑 All development services stopped!
```

## Integration with Phase 3F

The improved scripts are ready for testing the Clinical Notes feature:

1. Start services: `./scripts/dev-start.sh`
2. Navigate to http://localhost:3000
3. Login as doctor
4. Test clinical notes functionality
5. Stop when done: `./scripts/dev-stop.sh`

The scripts are now production-ready and handle edge cases gracefully!
