"""
DICOM Upload Log Model
======================

Purpose:
    Track all DICOM file uploads with comprehensive metadata.
    Links uploaded DICOM studies to patients, orders, and Orthanc.

Module: app/models/dicom_upload_log.py
Phase: 5A (Orthanc Backend)

Relationships:
    - Patient: Many logs -> One patient
    - Order: Many logs -> One order (optional)
    - User: Many logs -> One user (uploaded_by)

Fields:
    - study_instance_uid: DICOM StudyInstanceUID (unique identifier)
    - orthanc_study_id: Orthanc internal study ID
    - patient_id: Link to patient
    - order_id: Link to order (optional)
    - upload_status: uploaded, failed, deleted
    - DICOM tags: PatientID, PatientName, StudyDate, Modality, etc.
"""

from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
import uuid
from datetime import datetime


class DicomUploadLog(Base):
    """
    Track DICOM study uploads and metadata
    """
    __tablename__ = "dicom_upload_logs"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # DICOM Identifiers
    study_instance_uid = Column(String(100), nullable=False, index=True, unique=True)
    orthanc_study_id = Column(String(100), nullable=False, index=True)
    
    # Relationships
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey('orders.id'), nullable=True, index=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # DICOM Tags (from uploaded files)
    patient_dicom_id = Column(String(100), nullable=True)  # PatientID from DICOM
    patient_name = Column(String(200), nullable=True)  # PatientName from DICOM
    study_date = Column(String(20), nullable=True)  # StudyDate (YYYYMMDD)
    study_time = Column(String(20), nullable=True)  # StudyTime (HHMMSS)
    study_description = Column(String(500), nullable=True)
    accession_number = Column(String(50), nullable=True, index=True)
    modality = Column(String(20), nullable=True, index=True)  # CT, MR, CR, etc.
    referring_physician = Column(String(200), nullable=True)
    
    # Upload Metadata
    upload_status = Column(String(20), nullable=False, default='uploaded', index=True)
    file_count = Column(Integer, nullable=False, default=0)
    total_size_bytes = Column(Integer, nullable=False, default=0)
    upload_date = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Series and Instance Counts
    number_of_series = Column(Integer, nullable=True)
    number_of_instances = Column(Integer, nullable=True)
    
    # Deletion Tracking
    deleted_date = Column(DateTime(timezone=True), nullable=True)
    deletion_reason = Column(Text, nullable=True)
    
    # Error Handling
    error_message = Column(Text, nullable=True)
    
    # Audit
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", foreign_keys=[patient_id])
    order = relationship("Order", foreign_keys=[order_id])
    uploaded_by_user = relationship("User", foreign_keys=[uploaded_by])
    
    # Indexes
    __table_args__ = (
        Index('idx_dicom_patient_date', 'patient_id', 'study_date'),
        Index('idx_dicom_order_uid', 'order_id', 'study_instance_uid'),
        Index('idx_dicom_status_modality', 'upload_status', 'modality'),
    )
    
    def __repr__(self):
        return f"<DicomUploadLog(study_uid={self.study_instance_uid}, patient={self.patient_id})>"
