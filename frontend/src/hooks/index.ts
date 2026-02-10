/**
 * Hooks Barrel Export
 * 
 * Re-exports all custom hooks for cleaner imports.
 */

export { useAuth } from './useAuth';
export { useDebounce } from './useDebounce';
export { 
  usePatients, 
  usePatient, 
  usePatientCount,
  useCreatePatient, 
  useUpdatePatient, 
  useDeletePatient 
} from './usePatients';

// Visit hooks (Phase 2C)
export {
  visitKeys,
  useVisits,
  useVisit,
  usePatientVisits,
  useDoctorVisits,
  useTodayVisits,
  useVisitQueue,
  useVisitStats,
  useCreateVisit,
  useUpdateVisit,
  useUpdateVisitStatus,
  useCancelVisit,
  useStartConsultation,
  useCompleteVisit,
} from './useVisits';

// Vitals hooks (Phase 3B)
export {
  vitalKeys,
  useVisitVitals,
  usePatientVitalsHistory,
  useLatestVitals,
  useCreateVital,
  useUpdateVital,
  useDeleteVital,
} from './useVitals';
