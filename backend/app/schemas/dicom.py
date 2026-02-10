"""
DICOM Schemas
=============

Purpose:
    Pydantic schemas for DICOM-related requests and responses.
    Used for API validation and documentation.

Module: app/schemas/dicom.py
Phase: 5A (Orthanc Backend)

Schemas:
    - DicomTagsResponse: DICOM tags extracted from file
    - DicomUploadRequest: Upload request with patient/order info
    - DicomUploadResponse: Upload confirmation with study info
    - DicomFileInfo: File metadata response
    - DicomStudyResponse: Study query response
    - DicomUploadLogResponse: Upload log entry
    - DicomTagModifyRequest: Request to modify DICOM tags
    - DicomDeleteRequest: Request to delete study
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID


class DicomTagsResponse(BaseModel):
    """Response containing DICOM tags"""
    tags: Dict[str, Optional[str]] = Field(..., description="Extracted DICOM tags")
    file_name: Optional[str] = Field(None, description="Original file name")
    file_size_mb: Optional[float] = Field(None, description="File size in MB")
    
    model_config = ConfigDict(from_attributes=True)


class DicomFileInfo(BaseModel):
    """DICOM file metadata"""
    file_size_bytes: int
    file_size_mb: float
    modality: Optional[str] = None
    study_uid: Optional[str] = None
    series_uid: Optional[str] = None
    sop_uid: Optional[str] = None
    patient_id: Optional[str] = None
    study_date: Optional[str] = None
    transfer_syntax: Optional[str] = None
    sop_class: Optional[str] = None
    image_dimensions: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class DicomUploadRequest(BaseModel):
    """Request to upload DICOM file(s)"""
    patient_id: UUID = Field(..., description="Patient UUID")
    order_id: Optional[UUID] = Field(None, description="Associated order UUID")
    tag_modifications: Optional[Dict[str, str]] = Field(
        None,
        description="Optional tag modifications before upload"
    )
    
    model_config = ConfigDict(from_attributes=True)


class DicomUploadResponse(BaseModel):
    """Response after successful DICOM upload"""
    study_instance_uid: str = Field(..., description="DICOM StudyInstanceUID")
    orthanc_study_id: str = Field(..., description="Orthanc internal study ID")
    patient_id: UUID = Field(..., description="Patient UUID")
    order_id: Optional[UUID] = Field(None, description="Associated order UUID")
    upload_log_id: UUID = Field(..., description="Upload log entry ID")
    modality: Optional[str] = Field(None, description="DICOM modality (CT, MR, etc.)")
    study_date: Optional[str] = Field(None, description="Study date (YYYYMMDD)")
    number_of_series: Optional[int] = Field(None, description="Number of series")
    number_of_instances: Optional[int] = Field(None, description="Number of instances")
    file_count: int = Field(..., description="Number of files uploaded")
    total_size_mb: float = Field(..., description="Total size in MB")
    upload_date: datetime = Field(..., description="Upload timestamp")
    status: str = Field(..., description="Upload status")
    
    model_config = ConfigDict(from_attributes=True)


class DicomUploadMultipleResponse(BaseModel):
    """Response after uploading multiple DICOM files"""
    total_files: int = Field(..., description="Total files attempted")
    successful: int = Field(..., description="Successfully uploaded")
    failed: int = Field(..., description="Failed uploads")
    studies: List[str] = Field(..., description="List of study UIDs created")
    uploads: List[DicomUploadResponse] = Field(..., description="Details of each upload")
    errors: Optional[List[str]] = Field(None, description="Error messages if any")
    
    model_config = ConfigDict(from_attributes=True)


class DicomStudyResponse(BaseModel):
    """DICOM study metadata"""
    study_instance_uid: str
    orthanc_study_id: Optional[str] = None
    patient_dicom_id: Optional[str] = None
    patient_name: Optional[str] = None
    study_date: Optional[str] = None
    study_time: Optional[str] = None
    study_description: Optional[str] = None
    accession_number: Optional[str] = None
    modality: Optional[str] = None
    referring_physician: Optional[str] = None
    number_of_series: Optional[int] = None
    number_of_instances: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


class DicomUploadLogResponse(BaseModel):
    """DICOM upload log entry"""
    id: UUID
    study_instance_uid: str
    orthanc_study_id: str
    patient_id: UUID
    order_id: Optional[UUID] = None
    uploaded_by: UUID
    patient_dicom_id: Optional[str] = None
    patient_name: Optional[str] = None
    study_date: Optional[str] = None
    study_time: Optional[str] = None
    study_description: Optional[str] = None
    accession_number: Optional[str] = None
    modality: Optional[str] = None
    referring_physician: Optional[str] = None
    upload_status: str
    file_count: int
    total_size_bytes: int
    upload_date: datetime
    number_of_series: Optional[int] = None
    number_of_instances: Optional[int] = None
    deleted_date: Optional[datetime] = None
    deletion_reason: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DicomTagModifyRequest(BaseModel):
    """Request to modify DICOM tags"""
    tags: Dict[str, str] = Field(
        ...,
        description="Tags to modify (tag name -> new value)",
        examples=[{
            "PatientName": "DOE^JOHN",
            "PatientID": "12345",
            "AccessionNumber": "ACC-2026-00123"
        }]
    )
    
    model_config = ConfigDict(from_attributes=True)


class DicomDeleteRequest(BaseModel):
    """Request to delete DICOM study"""
    reason: str = Field(..., description="Reason for deletion", min_length=5)
    
    model_config = ConfigDict(from_attributes=True)


class DicomHealthResponse(BaseModel):
    """Orthanc health check response"""
    status: str = Field(..., description="Health status (healthy/unhealthy)")
    orthanc_version: Optional[str] = Field(None, description="Orthanc version")
    api_version: Optional[str] = Field(None, description="API version")
    database_version: Optional[str] = Field(None, description="Database version")
    message: Optional[str] = Field(None, description="Additional message")
    
    model_config = ConfigDict(from_attributes=True)


class DicomStatisticsResponse(BaseModel):
    """Orthanc system statistics"""
    total_disk_size: int = Field(..., description="Total storage used (bytes)")
    total_disk_size_mb: float = Field(..., description="Total storage used (MB)")
    count_patients: int = Field(..., description="Number of patients")
    count_studies: int = Field(..., description="Number of studies")
    count_series: int = Field(..., description="Number of series")
    count_instances: int = Field(..., description="Number of instances")
    
    model_config = ConfigDict(from_attributes=True)


class PatientStudiesResponse(BaseModel):
    """List of studies for a patient"""
    patient_id: UUID = Field(..., description="Patient UUID")
    patient_mrn: str = Field(..., description="Patient MRN")
    studies: List[DicomStudyResponse] = Field(..., description="List of studies")
    total_studies: int = Field(..., description="Total number of studies")
    
    model_config = ConfigDict(from_attributes=True)


class OrderStudiesResponse(BaseModel):
    """Studies associated with an order"""
    order_id: UUID = Field(..., description="Order UUID")
    order_number: str = Field(..., description="Order number")
    accession_number: Optional[str] = Field(None, description="Accession number")
    studies: List[DicomStudyResponse] = Field(..., description="List of studies")
    total_studies: int = Field(..., description="Total number of studies")
    
    model_config = ConfigDict(from_attributes=True)
