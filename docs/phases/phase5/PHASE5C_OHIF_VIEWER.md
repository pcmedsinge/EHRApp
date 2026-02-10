# Phase 5C: OHIF Viewer Integration (6-8 days)

**Status:** 🟡 Not Started  
**Dependencies:** Phase 5B Complete ✅, OHIF Running  
**Estimated Time:** 6-8 days

---

## Objectives

Integrate OHIF Viewer for web-based DICOM image viewing. Enable launching viewer from orders, patient imaging history, and support study comparison.

---

## Deliverables

### 1. OHIF Configuration

#### File: `config/ohif-config.js` (100-150 lines)

```javascript
/**
 * OHIF Viewer Configuration
 * Phase: 5C (Viewer Integration)
 */

window.config = {
  routerBasename: '/',
  showStudyList: true,
  maxNumberOfWebWorkers: 3,
  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: false,
  strictZSpacingForVolumeViewport: true,

  // Data Sources
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'EHR Orthanc PACS',
        name: 'Orthanc',
        wadoUriRoot: 'http://localhost:8042/wado',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: false,
        staticWado: true,
        singlepart: 'bulkdata,video,pdf',
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
        },
      },
    },
  ],

  // Default Data Source
  defaultDataSourceName: 'dicomweb',

  // Hot Keys
  hotkeys: [
    {
      commandName: 'incrementActiveViewport',
      label: 'Next Viewport',
      keys: ['right'],
    },
    {
      commandName: 'decrementActiveViewport',
      label: 'Previous Viewport',
      keys: ['left'],
    },
    {
      commandName: 'rotateViewportCW',
      label: 'Rotate Right',
      keys: ['r'],
    },
    {
      commandName: 'rotateViewportCCW',
      label: 'Rotate Left',
      keys: ['l'],
    },
    {
      commandName: 'invertViewport',
      label: 'Invert',
      keys: ['i'],
    },
    {
      commandName: 'flipViewportHorizontal',
      label: 'Flip Horizontal',
      keys: ['h'],
    },
    {
      commandName: 'flipViewportVertical',
      label: 'Flip Vertical',
      keys: ['v'],
    },
    {
      commandName: 'scaleUpViewport',
      label: 'Zoom In',
      keys: ['+'],
    },
    {
      commandName: 'scaleDownViewport',
      label: 'Zoom Out',
      keys: ['-'],
    },
    {
      commandName: 'fitViewportToWindow',
      label: 'Zoom to Fit',
      keys: ['='],
    },
    {
      commandName: 'resetViewport',
      label: 'Reset',
      keys: ['space'],
    },
    {
      commandName: 'nextImage',
      label: 'Next Image',
      keys: ['down'],
    },
    {
      commandName: 'previousImage',
      label: 'Previous Image',
      keys: ['up'],
    },
  ],

  // Study Prefetching
  studyPrefetcher: {
    enabled: true,
    displayProgress: true,
    order: 'closest',
    maxNumPrefetched: 2,
  },
};
```

---

### 2. Backend Viewer Endpoints

#### File: `backend/app/api/v1/dicom/viewer_router.py` (150-200 lines)

```python
"""
DICOM Viewer API Router
Phase: 5C (Viewer Integration)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from uuid import UUID

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.order import Order
from app.services.orthanc_service import orthanc_service
from app.core.config import settings

router = APIRouter(prefix="/dicom/viewer", tags=["dicom-viewer"])


@router.get("/url/{study_uid}")
async def get_viewer_url(
    study_uid: str,
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Get OHIF Viewer URL for a study
    
    Returns URL to launch OHIF Viewer with study
    """
    # Verify study exists in Orthanc
    study = await orthanc_service.get_study(study_uid)
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found in PACS"
        )
    
    # Build OHIF Viewer URL
    viewer_base = settings.OHIF_VIEWER_URL
    viewer_url = f"{viewer_base}/viewer?StudyInstanceUIDs={study_uid}"
    
    return {
        "url": viewer_url,
        "study_uid": study_uid,
        "study": study
    }


@router.get("/url/order/{order_id}")
async def get_viewer_url_for_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Get OHIF Viewer URL for an order's study
    
    - Fetches order
    - Gets study UID
    - Returns viewer URL
    """
    # Get order
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if order has study
    if not order.study_instance_uid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No DICOM study uploaded for this order"
        )
    
    # Build viewer URL
    viewer_base = settings.OHIF_VIEWER_URL
    viewer_url = f"{viewer_base}/viewer?StudyInstanceUIDs={order.study_instance_uid}"
    
    return {
        "url": viewer_url,
        "study_uid": order.study_instance_uid,
        "order_id": str(order_id)
    }


@router.get("/url/patient/{patient_id}")
async def get_viewer_url_for_patient_studies(
    patient_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Get OHIF Viewer URL for all patient studies
    
    - Fetches patient
    - Gets all study UIDs
    - Returns viewer URL with multiple studies
    """
    from app.models.patient import Patient
    
    # Get patient
    patient = await db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Get all studies for patient from Orthanc
    studies = await orthanc_service.query_patient_studies(patient.mrn)
    
    if not studies:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No studies found for patient"
        )
    
    # Extract study UIDs
    study_uids = [
        s.get("MainDicomTags", {}).get("StudyInstanceUID")
        for s in studies
        if s.get("MainDicomTags", {}).get("StudyInstanceUID")
    ]
    
    if not study_uids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid study UIDs found"
        )
    
    # Build viewer URL with multiple studies
    viewer_base = settings.OHIF_VIEWER_URL
    study_params = ",".join(study_uids)
    viewer_url = f"{viewer_base}/viewer?StudyInstanceUIDs={study_params}"
    
    return {
        "url": viewer_url,
        "study_uids": study_uids,
        "study_count": len(study_uids),
        "patient_id": str(patient_id)
    }


@router.get("/compare")
async def get_comparison_viewer_url(
    study_uids: str,  # Comma-separated study UIDs
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Get OHIF Viewer URL for comparing multiple studies
    
    Query param: ?study_uids=uid1,uid2,uid3
    """
    uid_list = [uid.strip() for uid in study_uids.split(",")]
    
    if len(uid_list) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 studies required for comparison"
        )
    
    # Verify all studies exist
    for uid in uid_list:
        study = await orthanc_service.get_study(uid)
        if not study:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Study {uid} not found"
            )
    
    # Build comparison URL
    viewer_base = settings.OHIF_VIEWER_URL
    study_params = ",".join(uid_list)
    viewer_url = f"{viewer_base}/viewer?StudyInstanceUIDs={study_params}"
    
    return {
        "url": viewer_url,
        "study_uids": uid_list,
        "study_count": len(uid_list)
    }
```

---

### 3. Frontend Viewer Components

#### File: `frontend/src/components/dicom/DicomViewer.tsx` (200-250 lines)

```tsx
/**
 * DICOM Viewer Component (OHIF Iframe Wrapper)
 * Phase: 5C (Viewer Integration)
 */

import React, { useEffect, useState } from 'react';
import { Spin, Alert, Button, Space } from 'antd';
import { FullscreenOutlined, CloseOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { getViewerUrl } from '@/services/dicomService';

const ViewerContainer = styled.div<{ fullscreen: boolean }>`
  position: ${props => (props.fullscreen ? 'fixed' : 'relative')};
  top: ${props => (props.fullscreen ? '0' : 'auto')};
  left: ${props => (props.fullscreen ? '0' : 'auto')};
  right: ${props => (props.fullscreen ? '0' : 'auto')};
  bottom: ${props => (props.fullscreen ? '0' : 'auto')};
  width: ${props => (props.fullscreen ? '100vw' : '100%')};
  height: ${props => (props.fullscreen ? '100vh' : '600px')};
  z-index: ${props => (props.fullscreen ? '9999' : 'auto')};
  background: #000;
`;

const ViewerIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

const ControlsOverlay = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10000;
`;

interface DicomViewerProps {
  studyUid?: string;
  studyUids?: string[];
  orderId?: string;
  patientId?: string;
  autoFullscreen?: boolean;
  onClose?: () => void;
}

const DicomViewer: React.FC<DicomViewerProps> = ({
  studyUid,
  studyUids,
  orderId,
  patientId,
  autoFullscreen = false,
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

      if (studyUid) {
        // Single study
        url = await getViewerUrl(studyUid);
      } else if (studyUids && studyUids.length > 0) {
        // Multiple studies
        const uidsParam = studyUids.join(',');
        const response = await fetch(
          `/api/v1/dicom/viewer/compare?study_uids=${uidsParam}`
        );
        const data = await response.json();
        url = data.url;
      } else if (orderId) {
        // Order's study
        const response = await fetch(`/api/v1/dicom/viewer/url/order/${orderId}`);
        const data = await response.json();
        url = data.url;
      } else if (patientId) {
        // Patient's studies
        const response = await fetch(
          `/api/v1/dicom/viewer/url/patient/${patientId}`
        );
        const data = await response.json();
        url = data.url;
      } else {
        throw new Error('No study UID, order ID, or patient ID provided');
      }

      setViewerUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to load viewer');
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const handleClose = () => {
    setFullscreen(false);
    onClose?.();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" tip="Loading DICOM Viewer..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Viewer Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={loadViewerUrl}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <ViewerContainer fullscreen={fullscreen}>
      {fullscreen && (
        <ControlsOverlay>
          <Space>
            <Button
              icon={<CloseOutlined />}
              onClick={handleClose}
              size="large"
            >
              Exit Fullscreen
            </Button>
          </Space>
        </ControlsOverlay>
      )}

      {!fullscreen && (
        <ControlsOverlay>
          <Button
            icon={<FullscreenOutlined />}
            onClick={toggleFullscreen}
            type="primary"
          >
            Fullscreen
          </Button>
        </ControlsOverlay>
      )}

      <ViewerIframe
        src={viewerUrl}
        title="DICOM Viewer"
        allow="fullscreen"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </ViewerContainer>
  );
};

export default DicomViewer;
```

#### File: `frontend/src/components/dicom/StudyList.tsx` (250-300 lines)

```tsx
/**
 * Study List Component
 * Phase: 5C (Viewer Integration)
 */

import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Checkbox,
  Typography,
  Card,
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  CompareOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import DicomViewer from './DicomViewer';
import { usePatientStudies, useDeleteStudy } from '@/hooks/useDicom';
import type { DicomStudy } from '@/types/dicom';

const { Title, Text } = Typography;

interface StudyListProps {
  patientId: string;
  patientName: string;
}

const StudyList: React.FC<StudyListProps> = ({ patientId, patientName }) => {
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewingStudyUid, setViewingStudyUid] = useState<string | undefined>();
  const [compareModeEnabled, setCompareModeEnabled] = useState(false);

  const { data: studies, isLoading } = usePatientStudies(patientId);
  const deleteStudy = useDeleteStudy();

  const handleView = (studyUid: string) => {
    setViewingStudyUid(studyUid);
    setViewerVisible(true);
  };

  const handleCompare = () => {
    if (selectedStudies.length < 2) {
      Modal.warning({
        title: 'Select Studies',
        content: 'Please select at least 2 studies to compare',
      });
      return;
    }

    setViewingStudyUid(undefined);
    setViewerVisible(true);
  };

  const handleDelete = (studyUid: string) => {
    Modal.confirm({
      title: 'Delete Study',
      content: 'Are you sure you want to delete this study? This cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteStudy.mutateAsync({
          studyUid,
          reason: 'User requested deletion',
        });
      },
    });
  };

  const handleSelectionChange = (studyUid: string, checked: boolean) => {
    if (checked) {
      setSelectedStudies([...selectedStudies, studyUid]);
    } else {
      setSelectedStudies(selectedStudies.filter((uid) => uid !== studyUid));
    }
  };

  const columns: ColumnsType<DicomStudy> = [
    ...(compareModeEnabled
      ? [
          {
            title: 'Select',
            key: 'select',
            width: 60,
            render: (_: any, record: DicomStudy) => (
              <Checkbox
                checked={selectedStudies.includes(record.StudyInstanceUID)}
                onChange={(e) =>
                  handleSelectionChange(
                    record.StudyInstanceUID,
                    e.target.checked
                  )
                }
              />
            ),
          },
        ]
      : []),
    {
      title: 'Study Date',
      dataIndex: 'StudyDate',
      key: 'date',
      width: 120,
      render: (date: string) =>
        date ? dayjs(date, 'YYYYMMDD').format('MMM DD, YYYY') : '-',
      sorter: (a, b) => (a.StudyDate || '').localeCompare(b.StudyDate || ''),
    },
    {
      title: 'Modality',
      dataIndex: 'Modality',
      key: 'modality',
      width: 100,
      render: (modality: string) =>
        modality ? <Tag color="blue">{modality}</Tag> : '-',
    },
    {
      title: 'Description',
      dataIndex: 'StudyDescription',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Accession #',
      dataIndex: 'AccessionNumber',
      key: 'accession',
      width: 150,
    },
    {
      title: 'Series',
      dataIndex: 'NumberOfSeries',
      key: 'series',
      width: 80,
      align: 'center',
    },
    {
      title: 'Images',
      dataIndex: 'NumberOfInstances',
      key: 'instances',
      width: 80,
      align: 'center',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: DicomStudy) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.StudyInstanceUID)}
          >
            View
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.StudyInstanceUID)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space
        direction="vertical"
        style={{ width: '100%' }}
        size="middle"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Title level={4}>Imaging Studies</Title>
            <Text type="secondary">{patientName}</Text>
          </div>
          <Space>
            <Button
              type={compareModeEnabled ? 'primary' : 'default'}
              icon={<CompareOutlined />}
              onClick={() => {
                setCompareModeEnabled(!compareModeEnabled);
                setSelectedStudies([]);
              }}
            >
              {compareModeEnabled ? 'Cancel Compare' : 'Compare Mode'}
            </Button>
            {compareModeEnabled && selectedStudies.length >= 2 && (
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={handleCompare}
              >
                Compare {selectedStudies.length} Studies
              </Button>
            )}
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={studies}
          loading={isLoading}
          rowKey="StudyInstanceUID"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `${total} studies`,
          }}
          scroll={{ x: 1200 }}
        />
      </Space>

      {/* Viewer Modal */}
      <Modal
        title="DICOM Viewer"
        open={viewerVisible}
        onCancel={() => {
          setViewerVisible(false);
          setViewingStudyUid(undefined);
        }}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0, height: '85vh' }}
      >
        <DicomViewer
          studyUid={viewingStudyUid}
          studyUids={
            !viewingStudyUid && selectedStudies.length > 0
              ? selectedStudies
              : undefined
          }
          onClose={() => setViewerVisible(false)}
        />
      </Modal>
    </Card>
  );
};

export default StudyList;
```

---

### 4. Integration with Order Detail

#### File: `frontend/src/pages/orders/OrderDetail.tsx` (add view button)

```tsx
// Add after upload button:

{order.study_instance_uid && (
  <Button
    type="primary"
    icon={<EyeOutlined />}
    onClick={() => setViewerVisible(true)}
  >
    View Images
  </Button>
)}

// Add viewer modal:
const [viewerVisible, setViewerVisible] = useState(false);

<Modal
  title="View Images"
  open={viewerVisible}
  onCancel={() => setViewerVisible(false)}
  footer={null}
  width="90vw"
  style={{ top: 20 }}
  bodyStyle={{ padding: 0, height: '85vh' }}
>
  <DicomViewer
    orderId={order.id}
    onClose={() => setViewerVisible(false)}
  />
</Modal>
```

---

### 5. Integration with Patient Detail

#### File: `frontend/src/pages/patients/PatientDetail.tsx` (add imaging tab)

```tsx
import StudyList from '@/components/dicom/StudyList';

// Add tab:
<TabPane tab="Imaging Studies" key="imaging">
  <StudyList
    patientId={patient.id}
    patientName={patient.full_name}
  />
</TabPane>
```

---

## Verification Checklist

- [ ] OHIF Viewer running on port 3001
- [ ] OHIF can connect to Orthanc
- [ ] Viewer URL generated correctly
- [ ] Iframe loads OHIF successfully
- [ ] Study displays in viewer
- [ ] Window/Level tools work
- [ ] Fullscreen mode works
- [ ] Study list shows all studies
- [ ] Compare mode selects multiple studies
- [ ] Comparison view works side-by-side
- [ ] View button in order detail
- [ ] Imaging tab in patient detail

---

## Testing Scenarios

```bash
# 1. Test OHIF directly
open http://localhost:3001

# 2. Test viewer from order
# - Go to imaging order with uploaded study
# - Click "View Images"
# - Verify OHIF loads with images

# 3. Test patient imaging studies
# - Go to patient detail
# - Click "Imaging Studies" tab
# - See list of studies
# - Click "View" on any study

# 4. Test study comparison
# - Enable "Compare Mode"
# - Select 2+ studies
# - Click "Compare X Studies"
# - Verify side-by-side display

# 5. Test fullscreen mode
# - Click fullscreen button
# - Verify full viewport
# - Exit fullscreen
```

---

## OHIF Viewer Features

### Tools Available:
- **Window/Level**: Adjust brightness/contrast
- **Pan**: Move image
- **Zoom**: Magnify/shrink
- **Rotate**: Rotate image
- **Flip**: Horizontal/vertical flip
- **Invert**: Invert colors
- **Length**: Measure distances
- **Angle**: Measure angles
- **Rectangle ROI**: Draw regions
- **Ellipse ROI**: Draw ellipses
- **Cine**: Play image series
- **Reset**: Reset to default view

### Keyboard Shortcuts:
- Arrow keys: Navigate images
- W/L: Drag for window/level
- R: Rotate right
- L: Rotate left
- I: Invert
- Space: Reset
- +/-: Zoom in/out

---

## Next Phase

Once Phase 5C is complete:
→ **Phase 5D: Integration & Testing** - E2E testing and performance validation

---

**Status:** Ready to implement  
**Estimated Completion:** 6-8 days
