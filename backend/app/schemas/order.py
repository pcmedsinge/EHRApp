"""
Order Schemas
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
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
    patient_id: UUID
    visit_id: Optional[UUID] = None
    priority: OrderPriority = OrderPriority.ROUTINE
    clinical_indication: str = Field(..., min_length=10, max_length=2000)
    special_instructions: Optional[str] = None
    scheduled_date: Optional[datetime] = None


# Create Schemas - Type Specific
class ImagingOrderCreate(OrderBase):
    order_type: OrderType = OrderType.IMAGING
    modality_id: str = Field(..., description="Imaging modality ID")
    body_part_id: Optional[str] = Field(None, description="Body part ID")
    laterality: Optional[str] = None
    contrast: bool = False
    num_views: Optional[int] = None


class LabOrderCreate(OrderBase):
    order_type: OrderType = OrderType.LAB
    lab_test_ids: List[str] = Field(..., description="List of lab test IDs")
    specimen_source: Optional[str] = None
    collection_datetime: Optional[datetime] = None


class ProcedureOrderCreate(OrderBase):
    order_type: OrderType = OrderType.PROCEDURE
    procedure_type_id: str = Field(..., description="Procedure type ID")
    anesthesia_type: Optional[str] = None
    consent_obtained: bool = False
    estimated_duration: Optional[int] = None


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
    first_name: str
    last_name: str
    full_name: str
    gender: str
    date_of_birth: Optional[str] = None
    
    @validator('full_name', pre=True, always=True)
    def compute_full_name(cls, v, values):
        # If full_name is already set (from @property), use it
        if v:
            return v
        # Otherwise compute from first_name and last_name
        first = values.get('first_name', '')
        last = values.get('last_name', '')
        return f"{first} {last}".strip()
    
    @validator('date_of_birth', pre=True)
    def convert_date(cls, v):
        if hasattr(v, 'isoformat'):
            return v.isoformat()
        return v
    
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
    
    @validator('visit_date', pre=True)
    def convert_date(cls, v):
        if hasattr(v, 'isoformat'):
            return v.isoformat()
        return v
    
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
    ordered_by: UserSummary = Field(alias="ordered_by_user")
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
        populate_by_name = True


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
