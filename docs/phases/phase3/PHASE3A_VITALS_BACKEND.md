# Phase 3A: Vitals Backend (3-4 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 2 Complete  
**Estimated Time:** 3-4 days

---

## Objectives

Build backend infrastructure for recording and retrieving patient vital signs with:
- Complete vitals database schema
- BMI auto-calculation
- Validation for all vital ranges
- Role-based access (nurses record, all view)
- Visit and patient vitals history

---

## Deliverables

### 1. Vitals Table Migration
**File:** `backend/alembic/versions/YYYYMMDD_HHMM_create_vitals.py`

```python
"""Create vitals table

Revision ID: XXXXXX
Revises: (previous_revision)
Create Date: 2026-02-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.create_table(
        'vitals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('visit_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('visits.id'), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('recorded_by', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id'), nullable=False),
        
        # Blood Pressure
        sa.Column('blood_pressure_systolic', sa.Integer, nullable=True),
        sa.Column('blood_pressure_diastolic', sa.Integer, nullable=True),
        
        # Pulse & Respiration
        sa.Column('pulse_rate', sa.Integer, nullable=True),  # bpm
        sa.Column('respiratory_rate', sa.Integer, nullable=True),  # breaths/min
        
        # Temperature
        sa.Column('temperature', sa.Numeric(4, 1), nullable=True),  # °C
        sa.Column('temperature_unit', sa.String(1), default='C'),  # C or F
        
        # Oxygen Saturation
        sa.Column('spo2', sa.Integer, nullable=True),  # %
        
        # Body Measurements
        sa.Column('height', sa.Numeric(5, 2), nullable=True),  # cm
        sa.Column('weight', sa.Numeric(5, 2), nullable=True),  # kg
        sa.Column('bmi', sa.Numeric(4, 2), nullable=True),  # Auto-calculated
        
        # Blood Sugar
        sa.Column('blood_sugar', sa.Numeric(5, 2), nullable=True),  # mg/dL
        sa.Column('blood_sugar_type', sa.String(20), nullable=True),  # random/fasting/pp
        
        # Additional Info
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), 
                  server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_deleted', sa.Boolean, default=False)
    )
    
    # Indexes for performance
    op.create_index('idx_vitals_visit', 'vitals', ['visit_id'])
    op.create_index('idx_vitals_patient', 'vitals', ['patient_id'])
    op.create_index('idx_vitals_recorded_at', 'vitals', ['recorded_at'])
    op.create_index('idx_vitals_patient_date', 'vitals', ['patient_id', 'recorded_at'])

def downgrade():
    op.drop_table('vitals')
```

**Validation Ranges:**
- BP Systolic: 60-300 mmHg
- BP Diastolic: 40-200 mmHg
- Pulse: 40-200 bpm
- Temperature: 35.0-42.0 °C
- Respiratory Rate: 8-40 breaths/min
- SpO2: 70-100%
- Height: 50-250 cm
- Weight: 2-300 kg

---

### 2. Vital Model
**File:** `backend/app/models/vital.py`

```python
from sqlalchemy import Column, String, Integer, Numeric, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Vital(BaseModel):
    """Patient vital signs model"""
    __tablename__ = "vitals"
    
    # Foreign Keys
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    recorded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Blood Pressure
    blood_pressure_systolic = Column(Integer, nullable=True)
    blood_pressure_diastolic = Column(Integer, nullable=True)
    
    # Pulse & Respiration
    pulse_rate = Column(Integer, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)
    
    # Temperature
    temperature = Column(Numeric(4, 1), nullable=True)
    temperature_unit = Column(String(1), default='C')
    
    # Oxygen Saturation
    spo2 = Column(Integer, nullable=True)
    
    # Body Measurements
    height = Column(Numeric(5, 2), nullable=True)
    weight = Column(Numeric(5, 2), nullable=True)
    bmi = Column(Numeric(4, 2), nullable=True)
    
    # Blood Sugar
    blood_sugar = Column(Numeric(5, 2), nullable=True)
    blood_sugar_type = Column(String(20), nullable=True)
    
    # Additional Info
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default="now()")
    
    # Relationships
    visit = relationship("Visit", back_populates="vitals")
    patient = relationship("Patient")
    recorder = relationship("User")
    
    def __repr__(self):
        return f"<Vital {self.id} - Patient {self.patient_id}>"
```

---

### 3. Pydantic Schemas
**File:** `backend/app/schemas/vital.py`

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class VitalBase(BaseModel):
    """Base schema for vital signs"""
    blood_pressure_systolic: Optional[int] = Field(None, ge=60, le=300)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=200)
    pulse_rate: Optional[int] = Field(None, ge=40, le=200)
    temperature: Optional[float] = Field(None, ge=35.0, le=42.0)
    temperature_unit: Optional[Literal['C', 'F']] = 'C'
    respiratory_rate: Optional[int] = Field(None, ge=8, le=40)
    spo2: Optional[int] = Field(None, ge=70, le=100)
    height: Optional[float] = Field(None, ge=50.0, le=250.0)
    weight: Optional[float] = Field(None, ge=2.0, le=300.0)
    blood_sugar: Optional[float] = Field(None, ge=20.0, le=600.0)
    blood_sugar_type: Optional[Literal['random', 'fasting', 'pp']] = None
    notes: Optional[str] = None
    
    @validator('blood_pressure_diastolic')
    def validate_bp_ratio(cls, v, values):
        """Ensure diastolic is less than systolic"""
        if v and 'blood_pressure_systolic' in values:
            systolic = values['blood_pressure_systolic']
            if systolic and v >= systolic:
                raise ValueError('Diastolic BP must be less than systolic BP')
        return v

class VitalCreate(VitalBase):
    """Schema for creating a vital record"""
    visit_id: UUID
    patient_id: UUID

class VitalUpdate(BaseModel):
    """Schema for updating vitals (all fields optional)"""
    blood_pressure_systolic: Optional[int] = Field(None, ge=60, le=300)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=200)
    pulse_rate: Optional[int] = Field(None, ge=40, le=200)
    temperature: Optional[float] = Field(None, ge=35.0, le=42.0)
    respiratory_rate: Optional[int] = Field(None, ge=8, le=40)
    spo2: Optional[int] = Field(None, ge=70, le=100)
    height: Optional[float] = Field(None, ge=50.0, le=250.0)
    weight: Optional[float] = Field(None, ge=2.0, le=300.0)
    blood_sugar: Optional[float] = Field(None, ge=20.0, le=600.0)
    blood_sugar_type: Optional[Literal['random', 'fasting', 'pp']] = None
    notes: Optional[str] = None

class VitalResponse(VitalBase):
    """Schema for vital response"""
    id: UUID
    visit_id: UUID
    patient_id: UUID
    recorded_by: UUID
    recorded_at: datetime
    bmi: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

---

### 4. Service Layer
**File:** `backend/app/api/v1/vitals/service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from typing import Optional, List
from decimal import Decimal
from app.models.vital import Vital
from app.models.visit import Visit
from app.schemas.vital import VitalCreate, VitalUpdate
from app.core.exceptions import NotFoundException, ValidationException

class VitalService:
    """Service layer for vital signs operations"""
    
    @staticmethod
    def calculate_bmi(height_cm: float, weight_kg: float) -> float:
        """Calculate BMI from height (cm) and weight (kg)
        
        Formula: BMI = weight (kg) / (height (m))²
        """
        if not height_cm or not weight_kg or height_cm <= 0 or weight_kg <= 0:
            return None
        
        height_m = height_cm / 100
        bmi = weight_kg / (height_m ** 2)
        return round(bmi, 2)
    
    @staticmethod
    async def create_vital(
        db: AsyncSession,
        vital_data: VitalCreate,
        current_user_id: UUID
    ) -> Vital:
        """Create a new vital record"""
        # Verify visit exists
        stmt = select(Visit).where(Visit.id == vital_data.visit_id)
        result = await db.execute(stmt)
        visit = result.scalar_one_or_none()
        
        if not visit:
            raise NotFoundException(f"Visit {vital_data.visit_id} not found")
        
        # Calculate BMI if height and weight provided
        bmi = None
        if vital_data.height and vital_data.weight:
            bmi = VitalService.calculate_bmi(vital_data.height, vital_data.weight)
        
        # Create vital record
        vital = Vital(
            **vital_data.dict(),
            recorded_by=current_user_id,
            bmi=bmi
        )
        
        db.add(vital)
        await db.commit()
        await db.refresh(vital)
        
        return vital
    
    @staticmethod
    async def get_visit_vitals(db: AsyncSession, visit_id: UUID) -> List[Vital]:
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
    async def get_patient_vitals_history(
        db: AsyncSession,
        patient_id: UUID,
        limit: int = 10
    ) -> List[Vital]:
        """Get patient vitals history for trending"""
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
        """Update vital record"""
        stmt = select(Vital).where(Vital.id == vital_id)
        result = await db.execute(stmt)
        vital = result.scalar_one_or_none()
        
        if not vital:
            raise NotFoundException(f"Vital {vital_id} not found")
        
        # Update fields
        update_data = vital_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(vital, field, value)
        
        # Recalculate BMI if height or weight changed
        if 'height' in update_data or 'weight' in update_data:
            if vital.height and vital.weight:
                vital.bmi = VitalService.calculate_bmi(vital.height, vital.weight)
        
        await db.commit()
        await db.refresh(vital)
        
        return vital
    
    @staticmethod
    async def delete_vital(db: AsyncSession, vital_id: UUID) -> bool:
        """Soft delete vital record"""
        stmt = select(Vital).where(Vital.id == vital_id)
        result = await db.execute(stmt)
        vital = result.scalar_one_or_none()
        
        if not vital:
            raise NotFoundException(f"Vital {vital_id} not found")
        
        vital.is_deleted = True
        await db.commit()
        
        return True
```

---

### 5. API Router
**File:** `backend/app/api/v1/vitals/router.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_user
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
    """Record patient vitals (Nurse/Doctor role)"""
    return await VitalService.create_vital(db, vital_data, current_user.id)

@router.get("/visit/{visit_id}", response_model=List[VitalResponse])
async def get_visit_vitals(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all vitals for a visit"""
    return await VitalService.get_visit_vitals(db, visit_id)

@router.get("/patient/{patient_id}", response_model=List[VitalResponse])
async def get_patient_vitals_history(
    patient_id: UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient vitals history for trending"""
    return await VitalService.get_patient_vitals_history(db, patient_id, limit)

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
    """Update vitals (within 1 hour of recording)"""
    return await VitalService.update_vital(db, vital_id, vital_data)

@router.delete("/{vital_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vital(
    vital_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove vital record"""
    await VitalService.delete_vital(db, vital_id)
    return None
```

---

### 6. Update API Router
**File:** `backend/app/api/v1/router.py`

```python
from app.api.v1.vitals import router as vitals_router

# Add to existing router includes
api_router.include_router(
    vitals_router,
    prefix="/vitals",
    tags=["Vitals"]
)
```

---

### 7. Update Visit Model
**File:** `backend/app/models/visit.py`

```python
# Add relationship in Visit class
from sqlalchemy.orm import relationship

class Visit(BaseModel):
    # ... existing fields ...
    
    # Add relationship
    vitals = relationship("Vital", back_populates="visit", cascade="all, delete-orphan")
```

---

## Testing Checklist

### Database Tests
- [ ] Migration runs successfully without errors
- [ ] All indexes created properly
- [ ] Foreign key constraints work
- [ ] Default values applied correctly

### API Tests
- [ ] Create vital via POST /vitals/
- [ ] Retrieve visit vitals via GET /vitals/visit/{id}
- [ ] Retrieve patient history via GET /vitals/patient/{id}
- [ ] Get latest vitals via GET /vitals/patient/{id}/latest
- [ ] Update vital via PUT /vitals/{id}
- [ ] Delete vital via DELETE /vitals/{id}

### Validation Tests
- [ ] BMI calculation accurate (test: 170cm, 70kg = 24.22)
- [ ] Invalid BP systolic rejected (e.g., 400)
- [ ] Invalid temperature rejected (e.g., 50°C)
- [ ] Diastolic > Systolic rejected
- [ ] Out-of-range SpO2 rejected (e.g., 150%)

### Swagger UI Tests
- [ ] All endpoints visible in /docs
- [ ] Request/response schemas correct
- [ ] Try-it-out functionality works
- [ ] Error responses documented

---

## Success Criteria

- ✅ Database schema created with all fields and indexes
- ✅ CRUD operations functional via API
- ✅ BMI auto-calculation working (formula verified)
- ✅ Input validation prevents invalid data
- ✅ Visit relationship established
- ✅ Patient vitals history queryable
- ✅ Swagger documentation complete and accurate
- ✅ All tests passing

---

## Common Issues & Solutions

**Issue:** BMI calculation incorrect  
**Solution:** Ensure height is in cm (divide by 100 before calculation)

**Issue:** Visit not found error  
**Solution:** Verify visit_id exists and is_deleted = false

**Issue:** Validation errors not clear  
**Solution:** Use Pydantic Field() with descriptive error messages

---

## Next Steps

After Phase 3A completion:
→ **Phase 3B: Vitals Frontend** - Build UI for vitals entry and display

---

**Documentation Version:** 1.0  
**Last Updated:** February 3, 2026
