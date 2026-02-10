/**
 * Loading Component
 * 
 * Reusable loading spinner with consistent styling.
 */

import { Spin } from 'antd';
import type { SpinProps } from 'antd';
import { colors, spacing } from '@/theme';

interface LoadingProps {
  /** Loading message */
  tip?: string;
  /** Spinner size */
  size?: SpinProps['size'];
  /** Full page loading overlay */
  fullPage?: boolean;
  /** Minimum height */
  minHeight?: number | string;
}

const Loading = ({ 
  tip = 'Loading...', 
  size = 'large',
  fullPage = false,
  minHeight = 300,
}: LoadingProps) => {
  const containerStyle: React.CSSProperties = fullPage
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        zIndex: 9999,
      }
    : {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight,
        padding: spacing.lg,
      };

  return (
    <div style={containerStyle}>
      <Spin size={size}>
        <div style={{ 
          padding: 50,
          textAlign: 'center',
          color: colors.primary.main,
          fontSize: 14,
        }}>
          {tip}
        </div>
      </Spin>
    </div>
  );
};

export default Loading;
