# Allergies Management System - Design & Implementation Plan

## Current State Analysis

### ✅ What Exists (Basic)
**Patient Model** has simple allergy tracking:
- `allergies` field: Simple text field (comma-separated values)
- **Location**: Patient registration form
- **Format**: Free text, comma-separated (e.g., "Penicillin, Sulfa drugs")
- **Display**: Shows as tags in patient detail view
- **Limitations**: No structured data, no severity, no reactions

### ❌ What's Missing (Critical for Safety)
- ❌ No structured allergy database
- ❌ No severity levels (mild/moderate/severe/life-threatening)
- ❌ No reaction types (rash, anaphylaxis, GI upset)
- ❌ No drug-allergy checking during prescription
- ❌ No allergy alerts in diagnosis/treatment workflow
- ❌ No allergy history (when added, by whom)
- ❌ No standardized allergen codes (WHO ATC, SNOMED)
- ❌ No family allergy history

## Why Allergies Are Critical

### 1. Patient Safety (Primary)
- 🚨 **Prevent adverse drug reactions** (ADR)
- 🚨 **Avoid anaphylaxis** (life-threatening)
- 🚨 **Cross-reactivity warnings** (Penicillin → Cephalosporins)
- 🚨 **Legal liability** if not documented

### 2. Clinical Decision Support
- Alert before prescribing contraindicated drugs
- Warn about cross-reactive allergens
- Track reaction patterns
- Support evidence-based treatment

### 3. Regulatory Compliance
- **NABH Standard**: Requires allergy documentation
- **ABDM Guidelines**: Allergy data in health records
- **Medical Council of India**: Mandatory documentation
- **Medico-legal**: Proof of due diligence

## Proposed Enhancement: Phase 3E - Allergies Module

### Database Schema

#### 1. Allergen Reference Table
```sql
CREATE TABLE allergens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,           -- WHO ATC code or custom
    name VARCHAR(200) NOT NULL,                  -- "Penicillin"
    allergen_type VARCHAR(50) NOT NULL,          -- drug, food, environmental, other
    category VARCHAR(100),                       -- antibiotic, NSAID, nuts, etc.
    cross_reactive_group VARCHAR(100),           -- Beta-lactam group
    description TEXT,
    common_in_india BOOLEAN DEFAULT FALSE,
    search_text TEXT,                            -- For full-text search
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Common allergen types
-- drug: medications (antibiotics, NSAIDs, etc.)
-- food: nuts, seafood, dairy, gluten, etc.
-- environmental: pollen, dust, mold, etc.
-- other: latex, insect stings, etc.

-- Common cross-reactive groups
-- Beta-lactam: Penicillin, Cephalosporins, Carbapenems
-- Sulfonamides: Sulfa drugs, Sulfonylureas
-- NSAIDs: Aspirin, Ibuprofen, Diclofenac
```

#### 2. Patient Allergies Table
```sql
CREATE TYPE allergy_severity AS ENUM ('mild', 'moderate', 'severe', 'life_threatening');
CREATE TYPE reaction_type AS ENUM ('rash', 'itching', 'hives', 'swelling', 'anaphylaxis', 
                                    'gi_upset', 'breathing_difficulty', 'other');

CREATE TABLE patient_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    allergen_id UUID REFERENCES allergens(id),   -- NULL if free-text
    allergen_name VARCHAR(200) NOT NULL,         -- Free text or from reference
    
    -- Severity & Reaction
    severity allergy_severity NOT NULL,
    reaction_types reaction_type[] NOT NULL,     -- Array of reactions
    reaction_description TEXT,                   -- Free-text details
    
    -- Onset & Verification
    onset_date DATE,                             -- When first occurred
    verified_date DATE,                          -- When confirmed by doctor
    verified_by UUID REFERENCES users(id),       -- Doctor who verified
    verification_status VARCHAR(20) DEFAULT 'unverified',  -- unverified, verified, suspected
    
    -- Clinical Details
    notes TEXT,                                  -- Additional info
    treatment_given TEXT,                        -- How it was treated
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,              -- Can be marked inactive if resolved
    inactive_date DATE,
    inactive_reason TEXT,
    
    -- Audit
    recorded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_patient_allergies_patient ON patient_allergies(patient_id) 
    WHERE is_deleted = FALSE AND is_active = TRUE;
CREATE INDEX idx_patient_allergies_allergen ON patient_allergies(allergen_id);
CREATE INDEX idx_patient_allergies_severity ON patient_allergies(severity) 
    WHERE severity IN ('severe', 'life_threatening');
```

#### 3. Allergy Alert Log
```sql
CREATE TABLE allergy_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    allergy_id UUID NOT NULL REFERENCES patient_allergies(id),
    
    -- Context
    triggered_by VARCHAR(50) NOT NULL,           -- prescription, diagnosis, procedure
    triggered_at TIMESTAMP DEFAULT NOW(),
    
    -- Alert details
    severity allergy_severity NOT NULL,
    alert_message TEXT NOT NULL,
    cross_reactive_warning BOOLEAN DEFAULT FALSE,
    
    -- User response
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    override_reason TEXT,                        -- If doctor overrode warning
    
    -- Related entities
    prescription_id UUID,                        -- If from prescription module
    diagnosis_id UUID,
    visit_id UUID REFERENCES visits(id)
);
```

### Backend Implementation

#### 1. Models
```python
# backend/app/models/allergen.py
from sqlalchemy import Column, String, Text, Boolean
from app.models.base import BaseModel

class Allergen(BaseModel):
    """Reference table for common allergens"""
    __tablename__ = "allergens"
    
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    allergen_type = Column(String(50), nullable=False)  # drug, food, environmental
    category = Column(String(100))
    cross_reactive_group = Column(String(100))
    description = Column(Text)
    common_in_india = Column(Boolean, default=False)
    search_text = Column(Text)


# backend/app/models/patient_allergy.py
from sqlalchemy import Column, String, Text, Date, Boolean, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID as PGUUID, ENUM as PGEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class AllergySeverity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    LIFE_THREATENING = "life_threatening"

class ReactionType(str, Enum):
    RASH = "rash"
    ITCHING = "itching"
    HIVES = "hives"
    SWELLING = "swelling"
    ANAPHYLAXIS = "anaphylaxis"
    GI_UPSET = "gi_upset"
    BREATHING_DIFFICULTY = "breathing_difficulty"
    OTHER = "other"

class PatientAllergy(BaseModel):
    """Patient-specific allergy records"""
    __tablename__ = "patient_allergies"
    
    patient_id = Column(PGUUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    allergen_id = Column(PGUUID(as_uuid=True), ForeignKey("allergens.id"), nullable=True)
    allergen_name = Column(String(200), nullable=False)
    
    # Severity & Reactions
    severity = Column(PGEnum(AllergySeverity, name="allergy_severity"), nullable=False)
    reaction_types = Column(ARRAY(PGEnum(ReactionType, name="reaction_type")), nullable=False)
    reaction_description = Column(Text)
    
    # Verification
    onset_date = Column(Date)
    verified_date = Column(Date)
    verified_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    verification_status = Column(String(20), default="unverified")
    
    # Clinical
    notes = Column(Text)
    treatment_given = Column(Text)
    
    # Status
    is_active = Column(Boolean, default=True)
    inactive_date = Column(Date)
    inactive_reason = Column(Text)
    
    # Audit
    recorded_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="allergies")
    allergen = relationship("Allergen")
    recorded_by_user = relationship("User", foreign_keys=[recorded_by])
    verified_by_user = relationship("User", foreign_keys=[verified_by])
```

#### 2. Service Layer
```python
# backend/app/api/v1/allergies/allergy_service.py

class AllergyService:
    @staticmethod
    async def add_patient_allergy(
        db: AsyncSession,
        patient_id: UUID,
        allergy_data: AllergyCreate,
        recorded_by: UUID
    ):
        """Add new allergy to patient record"""
        # Check for duplicates
        existing = await AllergyService.check_duplicate_allergy(
            db, patient_id, allergy_data.allergen_name
        )
        if existing:
            raise HTTPException(400, "Allergy already recorded")
        
        # Create allergy record
        allergy = PatientAllergy(
            patient_id=patient_id,
            allergen_name=allergy_data.allergen_name,
            severity=allergy_data.severity,
            reaction_types=allergy_data.reaction_types,
            recorded_by=recorded_by
        )
        db.add(allergy)
        await db.commit()
        return allergy
    
    @staticmethod
    async def get_active_allergies(db: AsyncSession, patient_id: UUID):
        """Get all active allergies for a patient"""
        result = await db.execute(
            select(PatientAllergy)
            .where(
                PatientAllergy.patient_id == patient_id,
                PatientAllergy.is_active == True,
                PatientAllergy.is_deleted == False
            )
            .options(selectinload(PatientAllergy.allergen))
            .order_by(PatientAllergy.severity.desc())  # Most severe first
        )
        return result.scalars().all()
    
    @staticmethod
    async def check_drug_allergy_conflict(
        db: AsyncSession,
        patient_id: UUID,
        drug_name: str
    ) -> List[dict]:
        """
        Check if patient has allergies that conflict with a drug
        Returns warnings with severity
        """
        allergies = await AllergyService.get_active_allergies(db, patient_id)
        warnings = []
        
        for allergy in allergies:
            # Direct match
            if drug_name.lower() in allergy.allergen_name.lower():
                warnings.append({
                    "type": "direct_match",
                    "severity": allergy.severity,
                    "allergen": allergy.allergen_name,
                    "message": f"Patient is allergic to {allergy.allergen_name}"
                })
            
            # Check cross-reactivity
            if allergy.allergen and allergy.allergen.cross_reactive_group:
                # Query drugs in same cross-reactive group
                cross_reactive = await db.execute(
                    select(Allergen).where(
                        Allergen.cross_reactive_group == allergy.allergen.cross_reactive_group,
                        Allergen.name.ilike(f"%{drug_name}%")
                    )
                )
                if cross_reactive.scalar_one_or_none():
                    warnings.append({
                        "type": "cross_reactive",
                        "severity": "moderate",
                        "allergen": allergy.allergen_name,
                        "message": f"May cross-react with {allergy.allergen_name}"
                    })
        
        return warnings
    
    @staticmethod
    async def verify_allergy(
        db: AsyncSession,
        allergy_id: UUID,
        verified_by: UUID
    ):
        """Doctor verifies an allergy"""
        allergy = await AllergyService.get_allergy_by_id(db, allergy_id)
        allergy.verification_status = "verified"
        allergy.verified_by = verified_by
        allergy.verified_date = date.today()
        await db.commit()
        return allergy
```

#### 3. API Endpoints
```python
# backend/app/api/v1/allergies/allergy_router.py

router = APIRouter()

@router.post("/patients/{patient_id}/allergies", status_code=201)
async def add_patient_allergy(
    patient_id: UUID,
    allergy: AllergyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add new allergy to patient"""
    return await AllergyService.add_patient_allergy(
        db, patient_id, allergy, current_user.id
    )

@router.get("/patients/{patient_id}/allergies")
async def get_patient_allergies(
    patient_id: UUID,
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all allergies for a patient"""
    if include_inactive:
        return await AllergyService.get_all_allergies(db, patient_id)
    return await AllergyService.get_active_allergies(db, patient_id)

@router.post("/allergies/check-conflict")
async def check_drug_conflict(
    patient_id: UUID,
    drug_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if drug conflicts with patient allergies"""
    warnings = await AllergyService.check_drug_allergy_conflict(
        db, patient_id, drug_name
    )
    return {
        "has_conflicts": len(warnings) > 0,
        "warnings": warnings
    }

@router.put("/allergies/{allergy_id}/verify")
async def verify_allergy(
    allergy_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor)  # Only doctors
):
    """Verify an allergy (doctors only)"""
    return await AllergyService.verify_allergy(db, allergy_id, current_user.id)

@router.put("/allergies/{allergy_id}/deactivate")
async def deactivate_allergy(
    allergy_id: UUID,
    reason: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Mark allergy as inactive (resolved/no longer present)"""
    return await AllergyService.deactivate_allergy(
        db, allergy_id, reason, current_user.id
    )

@router.get("/allergens/search")
async def search_allergens(
    query: str,
    allergen_type: Optional[str] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Search allergen reference database"""
    return await AllergenService.search_allergens(
        db, query, allergen_type, limit
    )
```

### Frontend Implementation

#### 1. Allergy Display Component (High Visibility)
```typescript
// frontend/src/components/AllergiesAlert.tsx

interface AllergiesAlertProps {
  patientId: string;
  compact?: boolean;
}

export const AllergiesAlert: React.FC<AllergiesAlertProps> = ({ 
  patientId, 
  compact = false 
}) => {
  const { data: allergies, isLoading } = useQuery(
    ['patient-allergies', patientId],
    () => api.get(`/patients/${patientId}/allergies`)
  );

  if (!allergies?.length) return null;

  // Severe/life-threatening allergies
  const criticalAllergies = allergies.filter(a => 
    ['severe', 'life_threatening'].includes(a.severity)
  );

  if (compact) {
    return (
      <Alert
        type="error"
        icon={<WarningOutlined />}
        message={`${criticalAllergies.length} Critical Allergies`}
        showIcon
      />
    );
  }

  return (
    <div className="allergies-alert">
      <Alert
        type="error"
        icon={<WarningOutlined />}
        message="PATIENT ALLERGIES - REVIEW BEFORE PRESCRIBING"
        description={
          <Space direction="vertical" style={{ width: '100%' }}>
            {allergies.map(allergy => (
              <Tag
                key={allergy.id}
                color={getSeverityColor(allergy.severity)}
                icon={allergy.severity === 'life_threatening' ? <ExclamationCircleOutlined /> : null}
              >
                <strong>{allergy.allergen_name}</strong>
                {allergy.severity === 'life_threatening' && ' ⚠️ LIFE-THREATENING'}
                <br />
                <small>{allergy.reaction_types.join(', ')}</small>
              </Tag>
            ))}
          </Space>
        }
        showIcon
      />
    </div>
  );
};
```

#### 2. Allergy Management Modal
```typescript
// frontend/src/components/AllergyManagementModal.tsx

export const AllergyManagementModal: React.FC<Props> = ({ 
  patientId, 
  visible, 
  onClose 
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    await api.post(`/patients/${patientId}/allergies`, {
      allergen_name: values.allergen_name,
      severity: values.severity,
      reaction_types: values.reaction_types,
      onset_date: values.onset_date,
      notes: values.notes
    });
    message.success('Allergy added successfully');
    onClose();
  };

  return (
    <Modal
      title="Add Patient Allergy"
      visible={visible}
      onCancel={onClose}
      width={700}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item 
          name="allergen_name" 
          label="Allergen Name" 
          required
          rules={[{ required: true }]}
        >
          <AutoComplete
            placeholder="Search allergen (e.g., Penicillin)"
            options={allergenOptions}
            filterOption={(inputValue, option) =>
              option.value.toLowerCase().includes(inputValue.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item 
          name="severity" 
          label="Severity" 
          required
        >
          <Radio.Group>
            <Radio.Button value="mild">Mild</Radio.Button>
            <Radio.Button value="moderate">Moderate</Radio.Button>
            <Radio.Button value="severe">Severe</Radio.Button>
            <Radio.Button value="life_threatening">
              <WarningOutlined /> Life-Threatening
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item 
          name="reaction_types" 
          label="Reactions" 
          required
        >
          <Checkbox.Group>
            <Checkbox value="rash">Rash</Checkbox>
            <Checkbox value="itching">Itching</Checkbox>
            <Checkbox value="hives">Hives</Checkbox>
            <Checkbox value="swelling">Swelling</Checkbox>
            <Checkbox value="anaphylaxis">Anaphylaxis</Checkbox>
            <Checkbox value="gi_upset">GI Upset</Checkbox>
            <Checkbox value="breathing_difficulty">Breathing Difficulty</Checkbox>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item name="onset_date" label="First Occurred">
          <DatePicker />
        </Form.Item>

        <Form.Item name="notes" label="Additional Notes">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

#### 3. Drug-Allergy Conflict Check (Integration Point)
```typescript
// When prescribing medication
const checkDrugAllergy = async (patientId: string, drugName: string) => {
  const response = await api.post('/allergies/check-conflict', {
    patient_id: patientId,
    drug_name: drugName
  });

  if (response.data.has_conflicts) {
    // Show warning modal
    Modal.warning({
      title: 'ALLERGY WARNING',
      content: (
        <div>
          <Alert type="error" message="Patient has allergies that may conflict with this drug" />
          <List
            dataSource={response.data.warnings}
            renderItem={warning => (
              <List.Item>
                <Alert
                  type={warning.type === 'direct_match' ? 'error' : 'warning'}
                  message={warning.message}
                  description={`Severity: ${warning.severity}`}
                />
              </List.Item>
            )}
          />
          <p><strong>Override requires justification</strong></p>
        </div>
      )
    });
    
    return false; // Prevent prescription unless overridden
  }
  
  return true; // Safe to prescribe
};
```

### Seed Data: Common Allergens

```python
# backend/scripts/seed_allergens.py

COMMON_ALLERGENS = [
    # Drugs - Antibiotics
    {"code": "J01CA", "name": "Penicillin", "type": "drug", "category": "Antibiotic", 
     "cross_reactive_group": "Beta-lactam", "common_in_india": True},
    {"code": "J01DB", "name": "Cephalosporin", "type": "drug", "category": "Antibiotic",
     "cross_reactive_group": "Beta-lactam", "common_in_india": True},
    {"code": "J01CR", "name": "Amoxicillin", "type": "drug", "category": "Antibiotic",
     "cross_reactive_group": "Beta-lactam", "common_in_india": True},
    {"code": "J01EE", "name": "Sulfonamides", "type": "drug", "category": "Antibiotic",
     "cross_reactive_group": "Sulfa", "common_in_india": True},
    
    # Drugs - Pain/NSAID
    {"code": "N02BA", "name": "Aspirin", "type": "drug", "category": "NSAID",
     "cross_reactive_group": "NSAID", "common_in_india": True},
    {"code": "M01AE", "name": "Ibuprofen", "type": "drug", "category": "NSAID",
     "cross_reactive_group": "NSAID", "common_in_india": True},
    {"code": "M01AB", "name": "Diclofenac", "type": "drug", "category": "NSAID",
     "cross_reactive_group": "NSAID", "common_in_india": True},
    
    # Foods
    {"code": "FOOD-001", "name": "Peanuts", "type": "food", "category": "Nuts",
     "common_in_india": True},
    {"code": "FOOD-002", "name": "Tree nuts", "type": "food", "category": "Nuts",
     "common_in_india": True},
    {"code": "FOOD-003", "name": "Shellfish", "type": "food", "category": "Seafood",
     "common_in_india": True},
    {"code": "FOOD-004", "name": "Milk/Dairy", "type": "food", "category": "Dairy",
     "common_in_india": True},
    {"code": "FOOD-005", "name": "Eggs", "type": "food", "category": "Protein",
     "common_in_india": True},
    {"code": "FOOD-006", "name": "Wheat/Gluten", "type": "food", "category": "Grain",
     "common_in_india": True},
    {"code": "FOOD-007", "name": "Soy", "type": "food", "category": "Legume",
     "common_in_india": True},
    
    # Environmental
    {"code": "ENV-001", "name": "Pollen", "type": "environmental", "category": "Seasonal",
     "common_in_india": True},
    {"code": "ENV-002", "name": "Dust mites", "type": "environmental", "category": "Indoor",
     "common_in_india": True},
    {"code": "ENV-003", "name": "Mold", "type": "environmental", "category": "Fungal",
     "common_in_india": True},
    
    # Other
    {"code": "OTH-001", "name": "Latex", "type": "other", "category": "Material",
     "common_in_india": False},
    {"code": "OTH-002", "name": "Bee sting", "type": "other", "category": "Insect",
     "common_in_india": True},
]
```

## Implementation Priority

### 🔴 **CRITICAL (Before Production)**
1. **Migrate existing allergy data** from patient.allergies text field
2. **Structured allergy table** with severity
3. **Basic CRUD operations** (add, view, delete)
4. **Prominent display** in patient header/visit page

### 🟡 **HIGH (Phase 3E - Next Sprint)**
1. **Allergen reference database** with seed data
2. **Drug-allergy conflict checking** (basic)
3. **Verification workflow** (doctor confirms)
4. **Alert system** when prescribing

### 🟢 **MEDIUM (Phase 4)**
1. **Cross-reactivity checking**
2. **Allergy history/timeline**
3. **Analytics** (most common allergies)
4. **Integration with prescription module**

### 🔵 **LOW (Future Enhancement)**
1. **WHO ATC code integration**
2. **Family allergy history**
3. **Genetic markers** (pharmacogenomics)
4. **AI-powered allergy prediction**

## Migration Path

### Step 1: Create New Tables (Don't Touch Existing Data)
```sql
-- Create new allergy tables
-- Keep patient.allergies field for now
```

### Step 2: Dual Write (Temporary)
```python
# Write to both old and new systems
# For backwards compatibility
```

### Step 3: Data Migration
```python
# Script to migrate comma-separated allergies to structured records
async def migrate_allergies():
    patients = await db.execute(select(Patient).where(Patient.allergies.isnot(None)))
    
    for patient in patients:
        if patient.allergies:
            allergy_list = patient.allergies.split(',')
            for allergy_name in allergy_list:
                allergy = PatientAllergy(
                    patient_id=patient.id,
                    allergen_name=allergy_name.strip(),
                    severity='moderate',  # Default, needs review
                    reaction_types=['other'],
                    verification_status='unverified',
                    recorded_by=patient.created_by
                )
                db.add(allergy)
    
    await db.commit()
```

### Step 4: Phase Out Old Field
```sql
-- After migration verified
ALTER TABLE patients DROP COLUMN allergies;
```

## Conclusion

**Current State**: Basic text field for allergies ⚠️  
**Recommended**: Structured allergy module (Phase 3E) 🎯  
**Timeline**: 2-3 weeks to implement critical features  
**Priority**: HIGH - Required before production release

---

**Next Steps:**
1. Complete Phase 3D (Diagnosis Frontend)
2. Implement Phase 3E (Allergies Module) - PRIORITY
3. Integrate with prescription module (Phase 4)

**Date**: February 4, 2026  
**Status**: Design Complete - Awaiting Implementation
