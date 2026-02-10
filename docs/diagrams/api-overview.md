# EHR Application - API Endpoints Overview

## API Structure

```mermaid
flowchart LR
    subgraph API["/api/v1"]
        subgraph Auth["/auth"]
            A1["POST /login"]
            A2["POST /logout"]
            A3["GET /me"]
            A4["POST /refresh"]
        end

        subgraph Users["/users"]
            U1["GET /"]
            U2["POST /"]
            U3["GET /{id}"]
            U4["PUT /{id}"]
            U5["DELETE /{id}"]
        end

        subgraph Patients["/patients"]
            P1["GET /"]
            P2["POST /"]
            P3["GET /{id}"]
            P4["PUT /{id}"]
            P5["DELETE /{id}"]
            P6["GET /mrn/{mrn}"]
            P7["GET /search"]
        end

        subgraph Visits["/visits - Phase 2"]
            V1["GET /"]
            V2["POST /"]
            V3["GET /{id}"]
            V4["PUT /{id}"]
            V5["PATCH /{id}/status"]
            V6["GET /patient/{patient_id}"]
            V7["GET /today"]
            V8["GET /queue"]
        end

        subgraph Settings["/settings - Phase 2"]
            S1["GET /features"]
            S2["PUT /{key}"]
        end
    end
```

## Endpoint Details

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth | Phase |
|--------|----------|-------------|------|-------|
| POST | `/login` | User login, returns JWT | ❌ | 1C |
| POST | `/logout` | Invalidate token | ✅ | 1C |
| GET | `/me` | Get current user info | ✅ | 1C |
| POST | `/refresh` | Refresh access token | ✅ | 1C |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth | Role | Phase |
|--------|----------|-------------|------|------|-------|
| GET | `/` | List all users | ✅ | Admin | 1C |
| POST | `/` | Create new user | ✅ | Admin | 1C |
| GET | `/{id}` | Get user by ID | ✅ | Admin | 1C |
| PUT | `/{id}` | Update user | ✅ | Admin | 1C |
| DELETE | `/{id}` | Deactivate user | ✅ | Admin | 1C |

### Patients (`/api/v1/patients`)

| Method | Endpoint | Description | Auth | Phase |
|--------|----------|-------------|------|-------|
| GET | `/` | List patients (paginated) | ✅ | 1D |
| POST | `/` | Create new patient | ✅ | 1D |
| GET | `/{id}` | Get patient by ID | ✅ | 1D |
| PUT | `/{id}` | Update patient | ✅ | 1D |
| DELETE | `/{id}` | Soft delete patient | ✅ | 1D |
| GET | `/mrn/{mrn}` | Get patient by MRN | ✅ | 1D |
| GET | `/search` | Search patients | ✅ | 1D |

### Visits (`/api/v1/visits`) - Phase 2

| Method | Endpoint | Description | Auth | Phase |
|--------|----------|-------------|------|-------|
| GET | `/` | List visits (filtered) | ✅ | 2B |
| POST | `/` | Create new visit | ✅ | 2B |
| GET | `/{id}` | Get visit by ID | ✅ | 2B |
| PUT | `/{id}` | Update visit | ✅ | 2B |
| PATCH | `/{id}/status` | Update status only | ✅ | 2B |
| DELETE | `/{id}` | Cancel visit | ✅ | 2B |
| GET | `/patient/{patient_id}` | Patient visit history | ✅ | 2B |
| GET | `/today` | Today's visits | ✅ | 2B |
| GET | `/queue` | Queue by status | ✅ | 2B |
| GET | `/stats` | Visit statistics | ✅ | 2B |

### Settings (`/api/v1/settings`) - Phase 2

| Method | Endpoint | Description | Auth | Role | Phase |
|--------|----------|-------------|------|------|-------|
| GET | `/features` | Get feature flags | ✅ | Any | 2B |
| PUT | `/{key}` | Update setting | ✅ | Admin | 2B |

## Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as /auth/login
    participant J as JWT Service
    participant D as Database

    C->>A: POST {username, password}
    A->>D: Find user by username
    D-->>A: User record
    A->>A: Verify password (Argon2)
    A->>J: Generate tokens
    J-->>A: access_token, refresh_token
    A-->>C: {access_token, token_type, user}
    
    Note over C: Store token in localStorage
    
    C->>A: GET /me (Authorization: Bearer token)
    A->>J: Validate token
    J-->>A: User claims
    A-->>C: User profile
```

## Request/Response Examples

### Login Request
```json
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "Admin123!"
}
```

### Login Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@ehr.local",
    "full_name": "System Administrator",
    "role": "admin"
  }
}
```

### Patient Create Request
```json
POST /api/v1/patients
{
  "first_name": "Rajesh",
  "last_name": "Kumar",
  "date_of_birth": "1981-05-15",
  "gender": "male",
  "phone": "9876543210"
}
```

### Patient Response
```json
{
  "id": "uuid",
  "mrn": "CLI-2026-00001",
  "full_name": "Rajesh Kumar",
  "age": 44,
  ...
}
```

---

*Last Updated: January 31, 2026*
