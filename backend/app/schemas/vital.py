from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class VitalCreate(BaseModel):
    """Create vital signs schema"""
    visit_id: UUID
    patient_id: UUID
    bp_systolic: Optional[int] = Field(None, ge=60, le=300)
    bp_diastolic: Optional[int] = Field(None, ge=40, le=200)
    pulse: Optional[int] = Field(None, ge=30, le=250)
    temperature: Optional[float] = Field(None, ge=35.0, le=42.0)
    respiratory_rate: Optional[int] = Field(None, ge=8, le=60)
    spo2: Optional[int] = Field(None, ge=70, le=100)
    height_cm: Optional[float] = Field(None, ge=30.0, le=250.0)
    weight_kg: Optional[float] = Field(None, ge=0.5, le=300.0)
    blood_sugar: Optional[float] = Field(None, ge=20.0, le=600.0)
    blood_sugar_type: Optional[str] = Field(None, pattern='^(fasting|random|pp)$')
    notes: Optional[str] = None
    recorded_at: Optional[datetime] = None

    @field_validator('blood_sugar_type')
    @classmethod
    def validate_blood_sugar_type(cls, v, info):
        if v and info.data.get('blood_sugar') is None:
            raise ValueError('blood_sugar_type requires blood_sugar value')
        return v


class VitalUpdate(BaseModel):
    """Update vital signs schema"""
    bp_systolic: Optional[int] = Field(None, ge=60, le=300)
    bp_diastolic: Optional[int] = Field(None, ge=40, le=200)
    pulse: Optional[int] = Field(None, ge=30, le=250)
    temperature: Optional[float] = Field(None, ge=35.0, le=42.0)
    respiratory_rate: Optional[int] = Field(None, ge=8, le=60)
    spo2: Optional[int] = Field(None, ge=70, le=100)
    height_cm: Optional[float] = Field(None, ge=30.0, le=250.0)
    weight_kg: Optional[float] = Field(None, ge=0.5, le=300.0)
    blood_sugar: Optional[float] = Field(None, ge=20.0, le=600.0)
    blood_sugar_type: Optional[str] = Field(None, pattern='^(fasting|random|pp)$')
    notes: Optional[str] = None


class VitalResponse(BaseModel):
    """Vital signs response schema"""
    id: UUID
    visit_id: UUID
    patient_id: UUID
    recorded_by: UUID
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    pulse: Optional[int] = None
    temperature: Optional[float] = None
    respiratory_rate: Optional[int] = None
    spo2: Optional[int] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    bmi: Optional[float] = None
    blood_sugar: Optional[float] = None
    blood_sugar_type: Optional[str] = None
    notes: Optional[str] = None
    recorded_at: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
