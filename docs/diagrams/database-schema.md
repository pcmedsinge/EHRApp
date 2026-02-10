# EHR Application - Database Schema

## Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string username UK
        string email UK
        string password_hash
        string full_name
        enum role "admin|doctor|nurse|receptionist"
        boolean is_active
        datetime last_login
        datetime created_at
        datetime updated_at
    }

    PATIENTS {
        uuid id PK
        string mrn UK "CLI-YYYY-NNNNN"
        string first_name
        string middle_name
        string last_name
        date date_of_birth
        enum gender "male|female|other"
        string phone UK
        string email
        string address_line1
        string address_line2
        string city
        string state
        string postal_code
        string country
        string emergency_contact_name
        string emergency_contact_phone
        string emergency_contact_relation
        enum blood_group
        string allergies
        string medical_notes
        boolean is_active
        datetime created_at
        datetime updated_at
        uuid created_by FK
        uuid updated_by FK
    }

    SYSTEM_SETTINGS {
        uuid id PK
        string key UK
        string value
        string description
        string category
        datetime created_at
        datetime updated_at
    }

    VISITS {
        uuid id PK
        string visit_number UK "VIS-YYYY-NNNNN"
        uuid patient_id FK
        uuid assigned_doctor_id FK
        date visit_date
        enum visit_type "consultation|follow_up|emergency|procedure"
        enum status "registered|waiting|in_progress|completed|cancelled"
        enum priority "normal|urgent|emergency"
        string department
        text chief_complaint
        datetime check_in_time
        datetime consultation_start_time
        datetime consultation_end_time
        text cancellation_reason
        text notes
        boolean is_active
        datetime created_at
        datetime updated_at
        uuid created_by FK
        uuid updated_by FK
    }

    USERS ||--o{ PATIENTS : "created/updated"
    USERS ||--o{ VISITS : "assigned_doctor"
    USERS ||--o{ VISITS : "created/updated"
    PATIENTS ||--o{ VISITS : "has"
```

## Phase Implementation Status

| Entity | Phase | Status |
|--------|-------|--------|
| USERS | 1B, 1C | ✅ Complete |
| PATIENTS | 1D | ✅ Complete |
| SYSTEM_SETTINGS | 2A | 📋 Planned |
| VISITS | 2A | 📋 Planned |

## Table Indexes

### users
- `ix_users_username` (unique)
- `ix_users_email` (unique)
- `ix_users_role`
- `ix_users_is_active`

### patients
- `ix_patients_mrn` (unique)
- `ix_patients_phone` (unique)
- `ix_patients_last_name`
- `ix_patients_is_active`

### visits (Planned - Phase 2A)
- `ix_visits_visit_number` (unique)
- `ix_visits_patient_id`
- `ix_visits_assigned_doctor_id`
- `ix_visits_visit_date`
- `ix_visits_status`

## MRN/Visit Number Formats

| Type | Format | Example | Resets |
|------|--------|---------|--------|
| Patient MRN | CLI-YYYY-NNNNN | CLI-2026-00001 | Yearly |
| Visit Number | VIS-YYYY-NNNNN | VIS-2026-00042 | Yearly |

---

*Last Updated: January 31, 2026*
