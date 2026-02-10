import api from './api';
import type { Vital, VitalCreateData, VitalUpdateData } from '@/types/vital';

class VitalService {
  /**
   * Create new vital signs record
   */
  async createVital(data: VitalCreateData): Promise<Vital> {
    const response = await api.post<Vital>('/vitals/', data);
    return response.data;
  }

  /**
   * Get all vitals for a specific visit
   */
  async getVisitVitals(visitId: string): Promise<Vital[]> {
    const response = await api.get<Vital[]>(`/vitals/visit/${visitId}`);
    return response.data;
  }

  /**
   * Get patient vital signs history
   */
  async getPatientVitals(patientId: string, limit: number = 10): Promise<Vital[]> {
    const response = await api.get<Vital[]>(`/vitals/patient/${patientId}`, {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Get most recent vitals for a patient
   */
  async getLatestVitals(patientId: string): Promise<Vital> {
    const response = await api.get<Vital>(`/vitals/patient/${patientId}/latest`);
    return response.data;
  }

  /**
   * Update vital signs
   */
  async updateVital(id: string, data: VitalUpdateData): Promise<Vital> {
    const response = await api.put<Vital>(`/vitals/${id}`, data);
    return response.data;
  }

  /**
   * Delete vital signs record
   */
  async deleteVital(id: string): Promise<void> {
    await api.delete(`/vitals/${id}`);
  }
}

export const vitalService = new VitalService();
