/**
 * DICOM React Query Hooks
 * ========================
 * 
 * React Query hooks for DICOM operations.
 * Handles caching, mutations, and optimistic updates.
 * 
 * Module: frontend/src/hooks/useDicom.ts
 * Phase: 5B (Upload Frontend)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import dicomService from '@/services/dicomService';
import type {
  DicomUploadResponse,
  DicomUploadMultipleResponse,
  DicomStudy,
  DicomUploadLog,
} from '@/types/dicom';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const dicomKeys = {
  all: ['dicom'] as const,
  
  // Studies
  studies: () => [...dicomKeys.all, 'studies'] as const,
  studiesList: (skip?: number, limit?: number) => [...dicomKeys.studies(), { skip, limit }] as const,
  study: (studyUid: string) => [...dicomKeys.studies(), studyUid] as const,
  patientStudies: (patientId: string) => [...dicomKeys.studies(), 'patient', patientId] as const,
  orderStudies: (orderId: string) => [...dicomKeys.studies(), 'order', orderId] as const,
  accessionStudy: (accessionNumber: string) => [...dicomKeys.studies(), 'accession', accessionNumber] as const,
  
  // Upload logs
  uploadLogs: () => [...dicomKeys.all, 'upload-logs'] as const,
  uploadLogsList: (skip?: number, limit?: number) => [...dicomKeys.uploadLogs(), { skip, limit }] as const,
  uploadLog: (logId: string) => [...dicomKeys.uploadLogs(), logId] as const,
  patientUploadLogs: (patientId: string) => [...dicomKeys.uploadLogs(), 'patient', patientId] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Get all studies
 */
export const useStudies = (skip: number = 0, limit: number = 100) => {
  return useQuery({
    queryKey: dicomKeys.studiesList(skip, limit),
    queryFn: () => dicomService.listStudies(skip, limit),
  });
};

/**
 * Get single study
 */
export const useStudy = (studyUid: string) => {
  return useQuery({
    queryKey: dicomKeys.study(studyUid),
    queryFn: () => dicomService.getStudy(studyUid),
    enabled: !!studyUid,
  });
};

/**
 * Get patient's studies
 */
export const usePatientStudies = (patientId: string) => {
  return useQuery({
    queryKey: dicomKeys.patientStudies(patientId),
    queryFn: () => dicomService.getPatientStudies(patientId),
    enabled: !!patientId,
  });
};

/**
 * Get order's studies
 */
export const useOrderStudies = (orderId: string) => {
  return useQuery({
    queryKey: dicomKeys.orderStudies(orderId),
    queryFn: () => dicomService.getOrderStudies(orderId),
    enabled: !!orderId,
  });
};

/**
 * Get upload logs
 */
export const useUploadLogs = (skip: number = 0, limit: number = 100) => {
  return useQuery({
    queryKey: dicomKeys.uploadLogsList(skip, limit),
    queryFn: () => dicomService.getUploadLogs(skip, limit),
  });
};

/**
 * Get patient's upload logs
 */
export const usePatientUploadLogs = (patientId: string) => {
  return useQuery({
    queryKey: dicomKeys.patientUploadLogs(patientId),
    queryFn: () => dicomService.getPatientUploadLogs(patientId),
    enabled: !!patientId,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Upload single DICOM file
 */
export const useUploadDicom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      patientId,
      orderId,
      tagModifications,
    }: {
      file: File;
      patientId: string;
      orderId?: string;
      tagModifications?: Record<string, string>;
    }) => dicomService.uploadDicomFile(file, patientId, orderId, tagModifications),
    
    onSuccess: async (data: DicomUploadResponse) => {
      message.success(`DICOM file uploaded successfully`);
      
      // Refetch relevant queries
      await Promise.all([
        queryClient.refetchQueries({ queryKey: dicomKeys.studies() }),
        queryClient.refetchQueries({ queryKey: dicomKeys.uploadLogs() }),
        
        // Refetch patient-specific data if available
        ...(data.patient_id ? [
          queryClient.refetchQueries({ queryKey: dicomKeys.patientStudies(data.patient_id) }),
          queryClient.refetchQueries({ queryKey: dicomKeys.patientUploadLogs(data.patient_id) }),
        ] : []),
        
        // Refetch order-specific data if available
        ...(data.order_id ? [
          queryClient.refetchQueries({ queryKey: dicomKeys.orderStudies(data.order_id) }),
          // Also refetch order details to update DICOM fields
          queryClient.refetchQueries({ queryKey: ['orders', 'detail', data.order_id] }),
        ] : []),
      ]);
    },
    
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to upload DICOM file';
      message.error(errorMessage);
    },
  });
};

/**
 * Upload multiple DICOM files
 */
export const useUploadMultipleDicom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      files,
      patientId,
      orderId,
      onProgress,
    }: {
      files: File[];
      patientId: string;
      orderId?: string;
      onProgress?: (progress: number) => void;
    }) => dicomService.uploadMultipleDicomFiles(files, patientId, orderId, onProgress),
    
    onSuccess: async (data: DicomUploadMultipleResponse) => {
      if (data.successful > 0) {
        message.success(`${data.successful} of ${data.total_files} files uploaded successfully`);
      }
      
      if (data.failed > 0) {
        message.warning(`${data.failed} files failed to upload`);
      }
      
      // Refetch all DICOM-related queries
      await Promise.all([
        queryClient.refetchQueries({ queryKey: dicomKeys.studies() }),
        queryClient.refetchQueries({ queryKey: dicomKeys.uploadLogs() }),
      ]);
      
      // Refetch order data if order ID is in any upload
      if (data.uploads.length > 0) {
        const uniquePatientIds = [...new Set(data.uploads.map(u => u.patient_id))];
        const uniqueOrderIds = [...new Set(data.uploads.map(u => u.order_id).filter(Boolean))];
        
        await Promise.all([
          ...uniquePatientIds.map(patientId =>
            Promise.all([
              queryClient.refetchQueries({ queryKey: dicomKeys.patientStudies(patientId) }),
              queryClient.refetchQueries({ queryKey: dicomKeys.patientUploadLogs(patientId) }),
            ])
          ),
          ...uniqueOrderIds.map(orderId =>
            Promise.all([
              queryClient.refetchQueries({ queryKey: dicomKeys.orderStudies(orderId!) }),
              queryClient.refetchQueries({ queryKey: ['orders', 'detail', orderId] }),
            ])
          ),
        ]);
      }
    },
    
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to upload DICOM files';
      message.error(errorMessage);
    },
  });
};

/**
 * Delete study
 */
export const useDeleteStudy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studyUid, reason }: { studyUid: string; reason: string }) =>
      dicomService.deleteStudy(studyUid, reason),
    
    onSuccess: async () => {
      message.success('Study deleted successfully');
      
      // Refetch all studies and upload logs
      await Promise.all([
        queryClient.refetchQueries({ queryKey: dicomKeys.studies() }),
        queryClient.refetchQueries({ queryKey: dicomKeys.uploadLogs() }),
      ]);
    },
    
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to delete study';
      message.error(errorMessage);
    },
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Read DICOM tags without uploading
 * (Not cached since it's a one-time operation)
 */
export const useReadDicomTags = () => {
  return useMutation({
    mutationFn: (file: File) => dicomService.readDicomTags(file),
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to read DICOM tags';
      message.error(errorMessage);
    },
  });
};

/**
 * Validate DICOM file
 * (Not cached since it's a one-time operation)
 */
export const useValidateDicom = () => {
  return useMutation({
    mutationFn: (file: File) => dicomService.validateDicomFile(file),
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to validate DICOM file';
      message.error(errorMessage);
    },
  });
};

/**
 * Modify DICOM tags
 * (Not cached since it's a one-time operation)
 */
export const useModifyDicomTags = () => {
  return useMutation({
    mutationFn: ({ file, tags }: { file: File; tags: Record<string, string> }) =>
      dicomService.modifyDicomTags(file, tags),
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to modify DICOM tags';
      message.error(errorMessage);
    },
  });
};
