#!/usr/bin/env python3
"""
Database Seed Script
====================

Creates initial users with properly hashed passwords.
Run this after migrations to populate the database with test data.

Usage:
    python seed_data.py [--reset]
    
Options:
    --reset    Delete existing data before seeding
"""

import sys
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import app modules
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import UserRole

# Database URL - Convert async URL to sync
DATABASE_URL = settings.DATABASE_URL.replace("+asyncpg", "").replace("postgresql://", "postgresql+psycopg2://")

def seed_users(session):
    """Create initial users with hashed passwords"""
    
    users_data = [
        {
            'username': 'admin',
            'email': 'admin@example.com',
            'full_name': 'System Administrator',
            'role': 'ADMIN',
            'password': 'admin123'
        },
        {
            'username': 'dr_sharma',
            'email': 'dr.sharma@example.com',
            'full_name': 'Dr. Rajesh Sharma',
            'role': 'DOCTOR',
            'password': 'doctor123'
        },
        {
            'username': 'nurse_priya',
            'email': 'nurse.priya@example.com',
            'full_name': 'Priya Singh',
            'role': 'NURSE',
            'password': 'nurse123'
        },
        {
            'username': 'reception',
            'email': 'reception@example.com',
            'full_name': 'Reception Desk',
            'role': 'RECEPTIONIST',
            'password': 'reception123'
        }
    ]
    
    print("🔐 Seeding users...")
    
    for user_data in users_data:
        # Check if user already exists
        result = session.execute(
            text("SELECT id FROM users WHERE username = :username"),
            {"username": user_data['username']}
        )
        existing = result.fetchone()
        
        if existing:
            # Update password for existing user
            password_hash = get_password_hash(user_data['password'])
            session.execute(
                text("""
                    UPDATE users 
                    SET password_hash = :password_hash,
                        email = :email,
                        full_name = :full_name,
                        role = :role,
                        is_active = true,
                        updated_at = NOW()
                    WHERE username = :username
                """),
                {
                    "username": user_data['username'],
                    "password_hash": password_hash,
                    "email": user_data['email'],
                    "full_name": user_data['full_name'],
                    "role": user_data['role']
                }
            )
            print(f"   ✅ Updated: {user_data['username']} ({user_data['role']}) - Password: {user_data['password']}")
        else:
            # Create new user
            password_hash = get_password_hash(user_data['password'])
            user_id = str(uuid.uuid4())
            session.execute(
                text("""
                    INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, is_deleted)
                    VALUES (:id, :username, :email, :password_hash, :full_name, :role, true, false)
                """),
                {
                    "id": user_id,
                    "username": user_data['username'],
                    "email": user_data['email'],
                    "password_hash": password_hash,
                    "full_name": user_data['full_name'],
                    "role": user_data['role']
                }
            )
            print(f"   ✅ Created: {user_data['username']} ({user_data['role']}) - Password: {user_data['password']}")
    
    session.commit()
    print(f"\n✅ Successfully seeded {len(users_data)} users")


def seed_patients(session):
    """Create sample patients"""
    
    patients_data = [
        {
            'mrn': 'CLI-2026-00001',
            'first_name': 'Ramesh',
            'last_name': 'Kumar',
            'date_of_birth': '1985-05-15',
            'gender': 'male',
            'phone': '9876543210',
            'email': 'ramesh.kumar@example.com',
            'blood_group': 'O+',
            'city': 'Mumbai',
            'state': 'Maharashtra'
        },
        {
            'mrn': 'CLI-2026-00002',
            'first_name': 'Priya',
            'last_name': 'Sharma',
            'date_of_birth': '1990-08-22',
            'gender': 'female',
            'phone': '9876543211',
            'email': 'priya.sharma@example.com',
            'blood_group': 'A+',
            'city': 'Delhi',
            'state': 'Delhi'
        },
        {
            'mrn': 'CLI-2026-00003',
            'first_name': 'Suresh',
            'last_name': 'Patel',
            'date_of_birth': '1975-12-10',
            'gender': 'male',
            'phone': '9876543212',
            'email': 'suresh.patel@example.com',
            'blood_group': 'B+',
            'city': 'Ahmedabad',
            'state': 'Gujarat'
        }
    ]
    
    print("\n👥 Seeding patients...")
    
    for patient_data in patients_data:
        # Check if patient already exists
        result = session.execute(
            text("SELECT id FROM patients WHERE mrn = :mrn"),
            {"mrn": patient_data['mrn']}
        )
        existing = result.fetchone()
        
        if not existing:
            patient_id = str(uuid.uuid4())
            session.execute(
                text("""
                    INSERT INTO patients 
                    (id, mrn, first_name, last_name, date_of_birth, gender, phone, email, blood_group, city, state, is_deleted)
                    VALUES (:id, :mrn, :first_name, :last_name, :date_of_birth, :gender, :phone, :email, :blood_group, :city, :state, false)
                """),
                {**patient_data, "id": patient_id}
            )
            print(f"   ✅ Created: {patient_data['first_name']} {patient_data['last_name']} ({patient_data['mrn']})")
        else:
            print(f"   ⏭️  Skipped: {patient_data['first_name']} {patient_data['last_name']} (already exists)")
    
    session.commit()
    print(f"✅ Successfully seeded patients")


def seed_visits(session):
    """Create sample visits for patients"""
    from datetime import datetime, timedelta
    
    print("\n🏥 Seeding visits...")
    
    # Get patient IDs
    patients = session.execute(text("SELECT id, mrn FROM patients ORDER BY mrn")).fetchall()
    users = session.execute(text("SELECT id, username FROM users WHERE role = 'DOCTOR'")).fetchall()
    
    if not patients or not users:
        print("   ⚠️  No patients or doctors found, skipping visits")
        return
    
    doctor_id = users[0][0]  # Use first doctor
    
    visits_data = [
        {
            'patient_id': patients[0][0],
            'visit_type': 'consultation',
            'visit_date': (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'),
            'status': 'completed',
            'chief_complaint': 'Fever and body ache for 3 days',
            'assigned_doctor_id': doctor_id
        },
        {
            'patient_id': patients[0][0],
            'visit_type': 'follow_up',
            'visit_date': (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'),
            'status': 'completed',
            'chief_complaint': 'Follow-up visit, feeling better',
            'assigned_doctor_id': doctor_id
        },
        {
            'patient_id': patients[1][0] if len(patients) > 1 else patients[0][0],
            'visit_type': 'consultation',
            'visit_date': (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d'),
            'status': 'completed',
            'chief_complaint': 'Chest pain and breathing difficulty',
            'assigned_doctor_id': doctor_id
        },
        {
            'patient_id': patients[2][0] if len(patients) > 2 else patients[0][0],
            'visit_type': 'consultation',
            'visit_date': datetime.now().strftime('%Y-%m-%d'),
            'status': 'in_progress',
            'chief_complaint': 'Routine health checkup',
            'assigned_doctor_id': doctor_id
        }
    ]
    
    visit_ids = []
    for visit_data in visits_data:
        result = session.execute(
            text("SELECT id FROM visits WHERE patient_id = :patient_id AND visit_date = :visit_date"),
            {"patient_id": visit_data['patient_id'], "visit_date": visit_data['visit_date']}
        )
        existing = result.fetchone()
        
        if not existing:
            visit_id = str(uuid.uuid4())
            visit_number = f"V{datetime.now().strftime('%Y%m%d')}{len(visit_ids)+1:04d}"
            session.execute(
                text("""
                    INSERT INTO visits 
                    (id, visit_number, patient_id, visit_type, visit_date, status, chief_complaint, assigned_doctor_id, is_deleted)
                    VALUES (:id, :visit_number, :patient_id, :visit_type, :visit_date, :status, :chief_complaint, :assigned_doctor_id, false)
                """),
                {**visit_data, "id": visit_id, "visit_number": visit_number}
            )
            visit_ids.append(visit_id)
            print(f"   ✅ Created visit for {visit_data['chief_complaint'][:30]}...")
        else:
            visit_ids.append(existing[0])
            print(f"   ⏭️  Skipped: Visit already exists")
    
    session.commit()
    print(f"✅ Successfully seeded {len(visit_ids)} visits")
    return visit_ids


def seed_vitals(session):
    """Create sample vitals for visits"""
    import random
    
    print("\n💓 Seeding vitals...")
    
    # Get visit IDs
    visits = session.execute(text("SELECT id, patient_id FROM visits WHERE status IN ('completed', 'in_progress')")).fetchall()
    users = session.execute(text("SELECT id FROM users WHERE role = 'DOCTOR' LIMIT 1")).fetchall()
    
    if not visits or not users:
        print("   ⚠️  No visits found, skipping vitals")
        return
    
    doctor_id = users[0][0]
    
    vitals_data = [
        {
            'visit_id': visits[0][0],
            'patient_id': visits[0][1],
            'recorded_by': doctor_id,
            'temperature': 98.6,
            'bp_systolic': 120,
            'bp_diastolic': 80,
            'pulse': 72,
            'respiratory_rate': 16,
            'spo2': 98,
            'weight_kg': 70.5,
            'height_cm': 175
        },
        {
            'visit_id': visits[1][0] if len(visits) > 1 else visits[0][0],
            'patient_id': visits[1][1] if len(visits) > 1 else visits[0][1],
            'recorded_by': doctor_id,
            'temperature': 99.2,
            'bp_systolic': 130,
            'bp_diastolic': 85,
            'pulse': 78,
            'respiratory_rate': 18,
            'spo2': 97,
            'weight_kg': 68.2,
            'height_cm': 165
        },
        {
            'visit_id': visits[2][0] if len(visits) > 2 else visits[0][0],
            'patient_id': visits[2][1] if len(visits) > 2 else visits[0][1],
            'recorded_by': doctor_id,
            'temperature': 98.4,
            'bp_systolic': 125,
            'bp_diastolic': 82,
            'pulse': 75,
            'respiratory_rate': 16,
            'spo2': 99,
            'weight_kg': 85.0,
            'height_cm': 180
        }
    ]
    
    for vital_data in vitals_data:
        result = session.execute(
            text("SELECT id FROM vitals WHERE visit_id = :visit_id"),
            {"visit_id": vital_data['visit_id']}
        )
        existing = result.fetchone()
        
        if not existing:
            vital_id = str(uuid.uuid4())
            session.execute(
                text("""
                    INSERT INTO vitals 
                    (id, visit_id, patient_id, recorded_by, temperature, bp_systolic, bp_diastolic, 
                     pulse, respiratory_rate, spo2, weight_kg, height_cm, is_deleted)
                    VALUES (:id, :visit_id, :patient_id, :recorded_by, :temperature, :bp_systolic, :bp_diastolic,
                            :pulse, :respiratory_rate, :spo2, :weight_kg, :height_cm, false)
                """),
                {**vital_data, "id": vital_id}
            )
            print(f"   ✅ Created vitals: BP {vital_data['bp_systolic']}/{vital_data['bp_diastolic']}, HR {vital_data['pulse']}")
        else:
            print(f"   ⏭️  Skipped: Vitals already exist for visit")
    
    session.commit()
    print(f"✅ Successfully seeded vitals")


def seed_diagnoses(session):
    """Create sample diagnoses"""
    
    print("\n🩺 Seeding diagnoses...")
    
    # Get visit IDs and ICD codes
    visits = session.execute(text("SELECT id, patient_id FROM visits WHERE status IN ('completed', 'in_progress')")).fetchall()
    icd_codes = session.execute(text("SELECT code, description FROM icd10_codes LIMIT 5")).fetchall()
    users = session.execute(text("SELECT id FROM users WHERE role = 'DOCTOR' LIMIT 1")).fetchall()
    
    if not visits:
        print("   ⚠️  No visits found, skipping diagnoses")
        return
    
    if not icd_codes:
        print("   ⚠️  No ICD-10 codes found, skipping diagnoses")
        return
    
    if not users:
        print("   ⚠️  No doctors found, skipping diagnoses")
        return
    
    doctor_id = users[0][0]
    
    diagnoses_data = [
        {
            'visit_id': visits[0][0],
            'patient_id': visits[0][1],
            'diagnosed_by': doctor_id,
            'icd10_code': icd_codes[0][0],
            'diagnosis_description': icd_codes[0][1],
            'diagnosis_type': 'primary',
            'status': 'confirmed',
            'notes': 'Patient presents with viral fever, prescribed rest and antipyretics'
        },
        {
            'visit_id': visits[1][0] if len(visits) > 1 else visits[0][0],
            'patient_id': visits[1][1] if len(visits) > 1 else visits[0][1],
            'diagnosed_by': doctor_id,
            'icd10_code': icd_codes[1][0] if len(icd_codes) > 1 else icd_codes[0][0],
            'diagnosis_description': icd_codes[1][1] if len(icd_codes) > 1 else icd_codes[0][1],
            'diagnosis_type': 'primary',
            'status': 'confirmed',
            'notes': 'Chest pain evaluation, ECG normal, likely muscular pain'
        },
        {
            'visit_id': visits[2][0] if len(visits) > 2 else visits[0][0],
            'patient_id': visits[2][1] if len(visits) > 2 else visits[0][1],
            'diagnosed_by': doctor_id,
            'icd10_code': icd_codes[2][0] if len(icd_codes) > 2 else icd_codes[0][0],
            'diagnosis_description': icd_codes[2][1] if len(icd_codes) > 2 else icd_codes[0][1],
            'diagnosis_type': 'primary',
            'status': 'provisional',
            'notes': 'Routine checkup, all parameters within normal limits'
        }
    ]
    
    for diag_data in diagnoses_data:
        result = session.execute(
            text("SELECT id FROM diagnoses WHERE visit_id = :visit_id AND icd10_code = :icd10_code"),
            {"visit_id": diag_data['visit_id'], "icd10_code": diag_data['icd10_code']}
        )
        existing = result.fetchone()
        
        if not existing:
            diag_id = str(uuid.uuid4())
            session.execute(
                text("""
                    INSERT INTO diagnoses 
                    (id, visit_id, patient_id, diagnosed_by, icd10_code, diagnosis_description, diagnosis_type, status, notes, is_deleted)
                    VALUES (:id, :visit_id, :patient_id, :diagnosed_by, :icd10_code, :diagnosis_description, :diagnosis_type, :status, :notes, false)
                """),
                {**diag_data, "id": diag_id}
            )
            print(f"   ✅ Created diagnosis: {diag_data['diagnosis_type']} - {diag_data['status']}")
        else:
            print(f"   ⏭️  Skipped: Diagnosis already exists")
    
    session.commit()
    print(f"✅ Successfully seeded diagnoses")


def seed_clinical_notes(session):
    """Create sample clinical notes"""
    
    print("\n📝 Seeding clinical notes...")
    
    # Get visit IDs and user IDs
    visits = session.execute(text("SELECT id FROM visits WHERE status IN ('completed', 'in_progress')")).fetchall()
    users = session.execute(text("SELECT id FROM users WHERE role = 'DOCTOR' LIMIT 1")).fetchall()
    
    if not visits or not users:
        print("   ⚠️  No visits or doctors found, skipping clinical notes")
        return
    
    doctor_id = users[0][0]
    
    notes_data = [
        {
            'visit_id': visits[0][0],
            'note_type': 'PROGRESS',
            'content': '''Patient History:
- Fever (102°F) for 3 days
- Body ache and headache
- No cough or breathing difficulty
- No recent travel history

Physical Examination:
- Temperature: 101.8°F
- BP: 120/80 mmHg
- Chest: Clear
- Throat: Mild congestion

Assessment:
Viral fever (likely influenza)

Plan:
1. Rest and hydration
2. Paracetamol 500mg TDS for fever
3. Follow-up if symptoms persist beyond 5 days
''',
            'created_by': doctor_id
        },
        {
            'visit_id': visits[1][0] if len(visits) > 1 else visits[0][0],
            'note_type': 'PROGRESS',
            'content': '''Chief Complaint:
Chest pain and breathing difficulty since yesterday

History:
- Sharp chest pain, worse with deep breathing
- No radiation to arms or jaw
- No previous cardiac history
- Non-smoker

Examination:
- Vitals: BP 130/85, HR 78, SpO2 97%
- Chest wall tenderness present
- Heart sounds: Normal
- Lung sounds: Clear bilaterally

Investigations:
- ECG: Normal sinus rhythm, no ST changes
- Chest X-ray: Advised

Impression:
Costochondritis (chest wall pain)

Management:
1. NSAIDs for pain relief
2. Chest X-ray to rule out pulmonary causes
3. Avoid strenuous activities
4. Review in 3 days
''',
            'created_by': doctor_id
        },
        {
            'visit_id': visits[2][0] if len(visits) > 2 else visits[0][0],
            'note_type': 'CONSULTATION',
            'content': '''Routine Health Checkup

Vitals:
- BP: 125/82 mmHg
- Heart Rate: 75 bpm
- Temperature: 98.4°F
- SpO2: 99%

General Examination:
- Alert and oriented
- No pallor, icterus, or edema
- Cardiovascular: S1, S2 normal
- Respiratory: NVBS, no added sounds
- Abdomen: Soft, non-tender

Advice:
1. Blood tests: CBC, Lipid profile, Blood sugar, Kidney & Liver function
2. Maintain healthy diet
3. Regular exercise
4. Review with reports
''',
            'created_by': doctor_id
        }
    ]
    
    for note_data in notes_data:
        result = session.execute(
            text("SELECT id FROM clinical_notes WHERE visit_id = :visit_id AND note_type = :note_type"),
            {"visit_id": note_data['visit_id'], "note_type": note_data['note_type']}
        )
        existing = result.fetchone()
        
        if not existing:
            note_id = str(uuid.uuid4())
            session.execute(
                text("""
                    INSERT INTO clinical_notes 
                    (id, visit_id, note_type, content, created_by, is_deleted)
                    VALUES (:id, :visit_id, :note_type, :content, :created_by, false)
                """),
                {**note_data, "id": note_id}
            )
            print(f"   ✅ Created {note_data['note_type']} note")
        else:
            print(f"   ⏭️  Skipped: Note already exists")
    
    session.commit()
    print(f"✅ Successfully seeded clinical notes")


def main():
    """Main seeding function"""
    
    reset_data = '--reset' in sys.argv
    
    print("=" * 60)
    print("🌱 EHR Database Seeding")
    print("=" * 60)
    
    # Create engine and session
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Reset data if requested
        if reset_data:
            print("\n⚠️  Resetting data...")
            session.execute(text("TRUNCATE TABLE visits, patients, users RESTART IDENTITY CASCADE"))
            session.commit()
            print("✅ Data reset complete\n")
        
        # Seed data
        seed_users(session)
        seed_patients(session)
        seed_visits(session)
        seed_vitals(session)
        seed_diagnoses(session)
        # seed_clinical_notes(session)  # Table doesn't exist yet
        
        print("\n" + "=" * 60)
        print("✅ Database seeding completed successfully!")
        print("=" * 60)
        print("\n📝 Login Credentials:")
        print("   Admin:        admin / admin123")
        print("   Doctor:       dr_sharma / doctor123")
        print("   Nurse:        nurse_priya / nurse123")
        print("   Receptionist: reception / reception123")
        print("\n📊 Seeded Data:")
        print("   Users: 4, Patients: 3, Visits: 4")
        print("   Vitals: 3, Diagnoses: 3")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        session.rollback()
        sys.exit(1)
    finally:
        session.close()
        engine.dispose()


if __name__ == "__main__":
    main()
