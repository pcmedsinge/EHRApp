# Phase 4C: Integration & Testing (2-3 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 4A ✅ + Phase 4B ✅  
**Estimated Time:** 2-3 days

---

## Objectives

Comprehensive testing and integration of Orders Management System:
- End-to-end testing of order workflows
- Role-based access control verification
- Performance testing
- Integration with existing modules
- Documentation updates
- Bug fixes and refinements

---

## Test Scenarios

### Scenario 1: Complete Imaging Order Workflow

**Actors:** Doctor, Radiologist, Technician

**Steps:**

1. **Doctor creates imaging order**
   - Login as doctor (Dr. Smith)
   - Navigate to patient visit
   - Create X-Ray Chest order
   - Verify order number generated: ORD-2026-XXXXX
   - Verify accession number: ACC-2026-XXXXX
   - Status: `ordered`

2. **Receptionist schedules order**
   - Login as receptionist
   - Search for order by accession number
   - Update status to `scheduled`
   - Set scheduled_date to tomorrow 10 AM
   - Add note: "Patient confirmed for tomorrow"
   - Verify scheduled_date updated

3. **Technician performs imaging**
   - Login as technician
   - Find scheduled orders
   - Update status to `in_progress`
   - Verify performing_user_id = technician ID
   - (Simulate image capture)
   - Update status to `completed`
   - Verify performed_date set

4. **Radiologist reports**
   - Login as radiologist
   - Find completed orders
   - Open order detail
   - Add report:
     - Findings: "Clear lung fields, no infiltrates"
     - Impression: "Normal chest X-ray"
     - Result status: "normal"
   - Submit report
   - Verify status changed to `reported`
   - Verify reporting_user_id = radiologist ID
   - Verify reported_date set

5. **Doctor reviews report**
   - Login as doctor
   - Navigate to patient visit → Orders tab
   - Find reported order
   - View full report
   - Verify all details present

**Expected Results:**
- ✅ Order progresses through all statuses
- ✅ All dates captured correctly
- ✅ User assignments correct
- ✅ Report visible to doctor
- ✅ Order searchable by both numbers

---

### Scenario 2: Lab Order Workflow

**Actors:** Doctor, Lab Technician

**Steps:**

1. **Doctor orders lab tests**
   - Create CBC order
   - Priority: URGENT
   - Specimen: Blood
   - Fasting: No
   - Clinical indication: "Check for anemia"
   - Verify order created

2. **Lab receives specimen**
   - Lab technician finds order
   - Update status to `in_progress`
   - Add note: "Specimen received, processing"

3. **Lab completes test**
   - Update status to `completed`
   - Add report with results:
     - WBC: 7,500
     - RBC: 4.5M
     - Hemoglobin: 13.5 g/dL
     - Result status: "normal"
   - Status auto-updates to `reported`

4. **Doctor reviews results**
   - View lab report
   - Verify results visible

**Expected Results:**
- ✅ Urgent priority visible
- ✅ Lab workflow smooth
- ✅ Results properly formatted
- ✅ Turnaround time tracked

---

### Scenario 3: Procedure Order

**Actors:** Doctor, Nurse

**Steps:**

1. **Doctor orders procedure**
   - Create Colonoscopy order
   - Anesthesia: Yes
   - Consent required: Yes
   - Pre-procedure instructions: "NPO after midnight"
   - Clinical indication: "Screening, age 50"

2. **Scheduling**
   - Schedule for next week
   - Add preparation instructions
   - Patient notified

3. **Day of procedure**
   - Update to `in_progress`
   - (Procedure performed)
   - Update to `completed`

4. **Post-procedure report**
   - Doctor adds findings
   - Impression: "Normal colonoscopy, no polyps"
   - Result: "normal"

**Expected Results:**
- ✅ Consent tracking works
- ✅ Pre-procedure instructions visible
- ✅ Complete workflow tracked

---

### Scenario 4: Order Cancellation

**Steps:**

1. Create imaging order
2. Patient calls to cancel
3. Receptionist cancels order
4. Reason: "Patient unavailable"
5. Verify status = `cancelled`
6. Verify cancelled_date set
7. Verify cancellation_reason saved
8. Order appears in cancelled filter

**Expected Results:**
- ✅ Cancellation reason mandatory
- ✅ Cancelled orders filterable
- ✅ Cannot update cancelled orders

---

### Scenario 5: Search Functionality

**Test Cases:**

1. **Search by Order Number**
   - Enter: ORD-2026-00001
   - Verify: Order found

2. **Search by Accession Number**
   - Enter: ACC-2026-00001
   - Verify: Order found

3. **Invalid Number**
   - Enter: ORD-9999-99999
   - Verify: 404 error with clear message

4. **Filter by Type**
   - Select: IMAGING
   - Verify: Only imaging orders shown

5. **Filter by Status**
   - Select: ordered
   - Verify: Only ordered status shown

6. **Filter by Date Range**
   - Select: Last 7 days
   - Verify: Only recent orders shown

7. **Combined Filters**
   - Type: LAB + Status: completed
   - Verify: Only completed lab orders

**Expected Results:**
- ✅ All search methods work
- ✅ Filters combine properly
- ✅ Error messages clear

---

### Scenario 6: Patient Order History

**Steps:**

1. Navigate to Patient Detail
2. Click "Order History" tab
3. View all orders for patient (across visits)
4. Filter by type
5. Sort by date
6. Export to PDF (future)

**Expected Results:**
- ✅ All patient orders visible
- ✅ Visit information shown
- ✅ Can drill down to order details
- ✅ Timeline view available

---

## Role-Based Access Control (RBAC) Testing

### Doctor Role
**Allowed:**
- ✅ Create orders (all types)
- ✅ View all orders
- ✅ Update order details
- ✅ Add reports (for imaging/procedure)
- ✅ Cancel orders

**Denied:**
- ❌ Delete orders (soft delete only)

### Nurse Role
**Allowed:**
- ✅ View orders
- ✅ Update order status
- ✅ Add notes

**Denied:**
- ❌ Create orders
- ❌ Add reports
- ❌ Cancel orders

### Radiologist Role
**Allowed:**
- ✅ View imaging orders
- ✅ Add radiology reports
- ✅ Update imaging order status

**Denied:**
- ❌ Create orders
- ❌ View lab/procedure orders (unless needed)

### Technician Role
**Allowed:**
- ✅ View assigned orders
- ✅ Update status (in_progress, completed)
- ✅ Add technical notes

**Denied:**
- ❌ Create orders
- ❌ Add medical reports
- ❌ Cancel orders

### Receptionist Role
**Allowed:**
- ✅ View orders
- ✅ Schedule orders
- ✅ Cancel orders (with reason)
- ✅ Search orders

**Denied:**
- ❌ Create orders
- ❌ Add reports

---

## Performance Testing

### Load Tests

1. **Create 1000 orders**
   - Generate via script
   - Mix of types (60% imaging, 30% lab, 10% procedure)
   - Verify: <2s response time

2. **List orders with filters**
   - Query with multiple filters
   - Verify: <1s response time
   - Check: Proper pagination

3. **Patient order history**
   - Patient with 100+ orders
   - Verify: <1.5s load time

4. **Search performance**
   - Search by accession number
   - Verify: <500ms response

### Database Indexes

Verify these indexes exist and are used:
```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'orders';

-- Expected indexes:
-- idx_orders_order_number (unique)
-- idx_orders_accession (unique)
-- idx_orders_patient_date
-- idx_orders_visit_type
-- idx_orders_status_type
-- idx_orders_patient
-- idx_orders_visit
-- idx_orders_status
-- idx_orders_type
```

### Query Optimization

Test slow queries:
```sql
-- This should use idx_orders_patient_date
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE patient_id = '...'
ORDER BY ordered_date DESC
LIMIT 20;

-- Should use idx_orders_status_type
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE status = 'ordered'
AND order_type = 'IMAGING';
```

---

## Integration Testing

### 1. Patient Context Integration

**Test:** Patient info in order modals

```
Visit Detail → Orders → Create Order
Modal title should show:
"Create Order - Priya Sharma (Female, 35y) [MRN: CLI-2026-00004]"
```

**Verify:**
- ✅ Patient name from visit.patient.full_name
- ✅ Age calculated from date_of_birth
- ✅ Gender displayed
- ✅ MRN shown

### 2. Visit Integration

**Test:** Orders tab in Visit Detail

```
Visit Detail → Orders Tab
Should show:
- All orders for this visit
- Create order button
- Type filter
- Order count badge
```

**Verify:**
- ✅ Only this visit's orders shown
- ✅ Real-time updates after create
- ✅ Patient context passed correctly

### 3. Navigation Testing

**Test:** Deep linking

```
Direct URL: /visits/{id}/orders/{orderId}
Should:
- Navigate to visit detail
- Auto-select Orders tab
- Open order detail modal
```

### 4. Reference Data Loading

**Test:** Modality/Test dropdowns

```
Create Order → Select Type
Should:
- Load modalities for IMAGING
- Load lab tests for LAB
- Load procedures for PROCEDURE
- Show loading state
- Cache for 1 hour
```

**Verify:**
- ✅ Data loads on mount
- ✅ Cached properly (no re-fetch on re-open)
- ✅ Dropdown search works

---

## Documentation Updates

### 1. API Documentation

Update: `backend/README.md`

Add Orders section:
```markdown
## Orders API

### Endpoints

#### Create Order
POST /api/v1/orders/
- Body: ImagingOrderCreate | LabOrderCreate | ProcedureOrderCreate
- Query: patient_id, visit_id
- Returns: Order

#### List Orders
GET /api/v1/orders/
- Query: order_type, status, patient_id, visit_id, date_from, date_to
- Returns: Order[]

... (all 15+ endpoints)
```

### 2. Frontend Documentation

Update: `frontend/README.md`

Add Orders section:
```markdown
## Orders Module

### Components
- OrderFormModal: Create orders with type-specific fields
- OrdersList: Display and filter orders
- OrderDetailModal: View/update order details

### Hooks
- useOrders: List orders with filters
- useCreateOrder: Create new order
- useUpdateOrderStatus: Update order status
- useAddReport: Add report to order

### Types
See: src/types/orders.ts
```

### 3. User Guide

Create: `docs/user-guide/ORDERS_MANAGEMENT.md`

Sections:
- Creating orders
- Scheduling orders
- Updating status
- Adding reports
- Searching orders
- Cancelling orders
- Role permissions

---

## Bug Fixes & Refinements

### Common Issues Checklist

- [ ] **Order number collision:** Test year rollover (Jan 1)
- [ ] **Accession number uniqueness:** Verify sequence logic
- [ ] **Status transition validation:** Can't go from completed → scheduled
- [ ] **Reference data refresh:** Update if new modality added
- [ ] **Form validation:** All required fields enforced
- [ ] **Date timezone handling:** Consistent UTC/local time
- [ ] **Patient safety:** Always show patient context
- [ ] **Permission checks:** Backend + frontend validation
- [ ] **Error messages:** User-friendly, actionable
- [ ] **Loading states:** No blank screens
- [ ] **Mobile responsiveness:** Table scrolls properly
- [ ] **Print functionality:** Order details printable
- [ ] **Audit trail:** Track all status changes

---

## Verification Checklist

### Backend Verification

```bash
# Run backend tests
cd backend
pytest tests/test_orders.py -v

# Test coverage
pytest --cov=app/services/order_service --cov-report=html
# Target: >80% coverage
```

### Frontend Verification

```bash
# Run frontend tests
cd frontend
npm test -- --coverage

# E2E tests (if implemented)
npm run test:e2e
```

### Manual Testing

- [ ] Create 10 orders (3 imaging, 4 lab, 3 procedure)
- [ ] Update status on all orders
- [ ] Add reports to imaging orders
- [ ] Cancel 2 orders
- [ ] Search by order number (5 tests)
- [ ] Search by accession number (5 tests)
- [ ] Filter by type (3 tests)
- [ ] Filter by status (6 tests)
- [ ] Filter by date range (3 tests)
- [ ] View patient order history
- [ ] Test all roles (5 roles × key actions)
- [ ] Test error scenarios (invalid data, network errors)
- [ ] Test loading states (slow network simulation)

### Database Verification

```sql
-- Verify data integrity
SELECT
  order_type,
  status,
  COUNT(*) as count
FROM orders
WHERE is_deleted = false
GROUP BY order_type, status;

-- Check for orphaned records
SELECT COUNT(*) FROM orders
WHERE patient_id NOT IN (SELECT id FROM patients);
-- Should be 0

-- Verify accession number uniqueness
SELECT accession_number, COUNT(*)
FROM orders
GROUP BY accession_number
HAVING COUNT(*) > 1;
-- Should be empty
```

---

## Performance Benchmarks

### Target Metrics

| Operation | Target | Acceptable | Action if Exceeded |
|-----------|--------|------------|-------------------|
| Create order | <500ms | <1s | Add caching |
| List orders | <800ms | <1.5s | Optimize query |
| Search by accession | <300ms | <500ms | Check index |
| Patient history (100 orders) | <1s | <2s | Add pagination |
| Update status | <400ms | <800ms | Check transaction |
| Add report | <600ms | <1s | Optimize save |

### Measurement Script

```python
import time
import requests

def benchmark_create_order():
    start = time.time()
    response = requests.post(
        "http://localhost:8000/api/v1/orders/",
        json={...},
        params={...}
    )
    elapsed = time.time() - start
    print(f"Create order: {elapsed*1000:.0f}ms")
    return elapsed

# Run 10 times, calculate average
times = [benchmark_create_order() for _ in range(10)]
avg = sum(times) / len(times)
print(f"Average: {avg*1000:.0f}ms")
```

---

## Deployment Checklist

Before Phase 4 goes to production:

- [ ] All Phase 4A tests passing
- [ ] All Phase 4B tests passing
- [ ] All Phase 4C tests passing
- [ ] Database migration tested on staging
- [ ] Seed data verified on staging
- [ ] Performance benchmarks met
- [ ] RBAC verified for all roles
- [ ] Documentation updated
- [ ] User training completed (if needed)
- [ ] Backup database before migration
- [ ] Rollback plan documented
- [ ] Monitor logs for 24 hours post-deploy

---

## Known Limitations (To Address in Future Phases)

1. **DICOM Integration:** Phase 4 creates orders only. Phase 5 will handle:
   - Actual image upload to Orthanc
   - Image viewing in frontend
   - Study linking via study_instance_uid

2. **Advanced Reporting:** Future enhancements:
   - Structured reporting templates
   - Voice dictation
   - Report macros/snippets
   - Digital signatures

3. **Analytics:** Future dashboard:
   - Order volume by type
   - Average turnaround times
   - Status distribution
   - Referring provider analytics

4. **Notifications:** Future feature:
   - Email/SMS when order status changes
   - Critical result notifications
   - Order overdue alerts

5. **Integration:** Future connections:
   - HL7/FHIR messaging
   - External lab interfaces
   - Insurance pre-authorization
   - Billing system integration

---

## Success Criteria

Phase 4 is considered **complete** when:

✅ **Functional Requirements:**
- Can create orders (imaging, lab, procedure)
- Order numbers and accession numbers auto-generate
- Orders progress through status workflow
- Reports can be added
- Orders can be cancelled with reason
- Search works (accession, order number, filters)
- Patient order history accessible

✅ **Quality Requirements:**
- All test scenarios pass
- Performance benchmarks met
- No critical bugs
- RBAC working correctly
- Patient safety maintained

✅ **Documentation Requirements:**
- API documented
- User guide created
- Code commented
- Phase completion report written

✅ **Integration Requirements:**
- Orders tab in Visit Detail works
- Order History in Patient Detail works
- Patient context in all modals
- Reference data loading properly

---

## Phase 4 Completion Report

Once all testing is complete, create:

**File:** `docs/phases/phase4/PHASE4_COMPLETION_REPORT.md`

**Contents:**
```markdown
# Phase 4: Orders Management System - Completion Report

**Start Date:** February 5, 2026
**End Date:** February 20, 2026
**Duration:** 15 days

## Deliverables Completed

### Phase 4A: Backend (✅ Complete)
- Order model with 5 supporting tables
- 15 API endpoints
- Order/Accession number generators
- Service layer with 20+ functions
- Database migration
- Seed data (31 reference records)

### Phase 4B: Frontend (✅ Complete)
- TypeScript types
- Order service with React Query hooks
- OrderFormModal (type-specific)
- OrdersList with filters
- OrderDetailModal
- Integration with Visit/Patient pages

### Phase 4C: Testing (✅ Complete)
- 6 workflow scenarios tested
- RBAC verified for 5 roles
- Performance benchmarks met
- Documentation updated

## Metrics

- Backend files: 8 files, ~2,500 lines
- Frontend files: 12 files, ~3,200 lines
- API endpoints: 15
- Database tables: 5
- Test scenarios: 6
- Orders created in testing: 50+

## Known Issues

(None)

## Next Steps

→ **Phase 5: DICOM Integration**
```

---

**Status:** Ready to execute  
**Estimated Completion:** February 22, 2026

**Phase 4 Total Duration:** 12-15 days  
**Phase 4 Total Effort:** ~80-100 hours
