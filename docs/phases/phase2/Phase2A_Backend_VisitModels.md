# Phase 2A: Visit Backend - Models & Schema

**Sub-Phase:** 2A  
**Estimated Time:** 3-4 hours  
**Prerequisites:** Phase 1 Complete

---

## 1. Objective

Create the Visit database model, Pydantic schemas, enums, and visit number generator. Establish the data foundation for the visit management module.

---

## 2. Deliverables

- [ ] Visit status enum
- [ ] Visit type enum
- [ ] Priority enum
- [ ] Visit SQLAlchemy model
- [ ] Visit Pydantic schemas (Create, Update, Response, List, StatusUpdate)
- [ ] Visit number generator utility (VIS-YYYY-NNNNN)
- [ ] **SystemSetting model (for feature flags)**
- [ ] **SystemSetting Pydantic schemas**
- [ ] Database migration for visits and system_settings tables
- [ ] Seed default feature flags
- [ ] Model unit tests
- [ ] Update models __init__.py

---

## 3. Files to Create/Modify

```
backend/app/
├── models/
│   ├── __init__.py              # Add Visit, SystemSetting exports
│   ├── enums.py                 # Add visit-related enums
│   ├── visit.py                 # NEW: Visit SQLAlchemy model
│   └── system_setting.py        # NEW: SystemSetting model
├── schemas/
│   ├── __init__.py              # Add schema exports
│   ├── visit.py                 # NEW: Visit Pydantic schemas
│   └── system_setting.py        # NEW: SystemSetting schemas
└── utils/
    └── visit_number_generator.py  # NEW: Visit number generation
```

---

## 4. Implementation Details

### 4.1 Enums

Add to `backend/app/models/enums.py`:

```python
from enum import Enum

class VisitStatus(str, Enum):
    """Visit status enum"""
    REGISTERED = "registered"      # Patient checked in
    WAITING = "waiting"            # In waiting area
    IN_PROGRESS = "in_progress"    # With doctor
    COMPLETED = "completed"        # Consultation done
    CANCELLED = "cancelled"        # Visit cancelled

class VisitType(str, Enum):
    """Visit type enum"""
    CONSULTATION = "consultation"  # New consultation
    FOLLOW_UP = "follow_up"        # Follow-up visit
    EMERGENCY = "emergency"        # Emergency visit
    PROCEDURE = "procedure"        # Procedure/test

class Priority(str, Enum):
    """Visit priority enum"""
    NORMAL = "normal"
    URGENT = "urgent"
    EMERGENCY = "emergency"
```

### 4.2 Visit Model Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Primary key |
| visit_number | String(20) | Auto | VIS-YYYY-NNNNN |
| patient_id | UUID FK | Yes | Reference to patient |
| assigned_doctor_id | UUID FK | No | Reference to doctor user |
| visit_date | Date | Yes | Date of visit |
| visit_type | Enum | Yes | consultation/follow_up/emergency/procedure |
| status | Enum | Yes | Current status (default: registered) |
| priority | Enum | Yes | normal/urgent/emergency (default: normal) |
| department | String(100) | No | Department name |
| chief_complaint | Text | No | Main complaint/reason |
| check_in_time | DateTime | Auto | When patient checked in |
| consultation_start_time | DateTime | No | When consultation started |
| consultation_end_time | DateTime | No | When consultation ended |
| cancellation_reason | Text | No | Reason if cancelled |
| notes | Text | No | Additional notes |
| is_active | Boolean | Auto | Soft delete flag |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Last update timestamp |
| created_by | UUID FK | No | User who created |
| updated_by | UUID FK | No | User who last updated |

### 4.3 Visit Number Format

Format: `VIS-YYYY-NNNNN`
- VIS: Fixed prefix
- YYYY: 4-digit year
- NNNNN: 5-digit sequential number (padded with zeros)

Examples:
- VIS-2026-00001
- VIS-2026-00042
- VIS-2026-12345

The counter resets each year.

### 4.4 Pydantic Schemas

| Schema | Purpose |
|--------|---------|
| VisitBase | Common fields for all visit schemas |
| VisitCreate | Input for creating a visit |
| VisitUpdate | Input for updating a visit |
| VisitStatusUpdate | Input for status-only updates |
| VisitResponse | Output with computed fields |
| VisitListResponse | Paginated list response |
| VisitSummary | Minimal visit info for lists |

### 4.5 Computed Properties

| Property | Calculation |
|----------|-------------|
| patient_name | From patient relationship |
| doctor_name | From assigned_doctor relationship |
| wait_time_minutes | Time since check_in_time (if waiting) |
| consultation_duration | consultation_end - consultation_start |

---

## 5. Status Transition Rules

| Current Status | Allowed Next Status |
|----------------|---------------------|
| registered | waiting, cancelled |
| waiting | in_progress, cancelled |
| in_progress | completed, cancelled |
| completed | (terminal state) |
| cancelled | (terminal state) |

Note: These rules should be enforced in the service layer (Phase 2B).

---

## 6. Database Migration

Migration will create the `visits` table with:
- All columns from model
- Foreign key constraints to patients and users
- Indexes on: visit_number, patient_id, assigned_doctor_id, visit_date, status
- Unique constraint on visit_number

---

## 7. Relationships

```
Visit
├── patient (Many-to-One → Patient)
├── assigned_doctor (Many-to-One → User)
├── created_by_user (Many-to-One → User)
└── updated_by_user (Many-to-One → User)

Patient
└── visits (One-to-Many → Visit)

User (Doctor)
└── assigned_visits (One-to-Many → Visit)
```

---

## 8. Verification Checklist

- [ ] VisitStatus, VisitType, Priority enums created
- [ ] Visit model has all required fields
- [ ] Visit model has proper foreign keys
- [ ] Visit model has relationships defined
- [ ] Visit number generator works correctly
- [ ] Visit number resets yearly
- [ ] All Pydantic schemas created
- [ ] Schemas have proper validation
- [ ] Database migration runs successfully
- [ ] Can create visit record directly in DB
- [ ] Models exported from __init__.py

---

## 9. Testing

```bash
# After implementation, verify:

# 1. Run migration
cd backend && alembic upgrade head

# 2. Check table exists
docker exec ehr_postgres psql -U ehr_user -d ehr_db -c "\d visits"

# 3. Test visit number generator (in Python shell)
from app.utils.visit_number_generator import generate_visit_number
# Should return VIS-2026-00001 for first visit of 2026
```

---

## 10. System Settings (Feature Flags)

Add a simple key-value settings table to control optional features:

### 10.1 SystemSetting Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Auto | Primary key |
| key | String(100) | Yes | Setting key (unique) |
| value | String(500) | Yes | Setting value |
| description | Text | No | Human-readable description |
| category | String(50) | No | Grouping (features, display, etc.) |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Last update timestamp |

### 10.2 Default Feature Flags

Insert these defaults during migration:

```sql
INSERT INTO system_settings (key, value, description, category) VALUES
('VISIT_QUEUE_ENABLED', 'false', 'Enable queue management UI', 'features'),
('VISIT_SCHEDULING_ENABLED', 'false', 'Enable future date scheduling', 'features');
```

### 10.3 Usage in Frontend

```typescript
// hooks/useFeatureFlags.ts
export const useFeatureFlags = () => {
  const { data } = useQuery(['settings'], settingsService.getAll);
  
  return {
    isQueueEnabled: data?.VISIT_QUEUE_ENABLED === 'true',
    isSchedulingEnabled: data?.VISIT_SCHEDULING_ENABLED === 'true',
  };
};

// Conditional rendering
{featureFlags.isQueueEnabled && (
  <Menu.Item key="queue">Visit Queue</Menu.Item>
)}
```

### 10.4 API Endpoint

```
GET /api/v1/settings/features  → Returns feature flags (public)
PUT /api/v1/settings/{key}     → Update setting (admin only)
```

---

## 11. Notes

- Visit number must be unique and auto-generated
- Soft delete using is_active flag (same pattern as patients)
- Status transitions will be validated in service layer (Phase 2B)
- Keep model lean, avoid business logic in model
- Use UTC for all timestamps

---

*End of Phase 2A*
