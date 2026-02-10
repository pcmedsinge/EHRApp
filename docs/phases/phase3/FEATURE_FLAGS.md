# Feature Flags System for Phase 3

## Overview
Some EHR modules are optional depending on the healthcare facility's workflow. This document describes the feature flag system to enable/disable features.

---

## Backend Feature Flags

### Settings Schema
**File:** `backend/app/models/settings.py`

```python
from sqlalchemy import Column, String, Boolean, Text, UUID
from app.models.base import BaseModel

class SystemSetting(BaseModel):
    """System-wide feature flags and settings"""
    __tablename__ = "system_settings"
    
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(Text, nullable=False)
    data_type = Column(String(20), nullable=False)  # boolean, string, json
    category = Column(String(50))  # module_features, integrations, etc.
    description = Column(Text)
    updated_by = Column(UUID, ForeignKey("users.id"))

# Default feature flags:
DEFAULT_FEATURES = {
    "clinical_notes_enabled": True,      # Enable/disable clinical notes module
    "icd10_required": False,             # Require ICD-10 codes in diagnoses
    "vitals_validation_strict": True,    # Strict validation for vitals
    "diagnosis_free_text": True,         # Allow non-coded diagnoses
    "auto_icd10_search": False,          # Auto-search ICD-10 as user types
}
```

### Settings API Endpoints
**File:** `backend/app/api/v1/settings/router.py`

```python
@router.get("/features", response_model=FeatureFlags)
async def get_feature_flags(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all feature flags (publicly accessible)"""
    settings = await SettingsService.get_feature_flags(db)
    return settings

@router.patch("/features/{key}", dependencies=[Depends(require_admin)])
async def update_feature_flag(
    key: str,
    value: bool,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update feature flag (admin only)"""
    return await SettingsService.update_feature_flag(db, key, value, current_user.id)
```

### Response Model
**File:** `backend/app/schemas/settings.py`

```python
class FeatureFlags(BaseModel):
    clinical_notes_enabled: bool = True
    icd10_required: bool = False
    vitals_validation_strict: bool = True
    diagnosis_free_text: bool = True
    auto_icd10_search: bool = False
    
    class Config:
        from_attributes = True
```

---

## Frontend Feature Flags

### Feature Context
**File:** `frontend/src/contexts/FeatureContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/services/api';

interface FeatureFlags {
  clinicalNotesEnabled: boolean;
  icd10Required: boolean;
  vitalsValidationStrict: boolean;
  diagnosisFreeText: boolean;
  autoIcd10Search: boolean;
}

const defaultFeatures: FeatureFlags = {
  clinicalNotesEnabled: true,
  icd10Required: false,
  vitalsValidationStrict: true,
  diagnosisFreeText: true,
  autoIcd10Search: false,
};

const FeatureContext = createContext<FeatureFlags>(defaultFeatures);

export const FeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures);

  useEffect(() => {
    // Fetch feature flags from backend on app load
    const fetchFeatures = async () => {
      try {
        const response = await api.get<FeatureFlags>('/settings/features');
        setFeatures(response.data);
      } catch (error) {
        console.error('Failed to fetch feature flags:', error);
        // Use defaults on error
      }
    };

    fetchFeatures();
  }, []);

  return (
    <FeatureContext.Provider value={features}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatures = () => useContext(FeatureContext);
```

### App Integration
**File:** `frontend/src/App.tsx`

```typescript
import { FeatureProvider } from '@/contexts/FeatureContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FeatureProvider>
        <Router>
          {/* ... routes */}
        </Router>
      </FeatureProvider>
    </QueryClientProvider>
  );
}
```

---

## Usage Examples

### 1. Conditional Navigation Menu
**File:** `frontend/src/components/layout/Sidebar.tsx`

```typescript
import { useFeatures } from '@/contexts/FeatureContext';

export const Sidebar: React.FC = () => {
  const features = useFeatures();

  return (
    <Menu>
      <Menu.Item icon={<HomeOutlined />}>Dashboard</Menu.Item>
      <Menu.Item icon={<UserOutlined />}>Patients</Menu.Item>
      <Menu.Item icon={<MedicineBoxOutlined />}>Visits</Menu.Item>
      
      {/* Conditional menu item - only show if clinical notes enabled */}
      {features.clinicalNotesEnabled && (
        <Menu.Item icon={<FileTextOutlined />}>Clinical Notes</Menu.Item>
      )}
      
      <Menu.Item icon={<SettingOutlined />}>Settings</Menu.Item>
    </Menu>
  );
};
```

### 2. Conditional Tab in Visit Detail
**File:** `frontend/src/pages/visits/VisitDetail.tsx`

```typescript
import { useFeatures } from '@/contexts/FeatureContext';

export const VisitDetail: React.FC = () => {
  const features = useFeatures();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs activeKey={activeTab} onChange={setActiveTab}>
      <TabPane tab="Overview" key="overview">...</TabPane>
      <TabPane tab="Vitals" key="vitals">...</TabPane>
      <TabPane tab="Diagnoses" key="diagnoses">...</TabPane>
      
      {/* Conditional tab - only if clinical notes enabled */}
      {features.clinicalNotesEnabled && (
        <TabPane tab="Clinical Notes" key="notes">
          <ClinicalNotesTab visitId={visitId} />
        </TabPane>
      )}
    </Tabs>
  );
};
```

### 3. ICD-10 Required/Optional Logic
**File:** `frontend/src/components/diagnosis/DiagnosisForm.tsx`

```typescript
import { useFeatures } from '@/contexts/FeatureContext';

export const DiagnosisForm: React.FC = () => {
  const features = useFeatures();
  const [useICD10, setUseICD10] = useState(!features.diagnosisFreeText);

  return (
    <Form>
      {/* Show toggle only if free text allowed */}
      {features.diagnosisFreeText && (
        <Form.Item label="Entry Mode">
          <Radio.Group value={useICD10} onChange={(e) => setUseICD10(e.target.value)}>
            <Radio value={true}>Use ICD-10 Code</Radio>
            <Radio value={false}>Free Text Entry</Radio>
          </Radio.Group>
        </Form.Item>
      )}

      {useICD10 || features.icd10Required ? (
        <Form.Item 
          label="ICD-10 Code" 
          name="icd10_code"
          rules={[{ required: features.icd10Required, message: 'ICD-10 code is required' }]}
        >
          <ICD10Search autoSearch={features.autoIcd10Search} />
        </Form.Item>
      ) : null}

      <Form.Item 
        label="Diagnosis Description" 
        name="description"
        rules={[{ required: true, message: 'Description is required' }]}
      >
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  );
};
```

### 4. Admin Settings Page
**File:** `frontend/src/pages/settings/FeatureSettings.tsx`

```typescript
import { useFeatures } from '@/contexts/FeatureContext';

export const FeatureSettings: React.FC = () => {
  const features = useFeatures();
  const [loading, setLoading] = useState(false);

  const handleToggle = async (key: string, value: boolean) => {
    setLoading(true);
    try {
      await api.patch(`/settings/features/${key}`, { value });
      message.success('Feature flag updated');
      // Refresh features
    } catch (error) {
      message.error('Failed to update feature flag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Module Features">
      <List>
        <List.Item>
          <List.Item.Meta 
            title="Clinical Notes Module"
            description="Enable structured clinical notes with SOAP format"
          />
          <Switch 
            checked={features.clinicalNotesEnabled}
            loading={loading}
            onChange={(checked) => handleToggle('clinical_notes_enabled', checked)}
          />
        </List.Item>

        <List.Item>
          <List.Item.Meta 
            title="Require ICD-10 Codes"
            description="Make ICD-10 codes mandatory for all diagnoses"
          />
          <Switch 
            checked={features.icd10Required}
            loading={loading}
            onChange={(checked) => handleToggle('icd10_required', checked)}
          />
        </List.Item>

        <List.Item>
          <List.Item.Meta 
            title="Allow Free Text Diagnoses"
            description="Permit diagnoses without ICD-10 codes"
          />
          <Switch 
            checked={features.diagnosisFreeText}
            disabled={features.icd10Required}
            loading={loading}
            onChange={(checked) => handleToggle('diagnosis_free_text', checked)}
          />
        </List.Item>
      </List>
    </Card>
  );
};
```

---

## Implementation Priority

### Phase 3A-3F
1. **Build features normally** - Implement all modules (vitals, diagnoses, clinical notes)
2. **No feature flags initially** - Focus on functionality first
3. **Add during Phase 3G** - Add feature flag system in integration phase

### Phase 3G: Add Feature Flags
1. Create system_settings table migration
2. Add settings API endpoints
3. Build FeatureContext in frontend
4. Add conditional rendering
5. Create admin settings page
6. Test toggling features on/off

---

## Configuration Examples

### Small Clinic (Minimal Setup)
```json
{
  "clinical_notes_enabled": false,
  "icd10_required": false,
  "diagnosis_free_text": true,
  "vitals_validation_strict": false
}
```

### Multi-Specialty Hospital (Full Setup)
```json
{
  "clinical_notes_enabled": true,
  "icd10_required": true,
  "diagnosis_free_text": false,
  "vitals_validation_strict": true,
  "auto_icd10_search": true
}
```

### Indian Primary Care Center (Flexible)
```json
{
  "clinical_notes_enabled": true,
  "icd10_required": false,
  "diagnosis_free_text": true,
  "vitals_validation_strict": true,
  "auto_icd10_search": false
}
```

---

## Benefits

1. **Flexibility** - Clinics can enable only what they need
2. **Gradual Adoption** - Start simple, add features later
3. **User Training** - Disable advanced features during training
4. **Performance** - Don't load unused modules
5. **Regional Compliance** - Adapt to local requirements
6. **A/B Testing** - Test features with subset of users

---

## Notes

- Feature flags fetched once on app load (cached)
- Admin users can toggle flags in settings
- Changes take effect immediately (refresh or re-login)
- Backend enforces feature flags on API level
- Frontend shows/hides UI based on flags
- Migration system respects flags (skip if disabled)
