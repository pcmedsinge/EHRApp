# Testing Orthanc + OHIF Setup

## Quick Start

### 1. Start All Services

```bash
cd /home/linuxdev1/PracticeApps/EHRApp
docker-compose up -d
```

### 2. Wait for Health Checks

```bash
# Check all containers are healthy
docker-compose ps

# Expected output (all "healthy" or "running"):
# ehr_postgres           healthy   5433->5432
# ehr_orthanc_postgres   healthy   5434->5432
# ehr_orthanc            healthy   8042->8042, 4242->4242
# ehr_ohif               running   3001->80
```

### 3. Verify Orthanc

```bash
# Check Orthanc system info
curl http://localhost:8042/system

# Expected response:
{
  "DicomAet": "EHRPACS",
  "Name": "EHR_PACS",
  "Version": "1.12.3",
  ...
}

# Check Orthanc PostgreSQL connection
curl http://localhost:8042/plugins

# Should see "postgresql-index" and "postgresql-storage" plugins
```

### 4. Access Web Interfaces

```bash
# Orthanc Web UI
open http://localhost:8042
# Login: orthanc / orthanc

# OHIF Viewer
open http://localhost:3001
```

---

## Test DICOM Upload

### Option 1: Using Orthanc Web UI

1. Go to http://localhost:8042
2. Login with `orthanc` / `orthanc`
3. Click "Upload" button
4. Select a DICOM file (.dcm)
5. View uploaded study

### Option 2: Using curl

```bash
# Upload sample DICOM file
curl -X POST http://localhost:8042/instances \
  -u orthanc:orthanc \
  -H "Content-Type: application/dicom" \
  --data-binary @test-data/sample.dcm

# List all studies
curl http://localhost:8042/studies -u orthanc:orthanc

# Get study details
curl http://localhost:8042/studies/{study_id} -u orthanc:orthanc
```

---

## Verify PostgreSQL Storage

```bash
# Connect to Orthanc database
docker exec -it ehr_orthanc_postgres psql -U orthanc -d orthanc

# Check tables
\dt

# Expected tables:
# DicomIdentifiers
# MainDicomTags  
# Resources
# AttachedFiles
# Metadata
# ...

# Count studies
SELECT COUNT(*) FROM Resources WHERE resourceType = 0;

# Exit
\q
```

---

## Test OHIF Viewer

### Manual Test

1. Upload a DICOM study via Orthanc UI (http://localhost:8042)
2. Note the StudyInstanceUID (e.g., `1.2.840.113619...`)
3. Open OHIF with study UID:
   ```
   http://localhost:3001/viewer?StudyInstanceUIDs=1.2.840.113619...
   ```
4. Images should load and display

### Troubleshooting OHIF

If images don't load:

1. **Check CORS in Orthanc:**
   ```bash
   docker logs ehr_orthanc | grep CORS
   ```

2. **Check DICOMweb plugin:**
   ```bash
   curl http://localhost:8042/dicom-web/studies
   ```

3. **Check OHIF config:**
   ```bash
   docker exec ehr_ohif cat /usr/share/nginx/html/app-config.js
   ```

---

## Clean Up

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart fresh
docker-compose up -d
```

---

## Common Issues

### Issue: Orthanc can't connect to PostgreSQL

**Symptom:**
```
docker logs ehr_orthanc
# Error: could not connect to database
```

**Solution:**
```bash
# Restart Orthanc after PostgreSQL is fully ready
docker-compose restart orthanc
```

### Issue: OHIF shows "No studies found"

**Check:**
1. Orthanc has studies: `curl http://localhost:8042/studies -u orthanc:orthanc`
2. DICOMweb works: `curl http://localhost:8042/dicom-web/studies`
3. OHIF config has correct Orthanc URL

### Issue: "401 Unauthorized" in OHIF

**Solution:**
Update OHIF config authentication in `/config/ohif-config.js`:
```javascript
auth: 'orthanc:orthanc'
```

---

## Next Steps

Once Orthanc and OHIF are working:

1. ✅ Verify you can upload DICOM files
2. ✅ Verify studies are stored in PostgreSQL
3. ✅ Verify OHIF can view the images
4. 🔜 Start Phase 5A: Build backend DICOM API
5. 🔜 Start Phase 5B: Build upload UI
6. 🔜 Start Phase 5C: Integrate OHIF viewer in EHR

---

**Status:** Infrastructure ready for Phase 5 development!
