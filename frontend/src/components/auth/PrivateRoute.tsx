/**
 * PrivateRoute Component
 * 
 * Wrapper component that protects routes requiring authentication.
 * Redirects unauthenticated users to the login page.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common';

interface PrivateRouteProps {
  /** Child components to render if authenticated */
  children: React.ReactNode;
  /** Optional: Required role(s) for access */
  roles?: string[];
}

const PrivateRoute = ({ children, roles }: PrivateRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return <Loading tip="Checking authentication..." fullPage />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (roles && roles.length > 0 && user) {
    if (!roles.includes(user.role)) {
      // User doesn't have required role - redirect to dashboard with message
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Render protected content
  return <>{children}</>;
};

export default PrivateRoute;
