/**
 * Axios API Client
 * 
 * Configured Axios instance with JWT token handling and error interceptors.
 * Use this client for all API requests.
 * 
 * Usage:
 *   import api from '@/services/api';
 *   const response = await api.get('/patients');
 */

import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, TOKEN_KEY, API_TIMEOUT, MESSAGES } from '@/config/constants';
import type { ApiError } from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT.default,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// REQUEST INTERCEPTOR
// =============================================================================

/**
 * Add JWT token to all requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR
// =============================================================================

/**
 * Handle API errors globally
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: MESSAGES.error.network,
        status: 0,
      });
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem(TOKEN_KEY);
        
        // Don't redirect if already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;

      case 403:
        console.error('Forbidden:', data?.detail);
        break;

      case 404:
        console.error('Not found:', data?.detail);
        break;

      case 422:
        // Validation error
        console.error('Validation error:', data?.detail);
        break;

      case 500:
        console.error('Server error:', data?.detail);
        break;

      default:
        console.error('API error:', status, data?.detail);
    }

    return Promise.reject(error);
  }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract error message from Axios error
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    if (axiosError.response?.data?.detail) {
      const detail = axiosError.response.data.detail;
      
      // Handle FastAPI validation errors
      if (Array.isArray(detail)) {
        return detail.map(d => d.msg).join(', ');
      }
      
      return detail;
    }
    
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return MESSAGES.error.generic;
};

/**
 * Check if error is an Axios error
 */
export const isApiError = (error: unknown): error is AxiosError<ApiError> => {
  return axios.isAxiosError(error);
};

/**
 * Set the auth token
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove the auth token
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Get the auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Check if user is authenticated (has token)
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export default api;
