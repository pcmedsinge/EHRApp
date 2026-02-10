/**
 * PageHeader Component
 * 
 * Consistent page header with title, breadcrumbs, and actions.
 */

import { Typography, Space, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import type { BreadcrumbItem } from '@/types';
import { colors, spacing } from '@/theme';

const { Title } = Typography;

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle?: string;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Action buttons to display on the right */
  actions?: React.ReactNode;
}

const PageHeader = ({ 
  title, 
  subtitle,
  breadcrumbs,
  actions,
}: PageHeaderProps) => {
  // Build breadcrumb items with home
  const breadcrumbItems = [
    {
      title: (
        <Link to="/dashboard">
          <HomeOutlined />
        </Link>
      ),
    },
    ...(breadcrumbs || []).map(item => ({
      title: item.path ? (
        <Link to={item.path}>{item.title}</Link>
      ) : (
        item.title
      ),
    })),
  ];

  return (
    <div 
      style={{ 
        marginBottom: spacing.lg,
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          items={breadcrumbItems}
          style={{ marginBottom: spacing.sm }}
        />
      )}
      
      {/* Title Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.md,
        }}
      >
        <div>
          <Title 
            level={3} 
            style={{ 
              margin: 0,
              color: colors.text.primary,
            }}
          >
            {title}
          </Title>
          {subtitle && (
            <Typography.Text 
              type="secondary"
              style={{ marginTop: spacing.xxs }}
            >
              {subtitle}
            </Typography.Text>
          )}
        </div>
        
        {actions && (
          <Space wrap>
            {actions}
          </Space>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
