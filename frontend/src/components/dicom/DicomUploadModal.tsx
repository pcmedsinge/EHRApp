/**
 * DicomUploadModal Component
 * ==========================
 * 
 * Main wizard component for uploading DICOM files to Orthanc PACS.
 * Orchestrates file selection, tag preview, patient matching, and upload.
 * 
 * Module: frontend/src/components/dicom/DicomUploadModal.tsx
 * Phase: 5B (Upload Frontend)
 */

import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Space, message } from 'antd';
import { 
  InboxOutlined, 
  FileSearchOutlined, 
  UserOutlined, 
  CloudUploadOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import FileDropzone from './FileDropzone';
import DicomTagsPreview from './DicomTagsPreview';
import PatientMatcher from './PatientMatcher';
import UploadProgress from './UploadProgress';
import { useUploadDicom, useReadDicomTags, useModifyDicomTags } from '@/hooks/useDicom';
import type { DicomFile, DicomTags, UploadProgress as UploadProgressType } from '@/types/dicom';
import type { Patient } from '@/types';
import { PatientContextHeader } from '@/components/patient';

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface DicomUploadModalProps {
  open: boolean;
  onClose: () => void;
  orderId?: string;
  patientId?: string;
  onUploadComplete?: (studyInstanceUid: string) => void;
}

// ============================================================================
// UPLOAD WIZARD STEPS (using const instead of enum for verbatimModuleSyntax)
// ============================================================================

const WizardStep = {
  SELECT_FILES: 0,
  PREVIEW_TAGS: 1,
  MATCH_PATIENT: 2,
  UPLOAD: 3,
  COMPLETE: 4,
} as const;

type WizardStepType = typeof WizardStep[keyof typeof WizardStep];

// ============================================================================
// COMPONENT
// ============================================================================

const DicomUploadModal: React.FC<DicomUploadModalProps> = ({
  open,
  onClose,
  orderId,
  patientId,
  onUploadComplete,
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<WizardStepType>(WizardStep.SELECT_FILES);
  const [selectedFiles, setSelectedFiles] = useState<DicomFile[]>([]);
  const [dicomTags, setDicomTags] = useState<DicomTags | null>(null);
  const [modifiedTags, setModifiedTags] = useState<Partial<DicomTags>>({});
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType[]>([]);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  // Hooks
  const readTagsMutation = useReadDicomTags();
  const modifyTagsMutation = useModifyDicomTags();
  const uploadMutation = useUploadDicom();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(WizardStep.SELECT_FILES);
      setSelectedFiles([]);
      setDicomTags(null);
      setModifiedTags({});
      setSelectedPatient(null);
      setUploadProgress([]);
      setOverallProgress(0);
      setIsUploading(false);
    }
  }, [open]);

  // Handle file selection
  const handleFilesSelected = (files: DicomFile[]) => {
    setSelectedFiles(files);
  };

  // Handle next button for Step 1 (File Selection)
  const handleNextFromFileSelection = async () => {
    const validFiles = selectedFiles.filter(f => f.isValid);
    
    if (validFiles.length === 0) {
      message.error('Please select at least one valid DICOM file');
      return;
    }

    // Read tags from first file
    try {
      const firstFile = validFiles[0].file;
      const tagsResponse = await readTagsMutation.mutateAsync(firstFile);
      setDicomTags(tagsResponse.tags);
      setCurrentStep(WizardStep.PREVIEW_TAGS);
    } catch (error: any) {
      message.error(error.message || 'Failed to read DICOM tags');
    }
  };

  // Handle next button for Step 2 (Tag Preview)
  const handleNextFromTagPreview = async () => {
    if (!dicomTags) {
      message.error('DICOM tags not loaded');
      return;
    }

    // Validate required tags
    const requiredTags = ['PatientID', 'PatientName', 'StudyInstanceUID', 'AccessionNumber'];
    const missingTags = requiredTags.filter(tag => !dicomTags[tag as keyof DicomTags]);
    
    if (missingTags.length > 0) {
      message.error(`Missing required tags: ${missingTags.join(', ')}`);
      return;
    }

    setCurrentStep(WizardStep.MATCH_PATIENT);
  };

  // Handle tag modifications
  const handleTagsModified = (tags: Partial<DicomTags>) => {
    setModifiedTags({ ...modifiedTags, ...tags });
    
    // Update dicomTags with modified values
    if (dicomTags) {
      setDicomTags({ ...dicomTags, ...tags });
    }
  };

  // Handle patient selection
  const handlePatientSelected = (patient: Patient | null) => {
    setSelectedPatient(patient);
  };

  // Handle next button for Step 3 (Patient Matching)
  const handleNextFromPatientMatch = () => {
    if (!selectedPatient) {
      message.error('Please select a patient');
      return;
    }

    setCurrentStep(WizardStep.UPLOAD);
    // Start upload immediately
    startUpload();
  };

  // Start upload process
  const startUpload = async () => {
    if (!selectedPatient || !dicomTags) {
      message.error('Missing required data for upload');
      return;
    }

    setIsUploading(true);

    const validFiles = selectedFiles.filter(f => f.isValid);
    
    // Initialize progress tracking
    const initialProgress: UploadProgressType[] = validFiles.map(df => ({
      fileName: df.file.name,
      status: 'pending',
      progress: 0,
      uploadedBytes: 0,
      totalBytes: df.file.size,
    }));
    setUploadProgress(initialProgress);

    // Upload files sequentially
    let completedCount = 0;
    const totalFiles = validFiles.length;

    for (let i = 0; i < validFiles.length; i++) {
      const dicomFile = validFiles[i];
      
      // Update status to uploading
      setUploadProgress(prev => 
        prev.map((p, idx) => 
          idx === i ? { ...p, status: 'uploading' } : p
        )
      );

      try {
        // Apply tag modifications if any
        let fileToUpload = dicomFile.file;
        if (Object.keys(modifiedTags).length > 0) {
          try {
            const modifiedBlob = await modifyTagsMutation.mutateAsync({
              file: dicomFile.file,
              tags: modifiedTags,
            });
            fileToUpload = new File([modifiedBlob], dicomFile.file.name, { type: 'application/dicom' });
          } catch (error) {
            console.error('Failed to modify tags, uploading original file:', error);
          }
        }

        // Upload file
        const response = await uploadMutation.mutateAsync({
          file: fileToUpload,
          patientId: selectedPatient.id,
          orderId: orderId,
        });

        // Update upload progress manually
        setUploadProgress(prev =>
          prev.map((p, idx) =>
            idx === i
              ? {
                  ...p,
                  progress: 100,
                  uploadedBytes: p.totalBytes,
                }
              : p
          )
        );

        // Update status to completed
        completedCount++;
        setUploadProgress(prev =>
          prev.map((p, idx) =>
            idx === i
              ? {
                  ...p,
                  status: 'completed',
                  progress: 100,
                  uploadedBytes: p.totalBytes,
                  studyInstanceUid: response.study_instance_uid,
                }
              : p
          )
        );

        // Update overall progress
        setOverallProgress((completedCount / totalFiles) * 100);

      } catch (error: any) {
        // Update status to error
        setUploadProgress(prev =>
          prev.map((p, idx) =>
            idx === i
              ? {
                  ...p,
                  status: 'error',
                  error: error.message || 'Upload failed',
                }
              : p
          )
        );
        
        message.error(`Failed to upload ${dicomFile.file.name}: ${error.message}`);
      }
    }

    setIsUploading(false);
    setCurrentStep(WizardStep.COMPLETE as WizardStepType);

    // Call completion callback with first study UID
    const firstCompletedFile = uploadProgress.find(p => p.status === 'completed');
    if (firstCompletedFile?.studyInstanceUid && onUploadComplete) {
      onUploadComplete(firstCompletedFile.studyInstanceUid);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > WizardStep.SELECT_FILES && currentStep < WizardStep.UPLOAD) {
      setCurrentStep((currentStep - 1) as WizardStepType);
    }
  };

  // Handle close
  const handleClose = () => {
    if (isUploading) {
      Modal.confirm({
        title: 'Upload in Progress',
        content: 'Are you sure you want to cancel the upload?',
        onOk: () => {
          setIsUploading(false);
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  // Get step content
  const getStepContent = () => {
    switch (currentStep) {
      case WizardStep.SELECT_FILES:
        return (
          <FileDropzone
            files={selectedFiles}
            onFilesSelected={handleFilesSelected}
            maxFiles={500}
            maxSizeMB={100}
          />
        );

      case WizardStep.PREVIEW_TAGS:
        return dicomTags ? (
          <DicomTagsPreview
            tags={dicomTags}
            onTagsModified={handleTagsModified}
            showValidation
            patientName={selectedPatient?.full_name}
            patientMRN={selectedPatient?.mrn}
          />
        ) : null;

      case WizardStep.MATCH_PATIENT:
        return dicomTags ? (
          <PatientMatcher
            dicomPatientId={dicomTags.PatientID}
            dicomPatientName={dicomTags.PatientName}
            dicomPatientBirthDate={dicomTags.PatientBirthDate}
            preSelectedPatientId={patientId}
            onPatientSelected={handlePatientSelected}
          />
        ) : null;

      case WizardStep.UPLOAD:
      case WizardStep.COMPLETE:
        return (
          <UploadProgress
            progress={uploadProgress}
            overallProgress={overallProgress}
          />
        );

      default:
        return null;
    }
  };

  // Get footer buttons
  const getFooterButtons = () => {
    const buttons = [];

    // Back button
    if (currentStep > WizardStep.SELECT_FILES && currentStep < WizardStep.UPLOAD) {
      buttons.push(
        <Button key="back" onClick={handleBack}>
          Back
        </Button>
      );
    }

    // Cancel/Close button
    if (currentStep === WizardStep.COMPLETE) {
      buttons.push(
        <Button key="close" type="primary" onClick={handleClose}>
          Close
        </Button>
      );
    } else {
      buttons.push(
        <Button key="cancel" onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
      );
    }

    // Next/Upload button
    if (currentStep === WizardStep.SELECT_FILES) {
      buttons.push(
        <Button
          key="next"
          type="primary"
          onClick={handleNextFromFileSelection}
          disabled={selectedFiles.filter(f => f.isValid).length === 0}
          loading={readTagsMutation.isPending}
        >
          Next
        </Button>
      );
    } else if (currentStep === WizardStep.PREVIEW_TAGS) {
      buttons.push(
        <Button
          key="next"
          type="primary"
          onClick={handleNextFromTagPreview}
        >
          Next
        </Button>
      );
    } else if (currentStep === WizardStep.MATCH_PATIENT) {
      buttons.push(
        <Button
          key="upload"
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={handleNextFromPatientMatch}
          disabled={!selectedPatient}
        >
          Start Upload
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Modal
      title={
        patientId && selectedPatient ? (
          <span>
            Upload DICOM Images - {selectedPatient.full_name}
            {selectedPatient.mrn && (
              <span style={{ color: '#8c8c8c', fontWeight: 'normal' }}>
                {' '}(MRN: {selectedPatient.mrn})
              </span>
            )}
          </span>
        ) : (
          'Upload DICOM Images'
        )
      }
      open={open}
      onCancel={handleClose}
      footer={getFooterButtons()}
      width={900}
      maskClosable={!isUploading}
      closable={!isUploading}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Progress Steps */}
        <Steps current={currentStep} size="small" items={[
          {
            title: 'Select Files',
            icon: <InboxOutlined />,
          },
          {
            title: 'Preview Tags',
            icon: <FileSearchOutlined />,
          },
          {
            title: 'Match Patient',
            icon: <UserOutlined />,
          },
          {
            title: 'Upload',
            icon: <CloudUploadOutlined />,
          },
          {
            title: 'Complete',
            icon: <CheckCircleOutlined />,
          },
        ]} />

        {/* Patient Context Header */}
        {selectedPatient && (
          <PatientContextHeader
            patient={selectedPatient}
            showVisitInfo={false}
          />
        )}

        {/* Step Content */}
        <div style={{ minHeight: 400 }}>
          {getStepContent()}
        </div>
      </Space>
    </Modal>
  );
};

export default DicomUploadModal;
