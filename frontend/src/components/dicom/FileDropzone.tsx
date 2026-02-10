/**
 * FileDropzone Component
 * ======================
 * 
 * Drag-and-drop zone for DICOM file uploads.
 * Validates file types and sizes before accepting.
 * 
 * Module: frontend/src/components/dicom/FileDropzone.tsx
 * Phase: 5B (Upload Frontend)
 */

import React, { useCallback, useMemo } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { InboxOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Typography, Alert, Space } from 'antd';
import styled from 'styled-components';
import type { DicomFile } from '@/types/dicom';

const { Title, Text } = Typography;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const DropzoneContainer = styled.div<{ isDragActive: boolean; isDragReject: boolean }>`
  border: 2px dashed ${props => 
    props.isDragReject ? '#ff4d4f' : 
    props.isDragActive ? '#1890ff' : 
    '#d9d9d9'};
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background-color: ${props => 
    props.isDragReject ? '#fff2f0' : 
    props.isDragActive ? '#e6f7ff' : 
    '#fafafa'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.isDragReject ? '#ff4d4f' : '#40a9ff'};
    background-color: ${props => props.isDragReject ? '#fff2f0' : '#e6f7ff'};
  }
`;

const IconWrapper = styled.div`
  font-size: 48px;
  color: ${props => props.theme === 'error' ? '#ff4d4f' : '#1890ff'};
  margin-bottom: 16px;
`;

const FileList = styled.div`
  margin-top: 20px;
  max-height: 300px;
  overflow-y: auto;
`;

const FileItem = styled.div<{ isValid: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  background: ${props => props.isValid ? '#f6ffed' : '#fff2f0'};
  border: 1px solid ${props => props.isValid ? '#b7eb8f' : '#ffccc7'};
  border-radius: 4px;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FileDetails = styled.div`
  text-align: left;
`;

const FileName = styled.div`
  font-weight: 500;
  color: #262626;
`;

const FileSize = styled.div`
  font-size: 12px;
  color: #8c8c8c;
`;

const FileStatus = styled.div<{ isValid: boolean }>`
  color: ${props => props.isValid ? '#52c41a' : '#ff4d4f'};
  font-size: 20px;
`;

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface FileDropzoneProps {
  files: DicomFile[];
  onFilesSelected: (files: DicomFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const FileDropzone: React.FC<FileDropzoneProps> = ({
  files,
  onFilesSelected,
  maxFiles = 500,
  maxSizeMB = 100,
  disabled = false,
}) => {
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // File validation
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file extension
    const validExtensions = ['.dcm', '.dicom', '.DCM', '.DICOM'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext.toLowerCase()));
    
    if (!hasValidExtension) {
      // Also allow files without extension (some DICOM files don't have extensions)
      // Will be validated on backend
      console.warn(`File ${file.name} doesn't have .dcm extension, but will be validated on backend`);
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    return { isValid: true };
  }, [maxSizeMB]);

  // Handle files dropped/selected
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Check max files limit
    if (files.length + acceptedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate and create DicomFile objects
    const newFiles: DicomFile[] = acceptedFiles.map(file => {
      const validation = validateFile(file);
      return {
        file,
        isValid: validation.isValid,
        error: validation.error,
      };
    });

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejectedDicomFiles: DicomFile[] = rejectedFiles.map(({ file, errors }) => ({
        file,
        isValid: false,
        error: errors.map(e => e.message).join(', '),
      }));
      onFilesSelected([...files, ...newFiles, ...rejectedDicomFiles]);
    } else {
      onFilesSelected([...files, ...newFiles]);
    }
  }, [files, maxFiles, validateFile, onFilesSelected]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/dicom': ['.dcm', '.dicom'],
      'application/octet-stream': ['.dcm', '.dicom'],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled,
    multiple: true,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const validFiles = files.filter(f => f.isValid);
    const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
    return {
      total: files.length,
      valid: validFiles.length,
      invalid: files.length - validFiles.length,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  }, [files]);

  // Remove file
  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesSelected(newFiles);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Dropzone */}
      <DropzoneContainer
        {...getRootProps()}
        isDragActive={isDragActive}
        isDragReject={isDragReject}
      >
        <input {...getInputProps()} />
        
        <IconWrapper theme={isDragReject ? 'error' : 'primary'}>
          <InboxOutlined />
        </IconWrapper>

        {isDragActive ? (
          isDragReject ? (
            <>
              <Title level={4} style={{ color: '#ff4d4f' }}>
                Invalid file type
              </Title>
              <Text type="secondary">
                Only DICOM files (.dcm) are accepted
              </Text>
            </>
          ) : (
            <>
              <Title level={4} style={{ color: '#1890ff' }}>
                Drop files here
              </Title>
              <Text type="secondary">
                Release to upload DICOM files
              </Text>
            </>
          )
        ) : (
          <>
            <Title level={4}>
              Drag & drop DICOM files here
            </Title>
            <Text type="secondary">
              or click to browse files
            </Text>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Accepted: .dcm files • Max {maxSizeMB}MB per file • Up to {maxFiles} files
              </Text>
            </div>
          </>
        )}
      </DropzoneContainer>

      {/* File Statistics */}
      {files.length > 0 && (
        <Alert
          message={`${stats.total} files selected (${stats.totalSizeMB} MB)`}
          description={
            stats.invalid > 0 
              ? `${stats.valid} valid, ${stats.invalid} invalid - Please remove invalid files before uploading`
              : `All files are valid and ready to upload`
          }
          type={stats.invalid > 0 ? 'warning' : 'success'}
          showIcon
        />
      )}

      {/* File List */}
      {files.length > 0 && (
        <FileList>
          {files.map((dicomFile, index) => (
            <FileItem key={index} isValid={dicomFile.isValid !== false}>
              <FileInfo>
                <FileStatus isValid={dicomFile.isValid !== false}>
                  {dicomFile.isValid !== false ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                </FileStatus>
                <FileDetails>
                  <FileName>{dicomFile.file.name}</FileName>
                  <FileSize>
                    {formatFileSize(dicomFile.file.size)}
                    {dicomFile.error && ` • ${dicomFile.error}`}
                  </FileSize>
                </FileDetails>
              </FileInfo>
              <CloseCircleOutlined
                style={{ cursor: 'pointer', color: '#ff4d4f' }}
                onClick={() => handleRemoveFile(index)}
              />
            </FileItem>
          ))}
        </FileList>
      )}
    </Space>
  );
};

export default FileDropzone;
