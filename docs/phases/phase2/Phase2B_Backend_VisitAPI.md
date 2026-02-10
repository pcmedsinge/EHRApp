# Phase 2B: Visit Backend - Service & API

**Sub-Phase:** 2B  
**Estimated Time:** 4-5 hours  
**Prerequisites:** Phase 2A Complete  
**Status:** ✅ Complete (January 31, 2026)

---

## 1. Objective

Implement the Visit service layer with business logic and RESTful API endpoints. This includes CRUD operations, status management, filtering, and specialized queries.

---

## 2. Deliverables

- [ ] Visit service with all business logic
- [ ] Status transition validation
- [ ] Visit CRUD endpoints
- [ ] Status update endpoint
- [ ] Patient visit history endpoint
- [ ] Doctor's visits endpoint
- [ ] Today's visits endpoint
- [ ] Queue endpoint
- [ ] Stats endpoint
- [ ] Swagger documentation
- [ ] API integration tests

---

## 3. Files to Create/Modify

```
backend/app/
├── api/v1/
│   ├── __init__.py              # Update router includes
│   └── visits/
│       ├── __init__.py          # NEW: Package init
│       ├── router.py            # NEW: Visit endpoints
│       └── service.py           # NEW: Visit business logic
└── core/
    └── exceptions.py            # Add visit-specific exceptions
```

---

## 4. Service Layer Methods

### 4.1 Core CRUD

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| create_visit | db, visit_data, created_by | Visit | Create new visit with auto visit_number |
| get_visit | db, visit_id | Visit | Get single visit by ID |
| get_visit_by_number | db, visit_number | Visit | Get visit by visit number |
| update_visit | db, visit_id, visit_data, updated_by | Visit | Update visit details |
| delete_visit | db, visit_id, cancelled_by, reason | Visit | Soft delete (cancel) visit |

### 4.2 Status Management

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| update_status | db, visit_id, new_status, updated_by | Visit | Change visit status with validation |
| validate_status_transition | current, new | bool | Check if transition is allowed |
| start_consultation | db, visit_id, doctor_id | Visit | Set status to in_progress, record start time |
| end_consultation | db, visit_id | Visit | Set status to completed, record end time |

### 4.3 Query Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| get_visits | db, filters, page, size | PaginatedList | List visits with filters |
| get_patient_visits | db, patient_id, page, size | PaginatedList | Patient's visit history |
| get_doctor_visits | db, doctor_id, date, status | List[Visit] | Doctor's assigned visits |
| get_today_visits | db, status, doctor_id | List[Visit] | Today's visits (filtered) |
| get_queue | db, status | List[Visit] | Current waiting queue |
| get_visit_stats | db, date_from, date_to | VisitStats | Visit statistics |

### 4.4 Filter Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| status | VisitStatus | Filter by status |
| visit_type | VisitType | Filter by type |
| priority | Priority | Filter by priority |
| patient_id | UUID | Filter by patient |
| doctor_id | UUID | Filter by assigned doctor |
| date_from | Date | Visit date >= |
| date_to | Date | Visit date <= |
| department | String | Filter by department |
| search | String | Search in visit_number, patient name |

---

## 5. API Endpoints

### 5.1 Basic CRUD

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | /api/v1/visits | Create visit | VisitCreate | VisitResponse |
| GET | /api/v1/visits/{id} | Get visit | - | VisitResponse |
| PUT | /api/v1/visits/{id} | Update visit | VisitUpdate | VisitResponse |
| DELETE | /api/v1/visits/{id} | Cancel visit | reason (query) | VisitResponse |

### 5.2 List & Filter

| Method | Endpoint | Query Params | Response |
|--------|----------|--------------|----------|
| GET | /api/v1/visits | page, size, status, type, priority, patient_id, doctor_id, date_from, date_to, search | VisitListResponse |

### 5.3 Status Management

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| PATCH | /api/v1/visits/{id}/status | VisitStatusUpdate | VisitResponse |
| POST | /api/v1/visits/{id}/start | - | VisitResponse |
| POST | /api/v1/visits/{id}/complete | - | VisitResponse |

### 5.4 Specialized Queries

| Method | Endpoint | Query Params | Response |
|--------|----------|--------------|----------|
| GET | /api/v1/visits/patient/{patient_id} | page, size | VisitListResponse |
| GET | /api/v1/visits/doctor/{doctor_id} | date, status | List[VisitResponse] |
| GET | /api/v1/visits/today | status, doctor_id | List[VisitResponse] |
| GET | /api/v1/visits/queue | - | List[VisitResponse] |
| GET | /api/v1/visits/stats | date_from, date_to | VisitStatsResponse |

---

## 6. Status Transition Logic

```python
VALID_TRANSITIONS = {
    VisitStatus.REGISTERED: [VisitStatus.WAITING, VisitStatus.CANCELLED],
    VisitStatus.WAITING: [VisitStatus.IN_PROGRESS, VisitStatus.CANCELLED],
    VisitStatus.IN_PROGRESS: [VisitStatus.COMPLETED, VisitStatus.CANCELLED],
    VisitStatus.COMPLETED: [],  # Terminal
    VisitStatus.CANCELLED: [],  # Terminal
}

def validate_status_transition(current: VisitStatus, new: VisitStatus) -> bool:
    return new in VALID_TRANSITIONS.get(current, [])
```

### Status Side Effects

| Transition | Side Effect |
|------------|-------------|
| → REGISTERED | Set check_in_time to now |
| → IN_PROGRESS | Set consultation_start_time to now |
| → COMPLETED | Set consultation_end_time to now |
| → CANCELLED | Set cancellation_reason (required) |

---

## 7. Error Handling

| Error | HTTP Code | When |
|-------|-----------|------|
| VisitNotFound | 404 | Visit ID doesn't exist |
| InvalidStatusTransition | 400 | Status change not allowed |
| PatientNotFound | 404 | Patient ID in create doesn't exist |
| DoctorNotFound | 404 | Doctor ID doesn't exist |
| VisitAlreadyCancelled | 400 | Trying to modify cancelled visit |
| VisitAlreadyCompleted | 400 | Trying to modify completed visit |
| CancellationReasonRequired | 400 | Cancelling without reason |

---

## 8. Authorization

| Endpoint | Allowed Roles |
|----------|---------------|
| Create visit | admin, receptionist, nurse |
| Update visit | admin, receptionist, nurse, doctor |
| Update status | admin, receptionist, nurse, doctor |
| Delete (cancel) | admin, receptionist |
| View visits | all authenticated |
| View patient history | all authenticated |
| View doctor visits | admin, doctor (own) |

---

## 9. Statistics Response

```python
class VisitStatsResponse:
    total_visits: int
    by_status: dict[str, int]     # {registered: 5, waiting: 3, ...}
    by_type: dict[str, int]       # {consultation: 20, follow_up: 10, ...}
    by_priority: dict[str, int]   # {normal: 25, urgent: 5, ...}
    by_department: dict[str, int] # {general: 15, cardiology: 10, ...}
    average_wait_time_minutes: float
    average_consultation_minutes: float
```

---

## 10. Verification Checklist

- [ ] Visit service has all CRUD methods
- [ ] Status transition validation works
- [ ] Invalid transitions return proper error
- [ ] Create visit generates visit number
- [ ] Patient visit history returns correct data
- [ ] Doctor visits filtered correctly
- [ ] Today's visits returns current date only
- [ ] Queue returns waiting visits ordered by check_in_time
- [ ] Stats endpoint returns correct counts
- [ ] All endpoints documented in Swagger
- [ ] Authorization enforced correctly
- [ ] Proper error responses

---

## 11. Testing

```bash
# Test via Swagger UI: http://localhost:8000/docs

# Or via curl:
TOKEN="your_jwt_token"

# Create visit
curl -X POST "http://localhost:8000/api/v1/visits" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "patient-uuid",
    "visit_type": "consultation",
    "priority": "normal",
    "chief_complaint": "Fever and headache"
  }'

# Get today's visits
curl "http://localhost:8000/api/v1/visits/today" \
  -H "Authorization: Bearer $TOKEN"

# Update status
curl -X PATCH "http://localhost:8000/api/v1/visits/{id}/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "waiting"}'
```

---

## 12. Notes

- Visit creation auto-assigns check_in_time
- Cancelled visits require reason
- Queue ordered by check_in_time (FIFO)
- Today's visits based on server timezone (IST)
- Doctor can only start consultation if assigned
- Completed/Cancelled visits are immutable

---

*End of Phase 2B*
