/**
 * DICOM Types
 * ===========
 * 
 * TypeScript type definitions for DICOM-related operations.
 * 
 * Module: frontend/src/types/dicom.ts
 * Phase: 5B (Upload Frontend)
 */

/**
 * DICOM Tags extracted from file
 */
export interface DicomTags {
  // Patient Information
  PatientID?: string;
  PatientName?: string;
  PatientBirthDate?: string;
  PatientSex?: string;
  
  // Study Information
  StudyInstanceUID?: string;
  StudyID?: string;
  StudyDate?: string;
  StudyTime?: string;
  StudyDescription?: string;
  
  // Series Information
  SeriesInstanceUID?: string;
  Modality?: string;
  
  // Instance Information
  SOPInstanceUID?: string;
  SOPClassUID?: string;
  
  // Order Information
  AccessionNumber?: string;
  ReferringPhysicianName?: string;
  
  // Institution
  InstitutionName?: string;
  
  // Transfer Syntax
  TransferSyntaxUID?: string;
}

/**
 * DICOM File with metadata
 */
export interface DicomFile {
  file: File;
  tags?: DicomTags;
  isValid?: boolean;
  error?: string;
  preview?: string; // Base64 thumbnail
}

/**
 * DICOM Upload Request
 */
export interface DicomUploadRequest {
  patient_id: string;
  order_id?: string;
  tag_modifications?: Record<string, string>;
}

/**
 * DICOM Upload Response
 */
export interface DicomUploadResponse {
  study_instance_uid: string;
  orthanc_study_id: string;
  patient_id: string;
  order_id?: string;
  upload_log_id: string;
  modality?: string;
  study_date?: string;
  number_of_series?: number;
  number_of_instances?: number;
  file_count: number;
  total_size_mb: number;
  upload_date: string;
  status: string;
}

/**
 * Multiple Upload Response
 */
export interface DicomUploadMultipleResponse {
  total_files: number;
  successful: number;
  failed: number;
  studies: string[];
  uploads: DicomUploadResponse[];
  errors?: string[];
}

/**
 * DICOM Study
 */
export interface DicomStudy {
  study_instance_uid: string;
  orthanc_study_id?: string;
  patient_dicom_id?: string;
  patient_name?: string;
  study_date?: string;
  study_time?: string;
  study_description?: string;
  accession_number?: string;
  modality?: string;
  referring_physician?: string;
  number_of_series?: number;
  number_of_instances?: number;
}

/**
 * DICOM Upload Log
 */
export interface DicomUploadLog {
  id: string;
  study_instance_uid: string;
  orthanc_study_id: string;
  patient_id: string;
  order_id?: string;
  uploaded_by: string;
  patient_dicom_id?: string;
  patient_name?: string;
  study_date?: string;
  study_time?: string;
  study_description?: string;
  accession_number?: string;
  modality?: string;
  referring_physician?: string;
  upload_status: 'uploaded' | 'failed' | 'deleted';
  file_count: number;
  total_size_bytes: number;
  upload_date: string;
  number_of_series?: number;
  number_of_instances?: number;
  deleted_date?: string;
  deletion_reason?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Tag Modification Request
 */
export interface DicomTagModifyRequest {
  tags: Record<string, string>;
}

/**
 * Delete Request
 */
export interface DicomDeleteRequest {
  reason: string;
}

/**
 * File Info
 */
export interface DicomFileInfo {
  file_size_bytes: number;
  file_size_mb: number;
  modality?: string;
  study_uid?: string;
  series_uid?: string;
  sop_uid?: string;
  patient_id?: string;
  study_date?: string;
  transfer_syntax?: string;
  sop_class?: string;
  image_dimensions?: string;
}

/**
 * Tags Response
 */
export interface DicomTagsResponse {
  tags: DicomTags;
  file_name?: string;
  file_size_mb?: number;
}

/**
 * Upload Progress
 */
export interface UploadProgress {
  fileName: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  error?: string;
  studyInstanceUid?: string;
}

/**
 * Patient Match Result
 */
export interface PatientMatchResult {
  matchType: 'exact' | 'partial' | 'manual';
  confidence: number;
  matchedBy: string;
}
