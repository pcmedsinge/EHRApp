/**
 * Helper Utilities
 * 
 * Common utility functions used throughout the application.
 */

import dayjs from 'dayjs';
import { DATE_FORMAT, DATE_TIME_FORMAT, DATE_API_FORMAT } from '@/config/constants';

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Format date for display
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  return dayjs(date).format(DATE_FORMAT);
};

/**
 * Format date with time for display
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  return dayjs(date).format(DATE_TIME_FORMAT);
};

/**
 * Format date for API requests
 */
export const formatDateForApi = (date: string | Date | null | undefined): string | null => {
  if (!date) return null;
  return dayjs(date).format(DATE_API_FORMAT);
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string | Date | null | undefined): number | null => {
  if (!dateOfBirth) return null;
  return dayjs().diff(dayjs(dateOfBirth), 'year');
};

/**
 * Check if a date is today
 */
export const isToday = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalize each word in a string
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str.split(' ').map(capitalize).join(' ');
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, maxLength: number): string => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Format phone number for display
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '-';
  // Simple format: add spaces for Indian numbers
  if (phone.length === 10) {
    return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
};

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (10-15 digits)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate Aadhaar number (12 digits)
 */
export const isValidAadhaar = (aadhaar: string): boolean => {
  const aadhaarRegex = /^[0-9]{12}$/;
  return aadhaarRegex.test(aadhaar);
};

/**
 * Validate pincode (6 digits)
 */
export const isValidPincode = (pincode: string): boolean => {
  const pincodeRegex = /^[0-9]{6}$/;
  return pincodeRegex.test(pincode);
};

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

/**
 * Get item from localStorage with JSON parsing
 */
export const getStorageItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

/**
 * Set item in localStorage with JSON stringify
 */
export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Remove item from localStorage
 */
export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

/**
 * Format number with commas (Indian format)
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('en-IN');
};

/**
 * Format currency (INR)
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

/**
 * Remove empty/null/undefined values from object
 */
export const cleanObject = <T extends object>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => 
      value !== null && value !== undefined && value !== ''
    )
  ) as Partial<T>;
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// =============================================================================
// URL UTILITIES
// =============================================================================

/**
 * Build query string from object
 */
export const buildQueryString = (params: Record<string, unknown>): string => {
  const cleaned = cleanObject(params);
  const searchParams = new URLSearchParams();
  
  Object.entries(cleaned).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};
