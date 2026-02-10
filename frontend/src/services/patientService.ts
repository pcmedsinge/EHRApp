/**
 * Patient Service
 * ===============
 * 
 * Purpose:
 *   API client for patient CRUD operations.
 *   Handles all patient-related HTTP requests.
 * 
 * Module: src/services/patientService.ts
 * Phase: 1G (Patient UI)
 * 
 * References:
 *   - Patient Module: docs/phases/phase1/diagrams/patient-module.md
 *   - API Overview: docs/diagrams/api-overview.md
 *   - Phase 1G Spec: docs/phases/phase1/Phase1G_PatientUI.md
 * 
 * Used By:
 *   - src/hooks/usePatients.ts (React Query hooks)
 *   - src/pages/patients/*.tsx (Patient pages)
 * 
 * API Endpoints:
 *   - GET /patients - List with pagination & search
 *   - GET /patients/:id - Get by ID
 *   - GET /patients/mrn/:mrn - Get by MRN
 *   - POST /patients - Create new patient
 *   - PUT /patients/:id - Update patient
 *   - DELETE /patients/:id - Soft delete
 */

import api from './api';
import type { Patient, PatientCreateData, PatientUpdateData, PaginatedResponse } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface PatientListParams {
  page?: number;
  size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// =============================================================================
// PATIENT SERVICE
// =============================================================================

class PatientService {
  /**
   * Get paginated list of patients
   */
  async getPatients(params: PatientListParams = {}): Promise<PaginatedResponse<Patient>> {
    const response = await api.get<PaginatedResponse<Patient>>('/patients/', {
      params: {
        page: params.page || 1,
        size: params.size || 20,
        search: params.search || undefined,
        sort_by: params.sort_by || 'created_at',
        sort_order: params.sort_order || 'desc',
      },
    });
    return response.data;
  }

  /**
   * Get single patient by ID
   */
  async getPatient(id: string): Promise<Patient> {
    const response = await api.get<Patient>(`/patients/${id}`);
    return response.data;
  }

  /**
   * Get patient by MRN
   */
  async getPatientByMRN(mrn: string): Promise<Patient> {
    const response = await api.get<Patient>(`/patients/mrn/${mrn}`);
    return response.data;
  }

  /**
   * Search patients by name
   */
  async searchPatients(name: string): Promise<Patient[]> {
    const response = await api.get<Patient[]>(`/patients/search/name/${name}`);
    return response.data;
  }

  /**
   * Get patient count
   */
  async getPatientCount(): Promise<number> {
    const response = await api.get<{ total: number }>('/patients/count');
    return response.data.total;
  }

  /**
   * Create new patient
   */
  async createPatient(data: PatientCreateData): Promise<Patient> {
    const response = await api.post<Patient>('/patients', data);
    return response.data;
  }

  /**
   * Update patient
   */
  async updatePatient(id: string, data: PatientUpdateData): Promise<Patient> {
    const response = await api.put<Patient>(`/patients/${id}`, data);
    return response.data;
  }

  /**
   * Delete patient (soft delete)
   */
  async deletePatient(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  }
}

// Export singleton instance
const patientService = new PatientService();
export default patientService;
