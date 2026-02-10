# Phase 1D/1G: Patient Module

## Patient CRUD Flow

```mermaid
flowchart TB
    subgraph UI["Frontend UI"]
        List["PatientList.tsx<br/>Table with search/filter"]
        Create["PatientCreate.tsx<br/>Registration form"]
        Detail["PatientDetail.tsx<br/>View patient info"]
        Edit["PatientEdit.tsx<br/>Update form"]
    end

    subgraph Hooks["React Hooks"]
        UsePatients["usePatients()<br/>List + search"]
        UsePatient["usePatient(id)<br/>Single patient"]
        UseCreate["useCreatePatient()<br/>Create mutation"]
        UseUpdate["useUpdatePatient()<br/>Update mutation"]
        UseDelete["useDeletePatient()<br/>Delete mutation"]
    end

    subgraph Service["patientService.ts"]
        GetAll["getAll(params)"]
        GetById["getById(id)"]
        GetByMRN["getByMRN(mrn)"]
        CreateFn["create(data)"]
        UpdateFn["update(id, data)"]
        DeleteFn["delete(id)"]
    end

    subgraph API["FastAPI /patients"]
        ListAPI["GET /"]
        GetAPI["GET /{id}"]
        MrnAPI["GET /mrn/{mrn}"]
        CreateAPI["POST /"]
        UpdateAPI["PUT /{id}"]
        DeleteAPI["DELETE /{id}"]
    end

    List --> UsePatients --> GetAll --> ListAPI
    Detail --> UsePatient --> GetById --> GetAPI
    Create --> UseCreate --> CreateFn --> CreateAPI
    Edit --> UseUpdate --> UpdateFn --> UpdateAPI
    List --> UseDelete --> DeleteFn --> DeleteAPI
```

## Patient List Page

```mermaid
flowchart TB
    subgraph PatientList["PatientList.tsx"]
        Header["Page Header<br/>+ Create Button"]
        SearchBar["Search Input<br/>Name, MRN, Phone"]
        Table["Ant Design Table<br/>Paginated, Sortable"]
        Actions["Row Actions<br/>View | Edit | Delete"]
    end

    subgraph DataFlow["Data Flow"]
        Hook["usePatients(params)"]
        Cache["React Query Cache"]
        API["GET /api/v1/patients"]
    end

    Header -->|"onClick"| Navigate["/patients/create"]
    SearchBar -->|"onSearch"| Hook
    Table --> Hook
    Actions -->|"View"| DetailNav["/patients/:id"]
    Actions -->|"Edit"| EditNav["/patients/:id/edit"]
    Actions -->|"Delete"| DeleteModal["Confirm Modal"]

    Hook --> Cache --> API
```

## Patient Create Flow

```mermaid
sequenceDiagram
    participant U as User
    participant Form as PatientCreate Form
    participant Hook as useCreatePatient()
    participant Svc as patientService
    participant API as FastAPI
    participant DB as Database

    U->>Form: Fill form fields
    U->>Form: Click "Create"
    Form->>Form: Validate fields
    Form->>Hook: mutate(patientData)
    Hook->>Svc: create(patientData)
    Svc->>API: POST /api/v1/patients
    API->>API: Generate MRN (CLI-YYYY-NNNNN)
    API->>DB: INSERT patient
    DB-->>API: Patient record
    API-->>Svc: Patient response
    Svc-->>Hook: Success
    Hook->>Hook: Invalidate queries
    Hook-->>Form: onSuccess callback
    Form-->>U: Navigate to patient detail
```

## MRN Generation

```mermaid
flowchart LR
    subgraph Generator["mrn_generator.py"]
        GetYear["Get current year"]
        GetNext["Query max MRN for year"]
        Format["Format: CLI-YYYY-NNNNN"]
    end

    subgraph Examples["Examples"]
        E1["CLI-2026-00001"]
        E2["CLI-2026-00002"]
        E3["CLI-2026-00042"]
    end

    GetYear --> GetNext --> Format --> Examples
```

## Patient Data Model

```mermaid
classDiagram
    class Patient {
        +UUID id
        +String mrn
        +String first_name
        +String middle_name
        +String last_name
        +Date date_of_birth
        +Gender gender
        +String phone
        +String email
        +String address_line1
        +String address_line2
        +String city
        +String state
        +String postal_code
        +String country
        +String emergency_contact_name
        +String emergency_contact_phone
        +String emergency_contact_relation
        +BloodGroup blood_group
        +String allergies
        +String medical_notes
        +Boolean is_active
        +DateTime created_at
        +DateTime updated_at
        +UUID created_by
        +UUID updated_by
        --
        +full_name() String
        +age() int
    }

    class Gender {
        <<enumeration>>
        MALE
        FEMALE
        OTHER
    }

    class BloodGroup {
        <<enumeration>>
        A_POSITIVE
        A_NEGATIVE
        B_POSITIVE
        B_NEGATIVE
        O_POSITIVE
        O_NEGATIVE
        AB_POSITIVE
        AB_NEGATIVE
    }

    Patient --> Gender
    Patient --> BloodGroup
```

## Component Hierarchy

```mermaid
flowchart TB
    subgraph Pages["pages/patients/"]
        PatientList["PatientList.tsx"]
        PatientCreate["PatientCreate.tsx"]
        PatientDetail["PatientDetail.tsx"]
        PatientEdit["PatientEdit.tsx"]
    end

    subgraph Components["components/patients/"]
        PatientForm["PatientForm.tsx<br/>Shared form component"]
        PatientCard["PatientCard.tsx<br/>Patient summary card"]
    end

    subgraph Shared["Shared Components"]
        PageHeader["PageHeader"]
        StatusBadge["StatusBadge"]
        ConfirmModal["ConfirmModal"]
        LoadingSpinner["LoadingSpinner"]
    end

    PatientCreate --> PatientForm
    PatientEdit --> PatientForm
    PatientDetail --> PatientCard
    
    Pages --> PageHeader
    PatientDetail --> StatusBadge
    PatientList --> ConfirmModal
    Pages --> LoadingSpinner
```

## API Response Flow

```mermaid
flowchart LR
    subgraph Request["API Request"]
        Req["GET /patients?search=kumar&page=1"]
    end

    subgraph Backend["FastAPI Processing"]
        Parse["Parse query params"]
        Query["Build SQLAlchemy query"]
        Filter["Apply filters"]
        Page["Apply pagination"]
        Execute["Execute query"]
    end

    subgraph Response["API Response"]
        Resp["
        {
          items: [...],
          total: 42,
          page: 1,
          size: 10,
          pages: 5
        }
        "]
    end

    Request --> Parse --> Query --> Filter --> Page --> Execute --> Response
```

---

*Last Updated: January 31, 2026*
