"""
Diagnosis Service
=================

Purpose:
  Business logic for diagnosis CRUD operations.

Module: app/api/v1/diagnosis/diagnosis_service.py
Phase: 3C (Backend - Diagnosis)
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.diagnosis import Diagnosis
from app.models.visit import Visit
from app.schemas.diagnosis import DiagnosisCreate, DiagnosisUpdate
from app.api.v1.diagnosis.icd10_service import ICD10Service
from typing import List, Optional
from uuid import UUID

class DiagnosisService:
    """Service for diagnosis operations"""
    
    @staticmethod
    async def create_diagnosis(
        db: AsyncSession,
        diagnosis_data: DiagnosisCreate,
        current_user_id: UUID
    ) -> Diagnosis:
        """
        Create a new diagnosis.
        Validates ICD-10 code if provided and auto-fills description.
        Enforces only one primary diagnosis per visit.
        """
        # Verify visit exists
        visit_stmt = select(Visit).where(Visit.id == diagnosis_data.visit_id)
        visit_result = await db.execute(visit_stmt)
        visit = visit_result.scalar_one_or_none()
        
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit not found: {diagnosis_data.visit_id}"
            )
        
        # Get existing diagnoses for this visit
        existing_diagnoses = await DiagnosisService.get_visit_diagnoses(
            db, diagnosis_data.visit_id
        )
        
        # Check if primary diagnosis already exists for this visit (case-insensitive)
        if diagnosis_data.diagnosis_type.lower() == "primary":
            if any(d.diagnosis_type.lower() == "primary" for d in existing_diagnoses):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Visit already has a primary diagnosis. Use secondary type or update existing."
                )
        
        # Check for duplicate diagnosis (same ICD-10 code or same description)
        if diagnosis_data.icd10_code:
            if any(d.icd10_code == diagnosis_data.icd10_code for d in existing_diagnoses):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Diagnosis with ICD-10 code {diagnosis_data.icd10_code} already exists for this visit."
                )
        else:
            # For free-text diagnoses, check for similar descriptions
            if any(d.diagnosis_description.lower() == diagnosis_data.diagnosis_description.lower() 
                   for d in existing_diagnoses if not d.icd10_code):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A diagnosis with similar description already exists for this visit."
                )
        
        # Validate ICD-10 code if provided
        if diagnosis_data.icd10_code:
            icd10 = await ICD10Service.get_code_details(db, diagnosis_data.icd10_code)
            if not icd10:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid ICD-10 code: {diagnosis_data.icd10_code}"
                )
            
            # Auto-fill description from ICD-10 if not provided or too short
            if not diagnosis_data.diagnosis_description or len(diagnosis_data.diagnosis_description) < 10:
                diagnosis_data.diagnosis_description = icd10.description
            
            # Increment usage count
            await ICD10Service.increment_usage(db, diagnosis_data.icd10_code)
        
        # Create diagnosis
        diagnosis_dict = diagnosis_data.model_dump()
        
        # Convert enum objects to their string values for database
        # Pydantic V2 model_dump() returns enum objects, not values
        if hasattr(diagnosis_dict['diagnosis_type'], 'value'):
            diagnosis_dict['diagnosis_type'] = diagnosis_dict['diagnosis_type'].value
        if hasattr(diagnosis_dict['status'], 'value'):
            diagnosis_dict['status'] = diagnosis_dict['status'].value
        if diagnosis_dict.get('severity') and hasattr(diagnosis_dict['severity'], 'value'):
            diagnosis_dict['severity'] = diagnosis_dict['severity'].value
        
        # Normalize to lowercase for database consistency
        diagnosis_dict['diagnosis_type'] = diagnosis_dict['diagnosis_type'].lower()
        diagnosis_dict['status'] = diagnosis_dict['status'].lower()
        if diagnosis_dict.get('severity'):
            diagnosis_dict['severity'] = diagnosis_dict['severity'].lower()
            
        diagnosis = Diagnosis(
            **diagnosis_dict,
            diagnosed_by=current_user_id
        )
        
        db.add(diagnosis)
        await db.commit()
        await db.refresh(diagnosis)
        
        return diagnosis
    
    @staticmethod
    async def get_visit_diagnoses(
        db: AsyncSession,
        visit_id: UUID
    ) -> List[Diagnosis]:
        """Get all diagnoses for a visit"""
        stmt = select(Diagnosis).where(
            and_(
                Diagnosis.visit_id == visit_id,
                Diagnosis.is_deleted == False
            )
        ).options(
            selectinload(Diagnosis.icd10)
        ).order_by(
            Diagnosis.diagnosis_type,
            Diagnosis.created_at
        )
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_patient_diagnosis_history(
        db: AsyncSession,
        patient_id: UUID,
        limit: int = 100
    ) -> List[Diagnosis]:
        """Get patient diagnosis history"""
        stmt = select(Diagnosis).where(
            and_(
                Diagnosis.patient_id == patient_id,
                Diagnosis.is_deleted == False
            )
        ).options(
            selectinload(Diagnosis.icd10)
        ).order_by(
            Diagnosis.diagnosed_date.desc(),
            Diagnosis.created_at.desc()
        ).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_diagnosis_by_id(
        db: AsyncSession,
        diagnosis_id: UUID
    ) -> Optional[Diagnosis]:
        """Get diagnosis by ID"""
        stmt = select(Diagnosis).where(
            and_(
                Diagnosis.id == diagnosis_id,
                Diagnosis.is_deleted == False
            )
        ).options(
            selectinload(Diagnosis.icd10)
        )
        
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_diagnosis(
        db: AsyncSession,
        diagnosis_id: UUID,
        diagnosis_data: DiagnosisUpdate
    ) -> Optional[Diagnosis]:
        """Update diagnosis"""
        diagnosis = await DiagnosisService.get_diagnosis_by_id(db, diagnosis_id)
        
        if not diagnosis:
            return None
        
        # Validate ICD-10 code if being updated
        if diagnosis_data.icd10_code:
            icd10 = await ICD10Service.get_code_details(db, diagnosis_data.icd10_code)
            if not icd10:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid ICD-10 code: {diagnosis_data.icd10_code}"
                )
        
        # Update fields
        update_data = diagnosis_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(diagnosis, field, value)
        
        await db.commit()
        await db.refresh(diagnosis)
        
        return diagnosis
    
    @staticmethod
    async def delete_diagnosis(
        db: AsyncSession,
        diagnosis_id: UUID
    ) -> bool:
        """Soft delete diagnosis"""
        diagnosis = await DiagnosisService.get_diagnosis_by_id(db, diagnosis_id)
        
        if not diagnosis:
            return False
        
        diagnosis.is_deleted = True
        await db.commit()
        
        return True
