# Phase 1A/1B: Infrastructure & Backend Structure

## Docker Infrastructure (Phase 1A)

```mermaid
flowchart TB
    subgraph Host["🖥️ Host Machine"]
        subgraph DockerCompose["docker-compose.yml"]
            subgraph Network["ehr_network (bridge)"]
                PG["🐘 ehr_postgres<br/>PostgreSQL 16<br/>Port: 5433:5432"]
                Orthanc["🏥 ehr_orthanc<br/>Orthanc DICOM<br/>Ports: 8042, 4242"]
            end
        end
        
        subgraph Volumes["Persistent Volumes"]
            PGData["postgres_data"]
            OrthancData["orthanc_data"]
        end

        subgraph DevEnvironment["Development Environment"]
            Backend["Backend (venv)<br/>Python 3.11+<br/>Port: 8000"]
            Frontend["Frontend (node)<br/>Node.js 18+<br/>Port: 3000"]
        end
    end

    PG --> PGData
    Orthanc --> OrthancData
    Backend -->|"SQLAlchemy"| PG
    Frontend -->|"HTTP"| Backend

    style DockerCompose fill:#2496ed20,stroke:#2496ed
    style DevEnvironment fill:#4caf5020,stroke:#4caf50
```

## Backend Code Structure (Phase 1B)

```mermaid
flowchart TB
    subgraph Backend["backend/"]
        MainPy["main.py<br/>FastAPI Application"]
        
        subgraph App["app/"]
            subgraph Core["core/"]
                Config["config.py<br/>Settings & Environment"]
                Security["security.py<br/>JWT & Password"]
                Database["database.py<br/>Session Factory"]
            end
            
            subgraph Models["models/"]
                Base["base.py<br/>Base Model"]
                User["user.py<br/>User Model"]
                Patient["patient.py<br/>Patient Model"]
            end
            
            subgraph Schemas["schemas/"]
                UserSchema["user.py<br/>User Schemas"]
                PatientSchema["patient.py<br/>Patient Schemas"]
                AuthSchema["auth.py<br/>Auth Schemas"]
            end
            
            subgraph API["api/v1/"]
                AuthRouter["auth.py<br/>/auth endpoints"]
                UserRouter["users.py<br/>/users endpoints"]
                PatientRouter["patients.py<br/>/patients endpoints"]
            end
            
            subgraph Services["services/"]
                AuthSvc["auth_service.py"]
                UserSvc["user_service.py"]
                PatientSvc["patient_service.py"]
            end
            
            subgraph Utils["utils/"]
                MRNGen["mrn_generator.py<br/>CLI-YYYY-NNNNN"]
            end
        end
        
        Alembic["alembic/<br/>Database Migrations"]
        Venv["venv/<br/>Virtual Environment"]
    end

    MainPy --> Core
    MainPy --> API
    API --> Services
    Services --> Models
    Models --> Core
```

## File Responsibilities

### Core (`app/core/`)

| File | Purpose | Phase |
|------|---------|-------|
| `config.py` | Environment variables, database URL, JWT settings | 1B |
| `database.py` | SQLAlchemy engine, session factory, get_db dependency | 1B |
| `security.py` | Password hashing (Argon2), JWT encode/decode | 1C |

### Models (`app/models/`)

| File | Purpose | Phase |
|------|---------|-------|
| `base.py` | Base class with id, timestamps, is_active | 1B |
| `user.py` | User model with role enum | 1C |
| `patient.py` | Patient model with MRN, demographics | 1D |

### API (`app/api/v1/`)

| File | Purpose | Phase |
|------|---------|-------|
| `auth.py` | Login, logout, me, refresh endpoints | 1C |
| `users.py` | User CRUD (admin only) | 1C |
| `patients.py` | Patient CRUD, search, MRN lookup | 1D |

## Development Scripts

```mermaid
flowchart LR
    subgraph Scripts["Shell Scripts"]
        Setup["setup.sh<br/>Initial setup"]
        DevStart["dev-start.sh<br/>Start all services"]
        DevStop["dev-stop.sh<br/>Stop all services"]
        DevStatus["dev-status.sh<br/>Check status"]
        DockerUp["docker-up.sh<br/>Start containers"]
        DockerDown["docker-down.sh<br/>Stop containers"]
    end

    Setup -->|"Creates venv, installs deps"| DevStart
    DevStart -->|"Runs"| DockerUp
    DevStart -->|"Starts"| Backend["Backend Server"]
    DevStart -->|"Starts"| Frontend["Frontend Server"]
```

---

*Last Updated: January 31, 2026*
