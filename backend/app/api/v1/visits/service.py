"""
Visit Service
=============

Purpose:
    Business logic layer for Visit operations.
    Handles CRUD, status transitions, and query methods.

Module: app/api/v1/visits/service.py
Phase: 2B (Backend - Visit API)

References:
    - Phase 2B Spec: docs/phases/phase2/Phase2B_Backend_VisitAPI.md
    - Visit Model: app/models/visit.py
    - Status Enums: app/models/enums.py

Used By:
    - app/api/v1/visits/router.py (API endpoints)

Features:
    - CRUD operations with validation
    - Status transition validation using ALLOWED_STATUS_TRANSITIONS
    - Automatic timestamp setting on status changes
    - Patient visit history
    - Today's visits and queue
    - Visit statistics
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_, case
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime, timedelta

from app.models.visit import Visit
from app.models.patient import Patient
from app.models.user import User
from app.models.enums import VisitStatus, VisitType, Priority, ALLOWED_STATUS_TRANSITIONS
from app.schemas.visit import (
    VisitCreate, VisitUpdate, VisitStatusUpdate,
    VisitSummary, VisitStatsResponse
)
from app.utils.visit_number_generator import VisitNumberGenerator


class VisitService:
    """
    Visit service with business logic.
    
    Handles all visit-related operations including:
    - CRUD operations
    - Status management with validation
    - Filtering and pagination
    - Statistics calculation
    """
    
    # =========================================================================
    # CREATE OPERATIONS
    # =========================================================================
    
    @staticmethod
    async def create_visit(
        db: AsyncSession,
        visit_data: VisitCreate,
        current_user: User
    ) -> Visit:
        """
        Create a new visit.
        
        Args:
            db: Database session
            visit_data: Visit creation data
            current_user: Current authenticated user
            
        Returns:
            Created Visit object
            
        Raises:
            HTTPException 404: Patient not found
            HTTPException 404: Doctor not found (if assigned)
        """
        # Verify patient exists
        patient = await db.get(Patient, visit_data.patient_id)
        if not patient or patient.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Verify doctor exists if assigned
        if visit_data.assigned_doctor_id:
            doctor = await db.get(User, visit_data.assigned_doctor_id)
            if not doctor or not doctor.is_active:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found"
                )
        
        # Generate visit number
        visit_number = await VisitNumberGenerator.generate(db)
        
        # Create visit
        visit = Visit(
            visit_number=visit_number,
            status=VisitStatus.REGISTERED,
            check_in_time=datetime.utcnow(),
            created_by=current_user.id,
            **visit_data.model_dump()
        )
        
        db.add(visit)
        await db.commit()
        await db.refresh(visit)
        
        # Load relationships for response
        return await VisitService.get_visit(db, visit.id)
    
    # =========================================================================
    # READ OPERATIONS
    # =========================================================================
    
    @staticmethod
    async def get_visit(
        db: AsyncSession,
        visit_id: UUID
    ) -> Visit:
        """
        Get visit by ID with related entities.
        
        Args:
            db: Database session
            visit_id: Visit UUID
            
        Returns:
            Visit with patient and doctor loaded
            
        Raises:
            HTTPException 404: Visit not found
        """
        stmt = (
            select(Visit)
            .options(
                selectinload(Visit.patient),
                selectinload(Visit.assigned_doctor)
            )
            .where(
                Visit.id == visit_id,
                Visit.is_deleted == False
            )
        )
        result = await db.execute(stmt)
        visit = result.scalar_one_or_none()
        
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Visit not found"
            )
        
        return visit
    
    @staticmethod
    async def get_visit_by_number(
        db: AsyncSession,
        visit_number: str
    ) -> Optional[Visit]:
        """Get visit by visit number."""
        stmt = (
            select(Visit)
            .options(
                selectinload(Visit.patient),
                selectinload(Visit.assigned_doctor)
            )
            .where(
                Visit.visit_number == visit_number,
                Visit.is_deleted == False
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_visits(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        status_filter: Optional[VisitStatus] = None,
        visit_type: Optional[VisitType] = None,
        priority: Optional[Priority] = None,
        patient_id: Optional[UUID] = None,
        doctor_id: Optional[UUID] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[Visit], int]:
        """
        List visits with filtering and pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum records to return
            status_filter: Filter by status
            visit_type: Filter by type
            priority: Filter by priority
            patient_id: Filter by patient
            doctor_id: Filter by doctor
            date_from: Start date filter
            date_to: End date filter
            search: Search in visit_number, patient name
            sort_by: Field to sort by
            sort_order: Sort order (asc/desc)
            
        Returns:
            Tuple of (visits list, total count)
        """
        # Base query with joins
        stmt = (
            select(Visit)
            .options(
                selectinload(Visit.patient),
                selectinload(Visit.assigned_doctor)
            )
            .where(Visit.is_deleted == False)
        )
        count_stmt = select(func.count(Visit.id)).where(Visit.is_deleted == False)
        
        # Apply filters
        if status_filter:
            stmt = stmt.where(Visit.status == status_filter)
            count_stmt = count_stmt.where(Visit.status == status_filter)
        
        if visit_type:
            stmt = stmt.where(Visit.visit_type == visit_type)
            count_stmt = count_stmt.where(Visit.visit_type == visit_type)
        
        if priority:
            stmt = stmt.where(Visit.priority == priority)
            count_stmt = count_stmt.where(Visit.priority == priority)
        
        if patient_id:
            stmt = stmt.where(Visit.patient_id == patient_id)
            count_stmt = count_stmt.where(Visit.patient_id == patient_id)
        
        if doctor_id:
            stmt = stmt.where(Visit.assigned_doctor_id == doctor_id)
            count_stmt = count_stmt.where(Visit.assigned_doctor_id == doctor_id)
        
        if date_from:
            stmt = stmt.where(Visit.visit_date >= date_from)
            count_stmt = count_stmt.where(Visit.visit_date >= date_from)
        
        if date_to:
            stmt = stmt.where(Visit.visit_date <= date_to)
            count_stmt = count_stmt.where(Visit.visit_date <= date_to)
        
        # Search filter
        if search:
            # Join with patient for name search
            stmt = stmt.join(Patient, Visit.patient_id == Patient.id)
            count_stmt = count_stmt.join(Patient, Visit.patient_id == Patient.id)
            
            search_filter = or_(
                Visit.visit_number.ilike(f"%{search}%"),
                Patient.first_name.ilike(f"%{search}%"),
                Patient.last_name.ilike(f"%{search}%"),
                Patient.mrn.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)
        
        # Get total count
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Apply sorting
        sort_column = getattr(Visit, sort_by, Visit.created_at)
        if sort_order == "desc":
            stmt = stmt.order_by(sort_column.desc())
        else:
            stmt = stmt.order_by(sort_column.asc())
        
        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)
        
        # Execute query
        result = await db.execute(stmt)
        visits = result.scalars().all()
        
        return visits, total
    
    # =========================================================================
    # UPDATE OPERATIONS
    # =========================================================================
    
    @staticmethod
    async def update_visit(
        db: AsyncSession,
        visit_id: UUID,
        visit_data: VisitUpdate,
        current_user: User
    ) -> Visit:
        """
        Update visit information.
        
        Args:
            db: Database session
            visit_id: Visit UUID
            visit_data: Update data
            current_user: Current authenticated user
            
        Returns:
            Updated Visit object
            
        Raises:
            HTTPException 404: Visit not found
            HTTPException 400: Cannot modify completed/cancelled visit
        """
        visit = await VisitService.get_visit(db, visit_id)
        
        # Check if visit can be modified
        if visit.status in [VisitStatus.COMPLETED, VisitStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot modify {visit.status.value} visit"
            )
        
        # Verify doctor if being changed
        if visit_data.assigned_doctor_id:
            doctor = await db.get(User, visit_data.assigned_doctor_id)
            if not doctor or not doctor.is_active:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found"
                )
        
        # Update fields
        update_data = visit_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(visit, field, value)
        
        visit.updated_by = current_user.id
        
        await db.commit()
        return await VisitService.get_visit(db, visit_id)
    
    @staticmethod
    async def update_status(
        db: AsyncSession,
        visit_id: UUID,
        status_data: VisitStatusUpdate,
        current_user: User
    ) -> Visit:
        """
        Update visit status with validation.
        
        Args:
            db: Database session
            visit_id: Visit UUID
            status_data: New status and optional cancellation reason
            current_user: Current authenticated user
            
        Returns:
            Updated Visit object
            
        Raises:
            HTTPException 404: Visit not found
            HTTPException 400: Invalid status transition
            HTTPException 400: Cancellation reason required
        """
        visit = await VisitService.get_visit(db, visit_id)
        new_status = status_data.status
        
        # Validate transition
        if not VisitService.validate_status_transition(visit.status, new_status):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from {visit.status.value} to {new_status.value}"
            )
        
        # Require cancellation reason
        if new_status == VisitStatus.CANCELLED and not status_data.cancellation_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cancellation reason is required"
            )
        
        # Update status
        visit.status = new_status
        visit.updated_by = current_user.id
        
        # Set timestamps based on status
        now = datetime.utcnow()
        if new_status == VisitStatus.IN_PROGRESS:
            visit.consultation_start_time = now
        elif new_status == VisitStatus.COMPLETED:
            visit.consultation_end_time = now
        elif new_status == VisitStatus.CANCELLED:
            visit.cancellation_reason = status_data.cancellation_reason
        
        await db.commit()
        return await VisitService.get_visit(db, visit_id)
    
    @staticmethod
    def validate_status_transition(
        current: VisitStatus,
        new: VisitStatus
    ) -> bool:
        """
        Validate if status transition is allowed.
        
        Args:
            current: Current status
            new: Target status
            
        Returns:
            True if transition is valid
        """
        allowed = ALLOWED_STATUS_TRANSITIONS.get(current, [])
        return new in allowed
    
    # =========================================================================
    # DELETE OPERATIONS
    # =========================================================================
    
    @staticmethod
    async def cancel_visit(
        db: AsyncSession,
        visit_id: UUID,
        reason: str,
        current_user: User
    ) -> Visit:
        """
        Cancel (soft delete) a visit.
        
        Args:
            db: Database session
            visit_id: Visit UUID
            reason: Cancellation reason
            current_user: Current authenticated user
            
        Returns:
            Cancelled Visit object
        """
        status_data = VisitStatusUpdate(
            status=VisitStatus.CANCELLED,
            cancellation_reason=reason
        )
        return await VisitService.update_status(db, visit_id, status_data, current_user)
    
    # =========================================================================
    # SPECIALIZED QUERIES
    # =========================================================================
    
    @staticmethod
    async def get_patient_visits(
        db: AsyncSession,
        patient_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Visit], int]:
        """
        Get visit history for a patient.
        
        Args:
            db: Database session
            patient_id: Patient UUID
            skip: Number of records to skip
            limit: Maximum records to return
            
        Returns:
            Tuple of (visits list, total count)
        """
        return await VisitService.list_visits(
            db,
            skip=skip,
            limit=limit,
            patient_id=patient_id,
            sort_by="visit_date",
            sort_order="desc"
        )
    
    @staticmethod
    async def get_doctor_visits(
        db: AsyncSession,
        doctor_id: UUID,
        visit_date: Optional[date] = None,
        status_filter: Optional[VisitStatus] = None
    ) -> List[Visit]:
        """
        Get visits assigned to a doctor.
        
        Args:
            db: Database session
            doctor_id: Doctor UUID
            visit_date: Filter by date (default: today)
            status_filter: Filter by status
            
        Returns:
            List of visits
        """
        if visit_date is None:
            visit_date = date.today()
        
        stmt = (
            select(Visit)
            .options(
                selectinload(Visit.patient),
                selectinload(Visit.assigned_doctor)
            )
            .where(
                Visit.assigned_doctor_id == doctor_id,
                Visit.visit_date == visit_date,
                Visit.is_deleted == False
            )
        )
        
        if status_filter:
            stmt = stmt.where(Visit.status == status_filter)
        
        # Order by priority (emergency first) then check-in time
        stmt = stmt.order_by(
            case(
                (Visit.priority == Priority.EMERGENCY, 1),
                (Visit.priority == Priority.URGENT, 2),
                else_=3
            ),
            Visit.check_in_time.asc()
        )
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_today_visits(
        db: AsyncSession,
        status_filter: Optional[VisitStatus] = None,
        doctor_id: Optional[UUID] = None
    ) -> List[Visit]:
        """
        Get today's visits.
        
        Args:
            db: Database session
            status_filter: Filter by status
            doctor_id: Filter by doctor
            
        Returns:
            List of today's visits
        """
        today = date.today()
        
        stmt = (
            select(Visit)
            .options(
                selectinload(Visit.patient),
                selectinload(Visit.assigned_doctor)
            )
            .where(
                Visit.visit_date == today,
                Visit.is_deleted == False
            )
        )
        
        if status_filter:
            stmt = stmt.where(Visit.status == status_filter)
        
        if doctor_id:
            stmt = stmt.where(Visit.assigned_doctor_id == doctor_id)
        
        # Order by check-in time
        stmt = stmt.order_by(Visit.check_in_time.asc())
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_queue(
        db: AsyncSession,
        status_filter: Optional[VisitStatus] = None
    ) -> List[Visit]:
        """
        Get current waiting queue.
        
        Returns visits that are REGISTERED or WAITING for today.
        Ordered by priority then check-in time.
        
        Args:
            db: Database session
            status_filter: Optional status filter
            
        Returns:
            List of queued visits
        """
        today = date.today()
        
        stmt = (
            select(Visit)
            .options(
                selectinload(Visit.patient),
                selectinload(Visit.assigned_doctor)
            )
            .where(
                Visit.visit_date == today,
                Visit.is_deleted == False
            )
        )
        
        if status_filter:
            stmt = stmt.where(Visit.status == status_filter)
        else:
            # Default: REGISTERED or WAITING
            stmt = stmt.where(
                Visit.status.in_([VisitStatus.REGISTERED, VisitStatus.WAITING])
            )
        
        # Order by priority (emergency first) then check-in time
        stmt = stmt.order_by(
            case(
                (Visit.priority == Priority.EMERGENCY, 1),
                (Visit.priority == Priority.URGENT, 2),
                else_=3
            ),
            Visit.check_in_time.asc()
        )
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_visit_stats(
        db: AsyncSession,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> VisitStatsResponse:
        """
        Get visit statistics.
        
        Args:
            db: Database session
            date_from: Start date (default: today)
            date_to: End date (default: today)
            
        Returns:
            VisitStatsResponse with counts and averages
        """
        if date_from is None:
            date_from = date.today()
        if date_to is None:
            date_to = date.today()
        
        # Base filter
        base_filter = and_(
            Visit.visit_date >= date_from,
            Visit.visit_date <= date_to,
            Visit.is_deleted == False
        )
        
        # Total count
        total_stmt = select(func.count(Visit.id)).where(base_filter)
        total_result = await db.execute(total_stmt)
        total = total_result.scalar() or 0
        
        # Count by status
        status_stmt = (
            select(Visit.status, func.count(Visit.id))
            .where(base_filter)
            .group_by(Visit.status)
        )
        status_result = await db.execute(status_stmt)
        by_status = {row[0].value: row[1] for row in status_result.fetchall()}
        
        # Count by type
        type_stmt = (
            select(Visit.visit_type, func.count(Visit.id))
            .where(base_filter)
            .group_by(Visit.visit_type)
        )
        type_result = await db.execute(type_stmt)
        by_type = {row[0].value: row[1] for row in type_result.fetchall()}
        
        # Average wait time (for completed visits)
        # Wait time = consultation_start_time - check_in_time
        wait_stmt = (
            select(
                func.avg(
                    func.extract('epoch', Visit.consultation_start_time) -
                    func.extract('epoch', Visit.check_in_time)
                ) / 60  # Convert to minutes
            )
            .where(
                base_filter,
                Visit.check_in_time.isnot(None),
                Visit.consultation_start_time.isnot(None)
            )
        )
        wait_result = await db.execute(wait_stmt)
        avg_wait = wait_result.scalar()
        
        # Average consultation duration
        # Duration = consultation_end_time - consultation_start_time
        duration_stmt = (
            select(
                func.avg(
                    func.extract('epoch', Visit.consultation_end_time) -
                    func.extract('epoch', Visit.consultation_start_time)
                ) / 60  # Convert to minutes
            )
            .where(
                base_filter,
                Visit.consultation_start_time.isnot(None),
                Visit.consultation_end_time.isnot(None)
            )
        )
        duration_result = await db.execute(duration_stmt)
        avg_duration = duration_result.scalar()
        
        return VisitStatsResponse(
            total=total,
            by_status=by_status,
            by_type=by_type,
            average_wait_time_minutes=round(avg_wait, 1) if avg_wait else None,
            average_consultation_minutes=round(avg_duration, 1) if avg_duration else None
        )
    
    # =========================================================================
    # CONVENIENCE METHODS
    # =========================================================================
    
    @staticmethod
    async def start_consultation(
        db: AsyncSession,
        visit_id: UUID,
        doctor_id: UUID,
        current_user: User
    ) -> Visit:
        """
        Start consultation - set status to IN_PROGRESS.
        
        Also assigns doctor if not already assigned.
        
        Args:
            db: Database session
            visit_id: Visit UUID
            doctor_id: Doctor UUID
            current_user: Current authenticated user
            
        Returns:
            Updated Visit object
        """
        visit = await VisitService.get_visit(db, visit_id)
        
        # Assign doctor if not assigned
        if not visit.assigned_doctor_id:
            visit.assigned_doctor_id = doctor_id
        
        # Update status to IN_PROGRESS
        status_data = VisitStatusUpdate(status=VisitStatus.IN_PROGRESS)
        return await VisitService.update_status(db, visit_id, status_data, current_user)
    
    @staticmethod
    async def complete_consultation(
        db: AsyncSession,
        visit_id: UUID,
        current_user: User
    ) -> Visit:
        """
        Complete consultation - set status to COMPLETED.
        
        Args:
            db: Database session
            visit_id: Visit UUID
            current_user: Current authenticated user
            
        Returns:
            Updated Visit object
        """
        status_data = VisitStatusUpdate(status=VisitStatus.COMPLETED)
        return await VisitService.update_status(db, visit_id, status_data, current_user)
