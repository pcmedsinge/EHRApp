# Phase 1E: Frontend Core Setup

**Sub-Phase:** 1E  
**Estimated Time:** 3-4 hours  
**Prerequisites:** Phase 1D Complete

---

## 1. Objective

Set up React + TypeScript + Vite frontend with Ant Design, routing, API integration, and base layout components.

---

## 2. Deliverables

- [ ] Vite + React + TypeScript project initialized
- [ ] Ant Design configured with theme
- [ ] React Router setup with routes
- [ ] Axios configured with base URL and interceptors
- [ ] React Query setup for API state management
- [ ] Layout components (Header, Sidebar, Main)
- [ ] Environment configuration
- [ ] Working dev server

---

## 3. Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── logo.svg
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   └── common/
│   │       └── Loading.tsx
│   ├── config/
│   │   └── constants.ts
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env.development
├── .env.production
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 4. Implementation

### Step 1: Initialize Vite Project

```bash
# Navigate to project root
cd /home/linuxdev1/PracticeApps/EHRApp

# Create Vite + React + TypeScript project
npm create vite@latest frontend -- --template react-ts

cd frontend
```

---

### Step 2: Install Dependencies

```bash
# Core dependencies
npm install

# Ant Design
npm install antd

# Router
npm install react-router-dom

# API & State Management
npm install axios react-query

# Icons
npm install @ant-design/icons

# Date handling
npm install dayjs

# Development dependencies
npm install -D @types/node
```

---

### Step 3: Configure TypeScript

File: `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

### Step 4: Configure Vite

File: `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

---

### Step 5: Environment Configuration

File: `frontend/.env.development`

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=EHR System
```

File: `frontend/.env.production`

```env
VITE_API_BASE_URL=/api/v1
VITE_APP_NAME=EHR System
```

---

### Step 6: Constants Configuration

File: `frontend/src/config/constants.ts`

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'EHR System';

export const TOKEN_KEY = 'ehr_token';
export const USER_KEY = 'ehr_user';

export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm:ss';

export const PAGINATION = {
  defaultPageSize: 20,
  pageSizeOptions: ['10', '20', '50', '100'],
};
```

---

### Step 7: Type Definitions

File: `frontend/src/types/index.ts`

```typescript
// Common types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist';
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  blood_group?: string;
  age: number;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  aadhaar_number?: string;
  abha_id?: string;
}
```

---

### Step 8: Axios Configuration

File: `frontend/src/services/api.ts`

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '@/config/constants';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem(TOKEN_KEY);
          window.location.href = '/login';
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - no response received');
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### Step 9: Main App Setup

File: `frontend/src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider } from 'antd';
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
          <App />
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

---

### Step 10: App Component

File: `frontend/src/App.tsx`

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<div>Dashboard (Coming in Phase 1F)</div>} />
        <Route path="patients" element={<div>Patients (Coming in Phase 1G)</div>} />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
```

---

### Step 11: Layout Components

File: `frontend/src/components/layout/Header.tsx`

```typescript
import { Layout, Space, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { APP_NAME } from '@/config/constants';

const { Header: AntHeader } = Layout;

const Header = () => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
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
      // Will implement in Phase 1F
      console.log('Logout clicked');
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
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{APP_NAME}</div>
      <Space>
        <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} placement="bottomRight">
          <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
```

File: `frontend/src/components/layout/Sidebar.tsx`

```typescript
import { Menu, Layout } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      key: '/visits',
      icon: <MedicineBoxOutlined />,
      label: 'Visits',
      disabled: true, // Enable in Phase 2
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
      disabled: true,
    },
    {
      type: 'divider',
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

  // Get current selected key from location
  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Sider
      width={250}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;
```

File: `frontend/src/components/layout/MainLayout.tsx`

```typescript
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content } = Layout;

const MainLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Layout>
        <Sidebar />
        <Content
          style={{
            padding: '24px',
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
```

---

### Step 12: Loading Component

File: `frontend/src/components/common/Loading.tsx`

```typescript
import { Spin } from 'antd';

interface LoadingProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
}

const Loading = ({ tip = 'Loading...', size = 'large' }: LoadingProps) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
      }}
    >
      <Spin size={size} tip={tip} />
    </div>
  );
};

export default Loading;
```

---

### Step 13: Global Styles

File: `frontend/src/index.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

/* Ant Design overrides */
.ant-layout-header {
  line-height: 64px;
  height: 64px;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

---

### Step 14: Update package.json Scripts

File: `frontend/package.json` (update scripts section)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  }
}
```

---

### Step 15: Update .gitignore

File: `frontend/.gitignore`

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment files
.env.local
.env.*.local
```

---

## 5. Verification Steps

```bash
# 1. Start backend (in backend terminal)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 2. Start frontend (in new terminal)
cd frontend
npm run dev

# 3. Open browser
# http://localhost:3000

# 4. Verify UI Elements:
# - Header with app name and user avatar
# - Sidebar with menu items
# - Dashboard and Patients menu items clickable
# - Other menu items disabled
# - Clean layout with proper spacing

# 5. Check Browser Console
# - No errors
# - React Query DevTools (if installed)

# 6. Test Navigation
# - Click Dashboard - should navigate to /dashboard
# - Click Patients - should navigate to /patients
# - Check URL changes

# 7. Test API Connection (in browser console)
fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username: 'admin', password: 'Admin123!'})
}).then(r => r.json()).then(console.log)
# Should return token
```

---

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | Change port in vite.config.ts server.port |
| Module not found '@/*' | Check tsconfig.json paths and vite.config.ts alias |
| Ant Design not styled | Ensure ConfigProvider wraps App |
| API proxy not working | Check vite.config.ts proxy configuration |
| TypeScript errors | Run `npm install -D @types/node` |
| Build fails | Check tsconfig.json and vite.config.ts |

---

## 7. Project Structure Verification

```bash
# Check structure
cd frontend
tree -L 3 src/

# Expected output:
# src/
# ├── assets/
# ├── components/
# │   ├── common/
# │   │   └── Loading.tsx
# │   └── layout/
# │       ├── Header.tsx
# │       ├── MainLayout.tsx
# │       └── Sidebar.tsx
# ├── config/
# │   └── constants.ts
# ├── services/
# │   └── api.ts
# ├── types/
# │   └── index.ts
# ├── App.tsx
# ├── index.css
# ├── main.tsx
# └── vite-env.d.ts
```

---

## 8. Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Install new package
npm install package-name

# Install dev dependency
npm install -D package-name
```

---

## 9. Next Sub-Phase

Once verified, proceed to **Phase 1F: Authentication UI**

---

## 10. Checklist

- [ ] Vite project created
- [ ] TypeScript configured
- [ ] Ant Design installed and configured
- [ ] React Router setup
- [ ] Axios configured with interceptors
- [ ] React Query setup
- [ ] Environment files created
- [ ] Constants configuration
- [ ] Type definitions created
- [ ] Layout components created
- [ ] Header displays correctly
- [ ] Sidebar navigation works
- [ ] Routes configured
- [ ] Dev server runs on port 3000
- [ ] No console errors
- [ ] Navigation between routes works
- [ ] API proxy configuration working

---

*End of Phase 1E*
