# Phase 2C: Visit UI - Service & Hooks

**Sub-Phase:** 2C  
**Estimated Time:** 2-3 hours  
**Prerequisites:** Phase 2B Complete (Visit API working)  
**Status:** ✅ Complete (January 31, 2026)

---

## 1. Objective

Set up the frontend foundation for Visit management including TypeScript types, API service, React Query hooks, and utility functions.

---

## 2. Deliverables

- [ ] Visit TypeScript types and interfaces
- [ ] Visit constants (statuses, types, priorities)
- [ ] Visit API service (visitService.ts)
- [ ] Visit React Query hooks (useVisits.ts)
- [ ] Visit status utilities (color mapping, icons, labels)
- [ ] Export updates in index files

---

## 3. Files to Create/Modify

```
frontend/src/
├── types/
│   └── index.ts                  # Add Visit types
├── config/
│   └── constants.ts              # Add visit constants
├── services/
│   ├── index.ts                  # Export visitService
│   └── visitService.ts           # NEW: Visit API calls
├── hooks/
│   ├── index.ts                  # Export visit hooks
│   └── useVisits.ts              # NEW: React Query hooks
└── utils/
    └── visitUtils.ts             # NEW: Visit utilities
```

---

## 4. TypeScript Types

### 4.1 Enums/Types

```typescript
// Visit Status
export type VisitStatus = 
  | 'registered' 
  | 'waiting' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

// Visit Type
export type VisitType = 
  | 'consultation' 
  | 'follow_up' 
  | 'emergency' 
  | 'procedure';

// Priority
export type VisitPriority = 
  | 'normal' 
  | 'urgent' 
  | 'emergency';
```

### 4.2 Visit Interface

```typescript
export interface Visit {
  id: string;
  visit_number: string;
  patient_id: string;
  assigned_doctor_id?: string;
  visit_date: string;
  visit_type: VisitType;
  status: VisitStatus;
  priority: VisitPriority;
  department?: string;
  chief_complaint?: string;
  check_in_time: string;
  consultation_start_time?: string;
  consultation_end_time?: string;
  cancellation_reason?: string;
  notes?: string;
  
  // Computed/joined
  patient?: Patient;          // From relationship
  patient_name?: string;
  patient_mrn?: string;
  assigned_doctor?: User;     // From relationship
  doctor_name?: string;
  wait_time_minutes?: number;
  consultation_duration_minutes?: number;
  
  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}
```

### 4.3 Request/Response Types

```typescript
export interface VisitCreateData {
  patient_id: string;
  assigned_doctor_id?: string;
  visit_date?: string;        // Defaults to today
  visit_type: VisitType;
  priority?: VisitPriority;   // Defaults to 'normal'
  department?: string;
  chief_complaint?: string;
  notes?: string;
}

export interface VisitUpdateData {
  assigned_doctor_id?: string;
  visit_type?: VisitType;
  priority?: VisitPriority;
  department?: string;
  chief_complaint?: string;
  notes?: string;
}

export interface VisitStatusUpdate {
  status: VisitStatus;
  cancellation_reason?: string;  // Required for 'cancelled'
}

export interface VisitListParams {
  page?: number;
  size?: number;
  status?: VisitStatus;
  visit_type?: VisitType;
  priority?: VisitPriority;
  patient_id?: string;
  doctor_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface VisitStats {
  total_visits: number;
  by_status: Record<VisitStatus, number>;
  by_type: Record<VisitType, number>;
  by_priority: Record<VisitPriority, number>;
  by_department: Record<string, number>;
  average_wait_time_minutes: number;
  average_consultation_minutes: number;
}
```

---

## 5. Constants

Add to `config/constants.ts`:

```typescript
// Visit Status Options
export const VISIT_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

// Visit Type Options
export const VISIT_TYPE_OPTIONS = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'procedure', label: 'Procedure' },
] as const;

// Priority Options
export const VISIT_PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'emergency', label: 'Emergency' },
] as const;

// Department Options (Indian hospital context)
export const DEPARTMENT_OPTIONS = [
  { value: 'general', label: 'General Medicine' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'gynecology', label: 'Gynecology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'ent', label: 'ENT' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'psychiatry', label: 'Psychiatry' },
] as const;
```

---

## 6. Visit Service Methods

### visitService.ts

| Method | HTTP | Endpoint | Description |
|--------|------|----------|-------------|
| getVisits | GET | /visits | List visits with filters |
| getVisit | GET | /visits/{id} | Get single visit |
| getVisitByNumber | GET | /visits/number/{number} | Get by visit number |
| createVisit | POST | /visits | Create new visit |
| updateVisit | PUT | /visits/{id} | Update visit |
| updateStatus | PATCH | /visits/{id}/status | Update status |
| cancelVisit | DELETE | /visits/{id} | Cancel visit |
| getPatientVisits | GET | /visits/patient/{id} | Patient history |
| getDoctorVisits | GET | /visits/doctor/{id} | Doctor's visits |
| getTodayVisits | GET | /visits/today | Today's visits |
| getQueue | GET | /visits/queue | Current queue |
| getVisitStats | GET | /visits/stats | Statistics |
| startConsultation | POST | /visits/{id}/start | Start consultation |
| completeVisit | POST | /visits/{id}/complete | Complete visit |

---

## 7. React Query Hooks

### useVisits.ts

| Hook | Type | Description |
|------|------|-------------|
| useVisits | Query | Paginated visit list with filters |
| useVisit | Query | Single visit by ID |
| usePatientVisits | Query | Patient's visit history |
| useDoctorVisits | Query | Doctor's assigned visits |
| useTodayVisits | Query | Today's visits |
| useVisitQueue | Query | Current waiting queue |
| useVisitStats | Query | Visit statistics |
| useCreateVisit | Mutation | Create new visit |
| useUpdateVisit | Mutation | Update visit details |
| useUpdateVisitStatus | Mutation | Update status only |
| useCancelVisit | Mutation | Cancel visit |
| useStartConsultation | Mutation | Start consultation |
| useCompleteVisit | Mutation | Complete visit |

### Query Keys

```typescript
export const visitKeys = {
  all: ['visits'] as const,
  lists: () => [...visitKeys.all, 'list'] as const,
  list: (params: VisitListParams) => [...visitKeys.lists(), params] as const,
  details: () => [...visitKeys.all, 'detail'] as const,
  detail: (id: string) => [...visitKeys.details(), id] as const,
  patient: (patientId: string) => [...visitKeys.all, 'patient', patientId] as const,
  doctor: (doctorId: string) => [...visitKeys.all, 'doctor', doctorId] as const,
  today: () => [...visitKeys.all, 'today'] as const,
  queue: () => [...visitKeys.all, 'queue'] as const,
  stats: (params?: StatsParams) => [...visitKeys.all, 'stats', params] as const,
};
```

---

## 8. Visit Utilities

### visitUtils.ts

```typescript
// Status color mapping (for Ant Design Tags)
export const getStatusColor = (status: VisitStatus): string => {
  const colors: Record<VisitStatus, string> = {
    registered: 'blue',
    waiting: 'orange',
    in_progress: 'processing',
    completed: 'success',
    cancelled: 'default',
  };
  return colors[status];
};

// Priority color mapping
export const getPriorityColor = (priority: VisitPriority): string => {
  const colors: Record<VisitPriority, string> = {
    normal: 'default',
    urgent: 'warning',
    emergency: 'error',
  };
  return colors[priority];
};

// Visit type icons (Ant Design icon names)
export const getVisitTypeIcon = (type: VisitType): string => {
  const icons: Record<VisitType, string> = {
    consultation: 'MessageOutlined',
    follow_up: 'ReloadOutlined',
    emergency: 'AlertOutlined',
    procedure: 'MedicineBoxOutlined',
  };
  return icons[type];
};

// Format wait time
export const formatWaitTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Check if status transition is valid
export const isValidTransition = (
  current: VisitStatus, 
  next: VisitStatus
): boolean => {
  const validTransitions: Record<VisitStatus, VisitStatus[]> = {
    registered: ['waiting', 'cancelled'],
    waiting: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  return validTransitions[current]?.includes(next) ?? false;
};

// Get next valid statuses
export const getNextStatuses = (current: VisitStatus): VisitStatus[] => {
  const validTransitions: Record<VisitStatus, VisitStatus[]> = {
    registered: ['waiting', 'cancelled'],
    waiting: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  return validTransitions[current] ?? [];
};
```

---

## 9. Verification Checklist

- [ ] Visit types added to types/index.ts
- [ ] Visit constants added to constants.ts
- [ ] visitService.ts created with all methods
- [ ] All service methods handle errors properly
- [ ] useVisits.ts hooks created
- [ ] Query invalidation configured correctly
- [ ] Mutations show success/error toasts
- [ ] visitUtils.ts utility functions work
- [ ] All exports updated in index files
- [ ] TypeScript has no errors

---

## 10. Testing

```typescript
// Test hooks in a component or test file

// Test visit list
const { data: visits } = useVisits({ status: 'waiting' });

// Test create visit
const createVisit = useCreateVisit();
await createVisit.mutateAsync({
  patient_id: 'patient-uuid',
  visit_type: 'consultation',
});

// Test status update
const updateStatus = useUpdateVisitStatus();
await updateStatus.mutateAsync({
  id: 'visit-uuid',
  status: 'waiting',
});

// Test utilities
console.log(getStatusColor('waiting')); // 'orange'
console.log(isValidTransition('registered', 'waiting')); // true
console.log(isValidTransition('completed', 'waiting')); // false
```

---

## 11. Notes

- All hooks use React Query for caching and refetching
- Mutations invalidate relevant queries on success
- Error handling shows toast messages via Ant Design message
- Status utilities help maintain consistent UI colors/icons
- Query stale time configured for real-time feel (short)

---

*End of Phase 2C*
