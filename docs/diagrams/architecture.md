# EHR Application - System Architecture

## Overall Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ Client Layer"]
        Browser["Web Browser"]
    end

    subgraph Frontend["⚛️ Frontend (React + TypeScript)"]
        ReactApp["React Application<br/>Port: 3000"]
        subgraph FE_Components["Components"]
            Pages["Pages"]
            Components["UI Components"]
            Hooks["React Query Hooks"]
        end
        subgraph FE_Services["Services"]
            ApiClient["API Client (Axios)"]
            AuthService["Auth Service"]
            PatientService["Patient Service"]
        end
    end

    subgraph Backend["🐍 Backend (FastAPI + Python)"]
        FastAPI["FastAPI Server<br/>Port: 8000"]
        subgraph BE_Layers["Application Layers"]
            API["API Routers"]
            Services["Business Services"]
            Models["SQLAlchemy Models"]
        end
        subgraph BE_Core["Core Services"]
            Auth["JWT Authentication"]
            Security["Password Hashing<br/>(Argon2)"]
            Database["Database Session"]
        end
    end

    subgraph Infrastructure["🐳 Infrastructure (Docker)"]
        PostgreSQL["PostgreSQL 16<br/>Port: 5433"]
        Orthanc["Orthanc DICOM<br/>Port: 8042"]
    end

    Browser --> ReactApp
    ReactApp --> ApiClient
    ApiClient -->|"HTTP/REST"| FastAPI
    FastAPI --> API
    API --> Services
    Services --> Models
    Models -->|"SQLAlchemy"| PostgreSQL
    BE_Core --> PostgreSQL

    style Frontend fill:#61dafb20,stroke:#61dafb
    style Backend fill:#3776ab20,stroke:#3776ab
    style Infrastructure fill:#2496ed20,stroke:#2496ed
```

## Component Communication

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as React App
    participant A as Axios Client
    participant F as FastAPI
    participant S as Service Layer
    participant D as Database

    B->>R: User Action
    R->>A: API Call
    A->>F: HTTP Request + JWT
    F->>F: Validate Token
    F->>S: Business Logic
    S->>D: Query/Mutation
    D-->>S: Result
    S-->>F: Response Data
    F-->>A: JSON Response
    A-->>R: Update State
    R-->>B: Render UI
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 | UI Framework |
| | TypeScript | Type Safety |
| | Ant Design 5 | UI Component Library |
| | React Query | Server State Management |
| | Axios | HTTP Client |
| | React Router 6 | Client-side Routing |
| **Backend** | FastAPI | REST API Framework |
| | Python 3.11+ | Programming Language |
| | SQLAlchemy 2.0 | ORM |
| | Pydantic 2.0 | Data Validation |
| | Alembic | Database Migrations |
| | Argon2 | Password Hashing |
| | PyJWT | JSON Web Tokens |
| **Database** | PostgreSQL 16 | Primary Database |
| **DICOM** | Orthanc | Medical Imaging Server |
| **DevOps** | Docker Compose | Container Orchestration |

## Port Mapping

| Service | Port | Description |
|---------|------|-------------|
| Frontend (Vite) | 3000 | React Development Server |
| Backend (FastAPI) | 8000 | API Server |
| PostgreSQL | 5433 | Database (mapped from 5432) |
| Orthanc HTTP | 8042 | DICOM Web Interface |
| Orthanc DICOM | 4242 | DICOM Protocol |

---

*Last Updated: January 31, 2026*
