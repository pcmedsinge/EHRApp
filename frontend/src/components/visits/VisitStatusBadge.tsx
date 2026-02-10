/**
 * Visit Status Badge Component
 * ============================
 * 
 * Purpose:
 *   Display visit status as a colored Ant Design Tag.
 * 
 * Module: src/components/visits/VisitStatusBadge.tsx
 * Phase: 2D (Frontend - Visit Pages)
 * 
 * References:
 *   - Visit Status Flow: docs/phases/phase2/diagrams/visit-status-flow.md
 *   - Visit Utils: src/utils/visitUtils.ts
 */

import { Tag } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckSquareOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { VisitStatus } from '@/types';
import { getStatusLabel } from '@/utils/visitUtils';

interface VisitStatusBadgeProps {
  status: VisitStatus;
  size?: 'small' | 'default';
}

const statusConfig: Record<VisitStatus, { color: string; icon: React.ReactNode }> = {
  registered: { color: 'blue', icon: <CheckCircleOutlined /> },
  waiting: { color: 'orange', icon: <ClockCircleOutlined /> },
  in_progress: { color: 'processing', icon: <SyncOutlined spin /> },
  completed: { color: 'success', icon: <CheckSquareOutlined /> },
  cancelled: { color: 'default', icon: <CloseCircleOutlined /> },
};

const VisitStatusBadge: React.FC<VisitStatusBadgeProps> = ({ status, size = 'default' }) => {
  const config = statusConfig[status] || { color: 'default', icon: null };
  
  return (
    <Tag
      color={config.color}
      icon={config.icon}
      style={size === 'small' ? { fontSize: 11, padding: '0 4px' } : undefined}
    >
      {getStatusLabel(status)}
    </Tag>
  );
};

export default VisitStatusBadge;
