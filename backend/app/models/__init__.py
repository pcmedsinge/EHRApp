"""
Models Package
==============

Purpose:
    Exports all SQLAlchemy models for the EHR application.

Module: app/models/__init__.py

Models:
    - BaseModel: Abstract base with id, timestamps (Phase 1B)
    - User, UserRole: User accounts and roles (Phase 1C)
    - Patient: Patient demographics (Phase 1D)
    - Visit: Patient visits (Phase 2A)
    - SystemSetting: Configuration/feature flags (Phase 2A)

Enums:
    - UserRole: admin, doctor, nurse, receptionist
    - VisitStatus: registered, waiting, in_progress, completed, cancelled
    - VisitType: consultation, follow_up, emergency, procedure
    - Priority: normal, urgent, emergency

Usage:
    from app.models import User, Patient, Visit
"""

from app.models.base import BaseModel
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.system_setting import SystemSetting
from app.models.vital import Vital  # Phase 3A
from app.models.icd10_code import ICD10Code  # Phase 3C
from app.models.diagnosis import Diagnosis, DiagnosisType, DiagnosisStatus, Severity  # Phase 3C
from app.models.clinical_note import ClinicalNote, NoteTemplate  # Phase 3D
from app.models.order import Order  # Phase 4
from app.models.imaging_modality import ImagingModality  # Phase 4
from app.models.body_part import BodyPart  # Phase 4
from app.models.lab_test import LabTest  # Phase 4
from app.models.procedure_type import ProcedureType  # Phase 4
from app.models.enums import VisitStatus, VisitType, Priority, ALLOWED_STATUS_TRANSITIONS
from app.models.dicom_upload_log import DicomUploadLog  # Phase 5A

__all__ = [
    # Base
    "BaseModel",
    # User
    "User",
    "UserRole",
    # Patient
    "Patient",
    # Visit
    "Visit",
    "VisitStatus",
    "VisitType",
    "Priority",
    "ALLOWED_STATUS_TRANSITIONS",
    # Settings
    "SystemSetting",
    # Phase 3A: Vitals
    "Vital",
    # Phase 3C: Diagnosis
    "ICD10Code",
    "Diagnosis",
    "DiagnosisType",
    "DiagnosisStatus",
    "Severity",
    # Phase 3D: Clinical Notes
    "ClinicalNote",
    "NoteTemplate",
    # Phase 4: Orders
    "Order",
    "ImagingModality",
    "BodyPart",
    "LabTest",
    "ProcedureType",
    # Phase 5A: DICOM
    "DicomUploadLog",
]
