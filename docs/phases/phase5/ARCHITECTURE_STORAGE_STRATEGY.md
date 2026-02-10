# Phase 5: DICOM Architecture & Storage Strategy

**Date:** February 6, 2026  
**Phase:** 5 - DICOM Integration

---

## 🏗️ Container Architecture

### Docker Compose Services

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network: ehr-network              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ EHR PostgreSQL   │  │ Orthanc Postgres │  │   Orthanc    │ │
│  │                  │  │                  │  │     PACS     │ │
│  │ Port: 5433       │  │ Port: 5434       │  │              │ │
│  │ DB: ehr_db       │  │ DB: orthanc      │  │ Port: 8042   │ │
│  │                  │  │                  │  │ DICOM: 4242  │ │
│  │ • Patients       │  │ • DICOM Index    │  │              │ │
│  │ • Visits         │  │ • DICOM Storage  │  │ • REST API   │ │
│  │ • Orders         │  │ • Studies        │  │ • DICOMweb   │ │
│  │ • Users          │  │ • Series         │  │ • C-STORE    │ │
│  │ • Upload Logs    │  │ • Instances      │  │              │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │         │
│           │                     │                    │         │
│  ┌────────▼─────────────────────▼────────────────────▼──────┐  │
│  │             Backend API (FastAPI)                        │  │
│  │             Port: 8000                                   │  │
│  │                                                          │  │
│  │  • Order Management        • Orthanc Client             │  │
│  │  • DICOM Upload API        • Tag Reading (pydicom)      │  │
│  │  • Patient Matching        • Study Queries              │  │
│  │  • Authentication          • Upload Logging             │  │
│  └───────────────────────────────────────────────────────┬──┘  │
│                                                          │     │
│  ┌───────────────────────────────────────────────────────▼──┐  │
│  │             Frontend (React)                             │  │
│  │             Port: 3000                                   │  │
│  │                                                          │  │
│  │  • Order Management UI     • DICOM Upload UI            │  │
│  │  • Patient Portal          • Tag Editor                 │  │
│  │  • Visit Management        • Upload Progress            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             OHIF Viewer (Web DICOM Viewer)               │  │
│  │             Port: 3001                                   │  │
│  │                                                          │  │
│  │  • DICOMweb Client         • Window/Level Tools         │  │
│  │  • MPR Reconstruction      • Measurements               │  │
│  │  • Study Comparison        • Annotations                │  │
│  │  • Direct Orthanc Query    • Full Screen View           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💾 Storage Strategy

### Two-Database Architecture

#### 1. **EHR PostgreSQL Database** (Port 5433)
**Purpose:** Business logic, relationships, metadata

**Tables:**
- `patients` - Patient demographics
- `visits` - Visit records
- `orders` - Order details (including imaging orders)
- `users` - User accounts
- `dicom_upload_logs` - Upload tracking and audit

**Stored Data:**
```json
{
  "order": {
    "id": "uuid",
    "accession_number": "ACC-2026-00001",
    "study_instance_uid": "1.2.840.113619...",  // Link to Orthanc
    "orthanc_study_id": "a3f2c1b5...",          // Link to Orthanc
    "patient_id": "uuid",                        // Link to patient
    "modality": "CT",
    "status": "reported"
  },
  "dicom_upload_log": {
    "id": "uuid",
    "study_instance_uid": "1.2.840.113619...",
    "patient_id": "uuid",
    "order_id": "uuid",
    "uploaded_by_id": "uuid",
    "number_of_files": 150,
    "total_size_bytes": 524288000,
    "upload_status": "success",
    "uploaded_at": "2026-02-06T10:30:00Z"
  }
}
```

**NOT Stored:**
- ❌ Binary DICOM files
- ❌ Pixel data
- ❌ Complete DICOM tag sets

---

#### 2. **Orthanc PostgreSQL Database** (Port 5434)
**Purpose:** DICOM storage and indexing (managed by Orthanc)

**Orthanc Tables** (Auto-managed):
- `DicomIdentifiers` - DICOM tag index
- `MainDicomTags` - Frequently queried tags
- `Resources` - Studies/Series/Instances hierarchy
- `AttachedFiles` - Binary DICOM file storage
- `Metadata` - Additional metadata

**Stored Data:**
```sql
-- Study record in Orthanc
StudyInstanceUID: 1.2.840.113619.2.408.1234567890
OrthancStudyID: a3f2c1b5-8d4e-9f7c-2a1b-3c4d5e6f7g8h
PatientID: CLI-2026-00001 (MRN from EHR)
AccessionNumber: ACC-2026-00001 (from EHR order)
StudyDate: 20260206
Modality: CT
NumberOfSeries: 3
NumberOfInstances: 150

-- Binary DICOM files stored as BLOBs
```

**Stored:**
- ✅ Complete DICOM files (binary)
- ✅ All DICOM tags
- ✅ Pixel data (compressed)
- ✅ Series/Instance hierarchy

---

## 🔗 Data Linking Strategy

### Bridge Keys

Four keys connect the EHR database and Orthanc:

```python
# 1. StudyInstanceUID (DICOM Standard - Globally Unique)
study_uid = "1.2.840.113619.2.408.1234567890.12345.67890"

# 2. OrthancStudyID (Orthanc Internal - Short Hash)
orthanc_id = "a3f2c1b5-8d4e-9f7c-2a1b-3c4d5e6f7g8h"

# 3. PatientID (DICOM Tag) = Patient MRN (EHR)
patient_id = "CLI-2026-00001"

# 4. AccessionNumber (DICOM Tag) = Order Accession (EHR)
accession_number = "ACC-2026-00001"
```

### Lookup Flow

```python
# Scenario 1: User views order → Find DICOM study
order = db.query(Order).get(order_id)
study_uid = order.study_instance_uid  # Bridge key 1
orthanc_id = order.orthanc_study_id   # Bridge key 2

# Query Orthanc for full study
study = orthanc_service.get_study(study_uid)

# Scenario 2: DICOM uploaded → Link to patient/order
tags = read_dicom_tags(file)
patient_mrn = tags["PatientID"]        # CLI-2026-00001
accession = tags["AccessionNumber"]    # ACC-2026-00001

# Find in EHR database
patient = db.query(Patient).filter(Patient.mrn == patient_mrn).first()
order = db.query(Order).filter(Order.accession_number == accession).first()

# Update order with study reference
order.study_instance_uid = tags["StudyInstanceUID"]
order.orthanc_study_id = orthanc_response["ID"]
```

---

## 📊 Data Flow Examples

### Upload Workflow

```
┌──────────┐
│  User    │ Uploads file.dcm
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────┐
│  Backend: DICOM Upload Endpoint      │
│  POST /api/v1/dicom/upload           │
└────┬─────────────────────────────────┘
     │
     ├─► 1. Validate DICOM (pydicom)
     │   ✓ Valid DICOM format
     │
     ├─► 2. Read Tags (pydicom)
     │   PatientID: CLI-2026-00001
     │   AccessionNumber: ACC-2026-00001
     │   StudyInstanceUID: 1.2.840...
     │   Modality: CT
     │
     ├─► 3. Match to Patient (EHR DB)
     │   SELECT * FROM patients WHERE mrn = 'CLI-2026-00001'
     │   ✓ Found: patient_id = uuid-123
     │
     ├─► 4. Match to Order (EHR DB)
     │   SELECT * FROM orders WHERE accession_number = 'ACC-2026-00001'
     │   ✓ Found: order_id = uuid-456
     │
     ├─► 5. Upload to Orthanc
     │   POST http://orthanc:8042/instances
     │   Content-Type: application/dicom
     │   Body: <binary DICOM file>
     │
     │   ┌─────────────────────────────┐
     │   │  Orthanc PACS              │
     │   ├─────────────────────────────┤
     │   │  • Parses DICOM            │
     │   │  • Stores in PostgreSQL    │
     │   │  • Returns OrthancStudyID  │
     │   └─────────────────────────────┘
     │
     │   Response: { "ID": "a3f2c1b5...", "Status": "Success" }
     │
     ├─► 6. Update Order (EHR DB)
     │   UPDATE orders SET
     │     study_instance_uid = '1.2.840...',
     │     orthanc_study_id = 'a3f2c1b5...',
     │     number_of_images = 150,
     │     uploaded_at = NOW()
     │   WHERE id = 'uuid-456'
     │
     ├─► 7. Create Upload Log (EHR DB)
     │   INSERT INTO dicom_upload_logs (
     │     patient_id, order_id, study_instance_uid,
     │     orthanc_study_id, uploaded_by_id, ...
     │   )
     │
     └─► 8. Return Success
         { "success": true, "message": "Study uploaded" }
```

### View Workflow

```
┌──────────┐
│  User    │ Clicks "View Images" button
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────┐
│  Frontend: Order Detail Page         │
└────┬─────────────────────────────────┘
     │
     ├─► GET /api/v1/dicom/viewer-url/{order_id}
     │
     ▼
┌──────────────────────────────────────┐
│  Backend: Generate Viewer URL        │
└────┬─────────────────────────────────┘
     │
     ├─► 1. Fetch Order (EHR DB)
     │   SELECT * FROM orders WHERE id = 'uuid-456'
     │   study_uid = '1.2.840.113619...'
     │
     ├─► 2. Build OHIF URL
     │   url = f"http://localhost:3001/viewer?StudyInstanceUIDs={study_uid}"
     │
     └─► 3. Return URL
         { "viewer_url": "http://localhost:3001/viewer?..." }
     
     ▼
┌──────────────────────────────────────┐
│  Frontend: Open OHIF Viewer          │
│  (iframe or new tab)                 │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│  OHIF Viewer: Query Orthanc          │
│  (DICOMweb Protocol)                 │
└────┬─────────────────────────────────┘
     │
     ├─► 1. QIDO-RS Query (Study)
     │   GET http://orthanc:8042/dicom-web/studies?StudyInstanceUID=1.2.840...
     │
     ├─► 2. QIDO-RS Query (Series)
     │   GET http://orthanc:8042/dicom-web/studies/{uid}/series
     │
     ├─► 3. WADO-RS Retrieve (Instances)
     │   GET http://orthanc:8042/dicom-web/studies/{uid}/series/{seriesuid}/instances/{instanceuid}/frames/1
     │
     └─► 4. Render Images
         • Display in viewport
         • Apply window/level
         • Enable tools (zoom, pan, measure)
```

---

## 🔐 Security Architecture

### Access Control Layers

```
┌───────────────────────────────────────────────────────────┐
│  Layer 1: Frontend Authentication                         │
│  • User logs in → JWT token                               │
│  • Token stored in localStorage                           │
│  • All API requests include token                         │
└─────────────────────┬─────────────────────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────────────────────┐
│  Layer 2: Backend API Authorization                       │
│  • Verify JWT token                                       │
│  • Check user role (doctor, nurse, radiologist)          │
│  • Audit log all DICOM operations                        │
└─────────────────────┬─────────────────────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────────────────────┐
│  Layer 3: Orthanc Basic Auth                              │
│  • Backend uses credentials: orthanc:orthanc              │
│  • Frontend CANNOT access Orthanc directly                │
│  • OHIF Viewer accesses via proxy or CORS                │
└─────────────────────┬─────────────────────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────────────────────┐
│  Layer 4: Database Access Control                         │
│  • Separate credentials for EHR DB and Orthanc DB        │
│  • No direct DB access from frontend                     │
│  • Connection pooling and limits                         │
└───────────────────────────────────────────────────────────┘
```

---

## 📈 Scalability & Performance

### Storage Estimates

```python
# Average DICOM study sizes
ct_study = 500 * 0.5 MB = 250 MB
xray_study = 2 * 5 MB = 10 MB
mri_study = 200 * 1 MB = 200 MB

# Monthly estimates (50 patients/day)
daily_imaging = 50 patients * 0.3 studies * 150 MB avg = 2.25 GB/day
monthly_storage = 2.25 GB * 30 = 67.5 GB/month
yearly_storage = 67.5 GB * 12 = 810 GB/year
```

### PostgreSQL Benefits for Orthanc

1. **Better Performance**
   - Faster queries than SQLite
   - Better concurrent access
   - Advanced indexing

2. **Scalability**
   - Handle millions of studies
   - No file size limits
   - Better for multi-server setup

3. **Backup & Replication**
   - Standard PostgreSQL backup tools
   - Point-in-time recovery
   - Streaming replication

4. **Production Ready**
   - ACID compliance
   - Connection pooling
   - Better resource management

---

## 🚀 Deployment Commands

### Start All Services

```bash
# Start containers
docker-compose up -d

# Check status
docker-compose ps

# Expected output:
# ehr_postgres           running   5433->5432
# ehr_orthanc_postgres   running   5434->5432
# ehr_orthanc            running   8042->8042, 4242->4242
# ehr_ohif               running   3001->80
```

### Access URLs

```bash
# Orthanc Web UI
http://localhost:8042
# Credentials: orthanc / orthanc

# Orthanc REST API
http://localhost:8042/system

# OHIF Viewer
http://localhost:3001

# EHR Backend API
http://localhost:8000/docs

# EHR Frontend
http://localhost:3000
```

### Database Connections

```bash
# Connect to EHR PostgreSQL
psql -h localhost -p 5433 -U ehr_user -d ehr_db

# Connect to Orthanc PostgreSQL
psql -h localhost -p 5434 -U orthanc -d orthanc

# View Orthanc tables
\dt
# Expected: DicomIdentifiers, MainDicomTags, Resources, AttachedFiles, etc.
```

---

## 📝 Summary

### ✅ What We Have

1. **Three Docker Containers:**
   - ✅ EHR PostgreSQL (business data)
   - ✅ Orthanc PostgreSQL (DICOM storage)
   - ✅ Orthanc PACS (DICOM server)
   - ✅ OHIF Viewer (web viewer)

2. **Two PostgreSQL Databases:**
   - ✅ Separate databases for EHR and Orthanc
   - ✅ No binary DICOM data in EHR database
   - ✅ All images in Orthanc PostgreSQL

3. **Bridge Keys:**
   - ✅ StudyInstanceUID
   - ✅ OrthancStudyID
   - ✅ PatientID = MRN
   - ✅ AccessionNumber

4. **Access Paths:**
   - ✅ Backend → Orthanc (REST API)
   - ✅ OHIF → Orthanc (DICOMweb)
   - ✅ Frontend → Backend (REST API)

### 🎯 Benefits

- **Separation of Concerns**: EHR logic separate from DICOM storage
- **PostgreSQL Performance**: Better than SQLite for production
- **Standard DICOM**: Orthanc handles all DICOM protocols
- **Scalable**: Each component can scale independently
- **Backup Friendly**: Standard PostgreSQL backup tools work
- **OHIF Integration**: Direct DICOMweb access to Orthanc

---

*Ready for Phase 5 implementation!*
