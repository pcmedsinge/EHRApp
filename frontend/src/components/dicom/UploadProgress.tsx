/**
 * UploadProgress Component
 * ========================
 * 
 * Displays real-time upload progress for DICOM files.
 * Shows per-file status and overall statistics.
 * 
 * Module: frontend/src/components/dicom/UploadProgress.tsx
 * Phase: 5B (Upload Frontend)
 */

import React from 'react';
import { Progress, List, Space, Typography, Tag, Card, Statistic, Row, Col } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  LoadingOutlined,
  FileImageOutlined 
} from '@ant-design/icons';
import styled from 'styled-components';
import type { UploadProgress as UploadProgressType } from '@/types/dicom';

const { Text, Title } = Typography;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ProgressContainer = styled.div`
  width: 100%;
`;

const FileProgressItem = styled(List.Item)<{ status: string }>`
  background: ${props => {
    switch (props.status) {
      case 'completed': return '#f6ffed';
      case 'error': return '#fff2f0';
      case 'uploading': return '#e6f7ff';
      default: return '#fafafa';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'completed': return '#b7eb8f';
      case 'error': return '#ffccc7';
      case 'uploading': return '#91d5ff';
      default: return '#d9d9d9';
    }
  }};
  border-radius: 4px;
  margin-bottom: 8px;
  padding: 12px !important;
`;

const StatusIcon = styled.div<{ status: string }>`
  font-size: 24px;
  color: ${props => {
    switch (props.status) {
      case 'completed': return '#52c41a';
      case 'error': return '#ff4d4f';
      case 'uploading': return '#1890ff';
      default: return '#8c8c8c';
    }
  }};
`;

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface UploadProgressProps {
  progress: UploadProgressType[];
  overallProgress: number;
  onRetryFailed?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  overallProgress,
  onRetryFailed,
}) => {
  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = progress.length;
    const completed = progress.filter(p => p.status === 'completed').length;
    const uploading = progress.filter(p => p.status === 'uploading').length;
    const pending = progress.filter(p => p.status === 'pending').length;
    const failed = progress.filter(p => p.status === 'error').length;
    
    return { total, completed, uploading, pending, failed };
  }, [progress]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined />;
      case 'error':
        return <CloseCircleOutlined />;
      case 'uploading':
        return <LoadingOutlined />;
      default:
        return <FileImageOutlined />;
    }
  };

  // Get status tag
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag color="success">Completed</Tag>;
      case 'error':
        return <Tag color="error">Failed</Tag>;
      case 'uploading':
        return <Tag color="processing">Uploading</Tag>;
      default:
        return <Tag color="default">Pending</Tag>;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <ProgressContainer>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Overall Progress */}
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Title level={4}>Overall Progress</Title>
            <Progress
              percent={Math.round(overallProgress)}
              status={stats.failed > 0 ? 'exception' : stats.completed === stats.total && stats.total > 0 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            
            {/* Statistics */}
            <Row gutter={16}>
              <Col span={6}>
                <Statistic 
                  title="Total Files" 
                  value={stats.total}
                  prefix={<FileImageOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Completed" 
                  value={stats.completed}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Uploading" 
                  value={stats.uploading}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<LoadingOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Failed" 
                  value={stats.failed}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
            </Row>
          </Space>
        </Card>

        {/* File List */}
        <Card title="File Upload Status">
          <List
            dataSource={progress}
            locale={{ emptyText: 'No files to upload' }}
            renderItem={(item) => (
              <FileProgressItem status={item.status}>
                <List.Item.Meta
                  avatar={
                    <StatusIcon status={item.status}>
                      {getStatusIcon(item.status)}
                    </StatusIcon>
                  }
                  title={
                    <Space>
                      <Text strong>{item.fileName}</Text>
                      {getStatusTag(item.status)}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text type="secondary">
                        Size: {formatFileSize(item.totalBytes)}
                      </Text>
                      
                      {item.status === 'uploading' && (
                        <>
                          <Progress
                            percent={item.progress}
                            size="small"
                            status="active"
                          />
                          <Text type="secondary">
                            {formatFileSize(item.uploadedBytes)} / {formatFileSize(item.totalBytes)}
                          </Text>
                        </>
                      )}
                      
                      {item.status === 'error' && item.error && (
                        <Text type="danger">{item.error}</Text>
                      )}
                      
                      {item.status === 'completed' && item.studyInstanceUid && (
                        <Text type="success">
                          Study UID: {item.studyInstanceUid}
                        </Text>
                      )}
                    </Space>
                  }
                />
              </FileProgressItem>
            )}
          />
        </Card>

        {/* Summary Message */}
        {stats.total > 0 && (
          <Card>
            {stats.completed === stats.total ? (
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                <div>
                  <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
                    Upload Complete!
                  </Title>
                  <Text type="secondary">
                    Successfully uploaded {stats.completed} file{stats.completed !== 1 ? 's' : ''}
                  </Text>
                </div>
              </Space>
            ) : stats.failed > 0 && stats.uploading === 0 && stats.pending === 0 ? (
              <Space>
                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
                <div>
                  <Title level={5} style={{ margin: 0, color: '#ff4d4f' }}>
                    Upload Failed
                  </Title>
                  <Text type="secondary">
                    {stats.failed} file{stats.failed !== 1 ? 's' : ''} failed to upload
                  </Text>
                </div>
              </Space>
            ) : (
              <Space>
                <LoadingOutlined style={{ color: '#1890ff', fontSize: 24 }} />
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    Uploading...
                  </Title>
                  <Text type="secondary">
                    {stats.completed} of {stats.total} files completed
                  </Text>
                </div>
              </Space>
            )}
          </Card>
        )}
      </Space>
    </ProgressContainer>
  );
};

export default UploadProgress;
