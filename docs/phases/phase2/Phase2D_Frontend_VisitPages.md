# Phase 2D: Visit UI - List & Create Pages

**Sub-Phase:** 2D  
**Estimated Time:** 4-5 hours  
**Prerequisites:** Phase 2C Complete (Visit Service & Hooks)

---

## 1. Objective

Create the main visit list page with filtering capabilities and the visit creation page with patient search functionality.

---

## 2. Deliverables

- [ ] VisitList.tsx - Main visits page with filters
- [ ] VisitCreate.tsx - Create new visit page
- [ ] PatientSearchModal.tsx - Search and select patient modal
- [ ] DoctorSelect.tsx - Doctor selection dropdown
- [ ] VisitStatusBadge.tsx - Color-coded status badge
- [ ] VisitPriorityBadge.tsx - Priority indicator
- [ ] Visits index.ts barrel export
- [ ] App.tsx route updates

---

## 3. Files to Create/Modify

```
frontend/src/
├── pages/
│   └── visits/
│       ├── index.ts              # NEW: Barrel export
│       ├── VisitList.tsx         # NEW: Visits list page
│       └── VisitCreate.tsx       # NEW: Create visit page
├── components/
│   └── visits/
│       ├── index.ts              # NEW: Barrel export
│       ├── PatientSearchModal.tsx # NEW: Patient search
│       ├── DoctorSelect.tsx       # NEW: Doctor dropdown
│       ├── VisitStatusBadge.tsx   # NEW: Status badge
│       └── VisitPriorityBadge.tsx # NEW: Priority badge
└── App.tsx                        # Add visit routes
```

---

## 4. Component Specifications

### 4.1 VisitList.tsx

**Purpose:** Display all visits with filtering, sorting, and pagination.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Visit Management                        [Create Visit] btn  │
├─────────────────────────────────────────────────────────────┤
│ Filters:                                                    │
│ [Status ▼] [Type ▼] [Date Range] [Doctor ▼] [Search...]    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Visit No   │ Patient    │ Type    │ Status  │ Doctor   │ │
│ │ VIS-00001  │ John Doe   │ Consult │ 🟢 Wait │ Dr. X    │ │
│ │ VIS-00002  │ Jane Doe   │ Follow  │ 🔵 Reg  │ Dr. Y    │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Showing 1-20 of 150 visits              [< 1 2 3 ... 8 >]  │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Table with columns: Visit No, Patient (MRN + Name), Type, Status, Priority, Doctor, Date/Time, Actions
- Status filter dropdown (all statuses + "All")
- Type filter dropdown
- Date range picker
- Doctor filter dropdown
- Search box (searches visit number, patient name, MRN)
- Pagination with page size options
- Row click → Navigate to visit detail
- Action buttons: View, Edit, Cancel

**Table Columns:**
| Column | Width | Content |
|--------|-------|---------|
| Visit No | 140px | VIS-YYYY-NNNNN (link) |
| Patient | 200px | Name + MRN below |
| Type | 100px | Badge (consultation/follow_up/etc) |
| Status | 110px | VisitStatusBadge |
| Priority | 90px | VisitPriorityBadge |
| Doctor | 150px | Doctor name or "Unassigned" |
| Date/Time | 130px | Date + Check-in time |
| Actions | 120px | View, Edit, Cancel buttons |

### 4.2 VisitCreate.tsx

**Purpose:** Create a new visit for a patient.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Create New Visit                              [Back] btn    │
├─────────────────────────────────────────────────────────────┤
│ ── Patient Information ──────────────────────────────────── │
│                                                             │
│ Selected Patient:  [Select Patient] btn                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Rajesh Kumar (MRN: CLI-2026-00001)                   │ │
│ │    Age: 45 | Gender: Male | Phone: 9876543210           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ── Visit Details ────────────────────────────────────────── │
│                                                             │
│ Visit Type*:    [Consultation ▼]                            │
│ Priority*:      [Normal ▼]                                  │
│ Department:     [General Medicine ▼]                        │
│ Assign Doctor:  [Select Doctor ▼]                           │
│ Chief Complaint:                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ (Text area for complaint)                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Notes:                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ (Optional notes)                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│        [Create Visit & Check In] [Cancel]                   │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Patient selection via modal
- Pre-fill patient if navigated from patient detail (query param)
- Visit type dropdown (required)
- Priority dropdown (default: normal)
- Department dropdown
- Doctor assignment dropdown (optional)
- Chief complaint textarea (required for emergency)
- Notes textarea (optional)
- Create button submits and navigates to visit detail
- Auto-sets check_in_time on creation

**Validation:**
- Patient selection required
- Visit type required
- Chief complaint required for emergency visits
- Priority required

### 4.3 PatientSearchModal.tsx

**Purpose:** Modal for searching and selecting a patient when creating a visit.

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ Select Patient                                       [X]   │
├────────────────────────────────────────────────────────────┤
│ Search: [Enter name, MRN, or phone...               ] 🔍   │
├────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 👤 Rajesh Kumar          MRN: CLI-2026-00001          │ │
│ │    45M | 9876543210                        [Select]   │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ 👤 Priya Sharma          MRN: CLI-2026-00002          │ │
│ │    32F | 9988776655                        [Select]   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ [Cancel]                                                   │
└────────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface PatientSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (patient: Patient) => void;
}
```

**Features:**
- Debounced search input (300ms)
- Search by name, MRN, or phone
- List shows patient cards with key info
- Select button triggers onSelect callback
- Shows "No patients found" when empty
- Loading state during search

### 4.4 DoctorSelect.tsx

**Purpose:** Reusable dropdown for selecting a doctor (user with role=doctor).

**Props:**
```typescript
interface DoctorSelectProps {
  value?: string;
  onChange: (doctorId: string | undefined) => void;
  placeholder?: string;
  allowClear?: boolean;
  department?: string;  // Filter by department (future)
}
```

**Features:**
- Fetches users with role='doctor'
- Shows doctor name and specialty
- Searchable dropdown
- Clear button for optional selection
- Disabled state support

### 4.5 VisitStatusBadge.tsx

**Purpose:** Display visit status as a colored badge.

**Props:**
```typescript
interface VisitStatusBadgeProps {
  status: VisitStatus;
  size?: 'small' | 'default';
}
```

**Appearance:**
| Status | Color | Icon |
|--------|-------|------|
| registered | blue | CheckCircle |
| waiting | orange | ClockCircle |
| in_progress | cyan/processing | Sync/Spin |
| completed | green | CheckCircle |
| cancelled | gray | CloseCircle |

### 4.6 VisitPriorityBadge.tsx

**Purpose:** Display visit priority indicator.

**Props:**
```typescript
interface VisitPriorityBadgeProps {
  priority: VisitPriority;
  showLabel?: boolean;
}
```

**Appearance:**
| Priority | Color | Icon |
|----------|-------|------|
| normal | default | - |
| urgent | orange | ExclamationCircle |
| emergency | red | Alert |

---

## 5. Routes to Add

```typescript
// App.tsx routes
<Route path="visits" element={<VisitList />} />
<Route path="visits/create" element={<VisitCreate />} />
```

---

## 6. Navigation Updates

**Sidebar Menu:**
```typescript
{
  key: 'visits',
  icon: <CalendarOutlined />,
  label: 'Visits',
  children: [
    { key: 'visits-list', label: 'All Visits', path: '/visits' },
    { key: 'visits-create', label: 'New Visit', path: '/visits/create' },
    { key: 'visits-queue', label: 'Queue', path: '/visits/queue' },  // Phase 2E
  ],
}
```

---

## 7. URL Query Parameters

### VisitList
- `?status=waiting` - Pre-filter by status
- `?doctor={id}` - Pre-filter by doctor
- `?date={YYYY-MM-DD}` - Pre-filter by date

### VisitCreate
- `?patient={id}` - Pre-select patient (from patient detail page)

---

## 8. Error States

- **Empty State:** "No visits found" with illustration
- **Search Empty:** "No visits matching your search"
- **Loading State:** Skeleton table
- **Error State:** Error alert with retry button

---

## 9. Verification Checklist

- [ ] VisitList page renders correctly
- [ ] Filters work (status, type, date, doctor)
- [ ] Search works (visit number, patient name)
- [ ] Pagination works
- [ ] Row click navigates to detail
- [ ] VisitCreate page renders correctly
- [ ] Patient search modal works
- [ ] Can create visit with all fields
- [ ] Validation shows errors
- [ ] Create navigates to visit detail
- [ ] Pre-fill patient from URL param works
- [ ] Status/Priority badges display correctly
- [ ] Doctor select shows active doctors
- [ ] Routes configured in App.tsx
- [ ] Sidebar navigation works

---

## 10. Responsive Behavior

**Desktop (≥1200px):** Full table with all columns

**Tablet (768-1199px):** 
- Hide Doctor and Date columns
- Show in expandable row

**Mobile (<768px):**
- Card view instead of table
- Stack filters vertically
- Full-width search

---

## 11. Notes

- Use Ant Design Table, Form, Select, DatePicker components
- Follow existing patterns from PatientList/PatientCreate
- Keep consistent styling with patient pages
- Doctor list should cache (stale time: 5 min)
- Patient search results limited to 20

---

*End of Phase 2D*
