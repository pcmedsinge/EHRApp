# Phase 2E: Visit UI - Detail Pages

**Sub-Phase:** 2E  
**Estimated Time:** 3-4 hours  
**Prerequisites:** Phase 2D Complete (Visit List & Create Pages)

---

## ⚠️ Feature Flags Notice

This sub-phase contains **OPTIONAL** components controlled by feature flags:

| Component | Required | Feature Flag |
|-----------|----------|--------------|
| VisitDetail.tsx | ✅ Core | Always |
| VisitEdit.tsx | ✅ Core | Always |
| VisitStatusActions.tsx | ✅ Core | Always |
| CancelVisitModal.tsx | ✅ Core | Always |
| VisitQueue.tsx | ⚡ Optional | `VISIT_QUEUE_ENABLED` |
| VisitCard.tsx | ⚡ Optional | `VISIT_QUEUE_ENABLED` |
| VisitTimeline.tsx | ⚡ Optional | `VISIT_QUEUE_ENABLED` |

> **Default Mode:** Queue components are **NOT** rendered when `VISIT_QUEUE_ENABLED = false` (default). Build them but hide from navigation.

---

## 1. Objective

Create the visit detail view, edit page, and status management. Queue management is optional and toggled off by default.

---

## 2. Deliverables

### Core (Always Implement)
- [ ] VisitDetail.tsx - View complete visit information
- [ ] VisitEdit.tsx - Edit visit details
- [ ] VisitStatusActions.tsx - Status change buttons
- [ ] CancelVisitModal.tsx - Cancel confirmation
- [ ] Route updates in App.tsx

### Optional (Queue Feature - Skip Initially)
- [ ] VisitQueue.tsx - Today's queue management
- [ ] VisitCard.tsx - Compact visit card for queue
- [ ] VisitTimeline.tsx - Status history timeline
- [ ] Real-time queue updates

---

## 3. Files to Create/Modify

### Core Files (Always Create)
```
frontend/src/
├── pages/
│   └── visits/
│       ├── index.ts              # Update exports
│       ├── VisitDetail.tsx       # NEW: Visit detail page
│       └── VisitEdit.tsx         # NEW: Edit visit page
├── components/
│   └── visits/
│       ├── index.ts              # Update exports
│       ├── VisitStatusActions.tsx # NEW: Status buttons
│       └── CancelVisitModal.tsx  # NEW: Cancel confirmation
└── App.tsx                        # Add routes
```

### Optional Files (Queue Feature - Create Later)
```
frontend/src/
├── pages/
│   └── visits/
│       └── VisitQueue.tsx        # OPTIONAL: Queue management
├── components/
│   └── visits/
│       ├── VisitCard.tsx         # OPTIONAL: Visit card
│       └── VisitTimeline.tsx     # OPTIONAL: Status timeline
└── hooks/
    └── useFeatureFlags.ts        # Feature flag hook
```

---

## 4. Component Specifications

### 4.1 VisitDetail.tsx

**Purpose:** Display complete visit information with status management.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Visit: VIS-2026-00042                   [Edit] [Cancel] btn │
│ Status: [🟡 Waiting]           Created: 31/01/2026 09:15 AM │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─── Status Actions ────────────────────────────────────┐   │
│ │  [Mark In Progress]  [Mark Completed]  [Cancel Visit] │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ── Patient Information ──────────────────────────────────── │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Rajesh Kumar (MRN: CLI-2026-00001)    [View Patient] │ │
│ │    Age: 45 | Male | Phone: 9876543210                   │ │
│ │    Blood Group: O+ | Allergies: Penicillin              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ── Visit Details ────────────────────────────────────────── │
│                                                             │
│ Visit Type:     Consultation                                │
│ Priority:       🔴 Urgent                                   │
│ Department:     General Medicine                            │
│ Assigned Doctor: Dr. Sharma                                 │
│ Chief Complaint: Fever and headache for 3 days              │
│ Notes:          Patient has history of typhoid              │
│                                                             │
│ ── Timeline ─────────────────────────────────────────────── │
│                                                             │
│ ⬤ Registered    09:15 AM    (15 min ago)                   │
│ │                                                           │
│ ⬤ Waiting       09:18 AM    (12 min ago)                   │
│ │                                                           │
│ ○ In Progress   --                                          │
│ │                                                           │
│ ○ Completed     --                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Header with visit number and status badge
- Status action buttons (contextual based on current status)
- Patient summary card with link to patient detail
- Visit details section (type, priority, doctor, complaint)
- Status timeline showing progression
- Edit and Cancel buttons in header
- Timestamps for each status change
- Waiting time display for waiting status

**Tabs (Optional):**
- Details (default)
- Notes/History
- Clinical (placeholder for Phase 3)

### 4.2 VisitEdit.tsx

**Purpose:** Edit existing visit details.

**Editable Fields:**
- Visit type
- Priority
- Department
- Assigned doctor
- Chief complaint
- Notes

**Non-editable (Display only):**
- Visit number
- Patient
- Status
- Check-in time

**Restrictions:**
- Cannot edit completed visits
- Cannot edit cancelled visits
- Show warning if editing in_progress visit

### 4.3 VisitQueue.tsx

**Purpose:** Real-time queue management for today's visits.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Today's Visit Queue                   [Refresh] [New Visit] │
│ 31 January 2026 • 15 visits today                           │
├─────────────────────────────────────────────────────────────┤
│ ┌─── Filter ────────────────────────────────────────────┐   │
│ │ [All] [Registered: 3] [Waiting: 5] [In Progress: 2]   │   │
│ └───────────────────────────────────────────────────────┘   │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│ Waiting (5)              │ In Progress (2)                  │
│ ┌──────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ 🟡 VIS-00042         │ │ │ 🔵 VIS-00040                 │ │
│ │ Rajesh Kumar         │ │ │ Priya Sharma                 │ │
│ │ Wait: 25 min         │ │ │ With: Dr. Sharma             │ │
│ │ 🔴 Urgent            │ │ │ Duration: 15 min             │ │
│ │ [Start Consult]      │ │ │ [Complete]                   │ │
│ └──────────────────────┘ │ └──────────────────────────────┘ │
│ ┌──────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ 🟡 VIS-00043         │ │ │ 🔵 VIS-00039                 │ │
│ │ Amit Patel           │ │ │ Sunita Devi                  │ │
│ │ Wait: 18 min         │ │ │ With: Dr. Gupta              │ │
│ │ [Start Consult]      │ │ │ Duration: 32 min             │ │
│ └──────────────────────┘ │ └──────────────────────────────┘ │
│ ┌──────────────────────┐ │                                  │
│ │ ...more              │ │                                  │
│ └──────────────────────┘ │                                  │
│                          │                                  │
├──────────────────────────┴──────────────────────────────────┤
│                                                             │
│ Completed Today (8)                              [View All] │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ VIS-00038 • Mohan Lal • Completed at 10:45 AM          │ │
│ │ VIS-00037 • Geeta Devi • Completed at 10:20 AM         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Split view: Waiting vs In Progress
- Cards sorted by wait time (longest first for waiting)
- Real-time updates (auto-refresh every 30 seconds)
- Quick status change buttons on cards
- Priority indicators
- Wait time / consultation duration display
- Completed visits collapsed at bottom
- Filter tabs for status
- Doctor-specific view option

**Queue Card Information:**
- Visit number
- Patient name
- Wait time or consultation duration
- Priority badge
- Action button based on status

### 4.4 VisitCard.tsx

**Purpose:** Compact card component for queue display.

**Props:**
```typescript
interface VisitCardProps {
  visit: Visit;
  onStatusChange?: (visitId: string, newStatus: VisitStatus) => void;
  onClick?: (visitId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}
```

**Variants:**
- **Queue Card:** Shows wait time, action buttons
- **Compact Card:** Minimal info for lists
- **Detail Card:** Full info in patient history

### 4.5 VisitStatusActions.tsx

**Purpose:** Render contextual action buttons based on current status.

**Props:**
```typescript
interface VisitStatusActionsProps {
  visit: Visit;
  onStatusChange: (newStatus: VisitStatus) => void;
  loading?: boolean;
  size?: 'small' | 'default' | 'large';
}
```

**Button Mapping:**
| Current Status | Available Actions |
|----------------|-------------------|
| registered | "Move to Waiting", "Cancel" |
| waiting | "Start Consultation", "Cancel" |
| in_progress | "Complete", "Cancel" |
| completed | (none) |
| cancelled | (none) |

### 4.6 VisitTimeline.tsx

**Purpose:** Display status progression timeline.

**Props:**
```typescript
interface VisitTimelineProps {
  visit: Visit;
  showAll?: boolean;  // Show future steps grayed out
}
```

**Timeline Items:**
| Status | Icon | Timestamp Source |
|--------|------|------------------|
| Registered | ✓ | created_at |
| Waiting | ◐ | check_in_time |
| In Progress | ◐ | consultation_start_time |
| Completed | ✓ | consultation_end_time |
| Cancelled | ✗ | updated_at |

### 4.7 CancelVisitModal.tsx

**Purpose:** Confirmation modal with reason input for cancellation.

**Props:**
```typescript
interface CancelVisitModalProps {
  open: boolean;
  visit: Visit;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}
```

**Validation:**
- Cancellation reason required (min 10 characters)
- Show warning about irreversibility

---

## 5. Routes to Add

```typescript
// App.tsx routes
<Route path="visits/:id" element={<VisitDetail />} />
<Route path="visits/:id/edit" element={<VisitEdit />} />
<Route path="visits/queue" element={<VisitQueue />} />
```

---

## 6. Real-time Updates

**Queue Page Auto-refresh:**
```typescript
const { data: queue, refetch } = useVisitQueue();

// Auto-refresh every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    refetch();
  }, 30000);
  
  return () => clearInterval(interval);
}, [refetch]);
```

**Manual Refresh:**
- Refresh button in header
- Refetch on status change success

---

## 7. Doctor View

**Filter queue by logged-in doctor:**
```typescript
const { user } = useAuth();
const isDoctorRole = user?.role === 'doctor';

// If doctor, auto-filter to their assigned visits
const doctorFilter = isDoctorRole ? user.id : undefined;
```

---

## 8. Error Handling

**Status Change Errors:**
- Invalid transition → Show error toast
- Visit not found → Redirect to list
- Concurrent modification → Show conflict error, offer refresh

**Cancel Errors:**
- Already cancelled → Show info message
- Already completed → Show warning

---

## 9. Verification Checklist

- [ ] VisitDetail shows all visit information
- [ ] Status timeline renders correctly
- [ ] Status actions appear based on current status
- [ ] Can change status from detail page
- [ ] VisitEdit loads existing data
- [ ] Edit saves changes correctly
- [ ] Cannot edit completed/cancelled visits
- [ ] VisitQueue shows today's visits only
- [ ] Queue splits by status correctly
- [ ] Wait time updates automatically
- [ ] Cancel modal requires reason
- [ ] Cancel updates visit correctly
- [ ] Cards navigate to detail on click
- [ ] Routes work correctly
- [ ] Auto-refresh works on queue

---

## 10. Responsive Behavior

**Queue Page:**
- Desktop: Two-column (Waiting | In Progress)
- Tablet: Tabbed view
- Mobile: Stacked cards with status tabs

**Detail Page:**
- Desktop: Full layout
- Mobile: Stacked sections, collapsible cards

---

## 11. Notes

- Use Ant Design Card, Timeline, Button, Modal
- Queue cards should be draggable (future enhancement)
- Consider WebSocket for real-time (post-MVP)
- Keep consistent with patient detail page styling
- Show patient allergies prominently (safety)

---

*End of Phase 2E*
