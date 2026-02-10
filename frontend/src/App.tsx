/**
 * Main Application Component
 * ==========================
 * 
 * Purpose:
 *   Root component defining React Router routes and layout structure.
 *   Wraps protected routes with authentication checks.
 * 
 * Module: src/App.tsx
 * Phase: 1E (Frontend Core)
 * 
 * References:
 *   - Frontend Structure: docs/diagrams/frontend-structure.md
 *   - Auth Flow: docs/phases/phase1/diagrams/auth-flow.md
 * 
 * Routes:
 *   Public:
 *     - /login - Login page
 *   Protected (requires auth):
 *     - /dashboard - Main dashboard
 *     - /patients/* - Patient management (Phase 1G)
 *     - /visits/* - Visit management (Phase 2D/2E)
 * 
 * Dependencies:
 *   - AuthContext for authentication state
 *   - MainLayout for page structure
 *   - PrivateRoute for route protection
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { PrivateRoute } from '@/components/auth';
import { Login, Dashboard, VisitList, VisitCreate, VisitDetail, VisitEdit } from '@/pages';
import { PatientList, PatientCreate, PatientDetail, PatientEdit } from '@/pages/patients';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common';

const NotFound = () => (
  <div style={{ padding: 24, background: '#fff', borderRadius: 8, textAlign: 'center' }}>
    <h2>404 - Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
  </div>
);

function App() {
  const { loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return <Loading tip="Loading application..." fullPage />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes - Wrapped with PrivateRoute */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Redirect root to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard */}
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Patients */}
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/create" element={<PatientCreate />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/edit" element={<PatientEdit />} />
        
        {/* Visits (Phase 2D/2E) */}
        <Route path="visits" element={<VisitList />} />
        <Route path="visits/create" element={<VisitCreate />} />
        <Route path="visits/:id" element={<VisitDetail />} />
        <Route path="visits/:id/edit" element={<VisitEdit />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
