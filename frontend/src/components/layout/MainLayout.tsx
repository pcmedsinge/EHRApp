/**
 * Main Layout Component
 * 
 * Wraps the application with Header, Sidebar, and Content area.
 * Used as the parent layout for authenticated pages.
 */

import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { colors, spacing, layout as layoutTokens } from '@/theme';

const { Content } = Layout;

const MainLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header />
      
      {/* Content Area */}
      <Layout>
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <Content
          style={{
            padding: spacing.lg,
            background: colors.neutral.background,
            minHeight: `calc(100vh - ${layoutTokens.headerHeight}px)`,
            overflow: 'auto',
          }}
        >
          {/* Child routes render here */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
