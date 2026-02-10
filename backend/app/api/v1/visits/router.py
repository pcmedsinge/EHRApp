"""
Visits API Router
=================

Purpose:
    RESTful API endpoints for Visit management.
    Provides CRUD, status updates, and specialized queries.

Module: app/api/v1/visits/router.py
Phase: 2B (Backend - Visit API)

References:
    - Phase 2B Spec: docs/phases/phase2/Phase2B_Backend_VisitAPI.md
    - Visit Service: app/api/v1/visits/service.py
    - Visit Schemas: app/schemas/visit.py

Endpoints:
    POST   /                     - Create visit
    GET    /                     - List visits (filtered, paginated)
    GET    /{id}                 - Get visit by ID
    GET    /number/{visit_number} - Get visit by number
    PUT    /{id}                 - Update visit
    DELETE /{id}                 - Cancel visit
    PATCH  /{id}/status          - Update status
    POST   /{id}/start           - Start consultation
    POST   /{id}/complete        - Complete consultation
    GET    /patient/{patient_id} - Patient visit history
    GET    /doctor/{doctor_id}   - Doctor's visits
    GET    /today                - Today's visits
    GET    /queue                - Current queue
    GET    /stats                - Visit statistics

Authorization:
    All endpoints require authentication.
    Role-based access implemented via dependencies.
"""

from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import date
import math

from app.core.database import get_db
from app.api.v1.auth.router import get_current_user
from app.models.user import User
from app.models.enums import VisitStatus, VisitType, Priority
from app.schemas.visit import (
    VisitCreate, VisitUpdate, VisitStatusUpdate,
    VisitResponse, VisitListResponse, VisitSummary, VisitStatsResponse
)
from app.api.v1.visits.service import VisitService


router = APIRouter()


# =============================================================================
# CRUD ENDPOINTS
# =============================================================================

@router.post("/", response_model=VisitResponse, status_code=201)
async def create_visit(
    visit_data: VisitCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new visit.
    
    - **Auto-generates visit number** in format VIS-YYYY-NNNNN
    - **Validates** patient exists
    - **Validates** doctor exists (if assigned)
    - **Sets** initial status to REGISTERED
    - **Records** check-in time and creator
    
    Required fields:
    - **patient_id**: Must reference existing patient
    
    Optional fields:
    - **assigned_doctor_id**: Doctor to assign
    - **visit_date**: Date of visit (default: today)
    - **visit_type**: consultation, follow_up, emergency, procedure
    - **priority**: normal, urgent, emergency
    - **department**: Department name
    - **chief_complaint**: Reason for visit
    - **notes**: Additional notes
    """
    visit = await VisitService.create_visit(db, visit_data, current_user)
    return visit


@router.get("/", response_model=VisitListResponse)
async def list_visits(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    status: Optional[VisitStatus] = Query(None, description="Filter by status"),
    visit_type: Optional[VisitType] = Query(None, description="Filter by type"),
    priority: Optional[Priority] = Query(None, description="Filter by priority"),
    patient_id: Optional[UUID] = Query(None, description="Filter by patient"),
    doctor_id: Optional[UUID] = Query(None, description="Filter by doctor"),
    date_from: Optional[date] = Query(None, description="Start date filter"),
    date_to: Optional[date] = Query(None, description="End date filter"),
    search: Optional[str] = Query(None, description="Search visit_number, patient name, MRN"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List visits with filtering and pagination.
    
    **Filters:**
    - status: registered, waiting, in_progress, completed, cancelled
    - visit_type: consultation, follow_up, emergency, procedure
    - priority: normal, urgent, emergency
    - patient_id: Filter by specific patient
    - doctor_id: Filter by assigned doctor
    - date_from/date_to: Date range
    - search: Search in visit number, patient name, MRN
    
    **Sorting:**
    - sort_by: Any field (default: created_at)
    - sort_order: asc or desc
    """
    skip = (page - 1) * size
    visits, total = await VisitService.list_visits(
        db,
        skip=skip,
        limit=size,
        status_filter=status,
        visit_type=visit_type,
        priority=priority,
        patient_id=patient_id,
        doctor_id=doctor_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    pages = math.ceil(total / size) if total > 0 else 1
    
    # Convert to summary
    items = []
    for visit in visits:
        items.append(VisitSummary(
            id=visit.id,
            visit_number=visit.visit_number,
            patient_id=visit.patient_id,
            patient_name=visit.patient.full_name if visit.patient else None,
            doctor_name=visit.assigned_doctor.full_name if visit.assigned_doctor else None,
            visit_date=visit.visit_date,
            visit_type=visit.visit_type,
            status=visit.status,
            priority=visit.priority,
            chief_complaint=visit.chief_complaint,
            check_in_time=visit.check_in_time
        ))
    
    return VisitListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/today", response_model=List[VisitResponse])
async def get_today_visits(
    status: Optional[VisitStatus] = Query(None, description="Filter by status"),
    doctor_id: Optional[UUID] = Query(None, description="Filter by doctor"),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get today's visits.
    
    Returns all visits for today's date.
    Optionally filter by status and/or doctor.
    """
    visits = await VisitService.get_today_visits(db, status, doctor_id)
    return visits


@router.get("/queue", response_model=List[VisitResponse])
async def get_queue(
    status: Optional[VisitStatus] = Query(None, description="Filter by status"),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get current waiting queue.
    
    Returns visits with status REGISTERED or WAITING for today.
    Ordered by priority (emergency first) then check-in time.
    """
    visits = await VisitService.get_queue(db, status)
    return visits


@router.get("/stats", response_model=VisitStatsResponse)
async def get_visit_stats(
    date_from: Optional[date] = Query(None, description="Start date (default: today)"),
    date_to: Optional[date] = Query(None, description="End date (default: today)"),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get visit statistics.
    
    Returns:
    - Total visit count
    - Breakdown by status
    - Breakdown by type
    - Average wait time (minutes)
    - Average consultation duration (minutes)
    """
    stats = await VisitService.get_visit_stats(db, date_from, date_to)
    return stats


@router.get("/patient/{patient_id}", response_model=VisitListResponse)
async def get_patient_visits(
    patient_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get visit history for a specific patient.
    
    Returns all visits for the patient, ordered by date (newest first).
    """
    skip = (page - 1) * size
    visits, total = await VisitService.get_patient_visits(
        db, patient_id, skip, size
    )
    
    pages = math.ceil(total / size) if total > 0 else 1
    
    items = []
    for visit in visits:
        items.append(VisitSummary(
            id=visit.id,
            visit_number=visit.visit_number,
            patient_id=visit.patient_id,
            patient_name=visit.patient.full_name if visit.patient else None,
            doctor_name=visit.assigned_doctor.full_name if visit.assigned_doctor else None,
            visit_date=visit.visit_date,
            visit_type=visit.visit_type,
            status=visit.status,
            priority=visit.priority,
            chief_complaint=visit.chief_complaint,
            check_in_time=visit.check_in_time
        ))
    
    return VisitListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/doctor/{doctor_id}", response_model=List[VisitResponse])
async def get_doctor_visits(
    doctor_id: UUID,
    visit_date: Optional[date] = Query(None, description="Date (default: today)"),
    status: Optional[VisitStatus] = Query(None, description="Filter by status"),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get visits assigned to a specific doctor.
    
    Returns all visits for the doctor on the specified date (default: today).
    Ordered by priority then check-in time.
    """
    visits = await VisitService.get_doctor_visits(db, doctor_id, visit_date, status)
    return visits


@router.get("/number/{visit_number}", response_model=VisitResponse)
async def get_visit_by_number(
    visit_number: str,
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get visit by visit number.
    
    - **Visit number format**: VIS-YYYY-NNNNN
    - Returns 404 if not found
    """
    visit = await VisitService.get_visit_by_number(db, visit_number)
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    return visit


@router.get("/{visit_id}", response_model=VisitResponse)
async def get_visit(
    visit_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get visit by ID.
    
    Returns full visit details including:
    - Visit information
    - Patient summary (name, MRN, phone)
    - Doctor summary (name)
    - Computed wait time and duration
    """
    visit = await VisitService.get_visit(db, visit_id)
    return visit


@router.put("/{visit_id}", response_model=VisitResponse)
async def update_visit(
    visit_id: UUID,
    visit_data: VisitUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Update visit information.
    
    - All fields are optional
    - Only provided fields will be updated
    - Cannot modify COMPLETED or CANCELLED visits
    - Use PATCH /{id}/status for status changes
    """
    visit = await VisitService.update_visit(db, visit_id, visit_data, current_user)
    return visit


@router.delete("/{visit_id}", response_model=VisitResponse)
async def cancel_visit(
    visit_id: UUID,
    reason: str = Query(..., min_length=1, description="Cancellation reason (required)"),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a visit (soft delete).
    
    - Sets status to CANCELLED
    - Records cancellation reason
    - Cannot cancel already COMPLETED visits
    """
    visit = await VisitService.cancel_visit(db, visit_id, reason, current_user)
    return visit


# =============================================================================
# STATUS MANAGEMENT ENDPOINTS
# =============================================================================

@router.patch("/{visit_id}/status", response_model=VisitResponse)
async def update_visit_status(
    visit_id: UUID,
    status_data: VisitStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Update visit status.
    
    **Valid transitions:**
    - REGISTERED → WAITING, CANCELLED
    - WAITING → IN_PROGRESS, CANCELLED
    - IN_PROGRESS → COMPLETED, CANCELLED
    - COMPLETED → (none - terminal)
    - CANCELLED → (none - terminal)
    
    **Side effects:**
    - IN_PROGRESS: Sets consultation_start_time
    - COMPLETED: Sets consultation_end_time
    - CANCELLED: Requires cancellation_reason
    """
    visit = await VisitService.update_status(db, visit_id, status_data, current_user)
    return visit


@router.post("/{visit_id}/start", response_model=VisitResponse)
async def start_consultation(
    visit_id: UUID,
    doctor_id: Optional[UUID] = Query(None, description="Assign doctor (optional)"),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Start consultation.
    
    - Sets status to IN_PROGRESS
    - Records consultation_start_time
    - Optionally assigns doctor (if provided and not already assigned)
    
    Typically used by doctors when calling patient.
    """
    # Use current user as doctor if not specified
    doc_id = doctor_id or current_user.id
    visit = await VisitService.start_consultation(db, visit_id, doc_id, current_user)
    return visit


@router.post("/{visit_id}/complete", response_model=VisitResponse)
async def complete_consultation(
    visit_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Complete consultation.
    
    - Sets status to COMPLETED
    - Records consultation_end_time
    
    Typically used by doctors after finishing with patient.
    """
    visit = await VisitService.complete_consultation(db, visit_id, current_user)
    return visit
