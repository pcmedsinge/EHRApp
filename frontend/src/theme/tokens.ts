/**
 * EHR Application Design Tokens
 * 
 * This file contains all the design tokens (colors, spacing, typography, etc.)
 * that should be used consistently across the entire application.
 * 
 * IMPORTANT: Always import from this file instead of hardcoding values.
 * This ensures consistency and makes it easy to update the design system.
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

/**
 * Brand Colors
 * Primary: Medical blue - professional, trustworthy
 * Secondary: Teal - calming, healthcare
 */
export const colors = {
  // Primary Brand Colors
  primary: {
    main: '#1677FF',      // Ant Design v5 default primary
    light: '#4096FF',
    lighter: '#69B1FF',
    lightest: '#BAE0FF',
    dark: '#0958D9',
    darker: '#003EB3',
    text: '#FFFFFF',      // Text color on primary background
  },

  // Secondary Colors
  secondary: {
    main: '#13C2C2',      // Teal/Cyan
    light: '#36CFC9',
    lighter: '#5CDBD3',
    dark: '#08979C',
    text: '#FFFFFF',
  },

  // Semantic Colors - Status indicators
  success: {
    main: '#52C41A',
    light: '#73D13D',
    lighter: '#95DE64',
    lightest: '#D9F7BE',
    dark: '#389E0D',
    text: '#FFFFFF',
  },
  
  warning: {
    main: '#FAAD14',
    light: '#FFC53D',
    lighter: '#FFD666',
    lightest: '#FFF1B8',
    dark: '#D48806',
    text: '#000000',
  },
  
  error: {
    main: '#FF4D4F',
    light: '#FF7875',
    lighter: '#FFA39E',
    lightest: '#FFCCC7',
    dark: '#CF1322',
    text: '#FFFFFF',
  },
  
  info: {
    main: '#1677FF',
    light: '#4096FF',
    lighter: '#69B1FF',
    lightest: '#BAE0FF',
    dark: '#0958D9',
    text: '#FFFFFF',
  },

  // Neutral Colors - For backgrounds, borders, text
  neutral: {
    white: '#FFFFFF',
    background: '#F5F5F5',      // Main page background
    backgroundLight: '#FAFAFA', // Cards, modals
    border: '#D9D9D9',          // Default borders
    borderLight: '#F0F0F0',     // Light borders
    divider: '#F0F0F0',
    disabled: '#BFBFBF',
    placeholder: '#BFBFBF',
  },

  // Text Colors
  text: {
    primary: '#262626',         // Main text
    secondary: '#595959',       // Secondary text
    tertiary: '#8C8C8C',        // Disabled, hints
    inverse: '#FFFFFF',         // Text on dark backgrounds
    link: '#1677FF',
    linkHover: '#4096FF',
  },

  // Healthcare-specific colors
  healthcare: {
    emergency: '#FF4D4F',       // Emergency/Critical
    urgent: '#FA8C16',          // Urgent attention
    routine: '#52C41A',         // Routine/Normal
    scheduled: '#1677FF',       // Scheduled items
    pending: '#FAAD14',         // Pending actions
    completed: '#52C41A',       // Completed items
    cancelled: '#8C8C8C',       // Cancelled items
  },

  // Gender colors (for patient avatars, etc.)
  gender: {
    male: '#1677FF',
    female: '#EB2F96',
    other: '#722ED1',
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

/**
 * Spacing scale following 8px grid system
 * Use these values for margins, padding, gaps
 */
export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

/**
 * Typography scale
 */
export const typography = {
  fontFamily: {
    primary: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    code: "source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 38,
  },
  
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// =============================================================================
// BORDERS & SHADOWS
// =============================================================================

export const borders = {
  radius: {
    none: 0,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    round: '50%',
  },
  
  width: {
    thin: 1,
    medium: 2,
    thick: 4,
  },
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  card: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)',
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
  // Header
  headerHeight: 64,
  
  // Sidebar
  sidebarWidth: 250,
  sidebarCollapsedWidth: 80,
  
  // Content
  contentPadding: spacing.lg,
  maxContentWidth: 1400,
  
  // Breakpoints (matching Ant Design)
  breakpoints: {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
  },
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  dropdown: 1050,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  fast: '0.1s ease-in-out',
  normal: '0.2s ease-in-out',
  slow: '0.3s ease-in-out',
} as const;
