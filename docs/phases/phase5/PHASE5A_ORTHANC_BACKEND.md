# Phase 5A: Orthanc Integration Backend (7-8 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 4 Complete ✅, Orthanc Running  
**Estimated Time:** 7-8 days

---

## Objectives

Build complete backend integration with Orthanc PACS for DICOM storage, retrieval, and management. Implement DICOM tag reading/modification with pydicom and create REST API endpoints for frontend consumption.

---

## Deliverables

### 1. Database Migration

#### File: `backend/alembic/versions/xxx_add_dicom_integration.py` (100-150 lines)

```python
"""add dicom integration

Revision ID: xxx
Revises: yyy
Create Date: 2026-02-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'xxx'
down_revision = 'yyy'
branch_labels = None
depends_on = None

def upgrade():
    # Add DICOM fields to orders table
    op.add_column('orders', sa.Column('study_instance_uid', sa.String(64), nullable=True))
    op.add_column('orders', sa.Column('orthanc_study_id', sa.String(64), nullable=True))
    op.add_column('orders', sa.Column('number_of_series', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('number_of_images', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('study_date', sa.Date(), nullable=True))
    op.add_column('orders', sa.Column('study_time', sa.Time(), nullable=True))
    op.add_column('orders', sa.Column('uploaded_by_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('orders', sa.Column('uploaded_at', sa.DateTime(), nullable=True))
    op.add_column('orders', sa.Column('upload_source', sa.String(20), nullable=True))
    
    # Add foreign key
    op.create_foreign_key(
        'fk_orders_uploaded_by',
        'orders', 'users',
        ['uploaded_by_id'], ['id']
    )
    
    # Create dicom_upload_logs table
    op.create_table(
        'dicom_upload_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('uploaded_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        
        # DICOM Study Information
        sa.Column('study_instance_uid', sa.String(64), nullable=False),
        sa.Column('orthanc_study_id', sa.String(64), nullable=False),
        sa.Column('number_of_files', sa.Integer(), nullable=False),
        sa.Column('total_size_bytes', sa.Integer(), nullable=False),
        sa.Column('file_names', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        
        # Original Tags
        sa.Column('original_patient_id', sa.String(64), nullable=True),
        sa.Column('original_patient_name', sa.String(255), nullable=True),
        sa.Column('original_accession_number', sa.String(64), nullable=True),
        sa.Column('original_study_date', sa.String(8), nullable=True),
        sa.Column('original_modality', sa.String(16), nullable=True),
        
        # Modified Tags
        sa.Column('modified_patient_id', sa.String(64), nullable=True),
        sa.Column('modified_patient_name', sa.String(255), nullable=True),
        sa.Column('modified_accession_number', sa.String(64), nullable=True),
        sa.Column('tags_modified', sa.Boolean(), nullable=False, server_default='false'),
        
        # Status
        sa.Column('upload_status', sa.String(20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.Column('upload_source', sa.String(20), nullable=False),
        sa.Column('upload_duration_seconds', sa.Float(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id']),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id']),
        sa.UniqueConstraint('study_instance_uid', name='uq_study_instance_uid')
    )
    
    # Create indexes
    op.create_index('ix_dicom_upload_logs_study_uid', 'dicom_upload_logs', ['study_instance_uid'])
    op.create_index('ix_dicom_upload_logs_orthanc_id', 'dicom_upload_logs', ['orthanc_study_id'])
    op.create_index('ix_dicom_upload_logs_patient_id', 'dicom_upload_logs', ['patient_id'])
    op.create_index('ix_dicom_upload_logs_order_id', 'dicom_upload_logs', ['order_id'])
    op.create_index('ix_dicom_upload_logs_uploaded_at', 'dicom_upload_logs', ['uploaded_at'])

def downgrade():
    # Drop dicom_upload_logs table
    op.drop_table('dicom_upload_logs')
    
    # Remove DICOM columns from orders
    op.drop_constraint('fk_orders_uploaded_by', 'orders', type_='foreignkey')
    op.drop_column('orders', 'upload_source')
    op.drop_column('orders', 'uploaded_at')
    op.drop_column('orders', 'uploaded_by_id')
    op.drop_column('orders', 'study_time')
    op.drop_column('orders', 'study_date')
    op.drop_column('orders', 'number_of_images')
    op.drop_column('orders', 'number_of_series')
    op.drop_column('orders', 'orthanc_study_id')
    op.drop_column('orders', 'study_instance_uid')
```

---

### 2. DicomUploadLog Model

#### File: `backend/app/models/dicom_upload_log.py` (80-100 lines)

```python
"""
DICOM Upload Log Model
Phase: 5A (Orthanc Backend)
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, Column, JSON

from app.models.base import BaseModel


class DicomUploadLog(BaseModel, table=True):
    """DICOM upload log tracking uploaded studies"""
    
    __tablename__ = "dicom_upload_logs"
    
    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Foreign Keys
    patient_id: UUID = Field(foreign_key="patients.id", index=True)
    order_id: Optional[UUID] = Field(None, foreign_key="orders.id", index=True)
    uploaded_by_id: UUID = Field(foreign_key="users.id")
    
    # DICOM Study Information
    study_instance_uid: str = Field(max_length=64, unique=True, index=True)
    orthanc_study_id: str = Field(max_length=64, index=True)
    number_of_files: int
    total_size_bytes: int
    file_names: dict = Field(default={}, sa_column=Column(JSON))
    
    # Original DICOM Tags (before modification)
    original_patient_id: Optional[str] = Field(None, max_length=64)
    original_patient_name: Optional[str] = Field(None, max_length=255)
    original_accession_number: Optional[str] = Field(None, max_length=64)
    original_study_date: Optional[str] = Field(None, max_length=8)  # YYYYMMDD
    original_modality: Optional[str] = Field(None, max_length=16)
    
    # Modified Tags (if modified before upload)
    modified_patient_id: Optional[str] = Field(None, max_length=64)
    modified_patient_name: Optional[str] = Field(None, max_length=255)
    modified_accession_number: Optional[str] = Field(None, max_length=64)
    tags_modified: bool = Field(default=False)
    
    # Upload Status
    upload_status: str = Field(max_length=20)  # success, failed, partial
    error_message: Optional[str] = None
    
    # Metadata
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    upload_source: str = Field(max_length=20)  # manual, api, cd_import
    upload_duration_seconds: Optional[float] = None
    
    # Soft Delete
    is_deleted: bool = Field(default=False)
    
    # Relationships
    patient: Optional["Patient"] = Relationship(back_populates="dicom_uploads")
    order: Optional["Order"] = Relationship(back_populates="dicom_uploads")
    uploaded_by: Optional["User"] = Relationship(back_populates="dicom_uploads_created")
```

---

### 3. Update Order Model

#### File: `backend/app/models/order.py` (add fields, ~30 lines)

```python
# Add to Order model class

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
    upload_source: Optional[str] = Field(None, max_length=20)
    
    # Relationships
    uploaded_by: Optional["User"] = Relationship(back_populates="uploaded_studies")
    dicom_uploads: list["DicomUploadLog"] = Relationship(back_populates="order")
```

---

### 4. Orthanc Client Service

#### File: `backend/app/services/orthanc_service.py` (300-400 lines)

```python
"""
Orthanc PACS Client Service
Phase: 5A (Orthanc Backend)
"""

import httpx
from typing import List, Dict, Optional, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class OrthancService:
    """Client for Orthanc PACS REST API"""
    
    def __init__(self):
        self.base_url = settings.ORTHANC_URL
        self.auth = (settings.ORTHANC_USERNAME, settings.ORTHANC_PASSWORD)
        self.timeout = httpx.Timeout(300.0)  # 5 minutes for large uploads
    
    # ========================================================================
    # UPLOAD OPERATIONS
    # ========================================================================
    
    async def upload_dicom(self, file_content: bytes) -> Dict[str, Any]:
        """
        Upload single DICOM file to Orthanc
        
        Args:
            file_content: DICOM file bytes
            
        Returns:
            Dict with:
                - ID: Orthanc instance ID
                - Path: Instance path
                - Status: Success/Warning/Error
                - ParentStudy: Study ID
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/instances",
                    content=file_content,
                    headers={"Content-Type": "application/dicom"},
                    auth=self.auth
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Orthanc upload failed: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Orthanc upload error: {str(e)}")
            raise
    
    async def upload_multiple_dicom(self, files_content: List[bytes]) -> List[Dict[str, Any]]:
        """
        Upload multiple DICOM files
        
        Args:
            files_content: List of DICOM file bytes
            
        Returns:
            List of upload results
        """
        results = []
        for file_content in files_content:
            try:
                result = await self.upload_dicom(file_content)
                results.append(result)
            except Exception as e:
                results.append({"error": str(e), "status": "failed"})
        return results
    
    # ========================================================================
    # QUERY OPERATIONS
    # ========================================================================
    
    async def get_study(self, study_uid: str) -> Optional[Dict[str, Any]]:
        """
        Get study metadata by StudyInstanceUID
        
        Args:
            study_uid: DICOM StudyInstanceUID
            
        Returns:
            Study metadata dict or None if not found
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Find study by UID
                response = await client.post(
                    f"{self.base_url}/tools/find",
                    json={
                        "Level": "Study",
                        "Query": {"StudyInstanceUID": study_uid},
                        "Expand": True
                    },
                    auth=self.auth
                )
                response.raise_for_status()
                studies = response.json()
                
                if studies:
                    return studies[0]
                return None
        except Exception as e:
            logger.error(f"Error getting study {study_uid}: {str(e)}")
            return None
    
    async def get_study_by_orthanc_id(self, orthanc_id: str) -> Optional[Dict[str, Any]]:
        """Get study metadata by Orthanc internal ID"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/studies/{orthanc_id}",
                    auth=self.auth
                )
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Error getting study by ID {orthanc_id}: {str(e)}")
            return None
    
    async def query_patient_studies(self, patient_id: str) -> List[Dict[str, Any]]:
        """
        Query all studies for a patient
        
        Args:
            patient_id: DICOM PatientID (typically MRN)
            
        Returns:
            List of study metadata dicts
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/tools/find",
                    json={
                        "Level": "Study",
                        "Query": {"PatientID": patient_id},
                        "Expand": True
                    },
                    auth=self.auth
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error querying patient studies: {str(e)}")
            return []
    
    async def query_by_accession_number(self, accession_number: str) -> Optional[Dict[str, Any]]:
        """Query study by AccessionNumber"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/tools/find",
                    json={
                        "Level": "Study",
                        "Query": {"AccessionNumber": accession_number},
                        "Expand": True
                    },
                    auth=self.auth
                )
                response.raise_for_status()
                studies = response.json()
                
                if studies:
                    return studies[0]
                return None
        except Exception as e:
            logger.error(f"Error querying by accession: {str(e)}")
            return None
    
    async def list_all_studies(self, limit: int = 100) -> List[Dict[str, Any]]:
        """List all studies in Orthanc (paginated)"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Get study IDs
                response = await client.get(
                    f"{self.base_url}/studies",
                    auth=self.auth
                )
                response.raise_for_status()
                study_ids = response.json()[:limit]
                
                # Get detailed info for each study
                studies = []
                for study_id in study_ids:
                    study = await self.get_study_by_orthanc_id(study_id)
                    if study:
                        studies.append(study)
                
                return studies
        except Exception as e:
            logger.error(f"Error listing studies: {str(e)}")
            return []
    
    # ========================================================================
    # DELETE OPERATIONS
    # ========================================================================
    
    async def delete_study(self, study_uid: str) -> bool:
        """
        Delete study from Orthanc by StudyInstanceUID
        
        Args:
            study_uid: DICOM StudyInstanceUID
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            # Find Orthanc ID for this study
            study = await self.get_study(study_uid)
            if not study:
                return False
            
            orthanc_id = study.get("ID")
            if not orthanc_id:
                return False
            
            # Delete study
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(
                    f"{self.base_url}/studies/{orthanc_id}",
                    auth=self.auth
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Error deleting study {study_uid}: {str(e)}")
            return False
    
    # ========================================================================
    # METADATA OPERATIONS
    # ========================================================================
    
    async def get_study_metadata(self, study_uid: str) -> Optional[Dict[str, Any]]:
        """Get detailed study metadata including series and instances"""
        study = await self.get_study(study_uid)
        if not study:
            return None
        
        return {
            "StudyInstanceUID": study.get("MainDicomTags", {}).get("StudyInstanceUID"),
            "PatientID": study.get("PatientMainDicomTags", {}).get("PatientID"),
            "PatientName": study.get("PatientMainDicomTags", {}).get("PatientName"),
            "StudyDate": study.get("MainDicomTags", {}).get("StudyDate"),
            "StudyTime": study.get("MainDicomTags", {}).get("StudyTime"),
            "StudyDescription": study.get("MainDicomTags", {}).get("StudyDescription"),
            "AccessionNumber": study.get("MainDicomTags", {}).get("AccessionNumber"),
            "NumberOfSeries": len(study.get("Series", [])),
            "NumberOfInstances": sum(s.get("Instances", []) for s in study.get("Series", [])),
            "Modality": study.get("MainDicomTags", {}).get("Modality"),
            "OrthancStudyID": study.get("ID"),
        }
    
    async def get_thumbnail(self, study_uid: str) -> Optional[bytes]:
        """Get PNG thumbnail of first image in study"""
        try:
            study = await self.get_study(study_uid)
            if not study or not study.get("Series"):
                return None
            
            # Get first series
            first_series = study["Series"][0]
            series_id = first_series["ID"]
            
            # Get first instance
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                series_response = await client.get(
                    f"{self.base_url}/series/{series_id}",
                    auth=self.auth
                )
                series_data = series_response.json()
                
                if not series_data.get("Instances"):
                    return None
                
                instance_id = series_data["Instances"][0]
                
                # Get thumbnail
                thumbnail_response = await client.get(
                    f"{self.base_url}/instances/{instance_id}/preview",
                    auth=self.auth
                )
                
                if thumbnail_response.status_code == 200:
                    return thumbnail_response.content
                return None
        except Exception as e:
            logger.error(f"Error getting thumbnail: {str(e)}")
            return None
    
    # ========================================================================
    # HEALTH CHECK
    # ========================================================================
    
    async def health_check(self) -> bool:
        """Check if Orthanc is accessible"""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                response = await client.get(
                    f"{self.base_url}/system",
                    auth=self.auth
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Orthanc health check failed: {str(e)}")
            return False


# Singleton instance
orthanc_service = OrthancService()
```

---

### 5. DICOM Tag Service

#### File: `backend/app/services/dicom_tag_service.py` (200-250 lines)

```python
"""
DICOM Tag Reading and Modification Service
Phase: 5A (Orthanc Backend)
"""

import pydicom
from pydicom.dataset import Dataset
from typing import Dict, Any, Optional
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


class DicomTagService:
    """Service for reading and modifying DICOM tags"""
    
    # ========================================================================
    # TAG READING
    # ========================================================================
    
    @staticmethod
    def read_tags(file_content: bytes) -> Dict[str, Any]:
        """
        Read DICOM tags from file
        
        Args:
            file_content: DICOM file bytes
            
        Returns:
            Dict with parsed DICOM tags
        """
        try:
            ds = pydicom.dcmread(BytesIO(file_content), force=True)
            
            return {
                # Patient Information
                "PatientID": str(ds.PatientID) if "PatientID" in ds else None,
                "PatientName": str(ds.PatientName) if "PatientName" in ds else None,
                "PatientBirthDate": str(ds.PatientBirthDate) if "PatientBirthDate" in ds else None,
                "PatientSex": str(ds.PatientSex) if "PatientSex" in ds else None,
                "PatientAge": str(ds.PatientAge) if "PatientAge" in ds else None,
                
                # Study Information
                "StudyInstanceUID": str(ds.StudyInstanceUID) if "StudyInstanceUID" in ds else None,
                "StudyDate": str(ds.StudyDate) if "StudyDate" in ds else None,
                "StudyTime": str(ds.StudyTime) if "StudyTime" in ds else None,
                "StudyDescription": str(ds.StudyDescription) if "StudyDescription" in ds else None,
                "AccessionNumber": str(ds.AccessionNumber) if "AccessionNumber" in ds else None,
                
                # Series Information
                "SeriesInstanceUID": str(ds.SeriesInstanceUID) if "SeriesInstanceUID" in ds else None,
                "SeriesNumber": str(ds.SeriesNumber) if "SeriesNumber" in ds else None,
                "SeriesDescription": str(ds.SeriesDescription) if "SeriesDescription" in ds else None,
                "Modality": str(ds.Modality) if "Modality" in ds else None,
                
                # Instance Information
                "SOPInstanceUID": str(ds.SOPInstanceUID) if "SOPInstanceUID" in ds else None,
                "InstanceNumber": str(ds.InstanceNumber) if "InstanceNumber" in ds else None,
                
                # Institution
                "InstitutionName": str(ds.InstitutionName) if "InstitutionName" in ds else None,
                "InstitutionAddress": str(ds.InstitutionAddress) if "InstitutionAddress" in ds else None,
                
                # Referring Physician
                "ReferringPhysicianName": str(ds.ReferringPhysicianName) if "ReferringPhysicianName" in ds else None,
                
                # Performing Physician
                "PerformingPhysicianName": str(ds.PerformingPhysicianName) if "PerformingPhysicianName" in ds else None,
            }
        except Exception as e:
            logger.error(f"Error reading DICOM tags: {str(e)}")
            raise ValueError(f"Invalid DICOM file: {str(e)}")
    
    @staticmethod
    def read_all_tags(file_content: bytes) -> Dict[str, Any]:
        """Read ALL DICOM tags (for debugging/advanced use)"""
        try:
            ds = pydicom.dcmread(BytesIO(file_content), force=True)
            
            tags = {}
            for elem in ds:
                tag_name = elem.name if hasattr(elem, 'name') else str(elem.tag)
                try:
                    tags[tag_name] = str(elem.value)
                except:
                    tags[tag_name] = "<binary data>"
            
            return tags
        except Exception as e:
            logger.error(f"Error reading all tags: {str(e)}")
            raise ValueError(f"Invalid DICOM file: {str(e)}")
    
    # ========================================================================
    # TAG MODIFICATION
    # ========================================================================
    
    @staticmethod
    def modify_tags(
        file_content: bytes,
        modifications: Dict[str, str],
        remove_private_tags: bool = False
    ) -> bytes:
        """
        Modify DICOM tags and return new file content
        
        Args:
            file_content: Original DICOM file bytes
            modifications: Dict of tag names and new values
                          e.g., {"PatientID": "MRN123", "PatientName": "DOE^JOHN"}
            remove_private_tags: Whether to remove private tags (anonymization)
            
        Returns:
            Modified DICOM file bytes
        """
        try:
            ds = pydicom.dcmread(BytesIO(file_content), force=True)
            
            # Apply modifications
            for tag_name, value in modifications.items():
                if hasattr(ds, tag_name):
                    setattr(ds, tag_name, value)
                    logger.info(f"Modified tag {tag_name} to {value}")
                else:
                    logger.warning(f"Tag {tag_name} not found in DICOM file")
            
            # Remove private tags if requested
            if remove_private_tags:
                ds.remove_private_tags()
            
            # Save to bytes
            output = BytesIO()
            ds.save_as(output, write_like_original=False)
            return output.getvalue()
        except Exception as e:
            logger.error(f"Error modifying DICOM tags: {str(e)}")
            raise ValueError(f"Failed to modify DICOM: {str(e)}")
    
    # ========================================================================
    # VALIDATION
    # ========================================================================
    
    @staticmethod
    def validate_dicom(file_content: bytes) -> bool:
        """
        Validate if file is valid DICOM
        
        Args:
            file_content: File bytes to validate
            
        Returns:
            True if valid DICOM, False otherwise
        """
        try:
            pydicom.dcmread(BytesIO(file_content), force=True)
            return True
        except Exception as e:
            logger.warning(f"DICOM validation failed: {str(e)}")
            return False
    
    @staticmethod
    def get_file_info(file_content: bytes) -> Dict[str, Any]:
        """Get basic file information"""
        try:
            ds = pydicom.dcmread(BytesIO(file_content), force=True)
            
            return {
                "is_valid": True,
                "transfer_syntax": str(ds.file_meta.TransferSyntaxUID) if hasattr(ds, 'file_meta') else None,
                "sop_class_uid": str(ds.SOPClassUID) if "SOPClassUID" in ds else None,
                "modality": str(ds.Modality) if "Modality" in ds else None,
                "file_size_bytes": len(file_content),
                "has_pixel_data": hasattr(ds, 'PixelData'),
            }
        except Exception as e:
            return {
                "is_valid": False,
                "error": str(e)
            }


# Singleton instance
dicom_tag_service = DicomTagService()
```

---

### 6. Configuration Updates

#### File: `backend/app/core/config.py` (add settings)

```python
# Add to Settings class

    # Orthanc Configuration
    ORTHANC_URL: str = Field(default="http://orthanc:8042", env="ORTHANC_URL")
    ORTHANC_USERNAME: str = Field(default="orthanc", env="ORTHANC_USERNAME")
    ORTHANC_PASSWORD: str = Field(default="orthanc", env="ORTHANC_PASSWORD")
    ORTHANC_DICOMWEB_URL: str = Field(default="http://orthanc:8042/dicom-web", env="ORTHANC_DICOMWEB_URL")
    
    # DICOM Upload Limits
    MAX_DICOM_FILE_SIZE_MB: int = Field(default=100, env="MAX_DICOM_FILE_SIZE_MB")
    MAX_DICOM_FILES_PER_UPLOAD: int = Field(default=500, env="MAX_DICOM_FILES_PER_UPLOAD")
    MAX_UPLOAD_SIZE_MB: int = Field(default=2048, env="MAX_UPLOAD_SIZE_MB")
```

---

### 7. DICOM Router & Endpoints

#### File: `backend/app/api/v1/dicom/dicom_router.py` (400-500 lines)

```python
"""
DICOM API Router
Phase: 5A (Orthanc Backend)
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from uuid import UUID
import io

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.orthanc_service import orthanc_service
from app.services.dicom_tag_service import dicom_tag_service
from app.schemas.dicom import (
    DicomTagsResponse,
    DicomUploadResponse,
    StudyResponse,
    DicomModifyRequest,
)

router = APIRouter(prefix="/dicom", tags=["dicom"])


# ============================================================================
# UPLOAD ENDPOINTS
# ============================================================================

@router.post("/upload", response_model=DicomUploadResponse)
async def upload_dicom_file(
    file: UploadFile = File(...),
    patient_id: Optional[UUID] = None,
    order_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload single DICOM file to Orthanc
    
    - Validates DICOM format
    - Reads DICOM tags
    - Uploads to Orthanc PACS
    - Creates upload log
    """
    # Read file content
    content = await file.read()
    
    # Validate DICOM
    if not dicom_tag_service.validate_dicom(content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid DICOM file"
        )
    
    # Read tags
    tags = dicom_tag_service.read_tags(content)
    
    # Upload to Orthanc
    orthanc_response = await orthanc_service.upload_dicom(content)
    
    # TODO: Create DicomUploadLog in database
    
    return DicomUploadResponse(
        success=True,
        orthanc_id=orthanc_response.get("ID"),
        study_uid=tags.get("StudyInstanceUID"),
        tags=tags,
        message="DICOM uploaded successfully"
    )


@router.post("/upload-multiple", response_model=List[DicomUploadResponse])
async def upload_multiple_dicom_files(
    files: List[UploadFile] = File(...),
    patient_id: Optional[UUID] = None,
    order_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload multiple DICOM files"""
    results = []
    
    for file in files:
        try:
            content = await file.read()
            
            # Validate
            if not dicom_tag_service.validate_dicom(content):
                results.append(DicomUploadResponse(
                    success=False,
                    message=f"Invalid DICOM file: {file.filename}"
                ))
                continue
            
            # Read tags
            tags = dicom_tag_service.read_tags(content)
            
            # Upload
            orthanc_response = await orthanc_service.upload_dicom(content)
            
            results.append(DicomUploadResponse(
                success=True,
                orthanc_id=orthanc_response.get("ID"),
                study_uid=tags.get("StudyInstanceUID"),
                tags=tags,
                message=f"Uploaded: {file.filename}"
            ))
        except Exception as e:
            results.append(DicomUploadResponse(
                success=False,
                message=f"Error uploading {file.filename}: {str(e)}"
            ))
    
    return results


# ============================================================================
# TAG READING ENDPOINTS
# ============================================================================

@router.post("/read-tags", response_model=DicomTagsResponse)
async def read_dicom_tags(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Read DICOM tags from file without uploading
    
    - Used for preview before upload
    - Returns parsed tags
    """
    content = await file.read()
    
    if not dicom_tag_service.validate_dicom(content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid DICOM file"
        )
    
    tags = dicom_tag_service.read_tags(content)
    
    return DicomTagsResponse(tags=tags)


@router.post("/modify-tags")
async def modify_dicom_tags(
    file: UploadFile = File(...),
    modifications: DicomModifyRequest = Depends(),
    current_user: User = Depends(get_current_user)
):
    """
    Modify DICOM tags and return modified file
    
    - Reads original file
    - Applies modifications
    - Returns modified file for download or upload
    """
    content = await file.read()
    
    # Modify tags
    modified_content = dicom_tag_service.modify_tags(
        content,
        modifications.dict(exclude_none=True)
    )
    
    # Return as download
    return StreamingResponse(
        io.BytesIO(modified_content),
        media_type="application/dicom",
        headers={
            "Content-Disposition": f"attachment; filename=modified_{file.filename}"
        }
    )


# ============================================================================
# QUERY ENDPOINTS
# ============================================================================

@router.get("/studies", response_model=List[StudyResponse])
async def list_studies(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all DICOM studies"""
    studies = await orthanc_service.list_all_studies(limit=limit)
    
    # TODO: Enhance with DB data (patient names, order info)
    
    return [StudyResponse(**study) for study in studies]


@router.get("/studies/{study_uid}", response_model=StudyResponse)
async def get_study(
    study_uid: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get study details by StudyInstanceUID"""
    study = await orthanc_service.get_study_metadata(study_uid)
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    return StudyResponse(**study)


@router.get("/studies/patient/{patient_id}", response_model=List[StudyResponse])
async def get_patient_studies(
    patient_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all studies for a patient"""
    # TODO: Get patient MRN from database
    # patient = await get_patient(db, patient_id)
    # studies = await orthanc_service.query_patient_studies(patient.mrn)
    
    return []


# ============================================================================
# DELETE ENDPOINTS
# ============================================================================

@router.delete("/studies/{study_uid}")
async def delete_study(
    study_uid: str,
    reason: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete study from Orthanc (requires admin role)"""
    # Check permissions
    if current_user.role not in ["admin", "radiologist"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Delete from Orthanc
    success = await orthanc_service.delete_study(study_uid)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found or delete failed"
        )
    
    # TODO: Log deletion in database with reason
    
    return {"message": "Study deleted successfully", "reason": reason}


# ============================================================================
# THUMBNAIL ENDPOINT
# ============================================================================

@router.get("/thumbnail/{study_uid}")
async def get_study_thumbnail(
    study_uid: str,
    current_user: User = Depends(get_current_user)
):
    """Get PNG thumbnail of study"""
    thumbnail = await orthanc_service.get_thumbnail(study_uid)
    
    if not thumbnail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thumbnail not available"
        )
    
    return Response(content=thumbnail, media_type="image/png")


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def dicom_health_check():
    """Check Orthanc PACS health"""
    is_healthy = await orthanc_service.health_check()
    
    if not is_healthy:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Orthanc PACS is not accessible"
        )
    
    return {"status": "healthy", "message": "Orthanc PACS is accessible"}
```

---

### 8. Pydantic Schemas

#### File: `backend/app/schemas/dicom.py` (150-200 lines)

```python
"""
DICOM Pydantic Schemas
Phase: 5A (Orthanc Backend)
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


class DicomTagsResponse(BaseModel):
    """DICOM tags response"""
    tags: Dict[str, Any]


class DicomModifyRequest(BaseModel):
    """Request to modify DICOM tags"""
    PatientID: Optional[str] = None
    PatientName: Optional[str] = None
    PatientBirthDate: Optional[str] = None
    PatientSex: Optional[str] = None
    AccessionNumber: Optional[str] = None
    StudyDate: Optional[str] = None
    StudyDescription: Optional[str] = None
    remove_private_tags: bool = False


class DicomUploadResponse(BaseModel):
    """Response from DICOM upload"""
    success: bool
    orthanc_id: Optional[str] = None
    study_uid: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None
    message: str


class StudyResponse(BaseModel):
    """DICOM study response"""
    StudyInstanceUID: str
    OrthancStudyID: str
    PatientID: Optional[str] = None
    PatientName: Optional[str] = None
    StudyDate: Optional[str] = None
    StudyTime: Optional[str] = None
    StudyDescription: Optional[str] = None
    AccessionNumber: Optional[str] = None
    Modality: Optional[str] = None
    NumberOfSeries: Optional[int] = None
    NumberOfInstances: Optional[int] = None


class DicomUploadLogCreate(BaseModel):
    """Create DICOM upload log"""
    patient_id: UUID
    order_id: Optional[UUID] = None
    study_instance_uid: str
    orthanc_study_id: str
    number_of_files: int
    total_size_bytes: int
    file_names: Dict[str, Any]
    original_patient_id: Optional[str] = None
    original_patient_name: Optional[str] = None
    original_accession_number: Optional[str] = None
    original_study_date: Optional[str] = None
    original_modality: Optional[str] = None
    tags_modified: bool = False
    upload_status: str
    upload_source: str
    upload_duration_seconds: Optional[float] = None


class DicomUploadLogResponse(BaseModel):
    """DICOM upload log response"""
    id: UUID
    patient_id: UUID
    order_id: Optional[UUID]
    study_instance_uid: str
    orthanc_study_id: str
    number_of_files: int
    total_size_bytes: int
    original_patient_id: Optional[str]
    original_patient_name: Optional[str]
    original_accession_number: Optional[str]
    upload_status: str
    uploaded_at: datetime
    uploaded_by: str  # User full name
    
    class Config:
        from_attributes = True
```

---

## Verification Checklist

- [ ] Alembic migration runs successfully
- [ ] DicomUploadLog model created
- [ ] Order model updated with DICOM fields
- [ ] Orthanc service connects successfully
- [ ] Can upload DICOM file to Orthanc
- [ ] Can read DICOM tags with pydicom
- [ ] Can modify DICOM tags
- [ ] Can query studies from Orthanc
- [ ] Can delete study from Orthanc
- [ ] Health check endpoint works
- [ ] API endpoints return correct responses
- [ ] File size limits enforced
- [ ] Error handling works

---

## Testing Commands

```bash
# 1. Run migration
cd backend
alembic upgrade head

# 2. Start services
cd ../scripts
bash dev-start.sh

# 3. Test Orthanc health
curl http://localhost:8000/api/v1/dicom/health

# 4. Test DICOM upload (with auth token)
curl -X POST http://localhost:8000/api/v1/dicom/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-data/sample.dcm"

# 5. List studies
curl http://localhost:8000/api/v1/dicom/studies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Next Phase

Once Phase 5A is complete:
→ **Phase 5B: DICOM Upload Frontend** - Build upload UI with drag-and-drop

---

**Status:** Ready to implement  
**Estimated Completion:** 7-8 days
