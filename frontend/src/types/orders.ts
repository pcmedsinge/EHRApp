/**
 * Orders Types
 * Phase: 4B (Orders Frontend)
 */

// ============================================================================
// ENUMS
// ============================================================================

export type OrderType = 'IMAGING' | 'LAB' | 'PROCEDURE';

export type OrderStatus =
  | 'ordered'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'reported'
  | 'cancelled';

export type OrderPriority = 'routine' | 'urgent' | 'stat';

// ============================================================================
// MAIN ORDER INTERFACE
// ============================================================================

export interface Order {
  id: string;
  order_number: string;
  accession_number: string;
  order_type: OrderType;
  status: OrderStatus;
  priority: OrderPriority;
  patient_id: string;
  visit_id?: string;
  ordered_by: string;
  ordered_date: string;
  
  // Clinical details
  clinical_indication?: string;
  special_instructions?: string;
  notes?: string;
  
  // Type-specific details (stored as JSON in backend)
  order_details?: ImagingOrderDetails | LabOrderDetails | ProcedureOrderDetails;
  
  // Scheduling
  scheduled_date?: string;
  scheduled_location?: string;
  
  // Performing
  performing_user_id?: string;
  performed_date?: string;
  
  // Reporting
  reporting_user_id?: string;
  reported_date?: string;
  report_text?: string;
  findings?: string;
  impression?: string;
  result_status?: string;
  
  // DICOM (for imaging orders - Phase 5)
  study_instance_uid?: string;
  orthanc_study_id?: string;
  study_date?: string;
  study_time?: string;
  modality?: string;
  number_of_series?: number;
  number_of_instances?: number;
  dicom_upload_date?: string;
  external_id?: string;
  
  // Cancellation
  cancelled_date?: string;
  cancellation_reason?: string;
  
  // Relationships (populated from backend)
  patient?: PatientSummary;
  visit?: VisitSummary;
  ordered_by_user?: UserSummary;
  performing_user?: UserSummary;
  reporting_user?: UserSummary;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ORDER DETAILS (Type-specific)
// ============================================================================

export interface ImagingOrderDetails {
  modality_id: string;
  body_part_id?: string;
  laterality?: string;
  contrast?: boolean;
  num_views?: number;
}

export interface LabOrderDetails {
  lab_test_ids: string[];
  specimen_source?: string;
  collection_datetime?: string;
}

export interface ProcedureOrderDetails {
  procedure_type_id: string;
  anesthesia_type?: string;
  consent_obtained?: boolean;
  estimated_duration?: number;
}

// ============================================================================
// CREATE SCHEMAS
// ============================================================================

export interface ImagingOrderCreate {
  patient_id: string;
  visit_id?: string;
  priority: OrderPriority;
  clinical_indication?: string;
  special_instructions?: string;
  modality_id: string;
  body_part_id?: string;
  laterality?: string;
  contrast?: boolean;
  num_views?: number;
  scheduled_date?: string;
  scheduled_location?: string;
}

export interface LabOrderCreate {
  patient_id: string;
  visit_id?: string;
  priority: OrderPriority;
  clinical_indication?: string;
  special_instructions?: string;
  lab_test_ids: string[];
  specimen_source?: string;
  collection_datetime?: string;
  scheduled_date?: string;
  scheduled_location?: string;
}

export interface ProcedureOrderCreate {
  patient_id: string;
  visit_id?: string;
  priority: OrderPriority;
  clinical_indication?: string;
  special_instructions?: string;
  procedure_type_id: string;
  anesthesia_type?: string;
  consent_obtained?: boolean;
  estimated_duration?: number;
  scheduled_date?: string;
  scheduled_location?: string;
}

export type OrderCreate = ImagingOrderCreate | LabOrderCreate | ProcedureOrderCreate;

// ============================================================================
// UPDATE SCHEMAS
// ============================================================================

export interface OrderUpdate {
  priority?: OrderPriority;
  clinical_indication?: string;
  special_instructions?: string;
  notes?: string;
  scheduled_date?: string;
  scheduled_location?: string;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  notes?: string;
}

export interface OrderReportAdd {
  report_text: string;
  findings?: string;
  impression?: string;
  result_status?: string;
}

// ============================================================================
// REFERENCE DATA
// ============================================================================

export interface ImagingModality {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface BodyPart {
  id: string;
  code: string;
  name: string;
  applicable_modalities?: string[];
}

export interface LabTest {
  id: string;
  code: string;
  name: string;
  category?: string;
  specimen_type?: string;
  fasting_required: boolean;
  tat_hours?: number;
  is_active?: boolean;
}

export interface ProcedureType {
  id: string;
  code: string;
  name: string;
  category?: string;
  requires_consent: boolean;
  estimated_duration?: number;
  is_active?: boolean;
}

// ============================================================================
// RELATED ENTITIES (from backend responses)
// ============================================================================

export interface PatientSummary {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
}

export interface VisitSummary {
  id: string;
  visit_number: string;
  visit_type: string;
  status: string;
}

export interface UserSummary {
  id: string;
  username: string;
  full_name: string;
  role: string;
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

export interface OrderFilters {
  order_type?: OrderType;
  status?: OrderStatus;
  patient_id?: string;
  visit_id?: string;
  date_from?: string;
  date_to?: string;
  priority?: OrderPriority;
}
