"""
Diagnosis API Package
====================

Purpose:
  Exports diagnosis and ICD-10 routers.

Module: app/api/v1/diagnosis/__init__.py
Phase: 3C (Backend - Diagnosis)
"""

from app.api.v1.diagnosis.diagnosis_router import router as diagnosis_router
from app.api.v1.diagnosis.icd10_router import router as icd10_router

__all__ = ["diagnosis_router", "icd10_router"]
