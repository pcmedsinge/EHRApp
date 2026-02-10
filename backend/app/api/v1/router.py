"""
API v1 Router
=============

Purpose:
    Main API router that aggregates all module routers.
    All routes are prefixed with /api/v1.

Module: app/api/v1/router.py
Phase: 1B (Backend Core) + 2B (Visit API)

References:
    - Phase 1B Spec: docs/phases/phase1/Phase1B_BackendCore.md
    - Phase 2B Spec: docs/phases/phase2/Phase2B_Backend_VisitAPI.md

Route Structure:
    /api/v1/auth/*      - Authentication (login, logout, me)
    /api/v1/patients/*  - Patient management
    /api/v1/visits/*    - Visit management
    /api/v1/settings/*  - System settings & feature flags
"""

from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router
from app.api.v1.visits import router as visits_router
from app.api.v1.settings import router as settings_router
from app.api.v1.vitals import router as vitals_router
from app.api.v1.diagnosis import diagnosis_router, icd10_router
from app.api.v1.clinical_notes.clinical_note_router import router as clinical_notes_router
from app.api.v1.orders.order_router import router as orders_router
from app.api.v1.dicom import router as dicom_router  # Phase 5A

# Create API router
api_router = APIRouter()

# Include authentication router
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# Include patients router
api_router.include_router(patients_router, prefix="/patients", tags=["Patients"])

# Include visits router
api_router.include_router(visits_router, prefix="/visits", tags=["Visits"])

# Include settings router
api_router.include_router(settings_router, prefix="/settings", tags=["Settings"])

# Phase 3A: Vitals router
api_router.include_router(vitals_router, prefix="/vitals", tags=["Vitals"])

# Phase 3C: Diagnosis routers
api_router.include_router(diagnosis_router, prefix="/diagnoses", tags=["Diagnoses"])
api_router.include_router(icd10_router, prefix="/icd10", tags=["ICD-10"])

# Phase 3E: Clinical Notes router
api_router.include_router(clinical_notes_router, tags=["Clinical Notes"])

# Phase 4A: Orders router
api_router.include_router(orders_router, tags=["Orders"])

# Phase 5A: DICOM router
api_router.include_router(dicom_router, tags=["DICOM"])
