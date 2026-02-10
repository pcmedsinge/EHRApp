"""
Order Management System
Supports: IMAGING, LAB, PROCEDURE orders
"""
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base
import uuid
from datetime import datetime


class Order(Base):
    """
    Unified order model for all clinical orders
    """
    __tablename__ = "orders"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identifiers
    order_number = Column(String(20), unique=True, nullable=False, index=True)
    accession_number = Column(String(20), unique=True, nullable=True, index=True)
    
    # Type Discriminator
    order_type = Column(String(20), nullable=False, index=True)  # IMAGING, LAB, PROCEDURE
    
    # Relationships
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False, index=True)
    visit_id = Column(UUID(as_uuid=True), ForeignKey('visits.id'), nullable=False, index=True)
    ordered_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Common Order Fields
    status = Column(String(20), nullable=False, default='ordered', index=True)
    priority = Column(String(20), nullable=False, default='routine')
    clinical_indication = Column(Text, nullable=False)
    special_instructions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Type-Specific Details (JSON)
    order_details = Column(JSON, nullable=False)
    
    # Scheduling & Dates
    ordered_date = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    performed_date = Column(DateTime(timezone=True), nullable=True)
    reported_date = Column(DateTime(timezone=True), nullable=True)
    cancelled_date = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    # Personnel
    performing_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    reporting_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    
    # Results/Report
    report_text = Column(Text, nullable=True)
    findings = Column(Text, nullable=True)
    impression = Column(Text, nullable=True)
    result_status = Column(String(20), nullable=True)  # normal, abnormal, critical
    
    # DICOM Integration (Phase 5)
    study_instance_uid = Column(String(100), nullable=True, index=True)  # DICOM StudyInstanceUID
    orthanc_study_id = Column(String(100), nullable=True, index=True)  # Orthanc internal ID
    study_date = Column(String(20), nullable=True)  # DICOM StudyDate (YYYYMMDD)
    study_time = Column(String(20), nullable=True)  # DICOM StudyTime (HHMMSS)
    modality = Column(String(20), nullable=True)  # CT, MR, CR, DX, US, etc.
    number_of_series = Column(Integer, nullable=True)  # Total series count
    number_of_instances = Column(Integer, nullable=True)  # Total image count (replaces number_of_images)
    dicom_upload_date = Column(DateTime(timezone=True), nullable=True)  # When DICOM was uploaded
    external_id = Column(String(100), nullable=True)  # External system reference
    
    # Audit Fields
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", foreign_keys=[patient_id])
    visit = relationship("Visit", foreign_keys=[visit_id])
    ordered_by_user = relationship("User", foreign_keys=[ordered_by])
    performing_user = relationship("User", foreign_keys=[performing_user_id])
    reporting_user = relationship("User", foreign_keys=[reporting_user_id])
    
    # Indexes
    __table_args__ = (
        Index('idx_orders_patient_date', 'patient_id', 'ordered_date'),
        Index('idx_orders_visit_type', 'visit_id', 'order_type'),
        Index('idx_orders_status_type', 'status', 'order_type'),
    )
