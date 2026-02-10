/**
 * DICOM Viewer Component
 * ======================
 * 
 * Embeds OHIF Viewer in an iframe with fullscreen support.
 * Loads studies by UID, order, or patient.
 * 
 * Module: frontend/src/components/dicom/DicomViewer.tsx
 * Phase: 5C (Viewer Integration)
 */

import React, { useEffect, useState } from 'react';
import { Spin, Alert, Button, Space, Typography } from 'antd';
import { 
  FullscreenOutlined, 
  FullscreenExitOutlined,
  CloseOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import styled from 'styled-components';
import { 
  getViewerUrlByStudyUid, 
  getViewerUrlByOrderId, 
  getViewerUrlByPatientId,
  getComparisonViewerUrl 
} from '@/services/dicomService';

const { Text } = Typography;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ViewerContainer = styled.div<{ $fullscreen: boolean }>`
  position: ${props => (props.$fullscreen ? 'fixed' : 'relative')};
  top: ${props => (props.$fullscreen ? '0' : 'auto')};
  left: ${props => (props.$fullscreen ? '0' : 'auto')};
  right: ${props => (props.$fullscreen ? '0' : 'auto')};
  bottom: ${props => (props.$fullscreen ? '0' : 'auto')};
  width: ${props => (props.$fullscreen ? '100vw' : '100%')};
  height: ${props => (props.$fullscreen ? '100vh' : '700px')};
  z-index: ${props => (props.$fullscreen ? '9999' : 'auto')};
  background: #000;
  display: flex;
  flex-direction: column;
`;

const ViewerIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  flex: 1;
`;

const ControlsBar = styled.div<{ $fullscreen: boolean }>`
  position: ${props => (props.$fullscreen ? 'absolute' : 'relative')};
  top: ${props => (props.$fullscreen ? '10px' : '0')};
  right: ${props => (props.$fullscreen ? '10px' : '0')};
  z-index: 10000;
  background: ${props => (props.$fullscreen ? 'rgba(0, 0, 0, 0.7)' : '#fff')};
  padding: 8px;
  border-radius: 4px;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
`;

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface DicomViewerProps {
  /** Single study UID */
  studyUid?: string;
  
  /** Multiple study UIDs for comparison */
  studyUids?: string[];
  
  /** Order ID to load study from */
  orderId?: string;
  
  /** Patient ID to load all studies from */
  patientId?: string;
  
  /** Start in fullscreen mode */
  autoFullscreen?: boolean;
  
  /** Show controls bar */
  showControls?: boolean;
  
  /** Callback when viewer is closed */
  onClose?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const DicomViewer: React.FC<DicomViewerProps> = ({
  studyUid,
  studyUids,
  orderId,
  patientId,
  autoFullscreen = false,
  showControls = true,
  onClose,
}) => {
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [fullscreen, setFullscreen] = useState(autoFullscreen);

  useEffect(() => {
    loadViewerUrl();
  }, [studyUid, studyUids, orderId, patientId]);

  const loadViewerUrl = async () => {
    setLoading(true);
    setError('');

    try {
      let url: string;

      // Priority: studyUids > studyUid > orderId > patientId
      if (studyUids && studyUids.length > 0) {
        url = await getComparisonViewerUrl(studyUids);
      } else if (studyUid) {
        url = await getViewerUrlByStudyUid(studyUid);
      } else if (orderId) {
        url = await getViewerUrlByOrderId(orderId);
      } else if (patientId) {
        url = await getViewerUrlByPatientId(patientId);
      } else {
        throw new Error('No study, order, or patient ID provided');
      }

      setViewerUrl(url);
    } catch (err: any) {
      console.error('Failed to load viewer URL:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load viewer');
    } finally {
      setLoading(false);
    }
  };

  const handleReload = () => {
    loadViewerUrl();
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Render loading state
  if (loading) {
    return (
      <ViewerContainer $fullscreen={fullscreen}>
        {showControls && (
          <ControlsBar $fullscreen={fullscreen}>
            {onClose && (
              <Button
                icon={<CloseOutlined />}
                onClick={handleClose}
                type={fullscreen ? 'primary' : 'default'}
              >
                Close
              </Button>
            )}
          </ControlsBar>
        )}
        <LoadingContainer>
          <Spin size="large" />
          <Text style={{ color: '#fff' }}>Loading DICOM viewer...</Text>
        </LoadingContainer>
      </ViewerContainer>
    );
  }

  // Render error state
  if (error) {
    return (
      <ViewerContainer $fullscreen={fullscreen}>
        {showControls && (
          <ControlsBar $fullscreen={fullscreen}>
            <Button icon={<ReloadOutlined />} onClick={handleReload}>
              Retry
            </Button>
            {onClose && (
              <Button icon={<CloseOutlined />} onClick={handleClose}>
                Close
              </Button>
            )}
          </ControlsBar>
        )}
        <LoadingContainer>
          <Alert
            message="Failed to Load Viewer"
            description={error}
            type="error"
            showIcon
            style={{ maxWidth: 500 }}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleReload}>
            Retry
          </Button>
        </LoadingContainer>
      </ViewerContainer>
    );
  }

  // Render viewer
  return (
    <ViewerContainer $fullscreen={fullscreen}>
      {showControls && (
        <ControlsBar $fullscreen={fullscreen}>
          <Space>
            <Button
              icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              type={fullscreen ? 'primary' : 'default'}
            >
              {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReload}>
              Reload
            </Button>
            {onClose && (
              <Button
                icon={<CloseOutlined />}
                onClick={handleClose}
                danger={!fullscreen}
              >
                Close
              </Button>
            )}
          </Space>
        </ControlsBar>
      )}
      <ViewerIframe
        src={viewerUrl}
        title="DICOM Viewer"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </ViewerContainer>
  );
};

export default DicomViewer;
