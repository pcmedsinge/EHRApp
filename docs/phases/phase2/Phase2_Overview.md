# Phase 2: Visit Management - Overview

**Version:** 2.0  
**Status:** ✅ Complete  
**Completed Duration:** Week 3-5

---

## 1. Introduction

This phase implements complete visit/appointment workflow enabling patient check-in, visit tracking, status management, and doctor assignment. It builds on the Patient module from Phase 1 and follows the same sub-phase structure for easier implementation.

### 1.1 Objectives
- Enable front desk to create visits for registered patients
- Track visit status throughout patient journey (Registered → Waiting → In Progress → Completed)
- Maintain visit history per patient
- Generate unique visit identifiers (VIS-YYYY-NNNNN)
- Provide visit queue management for doctors and staff
- Display real-time visit statistics on dashboard

### 1.2 Final Demo Outcome
User can login → Search patient → Create visit → Assign doctor → Track status → Access visit history

---

## 2. Feature Flags (Optional Features)

Some features are **optional and toggled OFF by default**. They can be enabled via system settings when needed.

| Feature Flag | Default | Description |
|--------------|---------|-------------|
| `VISIT_QUEUE_ENABLED` | **OFF** | Enables queue management page and real-time queue tracking |
| `VISIT_SCHEDULING_ENABLED` | **OFF** | Enables future date appointment scheduling |

### 2.1 Current Mode (Flags OFF)
- Visits are **walk-in only** (visit_date = today)
- No queue management UI
- Simple workflow: Create → View → Update Status → Complete
- Status changes done from Visit Detail page

### 2.2 Queue Mode (When Enabled)
- Real-time queue display
- Status transitions from queue board
- Waiting time tracking
- Token/priority display

### 2.3 Scheduling Mode (When Enabled)
- Book appointments for future dates
- Time slot management
- Calendar view
- Appointment reminders

> **Note:** Phase 2 builds the **data model and API to support all modes**, but UI defaults to simple walk-in mode. Queue and scheduling UI components are created but conditionally rendered.

---

## 3. Sub-Phases

| Sub-Phase | Name | Document | Status | Est. Time | Notes |
|-----------|------|----------|--------|-----------|-------|
| **2A** | Backend - Visit Models & Schema | [Phase2A_Backend_VisitModels.md](Phase2A_Backend_VisitModels.md) | ✅ Done | 3-4 hours | Core |
| **2B** | Backend - Visit Service & API | [Phase2B_Backend_VisitAPI.md](Phase2B_Backend_VisitAPI.md) | ✅ Done | 4-5 hours | Core |
| **2C** | Frontend - Visit Service & Hooks | [Phase2C_Frontend_VisitService.md](Phase2C_Frontend_VisitService.md) | ✅ Done | 2-3 hours | Core |
| **2D** | Frontend - Visit List & Create Pages | [Phase2D_Frontend_VisitPages.md](Phase2D_Frontend_VisitPages.md) | ✅ Done | 4-5 hours | Core |
| **2E** | Frontend - Visit Detail Pages | [Phase2E_Frontend_VisitDetail.md](Phase2E_Frontend_VisitDetail.md) | ✅ Done | 3-4 hours | Queue UI = Optional |
| **2F** | Integration - Dashboard & Testing | [Phase2F_Integration_Dashboard.md](Phase2F_Integration_Dashboard.md) | ✅ Done | 3-4 hours | Core |

---

## 4. Implementation Timeline

```
Week 3:
├── Day 1-2: Sub-Phase 2A (Visit Models & Schema)
├── Day 3-4: Sub-Phase 2B (Visit Service & API)
└── Day 5: Sub-Phase 2C (Visit Frontend Service)

Week 4:
├── Day 1-2: Sub-Phase 2D (Visit List & Create Pages)
├── Day 3: Sub-Phase 2E (Visit Detail Pages - Core Only)
└── Day 4-5: Sub-Phase 2F (Integration & Dashboard)

Optional (When Queue Enabled):
└── Queue UI components from Phase 2E
```

---

## 5. Data Model Overview

### Visit Entity

```
visits
├── id (UUID, PK)
├── visit_number (String, Unique) - VIS-YYYY-NNNNN
├── patient_id (UUID, FK → patients)
├── assigned_doctor_id (UUID, FK → users)
├── visit_date (Date)
├── visit_type (Enum: consultation, follow_up, emergency, procedure)
├── status (Enum: registered, waiting, in_progress, completed, cancelled)
├── priority (Enum: normal, urgent, emergency)
├── department (String)
├── chief_complaint (Text)
├── check_in_time (DateTime)
├── consultation_start_time (DateTime)
├── consultation_end_time (DateTime)
├── cancellation_reason (Text)
├── notes (Text)
├── is_active (Boolean)
├── created_at (DateTime)
├── updated_at (DateTime)
├── created_by (UUID, FK → users)
└── updated_by (UUID, FK → users)
```

### Status Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  REGISTERED │ ──▶ │   WAITING   │ ──▶ │ IN_PROGRESS │ ──▶ │  COMPLETED  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                     CANCELLED                        │
└─────────────────────────────────────────────────────┘
```

---

## 6. Key Features by Sub-Phase

### Phase 2A: Visit Backend - Models & Schema
- Visit SQLAlchemy model with all fields
- Visit status and type enums
- Pydantic schemas (Create, Update, Response, List)
- Visit number generator (VIS-YYYY-NNNNN)
- Database migration
- Model tests

### Phase 2B: Visit Backend - Service & API
- Visit CRUD service
- Status transition logic with validation
- Visit filtering and search
- Patient visit history
- Doctor's visits query
- Today's visits query
- RESTful API endpoints
- Swagger documentation

### Phase 2C: Visit UI - Service & Hooks
- Visit TypeScript types
- Visit API service (visitService.ts)
- React Query hooks (useVisits, useVisit, useCreateVisit, etc.)
- Visit status utilities
- Constants for visit types, statuses, priorities

### Phase 2D: Visit UI - List & Create Pages
- VisitList.tsx - All visits with filters (status, date, doctor)
- VisitCreate.tsx - Create visit with patient search
- PatientSearchModal.tsx - Search and select patient
- DoctorSelect.tsx - Doctor dropdown component
- Visit status badge component

### Phase 2E: Visit UI - Detail Pages
- VisitDetail.tsx - Full visit information (Core)
- VisitEdit.tsx - Edit visit details (Core)
- VisitStatusActions.tsx - Status change buttons (Core)
- **Optional (Queue Mode):**
  - VisitQueue.tsx - Today's visit queue management
  - VisitCard.tsx - Visit summary card for queue
  - Real-time queue updates

### Phase 2F: Visit Integration & Dashboard
- Add visit history tab to PatientDetail page
- Add "Create Visit" button to patient pages
- Update sidebar navigation
- Dashboard visit statistics widget
- Today's appointments widget
- Doctor-wise visit summary

---

## 7. API Endpoints Summary

| Method | Endpoint | Description | Sub-Phase |
|--------|----------|-------------|-----------|
| POST | /api/v1/visits | Create new visit | 2B |
| GET | /api/v1/visits | List visits with filters | 2B |
| GET | /api/v1/visits/{id} | Get visit detail | 2B |
| PUT | /api/v1/visits/{id} | Update visit | 2B |
| PATCH | /api/v1/visits/{id}/status | Update status only | 2B |
| DELETE | /api/v1/visits/{id} | Soft delete (cancel) visit | 2B |
| GET | /api/v1/visits/patient/{patient_id} | Patient visit history | 2B |
| GET | /api/v1/visits/today | Today's visits | 2B |
| GET | /api/v1/visits/doctor/{doctor_id} | Doctor's assigned visits | 2B |
| GET | /api/v1/visits/queue | Current queue (today, by status) | 2B |
| GET | /api/v1/visits/stats | Visit statistics | 2B |

---

## 8. Frontend Pages Summary

| Page | Route | Description | Sub-Phase | Required |
|------|-------|-------------|-----------|----------|
| VisitList | /visits | All visits with filters | 2D | Core |
| VisitCreate | /visits/create | Create new visit | 2D | Core |
| VisitCreate (with patient) | /visits/create?patient={id} | Create visit for specific patient | 2D | Core |
| VisitDetail | /visits/{id} | View visit details | 2E | Core |
| VisitEdit | /visits/{id}/edit | Edit visit | 2E | Core |
| VisitQueue | /visits/queue | Today's queue management | 2E | Optional |
| PatientVisits | /patients/{id} (tab) | Visit history in patient detail | 2F | Core |

---

## 9. Dependencies

### Internal (Required)
- Phase 1 Complete (Patient module, Auth, Infrastructure)
- Patient model and API
- User model (for doctor assignment)
- Authentication system

### External
- None (self-contained)

---

## 10. Verification Checklist

### Backend
- [ ] Visit model created with all fields
- [ ] Visit number auto-generated (VIS-YYYY-NNNNN format)
- [ ] Visit CRUD operations work
- [ ] Status transitions validated
- [ ] Patient visit history returns correctly
- [ ] Doctor's visits filtered correctly
- [ ] Today's visits returns current date only
- [ ] All endpoints tested via Swagger
- [ ] Proper error handling and validation

### Frontend
- [ ] Visit list displays with pagination
- [ ] Visit filters work (status, date, doctor)
- [ ] Can create visit with patient search
- [ ] Visit detail shows all information
- [ ] Can update visit status
- [ ] Visit queue displays correctly
- [ ] Status change updates in real-time
- [ ] Patient detail shows visit history
- [ ] Dashboard shows visit stats
- [ ] UI is responsive

---

## 11. Success Criteria

- Front desk can create a visit in < 30 seconds
- Patient search in visit creation is fast (< 2 seconds)
- Status updates reflect immediately on queue
- Visit history accessible from patient detail
- Doctors can view their assigned visits
- Dashboard shows accurate visit counts
- No data inconsistencies in visit records

---

## 12. Future Enhancements (When Feature Flags Enabled)

These features are **built but hidden** by default. Enable via feature flags:

### When VISIT_QUEUE_ENABLED = ON
- VisitQueue page visible in navigation
- Real-time queue board
- Token/queue number display
- Waiting time tracking
- Queue position updates

### When VISIT_SCHEDULING_ENABLED = ON (Phase 7+)
- Future date appointment booking
- Time slot management
- Calendar view for appointments
- SMS/Email reminders
- Slot-based booking
- Recurring appointments

---

## 13. Next Phase

After Phase 2 completion, proceed to **Phase 3: Clinical Documentation**
- Vitals recording (BP, Heart Rate, Temperature, etc.)
- Diagnosis with ICD-10 codes
- Clinical notes and prescriptions

---

*End of Phase 2 Overview*
