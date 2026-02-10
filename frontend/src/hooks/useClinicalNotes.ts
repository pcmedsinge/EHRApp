/**
 * Clinical Notes React Query Hooks
 * Phase: 3F (Clinical Notes Frontend)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import * as clinicalNoteService from '@/services/clinicalNoteService';
import type { ClinicalNoteCreate, ClinicalNoteUpdate } from '@/types/clinicalNote';

// ============================================================================
// QUERY HOOKS
// ============================================================================

export const useVisitClinicalNotes = (visitId: string) => {
  return useQuery({
    queryKey: ['clinical-notes', 'visit', visitId],
    queryFn: () => clinicalNoteService.getVisitClinicalNotes(visitId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useVisitPrimaryNote = (visitId: string) => {
  return useQuery({
    queryKey: ['clinical-notes', 'visit', visitId, 'primary'],
    queryFn: () => clinicalNoteService.getVisitPrimaryNote(visitId),
    staleTime: 2 * 60 * 1000,
    retry: false, // Don't retry if primary note doesn't exist
  });
};

export const usePatientClinicalNotes = (patientId: string, limit?: number) => {
  return useQuery({
    queryKey: ['clinical-notes', 'patient', patientId, limit],
    queryFn: () => clinicalNoteService.getPatientClinicalNotes(patientId, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useClinicalNote = (noteId: string) => {
  return useQuery({
    queryKey: ['clinical-notes', noteId],
    queryFn: () => clinicalNoteService.getClinicalNote(noteId),
    staleTime: 2 * 60 * 1000,
  });
};

export const useNoteTemplates = (noteType?: string, specialty?: string) => {
  return useQuery({
    queryKey: ['note-templates', noteType, specialty],
    queryFn: () => clinicalNoteService.getNoteTemplates(noteType, specialty),
    staleTime: 10 * 60 * 1000, // 10 minutes - templates don't change often
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export const useCreateClinicalNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClinicalNoteCreate) => clinicalNoteService.createClinicalNote(data),
    onSuccess: (data) => {
      message.success('Clinical note created successfully');
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', 'visit', data.visit_id] });
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', 'patient', data.patient_id] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to create clinical note';
      message.error(errorMsg);
    },
  });
};

export const useUpdateClinicalNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: ClinicalNoteUpdate }) =>
      clinicalNoteService.updateClinicalNote(noteId, data),
    onSuccess: (data) => {
      message.success('Clinical note updated successfully');
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', data.id] });
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', 'visit', data.visit_id] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to update clinical note';
      message.error(errorMsg);
    },
  });
};

export const useLockClinicalNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, lock }: { noteId: string; lock: boolean }) =>
      clinicalNoteService.lockClinicalNote(noteId, lock),
    onSuccess: (data, variables) => {
      message.success(variables.lock ? 'Clinical note locked and signed' : 'Clinical note unlocked');
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', data.id] });
      queryClient.invalidateQueries({ queryKey: ['clinical-notes', 'visit', data.visit_id] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to lock/unlock clinical note';
      message.error(errorMsg);
    },
  });
};

export const useDeleteClinicalNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => clinicalNoteService.deleteClinicalNote(noteId),
    onSuccess: (_, noteId) => {
      message.success('Clinical note deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || 'Failed to delete clinical note';
      message.error(errorMsg);
    },
  });
};
