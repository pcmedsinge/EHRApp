# PostgreSQL Database Reference

Quick reference guide for accessing and managing the EHR database.

---

## 1. Connection Details

| Setting | Value |
|---------|-------|
| **Host** | `localhost` |
| **Port** | `5433` |
| **Database** | `ehr_db` |
| **Username** | `ehr_user` |
| **Password** | `ehr_password` |
| **Container** | `ehr_postgres` |

---

## 2. Command Line Access

### Method 1: Direct Connection (Recommended)

```bash
# Interactive psql session
PGPASSWORD=ehr_password psql -h localhost -p 5433 -U ehr_user -d ehr_db

# One-liner query
PGPASSWORD=ehr_password psql -h localhost -p 5433 -U ehr_user -d ehr_db -c "YOUR_SQL_HERE"
```

### Method 2: Docker Exec

```bash
# Interactive psql session inside container
docker exec -it ehr_postgres psql -U ehr_user -d ehr_db

# One-liner query via docker
docker exec -e PGPASSWORD=ehr_password ehr_postgres psql -U ehr_user -d ehr_db -c "YOUR_SQL_HERE"
```

### Method 3: Connection String

```bash
# Standard PostgreSQL connection string
psql "postgresql://ehr_user:ehr_password@localhost:5433/ehr_db"
```

---

## 3. Useful psql Commands

```sql
-- List all databases
\l

-- Connect to a database
\c ehr_db

-- List all tables
\dt

-- List all tables with sizes
\dt+

-- Describe a table structure
\d users
\d patients

-- List all columns of a table
\d+ users

-- List all indexes
\di

-- Show current database
SELECT current_database();

-- Show current user
SELECT current_user;

-- Show PostgreSQL version
SELECT version();

-- Quit psql
\q

-- Clear screen
\! clear

-- Show command history
\s

-- Execute SQL from file
\i /path/to/file.sql

-- Output results to file
\o /path/to/output.txt
SELECT * FROM users;
\o

-- Toggle expanded display (vertical output)
\x

-- Show execution time
\timing on
```

---

## 4. Sample Queries (SELECT)

### Users Table

```sql
-- All users
SELECT * FROM users;

-- Specific columns
SELECT username, email, role, is_active FROM users;

-- Filter by role
SELECT * FROM users WHERE role = 'ADMIN';
SELECT * FROM users WHERE role = 'DOCTOR';
SELECT * FROM users WHERE role = 'NURSE';

-- Active users only
SELECT username, full_name, role FROM users WHERE is_active = true;

-- Count users by role
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- Search by name (case-insensitive)
SELECT * FROM users WHERE LOWER(full_name) LIKE '%admin%';

-- Recently created users
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
```

### Patients Table

```sql
-- All patients
SELECT * FROM patients;

-- Basic patient info
SELECT mrn, first_name, last_name, date_of_birth, gender FROM patients;

-- Patient with calculated age
SELECT 
    mrn, 
    first_name || ' ' || last_name AS full_name,
    date_of_birth,
    EXTRACT(YEAR FROM AGE(date_of_birth)) AS age,
    gender,
    blood_group
FROM patients;

-- Search by name
SELECT * FROM patients 
WHERE LOWER(first_name) LIKE '%raj%' 
   OR LOWER(last_name) LIKE '%raj%';

-- Search by MRN
SELECT * FROM patients WHERE mrn = 'CLI-2026-00001';

-- Patients by gender
SELECT gender, COUNT(*) FROM patients GROUP BY gender;

-- Patients by blood group
SELECT blood_group, COUNT(*) FROM patients GROUP BY blood_group;

-- Recently registered patients
SELECT mrn, first_name, last_name, created_at 
FROM patients 
ORDER BY created_at DESC 
LIMIT 10;

-- Patients with phone numbers
SELECT mrn, first_name, last_name, phone, email FROM patients WHERE phone IS NOT NULL;

-- Active patients (not deleted)
SELECT * FROM patients WHERE is_deleted = false;
```

---

## 5. Data Manipulation (DML)

### INSERT

```sql
-- Insert new user (password must be hashed - use API instead)
-- This is just for reference, prefer using the API for user creation
INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at, updated_at, is_deleted)
VALUES (
    gen_random_uuid(),
    'new_user',
    'newuser@ehr.com',
    '$argon2id$v=19$m=65536,t=3,p=4$...',  -- Use proper hash
    'New User Name',
    'DOCTOR',
    true,
    NOW(),
    NOW(),
    false
);

-- Insert new patient
INSERT INTO patients (
    id, mrn, first_name, last_name, date_of_birth, gender, 
    blood_group, phone, email, address, city, state, 
    pincode, emergency_contact_name, emergency_contact_phone,
    created_at, updated_at, is_deleted
)
VALUES (
    gen_random_uuid(),
    'CLI-2026-00099',
    'Test',
    'Patient',
    '1990-05-15',
    'male',
    'O+',
    '+91-9876543210',
    'test@email.com',
    '123 Main Street',
    'Mumbai',
    'Maharashtra',
    '400001',
    'Emergency Contact',
    '+91-9876543211',
    NOW(),
    NOW(),
    false
);
```

### UPDATE

```sql
-- Update user email
UPDATE users SET email = 'newemail@ehr.com', updated_at = NOW() 
WHERE username = 'admin';

-- Deactivate a user
UPDATE users SET is_active = false, updated_at = NOW() 
WHERE username = 'some_user';

-- Change user role
UPDATE users SET role = 'DOCTOR', updated_at = NOW() 
WHERE username = 'some_user';

-- Update patient phone
UPDATE patients SET phone = '+91-9999999999', updated_at = NOW() 
WHERE mrn = 'CLI-2026-00001';

-- Update patient address
UPDATE patients 
SET address = 'New Address', city = 'Delhi', state = 'Delhi', pincode = '110001', updated_at = NOW()
WHERE mrn = 'CLI-2026-00001';

-- Soft delete a patient
UPDATE patients SET is_deleted = true, updated_at = NOW() 
WHERE mrn = 'CLI-2026-00001';

-- Restore soft-deleted patient
UPDATE patients SET is_deleted = false, updated_at = NOW() 
WHERE mrn = 'CLI-2026-00001';
```

### DELETE

```sql
-- ⚠️ CAUTION: Hard delete - data cannot be recovered!
-- Prefer soft delete (UPDATE is_deleted = true) instead

-- Delete a specific user (DANGEROUS)
DELETE FROM users WHERE username = 'test_user';

-- Delete a specific patient (DANGEROUS)
DELETE FROM patients WHERE mrn = 'CLI-2026-00099';

-- Delete all soft-deleted records permanently (cleanup)
DELETE FROM patients WHERE is_deleted = true;
```

---

## 6. Data Definition (DDL)

### View Table Structure

```sql
-- Show table columns and types
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Show table constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users';

-- Show indexes on a table
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';
```

### Alter Table

```sql
-- Add a new column
ALTER TABLE patients ADD COLUMN notes TEXT;

-- Add column with default
ALTER TABLE patients ADD COLUMN priority INTEGER DEFAULT 0;

-- Rename a column
ALTER TABLE patients RENAME COLUMN notes TO clinical_notes;

-- Change column type
ALTER TABLE patients ALTER COLUMN priority TYPE VARCHAR(20);

-- Drop a column
ALTER TABLE patients DROP COLUMN priority;

-- Add NOT NULL constraint
ALTER TABLE patients ALTER COLUMN phone SET NOT NULL;

-- Remove NOT NULL constraint
ALTER TABLE patients ALTER COLUMN phone DROP NOT NULL;

-- Add unique constraint
ALTER TABLE patients ADD CONSTRAINT unique_email UNIQUE (email);

-- Drop constraint
ALTER TABLE patients DROP CONSTRAINT unique_email;
```

### Create Index

```sql
-- Create simple index
CREATE INDEX idx_patients_last_name ON patients(last_name);

-- Create composite index
CREATE INDEX idx_patients_name ON patients(last_name, first_name);

-- Create unique index
CREATE UNIQUE INDEX idx_patients_email ON patients(email) WHERE email IS NOT NULL;

-- Drop index
DROP INDEX idx_patients_last_name;
```

---

## 7. Advanced Queries

### Joins (for future tables)

```sql
-- Example: When you have visits/appointments table
-- SELECT p.mrn, p.first_name, p.last_name, v.visit_date, v.diagnosis
-- FROM patients p
-- JOIN visits v ON p.id = v.patient_id
-- WHERE v.visit_date >= CURRENT_DATE - INTERVAL '30 days';
```

### Aggregations

```sql
-- Count records
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM users WHERE is_active = true;

-- Group by with count
SELECT role, COUNT(*) as user_count 
FROM users 
GROUP BY role 
ORDER BY user_count DESC;

SELECT gender, COUNT(*) as patient_count 
FROM patients 
WHERE is_deleted = false
GROUP BY gender;

-- Min, Max, Avg (for numeric/date fields)
SELECT 
    MIN(date_of_birth) as oldest_dob,
    MAX(date_of_birth) as youngest_dob
FROM patients;
```

### Date Operations

```sql
-- Patients born this year
SELECT * FROM patients 
WHERE EXTRACT(YEAR FROM date_of_birth) = EXTRACT(YEAR FROM CURRENT_DATE);

-- Records created today
SELECT * FROM patients WHERE DATE(created_at) = CURRENT_DATE;

-- Records created in last 7 days
SELECT * FROM patients 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Records created this month
SELECT * FROM patients 
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- Age calculation
SELECT 
    first_name, 
    last_name,
    date_of_birth,
    AGE(date_of_birth) as age_interval,
    EXTRACT(YEAR FROM AGE(date_of_birth)) as age_years
FROM patients;
```

### Text Search

```sql
-- Case-insensitive search
SELECT * FROM patients WHERE LOWER(first_name) LIKE '%kumar%';

-- Pattern matching
SELECT * FROM patients WHERE phone LIKE '+91-98%';

-- Search in multiple columns
SELECT * FROM patients 
WHERE first_name ILIKE '%search%' 
   OR last_name ILIKE '%search%'
   OR email ILIKE '%search%';
```

---

## 8. Backup & Restore

### Backup Database

```bash
# Full database backup
docker exec ehr_postgres pg_dump -U ehr_user ehr_db > backup_$(date +%Y%m%d).sql

# Backup specific table
docker exec ehr_postgres pg_dump -U ehr_user -t patients ehr_db > patients_backup.sql

# Backup with compression
docker exec ehr_postgres pg_dump -U ehr_user ehr_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# Restore from backup
cat backup_20260131.sql | docker exec -i ehr_postgres psql -U ehr_user -d ehr_db

# Restore compressed backup
gunzip -c backup_20260131.sql.gz | docker exec -i ehr_postgres psql -U ehr_user -d ehr_db
```

---

## 9. Monitoring & Maintenance

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('ehr_db'));

-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'ehr_db';

-- Kill a specific connection (use with caution)
-- SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <process_id>;

-- Vacuum (cleanup dead tuples)
VACUUM ANALYZE patients;

-- Reindex a table
REINDEX TABLE patients;
```

---

## 10. Quick Reference One-Liners

```bash
# View all users
PGPASSWORD=ehr_password psql -h localhost -p 5433 -U ehr_user -d ehr_db -c "SELECT username, role, is_active FROM users;"

# View all patients
PGPASSWORD=ehr_password psql -h localhost -p 5433 -U ehr_user -d ehr_db -c "SELECT mrn, first_name, last_name, gender FROM patients WHERE is_deleted = false;"

# Count records
PGPASSWORD=ehr_password psql -h localhost -p 5433 -U ehr_user -d ehr_db -c "SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL SELECT 'patients', COUNT(*) FROM patients;"

# Check database health
PGPASSWORD=ehr_password psql -h localhost -p 5433 -U ehr_user -d ehr_db -c "SELECT version(); SELECT pg_size_pretty(pg_database_size('ehr_db')) as db_size;"

# Export to CSV
PGPASSWORD=ehr_password psql -h localhost -p 5433 -U ehr_user -d ehr_db -c "\copy patients TO '/tmp/patients.csv' CSV HEADER"
```

---

## 11. Emergency Recovery

### If Docker container is down:

```bash
# Check container status
docker ps -a | grep postgres

# Start container
docker start ehr_postgres

# Check logs
docker logs ehr_postgres --tail 50
```

### If database is corrupted:

```bash
# Stop container
docker stop ehr_postgres

# Start fresh (⚠️ DATA LOSS!)
docker rm ehr_postgres
docker volume rm ehrapp_postgres_data
cd /home/linuxdev1/PracticeApps/EHRApp && docker-compose up -d postgres

# Re-run migrations
cd backend && source venv/bin/activate && alembic upgrade head
```

### Reset user password (if locked out):

```bash
# Generate new password hash using Python
cd /home/linuxdev1/PracticeApps/EHRApp/backend
source venv/bin/activate
python3 -c "from app.core.security import get_password_hash; print(get_password_hash('NewPassword123!'))"

# Update in database (replace HASH with output above)
PGPASSWORD=ehr_password psql -h localhost -p 5433 -U ehr_user -d ehr_db -c "UPDATE users SET password_hash = 'HASH' WHERE username = 'admin';"
```

---

*Last Updated: January 31, 2026*
