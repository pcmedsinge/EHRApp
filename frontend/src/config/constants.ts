/**
 * Application Constants
 * 
 * Centralized configuration values used throughout the application.
 */

// =============================================================================
// API CONFIGURATION
// =============================================================================

/** Base URL for API requests */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/** Application name */
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'EHR System';

/** Application version */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// =============================================================================
// STORAGE KEYS
// =============================================================================

/** LocalStorage key for JWT token */
export const TOKEN_KEY = 'ehr_token';

/** LocalStorage key for refresh token (future use) */
export const REFRESH_TOKEN_KEY = 'ehr_refresh_token';

/** LocalStorage key for user data */
export const USER_KEY = 'ehr_user';

/** LocalStorage key for theme preference */
export const THEME_KEY = 'ehr_theme';

// =============================================================================
// DATE FORMATS
// =============================================================================

/** Display format for dates */
export const DATE_FORMAT = 'DD/MM/YYYY';

/** Display format for dates with time */
export const DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm';

/** Full display format with seconds */
export const DATE_TIME_FULL_FORMAT = 'DD/MM/YYYY HH:mm:ss';

/** ISO format for API requests */
export const DATE_API_FORMAT = 'YYYY-MM-DD';

/** Time format */
export const TIME_FORMAT = 'HH:mm';

// =============================================================================
// PAGINATION
// =============================================================================

export const PAGINATION = {
  /** Default number of items per page */
  defaultPageSize: 20,
  
  /** Available page size options */
  pageSizeOptions: ['10', '20', '50', '100'],
  
  /** Show size changer in pagination */
  showSizeChanger: true,
  
  /** Show quick jumper in pagination */
  showQuickJumper: true,
} as const;

// =============================================================================
// VALIDATION
// =============================================================================

export const VALIDATION = {
  /** Minimum password length */
  passwordMinLength: 8,
  
  /** Maximum password length */
  passwordMaxLength: 128,
  
  /** Phone number pattern (10-15 digits) */
  phonePattern: /^[0-9]{10,15}$/,
  
  /** Aadhaar number pattern (12 digits) */
  aadhaarPattern: /^[0-9]{12}$/,
  
  /** Pincode pattern (6 digits) */
  pincodePattern: /^[0-9]{6}$/,
  
  /** Email pattern */
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// =============================================================================
// USER ROLES
// =============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// =============================================================================
// PATIENT
// =============================================================================

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

export const BLOOD_GROUP_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

// =============================================================================
// API TIMEOUTS
// =============================================================================

export const API_TIMEOUT = {
  /** Default timeout in milliseconds */
  default: 30000,
  
  /** Long operation timeout (file uploads, etc.) */
  long: 60000,
  
  /** Short operation timeout (simple fetches) */
  short: 10000,
} as const;

// =============================================================================
// MESSAGES
// =============================================================================

export const MESSAGES = {
  error: {
    generic: 'Something went wrong. Please try again.',
    network: 'Network error. Please check your connection.',
    unauthorized: 'Session expired. Please login again.',
    forbidden: 'You do not have permission to perform this action.',
    notFound: 'The requested resource was not found.',
    validation: 'Please check the form for errors.',
  },
  success: {
    saved: 'Changes saved successfully.',
    deleted: 'Deleted successfully.',
    created: 'Created successfully.',
    updated: 'Updated successfully.',
  },
} as const;

// =============================================================================
// VISIT (Phase 2C)
// =============================================================================

/** Visit status options */
export const VISIT_STATUS_OPTIONS = [
  { value: 'registered', label: 'Registered' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

/** Visit type options */
export const VISIT_TYPE_OPTIONS = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'procedure', label: 'Procedure' },
] as const;

/** Visit priority options */
export const VISIT_PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'emergency', label: 'Emergency' },
] as const;

/** Department options (Indian hospital context) */
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
