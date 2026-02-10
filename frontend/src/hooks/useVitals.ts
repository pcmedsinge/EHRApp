import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { vitalService } from '@/services/vitalService';
import type { VitalCreateData, VitalUpdateData } from '@/types/vital';

// Query keys
export const vitalKeys = {
  all: ['vitals'] as const,
  visit: (visitId: string) => ['vitals', 'visit', visitId] as const,
  patient: (patientId: string) => ['vitals', 'patient', patientId] as const,
  latest: (patientId: string) => ['vitals', 'latest', patientId] as const,
};

/**
 * Get vitals for a specific visit
 */
export const useVisitVitals = (visitId: string) => {
  return useQuery({
    queryKey: vitalKeys.visit(visitId),
    queryFn: () => vitalService.getVisitVitals(visitId),
    enabled: !!visitId,
  });
};

/**
 * Get patient vital signs history
 */
export const usePatientVitalsHistory = (patientId: string, limit: number = 10) => {
  return useQuery({
    queryKey: vitalKeys.patient(patientId),
    queryFn: () => vitalService.getPatientVitals(patientId, limit),
    enabled: !!patientId,
  });
};

/**
 * Get latest vitals for a patient
 */
export const useLatestVitals = (patientId: string) => {
  return useQuery({
    queryKey: vitalKeys.latest(patientId),
    queryFn: () => vitalService.getLatestVitals(patientId),
    enabled: !!patientId,
    retry: false, // Don't retry if no vitals found
  });
};

/**
 * Create vital signs mutation
 */
export const useCreateVital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VitalCreateData) => vitalService.createVital(data),
    onSuccess: (vital) => {
      message.success('Vital signs recorded successfully');
      queryClient.invalidateQueries({ queryKey: vitalKeys.visit(vital.visit_id) });
      queryClient.invalidateQueries({ queryKey: vitalKeys.patient(vital.patient_id) });
      queryClient.invalidateQueries({ queryKey: vitalKeys.latest(vital.patient_id) });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to record vitals';
      message.error(errorMsg);
    },
  });
};

/**
 * Update vital signs mutation
 */
export const useUpdateVital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VitalUpdateData }) =>
      vitalService.updateVital(id, data),
    onSuccess: (vital) => {
      message.success('Vital signs updated successfully');
      queryClient.invalidateQueries({ queryKey: vitalKeys.visit(vital.visit_id) });
      queryClient.invalidateQueries({ queryKey: vitalKeys.patient(vital.patient_id) });
      queryClient.invalidateQueries({ queryKey: vitalKeys.latest(vital.patient_id) });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to update vitals');
    },
  });
};

/**
 * Delete vital signs mutation
 */
export const useDeleteVital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vitalService.deleteVital(id),
    onSuccess: () => {
      message.success('Vital signs deleted successfully');
      queryClient.invalidateQueries({ queryKey: vitalKeys.all });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to delete vitals');
    },
  });
};
