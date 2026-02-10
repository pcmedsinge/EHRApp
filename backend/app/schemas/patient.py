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
