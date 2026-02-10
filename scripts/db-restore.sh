#!/bin/bash

# Database Restore Script
# Restores EHR database from a backup file

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

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         EHR Database Restore                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Check if PostgreSQL container is running
if ! docker ps | grep -q ehr_postgres; then
    echo -e "${RED}❌ PostgreSQL container is not running${NC}"
    exit 1
fi

# List available backups
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/*.sql 2>/dev/null)" ]; then
    echo -e "${RED}❌ No backups found in $BACKUP_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Available backups:${NC}"
echo ""
select backup_file in "$BACKUP_DIR"/*.sql; do
    if [ -n "$backup_file" ]; then
        BACKUP_FILE="$backup_file"
        break
    fi
done

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ No backup selected${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will replace all data in the database!${NC}"
echo "Selected backup: $(basename $BACKUP_FILE)"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Restoring database...${NC}"

# Restore backup
docker exec -i ehr_postgres psql -U ehr_user -d ehr_db < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
    echo ""
    
    # Show counts
    echo -e "${BLUE}📊 Database statistics:${NC}"
    docker exec ehr_postgres psql -U ehr_user -d ehr_db -c "
        SELECT 'Users' as table, COUNT(*) as count FROM users
        UNION ALL SELECT 'Patients', COUNT(*) FROM patients
        UNION ALL SELECT 'Visits', COUNT(*) FROM visits
        UNION ALL SELECT 'Orders', COUNT(*) FROM orders
        UNION ALL SELECT 'Vitals', COUNT(*) FROM vitals
        UNION ALL SELECT 'Diagnoses', COUNT(*) FROM diagnoses;
    "
    echo ""
else
    echo -e "${RED}❌ Restore failed${NC}"
    exit 1
fi
