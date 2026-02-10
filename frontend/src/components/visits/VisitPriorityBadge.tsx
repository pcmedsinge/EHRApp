/**
 * Visit Priority Badge Component
 * ==============================
 * 
 * Purpose:
 *   Display visit priority as a colored indicator.
 * 
 * Module: src/components/visits/VisitPriorityBadge.tsx
 * Phase: 2D (Frontend - Visit Pages)
 * 
 * References:
 *   - Phase 2D Spec: docs/phases/phase2/Phase2D_Frontend_VisitPages.md
 */

import { Tag } from 'antd';
import { ExclamationCircleOutlined, AlertOutlined } from '@ant-design/icons';
import type { VisitPriority } from '@/types';
import { getPriorityLabel } from '@/utils/visitUtils';

interface VisitPriorityBadgeProps {
  priority: VisitPriority;
  showLabel?: boolean;
}

const priorityConfig: Record<VisitPriority, { color: string; icon: React.ReactNode | null }> = {
  normal: { color: 'default', icon: null },
  urgent: { color: 'warning', icon: <ExclamationCircleOutlined /> },
  emergency: { color: 'error', icon: <AlertOutlined /> },
};

const VisitPriorityBadge: React.FC<VisitPriorityBadgeProps> = ({ 
  priority, 
  showLabel = true 
}) => {
  const config = priorityConfig[priority] || { color: 'default', icon: null };
  
  // Don't show badge for normal priority unless specifically requested
  if (priority === 'normal' && !showLabel) {
    return null;
  }
  
  return (
    <Tag color={config.color} icon={config.icon}>
      {showLabel ? getPriorityLabel(priority) : null}
    </Tag>
  );
};

export default VisitPriorityBadge;
