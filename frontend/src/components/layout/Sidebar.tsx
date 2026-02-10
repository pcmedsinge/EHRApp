/**
 * Sidebar Component
 * 
 * Main navigation sidebar with menu items.
 */

import { useState } from 'react';
import { Menu, Layout } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  SettingOutlined,
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { colors, spacing, layout as layoutTokens } from '@/theme';

const { Sider } = Layout;

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar = ({ collapsed = false, onCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  // Menu items configuration
  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/patients',
      icon: <UserOutlined />,
      label: 'Patients',
    },
    {
      key: '/appointments',
      icon: <CalendarOutlined />,
      label: 'Appointments',
      disabled: true, // Enable in Phase 3
    },
    {
      key: '/visits',
      icon: <MedicineBoxOutlined />,
      label: 'Visits',
    },
    {
      type: 'divider',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
      disabled: true,
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: 'User Management',
      disabled: true,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      disabled: true,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleCollapse = (value: boolean) => {
    setIsCollapsed(value);
    onCollapse?.(value);
  };

  // Get current selected key from location
  const getSelectedKey = (): string => {
    const path = location.pathname;
    
    // Check if path starts with any menu key
    const matchingKey = menuItems
      .filter((item): item is { key: string } => 
        item !== null && typeof item === 'object' && 'key' in item
      )
      .find(item => path.startsWith(item.key))?.key;
    
    return matchingKey || '/dashboard';
  };

  return (
    <Sider
      collapsible
      collapsed={isCollapsed}
      onCollapse={handleCollapse}
      width={layoutTokens.sidebarWidth}
      collapsedWidth={layoutTokens.sidebarCollapsedWidth}
      style={{
        background: colors.neutral.white,
        borderRight: `1px solid ${colors.neutral.borderLight}`,
        overflow: 'auto',
        height: `calc(100vh - ${layoutTokens.headerHeight}px)`,
        position: 'sticky',
        top: layoutTokens.headerHeight,
        left: 0,
      }}
      theme="light"
    >
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ 
          height: '100%', 
          borderRight: 0,
          paddingTop: spacing.sm,
        }}
      />
    </Sider>
  );
};

export default Sidebar;
