# Phase 5: DICOM Integration & Medical Imaging - Implementation Plan

**Status:** 🟢 Ready to Start  
**Estimated Duration:** 4-5 weeks  
**Prerequisites:** Phase 4 Complete ✅, Orthanc PACS Running

---

## Overview

Implement complete **DICOM medical imaging solution** using Orthanc PACS. Support manual DICOM upload, tag reading/modification, image storage, web-based viewing with OHIF Viewer, and integration with existing imaging orders system.

**Key Capabilities:**
- Upload DICOM files manually (drag-and-drop)
- Parse and modify DICOM tags
- Link DICOM studies to patients and imaging orders
- View images in embedded OHIF Viewer
- Support radiology workflow (order → upload → view → report)

---

## Phase 5 Sub-Phases Structure

```
Phase 5A: Orthanc Integration Backend (7-8 days)    🔵 Orthanc API, DICOM Services, Upload/Query
Phase 5B: DICOM Upload Frontend (7-9 days)          🔵 Upload UI, Tag Editor, Patient Matching
Phase 5C: OHIF Viewer Integration (6-8 days)        🔵 Viewer Embed, Study List, Comparison
Phase 5D: Integration & Testing (3-4 days)          🔵 E2E Testing, Performance, Security
```

**Total Duration:** 23-29 days (4-5 weeks)

---

## Technology Stack

### Backend Dependencies
```python
# Add to backend/requirements.txt
pydicom==2.4.4          # DICOM parsing and modification
httpx==0.25.2           # Async HTTP client for Orthanc API
python-multipart==0.0.6 # File upload support
pillow==10.1.0          # Image thumbnail generation
```

### Frontend Dependencies
```json
// Add to frontend/package.json
"react-dropzone": "^14.2.3",        // Drag-and-drop file upload
"@ohif/viewer": "^3.7.0",           // OHIF Viewer (optional embed)
"jszip": "^3.10.1",                 // ZIP file handling
"dcmjs": "^0.29.0"                  // DICOM parsing in browser
```

### Infrastructure
- **Orthanc PACS**: Already in docker-compose.yml
- **OHIF Viewer**: Add to docker-compose.yml
- **DICOMweb**: Orthanc DICOMweb plugin enabled

---

## Database Schema Updates

### Order Model Updates (Phase 4 → Phase 5)

```python
# backend/app/models/order.py

class Order(BaseModel):
    # ... existing Phase 4 fields ...
    
    # DICOM Integration Fields (Phase 5)
    study_instance_uid: Optional[str] = Field(None, max_length=64)
    orthanc_study_id: Optional[str] = Field(None, max_length=64)
    number_of_series: Optional[int] = None
    number_of_images: Optional[int] = None
    study_date: Optional[date] = None
    study_time: Optional[time] = None
    
    # Upload Information
    uploaded_by_id: Optional[UUID] = Field(None, foreign_key="users.id")
    uploaded_at: Optional[datetime] = None
    upload_source: Optional[str] = Field(None, max_length=20)  # manual, modality, cd_import
    
    # Relationships
    uploaded_by: Optional["User"] = Relationship(back_populates="uploaded_studies")
    dicom_uploads: List["DicomUploadLog"] = Relationship(back_populates="order")
```

### New DicomUploadLog Model

```python
# backend/app/models/dicom_upload_log.py

class DicomUploadLog(BaseModel):
    __tablename__ = "dicom_upload_logs"
    
    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Relationships
    patient_id: UUID = Field(foreign_key="patients.id")
    order_id: Optional[UUID] = Field(None, foreign_key="orders.id")
    uploaded_by_id: UUID = Field(foreign_key="users.id")
    
    # DICOM Study Information
    study_instance_uid: str = Field(max_length=64, unique=True, index=True)
    orthanc_study_id: str = Field(max_length=64, index=True)
    
    # File Information
    number_of_files: int
    total_size_bytes: int
    file_names: dict = Field(default={}, sa_column=Column(JSON))  # List of filenames
    
    # Original DICOM Tags (before modification)
    original_patient_id: Optional[str] = Field(None, max_length=64)
    original_patient_name: Optional[str] = Field(None, max_length=255)
    original_accession_number: Optional[str] = Field(None, max_length=64)
    original_study_date: Optional[str] = Field(None, max_length=8)
    original_modality: Optional[str] = Field(None, max_length=16)
    
    # Modified Tags (if modified before upload)
    modified_patient_id: Optional[str] = Field(None, max_length=64)
    modified_patient_name: Optional[str] = Field(None, max_length=255)
    modified_accession_number: Optional[str] = Field(None, max_length=64)
    tags_modified: bool = Field(default=False)
    
    # Upload Status
    upload_status: str = Field(max_length=20)  # success, failed, partial
    error_message: Optional[str] = Field(None, sa_column=Column(Text))
    
    # Metadata
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    upload_source: str = Field(max_length=20)  # manual, api, cd_import
    upload_duration_seconds: Optional[float] = None
    
    # Soft Delete
    is_deleted: bool = Field(default=False)
    
    # Relationships
    patient: Optional["Patient"] = Relationship(back_populates="dicom_uploads")
    order: Optional["Order"] = Relationship(back_populates="dicom_uploads")
    uploaded_by: Optional["User"] = Relationship(back_populates="dicom_uploads")
```

### Alembic Migration

```python
# backend/alembic/versions/xxx_add_dicom_integration.py

def upgrade():
    # Add DICOM fields to orders table
    op.add_column('orders', sa.Column('study_instance_uid', sa.String(64), nullable=True))
    op.add_column('orders', sa.Column('orthanc_study_id', sa.String(64), nullable=True))
    op.add_column('orders', sa.Column('number_of_series', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('number_of_images', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('study_date', sa.Date(), nullable=True))
    op.add_column('orders', sa.Column('study_time', sa.Time(), nullable=True))
    op.add_column('orders', sa.Column('uploaded_by_id', sa.UUID(), nullable=True))
    op.add_column('orders', sa.Column('uploaded_at', sa.DateTime(), nullable=True))
    op.add_column('orders', sa.Column('upload_source', sa.String(20), nullable=True))
    
    # Create dicom_upload_logs table
    op.create_table(
        'dicom_upload_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=True),
        sa.Column('uploaded_by_id', sa.UUID(), nullable=False),
        sa.Column('study_instance_uid', sa.String(64), nullable=False),
        sa.Column('orthanc_study_id', sa.String(64), nullable=False),
        sa.Column('number_of_files', sa.Integer(), nullable=False),
        sa.Column('total_size_bytes', sa.Integer(), nullable=False),
        sa.Column('file_names', sa.JSON(), nullable=True),
        sa.Column('original_patient_id', sa.String(64), nullable=True),
        sa.Column('original_patient_name', sa.String(255), nullable=True),
        sa.Column('original_accession_number', sa.String(64), nullable=True),
        sa.Column('original_study_date', sa.String(8), nullable=True),
        sa.Column('original_modality', sa.String(16), nullable=True),
        sa.Column('modified_patient_id', sa.String(64), nullable=True),
        sa.Column('modified_patient_name', sa.String(255), nullable=True),
        sa.Column('modified_accession_number', sa.String(64), nullable=True),
        sa.Column('tags_modified', sa.Boolean(), nullable=False, default=False),
        sa.Column('upload_status', sa.String(20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.Column('upload_source', sa.String(20), nullable=False),
        sa.Column('upload_duration_seconds', sa.Float(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id']),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id'])
    )
    
    # Add indexes
    op.create_index('ix_dicom_upload_logs_study_uid', 'dicom_upload_logs', ['study_instance_uid'])
    op.create_index('ix_dicom_upload_logs_orthanc_id', 'dicom_upload_logs', ['orthanc_study_id'])
    op.create_index('ix_dicom_upload_logs_patient_id', 'dicom_upload_logs', ['patient_id'])
    op.create_index('ix_dicom_upload_logs_order_id', 'dicom_upload_logs', ['order_id'])
```

---

## Sub-Phase Breakdown

### Phase 5A: Orthanc Integration Backend (7-8 days)

**Deliverables:**
1. Orthanc client service
2. DICOM tag service (read/modify with pydicom)
3. DICOM upload endpoint
4. DICOM query endpoints
5. Study management endpoints
6. Configuration management

**Files Created:** 8-10 backend files

**Details:** See [PHASE5A_ORTHANC_BACKEND.md](./PHASE5A_ORTHANC_BACKEND.md)

---

### Phase 5B: DICOM Upload Frontend (7-9 days)

**Deliverables:**
1. DICOM upload page with drag-and-drop
2. DICOM tag preview/editor
3. Patient matching interface
4. Order matching interface
5. Upload progress tracking
6. Upload history list

**Files Created:** 8-10 frontend files

**Details:** See [PHASE5B_UPLOAD_FRONTEND.md](./PHASE5B_UPLOAD_FRONTEND.md)

---

### Phase 5C: OHIF Viewer Integration (6-8 days)

**Deliverables:**
1. OHIF Viewer Docker setup
2. Viewer iframe component
3. Study list page
4. Launch viewer from order detail
5. Study comparison interface
6. Viewer access control

**Files Created:** 6-8 frontend files + Docker config

**Details:** See [PHASE5C_OHIF_VIEWER.md](./PHASE5C_OHIF_VIEWER.md)

---

### Phase 5D: Integration & Testing (3-4 days)

**Deliverables:**
1. End-to-end workflow testing
2. Sample DICOM files upload
3. Performance testing (large studies)
4. Security audit
5. User documentation
6. Integration test report

**Details:** See [PHASE5D_INTEGRATION_TESTING.md](./PHASE5D_INTEGRATION_TESTING.md)

---

## API Endpoints Summary

### DICOM Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/dicom/upload` | Upload single DICOM file |
| POST | `/api/v1/dicom/upload-multiple` | Upload multiple DICOM files |
| POST | `/api/v1/dicom/upload-zip` | Upload ZIP containing DICOM files |
| POST | `/api/v1/dicom/validate` | Validate DICOM file |

### DICOM Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/dicom/read-tags` | Read DICOM tags from file |
| POST | `/api/v1/dicom/modify-tags` | Modify DICOM tags |
| GET | `/api/v1/dicom/tags/{study_uid}` | Get tags for study |

### Study Query
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dicom/studies` | List all studies |
| GET | `/api/v1/dicom/studies/{study_uid}` | Get study details |
| GET | `/api/v1/dicom/studies/patient/{patient_id}` | Get patient studies |
| GET | `/api/v1/dicom/studies/order/{order_id}` | Get order studies |
| GET | `/api/v1/dicom/studies/accession/{accession}` | Find by accession number |

### Study Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/api/v1/dicom/studies/{study_uid}` | Delete study |
| GET | `/api/v1/dicom/download/{study_uid}` | Download study as ZIP |
| GET | `/api/v1/dicom/thumbnail/{study_uid}` | Get study thumbnail |

### OHIF Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dicom/viewer-url/{study_uid}` | Get OHIF viewer URL |
| POST | `/api/v1/dicom/viewer-token` | Generate viewer access token |

### Upload History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dicom/uploads` | List all uploads |
| GET | `/api/v1/dicom/uploads/patient/{patient_id}` | Patient upload history |
| GET | `/api/v1/dicom/uploads/{upload_id}` | Get upload details |

**Total Endpoints:** 21

---

## DICOM Tag Mapping

### Critical Tags

| DICOM Tag | Tag ID | Description | EHR Field |
|-----------|--------|-------------|-----------|
| PatientID | (0010,0020) | Patient identifier | Patient MRN |
| PatientName | (0010,0010) | Patient full name | first_name + last_name |
| PatientBirthDate | (0010,0030) | Date of birth | date_of_birth |
| PatientSex | (0010,0040) | Gender | gender |
| AccessionNumber | (0008,0050) | Order identifier | accession_number |
| StudyInstanceUID | (0020,000D) | Unique study ID | study_instance_uid |
| StudyDate | (0008,0020) | Study date (YYYYMMDD) | study_date |
| StudyTime | (0008,0030) | Study time (HHMMSS) | study_time |
| StudyDescription | (0008,1030) | Study description | order_details |
| Modality | (0008,0060) | Imaging modality | modality (CT, MR, etc.) |
| InstitutionName | (0008,0080) | Facility name | "EHR Clinic" |
| ReferringPhysicianName | (0008,0090) | Ordering doctor | ordered_by.full_name |

### Modifiable Tags
Users can modify these tags before upload:
- PatientID → Match to EHR MRN
- PatientName → Match to EHR patient name
- AccessionNumber → Match to imaging order
- StudyDate → Correct if wrong

### Read-Only Tags
These tags are read but not modified:
- StudyInstanceUID (unique identifier)
- SeriesInstanceUID
- SOPInstanceUID
- Modality
- Institution

---

## Workflow Diagrams

### Upload Workflow
```
┌─────────────────────┐
│ User: Upload DICOM  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────┐
│ 1. Select DICOM Files   │
│    (Drag & Drop)        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 2. Validate DICOM       │
│    - Check format       │
│    - Check size         │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 3. Read DICOM Tags      │
│    (pydicom)            │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 4. Display Tag Preview  │
│    - PatientID          │
│    - PatientName        │
│    - AccessionNumber    │
│    - Modality           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 5. Auto-Match           │
│    - Find patient       │
│    - Find order         │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 6. User Confirms/Edits  │
│    (Edit tags if needed)│
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 7. Modify Tags          │
│    (if requested)       │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 8. Upload to Orthanc    │
│    (C-STORE)            │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 9. Update EHR Database  │
│    - Link to patient    │
│    - Link to order      │
│    - Create upload log  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 10. Success + View      │
│     Button              │
└─────────────────────────┘
```

### View Workflow
```
┌─────────────────────┐
│ User: View Images   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────┐
│ 1. Click "View Images"  │
│    (from order detail)  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 2. Generate Viewer URL  │
│    - StudyInstanceUID   │
│    - Access token       │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 3. Launch OHIF Viewer   │
│    (iframe or new tab)  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 4. OHIF Queries Orthanc │
│    (DICOMweb)           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 5. Display Images       │
│    - Window/Level       │
│    - MPR                │
│    - Measurements       │
└─────────────────────────┘
```

---

## Configuration

### Environment Variables

```bash
# backend/.env

# Orthanc Configuration
ORTHANC_URL=http://orthanc:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc
ORTHANC_DICOMWEB_URL=http://orthanc:8042/dicom-web

# OHIF Viewer
OHIF_VIEWER_URL=http://localhost:3001

# DICOM Upload Limits
MAX_DICOM_FILE_SIZE_MB=100
MAX_DICOM_FILES_PER_UPLOAD=500
MAX_UPLOAD_SIZE_MB=2048

# DICOM Storage
DICOM_STORAGE_PATH=/data/dicom
DICOM_BACKUP_ENABLED=true
DICOM_BACKUP_PATH=/backup/dicom
```

### Docker Compose Update

```yaml
# docker-compose.yml

services:
  # ... existing services ...
  
  # OHIF Viewer
  ohif-viewer:
    image: ohif/viewer:v3.7.0
    container_name: ehr_ohif
    ports:
      - "3001:80"
    environment:
      - APP_CONFIG=/usr/share/nginx/html/app-config.js
    volumes:
      - ./config/ohif-config.js:/usr/share/nginx/html/app-config.js:ro
    depends_on:
      - orthanc
    networks:
      - ehr-network
    restart: unless-stopped
```

### OHIF Configuration

```javascript
// config/ohif-config.js

window.config = {
  routerBasename: '/',
  showStudyList: true,
  servers: {
    dicomWeb: [
      {
        name: 'EHR Orthanc PACS',
        wadoUriRoot: 'http://localhost:8042/wado',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        requestOptions: {
          requestFromBrowser: true,
        },
      },
    ],
  },
  defaultDataSourceName: 'dicomweb',
};
```

---

## Sample DICOM Files for Testing

### Download Test Data

```bash
# Create test data directory
mkdir -p test-data/dicom

# Download sample DICOM files from Medical Connections
wget https://www.dicomserver.co.uk/DICOM/DICOM_sample.zip -O test-data/dicom/samples.zip

# Or use Orthanc sample database
docker exec ehr_orthanc wget https://www.orthanc-server.com/downloads/test-data/PatientSample1.zip
```

### Test DICOM Structure

```
test-data/
├── dicom/
│   ├── CT/
│   │   ├── study1/
│   │   │   ├── series1/
│   │   │   │   ├── CT001.dcm
│   │   │   │   ├── CT002.dcm
│   │   │   │   └── ... (100 images)
│   ├── MR/
│   │   ├── brain_study/
│   │   │   ├── T1/
│   │   │   │   └── *.dcm (50 images)
│   │   │   ├── T2/
│   │   │   │   └── *.dcm (50 images)
│   ├── XRAY/
│   │   ├── chest_pa/
│   │   │   └── XRAY001.dcm
```

---

## Security Considerations

### Access Control
- DICOM upload: Requires `doctor` or `technician` role
- DICOM delete: Requires `admin` or `radiologist` role
- View images: Requires `doctor`, `nurse`, or `radiologist` role
- Modify tags: Requires authorization + audit log

### PHI Protection
- DICOM tags contain PHI (Patient Health Information)
- All uploads logged with user ID and timestamp
- Deletion requires reason + manager approval
- Audit trail for all DICOM operations

### Network Security
- Orthanc protected with username/password
- HTTPS required for production
- CORS configured for OHIF Viewer
- API rate limiting on upload endpoints

---

## Performance Requirements

### Upload Performance
- Single DICOM file (< 10 MB): < 5 seconds
- CT study (500 images, 500 MB): < 60 seconds
- MR study (200 images, 1 GB): < 90 seconds
- Progress bar updates every 10%

### Viewer Performance
- Study load time: < 10 seconds
- Image navigation: < 1 second between images
- Window/Level: Real-time (< 100ms)
- Measurement tools: Real-time

### Storage
- Estimated DICOM storage: 10-50 GB per month
- Compression enabled in Orthanc
- Backup strategy: Daily incremental, weekly full

---

## Testing Strategy

### Unit Tests
- DICOM tag reading (pydicom)
- Tag modification
- Orthanc API client methods
- File validation

### Integration Tests
- Upload → Orthanc → Database
- Query studies by patient
- Delete study (Orthanc + DB)
- OHIF viewer URL generation

### E2E Tests
- Complete upload workflow
- View images in OHIF
- Study comparison
- Download study

### Performance Tests
- Large study upload (1000 images)
- Concurrent uploads (5 users)
- Viewer load test

---

## Success Criteria

### Functional
- ✅ Upload DICOM files successfully
- ✅ Tags read accurately (>99%)
- ✅ Auto-matching works (>90% success)
- ✅ Images viewable in OHIF
- ✅ Study linked to patient and order
- ✅ Complete radiology workflow supported

### Performance
- ✅ Upload 100 images in < 30 seconds
- ✅ Viewer loads in < 10 seconds
- ✅ No image artifacts or rendering issues
- ✅ Support studies up to 1000 images

### Usability
- ✅ Intuitive drag-and-drop interface
- ✅ Clear upload progress indication
- ✅ Easy tag editing
- ✅ One-click image viewing

---

## Dependencies & Prerequisites

### Before Starting Phase 5A
- [ ] Phase 4 complete and tested
- [ ] Orthanc running (check docker-compose)
- [ ] Orthanc accessible at http://localhost:8042
- [ ] PostgreSQL has space for DICOM metadata
- [ ] Install pydicom: `pip install pydicom==2.4.4`
- [ ] Install httpx: `pip install httpx==0.25.2`

### Before Starting Phase 5B
- [ ] Phase 5A complete (backend API working)
- [ ] Install react-dropzone: `npm install react-dropzone`
- [ ] Sample DICOM files downloaded for testing
- [ ] Backend upload endpoint tested with Postman

### Before Starting Phase 5C
- [ ] Phase 5B complete (upload UI working)
- [ ] OHIF Viewer added to docker-compose
- [ ] OHIF accessible at http://localhost:3001
- [ ] Orthanc DICOMweb plugin enabled

---

## Timeline

| Sub-Phase | Duration | Start | End |
|-----------|----------|-------|-----|
| Phase 5A: Orthanc Backend | 7-8 days | Day 1 | Day 8 |
| Phase 5B: Upload Frontend | 7-9 days | Day 9 | Day 17 |
| Phase 5C: OHIF Viewer | 6-8 days | Day 18 | Day 25 |
| Phase 5D: Integration & Testing | 3-4 days | Day 26 | Day 29 |

**Total: 23-29 days (4-5 weeks)**

---

## Next Steps

1. **Review this plan** with team
2. **Verify Orthanc** is running: `docker ps | grep orthanc`
3. **Download test DICOM files**
4. **Start Phase 5A** - Create Orthanc integration backend
5. **Daily standups** to track progress

---

## Phase 6 Preview

After Phase 5 completion:
- **Phase 6: Discharge & Clinical Summaries**
- Discharge summary generation
- Follow-up appointments
- Visit closure workflow
- Clinical report generation

---

**Status:** 🟢 Ready to implement  
**Next:** [PHASE5A_ORTHANC_BACKEND.md](./PHASE5A_ORTHANC_BACKEND.md)

*End of Phase 5 Implementation Plan*
