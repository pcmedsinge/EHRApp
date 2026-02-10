# Phase 4: Orders Management System - Implementation Plan

**Status:** Ready to Start  
**Estimated Duration:** 2-3 weeks  
**Prerequisites:** Phase 3 Complete ✅

---

## Overview

Implement a **unified orders management system** supporting multiple order types (Imaging, Lab, Procedure) with accession number generation, order tracking, and status management. This prepares the foundation for DICOM integration (Phase 5) and lab integration (future).

**Key Decision:** Generic orders system instead of imaging-only, allowing providers to enter all types of clinical orders from one unified interface.

---

## Phase 4 Sub-Phases Structure

```
Phase 4A: Orders Backend (5-6 days)         ✅ Models, Accession Generator, API
Phase 4B: Orders Frontend (5-6 days)        ✅ Order Creation, List, Status Management
Phase 4C: Integration & Testing (2-3 days)  ✅ Visit Integration, Testing
```

---

## Phase 4A: Orders Backend (5-6 days)

### Objectives
- Create unified order model supporting multiple order types
- Implement accession and order number auto-generation
- Build order management service layer
- Create comprehensive API endpoints
- Seed reference data (modalities, tests, procedures)

### Database Schema Design

#### Order Model
```python
class Order(BaseModel):
    __tablename__ = "orders"
    
    # Identifiers
    id = UUID (PK)
    order_number = String(20)  # ORD-2026-00001 (all orders)
    accession_number = String(20)  # ACC-2026-00001 (imaging/lab/procedure only)
    
    # Type Discriminator
    order_type = String  # IMAGING, LAB, PROCEDURE
    
    # Relationships
    patient_id = UUID  # FK to patients
    visit_id = UUID  # FK to visits
    ordered_by = UUID  # FK to users (doctor)
    
    # Common Order Details
    status = String  # ordered, scheduled, in_progress, completed, reported, cancelled
    priority = String  # routine, urgent, stat
    clinical_indication = Text
    special_instructions = Text
    notes = Text
    
    # Type-Specific Details (JSON)
    order_details = JSON  # Flexible structure based on order_type
    
    # Scheduling
    ordered_date = DateTime (auto)
    scheduled_date = DateTime (nullable)
    performed_date = DateTime (nullable)
    reported_date = DateTime (nullable)
    cancelled_date = DateTime (nullable)
    cancellation_reason = Text
    
    # Personnel
    performing_user = UUID  # FK to users (technician/nurse)
    reporting_user = UUID  # FK to users (radiologist/pathologist)
    
    # Results/Report
    report_text = Text
    findings = Text
    impression = Text
    result_status = String  # normal, abnormal, critical
    
    # Integration Fields (Phase 5)
    study_instance_uid = String  # For DICOM integration
    number_of_images = Integer
    external_id = String  # For external lab/PACS systems
    
    # Metadata
    is_deleted = Boolean (default False)
    created_at = DateTime
    updated_at = DateTime
```

#### Order Details JSON Structure

**IMAGING Orders:**
```json
{
  "modality": "XRAY",
  "modality_name": "X-Ray",
  "body_part": "CHEST",
  "body_part_name": "Chest",
  "laterality": "bilateral",
  "procedure_code": "71020",
  "procedure_name": "Chest X-Ray 2 Views",
  "contrast": false,
  "clinical_history": "Cough for 2 weeks"
}
```

**LAB Orders:**
```json
{
  "test_code": "CBC",
  "test_name": "Complete Blood Count",
  "specimen_type": "blood",
  "specimen_source": "venous",
  "fasting_required": false,
  "collection_date": "2026-02-05T08:00:00",
  "panel": ["WBC", "RBC", "Hemoglobin", "Platelets"]
}
```

**PROCEDURE Orders:**
```json
{
  "procedure_code": "45378",
  "procedure_name": "Colonoscopy",
  "procedure_type": "diagnostic",
  "anesthesia_required": true,
  "estimated_duration": 30,
  "pre_procedure_instructions": "NPO after midnight"
}
```

#### Reference Tables

**ImagingModality** (reference data)
```python
class ImagingModality(BaseModel):
    code = String(10)  # XRAY, CT, MRI, US, MG, FL
    name = String(100)
    description = Text
    is_active = Boolean
```

**LabTest** (reference data)
```python
class LabTest(BaseModel):
    code = String(20)  # CBC, BMP, LFT, etc.
    name = String(200)
    category = String  # hematology, chemistry, microbiology, etc.
    specimen_type = String  # blood, urine, stool, etc.
    fasting_required = Boolean
    tat_hours = Integer  # Turnaround time
    is_active = Boolean
```

**ProcedureType** (reference data)
```python
class ProcedureType(BaseModel):
    code = String(20)  # CPT code
    name = String(200)
    category = String  # surgery, endoscopy, biopsy, etc.
    requires_consent = Boolean
    estimated_duration = Integer  # minutes
    is_active = Boolean
```

**BodyPart** (reference data for imaging)
```python
class BodyPart(BaseModel):
    code = String(20)
    name = String(100)
    applicable_modalities = JSON  # ["XRAY", "CT", "MRI"]
```

### Deliverables

#### 1. Models (`backend/app/models/`)

**`order.py`** (180-220 lines)
- Order model with all fields
- Relationships: patient, visit, ordered_by, performing_user, reporting_user
- Validation: order_type enum, status enum, priority enum
- Indexes: order_number, accession_number, status, order_type, patient_id, visit_id

**`imaging_modality.py`** (30-40 lines)
- ImagingModality reference model
- Seed data ready

**`lab_test.py`** (40-50 lines)
- LabTest reference model
- Seed data ready

**`procedure_type.py`** (40-50 lines)
- ProcedureType reference model
- Seed data ready

**`body_part.py`** (30-40 lines)
- BodyPart reference model
- Seed data ready

#### 2. Schemas (`backend/app/schemas/`)

**`order.py`** (200-250 lines)
```python
# Base schemas
class OrderBase(BaseModel):
    order_type: OrderType
    priority: OrderPriority
    clinical_indication: str
    special_instructions: Optional[str]

# Create schemas (type-specific)
class ImagingOrderCreate(OrderBase):
    modality: str
    body_part: str
    laterality: Optional[str]
    procedure_code: Optional[str]

class LabOrderCreate(OrderBase):
    test_code: str
    specimen_type: str
    fasting_required: bool

class ProcedureOrderCreate(OrderBase):
    procedure_code: str
    anesthesia_required: bool

# Update schemas
class OrderUpdate(BaseModel):
    status: Optional[OrderStatus]
    scheduled_date: Optional[datetime]
    special_instructions: Optional[str]

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str]

# Response schemas
class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    accession_number: Optional[str]
    order_type: OrderType
    status: OrderStatus
    priority: OrderPriority
    patient: PatientSummary
    visit: VisitSummary
    ordered_by: UserSummary
    order_details: dict
    clinical_indication: str
    ordered_date: datetime
    scheduled_date: Optional[datetime]
    # ... all fields

# Reference data schemas
class ModalityResponse(BaseModel): ...
class LabTestResponse(BaseModel): ...
class ProcedureTypeResponse(BaseModel): ...
class BodyPartResponse(BaseModel): ...
```

#### 3. Services (`backend/app/services/`)

**`order_service.py`** (300-350 lines)
```python
# Number generation
async def generate_order_number(db: AsyncSession) -> str:
    """Generate ORD-YYYY-NNNNN"""
    
async def generate_accession_number(db: AsyncSession) -> str:
    """Generate ACC-YYYY-NNNNN"""

# CRUD operations
async def create_order(
    db: AsyncSession,
    order_data: Union[ImagingOrderCreate, LabOrderCreate, ProcedureOrderCreate],
    patient_id: UUID,
    visit_id: UUID,
    user_id: UUID
) -> Order:
    """Create order with auto-generated numbers"""

async def get_order(db: AsyncSession, order_id: UUID) -> Order:
    """Get order by ID with relationships"""

async def get_order_by_accession(db: AsyncSession, accession: str) -> Order:
    """Search by accession number"""

async def get_order_by_number(db: AsyncSession, order_number: str) -> Order:
    """Search by order number"""

async def list_orders(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    order_type: Optional[OrderType] = None,
    status: Optional[OrderStatus] = None,
    patient_id: Optional[UUID] = None,
    visit_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
) -> List[Order]:
    """List orders with filters"""

async def update_order(
    db: AsyncSession,
    order_id: UUID,
    order_data: OrderUpdate
) -> Order:
    """Update order details"""

async def update_order_status(
    db: AsyncSession,
    order_id: UUID,
    status_data: OrderStatusUpdate,
    user_id: UUID
) -> Order:
    """Update order status with validation"""

async def cancel_order(
    db: AsyncSession,
    order_id: UUID,
    reason: str,
    user_id: UUID
) -> Order:
    """Cancel order with reason"""

async def add_report(
    db: AsyncSession,
    order_id: UUID,
    report_text: str,
    findings: str,
    impression: str,
    user_id: UUID
) -> Order:
    """Add report to order (imaging/lab/procedure)"""

async def get_patient_order_history(
    db: AsyncSession,
    patient_id: UUID,
    order_type: Optional[OrderType] = None
) -> List[Order]:
    """Get patient's order history"""

async def get_visit_orders(
    db: AsyncSession,
    visit_id: UUID,
    order_type: Optional[OrderType] = None
) -> List[Order]:
    """Get all orders for a visit"""

# Reference data services
async def get_imaging_modalities(db: AsyncSession) -> List[ImagingModality]:
async def get_lab_tests(db: AsyncSession) -> List[LabTest]:
async def get_procedure_types(db: AsyncSession) -> List[ProcedureType]:
async def get_body_parts(db: AsyncSession) -> List[BodyPart]:
```

#### 4. API Router (`backend/app/api/v1/orders/`)

**`order_router.py`** (350-400 lines)

**Endpoints:**
```python
# Order CRUD
POST   /api/v1/orders                    # Create order (any type)
GET    /api/v1/orders                    # List orders (with filters)
GET    /api/v1/orders/{id}               # Get order detail
PUT    /api/v1/orders/{id}               # Update order
DELETE /api/v1/orders/{id}               # Delete order (soft delete)

# Status management
PATCH  /api/v1/orders/{id}/status        # Update status
POST   /api/v1/orders/{id}/cancel        # Cancel order
POST   /api/v1/orders/{id}/report        # Add report

# Search
GET    /api/v1/orders/search             # Search by various criteria
GET    /api/v1/orders/accession/{acc}    # Get by accession number
GET    /api/v1/orders/number/{num}       # Get by order number

# Patient/Visit specific
GET    /api/v1/orders/patient/{id}       # Patient order history
GET    /api/v1/orders/visit/{id}         # Visit orders

# Reference data
GET    /api/v1/orders/modalities         # Imaging modalities
GET    /api/v1/orders/lab-tests          # Lab tests
GET    /api/v1/orders/procedures         # Procedure types
GET    /api/v1/orders/body-parts         # Body parts
```

**Implementation:**
```python
@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: Union[ImagingOrderCreate, LabOrderCreate, ProcedureOrderCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new order (imaging/lab/procedure)"""
    # Validate patient and visit exist
    # Generate order_number and accession_number
    # Create order
    # Return created order

@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    skip: int = 0,
    limit: int = 100,
    order_type: Optional[OrderType] = None,
    status: Optional[OrderStatus] = None,
    patient_id: Optional[UUID] = None,
    visit_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List orders with filtering"""

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    status_data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order status with role validation"""
    # Validate status transition
    # Update status
    # Return updated order

# ... other endpoints
```

#### 5. Database Migration (`backend/alembic/versions/`)

**`xxx_add_orders_system.py`**
```python
def upgrade():
    # Create orders table
    op.create_table(
        'orders',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('order_number', sa.String(20), nullable=False),
        sa.Column('accession_number', sa.String(20), nullable=True),
        sa.Column('order_type', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        # ... all columns
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id']),
        sa.ForeignKeyConstraint(['ordered_by'], ['users.id'])
    )
    
    # Create indexes
    op.create_index('idx_orders_order_number', 'orders', ['order_number'], unique=True)
    op.create_index('idx_orders_accession', 'orders', ['accession_number'], unique=True)
    op.create_index('idx_orders_status', 'orders', ['status'])
    op.create_index('idx_orders_type', 'orders', ['order_type'])
    op.create_index('idx_orders_patient', 'orders', ['patient_id'])
    op.create_index('idx_orders_visit', 'orders', ['visit_id'])
    
    # Create reference tables
    op.create_table('imaging_modalities', ...)
    op.create_table('lab_tests', ...)
    op.create_table('procedure_types', ...)
    op.create_table('body_parts', ...)
```

#### 6. Seed Data (`backend/app/db/`)

**`seed_orders_data.py`** (150-200 lines)

**Imaging Modalities:**
- XRAY - X-Ray
- CT - CT Scan
- MRI - MRI
- US - Ultrasound
- MG - Mammography
- FL - Fluoroscopy

**Body Parts:**
- CHEST, ABDOMEN, HEAD, SPINE, EXTREMITY, PELVIS, NECK, etc.

**Lab Tests:**
- CBC - Complete Blood Count
- BMP - Basic Metabolic Panel
- LFT - Liver Function Tests
- RFT - Renal Function Tests
- LIPID - Lipid Profile
- HBA1C - Hemoglobin A1c
- TSH - Thyroid Stimulating Hormone
- URINE - Urine Routine
- CULTURE - Blood/Urine Culture

**Procedure Types:**
- COLONOSCOPY
- ENDOSCOPY
- BIOPSY
- MINOR_SURGERY
- WOUND_CARE

### Verification Steps

1. **Database Setup**
```bash
cd backend
source venv/bin/activate
alembic upgrade head
python -m app.db.seed_orders_data
```

2. **Test via Swagger** (`http://localhost:8000/docs`)
```
✅ POST /api/v1/orders - Create imaging order
   - Verify order_number: ORD-2026-00001
   - Verify accession_number: ACC-2026-00001
   - Verify order_details JSON populated

✅ POST /api/v1/orders - Create lab order
   - Verify order_number auto-increments
   - Verify accession_number generated
   - Verify different order_details structure

✅ GET /api/v1/orders - List all orders
   - Verify both imaging and lab orders returned

✅ GET /api/v1/orders?order_type=IMAGING
   - Verify only imaging orders returned

✅ GET /api/v1/orders?status=ordered
   - Verify filtering works

✅ PATCH /api/v1/orders/{id}/status
   - Update status to "scheduled"
   - Verify updated_at changed

✅ GET /api/v1/orders/accession/ACC-2026-00001
   - Verify search by accession works

✅ GET /api/v1/orders/patient/{patient_id}
   - Verify patient order history

✅ GET /api/v1/orders/visit/{visit_id}
   - Verify visit orders

✅ GET /api/v1/orders/modalities
   - Verify 6 modalities seeded

✅ GET /api/v1/orders/lab-tests
   - Verify lab tests seeded

✅ POST /api/v1/orders/{id}/cancel
   - Verify status changes to cancelled
   - Verify cancellation_reason saved
```

3. **Database Verification**
```sql
-- Check orders table
SELECT COUNT(*) FROM orders;

-- Check order_number uniqueness
SELECT order_number, COUNT(*) FROM orders GROUP BY order_number;

-- Check accession_number uniqueness
SELECT accession_number, COUNT(*) FROM orders GROUP BY accession_number;

-- Check reference data
SELECT COUNT(*) FROM imaging_modalities;  -- Should be 6
SELECT COUNT(*) FROM lab_tests;           -- Should be 9+
SELECT COUNT(*) FROM procedure_types;     -- Should be 5+
SELECT COUNT(*) FROM body_parts;          -- Should be 10+
```

### Completion Criteria

- [ ] Order model created with all fields
- [ ] Reference models created (modality, lab test, procedure, body part)
- [ ] Schemas for all order types (imaging, lab, procedure)
- [ ] Order number generator (ORD-YYYY-NNNNN)
- [ ] Accession number generator (ACC-YYYY-NNNNN)
- [ ] Service layer with 15+ functions
- [ ] API router with 15+ endpoints
- [ ] Database migration applied successfully
- [ ] Seed data populated
- [ ] All endpoints tested via Swagger
- [ ] Order filtering works (type, status, patient, visit, date)
- [ ] Status updates work correctly
- [ ] Cancel order works with reason

---

## Phase 4B: Orders Frontend (5-6 days)

### Objectives
- Create order creation UI for all order types
- Build unified orders list with filtering
- Implement order detail view
- Add order status management
- Integrate into visit workflow

### Deliverables

#### 1. TypeScript Types (`frontend/src/types/`)

**`order.ts`** (150-180 lines)
```typescript
// Enums
export type OrderType = 'IMAGING' | 'LAB' | 'PROCEDURE';
export type OrderStatus = 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'reported' | 'cancelled';
export type OrderPriority = 'routine' | 'urgent' | 'stat';

// Order details by type
export interface ImagingOrderDetails {
  modality: string;
  modality_name: string;
  body_part: string;
  body_part_name: string;
  laterality?: string;
  procedure_code?: string;
  procedure_name?: string;
  contrast?: boolean;
  clinical_history?: string;
}

export interface LabOrderDetails {
  test_code: string;
  test_name: string;
  specimen_type: string;
  specimen_source?: string;
  fasting_required: boolean;
  collection_date?: string;
  panel?: string[];
}

export interface ProcedureOrderDetails {
  procedure_code: string;
  procedure_name: string;
  procedure_type: string;
  anesthesia_required: boolean;
  estimated_duration?: number;
  pre_procedure_instructions?: string;
}

// Main Order interface
export interface Order {
  id: string;
  order_number: string;
  accession_number?: string;
  order_type: OrderType;
  status: OrderStatus;
  priority: OrderPriority;
  patient: PatientSummary;
  visit: VisitSummary;
  ordered_by: UserSummary;
  order_details: ImagingOrderDetails | LabOrderDetails | ProcedureOrderDetails;
  clinical_indication: string;
  special_instructions?: string;
  notes?: string;
  ordered_date: string;
  scheduled_date?: string;
  performed_date?: string;
  reported_date?: string;
  cancelled_date?: string;
  cancellation_reason?: string;
  performing_user?: UserSummary;
  reporting_user?: UserSummary;
  report_text?: string;
  findings?: string;
  impression?: string;
  result_status?: string;
  created_at: string;
  updated_at: string;
}

// Create types
export interface ImagingOrderCreateData {
  order_type: 'IMAGING';
  priority: OrderPriority;
  clinical_indication: string;
  special_instructions?: string;
  modality: string;
  body_part: string;
  laterality?: string;
  procedure_code?: string;
}

export interface LabOrderCreateData {
  order_type: 'LAB';
  priority: OrderPriority;
  clinical_indication: string;
  special_instructions?: string;
  test_code: string;
  specimen_type: string;
  fasting_required: boolean;
}

export interface ProcedureOrderCreateData {
  order_type: 'PROCEDURE';
  priority: OrderPriority;
  clinical_indication: string;
  special_instructions?: string;
  procedure_code: string;
  anesthesia_required: boolean;
}

// Reference data types
export interface ImagingModality {
  code: string;
  name: string;
  description?: string;
}

export interface LabTest {
  code: string;
  name: string;
  category: string;
  specimen_type: string;
  fasting_required: boolean;
}

export interface ProcedureType {
  code: string;
  name: string;
  category: string;
  requires_consent: boolean;
}

export interface BodyPart {
  code: string;
  name: string;
  applicable_modalities: string[];
}
```

#### 2. API Services (`frontend/src/services/`)

**`orderApi.ts`** (250-300 lines)
```typescript
// Order CRUD
export const createOrder = async (
  visitId: string,
  patientId: string,
  orderData: ImagingOrderCreateData | LabOrderCreateData | ProcedureOrderCreateData
): Promise<Order> => { ... };

export const getOrders = async (filters?: {
  order_type?: OrderType;
  status?: OrderStatus;
  patient_id?: string;
  visit_id?: string;
  date_from?: string;
  date_to?: string;
}): Promise<Order[]> => { ... };

export const getOrder = async (orderId: string): Promise<Order> => { ... };

export const updateOrder = async (
  orderId: string,
  data: Partial<Order>
): Promise<Order> => { ... };

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  notes?: string
): Promise<Order> => { ... };

export const cancelOrder = async (
  orderId: string,
  reason: string
): Promise<Order> => { ... };

export const addReport = async (
  orderId: string,
  report: {
    report_text: string;
    findings: string;
    impression: string;
  }
): Promise<Order> => { ... };

// Search
export const searchByAccession = async (accession: string): Promise<Order> => { ... };
export const searchByOrderNumber = async (orderNumber: string): Promise<Order> => { ... };

// Patient/Visit specific
export const getPatientOrders = async (
  patientId: string,
  orderType?: OrderType
): Promise<Order[]> => { ... };

export const getVisitOrders = async (
  visitId: string,
  orderType?: OrderType
): Promise<Order[]> => { ... };

// Reference data
export const getImagingModalities = async (): Promise<ImagingModality[]> => { ... };
export const getLabTests = async (): Promise<LabTest[]> => { ... };
export const getProcedureTypes = async (): Promise<ProcedureType[]> => { ... };
export const getBodyParts = async (): Promise<BodyPart[]> => { ... };
```

#### 3. React Query Hooks (`frontend/src/hooks/`)

**`useOrders.ts`** (200-250 lines)
```typescript
export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrders(filters)
  });
};

export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, patientId, orderData }: {
      visitId: string;
      patientId: string;
      orderData: any;
    }) => createOrder(visitId, patientId, orderData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['visit-orders', data.visit.id] });
      message.success('Order created successfully');
    }
  });
};

export const useUpdateOrderStatus = () => { ... };
export const useCancelOrder = () => { ... };
export const usePatientOrders = (patientId: string) => { ... };
export const useVisitOrders = (visitId: string) => { ... };
export const useImagingModalities = () => { ... };
export const useLabTests = () => { ... };
export const useProcedureTypes = () => { ... };
export const useBodyParts = () => { ... };
```

#### 4. Components (`frontend/src/components/orders/`)

**`OrderForm.tsx`** (300-350 lines)
- Modal with tabs for order types (Imaging | Lab | Procedure)
- Dynamic form fields based on selected tab
- **Imaging tab:**
  - Modality dropdown (X-Ray, CT, MRI, US)
  - Body part dropdown (filtered by modality)
  - Laterality (left/right/bilateral)
  - Clinical indication textarea
  - Priority radio (routine/urgent/stat)
  - Special instructions
- **Lab tab:**
  - Test dropdown (CBC, BMP, LFT, etc.)
  - Specimen type (auto-filled from test)
  - Fasting required checkbox
  - Collection date picker
- **Procedure tab:**
  - Procedure dropdown
  - Anesthesia checkbox
  - Pre-procedure instructions
- Patient context in modal title (name, age, gender, MRN)
- Form validation
- Submit creates order with accession number

**`OrdersList.tsx`** (280-320 lines)
- Data table with columns:
  - Order Number (link to detail)
  - Accession Number (prominent, copyable)
  - Order Type (badge)
  - Patient Name
  - Status (color badge)
  - Priority (icon)
  - Ordered Date
  - Actions
- Filter controls:
  - Order type dropdown
  - Status dropdown
  - Date range picker
  - Search by accession/order number
- Action buttons:
  - View details
  - Update status
  - Cancel order
  - Add report (for completed orders)
- Pagination
- Loading states

**`OrderDetail.tsx`** (250-300 lines)
- Order information card:
  - Order number and accession (prominent)
  - Status badge with color
  - Priority indicator
  - Order type badge
- Patient context section
- Order details card (type-specific):
  - **Imaging**: Modality, body part, laterality
  - **Lab**: Test name, specimen type, fasting
  - **Procedure**: Procedure name, anesthesia
- Clinical information:
  - Indication
  - Special instructions
  - Clinical history
- Status timeline component
- Report section (if reported):
  - Findings
  - Impression
  - Result status
- Actions:
  - Update status button
  - Cancel order button
  - Add report button (radiologist/pathologist only)
  - Print order button

**`OrderStatusBadge.tsx`** (50-60 lines)
- Color-coded status badges:
  - ordered: blue
  - scheduled: cyan
  - in_progress: orange
  - completed: green
  - reported: purple
  - cancelled: red
- Icon per status
- Tooltip with status description

**`OrderStatusUpdate.tsx`** (120-150 lines)
- Dropdown to change status
- Role-based allowed transitions:
  - Doctor: All statuses
  - Receptionist: scheduled
  - Technician: in_progress, completed
  - Radiologist/Pathologist: reported
- Confirmation modal
- Optional notes field

**`OrderTypeBadge.tsx`** (40-50 lines)
- Type badges with icons:
  - IMAGING: FileImageOutlined (blue)
  - LAB: ExperimentOutlined (green)
  - PROCEDURE: ScissorOutlined (orange)

**`OrderTimeline.tsx`** (100-120 lines)
- Vertical timeline showing:
  - Ordered (date/time, by whom)
  - Scheduled (date/time)
  - In Progress (date/time, technician)
  - Completed (date/time)
  - Reported (date/time, radiologist)
  - Cancelled (date/time, reason)

**`CancelOrderModal.tsx`** (80-100 lines)
- Reason textarea (required)
- Confirmation message
- Cancel button

**`AddReportModal.tsx`** (150-180 lines)
- Report text editor
- Findings textarea
- Impression textarea
- Result status dropdown (normal/abnormal/critical)
- Submit button

#### 5. Pages (`frontend/src/pages/orders/`)

**`OrdersPage.tsx`** (200-250 lines)
- Page header: "Orders Management"
- "New Order" button (opens modal with visit/patient selection)
- Filter section
- Orders list component
- Export orders button

**`OrderDetailPage.tsx`** (150-180 lines)
- Back button to orders list
- Order detail component
- Related orders section (other orders for same patient)

#### 6. Integration Points

**`VisitDetail.tsx`** modifications (add new tab):
```tsx
// Add Orders tab
{
  key: 'orders',
  label: (
    <Space>
      <FileTextOutlined />
      Orders
    </Space>
  ),
  children: (
    <OrdersList
      visitId={visit.id}
      patientId={visit.patient_id}
      patientName={visit.patient?.full_name}
      patientMrn={visit.patient?.mrn}
      patientDateOfBirth={visit.patient?.date_of_birth}
      patientGender={visit.patient?.gender}
      showCreateButton={true}
      canEdit={!['completed', 'cancelled'].includes(visit.status)}
    />
  )
}
```

**`PatientDetail.tsx`** modifications (add Orders History tab):
```tsx
// Add Orders History tab
{
  key: 'orders',
  label: 'Order History',
  children: (
    <PatientOrderHistory patientId={patient.id} />
  )
}
```

**`Sidebar.tsx`** modifications:
```tsx
// Add Orders menu item
{
  key: '/orders',
  icon: <FileTextOutlined />,
  label: 'Orders',
  onClick: () => navigate('/orders')
}
```

**`Dashboard.tsx`** modifications:
```tsx
// Add order statistics card
<Card title="Orders Overview">
  <Statistic title="Pending Orders" value={pendingCount} />
  <Statistic title="Completed Today" value={completedToday} />
  <Statistic title="Awaiting Report" value={awaitingReport} />
</Card>
```

### Verification Steps

1. **Order Creation**
```
✅ Click "New Order" in visit detail
✅ Modal opens with patient context in title
✅ Select Imaging tab
✅ Select modality: X-Ray
✅ Select body part: Chest
✅ Enter indication: "Suspected pneumonia"
✅ Submit
✅ Verify accession number displayed: ACC-2026-00001
✅ Order appears in Orders tab
```

2. **Order List & Filters**
```
✅ Navigate to Orders page
✅ See all orders in table
✅ Filter by type: IMAGING → Only imaging orders shown
✅ Filter by status: ordered → Only ordered status shown
✅ Search by accession: ACC-2026-00001 → Order found
✅ Click order → Detail page opens
```

3. **Order Status Update**
```
✅ Open order detail
✅ Click "Update Status"
✅ Select "scheduled"
✅ Verify status badge changes to cyan
✅ Verify timeline updated
```

4. **Cancel Order**
```
✅ Click "Cancel Order"
✅ Enter reason: "Patient declined"
✅ Confirm
✅ Verify status changes to cancelled
✅ Verify reason displayed
```

5. **Patient Order History**
```
✅ Open patient detail
✅ Go to Orders History tab
✅ See all patient orders
✅ Click order → Detail modal opens
```

### Completion Criteria

- [ ] Order types defined in TypeScript
- [ ] API service with 15+ functions
- [ ] React Query hooks for all operations
- [ ] OrderForm with 3 tabs (imaging/lab/procedure)
- [ ] OrdersList with filters and search
- [ ] OrderDetail page complete
- [ ] Status badges with colors
- [ ] Status update functionality
- [ ] Cancel order with reason
- [ ] Order timeline component
- [ ] Integration into VisitDetail (Orders tab)
- [ ] Integration into PatientDetail (Order History tab)
- [ ] Sidebar menu item added
- [ ] Patient context in order modal titles
- [ ] All CRUD operations working
- [ ] Real-time status updates

---

## Phase 4C: Integration & Testing (2-3 days)

### Objectives
- Complete integration into visit workflow
- Test full order lifecycle
- Verify role-based permissions
- Test all order types
- Prepare documentation

### Tasks

#### 1. Visit Workflow Integration
- [ ] "New Order" button in visit detail actions
- [ ] Orders tab shows visit orders grouped by type
- [ ] Quick order creation from visit context
- [ ] Order count badge on Orders tab

#### 2. Patient History Integration
- [ ] Order History tab in patient detail
- [ ] Chronological display of all orders
- [ ] Filter by order type
- [ ] Quick view modal for order details

#### 3. Dashboard Integration
- [ ] Order statistics widget
- [ ] Pending orders count
- [ ] Recent orders list (last 10)
- [ ] Critical results alert (if result_status = critical)

#### 4. Role-Based Access Testing

**Doctor:**
- [ ] Can create all order types
- [ ] Can view all orders
- [ ] Can update any status
- [ ] Can cancel orders
- [ ] Can add clinical indication

**Radiologist/Pathologist:**
- [ ] Can view orders
- [ ] Can update to "reported"
- [ ] Can add reports
- [ ] Cannot create or cancel orders

**Technician:**
- [ ] Can view orders
- [ ] Can update to "in_progress" and "completed"
- [ ] Cannot create or cancel orders

**Receptionist:**
- [ ] Can view orders
- [ ] Can update to "scheduled"
- [ ] Cannot create or cancel orders

**Nurse:**
- [ ] Can view orders only
- [ ] Cannot create, update, or cancel

#### 5. Comprehensive Testing Scenarios

**Scenario 1: Complete Imaging Order Workflow**
1. Login as doctor
2. Open visit for patient
3. Click "New Order" → Imaging tab
4. Select X-Ray → Chest
5. Enter indication: "Suspected pneumonia"
6. Priority: Urgent
7. Submit
8. Verify accession: ACC-2026-00001
9. Logout

10. Login as receptionist
11. Open order
12. Update status: Scheduled
13. Set scheduled_date: Tomorrow 10 AM
14. Logout

15. Login as technician
16. Update status: In Progress
17. Update status: Completed
18. Logout

19. Login as radiologist
20. Add report: findings, impression
21. Update status: Reported
22. Logout

23. Login as doctor
24. View report
25. Verify complete timeline

**Scenario 2: Lab Order Workflow**
1. Create lab order: CBC
2. Verify test details auto-filled
3. Update through statuses
4. Add lab results
5. Verify patient can see results

**Scenario 3: Multiple Orders Per Visit**
1. Create 3 orders: X-Ray, CBC, Ultrasound
2. Verify all show in Orders tab
3. Update each independently
4. Verify no interference

**Scenario 4: Cancel Order**
1. Create order
2. Cancel with reason
3. Verify cannot update status after cancel
4. Verify appears in cancelled filter

**Scenario 5: Search & Filter**
1. Create 10+ orders (mix of types)
2. Search by accession number
3. Filter by type: LAB
4. Filter by status: completed
5. Date range filter
6. Verify correct results

**Scenario 6: Patient Order History**
1. Create orders across 3 visits
2. Open patient detail
3. Go to Order History
4. Verify all orders shown
5. Filter by type
6. Click order → Detail view

#### 6. Data Validation Testing

**Number Generation:**
- [ ] Order numbers unique (ORD-2026-00001, ORD-2026-00002)
- [ ] Accession numbers unique (ACC-2026-00001, ACC-2026-00002)
- [ ] Year changes in format (ORD-2027-00001 in 2027)

**Status Transitions:**
- [ ] Cannot skip statuses (ordered → completed not allowed)
- [ ] Proper workflow: ordered → scheduled → in_progress → completed → reported
- [ ] Cancelled can happen from any state

**Order Details Validation:**
- [ ] Imaging orders require modality and body part
- [ ] Lab orders require test_code
- [ ] Procedure orders require procedure_code
- [ ] JSON structure correct for each type

#### 7. Performance Testing
- [ ] List 100+ orders without lag
- [ ] Filters apply quickly
- [ ] Search is fast
- [ ] Order creation < 2 seconds
- [ ] Status update < 1 second

#### 8. Documentation
- [ ] Update README with Orders section
- [ ] API documentation in Swagger
- [ ] User guide for order management
- [ ] Screenshots of order workflow

### Final Verification Checklist

**Backend:**
- [ ] All API endpoints working
- [ ] Number generation tested
- [ ] Status transitions validated
- [ ] Role-based permissions enforced
- [ ] Database indexes created
- [ ] Seed data loaded

**Frontend:**
- [ ] Order creation works for all types
- [ ] Order list displays correctly
- [ ] Filters and search work
- [ ] Status updates work
- [ ] Cancel order works
- [ ] Patient context in modals
- [ ] Responsive design

**Integration:**
- [ ] Visit Orders tab working
- [ ] Patient Order History working
- [ ] Dashboard statistics correct
- [ ] Sidebar navigation working

**Testing:**
- [ ] All 6 test scenarios passed
- [ ] Role-based access verified
- [ ] Data validation tested
- [ ] Performance acceptable

---

## Phase 4 Timeline Summary

| Sub-Phase | Duration | Key Deliverables | Status |
|-----------|----------|------------------|--------|
| **4A: Backend** | 5-6 days | Models, Services, API, Migration | ⬜ Pending |
| **4B: Frontend** | 5-6 days | UI Components, Pages, Integration | ⬜ Pending |
| **4C: Integration** | 2-3 days | Testing, Documentation | ⬜ Pending |
| **Total** | **12-15 days** | **Complete Orders System** | |

---

## Success Criteria

✅ **Functional:**
1. Create orders for imaging, lab, procedure types
2. Accession numbers auto-generated (ACC-YYYY-NNNNN)
3. Order numbers auto-generated (ORD-YYYY-NNNNN)
4. Status workflow complete (ordered → reported)
5. Role-based status updates working
6. Search by accession/order number
7. Filter by type, status, date
8. Patient order history accessible
9. Visit orders grouped by type

✅ **Technical:**
1. Unified Order model with order_type discriminator
2. JSON order_details for type-specific data
3. Proper indexes on critical fields
4. API with 15+ endpoints
5. React Query for state management
6. TypeScript types for type safety

✅ **Integration:**
1. Orders tab in visit detail
2. Order History tab in patient detail
3. Dashboard order statistics
4. Patient context in order modals (name, age, gender, MRN)

✅ **Performance:**
1. Order creation < 2 seconds
2. List 100+ orders without lag
3. Search/filter responds quickly

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex JSON validation | Medium | Use JSON schema validation in Pydantic |
| Status transition logic | Medium | State machine pattern with clear rules |
| Performance with many orders | Low | Database indexes, pagination, caching |
| Type-specific UI complexity | Medium | Reusable form components, clear structure |
| Role-based permission bugs | High | Comprehensive testing matrix |

---

## Dependencies

**Before Phase 4A:**
- ✅ Phase 3 complete (vitals, diagnosis, clinical notes)
- ✅ Visit management working
- ✅ Patient management working
- ✅ User roles defined

**Before Phase 5:**
- ✅ Phase 4 complete (accession numbers ready)
- ✅ Order tracking working
- ✅ Orthanc running in Docker

---

## Next Steps

1. **Review this plan** - Confirm scope and approach
2. **Start Phase 4A** - Begin with Orders Backend
3. **Daily progress updates** - Track completion
4. **Test each sub-phase** - Verify before moving forward
5. **Document issues** - Track blockers immediately

---

## Phase 5 Preview

After Phase 4 completion, Phase 5 will add:
- Manual DICOM upload to Orthanc
- Link DICOM images to orders via accession number
- OHIF Viewer integration
- Image viewing in order detail
- DICOM tag reading and modification
- Study/Series/Instance hierarchy

---

**Ready to start Phase 4A: Orders Backend? 🚀**

**Estimated Start Date:** February 6, 2026  
**Estimated Completion:** February 20-25, 2026
