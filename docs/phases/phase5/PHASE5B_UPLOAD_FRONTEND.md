# Phase 5B: DICOM Upload Frontend (7-9 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 5A Complete ✅  
**Estimated Time:** 7-9 days

---

## Objectives

Build intuitive frontend for DICOM file upload with drag-and-drop interface, tag preview/editing, automatic patient/order matching, and upload progress tracking.

---

## Deliverables

### 1. TypeScript Types

#### File: `frontend/src/types/dicom.ts` (150-200 lines)

```typescript
/**
 * DICOM Types
 * Phase: 5B (Upload Frontend)
 */

// DICOM Tags
export interface DicomTags {
  PatientID?: string;
  PatientName?: string;
  PatientBirthDate?: string;
  PatientSex?: string;
  PatientAge?: string;
  StudyInstanceUID?: string;
  StudyDate?: string;
  StudyTime?: string;
  StudyDescription?: string;
  AccessionNumber?: string;
  SeriesInstanceUID?: string;
  SeriesNumber?: string;
  SeriesDescription?: string;
  Modality?: string;
  SOPInstanceUID?: string;
  InstanceNumber?: string;
  InstitutionName?: string;
  ReferringPhysicianName?: string;
  PerformingPhysicianName?: string;
}

// File with parsed tags
export interface DicomFile {
  file: File;
  tags: DicomTags;
  isValid: boolean;
  error?: string;
  preview?: string;  // Base64 thumbnail
}

// Upload request
export interface DicomUploadRequest {
  patientId: string;
  orderId?: string;
  files: File[];
  modifiedTags?: Partial<DicomTags>;
}

// Upload response
export interface DicomUploadResponse {
  success: boolean;
  orthancId?: string;
  studyUid?: string;
  tags?: DicomTags;
  message: string;
}

// Upload progress
export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// Study summary
export interface DicomStudy {
  StudyInstanceUID: string;
  OrthancStudyID: string;
  PatientID?: string;
  PatientName?: string;
  StudyDate?: string;
  StudyTime?: string;
  StudyDescription?: string;
  AccessionNumber?: string;
  Modality?: string;
  NumberOfSeries?: number;
  NumberOfInstances?: number;
}

// Upload log
export interface DicomUploadLog {
  id: string;
  patientId: string;
  orderId?: string;
  studyInstanceUid: string;
  orthancStudyId: string;
  numberOfFiles: number;
  totalSizeBytes: number;
  originalPatientId?: string;
  originalPatientName?: string;
  originalAccessionNumber?: string;
  uploadStatus: 'success' | 'failed' | 'partial';
  uploadedAt: string;
  uploadedBy: string;
}

// Tag modification
export interface TagModification {
  PatientID?: string;
  PatientName?: string;
  PatientBirthDate?: string;
  PatientSex?: string;
  AccessionNumber?: string;
  StudyDate?: string;
  StudyDescription?: string;
  removePrivateTags?: boolean;
}
```

---

### 2. API Service

#### File: `frontend/src/services/dicomService.ts` (200-250 lines)

```typescript
/**
 * DICOM API Service
 * Phase: 5B (Upload Frontend)
 */

import api from './api';
import type {
  DicomTags,
  DicomUploadRequest,
  DicomUploadResponse,
  DicomStudy,
  DicomUploadLog,
  TagModification,
} from '@/types/dicom';

// ============================================================================
// UPLOAD OPERATIONS
// ============================================================================

export const uploadDicomFile = async (
  file: File,
  patientId: string,
  orderId?: string
): Promise<DicomUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  if (patientId) formData.append('patient_id', patientId);
  if (orderId) formData.append('order_id', orderId);

  const response = await api.post<DicomUploadResponse>(
    '/dicom/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const uploadMultipleDicomFiles = async (
  files: File[],
  patientId: string,
  orderId?: string,
  onProgress?: (fileName: string, progress: number) => void
): Promise<DicomUploadResponse[]> => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (patientId) formData.append('patient_id', patientId);
  if (orderId) formData.append('order_id', orderId);

  const response = await api.post<DicomUploadResponse[]>(
    '/dicom/upload-multiple',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress('batch', percentCompleted);
        }
      },
    }
  );
  return response.data;
};

export const uploadZipFile = async (
  zipFile: File,
  patientId: string,
  orderId?: string
): Promise<DicomUploadResponse[]> => {
  const formData = new FormData();
  formData.append('file', zipFile);
  if (patientId) formData.append('patient_id', patientId);
  if (orderId) formData.append('order_id', orderId);

  const response = await api.post<DicomUploadResponse[]>(
    '/dicom/upload-zip',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// ============================================================================
// TAG OPERATIONS
// ============================================================================

export const readDicomTags = async (file: File): Promise<DicomTags> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ tags: DicomTags }>(
    '/dicom/read-tags',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.tags;
};

export const modifyDicomTags = async (
  file: File,
  modifications: TagModification
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(modifications).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });

  const response = await api.post('/dicom/modify-tags', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
  });
  return response.data;
};

export const validateDicomFile = async (file: File): Promise<boolean> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<{ is_valid: boolean }>(
      '/dicom/validate',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.is_valid;
  } catch {
    return false;
  }
};

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

export const listStudies = async (limit = 100): Promise<DicomStudy[]> => {
  const response = await api.get<DicomStudy[]>('/dicom/studies', {
    params: { limit },
  });
  return response.data;
};

export const getStudy = async (studyUid: string): Promise<DicomStudy> => {
  const response = await api.get<DicomStudy>(`/dicom/studies/${studyUid}`);
  return response.data;
};

export const getPatientStudies = async (
  patientId: string
): Promise<DicomStudy[]> => {
  const response = await api.get<DicomStudy[]>(
    `/dicom/studies/patient/${patientId}`
  );
  return response.data;
};

export const getOrderStudies = async (orderId: string): Promise<DicomStudy[]> => {
  const response = await api.get<DicomStudy[]>(`/dicom/studies/order/${orderId}`);
  return response.data;
};

// ============================================================================
// UPLOAD HISTORY
// ============================================================================

export const getUploadLogs = async (): Promise<DicomUploadLog[]> => {
  const response = await api.get<DicomUploadLog[]>('/dicom/uploads');
  return response.data;
};

export const getPatientUploadLogs = async (
  patientId: string
): Promise<DicomUploadLog[]> => {
  const response = await api.get<DicomUploadLog[]>(
    `/dicom/uploads/patient/${patientId}`
  );
  return response.data;
};

// ============================================================================
// VIEWER
// ============================================================================

export const getViewerUrl = async (studyUid: string): Promise<string> => {
  const response = await api.get<{ url: string }>(
    `/dicom/viewer-url/${studyUid}`
  );
  return response.data.url;
};

// ============================================================================
// DELETE
// ============================================================================

export const deleteStudy = async (
  studyUid: string,
  reason: string
): Promise<void> => {
  await api.delete(`/dicom/studies/${studyUid}`, {
    params: { reason },
  });
};
```

---

### 3. React Query Hooks

#### File: `frontend/src/hooks/useDicom.ts` (200-250 lines)

```typescript
/**
 * DICOM React Query Hooks
 * Phase: 5B (Upload Frontend)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import * as dicomService from '@/services/dicomService';
import type {
  DicomTags,
  DicomStudy,
  DicomUploadLog,
  TagModification,
} from '@/types/dicom';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const dicomKeys = {
  all: ['dicom'] as const,
  studies: () => [...dicomKeys.all, 'studies'] as const,
  study: (uid: string) => [...dicomKeys.studies(), uid] as const,
  patientStudies: (patientId: string) =>
    [...dicomKeys.studies(), 'patient', patientId] as const,
  orderStudies: (orderId: string) =>
    [...dicomKeys.studies(), 'order', orderId] as const,
  uploadLogs: () => [...dicomKeys.all, 'uploads'] as const,
  patientUploads: (patientId: string) =>
    [...dicomKeys.uploadLogs(), patientId] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

export const useStudies = (limit = 100) => {
  return useQuery({
    queryKey: [...dicomKeys.studies(), limit],
    queryFn: () => dicomService.listStudies(limit),
  });
};

export const useStudy = (studyUid: string) => {
  return useQuery({
    queryKey: dicomKeys.study(studyUid),
    queryFn: () => dicomService.getStudy(studyUid),
    enabled: !!studyUid,
  });
};

export const usePatientStudies = (patientId: string) => {
  return useQuery({
    queryKey: dicomKeys.patientStudies(patientId),
    queryFn: () => dicomService.getPatientStudies(patientId),
    enabled: !!patientId,
  });
};

export const useOrderStudies = (orderId: string) => {
  return useQuery({
    queryKey: dicomKeys.orderStudies(orderId),
    queryFn: () => dicomService.getOrderStudies(orderId),
    enabled: !!orderId,
  });
};

export const useUploadLogs = () => {
  return useQuery({
    queryKey: dicomKeys.uploadLogs(),
    queryFn: () => dicomService.getUploadLogs(),
  });
};

export const usePatientUploadLogs = (patientId: string) => {
  return useQuery({
    queryKey: dicomKeys.patientUploads(patientId),
    queryFn: () => dicomService.getPatientUploadLogs(patientId),
    enabled: !!patientId,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export const useUploadDicom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      patientId,
      orderId,
    }: {
      file: File;
      patientId: string;
      orderId?: string;
    }) => dicomService.uploadDicomFile(file, patientId, orderId),
    onSuccess: async (data) => {
      message.success('DICOM file uploaded successfully');
      
      // Refetch all related queries
      await queryClient.refetchQueries({ queryKey: dicomKeys.studies() });
      await queryClient.refetchQueries({ queryKey: dicomKeys.uploadLogs() });
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.detail || 'Failed to upload DICOM file'
      );
    },
  });
};

export const useUploadMultipleDicom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      files,
      patientId,
      orderId,
      onProgress,
    }: {
      files: File[];
      patientId: string;
      orderId?: string;
      onProgress?: (fileName: string, progress: number) => void;
    }) =>
      dicomService.uploadMultipleDicomFiles(files, patientId, orderId, onProgress),
    onSuccess: async (data) => {
      const successCount = data.filter((r) => r.success).length;
      message.success(`${successCount} of ${data.length} files uploaded successfully`);
      
      await queryClient.refetchQueries({ queryKey: dicomKeys.studies() });
      await queryClient.refetchQueries({ queryKey: dicomKeys.uploadLogs() });
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.detail || 'Failed to upload DICOM files'
      );
    },
  });
};

export const useDeleteStudy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studyUid, reason }: { studyUid: string; reason: string }) =>
      dicomService.deleteStudy(studyUid, reason),
    onSuccess: async () => {
      message.success('Study deleted successfully');
      await queryClient.refetchQueries({ queryKey: dicomKeys.studies() });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Failed to delete study');
    },
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useReadTags = () => {
  return useMutation({
    mutationFn: (file: File) => dicomService.readDicomTags(file),
    onError: (error: any) => {
      message.error('Failed to read DICOM tags');
    },
  });
};

export const useModifyTags = () => {
  return useMutation({
    mutationFn: ({
      file,
      modifications,
    }: {
      file: File;
      modifications: TagModification;
    }) => dicomService.modifyDicomTags(file, modifications),
    onError: (error: any) => {
      message.error('Failed to modify DICOM tags');
    },
  });
};
```

---

### 4. Upload Components

#### File: `frontend/src/components/dicom/DicomUploadModal.tsx` (400-500 lines)

```tsx
/**
 * DICOM Upload Modal
 * Phase: 5B (Upload Frontend)
 */

import React, { useState, useCallback } from 'react';
import {
  Modal,
  Steps,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import FileDropzone from './FileDropzone';
import DicomTagsPreview from './DicomTagsPreview';
import PatientMatcher from './PatientMatcher';
import UploadProgress from './UploadProgress';
import { useUploadMultipleDicom, useReadTags } from '@/hooks/useDicom';
import type { DicomFile, DicomTags } from '@/types/dicom';

const { Title, Text } = Typography;
const { Step } = Steps;

interface DicomUploadModalProps {
  visible: boolean;
  onClose: () => void;
  patientId?: string;
  orderId?: string;
  patientName?: string;
  patientMRN?: string;
}

const DicomUploadModal: React.FC<DicomUploadModalProps> = ({
  visible,
  onClose,
  patientId: initialPatientId,
  orderId,
  patientName,
  patientMRN,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [dicomFiles, setDicomFiles] = useState<DicomFile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(
    initialPatientId
  );
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  const readTags = useReadTags();
  const uploadMutation = useUploadMultipleDicom();

  // Step 1: File Selection
  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      setFiles(selectedFiles);

      // Read tags from all files
      const parsedFiles: DicomFile[] = [];
      for (const file of selectedFiles) {
        try {
          const tags = await readTags.mutateAsync(file);
          parsedFiles.push({
            file,
            tags,
            isValid: true,
          });
        } catch (error) {
          parsedFiles.push({
            file,
            tags: {},
            isValid: false,
            error: 'Failed to read DICOM tags',
          });
        }
      }

      setDicomFiles(parsedFiles);
      setCurrentStep(1);
    },
    [readTags]
  );

  // Step 2: Review Tags
  const handleTagsConfirmed = useCallback(() => {
    setCurrentStep(2);
  }, []);

  // Step 3: Select Patient (if not pre-selected)
  const handlePatientSelected = useCallback((patId: string) => {
    setSelectedPatientId(patId);
    setCurrentStep(3);
  }, []);

  // Step 4: Upload
  const handleUpload = useCallback(async () => {
    if (!selectedPatientId) {
      return;
    }

    setUploading(true);

    try {
      const results = await uploadMutation.mutateAsync({
        files: files,
        patientId: selectedPatientId,
        orderId: orderId,
      });

      setUploadResults(results);
      setCurrentStep(4);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  }, [selectedPatientId, files, orderId, uploadMutation]);

  const handleClose = () => {
    setCurrentStep(0);
    setFiles([]);
    setDicomFiles([]);
    setUploadResults([]);
    onClose();
  };

  const steps = [
    {
      title: 'Select Files',
      icon: <UploadOutlined />,
    },
    {
      title: 'Review Tags',
      icon: <FileTextOutlined />,
    },
    ...(initialPatientId
      ? []
      : [
          {
            title: 'Select Patient',
            icon: <FileTextOutlined />,
          },
        ]),
    {
      title: 'Upload',
      icon: <UploadOutlined />,
    },
    {
      title: 'Complete',
      icon: <CheckOutlined />,
    },
  ];

  return (
    <Modal
      title="Upload DICOM Files"
      open={visible}
      onCancel={handleClose}
      width={900}
      footer={null}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      {/* Step 0: File Selection */}
      {currentStep === 0 && (
        <div>
          {patientName && (
            <Alert
              message={`Uploading for: ${patientName} (${patientMRN})`}
              type="info"
              style={{ marginBottom: 16 }}
            />
          )}
          <FileDropzone onFilesSelected={handleFilesSelected} />
        </div>
      )}

      {/* Step 1: Tags Preview */}
      {currentStep === 1 && (
        <div>
          <Title level={4}>Review DICOM Tags</Title>
          <DicomTagsPreview dicomFiles={dicomFiles} />
          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => setCurrentStep(0)}>Back</Button>
            <Button type="primary" onClick={handleTagsConfirmed}>
              Continue
            </Button>
          </Space>
        </div>
      )}

      {/* Step 2: Patient Matcher (if no patient pre-selected) */}
      {currentStep === 2 && !initialPatientId && (
        <div>
          <Title level={4}>Match to Patient</Title>
          <PatientMatcher
            suggestedMRN={dicomFiles[0]?.tags?.PatientID}
            onPatientSelected={handlePatientSelected}
          />
          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => setCurrentStep(1)}>Back</Button>
          </Space>
        </div>
      )}

      {/* Step 3: Upload Confirmation */}
      {currentStep === (initialPatientId ? 2 : 3) && (
        <div>
          <Title level={4}>Ready to Upload</Title>
          <Alert
            message={`${files.length} file(s) will be uploaded`}
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Space>
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              icon={<UploadOutlined />}
            >
              Upload Now
            </Button>
          </Space>
        </div>
      )}

      {/* Step 4: Upload Progress & Results */}
      {currentStep === (initialPatientId ? 3 : 4) && (
        <div>
          {uploading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
              <Title level={4} style={{ marginTop: 16 }}>
                Uploading...
              </Title>
            </div>
          ) : (
            <div>
              <Alert
                message="Upload Complete"
                description={`Successfully uploaded ${uploadResults.filter((r) => r.success).length} of ${uploadResults.length} files`}
                type="success"
                style={{ marginBottom: 16 }}
              />
              <UploadProgress results={uploadResults} />
              <Button
                type="primary"
                onClick={handleClose}
                style={{ marginTop: 16 }}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DicomUploadModal;
```

#### File: `frontend/src/components/dicom/FileDropzone.tsx` (150-200 lines)

```tsx
/**
 * File Dropzone Component
 * Phase: 5B (Upload Frontend)
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, Typography, Space } from 'antd';
import { InboxOutlined, FileImageOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Text } = Typography;

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string[];
  maxFiles?: number;
  maxSize?: number; // in MB
}

const DropzoneContainer = styled.div<{ isDragActive: boolean }>`
  border: 2px dashed ${props => (props.isDragActive ? '#1890ff' : '#d9d9d9')};
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  background: ${props => (props.isDragActive ? '#f0f7ff' : '#fafafa')};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #1890ff;
    background: #f0f7ff;
  }
`;

const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  accept = ['.dcm', 'application/dicom'],
  maxFiles = 500,
  maxSize = 100, // 100 MB per file
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        'application/dicom': accept,
      },
      maxFiles,
      maxSize: maxSize * 1024 * 1024,
      multiple: true,
    });

  return (
    <div>
      <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
        <input {...getInputProps()} />
        <Space direction="vertical" size="middle">
          <InboxOutlined style={{ fontSize: 64, color: '#1890ff' }} />
          {isDragActive ? (
            <Title level={4}>Drop DICOM files here...</Title>
          ) : (
            <>
              <Title level={4}>Drag & Drop DICOM Files</Title>
              <Text type="secondary">
                or click to browse (.dcm files)
              </Text>
              <Text type="secondary">
                Max {maxFiles} files, {maxSize}MB per file
              </Text>
            </>
          )}
        </Space>
      </DropzoneContainer>

      {fileRejections.length > 0 && (
        <Card
          style={{ marginTop: 16, borderColor: '#ff4d4f' }}
          size="small"
        >
          <Title level={5} style={{ color: '#ff4d4f' }}>
            Rejected Files:
          </Title>
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              <Text>{file.name}</Text>
              <ul>
                {errors.map((e) => (
                  <li key={e.code}>
                    <Text type="danger">{e.message}</Text>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default FileDropzone;
```

#### File: `frontend/src/components/dicom/DicomTagsPreview.tsx` (200-250 lines)

```tsx
/**
 * DICOM Tags Preview Component
 * Phase: 5B (Upload Frontend)
 */

import React, { useState } from 'react';
import { Table, Tag, Space, Button, Modal, Form, Input } from 'antd';
import { EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DicomFile, DicomTags } from '@/types/dicom';

interface DicomTagsPreviewProps {
  dicomFiles: DicomFile[];
  onTagsModified?: (fileIndex: number, tags: DicomTags) => void;
}

const DicomTagsPreview: React.FC<DicomTagsPreviewProps> = ({
  dicomFiles,
  onTagsModified,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm] = Form.useForm();

  const handleEdit = (index: number, tags: DicomTags) => {
    setEditingIndex(index);
    editForm.setFieldsValue(tags);
  };

  const handleSave = async () => {
    if (editingIndex === null) return;

    try {
      const values = await editForm.validateFields();
      onTagsModified?.(editingIndex, values);
      setEditingIndex(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns: ColumnsType<DicomFile> = [
    {
      title: 'File',
      dataIndex: ['file', 'name'],
      key: 'name',
      width: 200,
      render: (name: string, record: DicomFile) => (
        <Space>
          {record.isValid ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          )}
          {name}
        </Space>
      ),
    },
    {
      title: 'Patient ID',
      dataIndex: ['tags', 'PatientID'],
      key: 'patientId',
      width: 150,
    },
    {
      title: 'Patient Name',
      dataIndex: ['tags', 'PatientName'],
      key: 'patientName',
      width: 180,
    },
    {
      title: 'Study Date',
      dataIndex: ['tags', 'StudyDate'],
      key: 'studyDate',
      width: 120,
    },
    {
      title: 'Modality',
      dataIndex: ['tags', 'Modality'],
      key: 'modality',
      width: 100,
      render: (modality: string) =>
        modality ? <Tag color="blue">{modality}</Tag> : '-',
    },
    {
      title: 'Accession #',
      dataIndex: ['tags', 'AccessionNumber'],
      key: 'accessionNumber',
      width: 150,
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: any, record: DicomFile) =>
        record.isValid ? (
          <Tag color="success">Valid</Tag>
        ) : (
          <Tag color="error">Invalid</Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: DicomFile, index: number) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(index, record.tags)}
          disabled={!record.isValid}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={dicomFiles}
        rowKey={(record) => record.file.name}
        pagination={false}
        scroll={{ y: 400 }}
      />

      {/* Edit Tags Modal */}
      <Modal
        title="Edit DICOM Tags"
        open={editingIndex !== null}
        onOk={handleSave}
        onCancel={() => setEditingIndex(null)}
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="PatientID" label="Patient ID">
            <Input placeholder="Enter Patient ID (MRN)" />
          </Form.Item>
          <Form.Item name="PatientName" label="Patient Name">
            <Input placeholder="Format: LAST^FIRST" />
          </Form.Item>
          <Form.Item name="PatientBirthDate" label="Birth Date">
            <Input placeholder="YYYYMMDD" />
          </Form.Item>
          <Form.Item name="PatientSex" label="Gender">
            <Input placeholder="M / F / O" maxLength={1} />
          </Form.Item>
          <Form.Item name="AccessionNumber" label="Accession Number">
            <Input placeholder="Order accession number" />
          </Form.Item>
          <Form.Item name="StudyDate" label="Study Date">
            <Input placeholder="YYYYMMDD" />
          </Form.Item>
          <Form.Item name="StudyDescription" label="Study Description">
            <Input placeholder="Description" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DicomTagsPreview;
```

#### File: `frontend/src/components/dicom/PatientMatcher.tsx` (150-200 lines)

```tsx
/**
 * Patient Matcher Component
 * Phase: 5B (Upload Frontend)
 */

import React, { useState, useEffect } from 'react';
import { Card, AutoComplete, Button, Space, Alert, Typography } from 'antd';
import { SearchOutlined, CheckOutlined } from '@ant-design/icons';
import { useSearchPatients } from '@/hooks/usePatients';
import type { Patient } from '@/types/patient';

const { Title, Text } = Typography;

interface PatientMatcherProps {
  suggestedMRN?: string;
  onPatientSelected: (patientId: string) => void;
}

const PatientMatcher: React.FC<PatientMatcherProps> = ({
  suggestedMRN,
  onPatientSelected,
}) => {
  const [searchText, setSearchText] = useState(suggestedMRN || '');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);

  const { data: patients, refetch } = useSearchPatients(searchText);

  useEffect(() => {
    if (patients) {
      setOptions(
        patients.map((p) => ({
          value: p.id,
          label: `${p.full_name} (${p.mrn}) - ${p.gender}, ${calculateAge(p.date_of_birth)}y`,
        }))
      );

      // Auto-match if MRN exactly matches
      if (suggestedMRN) {
        const match = patients.find((p) => p.mrn === suggestedMRN);
        if (match) {
          setSelectedPatient(match);
        }
      }
    }
  }, [patients, suggestedMRN]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value.length >= 3) {
      refetch();
    }
  };

  const handleSelect = (value: string) => {
    const patient = patients?.find((p) => p.id === value);
    if (patient) {
      setSelectedPatient(patient);
    }
  };

  const handleConfirm = () => {
    if (selectedPatient) {
      onPatientSelected(selectedPatient.id);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card>
      {suggestedMRN && (
        <Alert
          message={`DICOM PatientID: ${suggestedMRN}`}
          description="Search for matching patient in EHR system"
          type="info"
          style={{ marginBottom: 16 }}
        />
      )}

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={5}>Search Patient</Title>
          <AutoComplete
            style={{ width: '100%' }}
            options={options}
            onSearch={handleSearch}
            onSelect={handleSelect}
            placeholder="Search by name or MRN..."
            size="large"
            prefix={<SearchOutlined />}
          />
        </div>

        {selectedPatient && (
          <Card size="small" style={{ background: '#f0f7ff' }}>
            <Space direction="vertical">
              <Title level={5} style={{ margin: 0 }}>
                Selected Patient:
              </Title>
              <Text strong>{selectedPatient.full_name}</Text>
              <Text>MRN: {selectedPatient.mrn}</Text>
              <Text>
                {selectedPatient.gender},{' '}
                {calculateAge(selectedPatient.date_of_birth)}y
              </Text>
              <Text>DOB: {selectedPatient.date_of_birth}</Text>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleConfirm}
                size="large"
              >
                Confirm Patient
              </Button>
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default PatientMatcher;
```

#### File: `frontend/src/components/dicom/UploadProgress.tsx` (100-150 lines)

```tsx
/**
 * Upload Progress Component
 * Phase: 5B (Upload Frontend)
 */

import React from 'react';
import { Card, Progress, List, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { DicomUploadResponse } from '@/types/dicom';

const { Text } = Typography;

interface UploadProgressProps {
  results: DicomUploadResponse[];
}

const UploadProgress: React.FC<UploadProgressProps> = ({ results }) => {
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;
  const percentage = Math.round((successCount / results.length) * 100);

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Progress
          percent={percentage}
          status={failureCount > 0 ? 'exception' : 'success'}
          strokeColor={failureCount > 0 ? '#ff4d4f' : '#52c41a'}
        />
        <div style={{ marginTop: 8 }}>
          <Text>
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> {successCount}{' '}
            succeeded
          </Text>
          {failureCount > 0 && (
            <Text style={{ marginLeft: 16 }}>
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />{' '}
              {failureCount} failed
            </Text>
          )}
        </div>
      </Card>

      <List
        size="small"
        bordered
        dataSource={results}
        renderItem={(result, index) => (
          <List.Item>
            <Space>
              {result.success ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
              )}
              <Text>{result.message || `File ${index + 1}`}</Text>
              {result.studyUid && (
                <Tag color="blue">{result.studyUid.substring(0, 20)}...</Tag>
              )}
            </Space>
          </List.Item>
        )}
      />
    </div>
  );
};

export default UploadProgress;
```

---

### 5. Integration with Order Detail

#### File: `frontend/src/pages/orders/OrderDetail.tsx` (add upload button)

```tsx
// Add to OrderDetail component

import DicomUploadModal from '@/components/dicom/DicomUploadModal';

// Inside component:
const [uploadModalVisible, setUploadModalVisible] = useState(false);

// Add button in order detail actions:
{order.order_type === 'IMAGING' && (
  <Button
    icon={<UploadOutlined />}
    onClick={() => setUploadModalVisible(true)}
  >
    Upload Images
  </Button>
)}

// Add modal at bottom:
<DicomUploadModal
  visible={uploadModalVisible}
  onClose={() => setUploadModalVisible(false)}
  patientId={order.patient.id}
  orderId={order.id}
  patientName={order.patient.full_name}
  patientMRN={order.patient.mrn}
/>
```

---

## Verification Checklist

- [ ] react-dropzone installed
- [ ] File dropzone accepts .dcm files
- [ ] DICOM tags read successfully
- [ ] Tags display in preview table
- [ ] Tag editing modal works
- [ ] Patient matcher auto-suggests by MRN
- [ ] Multiple files upload
- [ ] Upload progress displays
- [ ] Success/error messages shown
- [ ] Upload button in order detail
- [ ] Modal closes after upload

---

## Testing Scenarios

```bash
# 1. Download test DICOM files
wget https://www.dicomserver.co.uk/DICOM/DICOM_sample.zip
unzip DICOM_sample.zip -d test-dicom

# 2. Test single file upload
# - Open order detail
# - Click "Upload Images"
# - Drag single .dcm file
# - Verify tags display
# - Click upload

# 3. Test multiple file upload
# - Select multiple .dcm files
# - Verify all tags read
# - Upload batch

# 4. Test patient matching
# - Upload DICOM without pre-selected patient
# - Search for patient
# - Confirm match

# 5. Test error handling
# - Upload non-DICOM file (should reject)
# - Upload file > 100MB (should reject)
```

---

## Next Phase

Once Phase 5B is complete:
→ **Phase 5C: OHIF Viewer Integration** - Embed viewer and launch from orders

---

**Status:** Ready to implement  
**Estimated Completion:** 7-9 days
