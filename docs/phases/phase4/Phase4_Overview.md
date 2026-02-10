# Phase 4: Imaging Orders

**Phase:** 4  
**Estimated Time:** 2-3 weeks  
**Prerequisites:** Phase 3 Complete

---

## 1. Overview

Implement imaging order management system for creating radiology orders, tracking order status, generating accession numbers, and preparing for DICOM integration.

---

## 2. Objectives

- Enable doctors to create imaging orders during visits
- Generate unique accession numbers for each order
- Track order status from creation to report
- Support common imaging modalities (X-Ray, CT, MRI, Ultrasound)
- Link orders to patients and visits
- Prepare infrastructure for DICOM integration (Phase 5)

---

## 3. Key Features

### 3.1 Imaging Order Creation
- Select imaging modality
- Specify body part/region
- Clinical indication
- Priority (routine, urgent, stat)
- Special instructions
- Auto-generate accession number

### 3.2 Order Status Management
- **Ordered**: Doctor creates order
- **Scheduled**: Appointment scheduled
- **In Progress**: Scan in progress
- **Completed**: Images acquired
- **Reported**: Report ready
- **Cancelled**: Order cancelled

### 3.3 Accession Number
- Unique identifier per order
- Format: ACC-YYYY-NNNNN
- Links order to DICOM images
- Used for tracking throughout workflow

### 3.4 Order Management
- View all orders
- Filter by status, modality, date
- Update order status
- Add notes/comments
- Cancel orders

---

## 4. Data Model

### ImagingOrder Model

```python
class ImagingOrder(BaseModel):
    __tablename__ = "imaging_orders"
    
    # Identifiers
    accession_number = String(20)  # ACC-YYYY-NNNNN
    order_number = String(20)  # ORD-YYYY-NNNNN
    
    # Relationships
    patient_id = UUID  # FK to patients
    visit_id = UUID  # FK to visits
    ordered_by = UUID  # FK to users (doctor)
    
    # Order Details
    modality = String  # XRAY, CT, MRI, US, etc.
    body_part = String  # chest, abdomen, head, etc.
    procedure_code = String  # CPT code
    procedure_name = Text
    laterality = String  # left, right, bilateral
    
    # Clinical Information
    clinical_indication = Text
    clinical_history = Text
    special_instructions = Text
    
    # Status
    status = String  # ordered, scheduled, in_progress, completed, reported, cancelled
    priority = String  # routine, urgent, stat
    
    # Scheduling
    ordered_date = DateTime
    scheduled_date = DateTime
    performed_date = DateTime
    reported_date = DateTime
    
    # Technical Details
    performing_technician = UUID  # FK to users
    reporting_radiologist = UUID  # FK to users
    
    # Report
    report_text = Text
    findings = Text
    impression = Text
    
    # DICOM Integration (Phase 5)
    study_instance_uid = String  # From DICOM
    number_of_images = Integer
    
    # Metadata
    notes = Text
    created_at = DateTime
    updated_at = DateTime
```

### ImagingModality Reference

```python
class ImagingModality(BaseModel):
    __tablename__ = "imaging_modalities"
    
    code = String(10)  # XRAY, CT, MRI, US
    name = String(100)  # X-Ray, CT Scan, MRI, Ultrasound
    description = Text
    is_active = Boolean
```

### BodyPart Reference

```python
class BodyPart(BaseModel):
    __tablename__ = "body_parts"
    
    code = String(20)
    name = String(100)  # Chest, Abdomen, Head, etc.
    modalities = JSON  # List of applicable modalities
```

---

## 5. Implementation Plan

### 5.1 Backend (1-1.5 weeks)

#### Models & Schema
- ImagingOrder SQLAlchemy model
- ImagingModality reference model
- BodyPart reference model
- Pydantic schemas for create, update, response
- Accession number generator
- Database migrations

#### Service Layer
- Create imaging order
- Update order status
- Get order by accession number
- List orders with filters
- Cancel order
- Add report to order
- Get patient imaging history

#### API Endpoints
- POST /api/v1/imaging/orders - Create order
- GET /api/v1/imaging/orders - List orders
- GET /api/v1/imaging/orders/{id} - Get order detail
- PUT /api/v1/imaging/orders/{id} - Update order
- PATCH /api/v1/imaging/orders/{id}/status - Update status
- DELETE /api/v1/imaging/orders/{id} - Cancel order
- GET /api/v1/imaging/orders/patient/{patient_id} - Patient orders
- GET /api/v1/imaging/orders/visit/{visit_id} - Visit orders
- GET /api/v1/imaging/orders/accession/{acc_no} - Get by accession
- GET /api/v1/imaging/modalities - Get modalities list
- GET /api/v1/imaging/body-parts - Get body parts list

---

### 5.2 Frontend (1-1.5 weeks)

#### Pages
- **ImagingOrderList.tsx** - All imaging orders
- **ImagingOrderCreate.tsx** - Create new order
- **ImagingOrderDetail.tsx** - Order details and status
- **PatientImagingHistory.tsx** - Patient's imaging orders

#### Components
- **ImagingOrderForm.tsx** - Order creation form
- **ModalitySelect.tsx** - Select imaging modality
- **BodyPartSelect.tsx** - Select body part
- **OrderStatusBadge.tsx** - Visual status indicator
- **OrderTimeline.tsx** - Order status history
- **AccessionNumberDisplay.tsx** - Prominent accession display

#### Services & Hooks
- imagingService.ts - API integration
- useImagingOrders.ts - React Query hooks
- useModalities.ts - Modality reference data

#### Integration Points
- Add "Order Imaging" button in visit detail
- Add "Imaging History" in patient detail
- Update sidebar with Imaging menu
- Add imaging order count to dashboard

---

## 6. API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/imaging/orders | Create imaging order |
| GET | /api/v1/imaging/orders | List all orders |
| GET | /api/v1/imaging/orders/{id} | Get order detail |
| PUT | /api/v1/imaging/orders/{id} | Update order |
| PATCH | /api/v1/imaging/orders/{id}/status | Update status |
| DELETE | /api/v1/imaging/orders/{id} | Cancel order |
| GET | /api/v1/imaging/orders/patient/{id} | Patient imaging history |
| GET | /api/v1/imaging/orders/visit/{id} | Visit imaging orders |
| GET | /api/v1/imaging/orders/accession/{acc} | Get by accession number |
| GET | /api/v1/imaging/modalities | List modalities |
| GET | /api/v1/imaging/body-parts | List body parts |

---

## 7. Order Creation Workflow

### UI Flow
1. Doctor viewing visit detail
2. Clicks "Order Imaging" button
3. Modal opens with order form
4. Selects modality (e.g., X-Ray)
5. Selects body part (e.g., Chest)
6. Enters clinical indication
7. Sets priority (routine/urgent)
8. Clicks "Submit Order"
9. System generates accession number
10. Order appears in orders list

### Backend Flow
1. Validate patient and visit exist
2. Generate accession number (ACC-2026-00001)
3. Generate order number (ORD-2026-00001)
4. Create order record
5. Set status to "ordered"
6. Return order with accession number
7. Send to integration queue (future)

---

## 8. Order Status Workflow

```
Ordered → Scheduled → In Progress → Completed → Reported
   ↓
Cancelled
```

### Status Transitions
- **Ordered → Scheduled**: When appointment booked
- **Scheduled → In Progress**: When scan starts
- **In Progress → Completed**: When images acquired
- **Completed → Reported**: When radiologist submits report
- **Any → Cancelled**: When order cancelled

### Who Updates Status
- **Ordered**: System (auto)
- **Scheduled**: Scheduler/Receptionist
- **In Progress**: Technician
- **Completed**: Technician
- **Reported**: Radiologist
- **Cancelled**: Doctor/Admin

---

## 9. Common Imaging Procedures

### X-Ray
- Chest X-Ray
- Abdomen X-Ray
- Extremities (arm, leg, hand, foot)
- Spine (cervical, thoracic, lumbar)

### CT Scan
- CT Head
- CT Chest
- CT Abdomen/Pelvis
- CT Angiography

### MRI
- MRI Brain
- MRI Spine
- MRI Joints (knee, shoulder)
- MRI Abdomen

### Ultrasound
- Abdomen Ultrasound
- Pelvic Ultrasound
- Obstetric Ultrasound
- Vascular Doppler

---

## 10. Seed Data

### Modalities
```sql
INSERT INTO imaging_modalities (code, name, description) VALUES
('XRAY', 'X-Ray', 'Plain radiography'),
('CT', 'CT Scan', 'Computed Tomography'),
('MRI', 'MRI', 'Magnetic Resonance Imaging'),
('US', 'Ultrasound', 'Ultrasonography'),
('MG', 'Mammography', 'Breast imaging'),
('FL', 'Fluoroscopy', 'Real-time X-ray imaging');
```

### Body Parts
```sql
INSERT INTO body_parts (code, name, modalities) VALUES
('CHEST', 'Chest', '["XRAY", "CT"]'),
('ABDOMEN', 'Abdomen', '["XRAY", "CT", "US"]'),
('HEAD', 'Head/Brain', '["CT", "MRI"]'),
('SPINE', 'Spine', '["XRAY", "CT", "MRI"]'),
('EXTREMITY', 'Extremities', '["XRAY", "MRI"]');
```

---

## 11. Verification Checklist

- [ ] Imaging order model created
- [ ] Accession number auto-generated (ACC-YYYY-NNNNN)
- [ ] Order number auto-generated (ORD-YYYY-NNNNN)
- [ ] Can create order from visit
- [ ] Modality and body part dropdowns populated
- [ ] Can update order status
- [ ] Order status transitions correctly
- [ ] Patient imaging history displays
- [ ] Visit imaging orders display
- [ ] Can search by accession number
- [ ] Can cancel order
- [ ] Order list with filters works
- [ ] Order detail page complete
- [ ] Dashboard shows imaging order count
- [ ] All endpoints tested via Swagger

---

## 12. Testing Scenarios

### Create Order
1. Open visit detail for patient
2. Click "Order Imaging"
3. Select modality: X-Ray
4. Select body part: Chest
5. Enter indication: "Suspected pneumonia"
6. Priority: Routine
7. Submit
8. Verify accession number generated
9. Order appears in list

### Update Status
1. Scheduler opens order
2. Schedules appointment for tomorrow
3. Status changes to "Scheduled"
4. Technician starts scan
5. Status changes to "In Progress"
6. Scan completes
7. Status changes to "Completed"

### Patient History
1. Open patient detail
2. Go to "Imaging History" tab
3. See all previous orders
4. Click on order to view detail
5. See images (Phase 5)

---

## 13. Success Criteria

- Doctor can create order in < 1 minute
- Accession number displayed prominently
- Order status updated in real-time
- Complete order history per patient
- Order list filterable by status, modality, date
- System ready for DICOM integration (Phase 5)

---

## 14. Integration Points

### With Phase 3 (Clinical)
- Link order to diagnosis
- Include relevant clinical notes in order
- Pre-fill indication from diagnosis

### With Phase 5 (DICOM)
- Accession number used as DICOM StudyID
- Order status updated when images uploaded
- Link DICOM images to order
- Display images in order detail

### With Future Phases
- Order to billing integration
- Report generation and storage
- PACS worklist integration

---

## 15. Future Enhancements

- Order templates for common procedures
- Procedure protocol attachments
- Image comparison (current vs previous)
- Critical findings alerts
- Structured reporting
- Integration with RIS (Radiology Information System)
- Mobile app for technicians

---

## 16. Next Phase

After Phase 4 completion, proceed to **Phase 5: DICOM Integration**
- Orthanc PACS setup
- Manual DICOM upload
- DICOM tag reading and modification
- OHIF Viewer integration

---

*End of Phase 4 Overview*
