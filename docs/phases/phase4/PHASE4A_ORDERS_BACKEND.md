# Phase 4A: Orders Backend (5-6 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 3 Complete ✅  
**Estimated Time:** 5-6 days

---

## Objectives

Build unified backend infrastructure for managing clinical orders (Imaging, Lab, Procedure) with:
- Generic Order model supporting multiple order types
- Auto-generation of order numbers (ORD-YYYY-NNNNN)
- Auto-generation of accession numbers (ACC-YYYY-NNNNN)
- Type-specific order details via JSON
- Order status workflow management
- Reference data tables (modalities, lab tests, procedures)
- Comprehensive API endpoints

---

## Deliverables

### 1. Database Models

#### File: `backend/app/models/order.py`

**Order Model** (180-220 lines)

```python
"""
Order Management System
Supports: IMAGING, LAB, PROCEDURE orders
"""
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base
import uuid
from datetime import datetime

class Order(Base):
    """
    Unified order model for all clinical orders
    """
    __tablename__ = "orders"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identifiers
    order_number = Column(String(20), unique=True, nullable=False, index=True)
    accession_number = Column(String(20), unique=True, nullable=True, index=True)
    
    # Type Discriminator
    order_type = Column(String(20), nullable=False, index=True)  # IMAGING, LAB, PROCEDURE
    
    # Relationships
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'), nullable=False, index=True)
    visit_id = Column(UUID(as_uuid=True), ForeignKey('visits.id'), nullable=False, index=True)
    ordered_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Common Order Fields
    status = Column(String(20), nullable=False, default='ordered', index=True)
    priority = Column(String(20), nullable=False, default='routine')
    clinical_indication = Column(Text, nullable=False)
    special_instructions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Type-Specific Details (JSON)
    order_details = Column(JSON, nullable=False)
    
    # Scheduling & Dates
    ordered_date = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    performed_date = Column(DateTime(timezone=True), nullable=True)
    reported_date = Column(DateTime(timezone=True), nullable=True)
    cancelled_date = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    # Personnel
    performing_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    reporting_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    
    # Results/Report
    report_text = Column(Text, nullable=True)
    findings = Column(Text, nullable=True)
    impression = Column(Text, nullable=True)
    result_status = Column(String(20), nullable=True)  # normal, abnormal, critical
    
    # DICOM Integration (Phase 5)
    study_instance_uid = Column(String(100), nullable=True)
    number_of_images = Column(Integer, nullable=True)
    external_id = Column(String(100), nullable=True)
    
    # Audit Fields
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", foreign_keys=[patient_id])
    visit = relationship("Visit", foreign_keys=[visit_id])
    ordered_by_user = relationship("User", foreign_keys=[ordered_by])
    performing_user = relationship("User", foreign_keys=[performing_user_id])
    reporting_user = relationship("User", foreign_keys=[reporting_user_id])
    
    # Indexes
    __table_args__ = (
        Index('idx_orders_patient_date', 'patient_id', 'ordered_date'),
        Index('idx_orders_visit_type', 'visit_id', 'order_type'),
        Index('idx_orders_status_type', 'status', 'order_type'),
    )
```

**Order Details JSON Structures:**

```python
# IMAGING Order Example
{
    "modality": "XRAY",
    "modality_name": "X-Ray",
    "body_part": "CHEST",
    "body_part_name": "Chest",
    "laterality": "bilateral",
    "procedure_code": "71020",
    "procedure_name": "Chest X-Ray 2 Views",
    "contrast": false,
    "clinical_history": "Cough for 2 weeks"
}

# LAB Order Example
{
    "test_code": "CBC",
    "test_name": "Complete Blood Count",
    "specimen_type": "blood",
    "specimen_source": "venous",
    "fasting_required": false,
    "collection_date": "2026-02-05T08:00:00",
    "panel": ["WBC", "RBC", "Hemoglobin", "Platelets"]
}

# PROCEDURE Order Example
{
    "procedure_code": "45378",
    "procedure_name": "Colonoscopy",
    "procedure_type": "diagnostic",
    "anesthesia_required": true,
    "estimated_duration": 30,
    "pre_procedure_instructions": "NPO after midnight"
}
```

#### File: `backend/app/models/imaging_modality.py`

```python
"""Imaging Modality Reference Data"""
from sqlalchemy import Column, String, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
import uuid

class ImagingModality(Base):
    __tablename__ = "imaging_modalities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
```

#### File: `backend/app/models/lab_test.py`

```python
"""Lab Test Reference Data"""
from sqlalchemy import Column, String, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
import uuid

class LabTest(Base):
    __tablename__ = "lab_tests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    specimen_type = Column(String(50), nullable=False)
    fasting_required = Column(Boolean, default=False)
    tat_hours = Column(Integer, nullable=True)  # Turnaround time
    is_active = Column(Boolean, default=True)
```

#### File: `backend/app/models/procedure_type.py`

```python
"""Procedure Type Reference Data"""
from sqlalchemy import Column, String, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
import uuid

class ProcedureType(Base):
    __tablename__ = "procedure_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    requires_consent = Column(Boolean, default=False)
    estimated_duration = Column(Integer, nullable=True)  # minutes
    is_active = Column(Boolean, default=True)
```

#### File: `backend/app/models/body_part.py`

```python
"""Body Part Reference Data"""
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSON
from app.models.base import Base
import uuid

class BodyPart(Base):
    __tablename__ = "body_parts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    applicable_modalities = Column(JSON, nullable=False)  # ["XRAY", "CT", "MRI"]
```

---

### 2. Pydantic Schemas

#### File: `backend/app/schemas/order.py` (200-250 lines)

```python
"""
Order Schemas
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Union, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum

# Enums
class OrderType(str, Enum):
    IMAGING = "IMAGING"
    LAB = "LAB"
    PROCEDURE = "PROCEDURE"

class OrderStatus(str, Enum):
    ORDERED = "ordered"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REPORTED = "reported"
    CANCELLED = "cancelled"

class OrderPriority(str, Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    STAT = "stat"

# Base Schemas
class OrderBase(BaseModel):
    order_type: OrderType
    priority: OrderPriority = OrderPriority.ROUTINE
    clinical_indication: str = Field(..., min_length=10, max_length=2000)
    special_instructions: Optional[str] = None

# Create Schemas - Type Specific
class ImagingOrderCreate(OrderBase):
    order_type: OrderType = OrderType.IMAGING
    modality: str = Field(..., description="Imaging modality code")
    body_part: str = Field(..., description="Body part code")
    laterality: Optional[str] = None
    procedure_code: Optional[str] = None
    contrast: bool = False
    clinical_history: Optional[str] = None

class LabOrderCreate(OrderBase):
    order_type: OrderType = OrderType.LAB
    test_code: str = Field(..., description="Lab test code")
    specimen_type: str
    fasting_required: bool = False
    collection_date: Optional[datetime] = None

class ProcedureOrderCreate(OrderBase):
    order_type: OrderType = OrderType.PROCEDURE
    procedure_code: str = Field(..., description="Procedure code (CPT)")
    anesthesia_required: bool = False
    estimated_duration: Optional[int] = None
    pre_procedure_instructions: Optional[str] = None

# Update Schemas
class OrderUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    special_instructions: Optional[str] = None
    notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None

class OrderReportAdd(BaseModel):
    report_text: str = Field(..., min_length=20)
    findings: str = Field(..., min_length=10)
    impression: str = Field(..., min_length=10)
    result_status: Optional[str] = None  # normal, abnormal, critical

# Response Schemas
class PatientSummary(BaseModel):
    id: UUID
    mrn: str
    full_name: str
    gender: str
    date_of_birth: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserSummary(BaseModel):
    id: UUID
    full_name: str
    role: str
    
    class Config:
        from_attributes = True

class VisitSummary(BaseModel):
    id: UUID
    visit_number: str
    status: str
    visit_date: str
    
    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    accession_number: Optional[str] = None
    order_type: OrderType
    status: OrderStatus
    priority: OrderPriority
    patient: PatientSummary
    visit: VisitSummary
    ordered_by: UserSummary
    order_details: Dict[str, Any]
    clinical_indication: str
    special_instructions: Optional[str] = None
    notes: Optional[str] = None
    ordered_date: datetime
    scheduled_date: Optional[datetime] = None
    performed_date: Optional[datetime] = None
    reported_date: Optional[datetime] = None
    cancelled_date: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    performing_user: Optional[UserSummary] = None
    reporting_user: Optional[UserSummary] = None
    report_text: Optional[str] = None
    findings: Optional[str] = None
    impression: Optional[str] = None
    result_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Reference Data Schemas
class ModalityResponse(BaseModel):
    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class LabTestResponse(BaseModel):
    id: UUID
    code: str
    name: str
    category: str
    specimen_type: str
    fasting_required: bool
    tat_hours: Optional[int] = None
    
    class Config:
        from_attributes = True

class ProcedureTypeResponse(BaseModel):
    id: UUID
    code: str
    name: str
    category: str
    requires_consent: bool
    estimated_duration: Optional[int] = None
    
    class Config:
        from_attributes = True

class BodyPartResponse(BaseModel):
    id: UUID
    code: str
    name: str
    applicable_modalities: List[str]
    
    class Config:
        from_attributes = True
```

---

### 3. Service Layer

#### File: `backend/app/services/order_service.py` (300-350 lines)

```python
"""
Order Service
Business logic for order management
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import joinedload
from typing import List, Optional, Union
from uuid import UUID
from datetime import datetime, date
from app.models.order import Order
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.user import User
from app.schemas.order import (
    ImagingOrderCreate, LabOrderCreate, ProcedureOrderCreate,
    OrderUpdate, OrderStatusUpdate, OrderReportAdd,
    OrderType, OrderStatus
)
from fastapi import HTTPException, status

# Number Generation
async def generate_order_number(db: AsyncSession) -> str:
    """
    Generate unique order number: ORD-YYYY-NNNNN
    """
    current_year = datetime.now().year
    prefix = f"ORD-{current_year}-"
    
    # Get last order number for current year
    result = await db.execute(
        select(Order.order_number)
        .where(Order.order_number.like(f"{prefix}%"))
        .order_by(Order.order_number.desc())
        .limit(1)
    )
    last_number = result.scalar_one_or_none()
    
    if last_number:
        sequence = int(last_number.split('-')[-1]) + 1
    else:
        sequence = 1
    
    return f"{prefix}{sequence:05d}"

async def generate_accession_number(db: AsyncSession) -> str:
    """
    Generate unique accession number: ACC-YYYY-NNNNN
    """
    current_year = datetime.now().year
    prefix = f"ACC-{current_year}-"
    
    # Get last accession number for current year
    result = await db.execute(
        select(Order.accession_number)
        .where(Order.accession_number.like(f"{prefix}%"))
        .order_by(Order.accession_number.desc())
        .limit(1)
    )
    last_number = result.scalar_one_or_none()
    
    if last_number:
        sequence = int(last_number.split('-')[-1]) + 1
    else:
        sequence = 1
    
    return f"{prefix}{sequence:05d}"

# CRUD Operations
async def create_order(
    db: AsyncSession,
    order_data: Union[ImagingOrderCreate, LabOrderCreate, ProcedureOrderCreate],
    patient_id: UUID,
    visit_id: UUID,
    user_id: UUID
) -> Order:
    """
    Create new order
    """
    # Validate patient exists
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate visit exists
    visit = await db.get(Visit, visit_id)
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found"
        )
    
    # Generate numbers
    order_number = await generate_order_number(db)
    accession_number = await generate_accession_number(db)
    
    # Build order_details based on type
    order_details = order_data.dict(exclude={'order_type', 'priority', 'clinical_indication', 'special_instructions'})
    
    # Create order
    order = Order(
        order_number=order_number,
        accession_number=accession_number,
        order_type=order_data.order_type.value,
        status=OrderStatus.ORDERED.value,
        priority=order_data.priority.value,
        clinical_indication=order_data.clinical_indication,
        special_instructions=order_data.special_instructions,
        order_details=order_details,
        patient_id=patient_id,
        visit_id=visit_id,
        ordered_by=user_id,
        ordered_date=datetime.utcnow()
    )
    
    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    return order

async def get_order(db: AsyncSession, order_id: UUID) -> Order:
    """Get order by ID with relationships"""
    result = await db.execute(
        select(Order)
        .options(
            joinedload(Order.patient),
            joinedload(Order.visit),
            joinedload(Order.ordered_by_user),
            joinedload(Order.performing_user),
            joinedload(Order.reporting_user)
        )
        .where(and_(Order.id == order_id, Order.is_deleted == False))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return order

async def get_order_by_accession(db: AsyncSession, accession_number: str) -> Order:
    """Search by accession number"""
    result = await db.execute(
        select(Order)
        .options(
            joinedload(Order.patient),
            joinedload(Order.visit),
            joinedload(Order.ordered_by_user)
        )
        .where(and_(
            Order.accession_number == accession_number,
            Order.is_deleted == False
        ))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found with this accession number"
        )
    return order

async def get_order_by_number(db: AsyncSession, order_number: str) -> Order:
    """Search by order number"""
    result = await db.execute(
        select(Order)
        .options(
            joinedload(Order.patient),
            joinedload(Order.visit),
            joinedload(Order.ordered_by_user)
        )
        .where(and_(
            Order.order_number == order_number,
            Order.is_deleted == False
        ))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found with this order number"
        )
    return order

async def list_orders(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    order_type: Optional[OrderType] = None,
    status: Optional[OrderStatus] = None,
    patient_id: Optional[UUID] = None,
    visit_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
) -> List[Order]:
    """List orders with filters"""
    query = select(Order).options(
        joinedload(Order.patient),
        joinedload(Order.visit),
        joinedload(Order.ordered_by_user)
    ).where(Order.is_deleted == False)
    
    # Apply filters
    if order_type:
        query = query.where(Order.order_type == order_type.value)
    if status:
        query = query.where(Order.status == status.value)
    if patient_id:
        query = query.where(Order.patient_id == patient_id)
    if visit_id:
        query = query.where(Order.visit_id == visit_id)
    if date_from:
        query = query.where(Order.ordered_date >= date_from)
    if date_to:
        query = query.where(Order.ordered_date <= date_to)
    
    query = query.order_by(Order.ordered_date.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()

async def update_order(
    db: AsyncSession,
    order_id: UUID,
    order_data: OrderUpdate
) -> Order:
    """Update order details"""
    order = await get_order(db, order_id)
    
    update_data = order_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    await db.commit()
    await db.refresh(order)
    return order

async def update_order_status(
    db: AsyncSession,
    order_id: UUID,
    status_data: OrderStatusUpdate,
    user_id: UUID
) -> Order:
    """Update order status"""
    order = await get_order(db, order_id)
    
    # Validate status transition (basic validation)
    current_status = OrderStatus(order.status)
    new_status = status_data.status
    
    # Update status
    order.status = new_status.value
    if status_data.notes:
        order.notes = f"{order.notes or ''}\n{status_data.notes}".strip()
    
    # Update date fields based on status
    now = datetime.utcnow()
    if new_status == OrderStatus.SCHEDULED:
        order.scheduled_date = order.scheduled_date or now
    elif new_status == OrderStatus.IN_PROGRESS:
        order.performing_user_id = user_id
    elif new_status == OrderStatus.COMPLETED:
        order.performed_date = now
    elif new_status == OrderStatus.REPORTED:
        order.reported_date = now
        order.reporting_user_id = user_id
    elif new_status == OrderStatus.CANCELLED:
        order.cancelled_date = now
    
    await db.commit()
    await db.refresh(order)
    return order

async def cancel_order(
    db: AsyncSession,
    order_id: UUID,
    reason: str,
    user_id: UUID
) -> Order:
    """Cancel order with reason"""
    order = await get_order(db, order_id)
    
    order.status = OrderStatus.CANCELLED.value
    order.cancelled_date = datetime.utcnow()
    order.cancellation_reason = reason
    
    await db.commit()
    await db.refresh(order)
    return order

async def add_report(
    db: AsyncSession,
    order_id: UUID,
    report_data: OrderReportAdd,
    user_id: UUID
) -> Order:
    """Add report to order"""
    order = await get_order(db, order_id)
    
    order.report_text = report_data.report_text
    order.findings = report_data.findings
    order.impression = report_data.impression
    order.result_status = report_data.result_status
    order.reporting_user_id = user_id
    order.reported_date = datetime.utcnow()
    order.status = OrderStatus.REPORTED.value
    
    await db.commit()
    await db.refresh(order)
    return order

async def get_patient_order_history(
    db: AsyncSession,
    patient_id: UUID,
    order_type: Optional[OrderType] = None
) -> List[Order]:
    """Get patient's order history"""
    query = select(Order).options(
        joinedload(Order.visit),
        joinedload(Order.ordered_by_user)
    ).where(and_(
        Order.patient_id == patient_id,
        Order.is_deleted == False
    ))
    
    if order_type:
        query = query.where(Order.order_type == order_type.value)
    
    query = query.order_by(Order.ordered_date.desc())
    
    result = await db.execute(query)
    return result.scalars().all()

async def get_visit_orders(
    db: AsyncSession,
    visit_id: UUID,
    order_type: Optional[OrderType] = None
) -> List[Order]:
    """Get all orders for a visit"""
    query = select(Order).options(
        joinedload(Order.patient),
        joinedload(Order.ordered_by_user)
    ).where(and_(
        Order.visit_id == visit_id,
        Order.is_deleted == False
    ))
    
    if order_type:
        query = query.where(Order.order_type == order_type.value)
    
    query = query.order_by(Order.ordered_date.desc())
    
    result = await db.execute(query)
    return result.scalars().all()

# Reference Data Services
async def get_imaging_modalities(db: AsyncSession) -> List:
    """Get all active imaging modalities"""
    from app.models.imaging_modality import ImagingModality
    result = await db.execute(
        select(ImagingModality)
        .where(ImagingModality.is_active == True)
        .order_by(ImagingModality.name)
    )
    return result.scalars().all()

async def get_lab_tests(db: AsyncSession) -> List:
    """Get all active lab tests"""
    from app.models.lab_test import LabTest
    result = await db.execute(
        select(LabTest)
        .where(LabTest.is_active == True)
        .order_by(LabTest.category, LabTest.name)
    )
    return result.scalars().all()

async def get_procedure_types(db: AsyncSession) -> List:
    """Get all active procedure types"""
    from app.models.procedure_type import ProcedureType
    result = await db.execute(
        select(ProcedureType)
        .where(ProcedureType.is_active == True)
        .order_by(ProcedureType.category, ProcedureType.name)
    )
    return result.scalars().all()

async def get_body_parts(db: AsyncSession) -> List:
    """Get all body parts"""
    from app.models.body_part import BodyPart
    result = await db.execute(
        select(BodyPart).order_by(BodyPart.name)
    )
    return result.scalars().all()
```

---

### 4. API Router

#### File: `backend/app/api/v1/orders/order_router.py` (350-400 lines)

```python
"""
Order API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union
from uuid import UUID
from datetime import date

from app.api.deps import get_db
from app.api.v1.auth.router import get_current_user
from app.models.user import User
from app.schemas.order import (
    ImagingOrderCreate, LabOrderCreate, ProcedureOrderCreate,
    OrderUpdate, OrderStatusUpdate, OrderReportAdd,
    OrderResponse, OrderType, OrderStatus,
    ModalityResponse, LabTestResponse, ProcedureTypeResponse, BodyPartResponse
)
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])

# Order CRUD
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: Union[ImagingOrderCreate, LabOrderCreate, ProcedureOrderCreate],
    visit_id: UUID = Query(..., description="Visit ID"),
    patient_id: UUID = Query(..., description="Patient ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new order (Imaging/Lab/Procedure)
    
    Generates:
    - order_number: ORD-YYYY-NNNNN
    - accession_number: ACC-YYYY-NNNNN
    """
    return await order_service.create_order(
        db, order_data, patient_id, visit_id, current_user.id
    )

@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    skip: int = 0,
    limit: int = 100,
    order_type: Optional[OrderType] = None,
    status: Optional[OrderStatus] = None,
    patient_id: Optional[UUID] = None,
    visit_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List orders with filters
    """
    return await order_service.list_orders(
        db, skip, limit, order_type, status, patient_id, visit_id, date_from, date_to
    )

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get order by ID"""
    return await order_service.get_order(db, order_id)

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: UUID,
    order_data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order details"""
    return await order_service.update_order(db, order_id, order_data)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete order (soft delete)"""
    order = await order_service.get_order(db, order_id)
    order.is_deleted = True
    await db.commit()
    return None

# Status Management
@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    status_data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order status"""
    return await order_service.update_order_status(db, order_id, status_data, current_user.id)

@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: UUID,
    reason: str = Query(..., min_length=10),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel order with reason"""
    return await order_service.cancel_order(db, order_id, reason, current_user.id)

@router.post("/{order_id}/report", response_model=OrderResponse)
async def add_report(
    order_id: UUID,
    report_data: OrderReportAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add report to order"""
    return await order_service.add_report(db, order_id, report_data, current_user.id)

# Search
@router.get("/search/accession/{accession_number}", response_model=OrderResponse)
async def search_by_accession(
    accession_number: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search order by accession number"""
    return await order_service.get_order_by_accession(db, accession_number)

@router.get("/search/number/{order_number}", response_model=OrderResponse)
async def search_by_order_number(
    order_number: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search order by order number"""
    return await order_service.get_order_by_number(db, order_number)

# Patient/Visit Specific
@router.get("/patient/{patient_id}", response_model=List[OrderResponse])
async def get_patient_orders(
    patient_id: UUID,
    order_type: Optional[OrderType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient's order history"""
    return await order_service.get_patient_order_history(db, patient_id, order_type)

@router.get("/visit/{visit_id}", response_model=List[OrderResponse])
async def get_visit_orders(
    visit_id: UUID,
    order_type: Optional[OrderType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all orders for a visit"""
    return await order_service.get_visit_orders(db, visit_id, order_type)

# Reference Data
@router.get("/modalities/list", response_model=List[ModalityResponse])
async def get_modalities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get imaging modalities"""
    return await order_service.get_imaging_modalities(db)

@router.get("/lab-tests/list", response_model=List[LabTestResponse])
async def get_lab_tests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get lab tests"""
    return await order_service.get_lab_tests(db)

@router.get("/procedures/list", response_model=List[ProcedureTypeResponse])
async def get_procedures(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get procedure types"""
    return await order_service.get_procedure_types(db)

@router.get("/body-parts/list", response_model=List[BodyPartResponse])
async def get_body_parts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get body parts"""
    return await order_service.get_body_parts(db)
```

---

### 5. Database Migration

#### File: `backend/alembic/versions/xxx_add_orders_system.py`

Run: `alembic revision --autogenerate -m "add orders system"`

```python
"""add orders system

Revision ID: xxx
Revises: yyy
Create Date: 2026-02-XX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Orders table
    op.create_table(
        'orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_number', sa.String(20), nullable=False),
        sa.Column('accession_number', sa.String(20), nullable=True),
        sa.Column('order_type', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('priority', sa.String(20), nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('visit_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ordered_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('clinical_indication', sa.Text, nullable=False),
        sa.Column('special_instructions', sa.Text, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('order_details', postgresql.JSON, nullable=False),
        sa.Column('ordered_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('scheduled_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('performed_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reported_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancellation_reason', sa.Text, nullable=True),
        sa.Column('performing_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reporting_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('report_text', sa.Text, nullable=True),
        sa.Column('findings', sa.Text, nullable=True),
        sa.Column('impression', sa.Text, nullable=True),
        sa.Column('result_status', sa.String(20), nullable=True),
        sa.Column('study_instance_uid', sa.String(100), nullable=True),
        sa.Column('number_of_images', sa.Integer, nullable=True),
        sa.Column('external_id', sa.String(100), nullable=True),
        sa.Column('is_deleted', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id']),
        sa.ForeignKeyConstraint(['ordered_by'], ['users.id']),
        sa.ForeignKeyConstraint(['performing_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['reporting_user_id'], ['users.id'])
    )
    
    # Indexes
    op.create_index('idx_orders_order_number', 'orders', ['order_number'], unique=True)
    op.create_index('idx_orders_accession', 'orders', ['accession_number'], unique=True)
    op.create_index('idx_orders_status', 'orders', ['status'])
    op.create_index('idx_orders_type', 'orders', ['order_type'])
    op.create_index('idx_orders_patient', 'orders', ['patient_id'])
    op.create_index('idx_orders_visit', 'orders', ['visit_id'])
    op.create_index('idx_orders_patient_date', 'orders', ['patient_id', 'ordered_date'])
    op.create_index('idx_orders_visit_type', 'orders', ['visit_id', 'order_type'])
    op.create_index('idx_orders_status_type', 'orders', ['status', 'order_type'])
    
    # Imaging Modalities
    op.create_table(
        'imaging_modalities',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(10), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    
    # Lab Tests
    op.create_table(
        'lab_tests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('specimen_type', sa.String(50), nullable=False),
        sa.Column('fasting_required', sa.Boolean, default=False),
        sa.Column('tat_hours', sa.Integer, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    
    # Procedure Types
    op.create_table(
        'procedure_types',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('requires_consent', sa.Boolean, default=False),
        sa.Column('estimated_duration', sa.Integer, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    
    # Body Parts
    op.create_table(
        'body_parts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('applicable_modalities', postgresql.JSON, nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )

def downgrade():
    op.drop_table('body_parts')
    op.drop_table('procedure_types')
    op.drop_table('lab_tests')
    op.drop_table('imaging_modalities')
    op.drop_table('orders')
```

---

### 6. Seed Data

#### File: `backend/app/db/seed_orders_data.py`

```python
"""
Seed data for orders system
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session
from app.models.imaging_modality import ImagingModality
from app.models.lab_test import LabTest
from app.models.procedure_type import ProcedureType
from app.models.body_part import BodyPart
import uuid

async def seed_imaging_modalities(db: AsyncSession):
    """Seed imaging modalities"""
    modalities = [
        {"code": "XRAY", "name": "X-Ray", "description": "Plain radiography"},
        {"code": "CT", "name": "CT Scan", "description": "Computed Tomography"},
        {"code": "MRI", "name": "MRI", "description": "Magnetic Resonance Imaging"},
        {"code": "US", "name": "Ultrasound", "description": "Ultrasonography"},
        {"code": "MG", "name": "Mammography", "description": "Breast imaging"},
        {"code": "FL", "name": "Fluoroscopy", "description": "Real-time X-ray imaging"},
    ]
    
    for mod in modalities:
        modality = ImagingModality(id=uuid.uuid4(), **mod)
        db.add(modality)
    
    await db.commit()
    print("✅ Seeded 6 imaging modalities")

async def seed_body_parts(db: AsyncSession):
    """Seed body parts"""
    parts = [
        {"code": "CHEST", "name": "Chest", "applicable_modalities": ["XRAY", "CT"]},
        {"code": "ABDOMEN", "name": "Abdomen", "applicable_modalities": ["XRAY", "CT", "US"]},
        {"code": "HEAD", "name": "Head/Brain", "applicable_modalities": ["CT", "MRI"]},
        {"code": "SPINE", "name": "Spine", "applicable_modalities": ["XRAY", "CT", "MRI"]},
        {"code": "EXTREMITY", "name": "Extremities", "applicable_modalities": ["XRAY", "MRI"]},
        {"code": "PELVIS", "name": "Pelvis", "applicable_modalities": ["XRAY", "CT", "MRI", "US"]},
        {"code": "NECK", "name": "Neck", "applicable_modalities": ["CT", "MRI", "US"]},
        {"code": "BREAST", "name": "Breast", "applicable_modalities": ["MG", "US"]},
        {"code": "HEART", "name": "Heart", "applicable_modalities": ["CT", "MRI"]},
        {"code": "JOINTS", "name": "Joints", "applicable_modalities": ["XRAY", "MRI", "US"]},
    ]
    
    for part in parts:
        body_part = BodyPart(id=uuid.uuid4(), **part)
        db.add(body_part)
    
    await db.commit()
    print("✅ Seeded 10 body parts")

async def seed_lab_tests(db: AsyncSession):
    """Seed lab tests"""
    tests = [
        {"code": "CBC", "name": "Complete Blood Count", "category": "Hematology", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 2},
        {"code": "BMP", "name": "Basic Metabolic Panel", "category": "Chemistry", 
         "specimen_type": "Blood", "fasting_required": True, "tat_hours": 4},
        {"code": "LFT", "name": "Liver Function Tests", "category": "Chemistry", 
         "specimen_type": "Blood", "fasting_required": True, "tat_hours": 6},
        {"code": "RFT", "name": "Renal Function Tests", "category": "Chemistry", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 4},
        {"code": "LIPID", "name": "Lipid Profile", "category": "Chemistry", 
         "specimen_type": "Blood", "fasting_required": True, "tat_hours": 6},
        {"code": "HBA1C", "name": "Hemoglobin A1c", "category": "Chemistry", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 24},
        {"code": "TSH", "name": "Thyroid Stimulating Hormone", "category": "Endocrinology", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 24},
        {"code": "URINE", "name": "Urine Routine", "category": "Urinalysis", 
         "specimen_type": "Urine", "fasting_required": False, "tat_hours": 2},
        {"code": "CULTURE", "name": "Blood Culture", "category": "Microbiology", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 72},
        {"code": "PT_INR", "name": "Prothrombin Time/INR", "category": "Coagulation", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 4},
    ]
    
    for test in tests:
        lab_test = LabTest(id=uuid.uuid4(), **test)
        db.add(lab_test)
    
    await db.commit()
    print("✅ Seeded 10 lab tests")

async def seed_procedure_types(db: AsyncSession):
    """Seed procedure types"""
    procedures = [
        {"code": "45378", "name": "Colonoscopy", "category": "Endoscopy", 
         "requires_consent": True, "estimated_duration": 30},
        {"code": "43239", "name": "Upper GI Endoscopy", "category": "Endoscopy", 
         "requires_consent": True, "estimated_duration": 20},
        {"code": "38220", "name": "Bone Marrow Biopsy", "category": "Biopsy", 
         "requires_consent": True, "estimated_duration": 45},
        {"code": "10060", "name": "Incision and Drainage", "category": "Minor Surgery", 
         "requires_consent": False, "estimated_duration": 15},
        {"code": "11100", "name": "Skin Biopsy", "category": "Biopsy", 
         "requires_consent": True, "estimated_duration": 20},
    ]
    
    for proc in procedures:
        procedure = ProcedureType(id=uuid.uuid4(), **proc)
        db.add(procedure)
    
    await db.commit()
    print("✅ Seeded 5 procedure types")

async def main():
    """Main seed function"""
    async with async_session() as db:
        print("🌱 Starting orders system seed data...")
        await seed_imaging_modalities(db)
        await seed_body_parts(db)
        await seed_lab_tests(db)
        await seed_procedure_types(db)
        print("🎉 Orders system seed data complete!")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Verification Steps

### 1. Database Setup
```bash
cd backend
source venv/bin/activate

# Apply migration
alembic upgrade head

# Seed reference data
python -m app.db.seed_orders_data
```

### 2. Test via Swagger UI
Navigate to: `http://localhost:8000/docs`

**Test Scenarios:**

✅ **Create Imaging Order**
```
POST /api/v1/orders/
Body: {
  "order_type": "IMAGING",
  "priority": "routine",
  "clinical_indication": "Suspected pneumonia, fever for 3 days",
  "modality": "XRAY",
  "body_part": "CHEST",
  "laterality": "bilateral"
}
Query params: visit_id, patient_id

Expected: 
- order_number: ORD-2026-00001
- accession_number: ACC-2026-00001
- status: ordered
```

✅ **Create Lab Order**
```
POST /api/v1/orders/
Body: {
  "order_type": "LAB",
  "priority": "urgent",
  "clinical_indication": "Check anemia, patient complains of fatigue",
  "test_code": "CBC",
  "specimen_type": "Blood",
  "fasting_required": false
}

Expected:
- order_number: ORD-2026-00002
- accession_number: ACC-2026-00002
```

✅ **List Orders**
```
GET /api/v1/orders/
Expected: Both orders returned with patient/visit/user relationships
```

✅ **Filter by Type**
```
GET /api/v1/orders/?order_type=IMAGING
Expected: Only imaging order returned
```

✅ **Update Status**
```
PATCH /api/v1/orders/{id}/status
Body: {
  "status": "scheduled",
  "notes": "Scheduled for tomorrow 10 AM"
}
Expected: Status changed to scheduled
```

✅ **Search by Accession**
```
GET /api/v1/orders/search/accession/ACC-2026-00001
Expected: Order found
```

✅ **Get Patient Orders**
```
GET /api/v1/orders/patient/{patient_id}
Expected: All patient orders
```

✅ **Get Modalities**
```
GET /api/v1/orders/modalities/list
Expected: 6 modalities (XRAY, CT, MRI, US, MG, FL)
```

✅ **Get Lab Tests**
```
GET /api/v1/orders/lab-tests/list
Expected: 10 lab tests
```

### 3. Database Verification
```sql
-- Check orders table
SELECT COUNT(*) FROM orders;

-- Check order numbers
SELECT order_number, accession_number, order_type, status FROM orders;

-- Check reference data
SELECT COUNT(*) FROM imaging_modalities;  -- Should be 6
SELECT COUNT(*) FROM lab_tests;           -- Should be 10
SELECT COUNT(*) FROM procedure_types;     -- Should be 5
SELECT COUNT(*) FROM body_parts;          -- Should be 10
```

---

## Completion Checklist

- [ ] Order model created with all fields
- [ ] Reference models created (ImagingModality, LabTest, ProcedureType, BodyPart)
- [ ] Pydantic schemas for all order types
- [ ] Order number generator working (ORD-YYYY-NNNNN)
- [ ] Accession number generator working (ACC-YYYY-NNNNN)
- [ ] Service layer with 15+ functions implemented
- [ ] API router with 15+ endpoints implemented
- [ ] Database migration applied successfully
- [ ] Seed data populated (6 modalities, 10 body parts, 10 tests, 5 procedures)
- [ ] Can create imaging orders
- [ ] Can create lab orders
- [ ] Can create procedure orders
- [ ] Order filtering works (type, status, patient, visit)
- [ ] Status updates work
- [ ] Search by accession works
- [ ] Search by order number works
- [ ] Patient order history works
- [ ] Visit orders works
- [ ] All reference data endpoints work
- [ ] All tests pass via Swagger

---

## Common Issues & Solutions

**Issue 1: Migration Fails**
- Solution: Check previous migration is applied
- Run: `alembic current` to see current revision
- Run: `alembic history` to see all revisions

**Issue 2: Seed Data Error**
- Solution: Check if tables exist
- Verify foreign key constraints

**Issue 3: Number Generation Duplicates**
- Solution: Check unique constraints on order_number and accession_number
- Verify sequence logic in generator functions

**Issue 4: JSON Field Validation**
- Solution: Use Pydantic models for order_details validation
- Add JSON schema validation if needed

---

## Next Phase

Once Phase 4A is complete and verified:
→ **Phase 4B: Orders Frontend** (5-6 days)

---

**Status:** Ready to implement  
**Estimated Completion:** February 11-12, 2026
