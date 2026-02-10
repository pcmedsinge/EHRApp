"""
Clinical Notes Service

Business logic for clinical notes CRUD operations.
Phase: 3E (Clinical Notes Backend)
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.clinical_note import ClinicalNote, NoteTemplate
from app.schemas.clinical_note import ClinicalNoteCreate, ClinicalNoteUpdate, NoteTemplateCreate, NoteTemplateUpdate


class ClinicalNoteService:
    """Service layer for clinical notes operations"""
    
    @staticmethod
    async def create_note(
        db: AsyncSession,
        note_data: ClinicalNoteCreate,
        created_by: UUID
    ) -> ClinicalNote:
        """
        Create a new clinical note.
        Only doctors can create notes.
        Enforces one primary note per visit.
        """
        # Check if trying to create a primary note
        if note_data.is_primary:
            # Check for existing primary note
            existing_primary = await db.execute(
                select(ClinicalNote).where(
                    and_(
                        ClinicalNote.visit_id == note_data.visit_id,
                        ClinicalNote.is_primary == True,
                        ClinicalNote.is_deleted == False
                    )
                )
            )
            if existing_primary.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A primary clinical note already exists for this visit. Create an addendum note instead (is_primary=false)."
                )
        
        note = ClinicalNote(
            visit_id=note_data.visit_id,
            patient_id=note_data.patient_id,
            created_by=created_by,
            note_type=note_data.note_type,
            title=note_data.title,
            is_primary=note_data.is_primary,
            subjective=note_data.subjective,
            objective=note_data.objective,
            assessment=note_data.assessment,
            plan=note_data.plan,
            template_id=note_data.template_id
        )
        
        db.add(note)
        await db.commit()
        await db.refresh(note)
        
        # Load relationships
        await db.refresh(note, ['author', 'signer'])
        
        return note
    
    @staticmethod
    async def get_note_by_id(
        db: AsyncSession,
        note_id: UUID
    ) -> Optional[ClinicalNote]:
        """Get a clinical note by ID"""
        query = select(ClinicalNote).where(
            and_(
                ClinicalNote.id == note_id,
                ClinicalNote.is_deleted == False
            )
        ).options(
            selectinload(ClinicalNote.author),
            selectinload(ClinicalNote.signer)
        )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_visit_notes(
        db: AsyncSession,
        visit_id: UUID
    ) -> List[ClinicalNote]:
        """Get all clinical notes for a visit"""
        query = select(ClinicalNote).where(
            and_(
                ClinicalNote.visit_id == visit_id,
                ClinicalNote.is_deleted == False
            )
        ).options(
            selectinload(ClinicalNote.author),
            selectinload(ClinicalNote.signer)
        ).order_by(ClinicalNote.is_primary.desc(), ClinicalNote.created_at.desc())
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_primary_note(
        db: AsyncSession,
        visit_id: UUID
    ) -> Optional[ClinicalNote]:
        """Get the primary clinical note for a visit"""
        query = select(ClinicalNote).where(
            and_(
                ClinicalNote.visit_id == visit_id,
                ClinicalNote.is_primary == True,
                ClinicalNote.is_deleted == False
            )
        ).options(
            selectinload(ClinicalNote.author),
            selectinload(ClinicalNote.signer)
        )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_patient_notes(
        db: AsyncSession,
        patient_id: UUID,
        limit: int = 50
    ) -> List[ClinicalNote]:
        """Get all clinical notes for a patient"""
        query = select(ClinicalNote).where(
            and_(
                ClinicalNote.patient_id == patient_id,
                ClinicalNote.is_deleted == False
            )
        ).options(
            selectinload(ClinicalNote.author),
            selectinload(ClinicalNote.signer)
        ).order_by(ClinicalNote.created_at.desc()).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def update_note(
        db: AsyncSession,
        note_id: UUID,
        note_data: ClinicalNoteUpdate,
        current_user_id: UUID
    ) -> Optional[ClinicalNote]:
        """
        Update a clinical note.
        Cannot update locked notes.
        Only the author can update.
        """
        note = await ClinicalNoteService.get_note_by_id(db, note_id)
        
        if not note:
            return None
        
        # Check if note is locked
        if note.is_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update a locked note. Unlock it first."
            )
        
        # Check if current user is the author
        if note.created_by != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the note author can update this note"
            )
        
        # Update fields
        update_data = note_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(note, field, value)
        
        await db.commit()
        await db.refresh(note)
        await db.refresh(note, ['author', 'signer'])
        
        return note
    
    @staticmethod
    async def lock_note(
        db: AsyncSession,
        note_id: UUID,
        user_id: UUID,
        lock: bool = True
    ) -> Optional[ClinicalNote]:
        """
        Lock/unlock (sign) a clinical note.
        Locked notes cannot be edited.
        Only the author can lock/unlock.
        """
        note = await ClinicalNoteService.get_note_by_id(db, note_id)
        
        if not note:
            return None
        
        # Check if current user is the author
        if note.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the note author can lock/unlock this note"
            )
        
        if lock:
            note.is_locked = True
            note.locked_at = datetime.utcnow()
            note.locked_by = user_id
        else:
            note.is_locked = False
            note.locked_at = None
            note.locked_by = None
        
        await db.commit()
        await db.refresh(note)
        await db.refresh(note, ['author', 'signer'])
        
        return note
    
    @staticmethod
    async def delete_note(
        db: AsyncSession,
        note_id: UUID,
        current_user_id: UUID
    ) -> bool:
        """
        Soft delete a clinical note.
        Cannot delete locked notes.
        Only the author can delete.
        """
        note = await ClinicalNoteService.get_note_by_id(db, note_id)
        
        if not note:
            return False
        
        # Check if note is locked
        if note.is_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete a locked note"
            )
        
        # Check if current user is the author
        if note.created_by != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the note author can delete this note"
            )
        
        note.is_deleted = True
        await db.commit()
        return True


class NoteTemplateService:
    """Service layer for note template operations"""
    
    @staticmethod
    async def create_template(
        db: AsyncSession,
        template_data: NoteTemplateCreate,
        created_by: UUID
    ) -> NoteTemplate:
        """Create a new note template"""
        template = NoteTemplate(
            name=template_data.name,
            note_type=template_data.note_type,
            specialty=template_data.specialty,
            subjective_template=template_data.subjective_template,
            objective_template=template_data.objective_template,
            assessment_template=template_data.assessment_template,
            plan_template=template_data.plan_template,
            is_active=template_data.is_active,
            is_default=template_data.is_default,
            created_by=created_by
        )
        
        db.add(template)
        await db.commit()
        await db.refresh(template)
        await db.refresh(template, ['creator'])
        
        return template
    
    @staticmethod
    async def get_templates(
        db: AsyncSession,
        note_type: Optional[str] = None,
        specialty: Optional[str] = None,
        active_only: bool = True
    ) -> List[NoteTemplate]:
        """Get all note templates with optional filters"""
        query = select(NoteTemplate)
        
        conditions = []
        if active_only:
            conditions.append(NoteTemplate.is_active == True)
        if note_type:
            conditions.append(NoteTemplate.note_type == note_type)
        if specialty:
            conditions.append(NoteTemplate.specialty == specialty)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        query = query.options(selectinload(NoteTemplate.creator)).order_by(
            NoteTemplate.is_default.desc(),
            NoteTemplate.name
        )
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def get_template_by_id(
        db: AsyncSession,
        template_id: UUID
    ) -> Optional[NoteTemplate]:
        """Get a template by ID"""
        query = select(NoteTemplate).where(
            NoteTemplate.id == template_id
        ).options(selectinload(NoteTemplate.creator))
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_template(
        db: AsyncSession,
        template_id: UUID,
        template_data: NoteTemplateUpdate
    ) -> Optional[NoteTemplate]:
        """Update a note template"""
        template = await NoteTemplateService.get_template_by_id(db, template_id)
        
        if not template:
            return None
        
        update_data = template_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        
        await db.commit()
        await db.refresh(template)
        await db.refresh(template, ['creator'])
        
        return template
    
    @staticmethod
    async def delete_template(
        db: AsyncSession,
        template_id: UUID
    ) -> bool:
        """Delete a note template"""
        template = await NoteTemplateService.get_template_by_id(db, template_id)
        
        if not template:
            return False
        
        await db.delete(template)
        await db.commit()
        return True
