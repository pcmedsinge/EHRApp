"""
Diagnosis Schemas
================

Purpose:
  Pydantic schemas for diagnosis validation and serialization.

Module: app/schemas/diagnosis.py
Phase: 3C (Backend - Diagnosis)
"""

from pydantic import BaseModel, Field, validator, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from enum import Enum

# =============================================================================
# Enums
# =============================================================================

class DiagnosisType(str, Enum):
    """Diagnosis type classification"""
    PRIMARY = "primary"
    SECONDARY = "secondary"

class DiagnosisStatus(str, Enum):
    """Diagnosis confirmation status"""
    PROVISIONAL = "provisional"
    CONFIRMED = "confirmed"

class Severity(str, Enum):
    """Diagnosis severity level"""
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"

# =============================================================================
# ICD-10 Schemas
# =============================================================================

class ICD10SearchResult(BaseModel):
    """ICD-10 code search result"""
    code: str
    description: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    usage_count: int = 0
    common_in_india: bool = False
    
    class Config:
        from_attributes = True

class ICD10CodeDetail(BaseModel):
    """Detailed ICD-10 code information"""
    code: str
    description: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    usage_count: int = 0
    common_in_india: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# =============================================================================
# Diagnosis Schemas
# =============================================================================

class DiagnosisBase(BaseModel):
    """Base diagnosis schema"""
    diagnosis_description: str = Field(..., min_length=3, max_length=500)
    icd10_code: Optional[str] = Field(None, pattern="^[A-Z][0-9]{2}\\.?[0-9]{0,2}$")
    diagnosis_type: str = "primary"  # Changed to str since DB is now VARCHAR
    status: str = "provisional"  # Changed to str since DB is now VARCHAR
    severity: Optional[str] = None  # Changed to str since DB is now VARCHAR
    diagnosed_date: date = Field(default_factory=date.today)
    onset_date: Optional[date] = None
    notes: Optional[str] = None

class DiagnosisCreate(DiagnosisBase):
    """Create diagnosis schema"""
    visit_id: UUID
    patient_id: UUID
    
    @validator('diagnosis_description')
    def validate_description(cls, v):
        """Ensure meaningful description"""
        if not v or len(v.strip()) < 3:
            raise ValueError('Diagnosis description must be at least 3 characters')
        return v.strip()
    
    @validator('onset_date')
    def validate_onset_date(cls, v, values):
        """Ensure onset date is not in the future"""
        if v and v > date.today():
            raise ValueError('Onset date cannot be in the future')
        # Onset should be before or same as diagnosis date
        if v and 'diagnosed_date' in values and v > values['diagnosed_date']:
            raise ValueError('Onset date cannot be after diagnosis date')
        return v

class DiagnosisUpdate(BaseModel):
    """Update diagnosis schema - all fields optional"""
    icd10_code: Optional[str] = Field(None, pattern="^[A-Z][0-9]{2}\\.?[0-9]{0,2}$")
    diagnosis_description: Optional[str] = Field(None, min_length=3, max_length=500)
    diagnosis_type: Optional[DiagnosisType] = None
    status: Optional[DiagnosisStatus] = None
    severity: Optional[Severity] = None
    diagnosed_date: Optional[date] = None
    onset_date: Optional[date] = None
    clinical_notes: Optional[str] = None

class DiagnosisResponse(DiagnosisBase):
    """Diagnosis response schema"""
    id: UUID
    visit_id: UUID
    patient_id: UUID
    diagnosed_by: UUID
    created_at: datetime
    updated_at: datetime
    
    # Optional ICD-10 details
    icd10: Optional[ICD10SearchResult] = None
    
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

class DiagnosisWithDetails(DiagnosisResponse):
    """Diagnosis with patient and doctor details"""
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)
