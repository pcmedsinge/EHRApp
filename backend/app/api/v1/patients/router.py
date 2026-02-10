from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import math

from app.core.database import get_db
from app.api.v1.auth.router import get_current_user, get_current_user_optional
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientListResponse
from app.api.v1.patients.service import PatientService

router = APIRouter()


@router.get("/count")
async def get_patient_count(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Get total patient count.
    
    Returns the total number of active (non-deleted) patients.
    """
    count = await PatientService.get_patient_count(db)
    return {"total": count}


@router.post("/", response_model=PatientResponse, status_code=201)
async def create_patient(
    patient_data: PatientCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new patient.
    
    - **Auto-generates MRN** in format CLI-YYYY-NNNNN
    - **Validates** phone number uniqueness
    - **Records** creator in audit log
    
    Requires authentication.
    """
    patient = await PatientService.create_patient(db, patient_data, current_user)
    return patient


@router.get("/", response_model=PatientListResponse)
@router.get("", response_model=PatientListResponse)
async def list_patients(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    search: str = Query(None, description="Search by name, MRN, or phone"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List patients with pagination and search.
    
    - **Pagination**: Use page and size parameters
    - **Search**: Search across name, MRN, and phone
    - **Sorting**: Sort by any field (default: created_at desc)
    
    Returns paginated results with total count.
    Authentication is optional for this endpoint.
    """
    skip = (page - 1) * size
    patients, total = await PatientService.list_patients(
        db, skip, size, search, sort_by, sort_order
    )
    
    pages = math.ceil(total / size) if total > 0 else 1
    
    return PatientListResponse(
        items=patients,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/mrn/{mrn}", response_model=PatientResponse)
async def get_patient_by_mrn(
    mrn: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Get patient by Medical Record Number (MRN).
    
    - **MRN format**: CLI-YYYY-NNNNN
    - Returns 404 if patient not found
    """
    patient = await PatientService.get_patient_by_mrn(db, mrn)
    if not patient:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    return patient


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Get patient by ID.
    
    Returns full patient details including:
    - Demographics
    - Contact information
    - Address
    - Medical information
    - Calculated age
    """
    patient = await PatientService.get_patient(db, patient_id)
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: UUID,
    patient_data: PatientUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Update patient information.
    
    - All fields are optional
    - Only provided fields will be updated
    - MRN cannot be changed
    """
    patient = await PatientService.update_patient(db, patient_id, patient_data)
    return patient


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(
    patient_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Soft delete a patient.
    
    - Patient is marked as deleted, not physically removed
    - Can be restored if needed (future feature)
    - Hidden from normal queries
    """
    await PatientService.delete_patient(db, patient_id)
    return None
