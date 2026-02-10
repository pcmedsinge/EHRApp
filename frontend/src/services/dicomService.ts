/**
 * DICOM API Service
 * ==================
 * 
 * Service layer for DICOM file operations.
 * Handles upload, tag reading/modification, and study queries.
 * 
 * Module: frontend/src/services/dicomService.ts
 * Phase: 5B (Upload Frontend)
 */

import api from './api';
import type {
  DicomUploadRequest,
  DicomUploadResponse,
  DicomUploadMultipleResponse,
  DicomTagsResponse,
  DicomTagModifyRequest,
  DicomFileInfo,
  DicomStudy,
  DicomUploadLog,
  DicomDeleteRequest,
} from '@/types/dicom';

const BASE_URL = '/dicom';

// ============================================================================
// UPLOAD OPERATIONS
// ============================================================================

/**
 * Upload single DICOM file
 */
export const uploadDicomFile = async (
  file: File,
  patientId: string,
  orderId?: string,
  tagModifications?: Record<string, string>
): Promise<DicomUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('patient_id', patientId);
  
  if (orderId) {
    formData.append('order_id', orderId);
  }
  
  if (tagModifications) {
    formData.append('tag_modifications', JSON.stringify(tagModifications));
  }

  const response = await api.post<DicomUploadResponse>(
    `${BASE_URL}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

/**
 * Upload multiple DICOM files
 */
export const uploadMultipleDicomFiles = async (
  files: File[],
  patientId: string,
  orderId?: string,
  onProgress?: (progress: number) => void
): Promise<DicomUploadMultipleResponse> => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  formData.append('patient_id', patientId);
  
  if (orderId) {
    formData.append('order_id', orderId);
  }

  const response = await api.post<DicomUploadMultipleResponse>(
    `${BASE_URL}/upload-multiple`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    }
  );
  
  return response.data;
};

// ============================================================================
// TAG OPERATIONS
// ============================================================================

/**
 * Read DICOM tags from file without uploading
 */
export const readDicomTags = async (file: File): Promise<DicomTagsResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<DicomTagsResponse>(
    `${BASE_URL}/read-tags`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

/**
 * Modify DICOM tags and get modified file
 */
export const modifyDicomTags = async (
  file: File,
  tags: Record<string, string>
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tags', JSON.stringify(tags));

  const response = await api.post(
    `${BASE_URL}/modify-tags`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    }
  );
  
  return response.data;
};

/**
 * Validate DICOM file
 */
export const validateDicomFile = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<{ isValid: boolean }>(
      `${BASE_URL}/validate`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    return {
      isValid: false,
      error: error.response?.data?.detail || 'Invalid DICOM file',
    };
  }
};

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * List all studies
 */
export const listStudies = async (
  skip: number = 0,
  limit: number = 100
): Promise<DicomStudy[]> => {
  const response = await api.get<DicomStudy[]>(`${BASE_URL}/studies`, {
    params: { skip, limit },
  });
  return response.data;
};

/**
 * Get study by UID
 */
export const getStudy = async (studyUid: string): Promise<DicomStudy> => {
  const response = await api.get<DicomStudy>(`${BASE_URL}/studies/${studyUid}`);
  return response.data;
};

/**
 * Get patient's studies
 */
export const getPatientStudies = async (patientId: string): Promise<DicomStudy[]> => {
  const response = await api.get<DicomStudy[]>(
    `${BASE_URL}/studies/patient/${patientId}`
  );
  return response.data;
};

/**
 * Get order's studies
 */
export const getOrderStudies = async (orderId: string): Promise<DicomStudy[]> => {
  const response = await api.get<DicomStudy[]>(
    `${BASE_URL}/studies/order/${orderId}`
  );
  return response.data;
};

/**
 * Get study by accession number
 */
export const getStudyByAccession = async (
  accessionNumber: string
): Promise<DicomStudy | null> => {
  try {
    const response = await api.get<DicomStudy>(
      `${BASE_URL}/studies/accession/${accessionNumber}`
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

// ============================================================================
// UPLOAD LOG OPERATIONS
// ============================================================================

/**
 * Get upload logs
 */
export const getUploadLogs = async (
  skip: number = 0,
  limit: number = 100
): Promise<DicomUploadLog[]> => {
  const response = await api.get<DicomUploadLog[]>(`${BASE_URL}/upload-logs`, {
    params: { skip, limit },
  });
  return response.data;
};

/**
 * Get patient's upload logs
 */
export const getPatientUploadLogs = async (patientId: string): Promise<DicomUploadLog[]> => {
  const response = await api.get<DicomUploadLog[]>(
    `${BASE_URL}/upload-logs/patient/${patientId}`
  );
  return response.data;
};

/**
 * Get specific upload log
 */
export const getUploadLog = async (logId: string): Promise<DicomUploadLog> => {
  const response = await api.get<DicomUploadLog>(`${BASE_URL}/upload-logs/${logId}`);
  return response.data;
};

// ============================================================================
// MANAGEMENT OPERATIONS
// ============================================================================

/**
 * Delete study
 */
export const deleteStudy = async (
  studyUid: string,
  reason: string
): Promise<void> => {
  await api.delete(`${BASE_URL}/studies/${studyUid}`, {
    data: { reason } as DicomDeleteRequest,
  });
};

/**
 * Get study thumbnail
 */
export const getStudyThumbnail = async (studyUid: string): Promise<Blob> => {
  const response = await api.get(`${BASE_URL}/studies/${studyUid}/thumbnail`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get OHIF viewer URL for study
 */
export const getViewerUrl = async (studyUid: string): Promise<string> => {
  // This will be implemented with Phase 5C
  // For now, construct URL directly
  return `http://localhost:3001/viewer?StudyInstanceUIDs=${studyUid}`;
};

/**
 * Get OHIF viewer URL for order
 */
export const getViewerUrlForOrder = async (orderId: string): Promise<string> => {
  // This will be implemented with Phase 5C
  const studies = await getOrderStudies(orderId);
  if (studies.length > 0) {
    const studyUids = studies.map(s => s.study_instance_uid).join(',');
    return `http://localhost:3001/viewer?StudyInstanceUIDs=${studyUids}`;
  }
  throw new Error('No studies found for order');
};

/**
 * Health check
 */
export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get<{ status: string }>(`${BASE_URL}/health`);
  return response.data;
};

// ============================================================================
// VIEWER INTEGRATION (Phase 5C)
// ============================================================================

/**
 * Get OHIF viewer URL for a study
 */
export const getViewerUrlByStudyUid = async (studyUid: string): Promise<string> => {
  const response = await api.get<{ url: string }>(`${BASE_URL}/viewer/url/${studyUid}`);
  return response.data.url;
};

/**
 * Get OHIF viewer URL for an order
 */
export const getViewerUrlByOrderId = async (orderId: string): Promise<string> => {
  const response = await api.get<{ url: string }>(`${BASE_URL}/viewer/url/order/${orderId}`);
  return response.data.url;
};

/**
 * Get OHIF viewer URL for all patient studies
 */
export const getViewerUrlByPatientId = async (patientId: string): Promise<string> => {
  const response = await api.get<{ url: string }>(`${BASE_URL}/viewer/url/patient/${patientId}`);
  return response.data.url;
};

/**
 * Get OHIF viewer URL for comparing multiple studies
 */
export const getComparisonViewerUrl = async (studyUids: string[]): Promise<string> => {
  const uidsParam = studyUids.join(',');
  const response = await api.get<{ url: string }>(`${BASE_URL}/viewer/compare`, {
    params: { study_uids: uidsParam },
  });
  return response.data.url;
};

/**
 * Get viewer configuration
 */
export const getViewerConfig = async (): Promise<{
  viewer_url: string;
  orthanc_url: string;
  dicomweb_url: string;
  max_studies_comparison: number;
}> => {
  const response = await api.get(`${BASE_URL}/viewer/config`);
  return response.data;
};

// Export all functions as default service object
const dicomService = {
  uploadDicomFile,
  uploadMultipleDicomFiles,
  readDicomTags,
  modifyDicomTags,
  validateDicomFile,
  listStudies,
  getStudy,
  getPatientStudies,
  getOrderStudies,
  getStudyByAccession,
  getUploadLogs,
  getPatientUploadLogs,
  getUploadLog,
  deleteStudy,
  getStudyThumbnail,
  getViewerUrl,
  getViewerUrlForOrder,
  healthCheck,
  // Phase 5C: Viewer Integration
  getViewerUrlByStudyUid,
  getViewerUrlByOrderId,
  getViewerUrlByPatientId,
  getComparisonViewerUrl,
  getViewerConfig,
};

export default dicomService;
