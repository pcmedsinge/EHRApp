/**
 * Login Page
 * 
 * Authentication page with login form, validation, and redirect handling.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/config/constants';
import { colors } from '@/theme';

const { Title, Text, Paragraph } = Typography;

// =============================================================================
// LOGIN FORM VALUES
// =============================================================================

interface LoginFormValues {
  username: string;
  password: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  /**
   * Handle form submission
   */
  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled in auth context
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          borderRadius: 12,
        }}
        bordered={false}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Logo and Title */}
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <MedicineBoxOutlined 
              style={{ 
                fontSize: 48, 
                color: colors.primary.main,
                marginBottom: 16,
              }} 
            />
            <Title level={2} style={{ marginBottom: 4 }}>
              {APP_NAME}
            </Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>

          {/* Login Form */}
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please enter your username' },
                { min: 3, message: 'Username must be at least 3 characters' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: colors.text.secondary }} />}
                placeholder="Username"
                autoFocus
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: colors.text.secondary }} />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{ height: 44 }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          {/* Demo Credentials */}
          <div>
            <Divider plain>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Demo Credentials
              </Text>
            </Divider>
            <div 
              style={{ 
                background: colors.neutral.backgroundLight,
                padding: 12,
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <Paragraph style={{ marginBottom: 4, fontSize: 13 }}>
                <Text strong>Admin:</Text> <Text code>admin</Text> / <Text code>admin123</Text>
              </Paragraph>
              <Paragraph style={{ marginBottom: 4, fontSize: 13 }}>
                <Text strong>Doctor:</Text> <Text code>dr_sharma</Text> / <Text code>doctor123</Text>
              </Paragraph>
              <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
                <Text strong>Nurse:</Text> <Text code>nurse_priya</Text> / <Text code>nurse123</Text>
              </Paragraph>
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
