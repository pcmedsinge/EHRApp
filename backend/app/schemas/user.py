from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=6, max_length=50)


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=6, max_length=50)
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response (no password)"""
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserResponse):
    """Schema for user in database (includes password hash)"""
    password_hash: str
