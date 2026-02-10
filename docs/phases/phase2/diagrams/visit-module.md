# Phase 2A: Visit Module Architecture

## Visit Data Model

```mermaid
classDiagram
    class Visit {
        +UUID id
        +String visit_number
        +UUID patient_id
        +UUID assigned_doctor_id
        +Date visit_date
        +VisitType visit_type
        +VisitStatus status
        +Priority priority
        +String department
        +Text chief_complaint
        +DateTime check_in_time
        +DateTime consultation_start_time
        +DateTime consultation_end_time
        +Text cancellation_reason
        +Text notes
        +Boolean is_deleted
        +DateTime created_at
        +DateTime updated_at
        +UUID created_by
        +UUID updated_by
    }

    class VisitStatus {
        <<enumeration>>
        REGISTERED
        WAITING
        IN_PROGRESS
        COMPLETED
        CANCELLED
    }

    class VisitType {
        <<enumeration>>
        CONSULTATION
        FOLLOW_UP
        EMERGENCY
        PROCEDURE
    }

    class Priority {
        <<enumeration>>
        NORMAL
        URGENT
        EMERGENCY
    }

    class Patient {
        +UUID id
        +String mrn
        +String full_name
    }

    class User {
        +UUID id
        +String full_name
        +UserRole role
    }

    class SystemSetting {
        +UUID id
        +String key
        +String value
        +String category
    }

    Visit --> VisitStatus
    Visit --> VisitType
    Visit --> Priority
    Visit "*" --> "1" Patient : patient
    Visit "*" --> "0..1" User : assigned_doctor
    Visit "*" --> "0..1" User : created_by
```

## Backend File Structure (Phase 2A)

```mermaid
flowchart TB
    subgraph Models["app/models/"]
        Enums["enums.py<br/>VisitStatus, VisitType, Priority"]
        VisitModel["visit.py<br/>Visit SQLAlchemy model"]
        SettingModel["system_setting.py<br/>SystemSetting model"]
        ModelsInit["__init__.py<br/>Export all models"]
    end

    subgraph Schemas["app/schemas/"]
        VisitSchema["visit.py<br/>VisitCreate, VisitResponse, etc."]
        SettingSchema["system_setting.py<br/>FeatureFlagsResponse"]
        SchemasInit["__init__.py<br/>Export all schemas"]
    end

    subgraph Utils["app/utils/"]
        VisitNumGen["visit_number_generator.py<br/>VIS-YYYY-NNNNN"]
    end

    subgraph Migration["alembic/versions/"]
        MigrationFile["20260131_2000_..._add_visits_and_settings.py"]
    end

    VisitModel --> Enums
    VisitSchema --> Enums
    ModelsInit --> VisitModel
    ModelsInit --> SettingModel
    SchemasInit --> VisitSchema
    SchemasInit --> SettingSchema
```

## Schema Relationships

```mermaid
flowchart LR
    subgraph Input["Input Schemas"]
        VisitCreate["VisitCreate<br/>patient_id, type, etc."]
        VisitUpdate["VisitUpdate<br/>All optional"]
        VisitStatusUpdate["VisitStatusUpdate<br/>status, cancellation_reason"]
    end

    subgraph Output["Output Schemas"]
        VisitResponse["VisitResponse<br/>Full visit + patient + doctor"]
        VisitSummary["VisitSummary<br/>Minimal for lists"]
        VisitListResponse["VisitListResponse<br/>Paginated list"]
    end

    subgraph Nested["Nested Schemas"]
        PatientSummary["PatientSummary<br/>id, mrn, full_name"]
        DoctorSummary["DoctorSummary<br/>id, full_name"]
    end

    VisitResponse --> PatientSummary
    VisitResponse --> DoctorSummary
    VisitListResponse --> VisitSummary
```

## Visit Number Generation

```mermaid
sequenceDiagram
    participant API as API Endpoint
    participant Gen as VisitNumberGenerator
    participant DB as Database

    API->>Gen: generate(db)
    Gen->>DB: SELECT COUNT(*) FROM visits<br/>WHERE visit_number LIKE 'VIS-2026-%'
    DB-->>Gen: count = 41
    Gen->>Gen: next_number = 42
    Gen->>Gen: format = "VIS-2026-00042"
    Gen-->>API: "VIS-2026-00042"
```

## Files Created in Phase 2A

| File | Purpose | Lines |
|------|---------|-------|
| `app/models/enums.py` | Visit status, type, priority enums | ~80 |
| `app/models/visit.py` | Visit SQLAlchemy model | ~200 |
| `app/models/system_setting.py` | SystemSetting model | ~100 |
| `app/schemas/visit.py` | Visit Pydantic schemas | ~230 |
| `app/schemas/system_setting.py` | Setting schemas | ~80 |
| `app/utils/visit_number_generator.py` | Visit number generator | ~130 |
| `alembic/versions/..._add_visits_and_settings.py` | Database migration | ~150 |

---

*Last Updated: January 31, 2026*
