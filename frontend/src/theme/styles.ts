/**
 * Common CSS-in-JS Styles
 * 
 * Reusable style objects that can be used across components.
 * Import from here instead of creating duplicate styles.
 */

import { colors, spacing, shadows, borders, layout } from './tokens';
import type { CSSProperties } from 'react';

// =============================================================================
// LAYOUT STYLES
// =============================================================================

export const layoutStyles = {
  /** Main page container */
  pageContainer: {
    padding: spacing.lg,
    minHeight: `calc(100vh - ${layout.headerHeight}px)`,
    background: colors.neutral.background,
  } as CSSProperties,

  /** Card container with shadow */
  card: {
    background: colors.neutral.white,
    borderRadius: borders.radius.lg,
    boxShadow: shadows.sm,
    padding: spacing.lg,
  } as CSSProperties,

  /** Flex row with center alignment */
  flexRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
  } as CSSProperties,

  /** Flex row with space between */
  flexRowBetween: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
  } as CSSProperties,

  /** Flex column */
  flexColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
  } as CSSProperties,

  /** Centered content */
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  /** Full width */
  fullWidth: {
    width: '100%',
  } as CSSProperties,
} as const;

// =============================================================================
// HEADER STYLES
// =============================================================================

export const headerStyles = {
  container: {
    padding: `0 ${spacing.lg}px`,
    background: colors.neutral.white,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${colors.neutral.borderLight}`,
    height: layout.headerHeight,
  } as CSSProperties,

  logo: {
    fontSize: 20,
    fontWeight: 600,
    color: colors.primary.main,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  } as CSSProperties,

  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  } as CSSProperties,
} as const;

// =============================================================================
// SIDEBAR STYLES
// =============================================================================

export const sidebarStyles = {
  container: {
    background: colors.neutral.white,
    borderRight: `1px solid ${colors.neutral.borderLight}`,
  } as CSSProperties,

  menu: {
    height: '100%',
    borderRight: 0,
    paddingTop: spacing.sm,
  } as CSSProperties,
} as const;

// =============================================================================
// CONTENT STYLES
// =============================================================================

export const contentStyles = {
  main: {
    padding: spacing.lg,
    background: colors.neutral.background,
    minHeight: `calc(100vh - ${layout.headerHeight}px)`,
    overflow: 'auto',
  } as CSSProperties,

  /** Page title section */
  pageHeader: {
    marginBottom: spacing.lg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,

  /** Page title */
  pageTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    color: colors.text.primary,
  } as CSSProperties,
} as const;

// =============================================================================
// FORM STYLES
// =============================================================================

export const formStyles = {
  /** Form container */
  container: {
    maxWidth: 600,
  } as CSSProperties,

  /** Form section */
  section: {
    marginBottom: spacing.lg,
  } as CSSProperties,

  /** Form section title */
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: spacing.md,
    color: colors.text.primary,
  } as CSSProperties,

  /** Form actions (buttons) */
  actions: {
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  } as CSSProperties,
} as const;

// =============================================================================
// TABLE STYLES
// =============================================================================

export const tableStyles = {
  /** Table container */
  container: {
    background: colors.neutral.white,
    borderRadius: borders.radius.lg,
    overflow: 'hidden',
  } as CSSProperties,

  /** Table header actions */
  headerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  } as CSSProperties,

  /** Search input container */
  searchContainer: {
    flex: 1,
    maxWidth: 400,
  } as CSSProperties,
} as const;

// =============================================================================
// STATUS BADGE STYLES
// =============================================================================

export const statusStyles = {
  /** Status indicator dot */
  dot: (status: 'success' | 'warning' | 'error' | 'info' | 'default'): CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: spacing.xs,
    backgroundColor: status === 'success' ? colors.success.main
      : status === 'warning' ? colors.warning.main
      : status === 'error' ? colors.error.main
      : status === 'info' ? colors.info.main
      : colors.neutral.disabled,
  }),
} as const;

// =============================================================================
// UTILITY STYLES
// =============================================================================

export const utilityStyles = {
  /** Text ellipsis */
  ellipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,

  /** Hidden */
  hidden: {
    display: 'none',
  } as CSSProperties,

  /** Screen reader only */
  srOnly: {
    position: 'absolute' as const,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: 0,
  } as CSSProperties,
} as const;
