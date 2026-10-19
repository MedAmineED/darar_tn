import type { Config } from 'tailwindcss';

/**
 * Theme tokens mirror library/admin_ref (Artisanal Registry design system):
 * an earthy wood/umber palette, IBM Plex Sans (Arabic) + Inter typography.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#fcf9f8',
        surface: {
          DEFAULT: '#fcf9f8',
          container: '#f0eded',
          low: '#f6f3f2',
          high: '#eae7e7',
          lowest: '#ffffff',
        },
        'on-surface': {
          DEFAULT: '#1b1c1c',
          variant: '#51443c',
        },
        outline: {
          DEFAULT: '#83746b',
          variant: '#d5c3b8',
        },
        primary: {
          DEFAULT: '#6f4627',
          container: '#8b5e3c',
          on: '#ffffff',
          'on-container': '#ffe3d1',
        },
        secondary: {
          DEFAULT: '#5d4037',
          container: '#fed3c7',
          on: '#ffffff',
        },
        tertiary: {
          DEFAULT: '#3e5800',
          container: '#517201',
          on: '#ffffff',
          'on-container': '#cdf67f',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          on: '#ffffff',
          'on-container': '#93000a',
        },
        sidebar: {
          DEFAULT: '#5d4037',
          hover: '#6f4627',
          active: '#8b5e3c',
          text: '#f3eae4',
          muted: '#c9b3a8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-plex)', 'var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(27, 28, 28, 0.04)',
        popover: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        sidebar: '208px',
        header: '52px',
      },
    },
  },
  plugins: [],
};

export default config;
