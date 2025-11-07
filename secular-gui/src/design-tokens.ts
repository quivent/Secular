/**
 * Secular GUI Design Tokens - TypeScript
 * Generated: 2025-11-05
 * Version: 0.1.0
 *
 * Type-safe design tokens for TypeScript/JavaScript projects
 */

export const designTokens = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    accent: {
      cyan: '#06b6d4',
      purple: '#a855f7',
      pink: '#ec4899',
      amber: '#f59e0b',
    },
    semantic: {
      success: 'rgb(34, 197, 94)',
      warning: 'rgb(250, 204, 21)',
      error: 'rgb(239, 68, 68)',
      info: 'rgb(59, 130, 246)',
      idle: 'rgb(107, 114, 128)',
    },
    glass: {
      light: 'rgba(255, 255, 255, 0.05)',
      medium: 'rgba(255, 255, 255, 0.1)',
      dark: 'rgba(0, 0, 0, 0.3)',
    },
    text: {
      primary: 'rgba(255, 255, 255, 1.0)',
      secondary: 'rgba(255, 255, 255, 0.8)',
      tertiary: 'rgba(255, 255, 255, 0.6)',
      quaternary: 'rgba(255, 255, 255, 0.4)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },
    background: {
      main: 'linear-gradient(to bottom right, #020617, #172554, #0f172a)',
      primaryGradient: 'linear-gradient(to right, #0ea5e9, #3b82f6)',
      accentGradient: 'linear-gradient(to right, #06b6d4, #a855f7)',
    },
  },

  typography: {
    fontFamily: {
      sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 'Courier New', monospace",
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    lineHeight: {
      xs: '16px',
      sm: '20px',
      base: '24px',
      lg: '28px',
      xl: '28px',
      '2xl': '32px',
      '3xl': '36px',
      '4xl': '40px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glowPrimary: '0 0 20px rgba(14, 165, 233, 0.6)',
    glowSuccess: '0 0 20px rgba(34, 197, 94, 0.6)',
    glowWarning: '0 0 20px rgba(250, 204, 21, 0.6)',
    glowError: '0 0 20px rgba(239, 68, 68, 0.6)',
  },

  blur: {
    none: '0',
    xs: '2px',
    sm: '4px',
    base: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },

  animation: {
    duration: {
      fast: '150ms',
      base: '300ms',
      slow: '600ms',
      pulse: '2000ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  components: {
    button: {
      primary: {
        height: '48px',
        paddingX: '32px',
        fontSize: '16px',
        borderRadius: '16px',
      },
      secondary: {
        height: '40px',
        paddingX: '24px',
        fontSize: '14px',
        borderRadius: '12px',
      },
      tertiary: {
        height: '32px',
        paddingX: '16px',
        fontSize: '14px',
        borderRadius: '12px',
      },
    },
    card: {
      hero: {
        padding: '32px',
        borderRadius: '24px',
      },
      standard: {
        padding: '24px',
        borderRadius: '16px',
      },
      compact: {
        padding: '16px',
        borderRadius: '12px',
      },
    },
    knob: {
      sm: '48px',
      md: '64px',
      lg: '80px',
    },
    led: {
      sm: '8px',
      md: '12px',
      lg: '16px',
    },
    meter: {
      sm: '16px',
      md: '24px',
      lg: '32px',
    },
  },
} as const;

// Type exports for autocomplete
export type PrimaryColor = keyof typeof designTokens.colors.primary;
export type AccentColor = keyof typeof designTokens.colors.accent;
export type SemanticColor = keyof typeof designTokens.colors.semantic;
export type FontSize = keyof typeof designTokens.typography.fontSize;
export type Spacing = keyof typeof designTokens.spacing;
export type BorderRadius = keyof typeof designTokens.borderRadius;
export type Shadow = keyof typeof designTokens.shadow;
export type AnimationDuration = keyof typeof designTokens.animation.duration;

// Helper functions
export const getColor = {
  primary: (shade: PrimaryColor) => designTokens.colors.primary[shade],
  accent: (color: AccentColor) => designTokens.colors.accent[color],
  semantic: (color: SemanticColor) => designTokens.colors.semantic[color],
  text: (level: keyof typeof designTokens.colors.text) => designTokens.colors.text[level],
};

export const getSpacing = (size: Spacing) => designTokens.spacing[size];
export const getRadius = (size: BorderRadius) => designTokens.borderRadius[size];
export const getShadow = (size: Shadow) => designTokens.shadow[size];

// Usage examples:
/*
import { designTokens, getColor, getSpacing } from './design-tokens';

// Direct access
const buttonStyle = {
  height: designTokens.components.button.primary.height,
  padding: `0 ${designTokens.components.button.primary.paddingX}`,
  background: designTokens.colors.background.primaryGradient,
  borderRadius: designTokens.components.button.primary.borderRadius,
};

// Using helpers
const cardStyle = {
  color: getColor.text('primary'),
  padding: getSpacing(8),
  borderRadius: getRadius('2xl'),
  boxShadow: getShadow('glowPrimary'),
};

// Type-safe color selection
const statusColor = (status: 'success' | 'warning' | 'error') => {
  return getColor.semantic(status);
};
*/

export default designTokens;
