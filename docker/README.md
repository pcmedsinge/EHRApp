# Docker Configuration

This directory contains Docker-related configuration files and utilities for the EHR application.

## 🐳 Services

### PostgreSQL Database
- **Image:** postgres:15.10-alpine
- **Container Name:** ehr_postgres
- **Port:** 5433 → 5432 (mapped to avoid conflicts)
- **Database:** ehr_db
- **User:** ehr_user
- **Password:** ehr_password

### Orthanc PACS Server
- **Image:** orthancteam/orthanc:25.12.3
- **Container Name:** ehr_orthanc
- **HTTP Port:** 8043 → 8042 (REST API & Web UI)
- **DICOM Port:** 4243 → 4242 (DICOM protocol)
- **Username:** ehr
- **Password:** ehr_password

## 📋 Quick Start Scripts

Located in the project root:

### Start Services
```bash
./docker-up.sh
```
Starts all Docker services and shows status.

### Stop Services
```bash
./docker-down.sh
```
Stops all Docker services (data is preserved).

### Restart Services
```bash
./docker-restart.sh
```
Stops and starts all services.

### View Logs
```bash
# All services
./docker-logs.sh

# PostgreSQL only
./docker-logs.sh postgres

# Orthanc only
./docker-logs.sh orthanc
```

## 🔧 Manual Docker Commands

### Start/Stop
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

### Container Management
```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Restart a specific container
docker restart ehr_postgres
docker restart ehr_orthanc

# Remove a stopped container
docker rm ehr_postgres
docker rm ehr_orthanc
```

### Logs and Monitoring
```bash
# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f postgres
docker-compose logs -f orthanc

# View last 100 lines
docker-compose logs --tail=100 postgres

# Check container stats (CPU, memory, etc.)
docker stats ehr_postgres ehr_orthanc
```

### Database Access
```bash
# Connect to PostgreSQL CLI
docker exec -it ehr_postgres psql -U ehr_user -d ehr_db

# Run SQL query directly
docker exec -it ehr_postgres psql -U ehr_user -d ehr_db -c "SELECT version();"

# Create database backup
docker exec -it ehr_postgres pg_dump -U ehr_user ehr_db > backup.sql

# Restore database backup
cat backup.sql | docker exec -i ehr_postgres psql -U ehr_user -d ehr_db
```

### Orthanc Access
```bash
# Check Orthanc system info
curl -u ehr:ehr_password http://localhost:8043/system

# List all studies
curl -u ehr:ehr_password http://localhost:8043/studies

# Access web UI
xdg-open http://localhost:8043  # Linux
```

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect ehrapp_postgres_data
docker volume inspect ehrapp_orthanc_data

# Remove volumes (WARNING: deletes all data)
docker volume rm ehrapp_postgres_data ehrapp_orthanc_data
```

## 🔍 Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

```bash
# Find what's using the port
sudo lsof -i :5433
sudo lsof -i :8043

# Stop the conflicting service or change ports in docker-compose.yml
```

### Container Won't Start
```bash
# View detailed logs
docker logs ehr_postgres
docker logs ehr_orthanc

# Remove and recreate container
docker-compose down
docker-compose up -d
```

### Database Connection Issues
```bash
# Check if PostgreSQL is ready
docker exec ehr_postgres pg_isready -U ehr_user

# Test connection
docker exec -it ehr_postgres psql -U ehr_user -d ehr_db -c "SELECT 1;"
```

### Clean Slate (Reset Everything)
```bash
# WARNING: This deletes all data!
docker-compose down -v
docker-compose up -d
```

## 📊 Health Checks

Both services have health checks configured:

- **PostgreSQL:** Checks every 10s using `pg_isready`
- **Orthanc:** Checks every 10s using HTTP request to `/system`

View health status:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## 🔐 Security Notes

**Development Environment:**
- Default credentials are used for convenience
- Services are exposed on localhost only
- SSL/TLS not configured

**Production Checklist:**
- ✅ Change all default passwords
- ✅ Use secrets management (Docker secrets, vault, etc.)
- ✅ Enable SSL/TLS for PostgreSQL
- ✅ Configure Orthanc authentication properly
- ✅ Use Docker secrets instead of environment variables
- ✅ Implement network policies
- ✅ Regular security updates

## 📁 Directory Structure

```
docker/
├── README.md                  # This file
├── init/                      # Database initialization scripts (if needed)
│   └── 01_init.sql           # Initial schema (created in Phase 1C)
├── orthanc/                   # Orthanc configuration files (if needed)
│   └── orthanc.json          # Custom Orthanc config (optional)
└── backups/                   # Database backups (gitignored)
    └── .gitkeep
```

## 🔗 Useful Links

- [PostgreSQL Docker Documentation](https://hub.docker.com/_/postgres)
- [Orthanc Docker Documentation](https://orthanc.uclouvain.be/book/users/docker.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Orthanc REST API](https://orthanc.uclouvain.be/book/users/rest.html)

## 📝 Environment Variables

All configuration is in `/backend/.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `ORTHANC_URL` - Orthanc PACS server URL
- `ORTHANC_USERNAME` - Orthanc authentication
- `ORTHANC_PASSWORD` - Orthanc authentication

## 🚀 Next Steps

After Docker services are running:
1. Initialize database schema (Phase 1C)
2. Run Alembic migrations
3. Test Orthanc integration
4. Deploy application
