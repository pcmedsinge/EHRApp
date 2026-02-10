/**
 * Visit Hooks
 * ===========
 * 
 * Purpose:
 *   React Query hooks for visit data fetching and mutations.
 *   Provides caching, optimistic updates, and automatic refetching.
 * 
 * Module: src/hooks/useVisits.ts
 * Phase: 2C (Frontend - Visit Service)
 * 
 * References:
 *   - Phase 2C Spec: docs/phases/phase2/Phase2C_Frontend_VisitService.md
 *   - Visit Service: src/services/visitService.ts
 * 
 * Used By:
 *   - src/pages/visits/*.tsx (Visit pages)
 *   - src/pages/Dashboard.tsx
 * 
 * Query Keys:
 *   - ['visits', 'list', params] - Paginated list
 *   - ['visits', 'detail', id] - Single visit
 *   - ['visits', 'patient', patientId] - Patient history
 *   - ['visits', 'doctor', doctorId] - Doctor's visits
 *   - ['visits', 'today'] - Today's visits
 *   - ['visits', 'queue'] - Current queue
 *   - ['visits', 'stats'] - Statistics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import visitService from '@/services/visitService';
import type { 
  VisitListParams, 
  VisitCreateData, 
  VisitUpdateData, 
  VisitStatusUpdate,
  VisitStatus
} from '@/types';
import { message } from 'antd';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const visitKeys = {
  all: ['visits'] as const,
  lists: () => [...visitKeys.all, 'list'] as const,
  list: (params: VisitListParams) => [...visitKeys.lists(), params] as const,
  details: () => [...visitKeys.all, 'detail'] as const,
  detail: (id: string) => [...visitKeys.details(), id] as const,
  patient: (patientId: string) => [...visitKeys.all, 'patient', patientId] as const,
  doctor: (doctorId: string) => [...visitKeys.all, 'doctor', doctorId] as const,
  today: (params?: { status?: string; doctor_id?: string }) => 
    [...visitKeys.all, 'today', params] as const,
  queue: (status?: string) => [...visitKeys.all, 'queue', status] as const,
  stats: (params?: { date_from?: string; date_to?: string }) => 
    [...visitKeys.all, 'stats', params] as const,
};

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook for fetching paginated visits list with filters
 */
export const useVisits = (params: VisitListParams = {}) => {
  return useQuery({
    queryKey: visitKeys.list(params),
    queryFn: () => visitService.getVisits(params),
    placeholderData: (previousData) => previousData,
    staleTime: 10000, // 10 seconds - visits change frequently
  });
};

/**
 * Hook for fetching single visit by ID
 */
export const useVisit = (id: string) => {
  return useQuery({
    queryKey: visitKeys.detail(id),
    queryFn: () => visitService.getVisit(id),
    enabled: !!id,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook for fetching patient's visit history
 */
export const usePatientVisits = (
  patientId: string, 
  params: { page?: number; size?: number } = {}
) => {
  return useQuery({
    queryKey: visitKeys.patient(patientId),
    queryFn: () => visitService.getPatientVisits(patientId, params),
    enabled: !!patientId,
    staleTime: 30000,
  });
};

/**
 * Hook for fetching doctor's assigned visits
 */
export const useDoctorVisits = (
  doctorId: string,
  params: { date?: string; status?: string } = {}
) => {
  return useQuery({
    queryKey: visitKeys.doctor(doctorId),
    queryFn: () => visitService.getDoctorVisits(doctorId, params),
    enabled: !!doctorId,
    staleTime: 10000,
  });
};

/**
 * Hook for fetching today's visits
 */
export const useTodayVisits = (params: { status?: string; doctor_id?: string } = {}) => {
  return useQuery({
    queryKey: visitKeys.today(params),
    queryFn: () => visitService.getTodayVisits(params),
    staleTime: 10000, // Refresh frequently
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
};

/**
 * Hook for fetching current queue
 */
export const useVisitQueue = (status?: VisitStatus) => {
  return useQuery({
    queryKey: visitKeys.queue(status),
    queryFn: () => visitService.getQueue(status),
    staleTime: 5000, // Very short - queue changes frequently
    refetchInterval: 15000, // Auto-refresh every 15 seconds
  });
};

/**
 * Hook for fetching visit statistics
 */
export const useVisitStats = (params: { date_from?: string; date_to?: string } = {}) => {
  return useQuery({
    queryKey: visitKeys.stats(params),
    queryFn: () => visitService.getVisitStats(params),
    staleTime: 30000,
  });
};

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook for creating a new visit
 */
export const useCreateVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VisitCreateData) => visitService.createVisit(data),
    onSuccess: (visit) => {
      // Invalidate all visit lists
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: visitKeys.today() });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue() });
      queryClient.invalidateQueries({ queryKey: visitKeys.stats() });
      if (visit.patient_id) {
        queryClient.invalidateQueries({ queryKey: visitKeys.patient(visit.patient_id) });
      }
      message.success(`Visit ${visit.visit_number} created successfully!`);
    },
    onError: (error: unknown) => {
      const errorMsg = 
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
        'Failed to create visit';
      message.error(errorMsg);
    },
  });
};

/**
 * Hook for updating visit details
 */
export const useUpdateVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VisitUpdateData }) =>
      visitService.updateVisit(id, data),
    onSuccess: (visit, variables) => {
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: visitKeys.today() });
      message.success(`Visit ${visit.visit_number} updated successfully!`);
    },
    onError: (error: unknown) => {
      const errorMsg = 
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
        'Failed to update visit';
      message.error(errorMsg);
    },
  });
};

/**
 * Hook for updating visit status
 */
export const useUpdateVisitStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & VisitStatusUpdate) =>
      visitService.updateStatus(id, data),
    onSuccess: (visit, variables) => {
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: visitKeys.today() });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue() });
      queryClient.invalidateQueries({ queryKey: visitKeys.stats() });
      message.success(`Visit status updated to ${visit.status}`);
    },
    onError: (error: unknown) => {
      const errorMsg = 
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
        'Failed to update status';
      message.error(errorMsg);
    },
  });
};

/**
 * Hook for cancelling a visit
 */
export const useCancelVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      visitService.cancelVisit(id, reason),
    onSuccess: (visit, variables) => {
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: visitKeys.today() });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue() });
      queryClient.invalidateQueries({ queryKey: visitKeys.stats() });
      message.success(`Visit ${visit.visit_number} cancelled`);
    },
    onError: (error: unknown) => {
      const errorMsg = 
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
        'Failed to cancel visit';
      message.error(errorMsg);
    },
  });
};

/**
 * Hook for starting consultation
 */
export const useStartConsultation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, doctorId }: { id: string; doctorId?: string }) =>
      visitService.startConsultation(id, doctorId),
    onSuccess: (visit, variables) => {
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: visitKeys.today() });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue() });
      queryClient.invalidateQueries({ queryKey: visitKeys.stats() });
      message.success(`Consultation started for ${visit.visit_number}`);
    },
    onError: (error: unknown) => {
      const errorMsg = 
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
        'Failed to start consultation';
      message.error(errorMsg);
    },
  });
};

/**
 * Hook for completing a visit
 */
export const useCompleteVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => visitService.completeVisit(id),
    onSuccess: (visit) => {
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(visit.id) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: visitKeys.today() });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue() });
      queryClient.invalidateQueries({ queryKey: visitKeys.stats() });
      message.success(`Visit ${visit.visit_number} completed`);
    },
    onError: (error: unknown) => {
      const errorMsg = 
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
        'Failed to complete visit';
      message.error(errorMsg);
    },
  });
};
