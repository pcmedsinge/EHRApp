"""
Clinical Notes Router

API endpoints for clinical notes management.
Phase: 3E (Clinical Notes Backend)
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.auth.router import get_current_user
from app.models.user import User
from app.schemas.clinical_note import (
    ClinicalNoteCreate,
    ClinicalNoteUpdate,
    ClinicalNoteResponse,
    ClinicalNoteLock,
    NoteTemplateCreate,
    NoteTemplateUpdate,
    NoteTemplateResponse
)
from app.api.v1.clinical_notes.clinical_note_service import ClinicalNoteService, NoteTemplateService

router = APIRouter(prefix="/clinical-notes", tags=["Clinical Notes"])

# Feature flag check (simple implementation)
CLINICAL_NOTES_ENABLED = True  # Can be loaded from config/database


def check_clinical_notes_enabled():
    """Dependency to check if clinical notes feature is enabled"""
    if not CLINICAL_NOTES_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clinical notes feature is currently disabled"
        )


def require_doctor(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to check if user is a doctor"""
    if current_user.role.upper() != "DOCTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this resource"
        )
    return current_user


# ============================================================================
# CLINICAL NOTES ENDPOINTS
# ============================================================================

@router.post("", response_model=ClinicalNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_clinical_note(
    note_data: ClinicalNoteCreate,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Create a new clinical note.
    
    **Requires:** Doctor role
    **Feature Flag:** clinical_notes_enabled
    """
    note = await ClinicalNoteService.create_note(
        db=db,
        note_data=note_data,
        created_by=current_user.id
    )
    return note


@router.get("/visit/{visit_id}", response_model=List[ClinicalNoteResponse])
async def get_visit_clinical_notes(
    visit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Get all clinical notes for a visit.
    
    **Returns:** List of clinical notes ordered by primary first, then creation date (newest first)
    """
    notes = await ClinicalNoteService.get_visit_notes(db=db, visit_id=visit_id)
    return notes


@router.get("/visit/{visit_id}/primary", response_model=ClinicalNoteResponse)
async def get_visit_primary_note(
    visit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Get the primary clinical note for a visit.
    
    **Returns:** The primary SOAP note for this visit
    **Note:** Each visit has max one primary note, with optional addendum notes
    """
    note = await ClinicalNoteService.get_primary_note(db=db, visit_id=visit_id)
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No primary clinical note found for visit: {visit_id}"
        )
    
    return note


@router.get("/patient/{patient_id}", response_model=List[ClinicalNoteResponse])
async def get_patient_clinical_notes(
    patient_id: UUID,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Get clinical notes history for a patient.
    
    **Params:**
    - **limit**: Maximum number of notes to return (default: 50)
    
    **Returns:** List of clinical notes ordered by creation date (newest first)
    """
    notes = await ClinicalNoteService.get_patient_notes(
        db=db,
        patient_id=patient_id,
        limit=limit
    )
    return notes


@router.get("/{note_id}", response_model=ClinicalNoteResponse)
async def get_clinical_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """Get a specific clinical note by ID"""
    note = await ClinicalNoteService.get_note_by_id(db=db, note_id=note_id)
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical note not found: {note_id}"
        )
    
    return note


@router.put("/{note_id}", response_model=ClinicalNoteResponse)
async def update_clinical_note(
    note_id: UUID,
    note_data: ClinicalNoteUpdate,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Update a clinical note.
    
    **Requires:** Doctor role and note author
    **Restrictions:** Cannot update locked notes
    """
    note = await ClinicalNoteService.update_note(
        db=db,
        note_id=note_id,
        note_data=note_data,
        current_user_id=current_user.id
    )
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical note not found: {note_id}"
        )
    
    return note


@router.post("/{note_id}/lock", response_model=ClinicalNoteResponse)
async def lock_clinical_note(
    note_id: UUID,
    lock_data: ClinicalNoteLock,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Lock/sign or unlock a clinical note.
    
    **Requires:** Doctor role and note author
    **Note:** Locked notes cannot be edited or deleted
    """
    note = await ClinicalNoteService.lock_note(
        db=db,
        note_id=note_id,
        user_id=current_user.id,
        lock=lock_data.lock
    )
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical note not found: {note_id}"
        )
    
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_clinical_note(
    note_id: UUID,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Soft delete a clinical note.
    
    **Requires:** Doctor role and note author
    **Restrictions:** Cannot delete locked notes
    """
    success = await ClinicalNoteService.delete_note(
        db=db,
        note_id=note_id,
        current_user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical note not found: {note_id}"
        )
    
    return None


# ============================================================================
# NOTE TEMPLATES ENDPOINTS
# ============================================================================

@router.post("/templates", response_model=NoteTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_note_template(
    template_data: NoteTemplateCreate,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Create a new note template.
    
    **Requires:** Doctor role
    """
    template = await NoteTemplateService.create_template(
        db=db,
        template_data=template_data,
        created_by=current_user.id
    )
    return template


@router.get("/templates", response_model=List[NoteTemplateResponse])
async def get_note_templates(
    note_type: str = None,
    specialty: str = None,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Get all note templates with optional filters.
    
    **Params:**
    - **note_type**: Filter by note type (soap, progress, discharge, etc.)
    - **specialty**: Filter by specialty
    - **active_only**: Return only active templates (default: true)
    """
    templates = await NoteTemplateService.get_templates(
        db=db,
        note_type=note_type,
        specialty=specialty,
        active_only=active_only
    )
    return templates


@router.get("/templates/{template_id}", response_model=NoteTemplateResponse)
async def get_note_template(
    template_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """Get a specific note template by ID"""
    template = await NoteTemplateService.get_template_by_id(db=db, template_id=template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note template not found: {template_id}"
        )
    
    return template


@router.put("/templates/{template_id}", response_model=NoteTemplateResponse)
async def update_note_template(
    template_id: UUID,
    template_data: NoteTemplateUpdate,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Update a note template.
    
    **Requires:** Doctor role
    """
    template = await NoteTemplateService.update_template(
        db=db,
        template_id=template_id,
        template_data=template_data
    )
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note template not found: {template_id}"
        )
    
    return template


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note_template(
    template_id: UUID,
    current_user: User = Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(check_clinical_notes_enabled)
):
    """
    Delete a note template.
    
    **Requires:** Doctor role
    """
    success = await NoteTemplateService.delete_template(db=db, template_id=template_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note template not found: {template_id}"
        )
    
    return None
