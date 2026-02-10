# Phase 3C: Diagnosis Backend (4-5 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 3B Complete  
**Estimated Time:** 4-5 days

---

## Objectives

Build **COMPLETE ICD-10 code system** with diagnosis management:
- Full ICD-10 code database (14,000+ codes)
- Fast search engine (<100ms)
- Diagnosis CRUD operations
- Support for BOTH coded and non-coded diagnoses
- Patient diagnosis history tracking

**Key Feature:** ICD-10 usage is **OPTIONAL** but **FULLY FUNCTIONAL** when used.

---

## Deliverables

### 1. ICD-10 Codes Table Migration
**File:** `backend/alembic/versions/YYYYMMDD_HHMM_create_icd10_codes.py`

```python
"""Create ICD-10 codes table

Revision ID: XXXXXX
Revises: (previous_revision)
Create Date: 2026-02-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # ICD-10 reference table
    op.create_table(
        'icd10_codes',
        sa.Column('code', sa.String(10), primary_key=True),  # e.g., "E11.9"
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('subcategory', sa.String(100), nullable=True),
        sa.Column('search_text', sa.Text, nullable=True),  # Lowercase for search
        sa.Column('usage_count', sa.Integer, default=0),  # Track popularity
        sa.Column('common_in_india', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), 
                  server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Indexes for fast search
    op.create_index('idx_icd10_search', 'icd10_codes', ['search_text'], 
                    postgresql_using='gin', 
                    postgresql_ops={'search_text': 'gin_trgm_ops'})
    op.create_index('idx_icd10_category', 'icd10_codes', ['category'])
    op.create_index('idx_icd10_usage', 'icd10_codes', ['usage_count'])
    op.create_index('idx_icd10_common', 'icd10_codes', ['common_in_india'])

def downgrade():
    op.drop_table('icd10_codes')
```

---

### 2. Diagnosis Table Migration
**File:** `backend/alembic/versions/YYYYMMDD_HHMM_create_diagnoses.py`

```python
"""Create diagnoses table

Revision ID: XXXXXX
Revises: (previous_revision)
Create Date: 2026-02-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Diagnosis type enum
    diagnosis_type_enum = postgresql.ENUM(
        'primary', 'secondary',
        name='diagnosis_type_enum',
        create_type=False
    )
    diagnosis_type_enum.create(op.get_bind(), checkfirst=True)
    
    # Diagnosis status enum
    diagnosis_status_enum = postgresql.ENUM(
        'provisional', 'confirmed',
        name='diagnosis_status_enum',
        create_type=False
    )
    diagnosis_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Severity enum
    severity_enum = postgresql.ENUM(
        'mild', 'moderate', 'severe', 'critical',
        name='severity_enum',
        create_type=False
    )
    severity_enum.create(op.get_bind(), checkfirst=True)
    
    # Diagnoses table
    op.create_table(
        'diagnoses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('visit_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('visits.id'), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('diagnosed_by', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id'), nullable=False),
        
        # ICD-10 code is OPTIONAL (nullable)
        sa.Column('icd10_code', sa.String(10), 
                  sa.ForeignKey('icd10_codes.code'), nullable=True),
        
        # Description is REQUIRED (either from ICD-10 or free text)
        sa.Column('diagnosis_description', sa.Text, nullable=False),
        
        # Diagnosis metadata
        sa.Column('diagnosis_type', diagnosis_type_enum, nullable=False),
        sa.Column('status', diagnosis_status_enum, nullable=False),
        sa.Column('severity', severity_enum, nullable=True),
        sa.Column('diagnosed_date', sa.Date, nullable=False),
        sa.Column('onset_date', sa.Date, nullable=True),
        sa.Column('clinical_notes', sa.Text, nullable=True),
        
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), 
                  server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_deleted', sa.Boolean, default=False)
    )
    
    # Indexes
    op.create_index('idx_diagnoses_visit', 'diagnoses', ['visit_id'])
    op.create_index('idx_diagnoses_patient', 'diagnoses', ['patient_id'])
    op.create_index('idx_diagnoses_icd10', 'diagnoses', ['icd10_code'])
    op.create_index('idx_diagnoses_type', 'diagnoses', ['diagnosis_type'])

def downgrade():
    op.drop_table('diagnoses')
    op.execute('DROP TYPE diagnosis_type_enum')
    op.execute('DROP TYPE diagnosis_status_enum')
    op.execute('DROP TYPE severity_enum')
```

---

### 3. Models
**File:** `backend/app/models/icd10_code.py`

```python
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime
from app.models.base import BaseModel

class ICD10Code(BaseModel):
    """ICD-10 code reference model"""
    __tablename__ = "icd10_codes"
    
    code = Column(String(10), primary_key=True)
    description = Column(Text, nullable=False)
    category = Column(String(100))
    subcategory = Column(String(100))
    search_text = Column(Text)
    usage_count = Column(Integer, default=0)
    common_in_india = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<ICD10Code {self.code}: {self.description}>"
```

**File:** `backend/app/models/diagnosis.py`

```python
from sqlalchemy import Column, String, Text, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum

class DiagnosisType(str, enum.Enum):
    PRIMARY = "primary"
    SECONDARY = "secondary"

class DiagnosisStatus(str, enum.Enum):
    PROVISIONAL = "provisional"
    CONFIRMED = "confirmed"

class Severity(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"

class Diagnosis(BaseModel):
    """Patient diagnosis model"""
    __tablename__ = "diagnoses"
    
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    diagnosed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # ICD-10 code is OPTIONAL
    icd10_code = Column(String(10), ForeignKey("icd10_codes.code"), nullable=True)
    
    # Description is REQUIRED
    diagnosis_description = Column(Text, nullable=False)
    
    # Metadata
    diagnosis_type = Column(SQLEnum(DiagnosisType), nullable=False)
    status = Column(SQLEnum(DiagnosisStatus), nullable=False)
    severity = Column(SQLEnum(Severity), nullable=True)
    diagnosed_date = Column(Date, nullable=False)
    onset_date = Column(Date, nullable=True)
    clinical_notes = Column(Text, nullable=True)
    
    # Relationships
    visit = relationship("Visit", back_populates="diagnoses")
    patient = relationship("Patient")
    doctor = relationship("User", foreign_keys=[diagnosed_by])
    icd10 = relationship("ICD10Code")  # Can be None
    
    def __repr__(self):
        return f"<Diagnosis {self.id}: {self.diagnosis_description}>"
```

---

### 4. Pydantic Schemas
**File:** `backend/app/schemas/diagnosis.py`

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from enum import Enum

class DiagnosisType(str, Enum):
    PRIMARY = "primary"
    SECONDARY = "secondary"

class DiagnosisStatus(str, Enum):
    PROVISIONAL = "provisional"
    CONFIRMED = "confirmed"

class Severity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"

class ICD10SearchResult(BaseModel):
    """ICD-10 search result"""
    code: str
    description: str
    category: Optional[str] = None
    usage_count: int = 0
    common_in_india: bool = False

class DiagnosisCreate(BaseModel):
    """Create diagnosis schema"""
    visit_id: UUID
    patient_id: UUID
    
    # ICD-10 code is OPTIONAL
    icd10_code: Optional[str] = Field(None, pattern="^[A-Z][0-9]{2}\\.?[0-9]{0,2}$")
    
    # Description is REQUIRED
    diagnosis_description: str = Field(..., min_length=3, max_length=500)
    
    diagnosis_type: DiagnosisType = DiagnosisType.PRIMARY
    status: DiagnosisStatus = DiagnosisStatus.PROVISIONAL
    severity: Optional[Severity] = None
    diagnosed_date: date = Field(default_factory=date.today)
    onset_date: Optional[date] = None
    clinical_notes: Optional[str] = None
    
    @validator('diagnosis_description')
    def validate_description(cls, v, values):
        """Ensure we have meaningful description"""
        if not v or len(v.strip()) < 3:
            raise ValueError('Diagnosis description must be at least 3 characters')
        return v.strip()

class DiagnosisUpdate(BaseModel):
    """Update diagnosis schema"""
    icd10_code: Optional[str] = None
    diagnosis_description: Optional[str] = None
    diagnosis_type: Optional[DiagnosisType] = None
    status: Optional[DiagnosisStatus] = None
    severity: Optional[Severity] = None
    onset_date: Optional[date] = None
    clinical_notes: Optional[str] = None

class DiagnosisResponse(BaseModel):
    """Diagnosis response schema"""
    id: UUID
    visit_id: UUID
    patient_id: UUID
    diagnosed_by: UUID
    icd10_code: Optional[str] = None
    diagnosis_description: str
    diagnosis_type: DiagnosisType
    status: DiagnosisStatus
    severity: Optional[Severity] = None
    diagnosed_date: date
    onset_date: Optional[date] = None
    clinical_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

---

### 5. ICD-10 Service
**File:** `backend/app/api/v1/diagnoses/icd10_service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import List, Optional
from app.models.icd10_code import ICD10Code
from app.schemas.diagnosis import ICD10SearchResult

class ICD10Service:
    """Service for ICD-10 code operations"""
    
    @staticmethod
    async def search_codes(
        db: AsyncSession,
        query: str,
        limit: int = 20
    ) -> List[ICD10Code]:
        """
        Fast full-text search on ICD-10 codes
        Searches both code and description
        """
        search_term = f"%{query.lower()}%"
        
        stmt = select(ICD10Code).where(
            or_(
                ICD10Code.code.ilike(search_term),
                ICD10Code.search_text.ilike(search_term)
            )
        ).order_by(
            ICD10Code.usage_count.desc(),
            ICD10Code.code
        ).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_code_details(
        db: AsyncSession,
        code: str
    ) -> Optional[ICD10Code]:
        """Get complete ICD-10 code information"""
        stmt = select(ICD10Code).where(ICD10Code.code == code)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_popular_codes(
        db: AsyncSession,
        limit: int = 50,
        category: Optional[str] = None
    ) -> List[ICD10Code]:
        """Get most frequently used diagnoses"""
        stmt = select(ICD10Code)
        
        if category:
            stmt = stmt.where(ICD10Code.category == category)
        
        stmt = stmt.order_by(ICD10Code.usage_count.desc()).limit(limit)
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def increment_usage(db: AsyncSession, code: str):
        """Track code usage for popularity ranking"""
        icd10 = await ICD10Service.get_code_details(db, code)
        if icd10:
            icd10.usage_count += 1
            await db.commit()
```

---

### 6. Diagnosis Service
**File:** `backend/app/api/v1/diagnoses/service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from typing import List
from app.models.diagnosis import Diagnosis
from app.models.visit import Visit
from app.schemas.diagnosis import DiagnosisCreate, DiagnosisUpdate
from app.api.v1.diagnoses.icd10_service import ICD10Service
from app.core.exceptions import NotFoundException, ValidationException

class DiagnosisService:
    """Service layer for diagnosis operations"""
    
    @staticmethod
    async def add_diagnosis(
        db: AsyncSession,
        diagnosis_data: DiagnosisCreate,
        current_user_id: UUID
    ) -> Diagnosis:
        """Add diagnosis to visit"""
        # Verify visit exists
        stmt = select(Visit).where(Visit.id == diagnosis_data.visit_id)
        result = await db.execute(stmt)
        visit = result.scalar_one_or_none()
        
        if not visit:
            raise NotFoundException(f"Visit {diagnosis_data.visit_id} not found")
        
        # Check if primary diagnosis already exists
        if diagnosis_data.diagnosis_type.value == "primary":
            stmt = select(Diagnosis).where(
                and_(
                    Diagnosis.visit_id == diagnosis_data.visit_id,
                    Diagnosis.diagnosis_type == "primary",
                    Diagnosis.is_deleted == False
                )
            )
            result = await db.execute(stmt)
            existing_primary = result.scalar_one_or_none()
            
            if existing_primary:
                raise ValidationException("Visit already has a primary diagnosis")
        
        # Validate ICD-10 code if provided
        if diagnosis_data.icd10_code:
            icd10 = await ICD10Service.get_code_details(db, diagnosis_data.icd10_code)
            if not icd10:
                raise ValidationException(f"Invalid ICD-10 code: {diagnosis_data.icd10_code}")
            
            # Auto-fill description from ICD-10 if not provided
            if not diagnosis_data.diagnosis_description or len(diagnosis_data.diagnosis_description) < 10:
                diagnosis_data.diagnosis_description = icd10.description
            
            # Increment usage count
            await ICD10Service.increment_usage(db, diagnosis_data.icd10_code)
        
        # Create diagnosis
        diagnosis = Diagnosis(
            **diagnosis_data.dict(),
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
        ).order_by(
            Diagnosis.diagnosis_type,
            Diagnosis.created_at
        )
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def get_patient_diagnosis_history(
        db: AsyncSession,
        patient_id: UUID
    ) -> List[Diagnosis]:
        """Get patient diagnosis history"""
        stmt = select(Diagnosis).where(
            and_(
                Diagnosis.patient_id == patient_id,
                Diagnosis.is_deleted == False
            )
        ).order_by(Diagnosis.diagnosed_date.desc())
        
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def update_diagnosis(
        db: AsyncSession,
        diagnosis_id: UUID,
        diagnosis_data: DiagnosisUpdate
    ) -> Diagnosis:
        """Update diagnosis"""
        stmt = select(Diagnosis).where(Diagnosis.id == diagnosis_id)
        result = await db.execute(stmt)
        diagnosis = result.scalar_one_or_none()
        
        if not diagnosis:
            raise NotFoundException(f"Diagnosis {diagnosis_id} not found")
        
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
        stmt = select(Diagnosis).where(Diagnosis.id == diagnosis_id)
        result = await db.execute(stmt)
        diagnosis = result.scalar_one_or_none()
        
        if not diagnosis:
            raise NotFoundException(f"Diagnosis {diagnosis_id} not found")
        
        diagnosis.is_deleted = True
        await db.commit()
        
        return True
```

---

### 7. API Router
**File:** `backend/app/api/v1/diagnoses/router.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.diagnosis import (
    DiagnosisCreate,
    DiagnosisUpdate,
    DiagnosisResponse,
    ICD10SearchResult
)
from app.api.v1.diagnoses.service import DiagnosisService
from app.api.v1.diagnoses.icd10_service import ICD10Service

router = APIRouter()

# ICD-10 Search Endpoints
@router.get("/icd10/search", response_model=List[ICD10SearchResult])
async def search_icd10_codes(
    q: str,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search ICD-10 codes by keyword"""
    codes = await ICD10Service.search_codes(db, q, limit)
    return codes

@router.get("/icd10/{code}", response_model=ICD10SearchResult)
async def get_icd10_code(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ICD-10 code details"""
    icd10 = await ICD10Service.get_code_details(db, code)
    if not icd10:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ICD-10 code {code} not found"
        )
    return icd10

@router.get("/icd10/popular", response_model=List[ICD10SearchResult])
async def get_popular_codes(
    limit: int = 50,
    category: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get popular ICD-10 codes"""
    return await ICD10Service.get_popular_codes(db, limit, category)

# Diagnosis CRUD Endpoints
@router.post("/", response_model=DiagnosisResponse, status_code=status.HTTP_201_CREATED)
async def add_diagnosis(
    diagnosis_data: DiagnosisCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add diagnosis to visit (Doctor only)"""
    return await DiagnosisService.add_diagnosis(db, diagnosis_data, current_user.id)

@router.get("/visit/{visit_id}", response_model=List[DiagnosisResponse])
async def get_visit_diagnoses(
    visit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all diagnoses for a visit"""
    return await DiagnosisService.get_visit_diagnoses(db, visit_id)

@router.get("/patient/{patient_id}", response_model=List[DiagnosisResponse])
async def get_patient_diagnoses(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient diagnosis history"""
    return await DiagnosisService.get_patient_diagnosis_history(db, patient_id)

@router.put("/{diagnosis_id}", response_model=DiagnosisResponse)
async def update_diagnosis(
    diagnosis_id: UUID,
    diagnosis_data: DiagnosisUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update diagnosis"""
    return await DiagnosisService.update_diagnosis(db, diagnosis_id, diagnosis_data)

@router.delete("/{diagnosis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diagnosis(
    diagnosis_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove diagnosis from visit"""
    await DiagnosisService.delete_diagnosis(db, diagnosis_id)
    return None
```

---

### 8. ICD-10 Seed Script
**File:** `backend/scripts/seed_icd10.py`

```python
"""
Seed ICD-10 codes into database
Run: python backend/scripts/seed_icd10.py
"""
import asyncio
import csv
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.icd10_code import ICD10Code

# Sample common Indian diagnoses
COMMON_ICD10_CODES = [
    ("A09", "Diarrhoea and gastroenteritis of presumed infectious origin", "Infectious", "Intestinal", True),
    ("E11.9", "Type 2 diabetes mellitus without complications", "Endocrine", "Diabetes", True),
    ("E11.0", "Type 2 diabetes mellitus with hyperosmolarity", "Endocrine", "Diabetes", True),
    ("E66.9", "Obesity, unspecified", "Endocrine", "Nutrition", True),
    ("I10", "Essential (primary) hypertension", "Circulatory", "Hypertensive", True),
    ("I25.9", "Chronic ischaemic heart disease, unspecified", "Circulatory", "Ischaemic", True),
    ("J06.9", "Acute upper respiratory infection, unspecified", "Respiratory", "URI", True),
    ("J18.9", "Pneumonia, unspecified organism", "Respiratory", "Pneumonia", True),
    ("J45.9", "Asthma, unspecified", "Respiratory", "Asthma", True),
    ("K30", "Functional dyspepsia", "Digestive", "Stomach", True),
    ("K76.0", "Fatty (change of) liver, not elsewhere classified", "Digestive", "Liver", True),
    ("M19.9", "Arthrosis, unspecified", "Musculoskeletal", "Arthritis", True),
    ("M79.3", "Panniculitis, unspecified", "Musculoskeletal", "Soft tissue", True),
    ("N39.0", "Urinary tract infection, site not specified", "Genitourinary", "UTI", True),
    ("R50.9", "Fever, unspecified", "Symptoms", "General", True),
    ("R51", "Headache", "Symptoms", "Head", True),
    ("R10.4", "Other and unspecified abdominal pain", "Symptoms", "Abdomen", True),
]

async def seed_icd10_codes():
    """Seed ICD-10 codes into database"""
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Seeding ICD-10 codes...")
        
        for code, desc, category, subcat, common in COMMON_ICD10_CODES:
            search_text = f"{code.lower()} {desc.lower()}"
            
            icd10 = ICD10Code(
                code=code,
                description=desc,
                category=category,
                subcategory=subcat,
                search_text=search_text,
                usage_count=100 if common else 0,
                common_in_india=common
            )
            
            session.add(icd10)
            print(f"  Added: {code} - {desc}")
        
        await session.commit()
        print(f"\n✓ Successfully seeded {len(COMMON_ICD10_CODES)} ICD-10 codes")

if __name__ == "__main__":
    asyncio.run(seed_icd10_codes())
```

---

## Testing Checklist

### ICD-10 System
- [ ] ICD-10 table populated with seed data
- [ ] ICD-10 search returns relevant results (test "diabetes", "fever")
- [ ] ICD-10 search performance <100ms
- [ ] Popular codes API returns correctly
- [ ] Code details API works

### Diagnosis Operations
- [ ] Create diagnosis WITH ICD-10 code
- [ ] Create diagnosis WITHOUT ICD-10 (free text)
- [ ] Auto-fill description from ICD-10
- [ ] Usage counter increments
- [ ] Only one primary diagnosis per visit validation
- [ ] Get visit diagnoses
- [ ] Get patient diagnosis history
- [ ] Update diagnosis
- [ ] Delete diagnosis

---

## Success Criteria

- ✅ ICD-10 search FAST (<100ms)
- ✅ Both coded and non-coded workflows work seamlessly
- ✅ Popular codes feature functional
- ✅ Diagnosis CRUD operations working
- ✅ Role-based access enforced
- ✅ History shows chronological diagnoses

---

## Next Steps

After Phase 3C completion:
→ **Phase 3D: Diagnosis Frontend** - Build diagnosis UI with ICD-10 search

---

**Documentation Version:** 1.0  
**Last Updated:** February 3, 2026
