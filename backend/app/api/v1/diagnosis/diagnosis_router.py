"""
Diagnosis API Router
====================

Purpose:
  API endpoints for diagnosis CRUD operations.

Module: app/api/v1/diagnosis/diagnosis_router.py
Phase: 3C (Backend - Diagnosis)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.v1.auth.router import get_current_user
from app.api.v1.diagnosis.diagnosis_service import DiagnosisService
from app.schemas.diagnosis import DiagnosisCreate, DiagnosisUpdate, DiagnosisResponse
from app.models.user import User
from typing import List
from uuid import UUID

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_diagnosis(
    diagnosis_data: DiagnosisCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new diagnosis for a visit.
    
    **Features:**
    - ICD-10 code is OPTIONAL
    - Auto-fills description from ICD-10 if code provided
    - Validates only one primary diagnosis per visit
    - Increments ICD-10 usage counter
    
    **Requires:** Doctor or Nurse role
    """
    from fastapi.responses import JSONResponse
    
    # Check role authorization
    if current_user.role not in ["doctor", "nurse"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and nurses can create diagnoses"
        )
    
    diagnosis = await DiagnosisService.create_diagnosis(
        db=db,
        diagnosis_data=diagnosis_data,
        current_user_id=current_user.id
    )
    
    # Manual serialization - don't access icd10 relationship, query it separately if needed
    icd10_data = None
    if diagnosis.icd10_code:
        # Query ICD10 code separately to avoid lazy load issues
        from app.api.v1.diagnosis.icd10_service import ICD10Service
        icd10 = await ICD10Service.get_code_details(db, diagnosis.icd10_code)
        if icd10:
            icd10_data = {
                "code": icd10.code,
                "description": icd10.description,
                "category": icd10.category,
                "subcategory": icd10.subcategory,
                "usage_count": icd10.usage_count,
                "common_in_india": icd10.common_in_india
            }
    
    result = {
        "id": str(diagnosis.id),
        "visit_id": str(diagnosis.visit_id),
        "patient_id": str(diagnosis.patient_id),
        "diagnosed_by": str(diagnosis.diagnosed_by),
        "icd10_code": diagnosis.icd10_code,
        "diagnosis_description": diagnosis.diagnosis_description,
        "diagnosis_type": diagnosis.diagnosis_type,
        "status": diagnosis.status,
        "severity": diagnosis.severity,
        "diagnosed_date": diagnosis.diagnosed_date.isoformat() if diagnosis.diagnosed_date else None,
        "onset_date": diagnosis.onset_date.isoformat() if diagnosis.onset_date else None,
        "notes": diagnosis.notes,
        "created_at": diagnosis.created_at.isoformat() if diagnosis.created_at else None,
        "updated_at": diagnosis.updated_at.isoformat() if diagnosis.updated_at else None,
        "icd10": icd10_data
    }
    
    return JSONResponse(content=result, status_code=201)

@router.get("/visit/{visit_id}")
async def get_visit_diagnoses(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all diagnoses for a specific visit.
    Ordered by type (primary first) and creation date.
    """
    from fastapi.responses import JSONResponse
    
    diagnoses = await DiagnosisService.get_visit_diagnoses(
        db=db,
        visit_id=visit_id
    )
    
    # Manually serialize to avoid Pydantic validation issues
    result = []
    for diag in diagnoses:
        icd10_data = None
        if diag.icd10_code and hasattr(diag, 'icd10') and diag.icd10:
            # Handle if icd10 is a list or single object
            icd10_obj = diag.icd10[0] if isinstance(diag.icd10, list) and len(diag.icd10) > 0 else diag.icd10
            if icd10_obj and hasattr(icd10_obj, 'code'):
                icd10_data = {
                    "code": icd10_obj.code,
                    "description": icd10_obj.description,
                    "category": icd10_obj.category,
                    "subcategory": icd10_obj.subcategory,
                    "usage_count": icd10_obj.usage_count,
                    "common_in_india": icd10_obj.common_in_india
                }
        
        result.append({
            "id": str(diag.id),
            "visit_id": str(diag.visit_id),
            "patient_id": str(diag.patient_id),
            "diagnosed_by": str(diag.diagnosed_by),
            "icd10_code": diag.icd10_code,
            "diagnosis_description": diag.diagnosis_description,
            "diagnosis_type": diag.diagnosis_type,
            "status": diag.status,
            "severity": diag.severity,
            "diagnosed_date": diag.diagnosed_date.isoformat() if diag.diagnosed_date else None,
            "onset_date": diag.onset_date.isoformat() if diag.onset_date else None,
            "notes": diag.notes,
            "created_at": diag.created_at.isoformat() if diag.created_at else None,
            "updated_at": diag.updated_at.isoformat() if diag.updated_at else None,
            "icd10": icd10_data
        })
    
    return JSONResponse(content=result)

@router.get("/patient/{patient_id}", response_model=List[DiagnosisResponse])
async def get_patient_diagnosis_history(
    patient_id: UUID,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get diagnosis history for a patient.
    Ordered by diagnosis date (most recent first).
    
    - **patient_id**: Patient UUID
    - **limit**: Maximum number of records (default: 100)
    """
    diagnoses = await DiagnosisService.get_patient_diagnosis_history(
        db=db,
        patient_id=patient_id,
        limit=limit
    )
    return diagnoses

@router.get("/{diagnosis_id}", response_model=DiagnosisResponse)
async def get_diagnosis(
    diagnosis_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get diagnosis by ID"""
    diagnosis = await DiagnosisService.get_diagnosis_by_id(
        db=db,
        diagnosis_id=diagnosis_id
    )
    
    if not diagnosis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Diagnosis not found: {diagnosis_id}"
        )
    
    return diagnosis

@router.put("/{diagnosis_id}", response_model=DiagnosisResponse)
async def update_diagnosis(
    diagnosis_id: UUID,
    diagnosis_data: DiagnosisUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update diagnosis.
    
    **Requires:** Doctor or Nurse role
    """
    # Check role authorization
    if current_user.role not in ["doctor", "nurse"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and nurses can update diagnoses"
        )
    
    diagnosis = await DiagnosisService.update_diagnosis(
        db=db,
        diagnosis_id=diagnosis_id,
        diagnosis_data=diagnosis_data
    )
    
    if not diagnosis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Diagnosis not found: {diagnosis_id}"
        )
    
    return diagnosis

@router.delete("/{diagnosis_id}", status_code=status.HTTP_200_OK)
async def delete_diagnosis(
    diagnosis_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Soft delete diagnosis.
    
    **Requires:** Doctor role only
    """
    from fastapi.responses import JSONResponse
    
    # Only doctors can delete diagnoses
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can delete diagnoses"
        )
    
    success = await DiagnosisService.delete_diagnosis(
        db=db,
        diagnosis_id=diagnosis_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Diagnosis not found: {diagnosis_id}"
        )
    
    return JSONResponse(content={"message": "Diagnosis deleted successfully"})
    
    return None
