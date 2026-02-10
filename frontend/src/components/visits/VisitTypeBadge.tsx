/**
 * Visit Type Badge Component
 * ==========================
 * 
 * Purpose:
 *   Display visit type as a colored tag.
 * 
 * Module: src/components/visits/VisitTypeBadge.tsx
 * Phase: 2D (Frontend - Visit Pages)
 */

import { Tag } from 'antd';
import type { VisitType } from '@/types';
import { getVisitTypeLabel, getVisitTypeColor } from '@/utils/visitUtils';

interface VisitTypeBadgeProps {
  type: VisitType;
}

const VisitTypeBadge: React.FC<VisitTypeBadgeProps> = ({ type }) => {
  return (
    <Tag color={getVisitTypeColor(type)}>
      {getVisitTypeLabel(type)}
    </Tag>
  );
};

export default VisitTypeBadge;
