/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls including login, logout,
 * registration, and token management.
 */

import api from './api';
import type { User } from '@/types';
import { TOKEN_KEY, USER_KEY } from '@/config/constants';

// =============================================================================
// TYPES
// =============================================================================

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

// =============================================================================
// AUTH SERVICE
// =============================================================================

class AuthService {
  /**
   * Login user and store token
   */
  async login(credentials: LoginCredentials): Promise<User> {
    // Clear any existing auth data
    this.logout();

    // Login with JSON body
    const response = await api.post<LoginResponse>('/auth/login', {
      username: credentials.username,
      password: credentials.password,
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
   * Logout user - clear all stored auth data
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Check if user is authenticated (has token)
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
   * Get stored user from localStorage
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

  /**
   * Update stored user data
   */
  updateStoredUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
