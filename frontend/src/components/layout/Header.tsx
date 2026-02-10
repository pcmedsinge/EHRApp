/**
 * Header Component
 * 
 * Main application header with logo, app name, and user menu.
 */

import { Layout, Space, Dropdown, Avatar, Typography, Badge, Tag } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined,
  BellOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/config/constants';
import { colors, spacing, layout as layoutTokens } from '@/theme';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

// Role colors for tags
const roleColors: Record<string, string> = {
  admin: 'red',
  doctor: 'blue',
  nurse: 'green',
  receptionist: 'orange',
};

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600 }}>{user?.full_name}</div>
          <div style={{ fontSize: 12, color: colors.text.secondary }}>{user?.email}</div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      disabled: true,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  return (
    <AntHeader
      style={{
        padding: `0 ${spacing.lg}px`,
        background: colors.neutral.white,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${colors.neutral.borderLight}`,
        height: layoutTokens.headerHeight,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo and App Name */}
      <Space align="center" size={spacing.xs}>
        <MedicineBoxOutlined 
          style={{ 
            fontSize: 28, 
            color: colors.primary.main,
          }} 
        />
        <Text
          strong
          style={{
            fontSize: 20,
            color: colors.primary.main,
            margin: 0,
          }}
        >
          {APP_NAME}
        </Text>
      </Space>

      {/* Right Side Actions */}
      <Space size={spacing.md} align="center">
        {/* Notifications */}
        <Badge count={0} size="small">
          <BellOutlined 
            style={{ 
              fontSize: 20, 
              color: colors.text.secondary,
              cursor: 'pointer',
            }} 
          />
        </Badge>

        {/* User Menu */}
        <Dropdown 
          menu={{ items: userMenuItems, onClick: handleMenuClick }} 
          placement="bottomRight"
          trigger={['click']}
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar 
              icon={<UserOutlined />} 
              style={{ 
                backgroundColor: colors.primary.main,
              }} 
            />
            <Text style={{ color: colors.text.primary }}>
              {user?.full_name || 'User'}
            </Text>
            <Tag color={roleColors[user?.role || 'admin']} style={{ margin: 0 }}>
              {user?.role?.toUpperCase()}
            </Tag>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
