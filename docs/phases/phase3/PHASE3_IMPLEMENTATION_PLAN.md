# Phase 3: Clinical Documentation - Implementation Plan

**Status:** Planning  
**Estimated Duration:** 4-5 weeks  
**Prerequisites:** Phase 2 Complete ✅

---

## Overview

Phase 3 adds comprehensive clinical documentation capabilities to support the complete visit workflow:
- **Vitals Recording** - Nurses record patient vital signs
- **Diagnosis Management** - Doctors add diagnoses with ICD-10 codes  
- **Clinical Notes** - Structured SOAP notes and documentation
- **Integration** - Link vitals, diagnoses, and notes to visits

---

## Phase 3 Sub-Phases Structure

Following the established pattern from Phase 1 & 2:
- **A-suffix** = Backend (Models, Services, APIs)
- **B-suffix** = Frontend (Services, Hooks, Components)
- **C-suffix** = Integration & Testing

```
Phase 3A: Vitals Backend       (Week 1)     ✅ Models, APIs, Services
Phase 3B: Vitals Frontend      (Week 1)     ✅ UI Components, Hooks
Phase 3C: Diagnosis Backend    (Week 2)     ✅ Models, ICD-10, APIs
Phase 3D: Diagnosis Frontend   (Week 2)     ✅ Search, UI Components
Phase 3E: Clinical Notes Backend (Week 3)   ✅ Models, APIs, Templates
Phase 3F: Clinical Notes Frontend (Week 3)  ✅ Rich Editor, SOAP UI
Phase 3G: Integration & Testing (Week 4)    ✅ Visit Integration, E2E
```

---

## Phase 3A: Vitals Backend (3-4 days)

### Objectives
Build backend infrastructure for recording and retrieving patient vital signs.

### Deliverables

#### 1. Database Schema
**File:** `backend/alembic/versions/YYYYMMDD_HHMM_create_vitals.py`

```python
# Vitals table with fields:
- id (UUID, PK)
- visit_id (UUID, FK → visits.id)
- patient_id (UUID, FK → patients.id)
- recorded_by (UUID, FK → users.id, Nurse)

# Vital Signs
- blood_pressure_systolic (int, mmHg)
- blood_pressure_diastolic (int, mmHg)
- pulse_rate (int, BPM)
- temperature (float, °C)
- respiratory_rate (int, breaths/min)
- spo2 (int, %)

# Body Measurements
- height (float, cm)
- weight (float, kg)
- bmi (float, auto-calculated)

# Blood Sugar
- blood_sugar (float, mg/dL)
- blood_sugar_type (enum: random, fasting, pp)

# Metadata
- recorded_at (timestamp)
- notes (text, optional)
- created_at, updated_at, is_deleted
```

#### 2. SQLAlchemy Model
**File:** `backend/app/models/vital.py`

```python
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Vital(BaseModel):
    __tablename__ = "vitals"
    
    visit_id = Column(UUID, ForeignKey("visits.id"))
    patient_id = Column(UUID, ForeignKey("patients.id"))
    recorded_by = Column(UUID, ForeignKey("users.id"))
    
    # Vital signs...
    # Relationships
    visit = relationship("Visit", back_populates="vitals")
    patient = relationship("Patient")
    recorder = relationship("User")
```

#### 3. Pydantic Schemas
**File:** `backend/app/schemas/vital.py`

```python
class VitalBase(BaseModel):
    blood_pressure_systolic: Optional[int] = Field(None, ge=60, le=300)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=200)
    pulse_rate: Optional[int] = Field(None, ge=40, le=200)
    temperature: Optional[float] = Field(None, ge=35.0, le=42.0)
    # ... other fields with validation

class VitalCreate(VitalBase):
    visit_id: UUID
    patient_id: UUID

class VitalUpdate(BaseModel):
    # All fields optional for update
    
class VitalResponse(VitalBase):
    id: UUID
    visit_id: UUID
    recorded_by: UUID
    recorded_at: datetime
    bmi: Optional[float]  # Calculated field
```

#### 4. Service Layer
**File:** `backend/app/api/v1/vitals/service.py`

```python
class VitalService:
    @staticmethod
    async def create_vital(db, vital_data, current_user):
        # Validate visit exists
        # Calculate BMI if height/weight provided
        # Create vital record
        # Link to visit
        
    @staticmethod
    async def get_visit_vitals(db, visit_id):
        # Get all vitals for a visit
        
    @staticmethod
    async def get_patient_vitals_history(db, patient_id, limit=10):
        # Get recent vitals with pagination
        # For trending graphs
        
    @staticmethod
    async def update_vital(db, vital_id, vital_data):
        # Update vital (within 1 hour of recording)
        
    @staticmethod
    def calculate_bmi(height_cm, weight_kg):
        # BMI = weight / (height_m)²
```

#### 5. API Endpoints
**File:** `backend/app/api/v1/vitals/router.py`

```python
router = APIRouter()

@router.post("/", response_model=VitalResponse)
async def create_vital(vital_data: VitalCreate, ...):
    """Record patient vitals (Nurse role)"""

@router.get("/visit/{visit_id}", response_model=List[VitalResponse])
async def get_visit_vitals(visit_id: UUID, ...):
    """Get all vitals for a visit"""

@router.get("/patient/{patient_id}", response_model=List[VitalResponse])
async def get_patient_vitals_history(patient_id: UUID, ...):
    """Get patient vitals history for trending"""

@router.put("/{vital_id}", response_model=VitalResponse)
async def update_vital(vital_id: UUID, vital_data: VitalUpdate, ...):
    """Update vitals (within 1 hour)"""

@router.get("/patient/{patient_id}/latest", response_model=VitalResponse)
async def get_latest_vitals(patient_id: UUID, ...):
    """Get most recent vitals"""
```

#### 6. Update API Router
**File:** `backend/app/api/v1/router.py`

```python
from app.api.v1.vitals import router as vitals_router

api_router.include_router(
    vitals_router, 
    prefix="/vitals", 
    tags=["Vitals"]
)
```

#### 7. Update Visit Model
**File:** `backend/app/models/visit.py`

```python
# Add relationship in Visit model
vitals = relationship("Vital", back_populates="visit")
```

### Testing Checklist
- [ ] Migration runs successfully
- [ ] Create vitals via Swagger UI
- [ ] Retrieve visit vitals
- [ ] Retrieve patient vitals history
- [ ] BMI calculation works correctly
- [ ] Validation errors for out-of-range values
- [ ] Role-based access (nurse can create)

### Success Criteria
- ✅ Database schema created with all fields
- ✅ CRUD operations work via API
- ✅ BMI auto-calculation functional
- ✅ Validation prevents invalid data
- ✅ Swagger documentation complete

---

## Phase 3B: Vitals Frontend (3-4 days)

### Objectives
Create UI components for nurses to record vitals and doctors to view vitals history.

### Deliverables

#### 1. TypeScript Types
**File:** `frontend/src/types/vital.ts`

```typescript
export interface Vital {
  id: string;
  visit_id: string;
  patient_id: string;
  recorded_by: string;
  
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  pulse_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  spo2?: number;
  
  height?: number;
  weight?: number;
  bmi?: number;
  
  blood_sugar?: number;
  blood_sugar_type?: 'random' | 'fasting' | 'pp';
  
  recorded_at: string;
  notes?: string;
}

export interface VitalCreateData {
  visit_id: string;
  patient_id: string;
  // ... all vital fields
}
```

#### 2. API Service
**File:** `frontend/src/services/vitalService.ts`

```typescript
class VitalService {
  async createVital(data: VitalCreateData): Promise<Vital>
  async getVisitVitals(visitId: string): Promise<Vital[]>
  async getPatientVitalsHistory(patientId: string): Promise<Vital[]>
  async updateVital(id: string, data: VitalUpdateData): Promise<Vital>
  async getLatestVitals(patientId: string): Promise<Vital | null>
}
```

#### 3. React Query Hooks
**File:** `frontend/src/hooks/useVitals.ts`

```typescript
// Query hooks
export const useVisitVitals = (visitId: string)
export const usePatientVitalsHistory = (patientId: string)
export const useLatestVitals = (patientId: string)

// Mutation hooks
export const useCreateVital = ()
export const useUpdateVital = ()
```

#### 4. Vitals Form Component
**File:** `frontend/src/components/vitals/VitalsForm.tsx`

```typescript
// Quick vitals entry form with:
- BP input (systolic/diastolic)
- Pulse rate input
- Temperature input (with °C/°F toggle)
- Respiratory rate
- SpO2 input
- Height/Weight (auto-calculates BMI)
- Blood sugar (with type selector)
- Notes textarea
- Save & Cancel buttons

// Features:
- Real-time BMI calculation
- Color-coded warnings for abnormal values
- Input validation
- Quick entry mode (tab navigation)
```

#### 5. Vitals Display Component
**File:** `frontend/src/components/vitals/VitalsDisplay.tsx`

```typescript
// Card showing latest vitals with:
- BP: 120/80 mmHg (with status indicator)
- Pulse: 72 BPM
- Temp: 98.6°F
- RR: 16/min
- SpO2: 98%
- BMI: 22.5 (Normal)
- Timestamp and recorded by
- "View History" button
```

#### 6. Vitals History Component
**File:** `frontend/src/components/vitals/VitalsHistory.tsx`

```typescript
// Dual view:
1. Table View - Last 10 vitals records
2. Graph View - Trend lines for:
   - BP (systolic/diastolic)
   - Pulse rate
   - Temperature
   - Weight/BMI

// Using recharts for visualization
```

#### 7. Vitals Chart Component
**File:** `frontend/src/components/vitals/VitalsChart.tsx`

```typescript
// Line chart component showing:
- Time series data
- Multiple metrics (BP, pulse, temp)
- Color-coded lines
- Hover tooltips
- Date range selector
```

#### 8. Update Visit Detail Page
**File:** `frontend/src/pages/visits/VisitDetail.tsx`

```typescript
// Add new tab: "Vitals"
<Tabs>
  <TabPane tab="Overview" key="overview">...</TabPane>
  <TabPane tab="Vitals" key="vitals">
    <VitalsDisplay visitId={visitId} />
    <Button>Record New Vitals</Button>
  </TabPane>
  {/* Existing tabs */}
</Tabs>
```

#### 9. Add Vitals to Patient Detail
**File:** `frontend/src/pages/patients/PatientDetail.tsx`

```typescript
// Add "Latest Vitals" card to overview
<Card title="Latest Vitals">
  <VitalsDisplay patientId={patientId} showLatest />
  <Link to={`/patients/${patientId}/vitals`}>View History</Link>
</Card>
```

### Testing Checklist
- [ ] Form validates input ranges
- [ ] BMI calculates automatically
- [ ] Abnormal values show warnings
- [ ] Vitals save successfully
- [ ] History displays correctly
- [ ] Chart renders with data
- [ ] Responsive on mobile

### Success Criteria
- ✅ Nurses can record vitals quickly (<2 min)
- ✅ BMI auto-calculates accurately
- ✅ Vitals history shows trends
- ✅ Charts visualize data clearly
- ✅ Integrated with Visit Detail page

---

## Phase 3C: Diagnosis Backend (4-5 days)

### Objectives
Build diagnosis management with ICD-10 code search and patient diagnosis history.

### Deliverables

#### 1. ICD-10 Codes Table Migration
**File:** `backend/alembic/versions/YYYYMMDD_HHMM_create_icd10_codes.py`

```python
# ICD10 Codes reference table:
- id (UUID, PK)
- code (VARCHAR(10), unique, e.g., "A00.0")
- description (TEXT, e.g., "Cholera due to Vibrio cholerae 01")
- category (VARCHAR(100), e.g., "Infectious diseases")
- chapter (VARCHAR(50), e.g., "I - Certain infectious")
- search_text (TEXT, generated column for full-text search)

# Seed ~10,000 common ICD-10 codes
# Or provide CSV import script
```

#### 2. Diagnosis Table Migration
**File:** `backend/alembic/versions/YYYYMMDD_HHMM_create_diagnoses.py`

```python
# Diagnoses table:
- id (UUID, PK)
- visit_id (UUID, FK → visits.id)
- patient_id (UUID, FK → patients.id)
- diagnosed_by (UUID, FK → users.id, Doctor)
- icd10_code (VARCHAR(10), NULLABLE, FK → icd10_codes.code)  # OPTIONAL for India
- diagnosis_description (TEXT, REQUIRED)  # Free-text always required
- diagnosis_type (enum: primary, secondary)
- status (enum: provisional, confirmed)
- severity (enum: mild, moderate, severe, critical)
- diagnosed_date (DATE)
- onset_date (DATE, optional)
- clinical_notes (TEXT, optional)
- created_at, updated_at, is_deleted

# Note: ICD-10 code is optional to support Indian providers who don't use coding
# Diagnosis description is always required (either from ICD-10 or free text)
```

#### 3. SQLAlchemy Models
**File:** `backend/app/models/icd10_code.py`

```python
class ICD10Code(Base):
    __tablename__ = "icd10_codes"
    
    code = Column(String(10), unique=True, index=True)
    description = Column(Text)
    category = Column(String(100))
    chapter = Column(String(50))
    search_text = Column(Text)  # For ILIKE search
```

**File:** `backend/app/models/diagnosis.py`

```python
class Diagnosis(BaseModel):
    __tablename__ = "diagnoses"
    
    visit_id = Column(UUID, ForeignKey("visits.id"))
    patient_id = Column(UUID, ForeignKey("patients.id"))
    diagnosed_by = Column(UUID, ForeignKey("users.id"))
    
    # ICD-10 code is OPTIONAL - nullable for Indian providers who don't use coding
    icd10_code = Column(String(10), ForeignKey("icd10_codes.code"), nullable=True)
    
    # Diagnosis description is REQUIRED - either from ICD-10 or free text
    diagnosis_description = Column(Text, nullable=False)
    
    # Enum fields
    diagnosis_type = Column(Enum(DiagnosisType))
    status = Column(Enum(DiagnosisStatus))
    severity = Column(Enum(Severity))
    
    # Relationships
    visit = relationship("Visit", back_populates="diagnoses")
    patient = relationship("Patient")
    doctor = relationship("User")
    icd10 = relationship("ICD10Code")  # Can be None if not coded
```

#### 4. Pydantic Schemas
**File:** `backend/app/schemas/diagnosis.py`

```python
class DiagnosisCreate(BaseModel):
    visit_id: UUID
    patient_id: UUID
    
    # ICD-10 code is OPTIONAL - for providers who use coding
    icd10_code: Optional[str] = Field(None, pattern="^[A-Z][0-9]{2}\.?[0-9]{0,2}$")
    
    # Diagnosis description is REQUIRED - from ICD-10 or free text
    diagnosis_description: str = Field(..., min_length=3, max_length=500)
    
    diagnosis_type: DiagnosisType = DiagnosisType.PRIMARY
    status: DiagnosisStatus = DiagnosisStatus.PROVISIONAL
    severity: Optional[Severity] = None
    clinical_notes: Optional[str] = None
    
    @validator('diagnosis_description')
    def validate_description_or_code(cls, v, values):
        # Ensure we have either ICD-10 code or description
        if not v and not values.get('icd10_code'):
            raise ValueError('Either diagnosis_description or icd10_code must be provided')
        return v

class ICD10SearchResult(BaseModel):
    code: str
    description: str
    category: str
```

#### 5. ICD-10 Search Service (FULLY IMPLEMENTED)
**File:** `backend/app/api/v1/diagnoses/icd10_service.py`

```python
class ICD10Service:
    @staticmethod
    async def search_codes(db, query: str, limit=20):
        """FAST full-text search on ICD-10 codes
        - Searches both code and description
        - Uses PostgreSQL full-text search (tsvector)
        - Ranks results by relevance
        - Returns code, description, category
        - Performance: <100ms for typical queries
        """
        stmt = select(ICD10Code).where(
            ICD10Code.search_text.ilike(f"%{query.lower()}%")
        ).order_by(
            ICD10Code.usage_count.desc(),  # Popular codes first
            ICD10Code.code
        ).limit(limit)
        
    @staticmethod
    async def get_code_details(db, code: str):
        """Get complete ICD-10 code information"""
        # Returns full code details including category, subcategory
        
    @staticmethod
    async def get_popular_codes(db, limit=50, category=None):
        """Get most frequently used diagnoses
        - Based on usage_count field
        - Can filter by category (e.g., only diabetes-related)
        - Used for "quick picks" in UI
        """
        
    @staticmethod
    async def increment_usage(db, code: str):
        """Track code usage for popularity ranking"""
        # Called when diagnosis is created with ICD-10 code
```

#### 6. Diagnosis Service
**File:** `backend/app/api/v1/diagnoses/service.py`

```python
class DiagnosisService:
    @staticmethod
    async def add_diagnosis(db, diagnosis_data, current_user):
        # Validate ICD-10 code exists (if provided)
        # If ICD-10 code provided, auto-fill description from ICD-10 table
        # If no ICD-10 code, use free-text description
        # Only one primary diagnosis per visit
        # Doctor role required
        
    @staticmethod
    async def get_visit_diagnoses(db, visit_id):
        # Get all diagnoses for visit
        # Order: primary first, then secondary
        # Handle both coded and non-coded diagnoses
        
    @staticmethod
    async def get_patient_diagnosis_history(db, patient_id):
        # Patient's diagnosis history
        # With visit dates
        # Show both ICD-10 coded and free-text diagnoses
        
    @staticmethod
    async def update_diagnosis(db, diagnosis_id, diagnosis_data):
        # Update diagnosis details
        # Allow switching between coded and non-coded
        
    @staticmethod
    async def delete_diagnosis(db, diagnosis_id):
        # Soft delete diagnosis
    
    @staticmethod
    async def auto_fill_from_icd10(db, icd10_code):
        # Helper: Get ICD-10 description for auto-fill
        # Returns description if code exists
```

#### 7. API Endpoints
**File:** `backend/app/api/v1/diagnoses/router.py`

```python
router = APIRouter()

# ICD-10 Search
@router.get("/icd10/search")
async def search_icd10_codes(q: str, limit: int = 20, ...):
    """Search ICD-10 codes by keyword"""

@router.get("/icd10/{code}")
async def get_icd10_code(code: str, ...):
    """Get ICD-10 code details"""

# Diagnosis Management
@router.post("/", response_model=DiagnosisResponse)
async def add_diagnosis(diagnosis_data: DiagnosisCreate, ...):
    """Add diagnosis to visit (Doctor only)"""

@router.get("/visit/{visit_id}", response_model=List[DiagnosisResponse])
async def get_visit_diagnoses(visit_id: UUID, ...):
    """Get all diagnoses for a visit"""

@router.get("/patient/{patient_id}", response_model=List[DiagnosisResponse])
async def get_patient_diagnoses(patient_id: UUID, ...):
    """Get patient diagnosis history"""

@router.put("/{diagnosis_id}", response_model=DiagnosisResponse)
async def update_diagnosis(diagnosis_id: UUID, ...):
    """Update diagnosis"""

@router.delete("/{diagnosis_id}")
async def delete_diagnosis(diagnosis_id: UUID, ...):
    """Remove diagnosis from visit"""
```

#### 8. ICD-10 Seed Script (COMPREHENSIVE DATA)
**File:** `backend/scripts/seed_icd10.py`

```python
# COMPREHENSIVE ICD-10 code database
# Source: WHO ICD-10 dataset + common Indian diagnoses

# Includes:
# - All ICD-10 codes (A00-Z99)
# - Full descriptions in English
# - Categorized by body system
# - Common Indian diagnoses highlighted
# - Pre-set usage_count for popular conditions:
#   * E11.9: Type 2 DM without complications
#   * I10: Essential hypertension
#   * J45.9: Asthma, unspecified
#   * K30: Functional dyspepsia
#   * M79.3: Panniculitis (body pain)
#   * etc.

# CSV format:
# code,description,category,subcategory,common_in_india
# "A00","Cholera","Infectious","Intestinal",true
# "E11.9","Type 2 DM without complications","Endocrine","Diabetes",true

# Run: python backend/scripts/seed_icd10.py
# Seeds ~14,000+ ICD-10 codes
```

### Testing Checklist (ICD-10 System)
- [ ] ICD-10 table populated with 14,000+ codes
- [ ] ICD-10 search returns relevant results (test "diabetes", "fever", "pain")
- [ ] ICD-10 search performance <100ms
- [ ] Popular codes API returns correctly
- [ ] Code details API works
- [ ] Diagnosis with ICD-10 code creates successfully
- [ ] Diagnosis without ICD-10 (free text) creates successfully
- [ ] Auto-fill description from ICD-10 works
- [ ] Usage counter increments when code used
- [ ] Only one primary diagnosis per visit
- [ ] Doctor role validation works
- [ ] Patient diagnosis history shows both coded and non-coded diagnoses

### Success Criteria
- ✅ ICD-10 search FAST (<100ms for typical queries)
- ✅ ICD-10 autocomplete returns top 20 matches instantly
- ✅ Both coded and non-coded workflows work seamlessly
- ✅ Popular codes feature helps users find common diagnoses
- ✅ Diagnosis linked to visits properly
- ✅ Role-based access enforced
- ✅ History shows chronological diagnoses with code/no-code indicator

---

## Phase 3D: Diagnosis Frontend (4-5 days)

### Objectives
Build diagnosis UI with **FULLY FUNCTIONAL ICD-10 search/autocomplete** and flexible diagnosis workflow.
**Note:** ICD-10 is optional but when used, provides COMPLETE search, autocomplete, and auto-fill features.

### Deliverables

#### 1. TypeScript Types
**File:** `frontend/src/types/diagnosis.ts`

```typescript
export interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

export interface Diagnosis {
  id: string;
  visit_id: string;
  patient_id: string;
  icd10_code: string;
  icd10_description: string;
  diagnosis_type: 'primary' | 'secondary';
  status: 'provisional' | 'confirmed';
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  clinical_notes?: string;
  diagnosed_date: string;
  diagnosed_by: string;
}
```

#### 2. API Service
**File:** `frontend/src/services/diagnosisService.ts`

```typescript
class DiagnosisService {
  async searchICD10(query: string): Promise<ICD10Code[]>
  async addDiagnosis(data: DiagnosisCreateData): Promise<Diagnosis>
  async getVisitDiagnoses(visitId: string): Promise<Diagnosis[]>
  async getPatientDiagnoses(patientId: string): Promise<Diagnosis[]>
  async updateDiagnosis(id: string, data: DiagnosisUpdateData): Promise<Diagnosis>
  async deleteDiagnosis(id: string): Promise<void>
}
```

#### 3. React Query Hooks
**File:** `frontend/src/hooks/useDiagnosis.ts`

```typescript
export const useICD10Search = (query: string, enabled: boolean)
export const useVisitDiagnoses = (visitId: string)
export const usePatientDiagnosisHistory = (patientId: string)
export const useAddDiagnosis = ()
export const useUpdateDiagnosis = ()
export const useDeleteDiagnosis = ()
```

#### 4. ICD-10 Search Component (FULLY FUNCTIONAL)
**File:** `frontend/src/components/diagnosis/ICD10Search.tsx`

```typescript
// POWERFUL autocomplete search with full ICD-10 database:

// Core Features:
- Debounced search (300ms) for performance
- Real-time API call to /api/v1/diagnoses/icd10/search
- Dropdown with top 20 ICD-10 results
- Shows: [CODE] Description (Category)
  Example: [E11.9] Type 2 diabetes mellitus without complications (Endocrine)
- Click to select → auto-fills description field
- Keyboard navigation (up/down arrows, Enter to select, Esc to close)
- Loading state during search
- Empty state: "No matching codes found"

// Advanced Features:
- Highlights matching text in results
- Shows code category badge
- "Popular Codes" quick picks (pre-populated based on usage)
- Recent codes (localStorage cache of user's recent selections)
- Clear button to reset search
- Help tooltip: "Search by disease name or code (e.g., 'diabetes' or 'E11')"

// Flexibility:
- "Skip ICD-10 and use free text" button
- Clear indication that ICD-10 is optional
- Toggle to switch between modes

// Performance:
- Debounced to avoid excessive API calls
- Shows "Searching..." indicator
- <100ms search response time
```

#### 5. Diagnosis Form Component
**File:** `frontend/src/components/diagnosis/DiagnosisForm.tsx`
 FLEXIBLE workflow:

1. Entry Mode Toggle:
   - [x] Use ICD-10 Code (with search)
   - [ ] Free Text Entry (no coding)

2. If ICD-10 Mode:
   - ICD10Search component
   - Selected code display (auto-fills description)
   - Ability to edit description

3. If Free Text Mode:
   - Diagnosis description textarea (required)
   - No ICD-10 code field shown
   - Help text: "Describe the diagnosis in your own words"

4. Common fields (both modes):
   - Diagnosis type radio (primary/secondary)
   - Status select (provisional/confirmed)
   - Severity select (optional)
   - Clinical notes textarea
   - Diagnosed date picker
   - Save & Cancel buttons

// Validation:
- Cannot add 2nd primary diagnosis
- Diagnosis description always required
- ICD-10 code optional (depends on mode selected)

// User Experience:
- Default to provider's preference (configurable)
- Easy toggle between modes
- Clear indication of which mode is active
- Cannot add 2nd primary diagnosis
- ICD-10 code required
```

#### 6. Diagnosis List Component
**File:** `frontend/src/components/diagnosis/DiagnosisList.tsx`

```typescript
// Table/Cards showing:
- ICD-10 code
- Description
- Type badge (Primary/Secondary)
- Status badge (Provisional/Confirmed)
- Severity indicator
- Date diagnosed
- Actions (Edit, Delete)

// Features:
- Primary diagnosis highlighted
- Reorder via drag-drop
- Quick status update
```

#### 7. Diagnosis History Component
**File:** `frontend/src/components/diagnosis/DiagnosisHistory.tsx`

```typescript
// Timeline view:
- Grouped by visit
- Shows diagnosis progression
- Filters by status, type
- Export to PDF

// Shows:
- Visit date
- Diagnosis codes
- Doctor name
- Status changes
```

#### 8. Update Visit Detail Page
**File:** `frontend/src/pages/visits/VisitDetail.tsx`

```typescript
// Add "Diagnoses" tab
<TabPane tab="Diagnoses" key="diagnoses">
  <DiagnosisList visitId={visitId} />
  <Button 
    type="primary" 
    onClick={openDiagnosisForm}
    disabled={!isDiagnosisPhase}
  >
    Add Diagnosis
  </Button>
</TabPane>
```

#### 9. Update Patient Detail Page
**File:** `frontend/src/pages/patients/PatientDetail.tsx`

```typescript
// Add "Diagnosis History" tab
<TabPane tab="Diagnosis History" key="diagnosis-history">
  <DiagnosisHistory patientId={patientId} />
</TabPane>
```

### Testing Checklist
**Note:** Clinical Notes module can be enabled/disabled via feature flag.
- [ ] ICD-10 search returns results
- [ ] Autocomplete works smoothly
- [ ] Primary diagnosis validation works
- [ ] Diagnosis saves to visit
- [ ] Status updates work
- [ ] History displays correctly
- [ ] Delete confirmation works

### Success Criteria
- ✅ Doctor can find ICD-10 codes quickly
- ✅ Diagnosis saved with proper validation
- ✅ Patient history shows all diagnoses
- ✅ UI intuitive and fast

---

## Phase 3E: Clinical Notes Backend (3-4 days)

### Objectives
Build structured clinical notes with SOAP format and note templates.
**Note:** Clinical Notes module can be enabled/disabled via feature flag (see FEATURE_FLAGS.md).

### Deliverables

#### 1. Database Migration
**File:** `backend/alembic/versions/YYYYMMDD_HHMM_create_clinical_notes.py`

```python
# Clinical Notes table:
- id (UUID, PK)
- visit_id (UUID, FK → visits.id)
- patient_id (UUID, FK → patients.id)
- created_by (UUID, FK → users.id, Doctor)

# SOAP Format
- subjective (TEXT) - Chief complaint, HPI
- objective (TEXT) - Physical exam, vitals reference
- assessment (TEXT) - Diagnosis, clinical impression
- plan (TEXT) - Treatment plan, follow-up

# Additional
- note_type (enum: consultation, follow_up, discharge, procedure)
- template_used (VARCHAR, optional)
- is_locked (BOOLEAN, default false)
- locked_at (TIMESTAMP, nullable)
- locked_by (UUID, nullable)

# Standard fields
- created_at, updated_at, is_deleted
```

#### 2. Note Templates Table
**File:** Migration for `note_templates` table

```python
# Note Templates:
- id (UUID, PK)
- name (VARCHAR, e.g., "Hypertension Follow-up")
- specialty (VARCHAR, e.g., "Cardiology")
- subjective_template (TEXT)
- objective_template (TEXT)
- assessment_template (TEXT)
- plan_template (TEXT)
- is_system (BOOLEAN) - System vs user-created
- created_by (UUID, nullable)
```

#### 3. SQLAlchemy Model
**File:** `backend/app/models/clinical_note.py`

```python
class ClinicalNote(BaseModel):
    __tablename__ = "clinical_notes"
    
    visit_id = Column(UUID, ForeignKey("visits.id"))
    patient_id = Column(UUID, ForeignKey("patients.id"))
    created_by = Column(UUID, ForeignKey("users.id"))
    
    # SOAP sections
    subjective = Column(Text)
    objective = Column(Text)
    assessment = Column(Text)
    plan = Column(Text)
    
    note_type = Column(Enum(NoteType))
    template_used = Column(String(100), nullable=True)
    is_locked = Column(Boolean, default=False)
    locked_at = Column(DateTime, nullable=True)
    locked_by = Column(UUID, nullable=True)
    
    # Relationships
    visit = relationship("Visit", back_populates="clinical_notes")
    patient = relationship("Patient")
    doctor = relationship("User", foreign_keys=[created_by])
```

**File:** `backend/app/models/note_template.py`

```python
class NoteTemplate(Base):
    __tablename__ = "note_templates"
    
    name = Column(String(100))
    specialty = Column(String(50))
    subjective_template = Column(Text)
    objective_template = Column(Text)
    assessment_template = Column(Text)
    plan_template = Column(Text)
    is_system = Column(Boolean, default=False)
    created_by = Column(UUID, nullable=True)
```

#### 4. Pydantic Schemas
**File:** `backend/app/schemas/clinical_note.py`

```python
class ClinicalNoteCreate(BaseModel):
    visit_id: UUID
    patient_id: UUID
    subjective: str
    objective: str
    assessment: str
    plan: str
    note_type: NoteType = NoteType.CONSULTATION
    template_used: Optional[str] = None

class ClinicalNoteUpdate(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    
class ClinicalNoteResponse(ClinicalNoteCreate):
    id: UUID
    created_by: UUID
    is_locked: bool
    created_at: datetime
    updated_at: datetime

class NoteTemplateResponse(BaseModel):
    id: UUID
    name: str
    specialty: str
    # ... template fields
```

#### 5. Service Layer
**File:** `backend/app/api/v1/notes/service.py`

```python
class ClinicalNoteService:
    @staticmethod
    async def create_note(db, note_data, current_user):
        # Create clinical note
        # Link to visit
        # Doctor role required
        
    @staticmethod
    async def get_visit_note(db, visit_id):
        # Get note for visit (1 note per visit)
        
    @staticmethod
    async def get_patient_notes(db, patient_id):
        # Patient's note history
        # Order by visit date
        
    @staticmethod
    async def update_note(db, note_id, note_data, current_user):
        # Update note if not locked
        # Same doctor only
        
    @staticmethod
    async def lock_note(db, note_id, current_user):
        # Lock note (finalize)
        # Cannot edit after lock
        
    @staticmethod
    async def get_templates(db, specialty: Optional[str]):
        # Get note templates
        # Filter by specialty if provided
```

#### 6. API Endpoints
**File:** `backend/app/api/v1/notes/router.py`

```python
router = APIRouter()

@router.post("/", response_model=ClinicalNoteResponse)
async def create_note(note_data: ClinicalNoteCreate, ...):
    """Create clinical note (Doctor only)"""

@router.get("/visit/{visit_id}", response_model=ClinicalNoteResponse)
async def get_visit_note(visit_id: UUID, ...):
    """Get clinical note for visit"""

@router.get("/patient/{patient_id}", response_model=List[ClinicalNoteResponse])
async def get_patient_notes(patient_id: UUID, ...):
    """Get patient clinical notes history"""

@router.put("/{note_id}", response_model=ClinicalNoteResponse)
async def update_note(note_id: UUID, note_data: ClinicalNoteUpdate, ...):
    """Update clinical note (if not locked)"""

@router.post("/{note_id}/lock")
async def lock_note(note_id: UUID, ...):
    """Lock/finalize clinical note"""

@router.get("/templates", response_model=List[NoteTemplateResponse])
async def get_note_templates(specialty: Optional[str] = None, ...):
    """Get note templates"""
```

#### 7. Seed Note Templates
**File:** `backend/scripts/seed_note_templates.py`

```python
# Create common templates:
1. General Consultation
2. Hypertension Follow-up
3. Diabetes Management
4. Fever Evaluation
5. Post-operative Review
# Etc.
```

### Testing Checklist
- [ ] Note CRUD operations work
- [ ] Lock prevents editing
- [ ] Templates load correctly
- [ ] One note per visit validation
- [ ] Doctor role validation
- [ ] Patient notes history correct

### Success Criteria
- ✅ Notes saved with SOAP structure
- ✅ Templates speed up documentation
- ✅ Lock feature prevents accidental edits
- ✅ Role-based access enforced

---

## Phase 3F: Clinical Notes Frontend (3-4 days)

### Objectives
Build rich clinical note editor with SOAP sections and templates.
**Note:** Module visibility controlled by feature flag from backend (see FEATURE_FLAGS.md).

### Deliverables

#### 1. TypeScript Types
**File:** `frontend/src/types/clinical_note.ts`

```typescript
export interface ClinicalNote {
  id: string;
  visit_id: string;
  patient_id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  note_type: 'consultation' | 'follow_up' | 'discharge' | 'procedure';
  template_used?: string;
  is_locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  specialty: string;
  subjective_template: string;
  objective_template: string;
  assessment_template: string;
  plan_template: string;
}
```

#### 2. API Service
**File:** `frontend/src/services/noteService.ts`

```typescript
class NoteService {
  async createNote(data: NoteCreateData): Promise<ClinicalNote>
  async getVisitNote(visitId: string): Promise<ClinicalNote | null>
  async getPatientNotes(patientId: string): Promise<ClinicalNote[]>
  async updateNote(id: string, data: NoteUpdateData): Promise<ClinicalNote>
  async lockNote(id: string): Promise<void>
  async getTemplates(specialty?: string): Promise<NoteTemplate[]>
}
```

#### 3. React Query Hooks
**File:** `frontend/src/hooks/useNotes.ts`

```typescript
export const useVisitNote = (visitId: string)
export const usePatientNotes = (patientId: string)
export const useNoteTemplates = (specialty?: string)
export const useCreateNote = ()
export const useUpdateNote = ()
export const useLockNote = ()
```

#### 4. SOAP Note Editor Component
**File:** `frontend/src/components/notes/SOAPEditor.tsx`

```typescript
// Accordion/Tabs for SOAP sections:
1. Subjective
   - Chief Complaint
   - History of Present Illness
   - Past Medical History
   - [Textarea with auto-save]

2. Objective
   - Physical Examination
   - Vital Signs (reference)
   - Lab Results (if available)
   - [Textarea with auto-save]

3. Assessment
   - Clinical Impression
   - Diagnosis (link to diagnosis list)
   - [Textarea with auto-save]

4. Plan
   - Treatment Plan
   - Medications (link to prescriptions)
   - Follow-up Instructions
   - [Textarea with auto-save]

// Features:
- Auto-save every 30 seconds
- Draft indicator
- Character count
- Template selector dropdown
- Lock button (finalize)
```

#### 5. Note Template Selector
**File:** `frontend/src/components/notes/TemplateSelector.tsx`

```typescript
// Dropdown/Modal with:
- List of templates
- Filter by specialty
- Preview template
- Apply to editor (confirm if content exists)

// Templates include:
- Common phrases
- Standard sections
- Specialty-specific formats
```

#### 6. Clinical Note Display
**File:** `frontend/src/components/notes/NoteDisplay.tsx`

```typescript
// Read-only view of SOAP note:
- Collapsible sections
- Formatted text
- Print button
- Edit button (if not locked)
- Lock indicator
- Timestamp and author

// Print format:
- Professional layout
- Patient header
- SOAP sections
- Doctor signature
```

#### 7. Notes History Component
**File:** `frontend/src/components/notes/NotesHistory.tsx`

```typescript
// Timeline of patient notes:
- Grouped by visit
- Shows note summary
- Click to expand/view full note
- Filter by date range
- Search in notes
```

#### 8. Update Visit Detail Page
**File:** `frontend/src/pages/visits/VisitDetail.tsx`

```typescript
// Add "Clinical Notes" tab
<TabPane tab="Clinical Notes" key="notes">
  {existingNote ? (
    <NoteDisplay note={existingNote} />
  ) : (
    <SOAPEditor visitId={visitId} patientId={patientId} />
  )}
</TabPane>
```

#### 9. Update Patient Detail Page
**File:** `frontend/src/pages/patients/PatientDetail.tsx`

```typescript
// Add "Clinical History" tab
<TabPane tab="Clinical History" key="clinical-history">
  <NotesHistory patientId={patientId} />
</TabPane>
```

### Testing Checklist
- [ ] SOAP editor saves correctly
- [ ] Auto-save works (30s)
- [ ] Templates load and apply
- [ ] Lock prevents editing
- [ ] Notes print correctly
- [ ] History displays notes
- [ ] Search in notes works

### Success Criteria
- ✅ Doctor can document quickly (<5 min)
- ✅ SOAP structure enforced
- ✅ Templates save time
- ✅ Auto-save prevents data loss
- ✅ Print-ready format

---

## Phase 3G: Integration & Testing (3-4 days)

### Objectives
Integrate all Phase 3 modules into visit workflow and comprehensive testing.

### Deliverables

#### 1. Visit Workflow Integration
**File:** `frontend/src/pages/visits/VisitDetail.tsx`

```typescript
// Enhanced Visit Detail with all 3 modules:
<Tabs>
  <TabPane tab="Overview">
    <VisitSummary /> {/* Shows vitals, diagnoses, notes summary */}
  </TabPane>
  
  <TabPane tab="Vitals">
    <VitalsDisplay />
    <VitalsHistory />
  </TabPane>
  
  <TabPane tab="Diagnoses">
    <DiagnosisList />
  </TabPane>
  
  <TabPane tab="Clinical Notes">
    <SOAPEditor />
  </TabPane>
  
  <TabPane tab="Prescriptions">
    {/* Future: Phase 4 */}
  </TabPane>
</Tabs>

// Workflow:
1. Nurse records vitals → Status: "Vitals Recorded"
2. Doctor reviews vitals → Adds diagnoses
3. Doctor writes clinical notes
4. Lock note → Status: "Consultation Complete"
```

#### 2. Visit Status Updates
**File:** `backend/app/models/enums.py`

```python
class VisitStatus(str, Enum):
    # Existing
    CHECKED_IN = "checked_in"
    WAITING = "waiting"
    
    # New Phase 3 statuses
    VITALS_RECORDED = "vitals_recorded"
    IN_CONSULTATION = "in_consultation"
    DIAGNOSIS_COMPLETE = "diagnosis_complete"
    NOTES_COMPLETE = "notes_complete"
    
    # Existing
    COMPLETED = "completed"
    CANCELLED = "cancelled"
```

#### 3. Visit Service Updates
**File:** `backend/app/api/v1/visits/service.py`

```python
# Auto-update visit status based on actions:
- Vitals recorded → "vitals_recorded"
- Diagnosis added → "diagnosis_complete"
- Note locked → "notes_complete"
- All complete → "completed"
```

#### 4. Dashboard Updates
**File:** `frontend/src/pages/Dashboard.tsx`

```typescript
// Add new cards:
- Pending Vitals (visits without vitals)
- Pending Diagnoses (visits without diagnosis)
- Pending Notes (visits without locked notes)

// Update queue to show Phase 3 status
```

#### 5. Clinical Summary Report
**File:** `frontend/src/components/reports/ClinicalSummary.tsx`

```typescript
// Comprehensive report showing:
- Visit information
- Vitals recorded
- Diagnoses list
- Clinical notes (SOAP)
- Prescriptions (if any)

// Features:
- Print/PDF export
- Email to patient
- Share with referral doctor
```

#### 6. E2E Testing Scenarios

**Scenario 1: Complete Visit Workflow**
```
1. Create patient (if new)
2. Create visit (check-in)
3. Nurse: Record vitals
   - Verify BMI calculation
   - Verify status → "vitals_recorded"
4. Doctor: Add primary diagnosis
   - Search ICD-10
   - Save diagnosis
   - Verify status → "diagnosis_complete"
5. Doctor: Write clinical notes
   - Use template
   - Fill SOAP sections
   - Lock note
   - Verify status → "notes_complete"
6. Verify visit summary shows all data
7. Print clinical summary
```

**Scenario 2: Patient History Review**
```
1. Open patient detail
2. View vitals history (chart)
3. View diagnosis history (timeline)
4. View clinical notes history
5. Verify data consistency across tabs
```

**Scenario 3: Role-Based Access**
```
1. Nurse login
   - Can record vitals ✅
   - Cannot add diagnosis ❌
   - Cannot write notes ❌

2. Doctor login
   - Can view vitals ✅
   - Can add diagnosis ✅
   - Can write notes ✅

3. Receptionist login
   - Can view (read-only) ✅
   - Cannot modify ❌
```

#### 7. Performance Optimization
- ICD-10 search indexing
- Vitals chart lazy loading
- Note auto-save debouncing
- Clinical summary pagination

#### 8. Documentation Updates
- API documentation (Swagger)
- User guide for clinical workflow
- Training materials for staff
- System admin guide

### Testing Checklist
- [ ] End-to-end visit workflow completes
- [ ] All modules work together seamlessly
- [ ] Status updates automatically
- [ ] Clinical summary generates correctly
- [ ] Role-based access enforced
- [ ] Performance acceptable (<2s page load)
- [ ] Mobile responsive
- [ ] Print functionality works

### Success Criteria
- ✅ Complete visit workflow operational
- ✅ All Phase 3 features integrated
- ✅ Clinical documentation complete and accurate
- ✅ System ready for Phase 4
- ✅ Staff training completed

---

## Phase 3 Completion Checklist

### Backend Completeness
- [ ] All 3 database migrations run successfully
- [ ] All models have proper relationships
- [ ] All services have comprehensive logic
- [ ] All API endpoints documented in Swagger
- [ ] All endpoints have proper validation
- [ ] All endpoints have role-based auth
- [ ] ICD-10 codes seeded (minimum 1000 common codes)
- [ ] Note templates seeded
- [ ] Unit tests for critical functions
- [ ] Integration tests for workflows

### Frontend Completeness
- [ ] All TypeScript types defined
- [ ] All API services implemented
- [ ] All React Query hooks created
- [ ] All UI components responsive
- [ ] All forms have validation
- [ ] All data displays correctly
- [ ] All actions have loading states
- [ ] All errors handled gracefully
- [ ] Visit Detail page fully integrated
- [ ] Patient Detail page fully integrated
- [ ] Dashboard updated with Phase 3 metrics

### Quality Assurance
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] No broken links/routes
- [ ] All CRUD operations tested
- [ ] All workflows tested end-to-end
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Mobile responsive verified
- [ ] Print functionality verified
- [ ] Performance acceptable

### Documentation
- [ ] API documentation complete
- [ ] Code comments adequate
- [ ] User guide written
- [ ] Training materials prepared
- [ ] Phase 3 marked complete in overview docs

---

## Risk Mitigation

### Common Issues to Avoid (Lessons from Phase 1 & 2)

1. **Email Validation Issues**
   - ✅ Use proper email domains (not .local)
   - ✅ Test Pydantic EmailStr validation early

2. **CORS Errors**
   - ✅ Use relative URLs in frontend (/api/v1/...)
   - ✅ Configure Vite proxy correctly
   - ✅ Ensure CORS middleware in FastAPI

3. **Trailing Slash Redirects**
   - ✅ Use consistent URL patterns (with or without slash)
   - ✅ Add duplicate route decorators if needed

4. **Authentication Token Loss**
   - ✅ Ensure Authorization header preserved in redirects
   - ✅ Test auth on all endpoints

5. **Password Hashing**
   - ✅ Use Argon2 consistently
   - ✅ Update seed scripts when changing passwords
   - ✅ Test authentication after any auth changes

6. **Database Relationships**
   - ✅ Define foreign keys correctly
   - ✅ Set up back_populates in relationships
   - ✅ Test cascade deletes

7. **Frontend State Management**
   - ✅ Use React Query for server state
   - ✅ Invalidate queries after mutations
   - ✅ Handle loading/error states

8. **Form Validation**
   - ✅ Validate on backend (Pydantic)
   - ✅ Validate on frontend (Ant Design)
   - ✅ Provide clear error messages

### Development Best Practices

1. **Start Backend First**
   - Build models → migrations → schemas → services → APIs
   - Test APIs in Swagger before frontend work
   - Ensures stable backend for frontend integration

2. **Test Incrementally**
   - Test each sub-phase before moving to next
   - Don't accumulate bugs across phases
   - Fix issues immediately when found

3. **Follow Existing Patterns**
   - Use same structure as Patient/Visit modules
   - Copy-paste-modify proven code
   - Maintain consistency in naming/organization

4. **Commit Frequently**
   - Commit after each sub-phase
   - Use descriptive commit messages
   - Tag important milestones

5. **Document as You Go**
   - Update API docs immediately
   - Comment complex logic
   - Update README with new features

---

## Timeline Summary

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| 3A: Vitals Backend | 3-4 days | Week 1 | Week 1 |
| 3B: Vitals Frontend | 3-4 days | Week 1 | Week 1 |
| 3C: Diagnosis Backend | 4-5 days | Week 2 | Week 2 |
| 3D: Diagnosis Frontend | 4-5 days | Week 2 | Week 2 |
| 3E: Clinical Notes Backend | 3-4 days | Week 3 | Week 3 |
| 3F: Clinical Notes Frontend | 3-4 days | Week 3 | Week 3 |
| 3G: Integration & Testing | 3-4 days | Week 4 | Week 4 |

**Total Estimated Time:** 4-5 weeks

---

## Next Steps

1. **Review this plan** - Ensure all requirements covered
2. **Start Phase 3A** - Begin with Vitals Backend
3. **Follow sub-phase order** - Complete backend before frontend
4. **Test thoroughly** - Each sub-phase must work before proceeding
5. **Document progress** - Update completion status
6. **Communicate blockers** - Report issues immediately

---

## Phase 4 Preview

After Phase 3 completion, Phase 4 will cover:
- **Prescriptions** - eDrx, drug interactions
- **Lab Orders** - Test ordering and results
- **Imaging Integration** - PACS/DICOM integration with Orthanc
- **Billing** - Invoice generation, payment tracking

---

**Let's begin Phase 3A: Vitals Backend! 🚀**
