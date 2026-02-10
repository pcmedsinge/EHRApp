/**
 * Ant Design Theme Configuration
 * 
 * This file configures the Ant Design theme using our design tokens.
 * It creates a consistent look and feel across all Ant Design components.
 */

import type { ThemeConfig } from 'antd';
import { colors, typography, borders, spacing } from './tokens';

/**
 * Ant Design Theme
 * Uses our design tokens to configure the theme
 */
export const antTheme: ThemeConfig = {
  token: {
    // Primary colors
    colorPrimary: colors.primary.main,
    colorSuccess: colors.success.main,
    colorWarning: colors.warning.main,
    colorError: colors.error.main,
    colorInfo: colors.info.main,

    // Text colors
    colorText: colors.text.primary,
    colorTextSecondary: colors.text.secondary,
    colorTextTertiary: colors.text.tertiary,
    colorTextDisabled: colors.neutral.disabled,

    // Background colors
    colorBgContainer: colors.neutral.white,
    colorBgLayout: colors.neutral.background,
    colorBgElevated: colors.neutral.backgroundLight,

    // Border colors
    colorBorder: colors.neutral.border,
    colorBorderSecondary: colors.neutral.borderLight,

    // Typography
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.sm,
    fontSizeHeading1: typography.fontSize.display,
    fontSizeHeading2: typography.fontSize.xxxl,
    fontSizeHeading3: typography.fontSize.xxl,
    fontSizeHeading4: typography.fontSize.xl,
    fontSizeHeading5: typography.fontSize.lg,

    // Borders
    borderRadius: borders.radius.md,
    borderRadiusSM: borders.radius.sm,
    borderRadiusLG: borders.radius.lg,

    // Layout
    controlHeight: 32,
    controlHeightSM: 24,
    controlHeightLG: 40,

    // Links
    colorLink: colors.text.link,
    colorLinkHover: colors.text.linkHover,

    // Line height
    lineHeight: typography.lineHeight.normal,
  },

  components: {
    // Layout component customization
    Layout: {
      headerBg: colors.neutral.white,
      headerHeight: 64,
      siderBg: colors.neutral.white,
      bodyBg: colors.neutral.background,
    },

    // Menu component customization
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: colors.primary.lightest,
      itemSelectedColor: colors.primary.main,
      itemHoverBg: colors.neutral.backgroundLight,
    },

    // Button component customization
    Button: {
      borderRadius: borders.radius.md,
      controlHeight: 36,
      paddingContentHorizontal: spacing.md,
    },

    // Input component customization
    Input: {
      borderRadius: borders.radius.md,
      controlHeight: 36,
    },

    // Select component customization
    Select: {
      borderRadius: borders.radius.md,
      controlHeight: 36,
    },

    // Card component customization
    Card: {
      borderRadiusLG: borders.radius.lg,
      paddingLG: spacing.lg,
    },

    // Table component customization
    Table: {
      headerBg: colors.neutral.backgroundLight,
      rowHoverBg: colors.neutral.backgroundLight,
      borderColor: colors.neutral.borderLight,
    },

    // Modal component customization
    Modal: {
      borderRadiusLG: borders.radius.lg,
    },

    // Message component customization
    Message: {
      contentBg: colors.neutral.white,
    },

    // Notification component customization
    Notification: {
      width: 384,
    },

    // Form component customization
    Form: {
      labelColor: colors.text.primary,
      labelFontSize: typography.fontSize.sm,
    },

    // Tag component customization
    Tag: {
      borderRadiusSM: borders.radius.sm,
    },

    // Avatar component customization
    Avatar: {
      containerSize: 40,
      containerSizeSM: 32,
      containerSizeLG: 48,
    },

    // Breadcrumb component customization
    Breadcrumb: {
      separatorColor: colors.text.tertiary,
      linkColor: colors.text.secondary,
      linkHoverColor: colors.primary.main,
    },
  },
};

/**
 * Dark theme variant (for future use)
 * Currently just a placeholder - can be expanded later
 */
export const antThemeDark: ThemeConfig = {
  ...antTheme,
  token: {
    ...antTheme.token,
    // Override for dark mode
    colorBgContainer: '#1f1f1f',
    colorBgLayout: '#141414',
    colorText: '#ffffff',
    colorTextSecondary: '#a6a6a6',
  },
};

export default antTheme;
