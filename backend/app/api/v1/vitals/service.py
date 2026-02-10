from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from fastapi import HTTPException, status
from uuid import UUID
from typing import List, Optional
from app.models.vital import Vital
from app.models.visit import Visit
from app.schemas.vital import VitalCreate, VitalUpdate


class VitalService:
    """Service layer for vital signs operations"""
    
    @staticmethod
    def calculate_bmi(weight_kg: Optional[float], height_cm: Optional[float]) -> Optional[float]:
        """Calculate BMI from weight and height"""
        if weight_kg and height_cm and height_cm > 0:
            height_m = height_cm / 100
            bmi = weight_kg / (height_m ** 2)
            return round(bmi, 2)
        return None
    
    @staticmethod
    async def create_vital(
        db: AsyncSession,
        vital_data: VitalCreate,
        current_user_id: UUID
    ) -> Vital:
        """Create new vital signs record"""
        # Verify visit exists
        stmt = select(Visit).where(Visit.id == vital_data.visit_id)
        result = await db.execute(stmt)
        visit = result.scalar_one_or_none()
        
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit {vital_data.visit_id} not found"
            )
        
        # Calculate BMI if height and weight provided
        bmi = VitalService.calculate_bmi(vital_data.weight_kg, vital_data.height_cm)
        
        # Create vital record
        vital = Vital(
            **vital_data.model_dump(),
            recorded_by=current_user_id,
            bmi=bmi
        )
        
        db.add(vital)
        await db.commit()
        await db.refresh(vital)
        
        return vital
    
    @staticmethod
    async def get_visit_vitals(
        db: AsyncSession,
        visit_id: UUID
    ) -> List[Vital]:
        """Get all vitals for a visit"""
        stmt = select(Vital).where(
            and_(
                Vital.visit_id == visit_id,
                Vital.is_deleted == False
            )
        ).order_by(Vital.recorded_at.desc())
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_patient_vitals(
        db: AsyncSession,
        patient_id: UUID,
        limit: int = 10
    ) -> List[Vital]:
        """Get patient vital signs history"""
        stmt = select(Vital).where(
            and_(
                Vital.patient_id == patient_id,
                Vital.is_deleted == False
            )
        ).order_by(Vital.recorded_at.desc()).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_latest_vitals(
        db: AsyncSession,
        patient_id: UUID
    ) -> Optional[Vital]:
        """Get most recent vitals for a patient"""
        stmt = select(Vital).where(
            and_(
                Vital.patient_id == patient_id,
                Vital.is_deleted == False
            )
        ).order_by(Vital.recorded_at.desc()).limit(1)
        
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_vital(
        db: AsyncSession,
        vital_id: UUID,
        vital_data: VitalUpdate
    ) -> Vital:
        """Update vital signs"""
        stmt = select(Vital).where(Vital.id == vital_id)
        result = await db.execute(stmt)
        vital = result.scalar_one_or_none()
        
        if not vital:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vital {vital_id} not found"
            )
        
        # Update fields
        update_data = vital_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(vital, field, value)
        
        # Recalculate BMI if height or weight changed
        if 'height_cm' in update_data or 'weight_kg' in update_data:
            vital.bmi = VitalService.calculate_bmi(vital.weight_kg, vital.height_cm)
        
        await db.commit()
        await db.refresh(vital)
        
        return vital
    
    @staticmethod
    async def delete_vital(
        db: AsyncSession,
        vital_id: UUID
    ) -> bool:
        """Soft delete vital signs"""
        stmt = select(Vital).where(Vital.id == vital_id)
        result = await db.execute(stmt)
        vital = result.scalar_one_or_none()
        
        if not vital:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vital {vital_id} not found"
            )
        
        vital.is_deleted = True
        await db.commit()
        
        return True
