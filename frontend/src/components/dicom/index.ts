/**
 * DICOM Components Index
 * ======================
 * 
 * Central export for all DICOM-related components.
 * 
 * Module: frontend/src/components/dicom/index.ts
 * Phase: 5B (Upload Frontend) + 5C (Viewer Integration)
 */

// Phase 5B: Upload Components
export { default as DicomUploadModal } from './DicomUploadModal';
export { default as FileDropzone } from './FileDropzone';
export { default as DicomTagsPreview } from './DicomTagsPreview';
export { default as PatientMatcher } from './PatientMatcher';
export { default as UploadProgress } from './UploadProgress';

// Phase 5C: Viewer Components
export { default as DicomViewer } from './DicomViewer';
export { default as DicomViewerModal } from './DicomViewerModal';
