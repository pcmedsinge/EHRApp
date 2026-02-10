/**
 * Type Definitions
 * 
 * Central location for all TypeScript interfaces and types.
 * Import from '@/types' for type definitions.
 */

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}

/** Paginated API response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/** API error response */
export interface ApiError {
  detail: string | { msg: string; type: string }[];
  status_code?: number;
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

/** Login request payload */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Login response payload */
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

/** Register request payload */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
}

// =============================================================================
// USER TYPES
// =============================================================================

/** User roles */
export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist';

/** User entity */
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** User form data for creation/update */
export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  is_active?: boolean;
}

// =============================================================================
// PATIENT TYPES
// =============================================================================

/** Gender options */
export type Gender = 'male' | 'female' | 'other';

/** Blood group options */
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

/** Patient entity */
export interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  email?: string;
  
  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  
  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Medical
  blood_group?: BloodGroup;
  allergies?: string;
  medical_notes?: string;
  
  // India-specific
  aadhaar_number?: string;
  abha_id?: string;
  
  // Computed properties
  age: number;
  full_name: string;
  
  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

/** Patient form data for creation */
export interface PatientCreateData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  blood_group?: BloodGroup;
  allergies?: string;
  medical_notes?: string;
  aadhaar_number?: string;
  abha_id?: string;
}

/** Patient form data for update */
export interface PatientUpdateData extends Partial<PatientCreateData> {}

/** Patient search/list parameters */
export interface PatientListParams {
  page?: number;
  size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// =============================================================================
// VISIT TYPES (Phase 2C)
// =============================================================================

/** Visit status */
export type VisitStatus = 
  | 'registered' 
  | 'waiting' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

/** Visit type */
export type VisitType = 
  | 'consultation' 
  | 'follow_up' 
  | 'emergency' 
  | 'procedure';

/** Visit priority */
export type VisitPriority = 
  | 'normal' 
  | 'urgent' 
  | 'emergency';

/** Patient summary (for visit response) */
export interface PatientSummary {
  id: string;
  mrn: string;
  full_name: string;
  phone: string;
  gender: string;
  date_of_birth?: string;
  blood_group?: string;
  email?: string;
}

/** Doctor summary (for visit response) */
export interface DoctorSummary {
  id: string;
  full_name: string;
  role: string;
}

/** Visit entity */
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
  check_in_time?: string;
  consultation_start_time?: string;
  consultation_end_time?: string;
  cancellation_reason?: string;
  notes?: string;
  
  // Relationships
  patient?: PatientSummary;
  assigned_doctor?: DoctorSummary;
  
  // Computed properties
  patient_name?: string;
  doctor_name?: string;
  wait_time_minutes?: number;
  consultation_duration_minutes?: number;
  
  // Metadata
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/** Visit form data for creation */
export interface VisitCreateData {
  patient_id: string;
  assigned_doctor_id?: string;
  visit_date?: string;
  visit_type?: VisitType;
  priority?: VisitPriority;
  department?: string;
  chief_complaint?: string;
  notes?: string;
}

/** Visit form data for update */
export interface VisitUpdateData {
  assigned_doctor_id?: string;
  visit_date?: string;
  visit_type?: VisitType;
  priority?: VisitPriority;
  department?: string;
  chief_complaint?: string;
  notes?: string;
}

/** Visit status update data */
export interface VisitStatusUpdate {
  status: VisitStatus;
  cancellation_reason?: string;
}

/** Visit list/search parameters */
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
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/** Visit statistics response */
export interface VisitStats {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  average_wait_time_minutes: number;
  average_consultation_minutes: number;
}

// =============================================================================
// FEATURE FLAGS (Phase 2C)
// =============================================================================

/** Feature flags from backend */
export interface FeatureFlags {
  VISIT_QUEUE_ENABLED: boolean;
  VISIT_SCHEDULING_ENABLED: boolean;
}

// =============================================================================
// UI TYPES
// =============================================================================

/** Menu item for navigation */
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  disabled?: boolean;
}

/** Breadcrumb item */
export interface BreadcrumbItem {
  title: string;
  path?: string;
}

/** Table column sort order */
export type SortOrder = 'ascend' | 'descend' | null;

/** Select option */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

// =============================================================================
// FORM TYPES
// =============================================================================

/** Form field status */
export type FieldStatus = 'success' | 'warning' | 'error' | 'validating' | '';

/** Form submission result */
export interface FormResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Make specific properties optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific properties required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Async function type */
export type AsyncFunction<T = void> = () => Promise<T>;

/** Nullable type */
export type Nullable<T> = T | null;

// =============================================================================
// VITALS TYPES
// =============================================================================

/** Vital signs record */
export interface Vital {
  id: string;
  visit_id: string;
  patient_id: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse?: number;
  temperature?: number;
  respiratory_rate?: number;
  spo2?: number;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  blood_sugar?: number;
  blood_sugar_type?: 'fasting' | 'random' | 'pp';
  notes?: string;
  recorded_by?: string;
  recorded_at?: string;
  created_at: string;
  updated_at: string;
}

/** Data needed to create vitals */
export interface VitalCreateData {
  visit_id: string;
  patient_id: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse?: number;
  temperature?: number;
  respiratory_rate?: number;
  spo2?: number;
  height_cm?: number;
  weight_kg?: number;
  blood_sugar?: number;
  blood_sugar_type?: 'fasting' | 'random' | 'pp';
  notes?: string;
}

/** Data needed to update vitals */
export interface VitalUpdateData extends Partial<Omit<VitalCreateData, 'visit_id' | 'patient_id'>> {}

// =============================================================================
// DIAGNOSIS TYPES (Phase 3C/3D)
// =============================================================================

/** Diagnosis type */
export type DiagnosisType = 'primary' | 'secondary';

/** Diagnosis status */
export type DiagnosisStatus = 'provisional' | 'confirmed';

/** Diagnosis severity */
export type DiagnosisSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

/** ICD-10 code search result */
export interface ICD10SearchResult {
  code: string;
  description: string;
  category?: string;
  subcategory?: string;
  usage_count: number;
  common_in_india: boolean;
}

/** ICD-10 code details */
export interface ICD10CodeDetail extends ICD10SearchResult {
  search_text?: string;
  created_at: string;
  updated_at: string;
}

/** Diagnosis entity */
export interface Diagnosis {
  id: string;
  visit_id: string;
  patient_id: string;
  diagnosed_by: string;
  icd10_code?: string;
  diagnosis_description: string;
  diagnosis_type: DiagnosisType;
  status: DiagnosisStatus;
  severity?: DiagnosisSeverity;
  onset_date?: string;
  diagnosed_date: string;
  notes?: string;
  
  // Relationships
  icd10?: ICD10SearchResult;
  diagnosed_by_user?: {
    id: string;
    full_name: string;
    role: string;
  };
  
  // Metadata
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

/** Data needed to create diagnosis */
export interface DiagnosisCreateData {
  visit_id: string;
  patient_id: string;
  icd10_code?: string;
  diagnosis_description: string;
  diagnosis_type: DiagnosisType;
  status: DiagnosisStatus;
  severity?: DiagnosisSeverity;
  onset_date?: string;
  diagnosed_date?: string;
  notes?: string;
}

/** Data needed to update diagnosis */
export interface DiagnosisUpdateData extends Partial<Omit<DiagnosisCreateData, 'visit_id' | 'patient_id'>> {}
