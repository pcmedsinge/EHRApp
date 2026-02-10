# EHR Application - Product Requirements Document

**Version:** 1.0  
**Date:** January 26, 2026  
**Status:** Approved for Development

---

## 1. Executive Summary

### 1.1 Project Overview
A modern, extensible Electronic Health Record (EHR) system designed for outpatient department (OPD) workflows in Indian healthcare facilities. The system follows an API-first architecture enabling future scalability to microservices and integration with national health initiatives.

### 1.2 Target Users
- Single hospital/clinic facility
- Doctors, Nurses, Receptionists, Administrators
- Radiology technicians

### 1.3 Key Objectives
- Streamlined OPD clinical workflows
- DICOM-compliant medical imaging with OHIF viewer integration
- Future-ready architecture (ABHA/ABDM integration, IPD expansion)
- Progressive, demoable development approach

---

## 2. Technical Architecture

### 2.1 Architecture Pattern
**Modular Monolith → Microservices Ready**

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)               │
│                         Ant Design UI                           │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                 API GATEWAY (FastAPI - Python 3.12)             │
│                      OAuth2 + JWT Authentication                │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │  Patient  │ │   Visit   │ │ Clinical  │ │  Orders   │       │
│  │  Module   │ │  Module   │ │  Module   │ │  Module   │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│  ┌───────────┐ ┌───────────┐                                    │
│  │  Imaging  │ │   Auth    │                                    │
│  │  Module   │ │  Module   │                                    │
│  └───────────┘ └───────────┘                                    │
├─────────────────────────────────────────────────────────────────┤
│                    SERVICE LAYER (Business Logic)               │
├─────────────────────────────────────────────────────────────────┤
│                    DATA LAYER (SQLAlchemy 2.0)                  │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │    PostgreSQL     │       │   Orthanc PACS    │
        │   (Clinical Data) │       │  (DICOM Images)   │
        └───────────────────┘       └───────────────────┘
                                            │
                                            ▼
                                    ┌───────────────────┐
                                    │   OHIF Viewer     │
                                    │  (Image Viewing)  │
                                    └───────────────────┘
```

### 2.2 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Modular Monolith | Faster MVP development, clean module boundaries for future microservices split |
| API Versioning (v1) | Non-breaking changes when evolving APIs |
| UUID Primary Keys | Distributed-ready, no sequential ID exposure |
| Soft Deletes | Audit trail, data recovery capability |
| Vertical Slice Development | Full-stack per workflow, progressive and demoable |

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI Framework |
| TypeScript | 5+ | Type-safe JavaScript |
| Vite | 5+ | Build tool & dev server |
| Ant Design | 5+ | UI Component Library |
| React Router | 6+ | Client-side routing |
| React Query (TanStack) | 5+ | Server state management |
| Axios | 1+ | HTTP client |

### 3.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.12 | Backend language |
| FastAPI | 0.100+ | Web framework (async, OpenAPI) |
| SQLAlchemy | 2.0+ | ORM (similar to Entity Framework) |
| Alembic | 1.12+ | Database migrations |
| Pydantic | 2+ | Data validation & serialization |
| python-jose | 3+ | JWT token handling |
| passlib | 1.7+ | Password hashing |
| pydicom | 2.4+ | DICOM file handling |
| httpx | 0.25+ | Async HTTP client (Orthanc API) |

### 3.3 Database & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15+ | Primary database |
| Orthanc | 1.12+ | DICOM/PACS server |

### 3.4 DevOps & Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Virtual Environment (venv) | Python dependency isolation |

### 3.5 Medical Imaging

| Technology | Purpose |
|------------|---------|
| Orthanc | DICOM storage, DICOMweb API |
| OHIF Viewer | Web-based DICOM viewer |
| pydicom | DICOM tag reading/modification |

---

## 4. Data Models (High-Level)

### 4.1 Core Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                    │
│  id, username, email, password_hash, role, is_active            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        PATIENT                                  │
│  id, mrn, first_name, last_name, date_of_birth, gender,        │
│  phone, email, address, aadhaar_number, abha_id,               │
│  created_at, updated_at, is_deleted                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         VISIT                                   │
│  id, patient_id, visit_number, visit_type, status,             │
│  visit_date, chief_complaint, created_at, updated_at           │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     VITALS      │  │   DIAGNOSIS     │  │ CLINICAL_NOTES  │
│  id, visit_id,  │  │  id, visit_id,  │  │  id, visit_id,  │
│  bp_systolic,   │  │  icd_code,      │  │  note_type,     │
│  bp_diastolic,  │  │  icd_desc,      │  │  content,       │
│  pulse, temp,   │  │  free_text,     │  │  created_by,    │
│  spo2, weight,  │  │  is_primary     │  │  created_at     │
│  height         │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      IMAGING_ORDER                              │
│  id, visit_id, patient_id, accession_number, study_type,       │
│  body_part, laterality, urgency, clinical_indication,          │
│  status, ordered_by, ordered_at, completed_at,                 │
│  study_instance_uid                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DISCHARGE_SUMMARY                            │
│  id, visit_id, summary_text, follow_up_date,                   │
│  follow_up_instructions, created_by, created_at                │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Patient Identification

| ID Type | Format | Description |
|---------|--------|-------------|
| MRN | `CLI-YYYY-NNNNN` | Auto-generated Medical Record Number |
| Aadhaar | 12 digits | Optional - National ID |
| ABHA ID | 14 digits | Optional - Ayushman Bharat Health Account |

### 4.3 Reference Data

| Table | Purpose |
|-------|---------|
| ICD10_CODES | ICD-10 diagnosis code lookup |
| STUDY_TYPES | Imaging study type master |
| BODY_PARTS | Anatomical body parts master |

---

## 5. Clinical Workflows (MVP Scope)

### 5.1 Workflow Summary

| # | Workflow | MVP Scope | Future Scope |
|---|----------|-----------|--------------|
| 1 | Patient Registration | Demographics, MRN, Aadhaar/ABHA | Insurance, detailed history |
| 2 | Visit Management | OPD visits, status tracking | Scheduling, IPD, bed management |
| 3 | Clinical Documentation | Vitals, complaints, notes, diagnosis | Templates, voice-to-text |
| 4 | Imaging Orders | Order creation, status, accession | Lab orders, pharmacy orders |
| 5 | DICOM Integration | Manual upload, tag modification, OHIF | Machine integration, worklist |
| 6 | Discharge/Exit | Summary, follow-up, closure | Billing integration |

### 5.2 Imaging Workflow Details

#### Upload Flow (Option C - Tag Modification)
```
1. User selects DICOM file(s)
2. System extracts and displays current DICOM tags
3. User selects target patient from EHR
4. User optionally links to imaging order
5. System previews modified tags
6. User confirms upload
7. System modifies DICOM tags using pydicom
8. System uploads to Orthanc
9. System links study to order in EHR
```

#### Patient-DICOM Linking
- **Primary Link:** MRN ↔ DICOM PatientID tag
- **Order Link:** Accession Number ↔ DICOM AccessionNumber tag

---

## 6. Development Phases

Development follows a **vertical slice** approach where each phase delivers a complete, demoable feature with UI, API, and database components.

### Phase Structure

Each phase is organized in its own folder with:
- **Overview document** - High-level summary and sub-phase links
- **Sub-phase documents** - Detailed step-by-step implementation guides

| Phase | Name | Duration | Description | Document |
|-------|------|----------|-------------|----------|
| 1 | Foundation + Patient Registration | Week 1-2 | Infrastructure setup, authentication, and complete patient management | [Phase 1 Overview](phases/phase1/Phase1_Overview.md) |
| 2 | Visit Management | Week 3 | Visit creation, status tracking, and patient visit history | [Phase 2 Overview](phases/phase2/Phase2_Overview.md) |
| 3 | Clinical Documentation | Week 4-5 | Vitals, diagnosis (with ICD-10), and clinical notes | [Phase 3 Overview](phases/phase3/Phase3_Overview.md) |
| 4 | Imaging Orders | Week 6 | Imaging order workflow with accession number generation | [Phase 4 Overview](phases/phase4/Phase4_Overview.md) |
| 5 | DICOM Integration | Week 7-8 | Manual DICOM upload, tag modification, OHIF viewer integration | [Phase 5 Overview](phases/phase5/Phase5_Overview.md) |
| 6 | Discharge/Exit Care | Week 9 | Discharge summaries, follow-up, and visit completion | [Phase 6 Overview](phases/phase6/Phase6_Overview.md) |

### Phase 1 Sub-Phases

Phase 1 is further divided into manageable sub-phases:

| Sub-Phase | Name | Document |
|-----------|------|----------|
| 1A | Infrastructure Setup | [Details](phases/phase1/Phase1A_Infrastructure.md) |
| 1B | Backend Core | [Details](phases/phase1/Phase1B_BackendCore.md) |
| 1C | Authentication Backend | [Details](phases/phase1/Phase1C_AuthBackend.md) |
| 1D | Patient Backend | [Details](phases/phase1/Phase1D_PatientBackend.md) |
| 1E | Frontend Core | [Details](phases/phase1/Phase1E_FrontendCore.md) |
| 1F | Authentication UI | [Details](phases/phase1/Phase1F_AuthUI.md) |
| 1G | Patient UI | [Details](phases/phase1/Phase1G_PatientUI.md) |

### Phase Summary

**Phase 1:** User can login → Register patients → Search patients → View/Edit patient details

**Phase 2:** Create visit for patient → View visit history → Update visit status

**Phase 3:** Record vitals → Add diagnosis with ICD-10 → Write clinical notes → View visit summary

**Phase 4:** Create imaging order → Generate accession number → Track order status

**Phase 5:** Upload sample DICOM → Modify tags → Link to patient/order → View in OHIF

**Phase 6:** Complete full OPD workflow from registration to discharge

> **Note:** Each phase document contains detailed specifications including database schemas, API endpoints, UI mockups, and acceptance criteria.

---

## 7. Project Structure

```
EHRApp/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── router.py
│   │   │       │   └── dependencies.py
│   │   │       ├── patients/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── router.py
│   │   │       │   ├── schemas.py
│   │   │       │   └── service.py
│   │   │       ├── visits/
│   │   │       ├── clinical/
│   │   │       ├── orders/
│   │   │       └── imaging/
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── patient.py
│   │   │   ├── visit.py
│   │   │   ├── clinical.py
│   │   │   └── imaging.py
│   │   ├── schemas/
│   │   │   └── common.py
│   │   ├── services/
│   │   │   └── orthanc.py
│   │   └── main.py
│   ├── alembic/
│   │   ├── versions/
│   │   ├── env.py
│   │   └── alembic.ini
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── auth/
│   │   │   ├── patients/
│   │   │   ├── visits/
│   │   │   ├── clinical/
│   │   │   ├── orders/
│   │   │   └── imaging/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PatientsPage.tsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authApi.ts
│   │   │   └── patientApi.ts
│   │   ├── hooks/
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── types/
│   │   │   ├── patient.ts
│   │   │   └── ...
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── nginx.conf
│
├── docs/
│   └── EHR_PRD.md
│
├── .gitignore
└── README.md
```

---

## 8. Future Roadmap (Post-MVP)

| Phase | Features | Priority |
|-------|----------|----------|
| 7 | Lab Orders & Results | High |
| 8 | Pharmacy Orders | High |
| 9 | IPD & Bed Management | Medium |
| 10 | ABHA/ABDM Integration | Medium |
| 11 | Reporting & Analytics | Medium |
| 12 | Machine DICOM Integration (Modality Worklist) | Low |
| 13 | Multi-language Support (Hindi, Regional) | Low |
| 14 | Microservices Migration | Low |

---

## 9. Non-Functional Requirements

### 9.1 Security
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- HTTPS in production
- Audit logging for sensitive operations

### 9.2 Performance
- Async database operations
- Connection pooling
- Pagination for list endpoints
- Image lazy loading

### 9.3 Scalability
- Stateless API design
- Module boundaries for future microservices
- Docker-ready deployment

### 9.4 Compliance Considerations (Future)
- HIPAA-like data handling practices
- ABDM compliance when integrating ABHA

---

## 10. Appendix

### 10.1 Glossary

| Term | Definition |
|------|------------|
| MRN | Medical Record Number - unique patient identifier |
| ABHA | Ayushman Bharat Health Account |
| ABDM | Ayushman Bharat Digital Mission |
| DICOM | Digital Imaging and Communications in Medicine |
| PACS | Picture Archiving and Communication System |
| OHIF | Open Health Imaging Foundation |
| OPD | Outpatient Department |
| IPD | Inpatient Department |
| ICD-10 | International Classification of Diseases, 10th Revision |

### 10.2 External References
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/)
- [Ant Design Components](https://ant.design/components/overview/)
- [Orthanc DICOM Server](https://www.orthanc-server.com/)
- [OHIF Viewer](https://ohif.org/)
- [ABDM Sandbox](https://sandbox.abdm.gov.in/)

---

**Document Approval**

| Role | Name | Date |
|------|------|------|
| Product Owner | | |
| Technical Lead | | |
| Development Team | | |

---

*End of Document*
