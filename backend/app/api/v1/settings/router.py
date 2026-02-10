"""
Settings API Router
===================

Purpose:
    RESTful API for system settings and feature flags.
    Provides configuration access and management.

Module: app/api/v1/settings/router.py
Phase: 2B (Backend - Visit API)

References:
    - Phase 2B Spec: docs/phases/phase2/Phase2B_Backend_VisitAPI.md
    - SystemSetting Model: app/models/system_setting.py
    - SystemSetting Schemas: app/schemas/system_setting.py

Endpoints:
    GET    /features     - Get feature flags for frontend
    GET    /             - List all settings (admin only)
    GET    /{key}        - Get setting by key
    PUT    /{key}        - Update setting (admin only)

Feature Flags:
    - VISIT_QUEUE_ENABLED: Show/hide queue UI
    - VISIT_SCHEDULING_ENABLED: Show/hide scheduling UI
"""

from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.v1.auth.router import get_current_user
from app.models.user import User
from app.models.system_setting import SystemSetting
from app.schemas.system_setting import (
    SystemSettingResponse,
    SystemSettingUpdate,
    FeatureFlagsResponse
)


router = APIRouter()


# =============================================================================
# FEATURE FLAGS ENDPOINT
# =============================================================================

@router.get("/features", response_model=FeatureFlagsResponse)
async def get_feature_flags(
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get feature flags for frontend.
    
    Returns boolean flags for optional features:
    - VISIT_QUEUE_ENABLED: Enable queue management UI
    - VISIT_SCHEDULING_ENABLED: Enable appointment scheduling UI
    
    Used by frontend to conditionally render UI components.
    """
    # Query feature flag settings
    stmt = select(SystemSetting).where(
        SystemSetting.key.in_([
            "VISIT_QUEUE_ENABLED",
            "VISIT_SCHEDULING_ENABLED"
        ])
    )
    result = await db.execute(stmt)
    settings = result.scalars().all()
    
    # Convert to dict
    settings_dict = {s.key: s.value.lower() == "true" for s in settings}
    
    return FeatureFlagsResponse(
        VISIT_QUEUE_ENABLED=settings_dict.get("VISIT_QUEUE_ENABLED", False),
        VISIT_SCHEDULING_ENABLED=settings_dict.get("VISIT_SCHEDULING_ENABLED", False)
    )


# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================

@router.get("/", response_model=List[SystemSettingResponse])
async def list_settings(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    List all system settings.
    
    Returns all configuration settings.
    Useful for admin panel settings management.
    """
    # TODO: Add admin role check
    # if current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    stmt = select(SystemSetting).order_by(SystemSetting.category, SystemSetting.key)
    result = await db.execute(stmt)
    settings = result.scalars().all()
    
    return settings


@router.get("/{key}", response_model=SystemSettingResponse)
async def get_setting(
    key: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Get setting by key.
    
    Returns the setting value and metadata.
    """
    stmt = select(SystemSetting).where(SystemSetting.key == key)
    result = await db.execute(stmt)
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' not found"
        )
    
    return setting


@router.put("/{key}", response_model=SystemSettingResponse)
async def update_setting(
    key: str,
    setting_data: SystemSettingUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Update setting value.
    
    Updates the value for an existing setting.
    Admin access required (not yet implemented).
    
    **Example request body:**
    ```json
    {
        "value": "true",
        "description": "Enable visit queue management"
    }
    ```
    """
    # TODO: Add admin role check
    # if current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    stmt = select(SystemSetting).where(SystemSetting.key == key)
    result = await db.execute(stmt)
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' not found"
        )
    
    # Update setting
    setting.value = setting_data.value
    if setting_data.description is not None:
        setting.description = setting_data.description
    
    await db.commit()
    await db.refresh(setting)
    
    return setting
