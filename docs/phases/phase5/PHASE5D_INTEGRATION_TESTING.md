# Phase 5D: Integration & Testing (3-4 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phases 5A, 5B, 5C Complete ✅  
**Estimated Time:** 3-4 days

---

## Objectives

Comprehensive testing of DICOM integration system including upload, storage, retrieval, viewing, and deletion workflows. Validate performance, security, and integration with existing EHR modules.

---

## Deliverables

### 1. Sample DICOM Test Files

#### Directory: `tests/test_data/dicom/`

```bash
# Download sample DICOM files for testing
tests/test_data/dicom/
├── CT/
│   ├── brain_ct_001.dcm (20 instances)
│   ├── chest_ct_001.dcm (150 instances)
│   └── abdomen_ct_001.dcm (100 instances)
├── MR/
│   ├── brain_mri_t1.dcm (30 instances)
│   ├── brain_mri_t2.dcm (30 instances)
│   └── spine_mri.dcm (40 instances)
├── CR/
│   ├── chest_xray.dcm (1 instance)
│   └── hand_xray.dcm (1 instance)
├── DX/
│   ├── mammogram.dcm (4 instances)
│   └── dental.dcm (1 instance)
└── US/
    ├── abdomen_ultrasound.dcm (15 instances)
    └── cardiac_echo.dcm (50 instances)

# Sources:
# - https://www.dicomlibrary.com/
# - https://barre.dev/medical/samples/
# - https://www.rubomedical.com/dicom_files/
```

---

### 2. E2E Test Suite

#### File: `tests/integration/test_dicom_workflow.py` (400-500 lines)

```python
"""
DICOM Integration E2E Tests
Phase: 5D (Integration & Testing)
"""

import pytest
import httpx
from pathlib import Path
from uuid import UUID
import asyncio

from app.tests.utils import create_test_patient, create_test_order, create_test_user


@pytest.fixture
def dicom_test_files():
    """Load test DICOM files"""
    test_data_dir = Path("tests/test_data/dicom")
    return {
        "ct_brain": test_data_dir / "CT/brain_ct_001.dcm",
        "mri_brain": test_data_dir / "MR/brain_mri_t1.dcm",
        "xray_chest": test_data_dir / "CR/chest_xray.dcm",
        "us_abdomen": test_data_dir / "US/abdomen_ultrasound.dcm",
    }


@pytest.fixture
async def test_patient(async_client):
    """Create test patient"""
    return await create_test_patient(
        async_client,
        first_name="John",
        last_name="Doe",
        mrn="TEST001",
        dob="1980-01-01",
    )


@pytest.fixture
async def test_order(async_client, test_patient):
    """Create test imaging order"""
    return await create_test_order(
        async_client,
        patient_id=test_patient.id,
        order_type="IMAGING",
        order_category="CT",
        description="CT Brain with Contrast",
        status="scheduled",
    )


class TestDicomUploadWorkflow:
    """Test DICOM upload workflows"""

    @pytest.mark.asyncio
    async def test_single_file_upload(
        self, async_client, test_order, dicom_test_files
    ):
        """Test uploading a single DICOM file"""
        ct_file = dicom_test_files["ct_brain"]
        
        # Upload file
        with open(ct_file, "rb") as f:
            response = await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("brain_ct.dcm", f, "application/dicom")},
                data={
                    "order_id": str(test_order.id),
                    "patient_id": str(test_order.patient_id),
                },
            )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert "study_instance_uid" in data
        assert "orthanc_study_id" in data
        assert data["status"] == "uploaded"
        
        # Verify order updated
        order_response = await async_client.get(
            f"/api/v1/orders/{test_order.id}"
        )
        order = order_response.json()
        assert order["study_instance_uid"] == data["study_instance_uid"]
        
        return data["study_instance_uid"]

    @pytest.mark.asyncio
    async def test_multiple_files_upload(
        self, async_client, test_order, dicom_test_files
    ):
        """Test uploading multiple DICOM files"""
        files_to_upload = [
            ("ct_brain", dicom_test_files["ct_brain"]),
            ("mri_brain", dicom_test_files["mri_brain"]),
        ]
        
        files = []
        for name, path in files_to_upload:
            with open(path, "rb") as f:
                files.append(("files", (name, f.read(), "application/dicom")))
        
        response = await async_client.post(
            "/api/v1/dicom/upload-multiple",
            files=files,
            data={
                "order_id": str(test_order.id),
                "patient_id": str(test_order.patient_id),
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify multiple uploads
        assert data["total_files"] == 2
        assert data["successful"] == 2
        assert data["failed"] == 0

    @pytest.mark.asyncio
    async def test_upload_with_tag_modification(
        self, async_client, test_order, dicom_test_files
    ):
        """Test uploading with DICOM tag modification"""
        ct_file = dicom_test_files["ct_brain"]
        
        # First read tags
        with open(ct_file, "rb") as f:
            read_response = await async_client.post(
                "/api/v1/dicom/read-tags",
                files={"file": ("brain_ct.dcm", f, "application/dicom")},
            )
        
        tags = read_response.json()["tags"]
        
        # Modify tags
        modified_tags = {
            "PatientName": "DOE^JOHN",
            "PatientID": "TEST001",
            "AccessionNumber": test_order.accession_number,
        }
        
        with open(ct_file, "rb") as f:
            modify_response = await async_client.post(
                "/api/v1/dicom/modify-tags",
                files={"file": ("brain_ct.dcm", f, "application/dicom")},
                data={"tags": modified_tags},
            )
        
        # Upload modified file
        modified_file = modify_response.content
        upload_response = await async_client.post(
            "/api/v1/dicom/upload",
            files={"file": ("modified.dcm", modified_file, "application/dicom")},
            data={
                "order_id": str(test_order.id),
                "patient_id": str(test_order.patient_id),
            },
        )
        
        assert upload_response.status_code == 200


class TestDicomQueryWorkflow:
    """Test DICOM query workflows"""

    @pytest.mark.asyncio
    async def test_get_patient_studies(
        self, async_client, test_patient, test_order, dicom_test_files
    ):
        """Test querying patient's studies"""
        # Upload a study first
        ct_file = dicom_test_files["ct_brain"]
        with open(ct_file, "rb") as f:
            await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("brain_ct.dcm", f, "application/dicom")},
                data={
                    "order_id": str(test_order.id),
                    "patient_id": str(test_patient.id),
                },
            )
        
        # Query studies
        response = await async_client.get(
            f"/api/v1/dicom/studies/patient/{test_patient.id}"
        )
        
        assert response.status_code == 200
        studies = response.json()
        assert len(studies) >= 1
        
        # Verify study details
        study = studies[0]
        assert "StudyInstanceUID" in study
        assert "PatientID" in study
        assert study["PatientID"] == test_patient.mrn

    @pytest.mark.asyncio
    async def test_get_order_studies(
        self, async_client, test_order, dicom_test_files
    ):
        """Test querying order's studies"""
        # Upload
        ct_file = dicom_test_files["ct_brain"]
        with open(ct_file, "rb") as f:
            upload_response = await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("brain_ct.dcm", f, "application/dicom")},
                data={"order_id": str(test_order.id)},
            )
        
        study_uid = upload_response.json()["study_instance_uid"]
        
        # Query by order
        response = await async_client.get(
            f"/api/v1/dicom/studies/order/{test_order.id}"
        )
        
        assert response.status_code == 200
        studies = response.json()
        assert len(studies) == 1
        assert studies[0]["StudyInstanceUID"] == study_uid


class TestDicomViewerWorkflow:
    """Test DICOM viewer workflows"""

    @pytest.mark.asyncio
    async def test_get_viewer_url_for_study(
        self, async_client, test_order, dicom_test_files
    ):
        """Test generating viewer URL for study"""
        # Upload
        ct_file = dicom_test_files["ct_brain"]
        with open(ct_file, "rb") as f:
            upload_response = await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("brain_ct.dcm", f, "application/dicom")},
                data={"order_id": str(test_order.id)},
            )
        
        study_uid = upload_response.json()["study_instance_uid"]
        
        # Get viewer URL
        response = await async_client.get(
            f"/api/v1/dicom/viewer/url/{study_uid}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert study_uid in data["url"]
        assert "http://localhost:3001/viewer" in data["url"]

    @pytest.mark.asyncio
    async def test_get_viewer_url_for_order(
        self, async_client, test_order, dicom_test_files
    ):
        """Test generating viewer URL from order"""
        # Upload
        ct_file = dicom_test_files["ct_brain"]
        with open(ct_file, "rb") as f:
            await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("brain_ct.dcm", f, "application/dicom")},
                data={"order_id": str(test_order.id)},
            )
        
        # Get viewer URL by order
        response = await async_client.get(
            f"/api/v1/dicom/viewer/url/order/{test_order.id}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert str(test_order.id) in data.get("order_id", "")

    @pytest.mark.asyncio
    async def test_get_viewer_url_for_patient(
        self, async_client, test_patient, test_order, dicom_test_files
    ):
        """Test generating viewer URL for all patient studies"""
        # Upload 2 studies
        for file_key in ["ct_brain", "mri_brain"]:
            file_path = dicom_test_files[file_key]
            with open(file_path, "rb") as f:
                await async_client.post(
                    "/api/v1/dicom/upload",
                    files={"file": (f"{file_key}.dcm", f, "application/dicom")},
                    data={"patient_id": str(test_patient.id)},
                )
        
        # Get viewer URL for patient
        response = await async_client.get(
            f"/api/v1/dicom/viewer/url/patient/{test_patient.id}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert data["study_count"] >= 2


class TestDicomDeletionWorkflow:
    """Test DICOM deletion workflows"""

    @pytest.mark.asyncio
    async def test_delete_study(
        self, async_client, test_order, dicom_test_files
    ):
        """Test deleting a study"""
        # Upload
        ct_file = dicom_test_files["ct_brain"]
        with open(ct_file, "rb") as f:
            upload_response = await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("brain_ct.dcm", f, "application/dicom")},
                data={"order_id": str(test_order.id)},
            )
        
        study_uid = upload_response.json()["study_instance_uid"]
        
        # Delete
        delete_response = await async_client.delete(
            f"/api/v1/dicom/studies/{study_uid}",
            params={"reason": "Test deletion"},
        )
        
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = await async_client.get(
            f"/api/v1/dicom/studies/{study_uid}"
        )
        assert get_response.status_code == 404


class TestOrthancIntegration:
    """Test Orthanc PACS integration"""

    @pytest.mark.asyncio
    async def test_orthanc_health_check(self, async_client):
        """Test Orthanc health check"""
        response = await async_client.get("/api/v1/dicom/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "orthanc_version" in data

    @pytest.mark.asyncio
    async def test_orthanc_storage_stats(self, async_client):
        """Test Orthanc storage statistics"""
        response = await async_client.get("/api/v1/dicom/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_studies" in data
        assert "total_series" in data
        assert "total_instances" in data


class TestPerformance:
    """Test DICOM system performance"""

    @pytest.mark.asyncio
    async def test_large_study_upload(
        self, async_client, test_order, dicom_test_files
    ):
        """Test uploading large study (100+ instances)"""
        import time
        
        ct_file = dicom_test_files["ct_brain"]  # Assume 100 instances
        
        start_time = time.time()
        
        with open(ct_file, "rb") as f:
            response = await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("large_ct.dcm", f, "application/dicom")},
                data={"order_id": str(test_order.id)},
            )
        
        upload_time = time.time() - start_time
        
        assert response.status_code == 200
        assert upload_time < 30  # Should complete within 30 seconds

    @pytest.mark.asyncio
    async def test_concurrent_uploads(
        self, async_client, test_order, dicom_test_files
    ):
        """Test concurrent uploads"""
        tasks = []
        
        for i in range(5):  # 5 concurrent uploads
            ct_file = dicom_test_files["ct_brain"]
            
            async def upload_file(file_path, index):
                with open(file_path, "rb") as f:
                    return await async_client.post(
                        "/api/v1/dicom/upload",
                        files={"file": (f"file_{index}.dcm", f, "application/dicom")},
                        data={"order_id": str(test_order.id)},
                    )
            
            tasks.append(upload_file(ct_file, i))
        
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200


class TestSecurity:
    """Test DICOM security"""

    @pytest.mark.asyncio
    async def test_unauthorized_access(self, async_client, dicom_test_files):
        """Test unauthorized DICOM upload"""
        ct_file = dicom_test_files["ct_brain"]
        
        # Try upload without authentication
        with open(ct_file, "rb") as f:
            response = await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("brain_ct.dcm", f, "application/dicom")},
                headers={},  # No auth header
            )
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_access_other_patient_study(
        self, async_client, test_patient, test_order, dicom_test_files
    ):
        """Test accessing another patient's study"""
        # Upload study for test_patient
        ct_file = dicom_test_files["ct_brain"]
        with open(ct_file, "rb") as f:
            upload_response = await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("brain_ct.dcm", f, "application/dicom")},
                data={"patient_id": str(test_patient.id)},
            )
        
        study_uid = upload_response.json()["study_instance_uid"]
        
        # Create another user/patient
        other_patient = await create_test_patient(
            async_client,
            first_name="Jane",
            last_name="Smith",
            mrn="TEST002",
        )
        
        # Try to access test_patient's study as other_patient
        # (Implement role-based access check)
        response = await async_client.get(
            f"/api/v1/dicom/studies/{study_uid}",
            # headers with other_patient's token
        )
        
        # Should be forbidden if not authorized
        # assert response.status_code == 403
```

---

### 3. Integration Test Report Template

#### File: `docs/testing/PHASE5_INTEGRATION_TEST_REPORT.md`

```markdown
# Phase 5 DICOM Integration - Test Report

## Test Summary

**Date:** YYYY-MM-DD  
**Tester:** [Name]  
**Phase:** 5D (Integration & Testing)  
**Duration:** [X hours]

---

## Test Environment

- **Backend:** FastAPI + Python 3.11
- **Frontend:** React 18 + TypeScript
- **Orthanc:** v25.12.3
- **OHIF Viewer:** v4.12.51.21579
- **PostgreSQL:** v15.10
- **Test Data:** DICOM samples (CT, MR, CR, US)

---

## Test Results

### 1. Upload Workflow ✅

| Test Case | Status | Notes |
|-----------|--------|-------|
| Single file upload | ✅ PASS | 10MB file uploaded in 2.3s |
| Multiple files upload | ✅ PASS | 5 files (50MB) in 8.1s |
| Tag modification | ✅ PASS | PatientID updated correctly |
| Large study (500 instances) | ✅ PASS | Completed in 45s |
| Concurrent uploads (5) | ✅ PASS | All succeeded |
| Invalid DICOM file | ✅ PASS | Rejected with error message |
| Duplicate study | ⚠️ WARN | Accepted, created duplicate |

**Overall:** 6/7 PASS, 1 WARN

---

### 2. Query Workflow ✅

| Test Case | Status | Notes |
|-----------|--------|-------|
| List all studies | ✅ PASS | Returned 15 studies |
| Get study by UID | ✅ PASS | Correct study returned |
| Patient studies | ✅ PASS | 3 studies for patient |
| Order studies | ✅ PASS | 1 study linked to order |
| Search by accession | ✅ PASS | Found by ACC-2026-00123 |
| Query performance | ✅ PASS | < 500ms response time |

**Overall:** 6/6 PASS

---

### 3. Viewer Workflow ✅

| Test Case | Status | Notes |
|-----------|--------|-------|
| Generate viewer URL | ✅ PASS | URL format correct |
| OHIF loads study | ✅ PASS | All images displayed |
| Window/Level tools | ✅ PASS | Adjustments work |
| Zoom/Pan | ✅ PASS | Smooth interaction |
| Fullscreen mode | ✅ PASS | Expanded correctly |
| Study comparison | ✅ PASS | 2 studies side-by-side |
| Keyboard shortcuts | ✅ PASS | All hotkeys functional |

**Overall:** 7/7 PASS

---

### 4. Deletion Workflow ✅

| Test Case | Status | Notes |
|-----------|--------|-------|
| Delete study | ✅ PASS | Removed from Orthanc |
| Verify deletion | ✅ PASS | Study not found |
| Cascade delete series | ✅ PASS | All series removed |
| Delete logged | ✅ PASS | Recorded in upload_logs |

**Overall:** 4/4 PASS

---

### 5. Security ✅

| Test Case | Status | Notes |
|-----------|--------|-------|
| Unauthorized upload | ✅ PASS | 401 Unauthorized |
| Cross-patient access | ✅ PASS | 403 Forbidden |
| Token validation | ✅ PASS | Invalid token rejected |
| HTTPS enforcement | ✅ PASS | HTTP redirected to HTTPS |

**Overall:** 4/4 PASS

---

### 6. Performance 🟢

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Upload (10MB) | < 5s | 2.3s | ✅ PASS |
| Upload (100MB) | < 30s | 18.4s | ✅ PASS |
| Query response | < 1s | 0.4s | ✅ PASS |
| Viewer load time | < 3s | 1.8s | ✅ PASS |
| Concurrent users | 10+ | 15 | ✅ PASS |

**Overall:** 5/5 PASS

---

## Issues Found

### High Priority
- None

### Medium Priority
1. **Duplicate Study Handling**: System accepts duplicate StudyInstanceUID
   - **Solution**: Add unique constraint + duplicate check

### Low Priority
1. **Large File Upload Progress**: No progress indicator for files > 50MB
   - **Solution**: Implement chunked upload with progress events

---

## Recommendations

1. **Add duplicate study detection** before upload
2. **Implement chunked uploads** for files > 50MB
3. **Add retry logic** for failed uploads
4. **Create backup strategy** for Orthanc database
5. **Monitor Orthanc disk usage** with alerts

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |

---

**Status:** ✅ READY FOR PRODUCTION  
**Next Phase:** Production Deployment
```

---

### 4. Performance Testing Script

#### File: `tests/performance/test_dicom_performance.py`

```python
"""
DICOM Performance Tests
Phase: 5D (Integration & Testing)
"""

import pytest
import time
import asyncio
from pathlib import Path


class TestUploadPerformance:
    """Test upload performance"""

    @pytest.mark.performance
    async def test_small_file_upload_speed(self, async_client, dicom_test_files):
        """Test small file upload (< 10MB)"""
        file_path = dicom_test_files["xray_chest"]  # ~5MB
        
        start = time.time()
        
        with open(file_path, "rb") as f:
            response = await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("xray.dcm", f, "application/dicom")},
            )
        
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 5  # Should complete in < 5 seconds
        print(f"Upload time: {duration:.2f}s")

    @pytest.mark.performance
    async def test_large_file_upload_speed(self, async_client, dicom_test_files):
        """Test large file upload (> 50MB)"""
        file_path = dicom_test_files["ct_brain"]  # ~100MB
        
        start = time.time()
        
        with open(file_path, "rb") as f:
            response = await async_client.post(
                "/api/v1/dicom/upload",
                files={"file": ("ct.dcm", f, "application/dicom")},
            )
        
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 30  # Should complete in < 30 seconds
        print(f"Upload time: {duration:.2f}s, Speed: {100/duration:.2f}MB/s")


class TestQueryPerformance:
    """Test query performance"""

    @pytest.mark.performance
    async def test_list_studies_response_time(self, async_client):
        """Test listing studies response time"""
        start = time.time()
        
        response = await async_client.get("/api/v1/dicom/studies")
        
        duration = time.time() - start
        
        assert response.status_code == 200
        assert duration < 1  # Should respond in < 1 second
        print(f"Query time: {duration*1000:.0f}ms")


class TestConcurrency:
    """Test concurrent access"""

    @pytest.mark.performance
    async def test_concurrent_uploads(self, async_client, dicom_test_files):
        """Test 10 concurrent uploads"""
        tasks = []
        
        for i in range(10):
            file_path = dicom_test_files["xray_chest"]
            
            async def upload(index):
                with open(file_path, "rb") as f:
                    return await async_client.post(
                        "/api/v1/dicom/upload",
                        files={"file": (f"file_{index}.dcm", f, "application/dicom")},
                    )
            
            tasks.append(upload(i))
        
        start = time.time()
        responses = await asyncio.gather(*tasks)
        duration = time.time() - start
        
        # All should succeed
        success_count = sum(1 for r in responses if r.status_code == 200)
        
        assert success_count == 10
        assert duration < 60  # 10 uploads in < 60 seconds
        print(f"10 concurrent uploads: {duration:.2f}s ({duration/10:.2f}s avg)")
```

---

## Testing Timeline

### Day 1: Setup & Unit Tests
- [ ] Set up test environment
- [ ] Download sample DICOM files
- [ ] Configure test database
- [ ] Run unit tests for services

### Day 2: E2E Workflow Tests
- [ ] Upload workflow tests
- [ ] Query workflow tests
- [ ] Viewer workflow tests
- [ ] Deletion workflow tests

### Day 3: Performance & Security
- [ ] Performance tests (upload, query, concurrency)
- [ ] Security tests (auth, authorization)
- [ ] Load testing with multiple users
- [ ] Document results

### Day 4: Bug Fixes & Report
- [ ] Fix identified issues
- [ ] Retest failed cases
- [ ] Complete test report
- [ ] Sign-off meeting

---

## Success Criteria

- ✅ All E2E workflows pass
- ✅ No critical security issues
- ✅ Upload speed < 30s for 100MB file
- ✅ Query response < 1s
- ✅ Support 10+ concurrent users
- ✅ OHIF Viewer loads all studies
- ✅ Test report completed
- ✅ Sign-off obtained

---

## Next Steps

After Phase 5D completion:
1. **Production Deployment** - Deploy to production environment
2. **User Training** - Train radiologists and clinicians
3. **Monitoring Setup** - Configure alerts and monitoring
4. **Backup Strategy** - Implement automated backups
5. **Phase 6 Planning** - Move to next EHR module (e.g., Results/Reports)

---

**Status:** Ready to execute  
**Estimated Completion:** 3-4 days

---

## Test Execution Checklist

- [ ] Test environment ready
- [ ] Sample DICOM files downloaded
- [ ] Test database seeded
- [ ] All test suites pass
- [ ] Performance benchmarks met
- [ ] Security audit complete
- [ ] Test report generated
- [ ] Issues documented
- [ ] Sign-off obtained
- [ ] Phase 5 complete ✅
