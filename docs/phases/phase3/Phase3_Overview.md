# Phase 3: Clinical Documentation

**Phase:** 3  
**Estimated Time:** 4-5 weeks  
**Prerequisites:** Phase 2 Complete

---

## 1. Overview

Implement comprehensive clinical documentation including vitals recording, diagnosis management with ICD-10 codes, clinical notes, and prescription management.

---

## 2. Objectives

- Record patient vitals during visit
- Document diagnosis with ICD-10 codes
- Capture clinical notes and observations
- Create and manage prescriptions
- Generate clinical summaries
- Support clinical workflows for doctors

---

## 3. Key Features

### 3.1 Vitals Recording
- Blood Pressure (Systolic/Diastolic)
- Pulse Rate (BPM)
- Temperature (°C/°F)
- Respiratory Rate
- SpO2 (Oxygen Saturation)
- Height, Weight, BMI calculation
- Blood Sugar (Random/Fasting)
- Timestamp and recorded by nurse
- Vitals history graph

### 3.2 Diagnosis Management
- ICD-10 code search and selection
- Primary vs Secondary diagnosis
- Diagnosis description
- Diagnosis date
- Provisional vs Confirmed
- Multiple diagnoses per visit
- Diagnosis history per patient

### 3.3 Clinical Notes
- Chief Complaint
- History of Present Illness (HPI)
- Past Medical History
- Review of Systems
- Physical Examination
- Assessment and Plan
- Doctor's notes with timestamps
- Templates for common conditions

### 3.4 Prescriptions (Optional in this phase)
- Medicine name and dosage
- Frequency and duration
- Instructions
- Print prescription
- Prescription history

---

## 4. Sub-Phases

### Phase 3A: Vitals Module (1-1.5 weeks)

#### Backend
- Vitals SQLAlchemy model
- Vitals schemas (create, update, response)
- Vitals service (CRUD operations)
- Vitals endpoints
- Database migration

#### Frontend
- VitalsForm.tsx - Record vitals
- VitalsDisplay.tsx - Show current vitals
- VitalsHistory.tsx - Graph/table of vitals over time
- vitalsService.ts - API integration
- useVitals.ts - React Query hooks

#### Features
- Quick vitals entry form
- Auto-calculate BMI
- Validate ranges (alerts for abnormal values)
- Vitals timeline visualization
- Print vitals summary

---

### Phase 3B: Diagnosis Module (1.5-2 weeks)

#### Backend
- Diagnosis SQLAlchemy model
- ICD10Code reference table
- Diagnosis schemas
- ICD-10 code search service
- Diagnosis service (add, update, list)
- Diagnosis endpoints
- Database migration with ICD-10 seed data

#### Frontend
- DiagnosisForm.tsx - Add diagnosis
- ICD10SearchModal.tsx - Search ICD-10 codes
- DiagnosisList.tsx - Show visit diagnoses
- DiagnosisHistory.tsx - Patient diagnosis history
- diagnosisService.ts - API integration
- useICD10.ts - ICD-10 search hooks
- useDiagnosis.ts - Diagnosis management hooks

#### Features
- Autocomplete ICD-10 code search
- Save common diagnoses as favorites
- Drag to reorder (primary/secondary)
- Diagnosis with severity level
- Link symptoms to diagnosis

---

### Phase 3C: Clinical Notes (1-1.5 weeks)

#### Backend
- ClinicalNote SQLAlchemy model
- Note schemas
- Note service (create, update, list)
- Note templates
- Note endpoints
- Database migration

#### Frontend
- ClinicalNoteEditor.tsx - Rich text editor
- NoteTemplates.tsx - Pre-filled templates
- NotesHistory.tsx - Previous visit notes
- noteService.ts - API integration
- useNotes.ts - React Query hooks

#### Features
- Rich text editor with formatting
- SOAP note template
- Voice-to-text (future)
- Auto-save drafts
- Lock notes after submission
- Print clinical summary

---

## 5. Data Models

### 5.1 Vitals Model

```python
class Vital(BaseModel):
    __tablename__ = "vitals"
    
    # Relationships
    visit_id = UUID  # FK to visits
    patient_id = UUID  # FK to patients
    recorded_by = UUID  # FK to users (nurse)
    
    # Vital Signs
    blood_pressure_systolic = Integer  # mmHg
    blood_pressure_diastolic = Integer  # mmHg
    pulse_rate = Integer  # BPM
    temperature = Float  # °C
    respiratory_rate = Integer  # breaths/min
    spo2 = Integer  # %
    
    # Body Measurements
    height = Float  # cm
    weight = Float  # kg
    bmi = Float  # auto-calculated
    
    # Blood Sugar
    blood_sugar = Float  # mg/dL
    blood_sugar_type = String  # random, fasting, pp
    
    # Metadata
    recorded_at = DateTime
    notes = Text
```

### 5.2 Diagnosis Model

```python
class Diagnosis(BaseModel):
    __tablename__ = "diagnoses"
    
    # Relationships
    visit_id = UUID  # FK to visits
    patient_id = UUID  # FK to patients
    diagnosed_by = UUID  # FK to users (doctor)
    
    # Diagnosis Information
    icd10_code = String(10)  # FK to icd10_codes
    diagnosis_description = Text
    diagnosis_type = String  # primary, secondary
    status = String  # provisional, confirmed
    severity = String  # mild, moderate, severe
    
    # Dates
    diagnosed_date = Date
    onset_date = Date
    
    # Notes
    clinical_notes = Text
```

### 5.3 ICD10 Code Model

```python
class ICD10Code(BaseModel):
    __tablename__ = "icd10_codes"
    
    code = String(10)  # A00.0
    description = Text  # Cholera due to Vibrio cholerae 01
    category = String  # Chapter (e.g., Infectious diseases)
    
    # Search optimization
    search_text = Text  # For full-text search
```

### 5.4 Clinical Note Model

```python
class ClinicalNote(BaseModel):
    __tablename__ = "clinical_notes"
    
    # Relationships
    visit_id = UUID  # FK to visits
    patient_id = UUID  # FK to patients
    created_by = UUID  # FK to users (doctor)
    
    # SOAP Format
    subjective = Text  # Chief complaint, HPI
    objective = Text  # Physical exam findings
    assessment = Text  # Diagnosis, impression
    plan = Text  # Treatment plan, follow-up
    
    # Additional
    note_type = String  # consultation, follow-up, discharge
    is_locked = Boolean  # Can't edit after lock
    
    # Timestamps
    created_at = DateTime
    updated_at = DateTime
```

---

## 6. API Endpoints

### Vitals Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/vitals | Record vitals |
| GET | /api/v1/vitals/visit/{visit_id} | Get visit vitals |
| GET | /api/v1/vitals/patient/{patient_id} | Patient vitals history |
| PUT | /api/v1/vitals/{id} | Update vitals |

### Diagnosis Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/diagnoses | Add diagnosis |
| GET | /api/v1/diagnoses/visit/{visit_id} | Visit diagnoses |
| GET | /api/v1/diagnoses/patient/{patient_id} | Patient diagnosis history |
| PUT | /api/v1/diagnoses/{id} | Update diagnosis |
| DELETE | /api/v1/diagnoses/{id} | Remove diagnosis |
| GET | /api/v1/icd10/search?q=diabetes | Search ICD-10 codes |

### Clinical Notes Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/notes | Create note |
| GET | /api/v1/notes/visit/{visit_id} | Get visit notes |
| GET | /api/v1/notes/patient/{patient_id} | Patient notes history |
| PUT | /api/v1/notes/{id} | Update note |
| POST | /api/v1/notes/{id}/lock | Lock note (finalize) |

---

## 7. UI Pages & Components

### Visit Detail Page Updates
- Add Vitals tab
- Add Diagnosis tab
- Add Clinical Notes tab
- Show summary of all three

### New Components
- **VitalsCard** - Quick vitals overview
- **VitalsForm** - Multi-field vitals input
- **VitalsChart** - Line graph for vitals over time
- **DiagnosisSelector** - ICD-10 autocomplete
- **DiagnosisTag** - Visual diagnosis display
- **NoteEditor** - Rich text with SOAP sections
- **NoteTemplate** - Pre-filled note templates

### Workflow Integration
1. Visit created (Phase 2)
2. Nurse records vitals → Phase 3A
3. Doctor reviews vitals
4. Doctor adds diagnosis → Phase 3B
5. Doctor writes clinical note → Phase 3C
6. Visit marked complete

---

## 8. ICD-10 Data

### Seed Data Source
- Download ICD-10-CM codes from CDC
- Import into database during migration
- ~70,000 codes total
- Common codes: Diabetes (E11), Hypertension (I10), etc.

### Search Implementation
- Full-text search on code + description
- Autocomplete with debounce
- Show top 20 results
- Filter by category
- Recent/Favorite codes for quick access

---

## 9. Verification Checklist

### Phase 3A Checklist
- [ ] Vitals model and endpoints working
- [ ] Can record vitals for a visit
- [ ] BMI auto-calculates from height/weight
- [ ] Vitals display in visit detail
- [ ] Vitals history shows timeline
- [ ] Abnormal values highlighted
- [ ] Can update recorded vitals

### Phase 3B Checklist
- [ ] Diagnosis model and endpoints working
- [ ] ICD-10 codes seeded in database
- [ ] ICD-10 search returns relevant results
- [ ] Can add diagnosis to visit
- [ ] Primary/secondary diagnosis works
- [ ] Diagnosis history per patient
- [ ] Can update/remove diagnosis

### Phase 3C Checklist
- [ ] Clinical note model and endpoints working
- [ ] Can create note with SOAP format
- [ ] Note templates available
- [ ] Can view previous visit notes
- [ ] Note locking works
- [ ] Auto-save functionality works
- [ ] Can print clinical summary

---

## 10. Testing Scenarios

### Vitals Recording
1. Nurse checks in patient
2. Records vitals: BP 120/80, Pulse 72, Temp 98.6°F
3. Height 170cm, Weight 70kg → BMI 24.2
4. Vitals saved and visible to doctor

### Diagnosis
1. Doctor reviews vitals
2. Searches ICD-10: "Type 2 diabetes"
3. Selects E11.9 - Type 2 diabetes mellitus without complications
4. Marks as Primary, Confirmed
5. Adds clinical note: "Patient presents with elevated blood sugar"

### Clinical Note
1. Doctor opens note editor
2. Selects "Diabetes Consultation" template
3. Fills SOAP sections
4. Locks note
5. Note appears in patient history

---

## 11. Success Criteria

- Vitals recorded in < 2 minutes by nurse
- Doctor can find ICD-10 code in < 10 seconds
- Clinical notes saved automatically (no data loss)
- Complete clinical workflow < 10 minutes per patient
- All clinical data accessible in visit summary
- Print-ready clinical reports

---

## 12. Future Enhancements

- Voice-to-text for clinical notes
- Clinical decision support (based on vitals/diagnosis)
- Integration with lab results
- Prescription management (full module)
- Clinical alerts for critical values
- Vitals trends and analytics
- Mobile app for vitals recording

---

## 13. Next Phase

After Phase 3 completion, proceed to **Phase 4: Imaging Orders**
- Radiology order creation
- Accession number generation
- Order status tracking

---

*End of Phase 3 Overview*
