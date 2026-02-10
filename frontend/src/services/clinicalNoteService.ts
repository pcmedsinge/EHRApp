/**
 * Clinical Notes API Service
 * Phase: 3F (Clinical Notes Frontend)
 */

import api from './api';
import type { ClinicalNote, ClinicalNoteCreate, ClinicalNoteUpdate, NoteTemplate, NoteTemplateCreate } from '@/types/clinicalNote';

const BASE_URL = '/clinical-notes';

// ============================================================================
// CLINICAL NOTES
// ============================================================================

export const createClinicalNote = async (data: ClinicalNoteCreate): Promise<ClinicalNote> => {
  const response = await api.post<ClinicalNote>(BASE_URL, data);
  return response.data;
};

export const getVisitClinicalNotes = async (visitId: string): Promise<ClinicalNote[]> => {
  const response = await api.get<ClinicalNote[]>(`${BASE_URL}/visit/${visitId}`);
  return response.data;
};

export const getVisitPrimaryNote = async (visitId: string): Promise<ClinicalNote> => {
  const response = await api.get<ClinicalNote>(`${BASE_URL}/visit/${visitId}/primary`);
  return response.data;
};

export const getPatientClinicalNotes = async (patientId: string, limit: number = 50): Promise<ClinicalNote[]> => {
  const response = await api.get<ClinicalNote[]>(`${BASE_URL}/patient/${patientId}`, {
    params: { limit }
  });
  return response.data;
};

export const getClinicalNote = async (noteId: string): Promise<ClinicalNote> => {
  const response = await api.get<ClinicalNote>(`${BASE_URL}/${noteId}`);
  return response.data;
};

export const updateClinicalNote = async (noteId: string, data: ClinicalNoteUpdate): Promise<ClinicalNote> => {
  const response = await api.put<ClinicalNote>(`${BASE_URL}/${noteId}`, data);
  return response.data;
};

export const lockClinicalNote = async (noteId: string, lock: boolean): Promise<ClinicalNote> => {
  const response = await api.post<ClinicalNote>(`${BASE_URL}/${noteId}/lock`, { lock });
  return response.data;
};

export const deleteClinicalNote = async (noteId: string): Promise<void> => {
  await api.delete(`${BASE_URL}/${noteId}`);
};

// ============================================================================
// NOTE TEMPLATES
// ============================================================================

export const getNoteTemplates = async (
  noteType?: string,
  specialty?: string,
  activeOnly: boolean = true
): Promise<NoteTemplate[]> => {
  const response = await api.get<NoteTemplate[]>(`${BASE_URL}/templates`, {
    params: { note_type: noteType, specialty, active_only: activeOnly }
  });
  return response.data;
};

export const getNoteTemplate = async (templateId: string): Promise<NoteTemplate> => {
  const response = await api.get<NoteTemplate>(`${BASE_URL}/templates/${templateId}`);
  return response.data;
};

export const createNoteTemplate = async (data: NoteTemplateCreate): Promise<NoteTemplate> => {
  const response = await api.post<NoteTemplate>(`${BASE_URL}/templates`, data);
  return response.data;
};

export const updateNoteTemplate = async (templateId: string, data: Partial<NoteTemplateCreate>): Promise<NoteTemplate> => {
  const response = await api.put<NoteTemplate>(`${BASE_URL}/templates/${templateId}`, data);
  return response.data;
};

export const deleteNoteTemplate = async (templateId: string): Promise<void> => {
  await api.delete(`${BASE_URL}/templates/${templateId}`);
};
