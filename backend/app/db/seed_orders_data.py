"""
Seed data for orders system
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.imaging_modality import ImagingModality
from app.models.lab_test import LabTest
from app.models.procedure_type import ProcedureType
from app.models.body_part import BodyPart

# Import all models to ensure they're registered
from app.models import Patient, User, Visit, Vital, Diagnosis, ICD10Code
from app.models.clinical_note import ClinicalNote, NoteTemplate
import uuid


async def seed_imaging_modalities(db: AsyncSession):
    """Seed imaging modalities"""
    modalities = [
        {"code": "XRAY", "name": "X-Ray", "description": "Plain radiography"},
        {"code": "CT", "name": "CT Scan", "description": "Computed Tomography"},
        {"code": "MRI", "name": "MRI", "description": "Magnetic Resonance Imaging"},
        {"code": "US", "name": "Ultrasound", "description": "Ultrasonography"},
        {"code": "MG", "name": "Mammography", "description": "Breast imaging"},
        {"code": "FL", "name": "Fluoroscopy", "description": "Real-time X-ray imaging"},
    ]
    
    for mod in modalities:
        modality = ImagingModality(id=uuid.uuid4(), **mod)
        db.add(modality)
    
    await db.commit()
    print("✅ Seeded 6 imaging modalities")


async def seed_body_parts(db: AsyncSession):
    """Seed body parts"""
    parts = [
        {"code": "CHEST", "name": "Chest", "applicable_modalities": ["XRAY", "CT"]},
        {"code": "ABDOMEN", "name": "Abdomen", "applicable_modalities": ["XRAY", "CT", "US"]},
        {"code": "HEAD", "name": "Head/Brain", "applicable_modalities": ["CT", "MRI"]},
        {"code": "SPINE", "name": "Spine", "applicable_modalities": ["XRAY", "CT", "MRI"]},
        {"code": "EXTREMITY", "name": "Extremities", "applicable_modalities": ["XRAY", "MRI"]},
        {"code": "PELVIS", "name": "Pelvis", "applicable_modalities": ["XRAY", "CT", "MRI", "US"]},
        {"code": "NECK", "name": "Neck", "applicable_modalities": ["CT", "MRI", "US"]},
        {"code": "BREAST", "name": "Breast", "applicable_modalities": ["MG", "US"]},
        {"code": "HEART", "name": "Heart", "applicable_modalities": ["CT", "MRI"]},
        {"code": "JOINTS", "name": "Joints", "applicable_modalities": ["XRAY", "MRI", "US"]},
    ]
    
    for part in parts:
        body_part = BodyPart(id=uuid.uuid4(), **part)
        db.add(body_part)
    
    await db.commit()
    print("✅ Seeded 10 body parts")


async def seed_lab_tests(db: AsyncSession):
    """Seed lab tests"""
    tests = [
        {"code": "CBC", "name": "Complete Blood Count", "category": "Hematology", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 2},
        {"code": "BMP", "name": "Basic Metabolic Panel", "category": "Chemistry", 
         "specimen_type": "Blood", "fasting_required": True, "tat_hours": 4},
        {"code": "LFT", "name": "Liver Function Tests", "category": "Chemistry", 
         "specimen_type": "Blood", "fasting_required": True, "tat_hours": 6},
        {"code": "RFT", "name": "Renal Function Tests", "category": "Chemistry", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 4},
        {"code": "LIPID", "name": "Lipid Profile", "category": "Chemistry", 
         "specimen_type": "Blood", "fasting_required": True, "tat_hours": 6},
        {"code": "HBA1C", "name": "Hemoglobin A1c", "category": "Chemistry", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 24},
        {"code": "TSH", "name": "Thyroid Stimulating Hormone", "category": "Endocrinology", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 24},
        {"code": "URINE", "name": "Urine Routine", "category": "Urinalysis", 
         "specimen_type": "Urine", "fasting_required": False, "tat_hours": 2},
        {"code": "CULTURE", "name": "Blood Culture", "category": "Microbiology", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 72},
        {"code": "PT_INR", "name": "Prothrombin Time/INR", "category": "Coagulation", 
         "specimen_type": "Blood", "fasting_required": False, "tat_hours": 4},
    ]
    
    for test in tests:
        lab_test = LabTest(id=uuid.uuid4(), **test)
        db.add(lab_test)
    
    await db.commit()
    print("✅ Seeded 10 lab tests")


async def seed_procedure_types(db: AsyncSession):
    """Seed procedure types"""
    procedures = [
        {"code": "45378", "name": "Colonoscopy", "category": "Endoscopy", 
         "requires_consent": True, "estimated_duration": 30},
        {"code": "43239", "name": "Upper GI Endoscopy", "category": "Endoscopy", 
         "requires_consent": True, "estimated_duration": 20},
        {"code": "38220", "name": "Bone Marrow Biopsy", "category": "Biopsy", 
         "requires_consent": True, "estimated_duration": 45},
        {"code": "10060", "name": "Incision and Drainage", "category": "Minor Surgery", 
         "requires_consent": False, "estimated_duration": 15},
        {"code": "11100", "name": "Skin Biopsy", "category": "Biopsy", 
         "requires_consent": True, "estimated_duration": 20},
    ]
    
    for proc in procedures:
        procedure = ProcedureType(id=uuid.uuid4(), **proc)
        db.add(procedure)
    
    await db.commit()
    print("✅ Seeded 5 procedure types")


async def main():
    """Main seed function"""
    async with AsyncSessionLocal() as db:
        print("🌱 Starting orders system seed data...")
        await seed_imaging_modalities(db)
        await seed_body_parts(db)
        await seed_lab_tests(db)
        await seed_procedure_types(db)
        print("🎉 Orders system seed data complete!")


if __name__ == "__main__":
    asyncio.run(main())
