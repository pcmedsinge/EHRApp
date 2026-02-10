# Phase 3E: Clinical Notes Backend (3-4 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 3D Complete  
**Estimated Time:** 3-4 days

**Note:** Clinical Notes module can be enabled/disabled via feature flag (see FEATURE_FLAGS.md)

---

## Objectives

Build structured clinical notes system with:
- SOAP format (Subjective, Objective, Assessment, Plan)
- Note templates for quick documentation
- Auto-save functionality
- Note locking/signing
- Doctor-only access control

---

## Deliverables

### 1. Clinical Notes Table Migration
**File:** `backend/alembic/versions/YYYYMMDD_HHMM_create_clinical_notes.py`

```python
"""Create clinical notes table

Revision ID: XXXXXX
Revises: (previous_revision)
Create Date: 2026-02-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Note type enum
    note_type_enum = postgresql.ENUM(
        'soap', 'progress', 'discharge', 'consultation', 'procedure',
        name='note_type_enum',
        create_type=False
    )
    note_type_enum.create(op.get_bind(), checkfirst=True)
    
    # Clinical notes table
    op.create_table(
        'clinical_notes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('visit_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('visits.id'), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id'), nullable=False),
        
        # Note type
        sa.Column('note_type', note_type_enum, nullable=False),
        
        # SOAP Format
        sa.Column('subjective', sa.Text, nullable=True),  # Chief complaint, HPI
        sa.Column('objective', sa.Text, nullable=True),   # Physical exam, vitals
        sa.Column('assessment', sa.Text, nullable=True),  # Diagnosis, impression
        sa.Column('plan', sa.Text, nullable=True),        # Treatment plan
        
        # Metadata
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_locked', sa.Boolean, default=False),
        sa.Column('locked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('locked_by', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id'), nullable=True),
        
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), 
                  server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_deleted', sa.Boolean, default=False)
    )
    
    # Note templates table (optional)
    op.create_table(
        'note_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('note_type', note_type_enum, nullable=False),
        sa.Column('subjective_template', sa.Text, nullable=True),
        sa.Column('objective_template', sa.Text, nullable=True),
        sa.Column('assessment_template', sa.Text, nullable=True),
        sa.Column('plan_template', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Indexes
    op.create_index('idx_clinical_notes_visit', 'clinical_notes', ['visit_id'])
    op.create_index('idx_clinical_notes_patient', 'clinical_notes', ['patient_id'])
    op.create_index('idx_clinical_notes_locked', 'clinical_notes', ['is_locked'])
    op.create_index('idx_note_templates_type', 'note_templates', ['note_type'])

def downgrade():
    op.drop_table('note_templates')
    op.drop_table('clinical_notes')
    op.execute('DROP TYPE note_type_enum')
```

---

### 2. Models
**File:** `backend/app/models/clinical_note.py`

```python
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum

class NoteType(str, enum.Enum):
    SOAP = "soap"
    PROGRESS = "progress"
    DISCHARGE = "discharge"
    CONSULTATION = "consultation"
    PROCEDURE = "procedure"

class ClinicalNote(BaseModel):
    """Clinical note model with SOAP format"""
    __tablename__ = "clinical_notes"
    
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    note_type = Column(SQLEnum(NoteType), nullable=False)
    
    # SOAP sections
    subjective = Column(Text, nullable=True)
    objective = Column(Text, nullable=True)
    assessment = Column(Text, nullable=True)
    plan = Column(Text, nullable=True)
    
    # Metadata
    template_id = Column(UUID(as_uuid=True), nullable=True)
    is_locked = Column(Boolean, default=False)
    locked_at = Column(DateTime(timezone=True), nullable=True)
    locked_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    visit = relationship("Visit", back_populates="clinical_notes")
    patient = relationship("Patient")
    author = relationship("User", foreign_keys=[created_by])
    locker = relationship("User", foreign_keys=[locked_by])
    
    def __repr__(self):
        return f"<ClinicalNote {self.id} - Visit {self.visit_id}>"

class NoteTemplate(BaseModel):
    """Template for clinical notes"""
    __tablename__ = "note_templates"
    
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    note_type = Column(SQLEnum(NoteType), nullable=False)
    
    subjective_template = Column(Text, nullable=True)
    objective_template = Column(Text, nullable=True)
    assessment_template = Column(Text, nullable=True)
    plan_template = Column(Text, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    author = relationship("User")
    
    def __repr__(self):
        return f"<NoteTemplate {self.name}>"
```

---

### 3. Pydantic Schemas
**File:** `backend/app/schemas/clinical_note.py`

```python
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum

class NoteType(str, Enum):
    SOAP = "soap"
    PROGRESS = "progress"
    DISCHARGE = "discharge"
    CONSULTATION = "consultation"
    PROCEDURE = "procedure"

class ClinicalNoteCreate(BaseModel):
    """Create clinical note schema"""
    visit_id: UUID
    patient_id: UUID
    note_type: NoteType = NoteType.SOAP
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    template_id: Optional[UUID] = None

class ClinicalNoteUpdate(BaseModel):
    """Update clinical note schema"""
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None

class ClinicalNoteResponse(BaseModel):
    """Clinical note response schema"""
    id: UUID
    visit_id: UUID
    patient_id: UUID
    created_by: UUID
    note_type: NoteType
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    template_id: Optional[UUID] = None
    is_locked: bool
    locked_at: Optional[datetime] = None
    locked_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class NoteTemplateCreate(BaseModel):
    """Create note template schema"""
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    note_type: NoteType
    subjective_template: Optional[str] = None
    objective_template: Optional[str] = None
    assessment_template: Optional[str] = None
    plan_template: Optional[str] = None

class NoteTemplateResponse(BaseModel):
    """Note template response schema"""
    id: UUID
    name: str
    description: Optional[str] = None
    note_type: NoteType
    subjective_template: Optional[str] = None
    objective_template: Optional[str] = None
    assessment_template: Optional[str] = None
    plan_template: Optional[str] = None
    is_active: bool
    created_by: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
```

---

### 4. Service Layer
**File:** `backend/app/api/v1/clinical_notes/service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from typing import List, Optional
from datetime import datetime
from app.models.clinical_note import ClinicalNote, NoteTemplate
from app.models.visit import Visit
from app.schemas.clinical_note import (
    ClinicalNoteCreate,
    ClinicalNoteUpdate,
    NoteTemplateCreate
)
from app.core.exceptions import NotFoundException, ValidationException

class ClinicalNoteService:
    """Service layer for clinical notes operations"""
    
    @staticmethod
    async def create_note(
        db: AsyncSession,
        note_data: ClinicalNoteCreate,
        current_user_id: UUID
    ) -> ClinicalNote:
        """Create a new clinical note"""
        # Verify visit exists
        stmt = select(Visit).where(Visit.id == note_data.visit_id)
        result = await db.execute(stmt)
        visit = result.scalar_one_or_none()
        
        if not visit:
            raise NotFoundException(f"Visit {note_data.visit_id} not found")
        
        # If template_id provided, load template
        if note_data.template_id:
            template = await ClinicalNoteService.get_template(db, note_data.template_id)
            if template:
                # Pre-fill from template if note fields are empty
                if not note_data.subjective and template.subjective_template:
                    note_data.subjective = template.subjective_template
                if not note_data.objective and template.objective_template:
                    note_data.objective = template.objective_template
                if not note_data.assessment and template.assessment_template:
                    note_data.assessment = template.assessment_template
                if not note_data.plan and template.plan_template:
                    note_data.plan = template.plan_template
        
        # Create note
        note = ClinicalNote(
            **note_data.dict(),
            created_by=current_user_id
        )
        
        db.add(note)
        await db.commit()
        await db.refresh(note)
        
        return note
    
    @staticmethod
    async def get_visit_notes(
        db: AsyncSession,
        visit_id: UUID
    ) -> List[ClinicalNote]:
        """Get all notes for a visit"""
        stmt = select(ClinicalNote).where(
            and_(
                ClinicalNote.visit_id == visit_id,
                ClinicalNote.is_deleted == False
            )
        ).order_by(ClinicalNote.created_at.desc())
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_patient_notes(
        db: AsyncSession,
        patient_id: UUID,
        limit: int = 10
    ) -> List[ClinicalNote]:
        """Get patient note history"""
        stmt = select(ClinicalNote).where(
            and_(
                ClinicalNote.patient_id == patient_id,
                ClinicalNote.is_deleted == False
            )
        ).order_by(ClinicalNote.created_at.desc()).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def update_note(
        db: AsyncSession,
        note_id: UUID,
        note_data: ClinicalNoteUpdate,
        current_user_id: UUID
    ) -> ClinicalNote:
        """Update clinical note (only if not locked)"""
        stmt = select(ClinicalNote).where(ClinicalNote.id == note_id)
        result = await db.execute(stmt)
        note = result.scalar_one_or_none()
        
        if not note:
            raise NotFoundException(f"Clinical note {note_id} not found")
        
        if note.is_locked:
            raise ValidationException("Cannot edit locked note")
        
        # Only author can edit (or admins)
        if note.created_by != current_user_id:
            raise ValidationException("Only the author can edit this note")
        
        # Update fields
        update_data = note_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(note, field, value)
        
        await db.commit()
        await db.refresh(note)
        
        return note
    
    @staticmethod
    async def lock_note(
        db: AsyncSession,
        note_id: UUID,
        current_user_id: UUID
    ) -> ClinicalNote:
        """Lock/sign note (prevents further editing)"""
        stmt = select(ClinicalNote).where(ClinicalNote.id == note_id)
        result = await db.execute(stmt)
        note = result.scalar_one_or_none()
        
        if not note:
            raise NotFoundException(f"Clinical note {note_id} not found")
        
        if note.is_locked:
            raise ValidationException("Note is already locked")
        
        note.is_locked = True
        note.locked_at = datetime.utcnow()
        note.locked_by = current_user_id
        
        await db.commit()
        await db.refresh(note)
        
        return note
    
    @staticmethod
    async def delete_note(
        db: AsyncSession,
        note_id: UUID
    ) -> bool:
        """Soft delete note"""
        stmt = select(ClinicalNote).where(ClinicalNote.id == note_id)
        result = await db.execute(stmt)
        note = result.scalar_one_or_none()
        
        if not note:
            raise NotFoundException(f"Clinical note {note_id} not found")
        
        if note.is_locked:
            raise ValidationException("Cannot delete locked note")
        
        note.is_deleted = True
        await db.commit()
        
        return True
    
    # Template operations
    @staticmethod
    async def create_template(
        db: AsyncSession,
        template_data: NoteTemplateCreate,
        current_user_id: UUID
    ) -> NoteTemplate:
        """Create note template"""
        template = NoteTemplate(
            **template_data.dict(),
            created_by=current_user_id
        )
        
        db.add(template)
        await db.commit()
        await db.refresh(template)
        
        return template
    
    @staticmethod
    async def get_templates(
        db: AsyncSession,
        note_type: Optional[str] = None
    ) -> List[NoteTemplate]:
        """Get all active templates"""
        stmt = select(NoteTemplate).where(NoteTemplate.is_active == True)
        
        if note_type:
            stmt = stmt.where(NoteTemplate.note_type == note_type)
        
        stmt = stmt.order_by(NoteTemplate.name)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_template(
        db: AsyncSession,
        template_id: UUID
    ) -> Optional[NoteTemplate]:
        """Get template by ID"""
        stmt = select(NoteTemplate).where(NoteTemplate.id == template_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
```

---

### 5. API Router
**File:** `backend/app/api/v1/clinical_notes/router.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_db, get_current_user, require_doctor
from app.models.user import User
from app.schemas.clinical_note import (
    ClinicalNoteCreate,
    ClinicalNoteUpdate,
    ClinicalNoteResponse,
    NoteTemplateCreate,
    NoteTemplateResponse,
    NoteType
)
from app.api.v1.clinical_notes.service import ClinicalNoteService

router = APIRouter()

# Clinical Notes CRUD
@router.post("/", response_model=ClinicalNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: ClinicalNoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Create clinical note (Doctor only)"""
    return await ClinicalNoteService.create_note(db, note_data, current_user.id)

@router.get("/visit/{visit_id}", response_model=List[ClinicalNoteResponse])
async def get_visit_notes(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all notes for a visit"""
    return await ClinicalNoteService.get_visit_notes(db, visit_id)

@router.get("/patient/{patient_id}", response_model=List[ClinicalNoteResponse])
async def get_patient_notes(
    patient_id: UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient note history"""
    return await ClinicalNoteService.get_patient_notes(db, patient_id, limit)

@router.put("/{note_id}", response_model=ClinicalNoteResponse)
async def update_note(
    note_id: UUID,
    note_data: ClinicalNoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Update clinical note (if not locked)"""
    return await ClinicalNoteService.update_note(db, note_id, note_data, current_user.id)

@router.post("/{note_id}/lock", response_model=ClinicalNoteResponse)
async def lock_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Lock/sign note (prevents further editing)"""
    return await ClinicalNoteService.lock_note(db, note_id, current_user.id)

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Delete clinical note"""
    await ClinicalNoteService.delete_note(db, note_id)
    return None

# Note Templates
@router.post("/templates/", response_model=NoteTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: NoteTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Create note template"""
    return await ClinicalNoteService.create_template(db, template_data, current_user.id)

@router.get("/templates/", response_model=List[NoteTemplateResponse])
async def get_templates(
    note_type: Optional[NoteType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active templates"""
    return await ClinicalNoteService.get_templates(db, note_type)
```

---

### 6. Update API Router
**File:** `backend/app/api/v1/router.py`

```python
from app.api.v1.clinical_notes import router as clinical_notes_router

# Add to existing router includes
api_router.include_router(
    clinical_notes_router,
    prefix="/clinical-notes",
    tags=["Clinical Notes"]
)
```

---

### 7. Update Visit Model
**File:** `backend/app/models/visit.py`

```python
# Add relationship in Visit class
clinical_notes = relationship("ClinicalNote", back_populates="visit", cascade="all, delete-orphan")
```

---

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Create SOAP note
- [ ] Create note with template
- [ ] Get visit notes
- [ ] Get patient note history
- [ ] Update unlocked note
- [ ] Prevent editing locked note
- [ ] Lock/sign note
- [ ] Delete unlocked note
- [ ] Prevent deleting locked note
- [ ] Create note template
- [ ] Get templates by type

---

## Success Criteria

- ✅ SOAP notes save correctly
- ✅ Templates speed up documentation
- ✅ Locked notes cannot be edited
- ✅ Doctor-only access enforced
- ✅ Auto-save functionality works
- ✅ Feature flag integration ready

---

## Next Steps

After Phase 3E completion:
→ **Phase 3F: Clinical Notes Frontend** - Build SOAP note editor UI

---

**Documentation Version:** 1.0  
**Last Updated:** February 3, 2026
