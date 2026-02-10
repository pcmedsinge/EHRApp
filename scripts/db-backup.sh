#!/bin/bash

# Database Backup Script
# Creates a complete backup of the EHR database

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ehr_backup_$TIMESTAMP.sql"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         EHR Database Backup                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Check if PostgreSQL container is running
if ! docker ps | grep -q ehr_postgres; then
    echo -e "${RED}❌ PostgreSQL container is not running${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Creating backup...${NC}"
echo "Database: ehr_db"
echo "File: $BACKUP_FILE"
echo ""

# Create backup
docker exec ehr_postgres pg_dump -U ehr_user -d ehr_db --clean --if-exists > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $BACKUP_SIZE"
    echo ""
    
    # List recent backups
    echo -e "${BLUE}📋 Recent backups:${NC}"
    ls -lh "$BACKUP_DIR" | grep "ehr_backup" | tail -5
    echo ""
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi
