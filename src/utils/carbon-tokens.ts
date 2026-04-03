/**
 * Carbon Design System Tokens
 * Based on analysis from CARBON_DESIGN_SYSTEM_ANALYSIS.md
 */

export const carbonTokens = {
  colors: {
    text: {
      primary: '#161616',
      secondary: '#525252',
      accent: '#0f62fe',
    },
    background: {
      default: '#ffffff',
      layer01: '#f4f4f4',
    },
    border: '#c6c6c6',
    blue: {
      20: '#d0e2ff',
      30: '#a6c8ff',
      40: '#78a9ff',
      50: '#4589ff',
      60: '#0f62fe',
    },
    gray: {
      20: '#e0e0e0',
      30: '#c6c6c6',
      40: '#a8a8a8',
      50: '#8d8d8d',
      70: '#525252',
      80: '#393939',
      100: '#161616',
    },
    support: {
      warning: '#f1c21b',
    },
    notification: {
      warningBackground: '#fcf4d6',
      warningBorder: '#f1c21b4d',
    },
  },
  typography: {
    fontFamily: "'IBM Plex Sans', sans-serif",
    body01: {
      fontSize: '14px',
      lineHeight: '18px',
      fontWeight: 400,
      letterSpacing: '0.16px',
    },
    headingCompact01: {
      fontSize: '14px',
      lineHeight: '18px',
      fontWeight: 600,
      letterSpacing: '0.16px',
    },
  },
  spacing: {
    spacing05: '16px',
  },
} as const;

/**
 * CSS Variables for Carbon tokens
 * Use these in your CSS/SCSS files
 */
export const carbonCSSVars = {
  '--cds-text-primary': carbonTokens.colors.text.primary,
  '--cds-text-secondary': carbonTokens.colors.text.secondary,
  '--cds-text-accent': carbonTokens.colors.text.accent,
  '--cds-background': carbonTokens.colors.background.default,
  '--cds-layer-01': carbonTokens.colors.background.layer01,
  '--cds-border': carbonTokens.colors.border,
  '--cds-blue-60': carbonTokens.colors.blue[60],
  '--cds-blue-40': carbonTokens.colors.blue[40],
  '--cds-gray-20': carbonTokens.colors.gray[20],
  '--cds-gray-30': carbonTokens.colors.gray[30],
  '--cds-font-family': carbonTokens.typography.fontFamily,
} as const;

