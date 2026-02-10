"""
System Setting Schemas
======================

Purpose:
    Pydantic schemas for SystemSetting model.
    Handles feature flags and configuration API.

Module: app/schemas/system_setting.py
Phase: 2A (Visit Models)

References:
    - Phase 2A Spec: docs/phases/phase2/Phase2A_VisitModels.md
    - SystemSetting Model: app/models/system_setting.py

Used By:
    - app/api/v1/settings/router.py (API endpoints)
    - Frontend feature flag hooks
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID


class SystemSettingBase(BaseModel):
    """Base schema for system settings."""
    
    key: str = Field(..., max_length=100, description="Setting key")
    value: str = Field(..., max_length=500, description="Setting value")
    description: Optional[str] = Field(None, description="Human-readable description")
    category: Optional[str] = Field("general", max_length=50, description="Category for grouping")


class SystemSettingCreate(SystemSettingBase):
    """Schema for creating a new setting (admin only)."""
    pass


class SystemSettingUpdate(BaseModel):
    """Schema for updating an existing setting."""
    
    value: str = Field(..., max_length=500, description="New value")
    description: Optional[str] = None


class SystemSettingResponse(SystemSettingBase):
    """Full setting response."""
    
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FeatureFlagsResponse(BaseModel):
    """
    Feature flags response for frontend.
    
    Returns only feature flag settings in a convenient format.
    Used by frontend to conditionally render UI elements.
    """
    
    VISIT_QUEUE_ENABLED: bool = False
    VISIT_SCHEDULING_ENABLED: bool = False
    
    @classmethod
    def from_settings(cls, settings: List[Dict]) -> "FeatureFlagsResponse":
        """
        Convert settings list to feature flags object.
        
        Args:
            settings: List of setting dicts with key/value
            
        Returns:
            FeatureFlagsResponse with boolean values
        """
        flags = {}
        for setting in settings:
            if setting.get("category") == "features":
                key = setting.get("key", "")
                value = setting.get("value", "false")
                flags[key] = value.lower() == "true"
        
        return cls(**flags)
