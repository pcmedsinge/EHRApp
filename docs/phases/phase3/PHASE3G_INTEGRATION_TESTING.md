# Phase 3G: Integration & Testing (3-4 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phases 3A-3F Complete  
**Estimated Time:** 3-4 days

---

## Objectives

Complete Phase 3 with:
- Feature flags system implementation
- Admin settings page for feature control
- End-to-end workflow testing
- Performance optimization
- Documentation updates
- Production readiness verification

---

## Deliverables

### 1. System Settings Table Migration
**File:** `backend/alembic/versions/YYYYMMDD_HHMM_create_system_settings.py`

```python
"""Create system settings table for feature flags

Revision ID: XXXXXX
Revises: (previous_revision)
Create Date: 2026-02-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.create_table(
        'system_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('setting_key', sa.String(100), unique=True, nullable=False),
        sa.Column('setting_value', sa.Text, nullable=False),
        sa.Column('data_type', sa.String(20), nullable=False),  # boolean, string, json
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), 
                  sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), 
                  server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    op.create_index('idx_system_settings_key', 'system_settings', ['setting_key'])
    op.create_index('idx_system_settings_category', 'system_settings', ['category'])
    
    # Insert default feature flags
    op.execute("""
        INSERT INTO system_settings (id, setting_key, setting_value, data_type, category, description)
        VALUES 
        (gen_random_uuid(), 'clinical_notes_enabled', 'true', 'boolean', 'module_features', 'Enable/disable clinical notes module'),
        (gen_random_uuid(), 'icd10_required', 'false', 'boolean', 'module_features', 'Require ICD-10 codes in diagnoses'),
        (gen_random_uuid(), 'vitals_validation_strict', 'true', 'boolean', 'module_features', 'Strict validation for vital signs'),
        (gen_random_uuid(), 'diagnosis_free_text', 'true', 'boolean', 'module_features', 'Allow non-coded diagnoses'),
        (gen_random_uuid(), 'auto_icd10_search', 'false', 'boolean', 'module_features', 'Auto-search ICD-10 as user types')
    """)

def downgrade():
    op.drop_table('system_settings')
```

---

### 2. Settings Model & Schema
**File:** `backend/app/models/system_setting.py`

```python
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel

class SystemSetting(BaseModel):
    """System-wide feature flags and settings"""
    __tablename__ = "system_settings"
    
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(Text, nullable=False)
    data_type = Column(String(20), nullable=False)
    category = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
```

**File:** `backend/app/schemas/settings.py`

```python
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class FeatureFlags(BaseModel):
    """Feature flags response"""
    clinical_notes_enabled: bool = True
    icd10_required: bool = False
    vitals_validation_strict: bool = True
    diagnosis_free_text: bool = True
    auto_icd10_search: bool = False

class SettingUpdate(BaseModel):
    """Update setting value"""
    value: str
```

---

### 3. Settings Service & Router
**File:** `backend/app/api/v1/settings/service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict
from app.models.system_setting import SystemSetting
from app.schemas.settings import FeatureFlags

class SettingsService:
    @staticmethod
    async def get_feature_flags(db: AsyncSession) -> FeatureFlags:
        """Get all feature flags"""
        stmt = select(SystemSetting).where(
            SystemSetting.category == 'module_features'
        )
        result = await db.execute(stmt)
        settings = result.scalars().all()
        
        flags = {}
        for setting in settings:
            # Convert string to boolean
            if setting.data_type == 'boolean':
                flags[setting.setting_key] = setting.setting_value.lower() == 'true'
        
        return FeatureFlags(**flags)
    
    @staticmethod
    async def update_feature_flag(
        db: AsyncSession,
        key: str,
        value: bool,
        user_id: UUID
    ) -> SystemSetting:
        """Update feature flag"""
        stmt = select(SystemSetting).where(SystemSetting.setting_key == key)
        result = await db.execute(stmt)
        setting = result.scalar_one_or_none()
        
        if not setting:
            raise NotFoundException(f"Setting {key} not found")
        
        setting.setting_value = 'true' if value else 'false'
        setting.updated_by = user_id
        
        await db.commit()
        await db.refresh(setting)
        
        return setting
```

**File:** `backend/app/api/v1/settings/router.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user, require_admin
from app.schemas.settings import FeatureFlags, SettingUpdate
from app.api.v1.settings.service import SettingsService

router = APIRouter()

@router.get("/features", response_model=FeatureFlags)
async def get_feature_flags(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all feature flags (public)"""
    return await SettingsService.get_feature_flags(db)

@router.patch("/features/{key}")
async def update_feature_flag(
    key: str,
    update: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Update feature flag (admin only)"""
    value = update.value.lower() == 'true'
    return await SettingsService.update_feature_flag(db, key, value, current_user.id)
```

---

### 4. Feature Context (Frontend)
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
    const fetchFeatures = async () => {
      try {
        const response = await api.get<FeatureFlags>('/settings/features');
        setFeatures(response.data);
      } catch (error) {
        console.error('Failed to fetch feature flags:', error);
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

---

### 5. Admin Settings Page
**File:** `frontend/src/pages/settings/FeatureSettings.tsx`

```typescript
import React from 'react';
import { Card, List, Switch, Typography, message, Space, Tag } from 'antd';
import { useFeatures } from '@/contexts/FeatureContext';
import { api } from '@/services/api';

const { Title, Text } = Typography;

export const FeatureSettings: React.FC = () => {
  const features = useFeatures();
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleToggle = async (key: string, value: boolean) => {
    setLoading(key);
    try {
      await api.patch(`/settings/features/${key}`, { value: value.toString() });
      message.success('Feature flag updated successfully');
      // Refresh page to reload features
      window.location.reload();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to update feature flag');
    } finally {
      setLoading(null);
    }
  };

  const featureList = [
    {
      key: 'clinical_notes_enabled',
      title: 'Clinical Notes Module',
      description: 'Enable structured clinical notes with SOAP format',
      value: features.clinicalNotesEnabled,
      tag: 'Module'
    },
    {
      key: 'icd10_required',
      title: 'Require ICD-10 Codes',
      description: 'Make ICD-10 codes mandatory for all diagnoses',
      value: features.icd10Required,
      tag: 'Validation'
    },
    {
      key: 'diagnosis_free_text',
      title: 'Allow Free Text Diagnoses',
      description: 'Permit diagnoses without ICD-10 codes',
      value: features.diagnosisFreeText,
      tag: 'Flexibility'
    },
    {
      key: 'vitals_validation_strict',
      title: 'Strict Vitals Validation',
      description: 'Enforce strict validation rules for vital signs',
      value: features.vitalsValidationStrict,
      tag: 'Validation'
    },
    {
      key: 'auto_icd10_search',
      title: 'Auto ICD-10 Search',
      description: 'Automatically search ICD-10 codes as user types',
      value: features.autoIcd10Search,
      tag: 'UX'
    }
  ];

  return (
    <Card title={<Title level={4}>Feature Flags & Module Settings</Title>}>
      <List
        itemLayout="horizontal"
        dataSource={featureList}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Switch
                checked={item.value}
                loading={loading === item.key}
                onChange={(checked) => handleToggle(item.key, checked)}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  {item.title}
                  <Tag color={item.value ? 'green' : 'default'}>{item.tag}</Tag>
                </Space>
              }
              description={item.description}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};
```

---

## End-to-End Testing Scenarios

### Test Scenario 1: Complete Visit Workflow
```
1. Login as receptionist
2. Create new patient
3. Schedule visit
4. Login as nurse
5. Record vitals (BP, pulse, temp, weight)
6. Verify BMI auto-calculation
7. Login as doctor
8. View patient with vitals
9. Add diagnosis (try both ICD-10 and free text)
10. Add clinical note (SOAP format)
11. Lock/sign note
12. Verify note cannot be edited
13. Logout
```

### Test Scenario 2: ICD-10 Search Performance
```
1. Login as doctor
2. Open diagnosis form
3. Start typing "diab"
4. Measure search response time (<100ms)
5. Verify autocomplete shows results
6. Select "E11.9"
7. Verify description auto-fills
8. Verify diagnosis saves with code
```

### Test Scenario 3: Feature Flag Toggling
```
1. Login as admin
2. Go to Settings → Features
3. Toggle "Clinical Notes Enabled" OFF
4. Verify "Clinical Notes" tab disappears from visit detail
5. Verify "Clinical Notes" menu item hidden
6. Toggle back ON
7. Verify tab and menu reappear
```

### Test Scenario 4: Auto-Save Clinical Notes
```
1. Login as doctor
2. Open visit
3. Go to Clinical Notes tab
4. Start typing in Subjective field
5. Wait 30 seconds
6. Verify "Last saved" timestamp appears
7. Close browser tab
8. Reopen visit
9. Verify notes persisted
```

---

## Performance Testing Checklist

- [ ] ICD-10 search responds in <100ms
- [ ] Vitals form loads in <500ms
- [ ] Diagnosis list renders in <300ms
- [ ] Clinical notes auto-save doesn't block UI
- [ ] Patient history loads paginated data
- [ ] Feature flags cached for 5 minutes
- [ ] API responses gzipped
- [ ] Database queries use proper indexes

---

## Integration Testing Checklist

### Phase 3A-3B: Vitals
- [ ] Create vitals with all fields
- [ ] BMI calculates correctly
- [ ] Validation rejects invalid ranges
- [ ] Vitals display in visit detail
- [ ] Vitals history shows trends

### Phase 3C-3D: Diagnosis
- [ ] ICD-10 search works
- [ ] Create diagnosis with ICD-10
- [ ] Create diagnosis without ICD-10
- [ ] Only one primary diagnosis per visit
- [ ] Diagnosis history shows all records
- [ ] Edit and delete diagnosis

### Phase 3E-3F: Clinical Notes
- [ ] Create SOAP note
- [ ] Template pre-fills sections
- [ ] Auto-save works
- [ ] Lock/sign note
- [ ] Cannot edit locked note
- [ ] Feature flag hides module

### Phase 3G: Feature Flags
- [ ] Feature flags load from backend
- [ ] Admin can toggle flags
- [ ] Changes take effect immediately
- [ ] Settings page accessible to admin only

---

## Documentation Updates

### Update README
- [ ] Add Phase 3 features to README
- [ ] Update feature list
- [ ] Add screenshots
- [ ] Update installation instructions

### API Documentation
- [ ] Update Swagger docs
- [ ] Add Phase 3 endpoints
- [ ] Update Postman collection

### User Manual
- [ ] Document vitals entry workflow
- [ ] Document diagnosis workflow (coded and non-coded)
- [ ] Document clinical notes workflow
- [ ] Document feature flags for administrators

---

## Success Criteria

- ✅ All Phase 3 features working end-to-end
- ✅ Performance benchmarks met
- ✅ Feature flags system functional
- ✅ No critical bugs in testing
- ✅ Documentation complete
- ✅ Code reviewed and approved
- ✅ Production deployment ready

---

## Production Readiness Checklist

### Code Quality
- [ ] All TypeScript types defined
- [ ] No console.log in production code
- [ ] Error handling comprehensive
- [ ] Loading states implemented
- [ ] Empty states handled

### Security
- [ ] Role-based access enforced
- [ ] Input validation on backend
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention
- [ ] CSRF protection enabled

### Performance
- [ ] Database indexes optimized
- [ ] API responses cached where appropriate
- [ ] Frontend code splitting
- [ ] Images optimized
- [ ] Bundle size acceptable

### Monitoring
- [ ] Error logging configured
- [ ] Performance monitoring enabled
- [ ] Database query monitoring
- [ ] API endpoint monitoring

---

## Known Issues & Limitations

**Document any issues found during testing:**
- Issue 1: [Description and workaround]
- Issue 2: [Description and workaround]

---

## Next Steps

After Phase 3 completion:
- [ ] Deploy to staging environment
- [ ] User acceptance testing
- [ ] Training for medical staff
- [ ] Production deployment
- [ ] Monitor for issues

Then proceed to:
→ **Phase 4:** Medications & Prescriptions  
→ **Phase 5:** Billing & Appointments  
→ **Phase 6:** Reports & Analytics

---

**Documentation Version:** 1.0  
**Last Updated:** February 3, 2026
