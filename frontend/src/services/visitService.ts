/**
 * Visit Service
 * =============
 * 
 * Purpose:
 *   API client for visit CRUD and status management.
 *   Handles all visit-related HTTP requests.
 * 
 * Module: src/services/visitService.ts
 * Phase: 2C (Frontend - Visit Service)
 * 
 * References:
 *   - Visit Module: docs/phases/phase2/diagrams/visit-module.md
 *   - Phase 2C Spec: docs/phases/phase2/Phase2C_Frontend_VisitService.md
 *   - Backend API: app/api/v1/visits/router.py
 * 
 * Used By:
 *   - src/hooks/useVisits.ts (React Query hooks)
 *   - src/pages/visits/*.tsx (Visit pages)
 * 
 * API Endpoints:
 *   - GET /visits - List with pagination & filters
 *   - GET /visits/:id - Get by ID
 *   - GET /visits/number/:number - Get by visit number
 *   - POST /visits - Create new visit
 *   - PUT /visits/:id - Update visit
 *   - PATCH /visits/:id/status - Update status
 *   - DELETE /visits/:id - Cancel visit
 *   - GET /visits/patient/:id - Patient visit history
 *   - GET /visits/doctor/:id - Doctor's visits
 *   - GET /visits/today - Today's visits
 *   - GET /visits/queue - Current queue
 *   - GET /visits/stats - Statistics
 *   - POST /visits/:id/start - Start consultation
 *   - POST /visits/:id/complete - Complete visit
 */

import api from './api';
import type { 
  Visit, 
  VisitCreateData, 
  VisitUpdateData, 
  VisitStatusUpdate,
  VisitListParams,
  VisitStats,
  PaginatedResponse 
} from '@/types';

// =============================================================================
// VISIT SERVICE CLASS
// =============================================================================

class VisitService {
  /**
   * Get paginated list of visits with filters
   */
  async getVisits(params: VisitListParams = {}): Promise<PaginatedResponse<Visit>> {
    const response = await api.get<PaginatedResponse<Visit>>('/visits/', {
      params: {
        page: params.page || 1,
        size: params.size || 20,
        status: params.status || undefined,
        visit_type: params.visit_type || undefined,
        priority: params.priority || undefined,
        patient_id: params.patient_id || undefined,
        doctor_id: params.doctor_id || undefined,
        date_from: params.date_from || undefined,
        date_to: params.date_to || undefined,
        search: params.search || undefined,
        sort_by: params.sort_by || 'created_at',
        sort_order: params.sort_order || 'desc',
      },
    });
    return response.data;
  }

  /**
   * Get single visit by ID
   */
  async getVisit(id: string): Promise<Visit> {
    const response = await api.get<Visit>(`/visits/${id}`);
    return response.data;
  }

  /**
   * Get visit by visit number
   */
  async getVisitByNumber(visitNumber: string): Promise<Visit> {
    const response = await api.get<Visit>(`/visits/number/${visitNumber}`);
    return response.data;
  }

  /**
   * Create new visit
   */
  async createVisit(data: VisitCreateData): Promise<Visit> {
    const response = await api.post<Visit>('/visits/', data);
    return response.data;
  }

  /**
   * Update visit details
   */
  async updateVisit(id: string, data: VisitUpdateData): Promise<Visit> {
    const response = await api.put<Visit>(`/visits/${id}`, data);
    return response.data;
  }

  /**
   * Update visit status only
   */
  async updateStatus(id: string, data: VisitStatusUpdate): Promise<Visit> {
    const response = await api.patch<Visit>(`/visits/${id}/status`, data);
    return response.data;
  }

  /**
   * Cancel visit (soft delete)
   */
  async cancelVisit(id: string, reason: string): Promise<Visit> {
    const response = await api.delete<Visit>(`/visits/${id}`, {
      params: { reason },
    });
    return response.data;
  }

  /**
   * Get patient's visit history
   */
  async getPatientVisits(
    patientId: string, 
    params: { page?: number; size?: number } = {}
  ): Promise<PaginatedResponse<Visit>> {
    const response = await api.get<PaginatedResponse<Visit>>(`/visits/patient/${patientId}`, {
      params: {
        page: params.page || 1,
        size: params.size || 20,
      },
    });
    return response.data;
  }

  /**
   * Get doctor's assigned visits
   */
  async getDoctorVisits(
    doctorId: string,
    params: { date?: string; status?: string } = {}
  ): Promise<Visit[]> {
    const response = await api.get<Visit[]>(`/visits/doctor/${doctorId}`, {
      params: {
        visit_date: params.date || undefined,
        status: params.status || undefined,
      },
    });
    return response.data;
  }

  /**
   * Get today's visits
   */
  async getTodayVisits(params: { status?: string; doctor_id?: string } = {}): Promise<Visit[]> {
    const response = await api.get<Visit[]>('/visits/today', {
      params: {
        status: params.status || undefined,
        doctor_id: params.doctor_id || undefined,
      },
    });
    return response.data;
  }

  /**
   * Get current queue (waiting visits)
   */
  async getQueue(status?: string): Promise<Visit[]> {
    const response = await api.get<Visit[]>('/visits/queue', {
      params: { status },
    });
    return response.data;
  }

  /**
   * Get visit statistics
   */
  async getVisitStats(params: { date_from?: string; date_to?: string } = {}): Promise<VisitStats> {
    const response = await api.get<VisitStats>('/visits/stats', {
      params: {
        date_from: params.date_from || undefined,
        date_to: params.date_to || undefined,
      },
    });
    return response.data;
  }

  /**
   * Start consultation (changes status to in_progress)
   */
  async startConsultation(id: string, doctorId?: string): Promise<Visit> {
    const response = await api.post<Visit>(`/visits/${id}/start`, null, {
      params: { doctor_id: doctorId },
    });
    return response.data;
  }

  /**
   * Complete visit (changes status to completed)
   */
  async completeVisit(id: string): Promise<Visit> {
    const response = await api.post<Visit>(`/visits/${id}/complete`);
    return response.data;
  }
}

// Export singleton instance
const visitService = new VisitService();
export default visitService;
