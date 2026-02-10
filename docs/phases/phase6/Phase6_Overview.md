# Phase 6: Discharge & Clinical Summaries

**Phase:** 6  
**Estimated Time:** 2-3 weeks  
**Prerequisites:** Phase 5 Complete

---

## 1. Overview

Implement discharge workflow including discharge summary generation, follow-up scheduling, visit closure, prescription printing, and comprehensive report generation.

---

## 2. Objectives

- Enable doctors to complete and close visits
- Generate discharge summaries automatically
- Schedule follow-up appointments
- Print prescriptions and clinical reports
- Generate visit summaries
- Complete the OPD clinical workflow
- Prepare data for analytics and reporting

---

## 3. Key Features

### 3.1 Discharge Summary
- Auto-populated from visit data
- Includes vitals, diagnosis, clinical notes
- List of investigations performed
- Treatment summary
- Follow-up instructions
- Doctor's signature
- Print and email capability

### 3.2 Visit Closure
- Mark visit as completed
- Lock clinical data (no further edits)
- Calculate visit duration
- Generate visit summary
- Update patient status
- Archive visit data

### 3.3 Prescription Generation
- Medicine list with dosage
- Duration and instructions
- Refill information
- Pharmacy-ready format
- Print prescription
- Digital prescription (PDF)

### 3.4 Follow-up Management
- Schedule next appointment
- Set follow-up date
- Create follow-up visit
- Reminder notifications (future)
- Follow-up reason/instructions

### 3.5 Report Generation
- Visit summary report
- Discharge summary
- Investigation reports
- Combined clinical report
- Export to PDF
- Email reports to patient

---

## 4. Data Model

### DischargeSummary Model

```python
class DischargeSummary(BaseModel):
    __tablename__ = "discharge_summaries"
    
    # Relationships
    visit_id = UUID  # FK to visits (one-to-one)
    patient_id = UUID  # FK to patients
    created_by = UUID  # FK to users (doctor)
    
    # Visit Information
    admission_date = DateTime  # Visit check-in
    discharge_date = DateTime  # Visit completion
    
    # Clinical Summary
    chief_complaint = Text
    history = Text
    examination_findings = Text
    
    # Vitals Summary
    vitals_summary = JSON  # Key vitals from visit
    
    # Diagnosis
    primary_diagnosis = Text
    secondary_diagnoses = JSON  # List
    icd10_codes = JSON  # List
    
    # Investigations
    investigations_performed = JSON  # List with results
    imaging_studies = JSON  # List with findings
    
    # Treatment Given
    medications = JSON  # List of prescriptions
    procedures = JSON  # Any procedures done
    
    # Discharge Instructions
    discharge_condition = String  # stable, improved, etc.
    advice_on_discharge = Text
    diet_instructions = Text
    activity_restrictions = Text
    warning_signs = Text
    
    # Follow-up
    follow_up_required = Boolean
    follow_up_date = Date
    follow_up_instructions = Text
    
    # Metadata
    generated_at = DateTime
    is_locked = Boolean
    signed_by = UUID  # FK to users (doctor)
    signed_at = DateTime
```

### Prescription Model

```python
class Prescription(BaseModel):
    __tablename__ = "prescriptions"
    
    # Relationships
    visit_id = UUID  # FK to visits
    patient_id = UUID  # FK to patients
    prescribed_by = UUID  # FK to users (doctor)
    
    # Prescription Details
    prescription_number = String(20)  # RX-YYYY-NNNNN
    prescription_date = Date
    
    # Medications (JSON array)
    medications = JSON  # [{ name, dosage, frequency, duration, instructions }]
    
    # Additional Instructions
    general_instructions = Text
    
    # Refill Information
    refills_allowed = Integer
    valid_until = Date
    
    # Status
    status = String  # active, completed, cancelled
    dispensed = Boolean
    dispensed_at = DateTime
    
    # Metadata
    created_at = DateTime
    updated_at = DateTime
```

### FollowUp Model

```python
class FollowUp(BaseModel):
    __tablename__ = "follow_ups"
    
    # Relationships
    visit_id = UUID  # FK to visits (original visit)
    patient_id = UUID  # FK to patients
    scheduled_by = UUID  # FK to users
    
    # Follow-up Details
    follow_up_date = DateTime
    follow_up_type = String  # routine, urgent, post_procedure
    reason = Text
    instructions = Text
    
    # Status
    status = String  # scheduled, completed, cancelled, missed
    
    # Linked Visit
    follow_up_visit_id = UUID  # FK to visits (if follow-up completed)
    
    # Reminders
    reminder_sent = Boolean
    reminder_sent_at = DateTime
    
    # Metadata
    created_at = DateTime
    updated_at = DateTime
```

---

## 5. Implementation Plan

### 5.1 Backend (1-1.5 weeks)

#### Models & Schemas
- DischargeSummary model and schemas
- Prescription model and schemas
- FollowUp model and schemas
- Report generator utilities
- PDF generation service
- Database migrations

#### Services
- DischargeSummaryService
  - Generate summary from visit data
  - Lock/unlock summary
  - Sign summary
  - Get summary by visit
  
- PrescriptionService
  - Create prescription
  - Generate prescription number
  - Get prescriptions by visit/patient
  - Print prescription
  
- FollowUpService
  - Schedule follow-up
  - Create follow-up visit
  - Update follow-up status
  
- ReportService
  - Generate visit summary PDF
  - Generate discharge summary PDF
  - Combine reports
  - Email reports

#### API Endpoints
- POST /api/v1/discharge/summary - Create discharge summary
- GET /api/v1/discharge/summary/visit/{id} - Get summary
- PUT /api/v1/discharge/summary/{id} - Update summary
- POST /api/v1/discharge/summary/{id}/sign - Sign summary
- POST /api/v1/discharge/summary/{id}/pdf - Generate PDF
- POST /api/v1/prescriptions - Create prescription
- GET /api/v1/prescriptions/visit/{id} - Get visit prescriptions
- GET /api/v1/prescriptions/{id}/pdf - Generate prescription PDF
- POST /api/v1/follow-ups - Schedule follow-up
- GET /api/v1/follow-ups/patient/{id} - Patient follow-ups
- PATCH /api/v1/follow-ups/{id}/status - Update status

---

### 5.2 Frontend (1-1.5 weeks)

#### Pages
- **DischargeSummary.tsx** - Discharge summary form
- **PrescriptionForm.tsx** - Create prescription
- **FollowUpSchedule.tsx** - Schedule follow-up
- **VisitSummary.tsx** - Complete visit summary view

#### Components
- **DischargeForm.tsx** - Discharge summary form
- **MedicationList.tsx** - List of medications
- **MedicationForm.tsx** - Add/edit medication
- **FollowUpForm.tsx** - Schedule follow-up form
- **DischargeInstructions.tsx** - Patient instructions
- **PrescriptionPreview.tsx** - Print preview
- **ReportViewer.tsx** - PDF report viewer

#### Services & Hooks
- dischargeService.ts - API calls
- prescriptionService.ts - API calls
- followUpService.ts - API calls
- useDischarge.ts - React Query hooks
- usePrescriptions.ts - React Query hooks
- useFollowUps.ts - React Query hooks

#### Integration
- Add "Complete Visit" button in visit detail
- Add prescription tab in visit detail
- Add follow-up scheduler
- Add print buttons for reports
- Update visit status after discharge

---

## 6. Discharge Workflow

### Step-by-Step Process

1. **Visit in Progress**
   - Doctor completes clinical documentation
   - Vitals recorded
   - Diagnosis added
   - Clinical notes written
   - Investigations ordered/completed

2. **Initiate Discharge**
   - Doctor clicks "Complete Visit"
   - System opens discharge summary form
   - Auto-populates from visit data

3. **Complete Discharge Summary**
   - Review and edit auto-filled data
   - Add discharge instructions
   - Add diet/activity restrictions
   - Add warning signs
   - Specify follow-up requirements

4. **Create Prescription**
   - Add medications
   - Specify dosage, frequency, duration
   - Add general instructions
   - Preview prescription
   - Generate prescription PDF

5. **Schedule Follow-up** (if needed)
   - Set follow-up date
   - Add follow-up reason
   - Add instructions
   - Create follow-up appointment

6. **Finalize and Print**
   - Review complete summary
   - Sign discharge summary
   - Print/Email reports
   - Mark visit as completed
   - Lock clinical data

7. **Visit Closed**
   - Visit status: Completed
   - Discharge summary locked
   - Reports available in history
   - Follow-up scheduled (if applicable)

---

## 7. Discharge Summary Template

### Auto-populated Sections

```
DISCHARGE SUMMARY

Patient: [Name] ([MRN])
Age/Gender: [Age]Y / [Gender]
Visit Date: [Date]
Doctor: [Doctor Name]

CHIEF COMPLAINT:
[Auto-filled from clinical note]

HISTORY OF PRESENT ILLNESS:
[Auto-filled from clinical note]

EXAMINATION FINDINGS:
[Auto-filled from clinical note]

VITALS:
BP: [Systolic]/[Diastolic] mmHg
Pulse: [Rate] bpm
Temperature: [Temp] °C
SpO2: [Value] %
Weight: [Weight] kg
BMI: [BMI]

DIAGNOSIS:
Primary: [Primary Diagnosis] ([ICD-10])
Secondary: [Secondary Diagnoses]

INVESTIGATIONS:
- [Investigation 1]: [Result]
- [Investigation 2]: [Result]
- [Imaging]: [Findings]

TREATMENT GIVEN:
[Medications prescribed]

CONDITION ON DISCHARGE:
[Stable/Improved/...]

ADVICE ON DISCHARGE:
- [Instruction 1]
- [Instruction 2]

DIET:
[Diet instructions]

ACTIVITY:
[Activity restrictions]

WARNING SIGNS:
[Warning signs to watch for]

FOLLOW-UP:
Date: [Follow-up date]
Reason: [Follow-up reason]

Doctor's Signature: _______________
Date: [Date]
```

---

## 8. Prescription Format

```
PRESCRIPTION

[Clinic Logo/Name]
[Address]
[Phone]

Date: [Date]
Prescription No: RX-2026-00001

Patient: [Name]
Age: [Age] Years
MRN: [MRN]

Diagnosis: [Diagnosis]

Rx:

1. [Medicine Name] - [Strength]
   [Dosage] - [Frequency]
   Duration: [Duration]
   Instructions: [Instructions]

2. [Medicine Name] - [Strength]
   [Dosage] - [Frequency]
   Duration: [Duration]
   Instructions: [Instructions]

General Instructions:
[Instructions]

Doctor: [Doctor Name]
Registration No: [Registration]
Signature: _______________
```

---

## 9. API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/discharge/summary | Create discharge summary |
| GET | /api/v1/discharge/summary/visit/{id} | Get discharge summary |
| PUT | /api/v1/discharge/summary/{id} | Update summary |
| POST | /api/v1/discharge/summary/{id}/sign | Sign and lock summary |
| GET | /api/v1/discharge/summary/{id}/pdf | Download summary PDF |
| POST | /api/v1/prescriptions | Create prescription |
| GET | /api/v1/prescriptions/visit/{id} | Get visit prescriptions |
| GET | /api/v1/prescriptions/patient/{id} | Patient prescription history |
| GET | /api/v1/prescriptions/{id}/pdf | Download prescription PDF |
| POST | /api/v1/follow-ups | Schedule follow-up |
| GET | /api/v1/follow-ups/patient/{id} | Patient follow-ups |
| GET | /api/v1/follow-ups/pending | Pending follow-ups |
| PATCH | /api/v1/follow-ups/{id}/status | Update follow-up status |

---

## 10. PDF Generation

### Technology
- **reportlab** or **WeasyPrint** for Python
- HTML → PDF conversion
- Custom templates with clinic branding

### Reports to Generate
1. **Discharge Summary** - Complete clinical summary
2. **Prescription** - Medicine list
3. **Visit Summary** - Brief visit report
4. **Investigation Report** - Lab/imaging results
5. **Combined Report** - All above in one PDF

---

## 11. Verification Checklist

- [ ] Discharge summary model created
- [ ] Prescription model created
- [ ] Follow-up model created
- [ ] Can generate discharge summary from visit
- [ ] Discharge summary auto-populates correctly
- [ ] Can edit and save discharge summary
- [ ] Can create prescription
- [ ] Prescription number auto-generated
- [ ] Can add multiple medications
- [ ] Can schedule follow-up
- [ ] Can sign and lock discharge summary
- [ ] PDF generation works for summary
- [ ] PDF generation works for prescription
- [ ] Visit marked as completed after discharge
- [ ] Clinical data locked after completion
- [ ] Can view historical summaries
- [ ] Can print reports
- [ ] Email functionality works (or placeholder)

---

## 12. Testing Scenarios

### Complete Discharge Flow
1. Create patient and visit
2. Record vitals
3. Add diagnosis
4. Write clinical note
5. Create imaging order (optional)
6. Click "Complete Visit"
7. Review auto-filled discharge summary
8. Edit discharge instructions
9. Add prescription with 3 medicines
10. Schedule follow-up for 1 week
11. Sign discharge summary
12. Download and verify PDF
13. Verify visit status: Completed
14. Try editing locked data (should fail)

### Prescription Test
1. Open visit
2. Go to prescriptions tab
3. Add medication: Paracetamol 500mg, 1-0-1, 5 days
4. Add medication: Amoxicillin 250mg, 1-1-1, 7 days
5. Add general instruction: "Take after meals"
6. Generate prescription
7. Preview prescription PDF
8. Print/download

### Follow-up Test
1. Schedule follow-up for patient
2. Follow-up date: 1 week from today
3. Reason: "Review blood test results"
4. Verify follow-up in patient's follow-up list
5. Mark follow-up as completed
6. Link to new visit

---

## 13. Success Criteria

- Complete discharge process < 5 minutes
- Discharge summary 90% auto-filled
- Prescription generation < 2 minutes
- PDF reports professional quality
- Visit closure prevents further edits
- Follow-up tracking accurate
- Reports accessible from patient history
- System ready for analytics

---

## 14. Future Enhancements

- E-prescription (digital signature)
- SMS/Email prescription to patient
- Drug interaction checking
- Generic medicine suggestions
- Prescription refill reminders
- Follow-up reminders via SMS/Email
- WhatsApp integration for reports
- Voice-to-text for clinical notes
- Multilingual reports
- Custom report templates
- Analytics dashboard

---

## 15. System Completion

After Phase 6, the EHR system will have complete OPD workflow:

### Patient Journey
1. **Registration** (Phase 1) - Patient registered
2. **Visit Creation** (Phase 2) - Visit checked in
3. **Vitals** (Phase 3A) - Vitals recorded
4. **Consultation** (Phase 3B/C) - Diagnosis and notes
5. **Imaging** (Phase 4/5) - Orders and DICOM
6. **Discharge** (Phase 6) - Summary and closure

### Complete Features
✅ Patient Management  
✅ Visit Management  
✅ Vitals Recording  
✅ Clinical Documentation  
✅ Diagnosis with ICD-10  
✅ Imaging Orders  
✅ DICOM Integration  
✅ Image Viewing  
✅ Discharge Summaries  
✅ Prescriptions  
✅ Follow-up Management  
✅ Report Generation  

---

## 16. Post-Phase 6 Roadmap

### Immediate Next Steps
- Performance optimization
- Comprehensive testing
- Security audit
- User training
- Production deployment

### Future Phases
- **Phase 7**: Billing & Insurance
- **Phase 8**: Lab Integration
- **Phase 9**: Pharmacy Integration
- **Phase 10**: Analytics & Reporting
- **Phase 11**: Mobile App
- **Phase 12**: Telemedicine

---

## 17. Final Checklist

- [ ] All Phase 6 features implemented
- [ ] Discharge workflow end-to-end tested
- [ ] All reports generating correctly
- [ ] Data integrity verified
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Documentation complete
- [ ] User guides prepared
- [ ] Ready for production deployment

---

*End of Phase 6 Overview - EHR MVP Complete!*
