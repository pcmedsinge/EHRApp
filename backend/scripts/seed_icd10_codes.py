"""
ICD-10 Codes Seed Data Script
==============================

Purpose:
    Seed the database with common ICD-10 diagnosis codes used in Indian healthcare.
    Includes ~100 frequently used codes across multiple specialties.

Usage:
    python scripts/seed_icd10_codes.py

Module: scripts/seed_icd10_codes.py
Phase: 3C (Diagnosis Backend)
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.icd10_code import ICD10Code


# Common ICD-10 codes for Indian healthcare
ICD10_SEED_DATA = [
    # Diabetes (Very common in India)
    {"code": "E11.9", "description": "Type 2 diabetes mellitus without complications", "category": "Endocrine", "subcategory": "Diabetes", "usage_count": 150, "common_in_india": True},
    {"code": "E11.65", "description": "Type 2 diabetes mellitus with hyperglycemia", "category": "Endocrine", "subcategory": "Diabetes", "usage_count": 120, "common_in_india": True},
    {"code": "E11.21", "description": "Type 2 diabetes mellitus with diabetic nephropathy", "category": "Endocrine", "subcategory": "Diabetes", "usage_count": 80, "common_in_india": True},
    {"code": "E11.36", "description": "Type 2 diabetes mellitus with diabetic cataract", "category": "Endocrine", "subcategory": "Diabetes", "usage_count": 60, "common_in_india": True},
    {"code": "E10.9", "description": "Type 1 diabetes mellitus without complications", "category": "Endocrine", "subcategory": "Diabetes", "usage_count": 40, "common_in_india": True},
    
    # Hypertension (Very common)
    {"code": "I10", "description": "Essential (primary) hypertension", "category": "Circulatory", "subcategory": "Hypertension", "usage_count": 200, "common_in_india": True},
    {"code": "I11.9", "description": "Hypertensive heart disease without heart failure", "category": "Circulatory", "subcategory": "Hypertension", "usage_count": 70, "common_in_india": True},
    {"code": "I12.9", "description": "Hypertensive chronic kidney disease", "category": "Circulatory", "subcategory": "Hypertension", "usage_count": 50, "common_in_india": True},
    
    # Respiratory infections (Common)
    {"code": "J18.9", "description": "Pneumonia, unspecified organism", "category": "Respiratory", "subcategory": "Infections", "usage_count": 90, "common_in_india": True},
    {"code": "J06.9", "description": "Acute upper respiratory infection, unspecified", "category": "Respiratory", "subcategory": "Infections", "usage_count": 180, "common_in_india": True},
    {"code": "J20.9", "description": "Acute bronchitis, unspecified", "category": "Respiratory", "subcategory": "Infections", "usage_count": 100, "common_in_india": True},
    {"code": "J00", "description": "Acute nasopharyngitis (common cold)", "category": "Respiratory", "subcategory": "Infections", "usage_count": 150, "common_in_india": True},
    {"code": "J44.9", "description": "Chronic obstructive pulmonary disease, unspecified", "category": "Respiratory", "subcategory": "Chronic", "usage_count": 70, "common_in_india": True},
    {"code": "J45.909", "description": "Unspecified asthma, uncomplicated", "category": "Respiratory", "subcategory": "Chronic", "usage_count": 80, "common_in_india": True},
    
    # Infectious diseases (Endemic in India)
    {"code": "A09", "description": "Infectious gastroenteritis and colitis, unspecified", "category": "Infectious", "subcategory": "GI", "usage_count": 140, "common_in_india": True},
    {"code": "A00.9", "description": "Cholera, unspecified", "category": "Infectious", "subcategory": "GI", "usage_count": 30, "common_in_india": True},
    {"code": "A01.0", "description": "Typhoid fever", "category": "Infectious", "subcategory": "Bacterial", "usage_count": 60, "common_in_india": True},
    {"code": "A90", "description": "Dengue fever", "category": "Infectious", "subcategory": "Viral", "usage_count": 100, "common_in_india": True},
    {"code": "A91", "description": "Dengue hemorrhagic fever", "category": "Infectious", "subcategory": "Viral", "usage_count": 40, "common_in_india": True},
    {"code": "B50.9", "description": "Plasmodium falciparum malaria, unspecified", "category": "Infectious", "subcategory": "Parasitic", "usage_count": 50, "common_in_india": True},
    {"code": "B51.9", "description": "Plasmodium vivax malaria without complication", "category": "Infectious", "subcategory": "Parasitic", "usage_count": 45, "common_in_india": True},
    {"code": "A15.9", "description": "Respiratory tuberculosis unspecified", "category": "Infectious", "subcategory": "Bacterial", "usage_count": 80, "common_in_india": True},
    {"code": "B20", "description": "Human immunodeficiency virus [HIV] disease", "category": "Infectious", "subcategory": "Viral", "usage_count": 40, "common_in_india": True},
    {"code": "B16.9", "description": "Acute hepatitis B without delta-agent", "category": "Infectious", "subcategory": "Viral", "usage_count": 35, "common_in_india": True},
    {"code": "B17.10", "description": "Acute hepatitis C without hepatic coma", "category": "Infectious", "subcategory": "Viral", "usage_count": 30, "common_in_india": True},
    
    # Gastrointestinal disorders
    {"code": "K21.9", "description": "Gastro-esophageal reflux disease without esophagitis", "category": "Digestive", "subcategory": "Upper GI", "usage_count": 110, "common_in_india": True},
    {"code": "K29.70", "description": "Gastritis, unspecified, without bleeding", "category": "Digestive", "subcategory": "Upper GI", "usage_count": 100, "common_in_india": True},
    {"code": "K30", "description": "Functional dyspepsia", "category": "Digestive", "subcategory": "Upper GI", "usage_count": 90, "common_in_india": True},
    {"code": "K59.00", "description": "Constipation, unspecified", "category": "Digestive", "subcategory": "Lower GI", "usage_count": 80, "common_in_india": True},
    {"code": "K58.9", "description": "Irritable bowel syndrome without diarrhea", "category": "Digestive", "subcategory": "Lower GI", "usage_count": 70, "common_in_india": True},
    {"code": "K80.20", "description": "Calculus of gallbladder without cholecystitis", "category": "Digestive", "subcategory": "Hepatobiliary", "usage_count": 50, "common_in_india": True},
    
    # Anemia (Very common in India)
    {"code": "D50.9", "description": "Iron deficiency anemia, unspecified", "category": "Blood", "subcategory": "Anemia", "usage_count": 130, "common_in_india": True},
    {"code": "D53.9", "description": "Nutritional anemia, unspecified", "category": "Blood", "subcategory": "Anemia", "usage_count": 80, "common_in_india": True},
    {"code": "D64.9", "description": "Anemia, unspecified", "category": "Blood", "subcategory": "Anemia", "usage_count": 100, "common_in_india": True},
    
    # Fever syndromes
    {"code": "R50.9", "description": "Fever, unspecified", "category": "Symptoms", "subcategory": "General", "usage_count": 200, "common_in_india": True},
    {"code": "R50.81", "description": "Fever presenting with conditions classified elsewhere", "category": "Symptoms", "subcategory": "General", "usage_count": 80, "common_in_india": True},
    
    # Cardiovascular
    {"code": "I25.10", "description": "Atherosclerotic heart disease without angina pectoris", "category": "Circulatory", "subcategory": "Ischemic", "usage_count": 90, "common_in_india": True},
    {"code": "I21.9", "description": "Acute myocardial infarction, unspecified", "category": "Circulatory", "subcategory": "Ischemic", "usage_count": 50, "common_in_india": False},
    {"code": "I50.9", "description": "Heart failure, unspecified", "category": "Circulatory", "subcategory": "Heart failure", "usage_count": 60, "common_in_india": True},
    {"code": "I48.91", "description": "Unspecified atrial fibrillation", "category": "Circulatory", "subcategory": "Arrhythmia", "usage_count": 40, "common_in_india": False},
    
    # Renal disorders
    {"code": "N18.9", "description": "Chronic kidney disease, unspecified", "category": "Genitourinary", "subcategory": "Kidney", "usage_count": 70, "common_in_india": True},
    {"code": "N39.0", "description": "Urinary tract infection, site not specified", "category": "Genitourinary", "subcategory": "Urinary", "usage_count": 120, "common_in_india": True},
    {"code": "N20.0", "description": "Calculus of kidney", "category": "Genitourinary", "subcategory": "Kidney", "usage_count": 60, "common_in_india": True},
    
    # Neurological
    {"code": "G43.909", "description": "Migraine, unspecified, not intractable, without status migrainosus", "category": "Nervous", "subcategory": "Headache", "usage_count": 80, "common_in_india": True},
    {"code": "G44.209", "description": "Tension-type headache, unspecified, not intractable", "category": "Nervous", "subcategory": "Headache", "usage_count": 90, "common_in_india": True},
    {"code": "I63.9", "description": "Cerebral infarction, unspecified", "category": "Nervous", "subcategory": "Stroke", "usage_count": 40, "common_in_india": True},
    {"code": "G40.909", "description": "Epilepsy, unspecified, not intractable, without status epilepticus", "category": "Nervous", "subcategory": "Seizure", "usage_count": 50, "common_in_india": True},
    
    # Musculoskeletal
    {"code": "M25.50", "description": "Pain in unspecified joint", "category": "Musculoskeletal", "subcategory": "Joint", "usage_count": 100, "common_in_india": True},
    {"code": "M79.3", "description": "Panniculitis, unspecified", "category": "Musculoskeletal", "subcategory": "Soft tissue", "usage_count": 30, "common_in_india": False},
    {"code": "M54.5", "description": "Low back pain", "category": "Musculoskeletal", "subcategory": "Spine", "usage_count": 140, "common_in_india": True},
    {"code": "M17.9", "description": "Osteoarthritis of knee, unspecified", "category": "Musculoskeletal", "subcategory": "Joint", "usage_count": 80, "common_in_india": True},
    
    # Skin conditions
    {"code": "L30.9", "description": "Dermatitis, unspecified", "category": "Skin", "subcategory": "Dermatitis", "usage_count": 70, "common_in_india": True},
    {"code": "L20.9", "description": "Atopic dermatitis, unspecified", "category": "Skin", "subcategory": "Dermatitis", "usage_count": 50, "common_in_india": True},
    {"code": "B35.9", "description": "Dermatophytosis, unspecified", "category": "Skin", "subcategory": "Fungal", "usage_count": 60, "common_in_india": True},
    {"code": "L70.0", "description": "Acne vulgaris", "category": "Skin", "subcategory": "Acne", "usage_count": 80, "common_in_india": True},
    
    # Pregnancy-related (India has high birth rate)
    {"code": "O80", "description": "Encounter for full-term uncomplicated delivery", "category": "Pregnancy", "subcategory": "Normal", "usage_count": 100, "common_in_india": True},
    {"code": "O14.9", "description": "Pre-eclampsia, unspecified", "category": "Pregnancy", "subcategory": "Complications", "usage_count": 40, "common_in_india": True},
    {"code": "O24.919", "description": "Gestational diabetes mellitus, unspecified control", "category": "Pregnancy", "subcategory": "Complications", "usage_count": 50, "common_in_india": True},
    
    # Nutritional deficiencies
    {"code": "E55.9", "description": "Vitamin D deficiency, unspecified", "category": "Endocrine", "subcategory": "Nutritional", "usage_count": 90, "common_in_india": True},
    {"code": "E61.7", "description": "Deficiency of multiple nutrient elements", "category": "Endocrine", "subcategory": "Nutritional", "usage_count": 60, "common_in_india": True},
    {"code": "E46", "description": "Unspecified protein-energy malnutrition", "category": "Endocrine", "subcategory": "Nutritional", "usage_count": 40, "common_in_india": True},
    
    # Thyroid disorders
    {"code": "E03.9", "description": "Hypothyroidism, unspecified", "category": "Endocrine", "subcategory": "Thyroid", "usage_count": 100, "common_in_india": True},
    {"code": "E05.90", "description": "Thyrotoxicosis, unspecified without thyrotoxic crisis", "category": "Endocrine", "subcategory": "Thyroid", "usage_count": 50, "common_in_india": True},
    {"code": "E04.9", "description": "Nontoxic goiter, unspecified", "category": "Endocrine", "subcategory": "Thyroid", "usage_count": 40, "common_in_india": True},
    
    # Mental health
    {"code": "F41.9", "description": "Anxiety disorder, unspecified", "category": "Mental", "subcategory": "Anxiety", "usage_count": 90, "common_in_india": True},
    {"code": "F32.9", "description": "Major depressive disorder, single episode, unspecified", "category": "Mental", "subcategory": "Depression", "usage_count": 80, "common_in_india": True},
    {"code": "F33.9", "description": "Major depressive disorder, recurrent, unspecified", "category": "Mental", "subcategory": "Depression", "usage_count": 60, "common_in_india": True},
    {"code": "F10.20", "description": "Alcohol dependence, uncomplicated", "category": "Mental", "subcategory": "Substance use", "usage_count": 40, "common_in_india": True},
    
    # Eye conditions
    {"code": "H52.4", "description": "Presbyopia", "category": "Eye", "subcategory": "Refraction", "usage_count": 70, "common_in_india": True},
    {"code": "H52.13", "description": "Myopia, bilateral", "category": "Eye", "subcategory": "Refraction", "usage_count": 80, "common_in_india": True},
    {"code": "H10.9", "description": "Conjunctivitis, unspecified", "category": "Eye", "subcategory": "External", "usage_count": 90, "common_in_india": True},
    {"code": "H26.9", "description": "Unspecified cataract", "category": "Eye", "subcategory": "Lens", "usage_count": 60, "common_in_india": True},
    
    # ENT conditions
    {"code": "H66.90", "description": "Otitis media, unspecified, unspecified ear", "category": "Ear", "subcategory": "Infection", "usage_count": 70, "common_in_india": True},
    {"code": "J34.2", "description": "Deviated nasal septum", "category": "Respiratory", "subcategory": "Nose", "usage_count": 40, "common_in_india": True},
    {"code": "J02.9", "description": "Acute pharyngitis, unspecified", "category": "Respiratory", "subcategory": "Throat", "usage_count": 120, "common_in_india": True},
    {"code": "J03.90", "description": "Acute tonsillitis, unspecified", "category": "Respiratory", "subcategory": "Throat", "usage_count": 80, "common_in_india": True},
    
    # Injury & trauma
    {"code": "S06.9X0A", "description": "Unspecified intracranial injury without loss of consciousness, initial", "category": "Injury", "subcategory": "Head", "usage_count": 30, "common_in_india": False},
    {"code": "S72.90XA", "description": "Unspecified fracture of unspecified femur, initial encounter", "category": "Injury", "subcategory": "Fracture", "usage_count": 20, "common_in_india": False},
    {"code": "T14.90", "description": "Injury, unspecified", "category": "Injury", "subcategory": "Unspecified", "usage_count": 50, "common_in_india": True},
    
    # Cancer (common types in India)
    {"code": "C50.919", "description": "Malignant neoplasm of unspecified site of unspecified female breast", "category": "Neoplasm", "subcategory": "Breast", "usage_count": 30, "common_in_india": True},
    {"code": "C34.90", "description": "Malignant neoplasm of unspecified part of unspecified bronchus or lung", "category": "Neoplasm", "subcategory": "Lung", "usage_count": 25, "common_in_india": True},
    {"code": "C53.9", "description": "Malignant neoplasm of cervix uteri, unspecified", "category": "Neoplasm", "subcategory": "Cervix", "usage_count": 20, "common_in_india": True},
    {"code": "C16.9", "description": "Malignant neoplasm of stomach, unspecified", "category": "Neoplasm", "subcategory": "GI", "usage_count": 15, "common_in_india": True},
    
    # Common symptoms
    {"code": "R10.9", "description": "Unspecified abdominal pain", "category": "Symptoms", "subcategory": "Abdominal", "usage_count": 150, "common_in_india": True},
    {"code": "R51", "description": "Headache", "category": "Symptoms", "subcategory": "Head", "usage_count": 180, "common_in_india": True},
    {"code": "R05", "description": "Cough", "category": "Symptoms", "subcategory": "Respiratory", "usage_count": 160, "common_in_india": True},
    {"code": "R11.0", "description": "Nausea", "category": "Symptoms", "subcategory": "GI", "usage_count": 120, "common_in_india": True},
    {"code": "R42", "description": "Dizziness and giddiness", "category": "Symptoms", "subcategory": "Neurological", "usage_count": 100, "common_in_india": True},
    {"code": "R53.83", "description": "Other fatigue", "category": "Symptoms", "subcategory": "General", "usage_count": 130, "common_in_india": True},
]


async def seed_icd10_codes():
    """Seed ICD-10 codes into database"""
    async with AsyncSessionLocal() as db:
        try:
            print("🌱 Starting ICD-10 codes seeding...")
            
            # Check if codes already exist
            result = await db.execute(select(ICD10Code).limit(1))
            existing = result.scalars().first()
            
            if existing:
                print("⚠️  ICD-10 codes already exist. Skipping seed.")
                print(f"   Found code: {existing.code}")
                return
            
            # Insert codes
            codes_inserted = 0
            for code_data in ICD10_SEED_DATA:
                # Create search text (lowercase for case-insensitive search)
                search_text = f"{code_data['code']} {code_data['description']} {code_data['category']} {code_data['subcategory']}".lower()
                
                icd10_code = ICD10Code(
                    code=code_data["code"],
                    description=code_data["description"],
                    category=code_data["category"],
                    subcategory=code_data["subcategory"],
                    search_text=search_text,
                    usage_count=code_data["usage_count"],
                    common_in_india=code_data["common_in_india"]
                )
                db.add(icd10_code)
                codes_inserted += 1
            
            await db.commit()
            
            print(f"✅ Successfully seeded {codes_inserted} ICD-10 codes")
            
            # Show statistics
            common_count = sum(1 for c in ICD10_SEED_DATA if c["common_in_india"])
            print(f"   - Common in India: {common_count}")
            print(f"   - Others: {codes_inserted - common_count}")
            
            # Show top categories
            from collections import Counter
            categories = Counter(c["category"] for c in ICD10_SEED_DATA)
            print("\n📊 Categories breakdown:")
            for category, count in categories.most_common(10):
                print(f"   - {category}: {count} codes")
            
        except Exception as e:
            print(f"❌ Error seeding ICD-10 codes: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    print("=" * 60)
    print("ICD-10 Codes Seed Script")
    print("=" * 60)
    asyncio.run(seed_icd10_codes())
    print("=" * 60)
