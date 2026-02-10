# Phase 5: DICOM Integration & Medical Imaging

**Phase:** 5  
**Estimated Time:** 4-5 weeks  
**Prerequisites:** Phase 4 Complete, Orthanc PACS Running

---

## 1. Overview

Implement complete DICOM medical imaging solution using Orthanc PACS, including manual DICOM upload, tag reading/modification, image storage, and web-based viewing with OHIF Viewer.

---

## 2. Objectives

- Integrate Orthanc PACS for DICOM storage
- Implement manual DICOM file upload
- Read and modify DICOM tags
- Link DICOM studies to patients and imaging orders
- Embed OHIF Viewer for web-based image viewing
- Enable image comparison and reporting
- Support radiology workflow

---

## 3. Key Features

### 3.1 DICOM Upload
- Manual upload of DICOM files (.dcm)
- Bulk upload (zip files with DICOM studies)
- Drag-and-drop interface
- Upload progress tracking
- Validation of DICOM format
- Automatic parsing of DICOM tags

### 3.2 DICOM Tag Management
- Read DICOM tags (Patient Name, ID, StudyDate, etc.)
- Modify tags before upload
- Map patient MRN to DICOM PatientID
- Map accession number to DICOM AccessionNumber
- Anonymization options
- Tag validation

### 3.3 Image Storage & Retrieval
- Store DICOM in Orthanc PACS
- Query studies by patient
- Query studies by accession number
- Retrieve study metadata
- Download DICOM files
- Delete studies (with authorization)

### 3.4 Image Viewing
- Embedded OHIF Viewer
- Multi-planar reconstruction (MPR)
- Window/Level adjustment
- Measurements and annotations
- Study comparison (side-by-side)
- Full-screen viewing
- Image sharing/export

---

## 4. Sub-Phases

### Phase 5A: Orthanc Integration (1 week)

#### Backend Setup
- Orthanc Python client integration
- Orthanc API wrapper service
- DICOM upload endpoint
- DICOM query endpoints
- Tag reading service
- Tag modification service

#### Features
- Upload DICOM to Orthanc
- Query studies from Orthanc
- Retrieve study metadata
- Delete studies
- Health check for Orthanc connection

#### Configuration
- Orthanc URL configuration
- Authentication setup
- DICOM storage limits
- Backup configuration

---

### Phase 5B: DICOM Upload UI (1.5 weeks)

#### Pages
- **DicomUpload.tsx** - Main upload page
- **DicomPreview.tsx** - Preview before upload
- **DicomTagEditor.tsx** - Edit DICOM tags

#### Components
- **FileDropzone.tsx** - Drag-and-drop file upload
- **DicomTagsTable.tsx** - Display DICOM tags
- **PatientMatcher.tsx** - Match DICOM to patient
- **AccessionMatcher.tsx** - Match to imaging order
- **UploadProgress.tsx** - Upload progress bar

#### Features
- Drag-and-drop DICOM files
- Parse and display tags
- Edit Patient ID, Name, StudyDate
- Map to existing patient by MRN
- Map to imaging order by accession number
- Bulk upload with progress
- Upload history/log

---

### Phase 5C: OHIF Viewer Integration (1.5 weeks)

#### Backend
- OHIF DICOMweb proxy configuration
- Study URL generation
- Token-based access control
- Study access logging

#### Frontend
- **ImageViewer.tsx** - OHIF iframe wrapper
- **StudyList.tsx** - List studies per patient
- **StudyComparison.tsx** - Compare multiple studies

#### Features
- Embed OHIF Viewer
- Launch viewer from order detail
- Launch viewer from patient imaging history
- Full-screen viewing
- Study comparison
- Print/Export functionality

#### OHIF Configuration
- Configure Orthanc as DICOMweb source
- Custom viewer layout
- Toolbar customization
- Measurement tools enabled

---

## 5. Technology Stack

### DICOM Components
- **Orthanc**: Open-source PACS (already in docker-compose)
- **pydicom**: Python library for DICOM parsing
- **httpx**: Async HTTP client for Orthanc API
- **OHIF Viewer**: Web-based DICOM viewer

### Orthanc Features Used
- DICOM storage (C-STORE)
- DICOMweb (WADO-RS, QIDO-RS, STOW-RS)
- REST API for queries
- Study/Series/Instance hierarchy
- SQLite/PostgreSQL storage

---

## 6. Data Model Updates

### ImagingOrder Model (Phase 4 - Add Fields)

```python
class ImagingOrder(BaseModel):
    # ... existing fields ...
    
    # DICOM Integration (Phase 5)
    study_instance_uid = String(64)  # DICOM StudyInstanceUID
    orthanc_study_id = String(64)  # Orthanc internal ID
    number_of_series = Integer
    number_of_images = Integer
    study_date = Date
    study_time = Time
    
    # Upload Information
    uploaded_by = UUID  # FK to users
    uploaded_at = DateTime
    upload_source = String  # manual, modality, cd_import
```

### DicomUploadLog Model

```python
class DicomUploadLog(BaseModel):
    __tablename__ = "dicom_upload_logs"
    
    # Relationships
    patient_id = UUID  # FK to patients
    imaging_order_id = UUID  # FK to imaging_orders (optional)
    uploaded_by = UUID  # FK to users
    
    # DICOM Information
    study_instance_uid = String(64)
    orthanc_study_id = String(64)
    number_of_files = Integer
    total_size_mb = Float
    
    # Original Tags
    original_patient_id = String
    original_patient_name = String
    original_accession_number = String
    
    # Modified Tags (if any)
    modified_patient_id = String
    modified_patient_name = String
    modified_accession_number = String
    
    # Status
    upload_status = String  # success, failed, partial
    error_message = Text
    
    # Metadata
    uploaded_at = DateTime
    file_names = JSON  # List of uploaded files
```

---

## 7. DICOM Tag Mapping

### Critical Tags to Manage

| DICOM Tag | Tag Number | Description | EHR Mapping |
|-----------|------------|-------------|-------------|
| PatientID | (0010,0020) | Patient identifier | Patient MRN |
| PatientName | (0010,0010) | Patient name | Full name |
| PatientBirthDate | (0010,0030) | DOB | Date of birth |
| PatientSex | (0010,0040) | Gender | Gender |
| AccessionNumber | (0008,0050) | Order identifier | Accession number |
| StudyInstanceUID | (0020,000D) | Unique study ID | Study UID |
| StudyDate | (0008,0020) | Study date | Performed date |
| StudyTime | (0008,0030) | Study time | Performed time |
| StudyDescription | (0008,1030) | Study description | Procedure name |
| Modality | (0008,0060) | Imaging modality | Order modality |
| InstitutionName | (0008,0080) | Facility name | Clinic name |

---

## 8. API Endpoints

### DICOM Upload Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/dicom/upload | Upload DICOM files |
| POST | /api/v1/dicom/upload/bulk | Upload zip file with DICOM |
| POST | /api/v1/dicom/validate | Validate DICOM files |
| POST | /api/v1/dicom/modify-tags | Modify DICOM tags |

### DICOM Query Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/dicom/studies | List all studies |
| GET | /api/v1/dicom/studies/patient/{id} | Patient's studies |
| GET | /api/v1/dicom/studies/{uid} | Get study by UID |
| GET | /api/v1/dicom/studies/accession/{acc} | Get study by accession |

### DICOM Metadata Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/dicom/tags/{study_uid} | Get DICOM tags |
| GET | /api/v1/dicom/preview/{study_uid} | Get thumbnail |

### DICOM Management Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | /api/v1/dicom/studies/{uid} | Delete study |
| GET | /api/v1/dicom/download/{uid} | Download study |

### OHIF Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/dicom/viewer/{study_uid} | Get viewer URL |
| GET | /api/v1/dicom/viewer-token | Generate viewer token |

---

## 9. Implementation Details

### 9.1 Orthanc Python Client

File: `backend/app/services/orthanc_service.py`

```python
import httpx
from typing import List, Dict, Optional
from app.core.config import settings

class OrthancService:
    def __init__(self):
        self.base_url = settings.ORTHANC_URL
        self.auth = (settings.ORTHANC_USERNAME, settings.ORTHANC_PASSWORD)
    
    async def upload_dicom(self, file_content: bytes) -> Dict:
        """Upload DICOM file to Orthanc"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/instances",
                content=file_content,
                auth=self.auth
            )
            return response.json()
    
    async def get_study(self, study_uid: str) -> Optional[Dict]:
        """Get study metadata"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/studies/{study_uid}",
                auth=self.auth
            )
            if response.status_code == 200:
                return response.json()
            return None
    
    async def query_patient_studies(self, patient_id: str) -> List[Dict]:
        """Query studies for a patient"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/tools/find",
                json={
                    "Level": "Study",
                    "Query": {"PatientID": patient_id}
                },
                auth=self.auth
            )
            return response.json()
    
    async def delete_study(self, study_uid: str) -> bool:
        """Delete study from Orthanc"""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/studies/{study_uid}",
                auth=self.auth
            )
            return response.status_code == 200
```

---

### 9.2 DICOM Tag Service

File: `backend/app/services/dicom_tag_service.py`

```python
import pydicom
from typing import Dict, Any
from io import BytesIO

class DicomTagService:
    @staticmethod
    def read_tags(file_content: bytes) -> Dict[str, Any]:
        """Read DICOM tags from file"""
        ds = pydicom.dcmread(BytesIO(file_content))
        
        return {
            "PatientID": str(ds.PatientID) if "PatientID" in ds else None,
            "PatientName": str(ds.PatientName) if "PatientName" in ds else None,
            "PatientBirthDate": str(ds.PatientBirthDate) if "PatientBirthDate" in ds else None,
            "PatientSex": str(ds.PatientSex) if "PatientSex" in ds else None,
            "AccessionNumber": str(ds.AccessionNumber) if "AccessionNumber" in ds else None,
            "StudyInstanceUID": str(ds.StudyInstanceUID) if "StudyInstanceUID" in ds else None,
            "StudyDate": str(ds.StudyDate) if "StudyDate" in ds else None,
            "StudyTime": str(ds.StudyTime) if "StudyTime" in ds else None,
            "StudyDescription": str(ds.StudyDescription) if "StudyDescription" in ds else None,
            "Modality": str(ds.Modality) if "Modality" in ds else None,
        }
    
    @staticmethod
    def modify_tags(file_content: bytes, modifications: Dict[str, str]) -> bytes:
        """Modify DICOM tags and return new file content"""
        ds = pydicom.dcmread(BytesIO(file_content))
        
        # Apply modifications
        for tag, value in modifications.items():
            if hasattr(ds, tag):
                setattr(ds, tag, value)
        
        # Save to bytes
        output = BytesIO()
        ds.save_as(output)
        return output.getvalue()
    
    @staticmethod
    def validate_dicom(file_content: bytes) -> bool:
        """Validate if file is valid DICOM"""
        try:
            pydicom.dcmread(BytesIO(file_content))
            return True
        except:
            return False
```

---

### 9.3 OHIF Viewer Integration

Frontend: `frontend/src/pages/imaging/ImageViewer.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spin } from 'antd';

const ImageViewer = () => {
  const { studyUid } = useParams<{ studyUid: string }>();
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Build OHIF viewer URL
    const orthancUrl = 'http://localhost:8042';
    const ohifUrl = `http://localhost:3001/viewer?StudyInstanceUIDs=${studyUid}`;
    
    setViewerUrl(ohifUrl);
    setLoading(false);
  }, [studyUid]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading viewer..." />
      </div>
    );
  }

  return (
    <iframe
      src={viewerUrl}
      style={{
        width: '100%',
        height: 'calc(100vh - 64px)',
        border: 'none',
      }}
      title="DICOM Viewer"
    />
  );
};

export default ImageViewer;
```

---

## 10. Upload Workflow

### UI Flow
1. User clicks "Upload DICOM" in imaging order detail
2. Drag-and-drop DICOM files or select files
3. System reads DICOM tags
4. Shows preview with tags
5. User can edit PatientID, AccessionNumber
6. Auto-match to patient by MRN
7. Auto-match to imaging order by accession
8. User confirms
9. System uploads to Orthanc
10. Links study to patient and order
11. Success message with "View Images" button

### Backend Flow
1. Receive DICOM file
2. Validate DICOM format
3. Read tags with pydicom
4. Apply tag modifications if requested
5. Upload to Orthanc via REST API
6. Receive Orthanc Study ID
7. Create DicomUploadLog
8. Update ImagingOrder with study UID
9. Return success response

---

## 11. OHIF Viewer Setup

### Docker Compose Addition

```yaml
  ohif_viewer:
    image: ohif/viewer:latest
    ports:
      - "3001:80"
    environment:
      - APP_CONFIG=/usr/share/nginx/html/app-config.js
    volumes:
      - ./ohif-config.js:/usr/share/nginx/html/app-config.js
```

### OHIF Configuration

File: `ohif-config.js`

```javascript
window.config = {
  routerBasename: '/',
  servers: {
    dicomWeb: [
      {
        name: 'Orthanc',
        wadoUriRoot: 'http://localhost:8042/wado',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
  },
};
```

---

## 12. Verification Checklist

### Phase 5A
- [ ] Orthanc Python client working
- [ ] Can upload DICOM to Orthanc
- [ ] Can query studies from Orthanc
- [ ] Can read DICOM tags with pydicom
- [ ] Can modify DICOM tags
- [ ] Can delete studies
- [ ] Orthanc health check working

### Phase 5B
- [ ] DICOM upload page created
- [ ] Drag-and-drop works
- [ ] File validation works
- [ ] Tags display correctly
- [ ] Tag editing works
- [ ] Patient matching works
- [ ] Order matching works
- [ ] Upload progress displays
- [ ] Upload log created

### Phase 5C
- [ ] OHIF Viewer running
- [ ] Viewer URL generated correctly
- [ ] Can launch viewer from order detail
- [ ] Images display in viewer
- [ ] Window/Level tools work
- [ ] Measurements work
- [ ] Full-screen mode works
- [ ] Study comparison works

---

## 13. Testing Scenarios

### Upload Test
1. Download sample DICOM files
2. Go to imaging order detail
3. Click "Upload DICOM"
4. Drag-and-drop files
5. Review tags
6. Edit PatientID to match MRN
7. Edit AccessionNumber to match order
8. Upload
9. Verify upload success
10. Click "View Images"
11. OHIF Viewer opens with images

### Query Test
1. Go to patient detail
2. Click "Imaging Studies" tab
3. See list of studies
4. Click "View" on a study
5. OHIF Viewer launches
6. Images display correctly

---

## 14. Success Criteria

- Upload DICOM files in < 30 seconds
- Tag reading automatic and accurate
- Patient/Order matching > 90% automatic
- OHIF Viewer launches in < 5 seconds
- Images render without artifacts
- Complete radiology workflow supported
- System handles studies up to 1000 images

---

## 15. Security Considerations

- DICOM upload requires authentication
- Access control for viewing images
- Audit log for DICOM uploads/deletions
- Secure Orthanc credentials
- HTTPS for production
- PHI protection in DICOM tags

---

## 16. Future Enhancements

- DICOM modality worklist (MWL)
- C-STORE from imaging devices
- Automatic anonymization
- Advanced viewer features
- 3D reconstruction
- AI integration for findings detection
- DICOM SR (Structured Reporting)
- Mobile DICOM viewer
- Cloud storage integration

---

## 17. Next Phase

After Phase 5 completion, proceed to **Phase 6: Discharge & Clinical Summaries**
- Discharge summary generation
- Follow-up scheduling
- Visit closure
- Report generation

---

*End of Phase 5 Overview*
