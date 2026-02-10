# Phase 1: Foundation + Patient Registration - Overview

**Version:** 1.0  
**Status:** Ready for Development  
**Estimated Duration:** Week 1-2

---

## 1. Introduction

This phase establishes the core infrastructure and delivers a complete patient registration workflow. It's broken into **7 sub-phases** for easier implementation and verification.

### 1.1 Objectives
- Set up development environment and project structure
- Establish database and containerization infrastructure
- Implement user authentication
- Build complete patient registration module (API + UI)

### 1.2 Final Demo Outcome
User can login → Register patients → Search patients → View/Edit patient details

---

## 2. Sub-Phases

| Sub-Phase | Name | Document | Status |
|-----------|------|----------|--------|
| **1A** | Infrastructure Setup | [Phase1A_Infrastructure.md](Phase1A_Infrastructure.md) | Ready |
| **1B** | Backend Core | [Phase1B_BackendCore.md](Phase1B_BackendCore.md) | Ready |
| **1C** | Authentication Backend | [Phase1C_AuthBackend.md](Phase1C_AuthBackend.md) | Ready |
| **1D** | Patient Backend | [Phase1D_PatientBackend.md](Phase1D_PatientBackend.md) | Ready |
| **1E** | Frontend Core | [Phase1E_FrontendCore.md](Phase1E_FrontendCore.md) | Ready |
| **1F** | Authentication UI | [Phase1F_AuthUI.md](Phase1F_AuthUI.md) | Ready |
| **1G** | Patient UI | [Phase1G_PatientUI.md](Phase1G_PatientUI.md) | Ready |

---

## 3. Implementation Timeline

```
Week 1:
├── Day 1: Sub-Phase 1A (Infrastructure Setup)
├── Day 2: Sub-Phase 1B (Backend Core)
├── Day 3: Sub-Phase 1C (Authentication Backend)
└── Day 4: Sub-Phase 1D (Patient Backend)

Week 2:
├── Day 1: Sub-Phase 1E (Frontend Core Setup)
├── Day 2: Sub-Phase 1F (Authentication UI)
└── Day 3-4: Sub-Phase 1G (Patient UI)
```

---

## 4. Technology Stack Summary

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18 + TypeScript + Vite + Ant Design |
| **Backend** | Python 3.12 + FastAPI + SQLAlchemy 2.0 |
| **Database** | PostgreSQL 15 |
| **PACS** | Orthanc (for Phase 5 preparation) |
| **Auth** | JWT (OAuth2) |
| **DevOps** | Docker + Docker Compose |

---

## 5. Key Deliverables

### Backend
- FastAPI application with authentication
- User and Patient models/schemas
- Database migrations with Alembic
- RESTful API endpoints (auth + patients)
- JWT token management

### Frontend
- React application with routing
- Login page and authentication flow
- Patient list with search and pagination
- Patient registration form
- Patient detail and edit pages

### Infrastructure
- Docker Compose with PostgreSQL and Orthanc
- Python virtual environment
- Environment configuration
- Project structure

---

## 6. Prerequisites

- Linux system (Ubuntu/Debian)
- Python 3.12 installed
- Node.js 18+ and npm installed
- Docker and Docker Compose installed
- Git installed

---

## 7. Verification Checkpoints

After completing all sub-phases:

- [ ] Docker containers running (PostgreSQL, Orthanc)
- [ ] Backend API accessible at http://localhost:8000
- [ ] Swagger docs at http://localhost:8000/docs
- [ ] Frontend accessible at http://localhost:5173
- [ ] Can register and login user
- [ ] Can create patients with auto-generated MRN
- [ ] Can search and filter patients
- [ ] Can view and edit patient details
- [ ] All CRUD operations work via UI

---

## 8. Next Steps

After Phase 1 completion, proceed to **Phase 2: Visit Management**

---

## 9. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-28 | | Initial version with sub-phases |

---

*For detailed implementation instructions, refer to individual sub-phase documents.*
