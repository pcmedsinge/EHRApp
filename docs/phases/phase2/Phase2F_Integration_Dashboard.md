# Phase 2F: Visit Integration & Dashboard

**Sub-Phase:** 2F  
**Status:** ✅ Complete  
**Prerequisites:** Phase 2E Complete (Visit Detail & Queue Pages)

---

## 1. Objective

Integrate visit functionality with existing modules (Patient detail, Dashboard) and add visit-related widgets and navigation.

---

## 2. Deliverables

- [x] Add Visit History tab to PatientDetail page
- [x] Add "Create Visit" button to Patient pages
- [x] Update Dashboard with visit statistics widget
- [x] Add Today's Appointments widget to Dashboard
- [ ] Update sidebar navigation with Visits menu
- [ ] Add quick stats cards (Today's visits, Waiting, In Progress)
- [ ] Verify end-to-end workflow

---

## 3. Files to Modify

```
frontend/src/
├── pages/
│   ├── Dashboard.tsx              # Add visit widgets
│   └── patients/
│       ├── PatientDetail.tsx      # Add visit history tab
│       └── PatientList.tsx        # Add quick visit action
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx            # Update navigation
│   └── dashboard/
│       ├── index.ts               # NEW: Dashboard components export
│       ├── TodayVisitsWidget.tsx  # NEW: Today's visits widget
│       ├── VisitStatsWidget.tsx   # NEW: Visit statistics
│       └── QuickActionsWidget.tsx # UPDATE: Add visit actions
└── hooks/
    └── useDashboard.ts            # NEW: Dashboard data hooks
```

---

## 4. Component Specifications

### 4.1 PatientDetail - Visit History Tab

**Add new tab to existing PatientDetail page:**

```
┌─────────────────────────────────────────────────────────────┐
│ Patient: Rajesh Kumar (CLI-2026-00001)                      │
├─────────────────────────────────────────────────────────────┤
│ [Personal Info] [Contact] [Medical Info] [Visit History]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Visit History (12 visits)              [Create New Visit]   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 VIS-2026-00042 • Today • 🟡 Waiting                  │ │
│ │    Consultation | Dr. Sharma | Fever and headache       │ │
│ │                                              [View]     │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📅 VIS-2026-00035 • 28/01/2026 • ✅ Completed           │ │
│ │    Follow Up | Dr. Sharma | Blood pressure check        │ │
│ │                                              [View]     │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📅 VIS-2026-00021 • 15/01/2026 • ✅ Completed           │ │
│ │    Consultation | Dr. Gupta | Chest pain                │ │
│ │                                              [View]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Showing 1-10 of 12                        [< 1 2 >]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- List of all visits for this patient
- Sorted by visit date (most recent first)
- Show visit number, date, status, type, doctor, complaint
- Pagination (10 per page)
- "Create New Visit" button (pre-fills patient)
- Click row → Navigate to visit detail
- Empty state: "No visits yet"

### 4.2 PatientDetail - Create Visit Button

**Add button in header:**
```typescript
// In PatientDetail header extra buttons
<Button 
  type="primary"
  icon={<CalendarOutlined />}
  onClick={() => navigate(`/visits/create?patient=${patient.id}`)}
>
  Create Visit
</Button>
```

### 4.3 PatientList - Quick Visit Action

**Add action column or button:**
```typescript
// In PatientList table actions column
<Tooltip title="Create Visit">
  <Button
    type="text"
    icon={<PlusCircleOutlined />}
    onClick={() => navigate(`/visits/create?patient=${record.id}`)}
  />
</Tooltip>
```

### 4.4 Dashboard - Visit Statistics Widget

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Today's Visit Statistics                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │    15    │  │     3    │  │     5    │  │     2    │   │
│   │  Total   │  │Registered│  │ Waiting  │  │In Progrs │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│   ┌──────────┐  ┌──────────┐                               │
│   │     4    │  │     1    │                               │
│   │Completed │  │Cancelled │                               │
│   └──────────┘  └──────────┘                               │
│                                                             │
│   Average Wait Time: 22 min | Avg Consultation: 18 min     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Card with status breakdown
- Color-coded status counts (click to filter)
- Average wait time
- Average consultation duration
- Refresh button
- Link to queue page

### 4.5 Dashboard - Today's Appointments Widget

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Today's Appointments (15)                    [View All]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ Waiting (5) ─────────────────────────────────────────┐   │
│ │ • Rajesh Kumar     🔴 Urgent    Waiting 25 min        │   │
│ │ • Amit Patel                    Waiting 18 min        │   │
│ │ • Sunita Devi                   Waiting 12 min        │   │
│ │ +2 more...                                            │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ In Progress (2) ─────────────────────────────────────┐   │
│ │ • Priya Sharma     Dr. Sharma   15 min                │   │
│ │ • Mohan Lal        Dr. Gupta    8 min                 │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│                                        [Go to Queue →]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Shows waiting and in-progress visits
- Limited to 5 items each (with "+N more" link)
- Priority indicators
- Wait time / duration display
- Click patient name → Visit detail
- "Go to Queue" button → Queue page
- Auto-refresh every 60 seconds

### 4.6 Sidebar Navigation Update

**Add Visits menu section:**
```typescript
const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    key: 'patients',
    icon: <UserOutlined />,
    label: 'Patients',
    path: '/patients',
  },
  {
    key: 'visits',
    icon: <CalendarOutlined />,
    label: 'Visits',
    children: [
      {
        key: 'visits-queue',
        label: 'Today\'s Queue',
        path: '/visits/queue',
        icon: <UnorderedListOutlined />,
      },
      {
        key: 'visits-all',
        label: 'All Visits',
        path: '/visits',
        icon: <HistoryOutlined />,
      },
      {
        key: 'visits-create',
        label: 'New Visit',
        path: '/visits/create',
        icon: <PlusOutlined />,
      },
    ],
  },
  // ... rest of menu
];
```

### 4.7 Quick Actions Update

**Add to existing Quick Actions on Dashboard:**
```typescript
// In Dashboard QuickActions component
<Button 
  type="primary"
  icon={<PlusOutlined />}
  block
  onClick={() => navigate('/visits/create')}
>
  New Visit
</Button>

<Button 
  icon={<UnorderedListOutlined />}
  block
  onClick={() => navigate('/visits/queue')}
>
  View Queue
</Button>
```

---

## 5. Dashboard Data Hook

**useDashboard.ts:**
```typescript
interface DashboardData {
  patientCount: number;
  todayVisits: {
    total: number;
    byStatus: Record<VisitStatus, number>;
  };
  waitingVisits: Visit[];
  inProgressVisits: Visit[];
  averageWaitTime: number;
  averageConsultation: number;
}

export const useDashboard = () => {
  const patientCount = usePatientCount();
  const todayVisits = useTodayVisits();
  const visitStats = useVisitStats({ 
    date_from: today, 
    date_to: today 
  });

  return {
    patientCount: patientCount.data,
    todayVisits: todayVisits.data,
    stats: visitStats.data,
    isLoading: /* any loading */,
    refetch: /* refetch all */,
  };
};
```

---

## 6. End-to-End Workflow Verification

### Workflow 1: New Patient Visit
1. Login as receptionist
2. Navigate to Patients → New Patient
3. Register patient → Redirects to patient detail
4. Click "Create Visit" → Visit form with patient pre-filled
5. Fill visit details → Submit
6. Visit created → Redirects to visit detail
7. Status shows "Registered"

### Workflow 2: Queue Management
1. Login as nurse/doctor
2. Navigate to Visits → Queue
3. See today's visits by status
4. Click "Move to Waiting" on registered visit
5. Status updates to "Waiting"
6. Click "Start Consultation"
7. Status updates to "In Progress"
8. Click "Complete"
9. Status updates to "Completed"

### Workflow 3: Patient History
1. Navigate to Patients → Search patient
2. Click patient → Patient Detail
3. Click "Visit History" tab
4. See all previous visits
5. Click a visit → Visit detail

### Workflow 4: Dashboard Overview
1. Login → Dashboard
2. See patient count
3. See today's visit statistics
4. See waiting/in-progress visits
5. Click visit → Visit detail
6. Click "Go to Queue" → Queue page

---

## 7. Verification Checklist

- [ ] PatientDetail has Visit History tab
- [ ] Visit history shows patient's visits
- [ ] "Create Visit" button works from patient pages
- [ ] Pre-fills patient in visit form
- [ ] Dashboard shows visit stats widget
- [ ] Dashboard shows today's appointments widget
- [ ] Sidebar has Visits menu with submenus
- [ ] Quick Actions includes visit actions
- [ ] Stats cards are clickable (filter)
- [ ] All navigation links work
- [ ] Auto-refresh works on dashboard widgets
- [ ] End-to-end workflows verified

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Patient visit history load time | < 1 second |
| Dashboard widgets load time | < 2 seconds |
| Visit creation from patient | 3 clicks max |
| Queue status update | < 500ms response |

---

## 9. Role-Based UI

| Element | Admin | Doctor | Nurse | Receptionist |
|---------|-------|--------|-------|--------------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ |
| Visit Stats | ✓ | Own | ✓ | ✓ |
| Create Visit | ✓ | ✗ | ✓ | ✓ |
| Change Status | ✓ | ✓ | ✓ | ✓ |
| Cancel Visit | ✓ | ✗ | ✗ | ✓ |

---

## 10. Notes

- Use React Query's `refetchInterval` for auto-refresh
- Consider lazy loading for dashboard widgets
- Keep dashboard responsive (mobile-friendly cards)
- Patient visit history should be paginated
- Sidebar should indicate current section

---

## 11. Phase 2 Complete Checklist

After completing Phase 2F, verify:

- [ ] Visit model stores all required data
- [ ] Visit number auto-generates correctly
- [ ] All visit CRUD operations work
- [ ] Status transitions validated
- [ ] Visit list with filters works
- [ ] Visit create/edit/detail pages work
- [ ] Queue management functional
- [ ] Patient visit history displays
- [ ] Dashboard integration complete
- [ ] Navigation updated
- [ ] All roles can access appropriate features
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Responsive on all screen sizes

---

*End of Phase 2F*

---

# 🎉 Phase 2 Complete!

**Next:** Proceed to **Phase 3: Clinical Documentation**
- Vitals recording (BP, Heart Rate, Temperature, SpO2, Weight, Height)
- Diagnosis with ICD-10 codes
- Clinical notes and prescriptions
