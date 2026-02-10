/**
 * DICOM Viewer Modal
 * ==================
 * 
 * Modal wrapper for embedded DICOM viewer.
 * Provides a clean interface for viewing studies in a modal dialog.
 * 
 * Module: frontend/src/components/dicom/DicomViewerModal.tsx
 * Phase: 5C (Viewer Integration)
 */

import React from 'react';
import { Modal } from 'antd';
import DicomViewer from './DicomViewer';

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface DicomViewerModalProps {
  /** Modal visibility */
  open: boolean;
  
  /** Callback when modal is closed */
  onClose: () => void;
  
  /** Single study UID */
  studyUid?: string;
  
  /** Multiple study UIDs for comparison */
  studyUids?: string[];
  
  /** Order ID to load study from */
  orderId?: string;
  
  /** Patient ID to load all studies from */
  patientId?: string;
  
  /** Patient name for modal title */
  patientName?: string;
  
  /** Patient MRN for modal title */
  patientMRN?: string;
  
  /** Modal title */
  title?: string;
  
  /** Modal width */
  width?: number | string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const DicomViewerModal: React.FC<DicomViewerModalProps> = ({
  open,
  onClose,
  studyUid,
  studyUids,
  orderId,
  patientId,
  patientName,
  patientMRN,
  title = 'DICOM Image Viewer',
  width = '90%',
}) => {
  // Build title with patient context if available
  const modalTitle = patientName && patientMRN 
    ? `${title} - ${patientName} (MRN: ${patientMRN})`
    : title;

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onClose}
      footer={null}
      width={width}
      style={{ top: 20 }}
      bodyStyle={{ padding: 0, height: 'calc(100vh - 120px)' }}
      destroyOnClose
    >
      <DicomViewer
        studyUid={studyUid}
        studyUids={studyUids}
        orderId={orderId}
        patientId={patientId}
        autoFullscreen={false}
        showControls={false}
        onClose={onClose}
      />
    </Modal>
  );
};

export default DicomViewerModal;
