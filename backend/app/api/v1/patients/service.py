from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from fastapi import HTTPException, status
from typing import Optional, List
from uuid import UUID

from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate
from app.utils.mrn_generator import MRNGenerator


class PatientService:
    """Patient service with business logic"""
    
    @staticmethod
    async def create_patient(
        db: AsyncSession,
        patient_data: PatientCreate,
        current_user: User
    ) -> Patient:
        """
        Create a new patient with auto-generated MRN.
        
        Args:
            db: Database session
            patient_data: Patient creation data
            current_user: Current authenticated user
            
        Returns:
            Created patient
        """
        # Generate MRN
        mrn = await MRNGenerator.generate(db)
        
        # Check if phone already exists
        stmt = select(Patient).where(
            Patient.phone == patient_data.phone,
            Patient.is_deleted == False
        )
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient with this phone number already exists"
            )
        
        # Create patient
        patient = Patient(
            mrn=mrn,
            **patient_data.model_dump(),
            created_by=current_user.id
        )
        
        db.add(patient)
        await db.commit()
        await db.refresh(patient)
        
        return patient
    
    @staticmethod
    async def get_patient(
        db: AsyncSession,
        patient_id: UUID
    ) -> Optional[Patient]:
        """Get patient by ID"""
        stmt = select(Patient).where(
            Patient.id == patient_id,
            Patient.is_deleted == False
        )
        result = await db.execute(stmt)
        patient = result.scalar_one_or_none()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        return patient
    
    @staticmethod
    async def get_patient_by_mrn(
        db: AsyncSession,
        mrn: str
    ) -> Optional[Patient]:
        """Get patient by MRN"""
        stmt = select(Patient).where(
            Patient.mrn == mrn,
            Patient.is_deleted == False
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_patients(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[Patient], int]:
        """
        List patients with pagination and search.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum records to return
            search: Search query (name, MRN, phone)
            sort_by: Field to sort by
            sort_order: Sort order (asc/desc)
            
        Returns:
            Tuple of (patients list, total count)
        """
        # Base query
        stmt = select(Patient).where(Patient.is_deleted == False)
        count_stmt = select(func.count(Patient.id)).where(Patient.is_deleted == False)
        
        # Apply search filter
        if search:
            search_filter = or_(
                Patient.first_name.ilike(f"%{search}%"),
                Patient.last_name.ilike(f"%{search}%"),
                Patient.mrn.ilike(f"%{search}%"),
                Patient.phone.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)
        
        # Get total count
        count_result = await db.execute(count_stmt)
        total = count_result.scalar()
        
        # Apply sorting
        sort_column = getattr(Patient, sort_by, Patient.created_at)
        if sort_order == "desc":
            stmt = stmt.order_by(sort_column.desc())
        else:
            stmt = stmt.order_by(sort_column.asc())
        
        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)
        
        # Execute query
        result = await db.execute(stmt)
        patients = result.scalars().all()
        
        return patients, total
    
    @staticmethod
    async def update_patient(
        db: AsyncSession,
        patient_id: UUID,
        patient_data: PatientUpdate
    ) -> Patient:
        """Update patient information"""
        patient = await PatientService.get_patient(db, patient_id)
        
        # Update fields
        update_data = patient_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(patient, field, value)
        
        await db.commit()
        await db.refresh(patient)
        
        return patient
    
    @staticmethod
    @staticmethod
    async def delete_patient(
        db: AsyncSession,
        patient_id: UUID
    ) -> None:
        """Soft delete patient"""
        patient = await PatientService.get_patient(db, patient_id)
        patient.is_deleted = True
        await db.commit()
    
    @staticmethod
    async def get_patient_count(db: AsyncSession) -> int:
        """Get total count of active patients"""
        stmt = select(func.count(Patient.id)).where(Patient.is_deleted == False)
        result = await db.execute(stmt)
        return result.scalar() or 0
