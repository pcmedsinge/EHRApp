/**
 * Patient Hooks
 * 
 * React Query hooks for patient data fetching and mutations.
 * Provides caching, optimistic updates, and automatic refetching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import patientService from '@/services/patientService';
import type { PatientListParams } from '@/services/patientService';
import type { PatientCreateData, PatientUpdateData } from '@/types';
import { message } from 'antd';

// Query key constants
const PATIENTS_QUERY_KEY = 'patients';
const PATIENT_COUNT_KEY = 'patient-count';

/**
 * Hook for fetching paginated patients list
 */
export const usePatients = (params: PatientListParams = {}) => {
  return useQuery({
    queryKey: [PATIENTS_QUERY_KEY, params],
    queryFn: () => patientService.getPatients(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook for fetching single patient by ID
 */
export const usePatient = (id: string) => {
  return useQuery({
    queryKey: [PATIENTS_QUERY_KEY, id],
    queryFn: () => patientService.getPatient(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook for fetching patient count
 */
export const usePatientCount = () => {
  return useQuery({
    queryKey: [PATIENT_COUNT_KEY],
    queryFn: () => patientService.getPatientCount(),
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook for creating a new patient
 */
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PatientCreateData) => patientService.createPatient(data),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PATIENT_COUNT_KEY] });
      message.success(`Patient ${patient.full_name} created successfully!`);
    },
    onError: (error: unknown) => {
      const errorMsg = 
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
        'Failed to create patient';
      message.error(errorMsg);
    },
  });
};

/**
 * Hook for updating an existing patient
 */
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatientUpdateData }) =>
      patientService.updatePatient(id, data),
    onSuccess: (patient, variables) => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [PATIENTS_QUERY_KEY] });
      message.success(`Patient ${patient.full_name} updated successfully!`);
    },
    onError: (error: unknown) => {
      const errorMsg = 
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
        'Failed to update patient';
      message.error(errorMsg);
    },
  });
};

/**
 * Hook for deleting a patient (soft delete)
 */
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientService.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PATIENT_COUNT_KEY] });
      message.success('Patient deleted successfully!');
    },
    onError: (error: unknown) => {
      const errorMsg = 
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
        'Failed to delete patient';
      message.error(errorMsg);
    },
  });
};
