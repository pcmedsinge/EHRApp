"""
Clinical Notes Schemas

Pydantic models for clinical notes API validation and serialization.
Phase: 3E (Clinical Notes Backend)
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


# ============================================================================
# BASE SCHEMAS
# ============================================================================

class ClinicalNoteBase(BaseModel):
    """Base schema for clinical notes"""
    note_type: str = "soap"
    title: Optional[str] = None
    is_primary: bool = False
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    template_id: Optional[UUID] = None


class ClinicalNoteCreate(ClinicalNoteBase):
    """Schema for creating a clinical note"""
    visit_id: UUID
    patient_id: UUID


class ClinicalNoteUpdate(BaseModel):
    """Schema for updating a clinical note (partial updates allowed)"""
    note_type: Optional[str] = None
    title: Optional[str] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ClinicalNoteLock(BaseModel):
    """Schema for locking/signing a note"""
    lock: bool = Field(..., description="True to lock, False to unlock")


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class UserBasic(BaseModel):
    """Basic user info for note responses"""
    id: UUID
    username: str
    full_name: str
    role: str
    
    model_config = ConfigDict(from_attributes=True)


class ClinicalNoteResponse(ClinicalNoteBase):
    """Schema for clinical note responses"""
    id: UUID
    visit_id: UUID
    patient_id: UUID
    created_by: UUID
    is_primary: bool
    
    # Locking info
    is_locked: bool
    locked_at: Optional[datetime] = None
    locked_by: Optional[UUID] = None
    
    # Audit
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    
    # Nested relationships
    author: Optional[UserBasic] = None
    signer: Optional[UserBasic] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# NOTE TEMPLATE SCHEMAS
# ============================================================================

class NoteTemplateBase(BaseModel):
    """Base schema for note templates"""
    name: str = Field(..., min_length=1, max_length=200)
    note_type: str = "soap"
    specialty: Optional[str] = None
    subjective_template: Optional[str] = None
    objective_template: Optional[str] = None
    assessment_template: Optional[str] = None
    plan_template: Optional[str] = None
    is_active: bool = True
    is_default: bool = False


class NoteTemplateCreate(NoteTemplateBase):
    """Schema for creating a note template"""
    pass


class NoteTemplateUpdate(BaseModel):
    """Schema for updating a note template"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    note_type: Optional[str] = None
    specialty: Optional[str] = None
    subjective_template: Optional[str] = None
    objective_template: Optional[str] = None
    assessment_template: Optional[str] = None
    plan_template: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


class NoteTemplateResponse(NoteTemplateBase):
    """Schema for note template responses"""
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested relationships
    creator: Optional[UserBasic] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# FEATURE FLAG SCHEMA
# ============================================================================

class ClinicalNotesFeature(BaseModel):
    """Feature flag for clinical notes module"""
    enabled: bool = True
    require_soap_format: bool = True
    allow_templates: bool = True
    require_locking: bool = False
