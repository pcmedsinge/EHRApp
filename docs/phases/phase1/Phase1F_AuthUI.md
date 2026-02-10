# Phase 1F: Authentication UI

**Sub-Phase:** 1F  
**Estimated Time:** 3-4 hours  
**Prerequisites:** Phase 1E Complete

---

## 1. Objective

Implement complete authentication UI with login page, auth context, protected routes, and token management.

---

## 2. Deliverables

- [ ] Login page with form
- [ ] Auth context for global state
- [ ] Token storage in localStorage
- [ ] Protected route wrapper
- [ ] Auto-redirect on auth failure
- [ ] User profile in header
- [ ] Logout functionality
- [ ] Working end-to-end authentication

---

## 3. Files to Create

```
frontend/src/
├── contexts/
│   └── AuthContext.tsx
├── pages/
│   ├── Login.tsx
│   └── Dashboard.tsx
├── services/
│   └── authService.ts
├── components/
│   └── auth/
│       └── PrivateRoute.tsx
└── hooks/
    └── useAuth.ts
```

---

## 4. Implementation

### Step 1: Auth Service

File: `frontend/src/services/authService.ts`

```typescript
import api from './api';
import { User } from '@/types';
import { TOKEN_KEY, USER_KEY } from '@/config/constants';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'doctor' | 'nurse' | 'receptionist';
}

class AuthService {
  /**
   * Login user and store token
   */
  async login(credentials: LoginCredentials): Promise<User> {
    // Clear any existing auth data
    this.logout();

    // Login with form data (OAuth2 requirement)
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = response.data;

    // Store token
    localStorage.setItem(TOKEN_KEY, access_token);

    // Get user profile
    const user = await this.getCurrentUser();

    // Store user
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<User> {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get stored user
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}

export default new AuthService();
```

---

### Step 2: Auth Context

File: `frontend/src/contexts/AuthContext.tsx`

```typescript
import { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import authService, { LoginCredentials } from '@/services/authService';
import { message } from 'antd';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get current user
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);
      message.success('Login successful!');
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMsg = error.response?.data?.detail || 'Login failed';
      message.error(errorMsg);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    message.info('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

---

### Step 3: useAuth Hook

File: `frontend/src/hooks/useAuth.ts`

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
```

---

### Step 4: Private Route Component

File: `frontend/src/components/auth/PrivateRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/common/Loading';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading tip="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
```

---

### Step 5: Login Page

File: `frontend/src/pages/Login.tsx`

```typescript
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/config/constants';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (error) {
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              {APP_NAME}
            </Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
            initialValues={{ username: 'admin', password: 'Admin123!' }}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please enter your username' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Username"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Default credentials: admin / Admin123!
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
```

---

### Step 6: Dashboard Page

File: `frontend/src/pages/Dashboard.tsx`

```typescript
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, MedicineBoxOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Welcome, {user?.full_name}!</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Patients"
              value={0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Today's Visits"
              value={0}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Reports"
              value={0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }} title="Quick Actions">
        <p>Patient management features will be available in Phase 1G</p>
      </Card>
    </div>
  );
};

export default Dashboard;
```

---

### Step 7: Update Header with User Info

File: `frontend/src/components/layout/Header.tsx`

```typescript
import { Layout, Space, Dropdown, Avatar, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/config/constants';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.full_name} (${user?.role})`,
      disabled: true,
    },
    {
      type: 'divider',
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

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
        {APP_NAME}
      </div>
      <Space>
        <Text>{user?.full_name}</Text>
        <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} placement="bottomRight">
          <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', backgroundColor: '#1890ff' }} />
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
```

---

### Step 8: Update App.tsx with Auth

File: `frontend/src/App.tsx`

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PrivateRoute from '@/components/auth/PrivateRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/common/Loading';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loading tip="Loading application..." />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<div>Patients (Coming in Phase 1G)</div>} />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
```

---

### Step 9: Update main.tsx with AuthProvider

File: `frontend/src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider } from 'antd';
import { AuthProvider } from '@/contexts/AuthContext';
import App from './App';
import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## 5. Verification Steps

```bash
# 1. Ensure backend is running
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 2. Ensure frontend is running
cd frontend
npm run dev

# 3. Open browser: http://localhost:3000

# 4. Test Unauthenticated Access
# - Should redirect to /login automatically
# - See login form with username/password fields

# 5. Test Login with Wrong Credentials
# - Username: wrong
# - Password: wrong
# - Expected: Error message "Incorrect username or password"

# 6. Test Login with Correct Credentials
# - Username: admin
# - Password: Admin123!
# - Expected: Redirect to /dashboard

# 7. Verify Dashboard
# - See "Welcome, Admin User!" message
# - See statistics cards (all showing 0)
# - Header shows username and avatar
# - Sidebar shows navigation

# 8. Test Header Dropdown
# - Click avatar in header
# - See profile name and role
# - Click Logout
# - Expected: Redirect to /login with "Logged out successfully" message

# 9. Test Auto-redirect After Logout
# - Try accessing http://localhost:3000/dashboard
# - Expected: Redirect to /login

# 10. Test Protected Routes
# - Login again
# - Navigate to /dashboard - should work
# - Navigate to /patients - should work (placeholder)
# - Navigate to /invalid - should show 404

# 11. Test Token Persistence
# - Login
# - Refresh page
# - Expected: Still logged in, no redirect to login

# 12. Test Browser Console
# - No errors
# - Check localStorage - should have ehr_token and ehr_user
```

---

## 6. Browser DevTools Checks

```javascript
// In browser console after login:

// Check token
localStorage.getItem('ehr_token')
// Should return JWT token

// Check user
JSON.parse(localStorage.getItem('ehr_user'))
// Should return user object

// Clear auth (test logout)
localStorage.clear()
// Refresh page - should redirect to login
```

---

## 7. API Integration Test

```bash
# Test login via curl
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=Admin123!"

# Should return:
# {
#   "access_token": "eyJ...",
#   "token_type": "bearer"
# }

# Test /me endpoint
TOKEN="<paste-token-here>"
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# Should return user object
```

---

## 8. Troubleshooting

| Issue | Solution |
|-------|----------|
| Login fails with CORS error | Check backend CORS settings in main.py |
| Token not stored | Check browser console for errors |
| Redirect loop | Clear localStorage and try again |
| 401 after refresh | Check axios interceptor token injection |
| User profile not loading | Check /auth/me endpoint in backend |
| Logout not working | Check AuthContext logout function |

---

## 9. Testing Flow Chart

```
1. Open app → Redirect to /login
2. Enter credentials → Click Sign In
3. Success → Store token + user
4. Redirect to /dashboard
5. Dashboard renders with user data
6. Header shows user name
7. Click logout → Clear storage
8. Redirect to /login
9. Try protected route → Redirect to /login
```

---

## 10. Next Sub-Phase

Once verified, proceed to **Phase 1G: Patient UI**

---

## 11. Checklist

- [ ] Login page created with form
- [ ] AuthContext implemented
- [ ] useAuth hook created
- [ ] PrivateRoute component works
- [ ] Token stored in localStorage
- [ ] User stored in localStorage
- [ ] Login redirects to dashboard
- [ ] Logout clears storage and redirects
- [ ] Protected routes redirect to login
- [ ] Header shows user info
- [ ] Dropdown menu works
- [ ] Dashboard displays correctly
- [ ] Token persists after refresh
- [ ] Auto-redirect on 401 works
- [ ] No console errors
- [ ] All authentication flows work

---

*End of Phase 1F*
