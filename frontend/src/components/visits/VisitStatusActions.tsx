/**
 * Visit Status Actions Component
 * ===============================
 * 
 * Purpose:
 *   Render contextual action buttons based on visit status.
 * 
 * Module: src/components/visits/VisitStatusActions.tsx
 * Phase: 2E (Frontend - Visit Detail Pages)
 * 
 * References:
 *   - Phase 2E Spec: docs/phases/phase2/Phase2E_Frontend_VisitDetail.md
 *   - Visit Status Flow: docs/phases/phase2/diagrams/visit-status-flow.md
 */

import { Button, Space, Popconfirm } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RightCircleOutlined,
} from '@ant-design/icons';
import type { Visit, VisitStatus } from '@/types';
import { getNextStatuses } from '@/utils/visitUtils';

interface VisitStatusActionsProps {
  visit: Visit;
  onStatusChange: (newStatus: VisitStatus, reason?: string) => void;
  onCancelClick?: () => void;
  loading?: boolean;
  size?: 'small' | 'middle' | 'large';
}

const VisitStatusActions: React.FC<VisitStatusActionsProps> = ({
  visit,
  onStatusChange,
  onCancelClick,
  loading = false,
  size = 'middle',
}) => {
  const { status } = visit;
  const nextStatuses = getNextStatuses(status);

  // If no available actions, return null
  if (nextStatuses.length === 0) {
    return null;
  }

  const getActionButton = (targetStatus: VisitStatus) => {
    switch (targetStatus) {
      case 'waiting':
        return (
          <Button
            key="waiting"
            type="default"
            icon={<RightCircleOutlined />}
            onClick={() => onStatusChange('waiting')}
            loading={loading}
            size={size}
          >
            Move to Waiting
          </Button>
        );

      case 'in_progress':
        return (
          <Popconfirm
            key="in_progress"
            title="Start Consultation"
            description="This will mark the visit as in progress. Continue?"
            onConfirm={() => onStatusChange('in_progress')}
            okText="Start"
            cancelText="Cancel"
          >
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={loading}
              size={size}
            >
              Start Consultation
            </Button>
          </Popconfirm>
        );

      case 'completed':
        return (
          <Popconfirm
            key="completed"
            title="Complete Visit"
            description="This will mark the visit as completed. Continue?"
            onConfirm={() => onStatusChange('completed')}
            okText="Complete"
            cancelText="Cancel"
          >
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={loading}
              size={size}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Complete Visit
            </Button>
          </Popconfirm>
        );

      case 'cancelled':
        return (
          <Button
            key="cancelled"
            danger
            icon={<CloseCircleOutlined />}
            onClick={onCancelClick}
            loading={loading}
            size={size}
          >
            Cancel Visit
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Space wrap>
      {nextStatuses
        .filter((s) => s !== 'cancelled')
        .map((targetStatus) => getActionButton(targetStatus))}
      {nextStatuses.includes('cancelled') && onCancelClick && getActionButton('cancelled')}
    </Space>
  );
};

export default VisitStatusActions;
