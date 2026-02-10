/**
 * Visit Utilities
 * ===============
 * 
 * Purpose:
 *   Utility functions for visit-related operations.
 *   Includes color mapping, status validation, and formatting.
 * 
 * Module: src/utils/visitUtils.ts
 * Phase: 2C (Frontend - Visit Service)
 * 
 * References:
 *   - Phase 2C Spec: docs/phases/phase2/Phase2C_Frontend_VisitService.md
 *   - Visit Status Flow: docs/phases/phase2/diagrams/visit-status-flow.md
 * 
 * Used By:
 *   - src/pages/visits/*.tsx
 *   - src/components/visits/*.tsx
 */

import type { VisitStatus, VisitType, VisitPriority } from '@/types';

// =============================================================================
// STATUS UTILITIES
// =============================================================================

/**
 * Get Ant Design tag color for visit status
 */
export const getStatusColor = (status: VisitStatus): string => {
  const colors: Record<VisitStatus, string> = {
    registered: 'blue',
    waiting: 'orange',
    in_progress: 'processing',
    completed: 'success',
    cancelled: 'default',
  };
  return colors[status] || 'default';
};

/**
 * Get display label for visit status
 */
export const getStatusLabel = (status: VisitStatus): string => {
  const labels: Record<VisitStatus, string> = {
    registered: 'Registered',
    waiting: 'Waiting',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
};

/**
 * Get Ant Design icon name for visit status
 */
export const getStatusIcon = (status: VisitStatus): string => {
  const icons: Record<VisitStatus, string> = {
    registered: 'CheckCircleOutlined',
    waiting: 'ClockCircleOutlined',
    in_progress: 'SyncOutlined',
    completed: 'CheckSquareOutlined',
    cancelled: 'CloseCircleOutlined',
  };
  return icons[status] || 'QuestionCircleOutlined';
};

// =============================================================================
// PRIORITY UTILITIES
// =============================================================================

/**
 * Get Ant Design tag color for priority
 */
export const getPriorityColor = (priority: VisitPriority): string => {
  const colors: Record<VisitPriority, string> = {
    normal: 'default',
    urgent: 'warning',
    emergency: 'error',
  };
  return colors[priority] || 'default';
};

/**
 * Get display label for priority
 */
export const getPriorityLabel = (priority: VisitPriority): string => {
  const labels: Record<VisitPriority, string> = {
    normal: 'Normal',
    urgent: 'Urgent',
    emergency: 'Emergency',
  };
  return labels[priority] || priority;
};

// =============================================================================
// VISIT TYPE UTILITIES
// =============================================================================

/**
 * Get Ant Design icon name for visit type
 */
export const getVisitTypeIcon = (type: VisitType): string => {
  const icons: Record<VisitType, string> = {
    consultation: 'MessageOutlined',
    follow_up: 'ReloadOutlined',
    emergency: 'AlertOutlined',
    procedure: 'MedicineBoxOutlined',
  };
  return icons[type] || 'FileOutlined';
};

/**
 * Get display label for visit type
 */
export const getVisitTypeLabel = (type: VisitType): string => {
  const labels: Record<VisitType, string> = {
    consultation: 'Consultation',
    follow_up: 'Follow Up',
    emergency: 'Emergency',
    procedure: 'Procedure',
  };
  return labels[type] || type;
};

/**
 * Get Ant Design tag color for visit type
 */
export const getVisitTypeColor = (type: VisitType): string => {
  const colors: Record<VisitType, string> = {
    consultation: 'blue',
    follow_up: 'cyan',
    emergency: 'red',
    procedure: 'purple',
  };
  return colors[type] || 'default';
};

// =============================================================================
// STATUS TRANSITION UTILITIES
// =============================================================================

/**
 * Valid status transitions map
 */
const VALID_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  registered: ['waiting', 'cancelled'],
  waiting: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Check if a status transition is valid
 */
export const isValidTransition = (current: VisitStatus, next: VisitStatus): boolean => {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
};

/**
 * Get next valid statuses from current status
 */
export const getNextStatuses = (current: VisitStatus): VisitStatus[] => {
  return VALID_TRANSITIONS[current] ?? [];
};

/**
 * Check if a status is terminal (no further transitions)
 */
export const isTerminalStatus = (status: VisitStatus): boolean => {
  return status === 'completed' || status === 'cancelled';
};

// =============================================================================
// TIME UTILITIES
// =============================================================================

/**
 * Format wait time in minutes to human readable
 */
export const formatWaitTime = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Format consultation duration
 */
export const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Calculate wait time from check-in to now (in minutes)
 */
export const calculateWaitTime = (checkInTime: string | null | undefined): number | null => {
  if (!checkInTime) return null;
  const checkIn = new Date(checkInTime);
  const now = new Date();
  const diffMs = now.getTime() - checkIn.getTime();
  return Math.floor(diffMs / (1000 * 60));
};

// =============================================================================
// VISIT NUMBER UTILITIES
// =============================================================================

/**
 * Format visit number for display (already formatted from backend)
 */
export const formatVisitNumber = (visitNumber: string): string => {
  return visitNumber; // VIS-YYYY-NNNNN format from backend
};

/**
 * Extract year from visit number
 */
export const getVisitYear = (visitNumber: string): number | null => {
  const match = visitNumber.match(/VIS-(\d{4})-\d+/);
  return match ? parseInt(match[1], 10) : null;
};
