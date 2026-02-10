/**
 * Authentication Context
 * 
 * Provides global authentication state and methods throughout the app.
 * Wraps the application to provide user, login, logout functionality.
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';
import authService from '@/services/authService';
import type { LoginCredentials } from '@/services/authService';
import { message } from 'antd';

// =============================================================================
// TYPES
// =============================================================================

interface AuthContextType {
  /** Current authenticated user or null */
  user: User | null;
  /** Whether auth state is being initialized */
  loading: boolean;
  /** Login with username and password */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Logout and clear session */
  logout: () => void;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Refresh user data from server */
  refreshUser: () => Promise<void>;
}

// =============================================================================
// CONTEXT
// =============================================================================

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Initialize authentication state on mount
   * Check for existing token and validate it
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get current user from server to validate token
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          // Update stored user with fresh data
          authService.updateStoredUser(currentUser);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Token is invalid, clear it
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login with credentials
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);
      message.success(`Welcome back, ${loggedInUser.full_name}!`);
    } catch (error: unknown) {
      console.error('Login failed:', error);
      const errorMsg = 
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
        'Login failed. Please check your credentials.';
      message.error(errorMsg);
      throw error;
    }
  }, []);

  /**
   * Logout and clear session
   */
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    message.info('You have been logged out');
  }, []);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        authService.updateStoredUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  // Context value
  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
