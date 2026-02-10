#!/usr/bin/env python
"""Test vitals API endpoints"""
import asyncio
import sys
from uuid import UUID
from sqlalchemy import select

sys.path.insert(0, '/home/linuxdev1/PracticeApps/EHRApp/backend')

from app.core.database import AsyncSessionLocal
from app.models.patient import Patient
from app.models.visit import Visit

async def main():
    async with AsyncSessionLocal() as db:
        # Get first patient
        result = await db.execute(select(Patient).limit(1))
        patient = result.scalar_one_or_none()
        
        if patient:
            print(f"✓ Patient ID: {patient.id}")
            print(f"  MRN: {patient.mrn}")
            print(f"  Name: {patient.full_name}")
            
            # Get first visit
            result = await db.execute(select(Visit).where(Visit.patient_id == patient.id).limit(1))
            visit = result.scalar_one_or_none()
            
            if visit:
                print(f"\n✓ Visit ID: {visit.id}")
                print(f"  Number: {visit.visit_number}")
                print(f"  Status: {visit.status.value}")
                
                # Print test data for API
                print(f"\n📋 Test Data:")
                print(f"PATIENT_ID={patient.id}")
                print(f"VISIT_ID={visit.id}")
            else:
                print("\n✗ No visits found")
        else:
            print("✗ No patients found - please seed data")

if __name__ == "__main__":
    asyncio.run(main())
