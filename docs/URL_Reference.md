# EHR Application - URL Reference

This document lists all URLs, API endpoints, and routes used in the EHR application.

---

## 1. Service URLs

### Development Environment

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React development server (Vite) |
| **Backend API** | http://localhost:8000 | FastAPI server |
| **API Docs (Swagger)** | http://localhost:8000/docs | Interactive API documentation |
| **API Docs (ReDoc)** | http://localhost:8000/redoc | Alternative API documentation |
| **OpenAPI Schema** | http://localhost:8000/openapi.json | OpenAPI 3.0 specification |
| **PostgreSQL** | localhost:5433 | Database (mapped from container 5432) |
| **Orthanc Web** | http://localhost:8042 | DICOM server web interface |
| **Orthanc DICOM** | localhost:4242 | DICOM protocol port |

### Docker Container Internal URLs

| Service | Internal URL | Used By |
|---------|--------------|---------|
| PostgreSQL | `ehr_postgres:5432` | Backend container |
| Orthanc | `ehr_orthanc:8042` | Backend container |

---

## 2. Backend API Endpoints

Base URL: `http://localhost:8000/api/v1`

### 2.1 Authentication (`/auth`)

| Method | Endpoint | Description | Auth | Phase |
|--------|----------|-------------|------|-------|
| `POST` | `/auth/login` | User login, returns JWT | ❌ | 1C |
| `POST` | `/auth/logout` | Invalidate token | ✅ | 1C |
| `GET` | `/auth/me` | Get current user profile | ✅ | 1C |
| `POST` | `/auth/refresh` | Refresh access token | ✅ | 1C |

**Example:**
```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'

# Get current user
curl "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer <token>"
```

### 2.2 Users (`/users`)

| Method | Endpoint | Description | Auth | Role | Phase |
|--------|----------|-------------|------|------|-------|
| `GET` | `/users` | List all users | ✅ | Admin | 1C |
| `POST` | `/users` | Create new user | ✅ | Admin | 1C |
| `GET` | `/users/{id}` | Get user by ID | ✅ | Admin | 1C |
| `PUT` | `/users/{id}` | Update user | ✅ | Admin | 1C |
| `DELETE` | `/users/{id}` | Deactivate user | ✅ | Admin | 1C |

**Example:**
```bash
# List users
curl "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer <token>"
```

### 2.3 Patients (`/patients`)

| Method | Endpoint | Description | Auth | Phase |
|--------|----------|-------------|------|-------|
| `GET` | `/patients` | List patients (paginated) | ✅ | 1D |
| `POST` | `/patients` | Create new patient | ✅ | 1D |
| `GET` | `/patients/{id}` | Get patient by ID | ✅ | 1D |
| `PUT` | `/patients/{id}` | Update patient | ✅ | 1D |
| `DELETE` | `/patients/{id}` | Soft delete patient | ✅ | 1D |
| `GET` | `/patients/mrn/{mrn}` | Get patient by MRN | ✅ | 1D |
| `GET` | `/patients/search` | Search patients | ✅ | 1D |

**Query Parameters for `/patients`:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `size` | int | 20 | Items per page |
| `search` | string | - | Search in name, MRN, phone |
| `sort_by` | string | created_at | Sort field |
| `sort_order` | string | desc | asc or desc |

**Example:**
```bash
# List patients with search
curl "http://localhost:8000/api/v1/patients?search=kumar&page=1&size=10" \
  -H "Authorization: Bearer <token>"

# Get by MRN
curl "http://localhost:8000/api/v1/patients/mrn/CLI-2026-00001" \
  -H "Authorization: Bearer <token>"
```

### 2.4 Visits (`/visits`) - Phase 2

| Method | Endpoint | Description | Auth | Phase |
|--------|----------|-------------|------|-------|
| `GET` | `/visits` | List visits (filtered) | ✅ | 2B |
| `POST` | `/visits` | Create new visit | ✅ | 2B |
| `GET` | `/visits/{id}` | Get visit by ID | ✅ | 2B |
| `PUT` | `/visits/{id}` | Update visit | ✅ | 2B |
| `PATCH` | `/visits/{id}/status` | Update status only | ✅ | 2B |
| `DELETE` | `/visits/{id}` | Cancel visit (soft delete) | ✅ | 2B |
| `GET` | `/visits/patient/{patient_id}` | Get patient's visit history | ✅ | 2B |
| `GET` | `/visits/today` | Get today's visits | ✅ | 2B |
| `GET` | `/visits/queue` | Get queue (today, by status) | ✅ | 2B |
| `GET` | `/visits/stats` | Get visit statistics | ✅ | 2B |
| `GET` | `/visits/doctor/{doctor_id}` | Get doctor's assigned visits | ✅ | 2B |

**Query Parameters for `/visits`:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `size` | int | 20 | Items per page |
| `status` | string | - | Filter by status |
| `visit_type` | string | - | Filter by type |
| `date_from` | date | - | Start date |
| `date_to` | date | - | End date |
| `doctor_id` | uuid | - | Filter by doctor |
| `patient_id` | uuid | - | Filter by patient |

### 2.5 Settings (`/settings`) - Phase 2

| Method | Endpoint | Description | Auth | Role | Phase |
|--------|----------|-------------|------|------|-------|
| `GET` | `/settings/features` | Get feature flags | ✅ | Any | 2B |
| `GET` | `/settings` | List all settings | ✅ | Admin | 2B |
| `PUT` | `/settings/{key}` | Update setting | ✅ | Admin | 2B |

**Example:**
```bash
# Get feature flags
curl "http://localhost:8000/api/v1/settings/features" \
  -H "Authorization: Bearer <token>"
```

---

## 3. Frontend Routes

Base URL: `http://localhost:3000`

### 3.1 Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `Login.tsx` | User login page |

### 3.2 Protected Routes (Require Authentication)

| Route | Component | Description | Phase |
|-------|-----------|-------------|-------|
| `/` | Redirect | Redirects to `/dashboard` | 1E |
| `/dashboard` | `Dashboard.tsx` | Main dashboard | 1E |

### 3.3 Patient Routes

| Route | Component | Description | Phase |
|-------|-----------|-------------|-------|
| `/patients` | `PatientList.tsx` | List all patients | 1G |
| `/patients/create` | `PatientCreate.tsx` | Create new patient | 1G |
| `/patients/:id` | `PatientDetail.tsx` | View patient details | 1G |
| `/patients/:id/edit` | `PatientEdit.tsx` | Edit patient | 1G |

### 3.4 Visit Routes (Phase 2)

| Route | Component | Description | Phase |
|-------|-----------|-------------|-------|
| `/visits` | `VisitList.tsx` | List all visits | 2D |
| `/visits/create` | `VisitCreate.tsx` | Create new visit | 2D |
| `/visits/create?patient={id}` | `VisitCreate.tsx` | Create visit for patient | 2D |
| `/visits/:id` | `VisitDetail.tsx` | View visit details | 2E |
| `/visits/:id/edit` | `VisitEdit.tsx` | Edit visit | 2E |
| `/visits/queue` | `VisitQueue.tsx` | Queue management (optional) | 2E |

---

## 4. External URLs & Resources

### 4.1 CDN Resources (Frontend)

| Resource | URL | Used For |
|----------|-----|----------|
| Ant Design Icons | Bundled | UI icons |
| Inter Font | Google Fonts | Typography |

### 4.2 Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql+asyncpg://ehr_user:ehr_secure_password@localhost:5433/ehr_db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
ORTHANC_URL=http://localhost:8042
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 5. WebSocket Endpoints (Future)

| Endpoint | Description | Phase |
|----------|-------------|-------|
| `ws://localhost:8000/ws/queue` | Real-time queue updates | Future |
| `ws://localhost:8000/ws/notifications` | User notifications | Future |

---

## 6. Health Check Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Basic health check |
| `GET` | `/health/db` | Database connectivity |
| `GET` | `/health/ready` | Readiness probe |

---

## 7. Quick Reference Card

### Development Shortcuts

```bash
# Check if backend is running
curl -s http://localhost:8000/docs | head -1

# Check if frontend is running
curl -s http://localhost:3000 | head -1

# Get auth token
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Test authenticated request
curl -s "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Common URL Patterns

| Pattern | Example | Description |
|---------|---------|-------------|
| List | `GET /api/v1/patients` | Get paginated list |
| Create | `POST /api/v1/patients` | Create new resource |
| Read | `GET /api/v1/patients/{id}` | Get single resource |
| Update | `PUT /api/v1/patients/{id}` | Full update |
| Partial | `PATCH /api/v1/visits/{id}/status` | Partial update |
| Delete | `DELETE /api/v1/patients/{id}` | Soft delete |
| Search | `GET /api/v1/patients?search=kumar` | Query filter |
| Nested | `GET /api/v1/visits/patient/{id}` | Related resources |

---

## 8. URL Summary by Phase

| Phase | URLs Added |
|-------|------------|
| **1A** | PostgreSQL (5433), Orthanc (8042, 4242) |
| **1B** | Backend (8000), Swagger (/docs), ReDoc (/redoc) |
| **1C** | /auth/*, /users/* |
| **1D** | /patients/* |
| **1E** | Frontend (3000), /dashboard |
| **1F** | /login |
| **1G** | /patients/*, /patients/create, /patients/:id/* |
| **2B** | /visits/*, /settings/* |
| **2D** | /visits, /visits/create |
| **2E** | /visits/:id/*, /visits/queue |
| **2F** | Dashboard widgets use existing endpoints |

---

*Last Updated: January 31, 2026*
