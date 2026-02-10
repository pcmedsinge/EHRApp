from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.api.v1.auth.router import get_current_user
from app.models.user import User
from app.schemas.vital import VitalCreate, VitalUpdate, VitalResponse
from app.api.v1.vitals.service import VitalService

router = APIRouter()


@router.post("/", response_model=VitalResponse, status_code=status.HTTP_201_CREATED)
async def create_vital(
    vital_data: VitalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new vital signs record"""
    return await VitalService.create_vital(db, vital_data, current_user.id)


@router.get("/visit/{visit_id}", response_model=List[VitalResponse])
async def get_visit_vitals(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all vitals for a specific visit"""
    return await VitalService.get_visit_vitals(db, visit_id)


@router.get("/patient/{patient_id}", response_model=List[VitalResponse])
async def get_patient_vitals(
    patient_id: UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient vital signs history"""
    return await VitalService.get_patient_vitals(db, patient_id, limit)


@router.get("/patient/{patient_id}/latest", response_model=VitalResponse)
async def get_latest_vitals(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get most recent vitals for a patient"""
    vital = await VitalService.get_latest_vitals(db, patient_id)
    if not vital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No vitals found for this patient"
        )
    return vital


@router.put("/{vital_id}", response_model=VitalResponse)
async def update_vital(
    vital_id: UUID,
    vital_data: VitalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update vital signs"""
    return await VitalService.update_vital(db, vital_id, vital_data)


@router.delete("/{vital_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vital(
    vital_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete vital signs record"""
    await VitalService.delete_vital(db, vital_id)
    return None
