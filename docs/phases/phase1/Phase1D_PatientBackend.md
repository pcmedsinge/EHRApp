# Phase 1D: Patient Backend

**Sub-Phase:** 1D  
**Estimated Time:** 4-5 hours  
**Prerequisites:** Phase 1C Complete

---

## 1. Objective

Implement complete patient management backend with CRUD operations, search, pagination, and MRN auto-generation.

---

## 2. Deliverables

- [ ] Patient SQLAlchemy model
- [ ] Patient Pydantic schemas
- [ ] MRN generation utility
- [ ] Patient service with CRUD operations
- [ ] Patient endpoints with search and pagination
- [ ] Database migration for patients table
- [ ] Working patient API via Swagger

---

## 3. Files to Create

```
backend/app/
├── models/
│   └── patient.py               # Patient SQLAlchemy model
├── schemas/
│   └── patient.py               # Patient Pydantic schemas
├── utils/
│   ├── __init__.py
│   └── mrn_generator.py         # MRN generation
└── api/v1/
    └── patients/
        ├── __init__.py
        ├── router.py            # Patient endpoints
        └── service.py           # Patient business logic
```

---

## 4. Implementation

### Step 1: Patient Model

File: `backend/app/models/patient.py`

```python
from sqlalchemy import Column, String, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from datetime import date

from app.models.base import BaseModel


class Patient(BaseModel):
    """Patient model"""
    
    __tablename__ = "patients"
    
    # Medical Record Number (unique identifier)
    mrn = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )
    
    # Personal Information
    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10), nullable=False)  # male, female, other
    
    # Contact Information
    phone = Column(String(15), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    
    # Address
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    
    # National IDs (India specific)
    aadhaar_number = Column(String(12), nullable=True)  # Encrypted
    abha_id = Column(String(20), nullable=True)  # Ayushman Bharat Health Account
    
    # Emergency Contact
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(15), nullable=True)
    
    # Medical Information
    blood_group = Column(String(5), nullable=True)  # A+, A-, B+, etc.
    
    # Audit fields
    created_by = Column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    
    # Relationships (will be added in later phases)
    # visits = relationship("Visit", back_populates="patient")
    
    def __repr__(self):
        return f"<Patient {self.mrn} - {self.first_name} {self.last_name}>"
    
    @property
    def age(self) -> int:
        """Calculate age from date of birth"""
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < 
            (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    @property
    def full_name(self) -> str:
        """Get full name"""
        return f"{self.first_name} {self.last_name}"
```

---

### Step 2: MRN Generator

File: `backend/app/utils/__init__.py`

```python
# Empty file to make utils a package
```

File: `backend/app/utils/mrn_generator.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from datetime import datetime

from app.models.patient import Patient


class MRNGenerator:
    """
    Medical Record Number (MRN) Generator
    
    Format: CLI-YYYY-NNNNN
    Example: CLI-2026-00001
    
    Sequence resets annually.
    """
    
    PREFIX = "CLI"
    
    @classmethod
    async def generate(cls, db: AsyncSession) -> str:
        """
        Generate next MRN for current year.
        
        Args:
            db: Database session
            
        Returns:
            Generated MRN string
        """
        current_year = datetime.now().year
        
        # Get the count of patients created in current year
        # Filter by MRN pattern for current year
        mrn_pattern = f"{cls.PREFIX}-{current_year}-%"
        
        stmt = select(func.count(Patient.id)).where(
            Patient.mrn.like(mrn_pattern)
        )
        result = await db.execute(stmt)
        count = result.scalar() or 0
        
        # Next sequence number
        next_number = count + 1
        
        # Format: CLI-YYYY-NNNNN
        mrn = f"{cls.PREFIX}-{current_year}-{next_number:05d}"
        
        return mrn
    
    @classmethod
    def validate(cls, mrn: str) -> bool:
        """
        Validate MRN format.
        
        Args:
            mrn: MRN string to validate
            
        Returns:
            True if valid format
        """
        import re
        pattern = rf"^{cls.PREFIX}-\d{{4}}-\d{{5}}$"
        return bool(re.match(pattern, mrn))
```

---

### Step 3: Patient Schemas

File: `backend/app/schemas/patient.py`

```python
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional
from datetime import date, datetime
from uuid import UUID
import re


class PatientBase(BaseModel):
    """Base patient schema"""
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: date
    gender: str = Field(..., pattern="^(male|female|other)$")
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=10)
    
    aadhaar_number: Optional[str] = Field(None, min_length=12, max_length=12)
    abha_id: Optional[str] = Field(None, max_length=20)
    
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=15)
    
    blood_group: Optional[str] = Field(None, max_length=5)
    
    @field_validator('phone', 'emergency_contact_phone')
    @classmethod
    def validate_phone(cls, v):
        """Validate phone number (Indian format)"""
        if v and not re.match(r'^\d{10,15}$', v.replace('+', '').replace('-', '').replace(' ', '')):
            raise ValueError('Invalid phone number format')
        return v
    
    @field_validator('aadhaar_number')
    @classmethod
    def validate_aadhaar(cls, v):
        """Validate Aadhaar number"""
        if v and not re.match(r'^\d{12}$', v):
            raise ValueError('Aadhaar must be 12 digits')
        return v
    
    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, v):
        """Validate Indian pincode"""
        if v and not re.match(r'^\d{6}$', v):
            raise ValueError('Pincode must be 6 digits')
        return v


class PatientCreate(PatientBase):
    """Schema for creating a new patient"""
    pass


class PatientUpdate(BaseModel):
    """Schema for updating patient (all fields optional)"""
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=10)
    
    aadhaar_number: Optional[str] = Field(None, min_length=12, max_length=12)
    abha_id: Optional[str] = Field(None, max_length=20)
    
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=15)
    
    blood_group: Optional[str] = Field(None, max_length=5)


class PatientResponse(PatientBase):
    """Schema for patient response"""
    id: UUID
    mrn: str
    age: int
    full_name: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PatientListResponse(BaseModel):
    """Schema for paginated patient list"""
    items: list[PatientResponse]
    total: int
    page: int
    size: int
    pages: int
```

---

### Step 4: Patient Service

File: `backend/app/api/v1/patients/service.py`

```python
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
    async def delete_patient(
        db: AsyncSession,
        patient_id: UUID
    ) -> None:
        """Soft delete patient"""
        patient = await PatientService.get_patient(db, patient_id)
        patient.is_deleted = True
        
        await db.commit()
```

---

### Step 5: Patient Router

File: `backend/app/api/v1/patients/router.py`

```python
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID
from math import ceil

from app.core.database import get_db
from app.api.v1.auth.router import get_current_user
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse
)
from app.api.v1.patients.service import PatientService

router = APIRouter()


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_patient(
    patient_data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new patient.
    
    - **MRN**: Auto-generated in format CLI-YYYY-NNNNN
    - **All fields**: As per schema validation
    """
    patient = await PatientService.create_patient(db, patient_data, current_user)
    return patient


@router.get(
    "",
    response_model=PatientListResponse
)
async def list_patients(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name, MRN, or phone"),
    sort_by: str = Query("created_at", description="Sort by field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    List all patients with pagination and search.
    
    - **page**: Page number (starts from 1)
    - **size**: Items per page (max 100)
    - **search**: Search in name, MRN, phone
    - **sort_by**: Field to sort by
    - **sort_order**: asc or desc
    """
    skip = (page - 1) * size
    patients, total = await PatientService.list_patients(
        db,
        skip=skip,
        limit=size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return {
        "items": patients,
        "total": total,
        "page": page,
        "size": size,
        "pages": ceil(total / size) if total > 0 else 0
    }


@router.get(
    "/{patient_id}",
    response_model=PatientResponse
)
async def get_patient(
    patient_id: UUID = Path(..., description="Patient ID"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get patient by ID"""
    patient = await PatientService.get_patient(db, patient_id)
    return patient


@router.put(
    "/{patient_id}",
    response_model=PatientResponse
)
async def update_patient(
    patient_data: PatientUpdate,
    patient_id: UUID = Path(..., description="Patient ID"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update patient information"""
    patient = await PatientService.update_patient(db, patient_id, patient_data)
    return patient


@router.delete(
    "/{patient_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_patient(
    patient_id: UUID = Path(..., description="Patient ID"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Soft delete patient"""
    await PatientService.delete_patient(db, patient_id)
    return None


@router.get(
    "/search/mrn/{mrn}",
    response_model=PatientResponse
)
async def get_patient_by_mrn(
    mrn: str = Path(..., description="Patient MRN"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get patient by MRN"""
    patient = await PatientService.get_patient_by_mrn(db, mrn)
    if not patient:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
```

---

### Step 6: Update API Router

File: `backend/app/api/v1/router.py`

```python
from fastapi import APIRouter

from app.api.v1.auth.router import router as auth_router
from app.api.v1.patients.router import router as patients_router

# Create main API router
api_router = APIRouter()

# Include routers
api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    patients_router,
    prefix="/patients",
    tags=["Patients"]
)
```

---

### Step 7: Update Models Init

File: `backend/app/models/__init__.py`

```python
from app.models.base import BaseModel
from app.models.user import User
from app.models.patient import Patient
```

---

### Step 8: Create Database Migration

```bash
cd backend
source venv/bin/activate

# Create migration
alembic revision --autogenerate -m "add patients table"

# Apply migration
alembic upgrade head
```

---

## 5. Verification Steps

```bash
# 1. Start server
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 2. Open Swagger UI
# http://localhost:8000/docs

# 3. Authorize with token from Phase 1C
# Click "Authorize" button, enter: Bearer <your-token>

# 4. Test Create Patient
# POST /api/v1/patients
{
  "first_name": "Rahul",
  "last_name": "Kumar",
  "date_of_birth": "1985-02-15",
  "gender": "male",
  "phone": "9876543210",
  "email": "rahul@email.com",
  "address_line1": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "blood_group": "O+"
}
# Expected: 201 Created with MRN like "CLI-2026-00001"

# 5. Test List Patients
# GET /api/v1/patients
# Expected: 200 OK with patient list

# 6. Test Search
# GET /api/v1/patients?search=Kumar
# Expected: Filtered results

# 7. Test Get by ID
# GET /api/v1/patients/{id}
# Use ID from create response

# 8. Test Update
# PUT /api/v1/patients/{id}
{
  "phone": "9876543211"
}
# Expected: 200 OK with updated data

# 9. Test Get by MRN
# GET /api/v1/patients/search/mrn/CLI-2026-00001
# Expected: 200 OK with patient data

# 10. Test Delete
# DELETE /api/v1/patients/{id}
# Expected: 204 No Content
```

---

## 6. Database Verification

```bash
# Connect to database
docker exec -it ehr_postgres psql -U ehr_user -d ehr_db

# Check patients table
\d patients

# View patients
SELECT id, mrn, first_name, last_name, phone, city FROM patients;

# Check MRN sequence
SELECT mrn FROM patients ORDER BY created_at;

# Exit
\q
```

---

## 7. Expected Swagger UI

After implementation:

```
Patients
  POST /api/v1/patients - Create a new patient
  GET /api/v1/patients - List all patients
  GET /api/v1/patients/{patient_id} - Get patient by ID
  PUT /api/v1/patients/{patient_id} - Update patient
  DELETE /api/v1/patients/{patient_id} - Delete patient
  GET /api/v1/patients/search/mrn/{mrn} - Get patient by MRN

Authentication
  (existing endpoints from 1C)
```

---

## 8. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Patient with this phone already exists" | Use unique phone number |
| MRN format error | Check MRNGenerator.validate() |
| 401 Unauthorized | Get fresh token from /auth/login |
| Validation error | Check schema requirements |
| Migration conflict | Review and fix alembic versions |

---

## 9. Testing with curl

```bash
# Get token
TOKEN=$(curl -X POST "http://localhost:8000/api/v1/auth/login/json" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' \
  | jq -r '.access_token')

# Create patient
curl -X POST "http://localhost:8000/api/v1/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Amit",
    "last_name": "Patel",
    "date_of_birth": "1990-05-20",
    "gender": "male",
    "phone": "9123456789",
    "city": "Delhi",
    "state": "Delhi"
  }'

# List patients
curl -X GET "http://localhost:8000/api/v1/patients?page=1&size=10" \
  -H "Authorization: Bearer $TOKEN"

# Search patients
curl -X GET "http://localhost:8000/api/v1/patients?search=Patel" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. Next Sub-Phase

Once verified, proceed to **Phase 1E: Frontend Core**

---

## 11. Checklist

- [ ] Patient model created
- [ ] MRN generator implemented
- [ ] Patient schemas defined
- [ ] Patient service created
- [ ] Patient endpoints working
- [ ] API router updated
- [ ] Models init updated
- [ ] Migration created and applied
- [ ] Can create patient with auto-MRN
- [ ] Can list patients with pagination
- [ ] Search works correctly
- [ ] Can get patient by ID
- [ ] Can update patient
- [ ] Can delete patient
- [ ] Can get patient by MRN
- [ ] All validations work

---

*End of Phase 1D*
