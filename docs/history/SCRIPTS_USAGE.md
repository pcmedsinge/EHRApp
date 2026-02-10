# Scripts Usage Guide

## ✅ Root Directory is Now Clean

All `.sh` scripts have been moved to the `scripts/` folder for better organization.

## 📂 New Structure

```
EHRApp/
├── scripts/              # All helper scripts (15 files)
│   ├── README.md        # Detailed script documentation
│   ├── setup.sh
│   ├── dev-start.sh
│   ├── dev-stop.sh
│   ├── dev-status.sh
│   └── ... (11 more scripts)
├── backend/
├── frontend/
└── (no .sh files in root)
```

## 🚀 How to Use Scripts

All scripts must now be run from the `scripts/` folder:

### Option 1: Change to scripts directory first (Recommended)
```bash
cd scripts
./setup.sh
./dev-start.sh
./dev-status.sh
./dev-stop.sh
```

### Option 2: Run directly with path
```bash
./scripts/setup.sh
./scripts/dev-start.sh
./scripts/dev-status.sh
```

## 📋 Quick Reference

### First Time Setup
```bash
cd scripts
./setup.sh
```

### Daily Development
```bash
cd scripts
./dev-start.sh    # Start all services
./dev-status.sh   # Check status
./dev-logs.sh     # View logs
./dev-stop.sh     # Stop services
```

### Simple Start/Stop
```bash
cd scripts
./start.sh        # Simple start
./stop.sh         # Simple stop
```

### Docker Management
```bash
cd scripts
./docker-up.sh
./docker-down.sh
./docker-logs.sh
```

### Testing
```bash
cd scripts
./test-login.sh
./test_vitals_api.sh
```

## ✨ Benefits

✅ **Clean root directory** - No clutter  
✅ **Better organization** - All scripts in one place  
✅ **Consistent paths** - Scripts use PROJECT_ROOT for reliability  
✅ **Easy to find** - All scripts documented in scripts/README.md  
✅ **Works from anywhere** - Scripts handle paths correctly  

## 📖 More Information

See [scripts/README.md](scripts/README.md) for detailed documentation of each script.
