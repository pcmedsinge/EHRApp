/**
 * Diagnosis API Service
 * 
 * API calls for diagnosis and ICD-10 code management
 * Phase: 3D (Diagnosis Frontend)
 */

import api from './api';
import type {
  Diagnosis,
  DiagnosisCreateData,
  DiagnosisUpdateData,
  ICD10SearchResult,
  ICD10CodeDetail,
} from '@/types';

// =============================================================================
// ICD-10 ENDPOINTS
// =============================================================================

/**
 * Search ICD-10 codes
 */
export const searchICD10Codes = async (
  query: string,
  limit: number = 20,
  commonOnly: boolean = false
): Promise<ICD10SearchResult[]> => {
  const response = await api.get('/icd10/search', {
    params: { query, limit, common_only: commonOnly },
  });
  return response.data;
};

/**
 * Get popular ICD-10 codes
 */
export const getPopularICD10Codes = async (limit: number = 10): Promise<ICD10SearchResult[]> => {
  const response = await api.get('/icd10/popular', {
    params: { limit },
  });
  return response.data;
};

/**
 * Get common Indian ICD-10 codes
 */
export const getCommonIndianCodes = async (limit: number = 20): Promise<ICD10SearchResult[]> => {
  const response = await api.get('/icd10/common-indian', {
    params: { limit },
  });
  return response.data;
};

/**
 * Get ICD-10 code details
 */
export const getICD10CodeDetails = async (code: string): Promise<ICD10CodeDetail> => {
  const response = await api.get(`/icd10/${code}`);
  return response.data;
};

/**
 * Search ICD-10 codes by category
 */
export const searchICD10ByCategory = async (
  category: string,
  limit: number = 20
): Promise<ICD10SearchResult[]> => {
  const response = await api.get(`/icd10/category/${category}`, {
    params: { limit },
  });
  return response.data;
};

// =============================================================================
// DIAGNOSIS ENDPOINTS
// =============================================================================

/**
 * Create new diagnosis
 */
export const createDiagnosis = async (data: DiagnosisCreateData): Promise<Diagnosis> => {
  const response = await api.post('/diagnoses/', data);
  return response.data;
};

/**
 * Get diagnoses for a visit
 */
export const getVisitDiagnoses = async (visitId: string): Promise<Diagnosis[]> => {
  const response = await api.get(`/diagnoses/visit/${visitId}`);
  return response.data;
};

/**
 * Get diagnosis history for a patient
 */
export const getPatientDiagnosisHistory = async (patientId: string): Promise<Diagnosis[]> => {
  const response = await api.get(`/diagnoses/patient/${patientId}`);
  return response.data;
};

/**
 * Get single diagnosis by ID
 */
export const getDiagnosisById = async (diagnosisId: string): Promise<Diagnosis> => {
  const response = await api.get(`/diagnoses/${diagnosisId}`);
  return response.data;
};

/**
 * Update diagnosis
 */
export const updateDiagnosis = async (
  diagnosisId: string,
  data: DiagnosisUpdateData
): Promise<Diagnosis> => {
  const response = await api.put(`/diagnoses/${diagnosisId}`, data);
  return response.data;
};

/**
 * Delete diagnosis
 */
export const deleteDiagnosis = async (diagnosisId: string): Promise<void> => {
  await api.delete(`/diagnoses/${diagnosisId}`);
};
