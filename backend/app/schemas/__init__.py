"""
Schemas Package
===============

Purpose:
    Exports all Pydantic schemas for request/response validation.

Module: app/schemas/__init__.py

Schema Groups:
    - User: UserCreate, UserUpdate, UserResponse (Phase 1C)
    - Patient: PatientCreate, PatientUpdate, PatientResponse (Phase 1D)
    - Visit: VisitCreate, VisitUpdate, VisitResponse (Phase 2A)
    - SystemSetting: SettingCreate, SettingUpdate, FeatureFlags (Phase 2A)

Usage:
    from app.schemas import PatientCreate, PatientResponse
    from app.schemas.visit import VisitCreate, VisitStatusUpdate
"""

# User schemas
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
)

# Patient schemas
from app.schemas.patient import (
    PatientBase,
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse,
)

# Visit schemas (Phase 2A)
from app.schemas.visit import (
    VisitBase,
    VisitCreate,
    VisitUpdate,
    VisitStatusUpdate,
    VisitResponse,
    VisitListResponse,
    VisitSummary,
    VisitStatsResponse,
    PatientSummary as VisitPatientSummary,
    DoctorSummary,
)

# System Setting schemas (Phase 2A)
from app.schemas.system_setting import (
    SystemSettingBase,
    SystemSettingCreate,
    SystemSettingUpdate,
    SystemSettingResponse,
    FeatureFlagsResponse,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "Token",
    "TokenData",
    # Patient
    "PatientBase",
    "PatientCreate",
    "PatientUpdate",
    "PatientResponse",
    "PatientListResponse",
    "PatientSummary",
    # Visit
    "VisitBase",
    "VisitCreate",
    "VisitUpdate",
    "VisitStatusUpdate",
    "VisitResponse",
    "VisitListResponse",
    "VisitSummary",
    "VisitStatsResponse",
    "DoctorSummary",
    # Settings
    "SystemSettingBase",
    "SystemSettingCreate",
    "SystemSettingUpdate",
    "SystemSettingResponse",
    "FeatureFlagsResponse",
]
