"""
Diagnosis Model
===============

Purpose:
  Patient diagnosis model with optional ICD-10 coding.

Module: app/models/diagnosis.py
Phase: 3C (Backend - Diagnosis)

References:
  - Phase 3C Spec: docs/phases/phase3/PHASE3C_DIAGNOSIS_BACKEND.md
"""

from sqlalchemy import Column, String, Text, Date, ForeignKey, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import BaseModel
import enum
import uuid

class DiagnosisType(str, enum.Enum):
    """Diagnosis type classification"""
    PRIMARY = "primary"
    SECONDARY = "secondary"

class DiagnosisStatus(str, enum.Enum):
    """Diagnosis confirmation status"""
    PROVISIONAL = "provisional"
    CONFIRMED = "confirmed"

class Severity(str, enum.Enum):
    """Diagnosis severity level"""
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"

class Diagnosis(BaseModel):
    """Patient diagnosis model
    
    Supports both ICD-10 coded and free-text diagnoses.
    ICD-10 code is optional but fully functional when used.
    """
    __tablename__ = "diagnoses"
    
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    diagnosed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # ICD-10 code is OPTIONAL - supports both coded and non-coded workflows
    icd10_code = Column(String(10), ForeignKey("icd10_codes.code"), nullable=True)
    
    # Description is REQUIRED - either from ICD-10 or free text
    diagnosis_description = Column(Text, nullable=False)
    
    # Diagnosis metadata - using String columns to avoid enum serialization issues
    diagnosis_type = Column(String(20), nullable=False)  # 'primary' or 'secondary'
    status = Column(String(20), nullable=False, default="provisional")  # 'provisional' or 'confirmed'
    severity = Column(String(20), nullable=True)  # 'mild', 'moderate', 'severe', 'critical'
    diagnosed_date = Column(Date, nullable=False)
    onset_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    visit = relationship("Visit", back_populates="diagnoses")
    patient = relationship("Patient", back_populates="diagnoses")
    doctor = relationship("User", foreign_keys=[diagnosed_by])
    icd10 = relationship("ICD10Code", primaryjoin="Diagnosis.icd10_code == foreign(ICD10Code.code)")
    
    def __repr__(self):
        code_info = f" ({self.icd10_code})" if self.icd10_code else ""
        return f"<Diagnosis {self.id}: {self.diagnosis_description[:40]}{code_info}>"
