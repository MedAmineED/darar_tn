import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

/**
 * Tailwind is configured at build time (NOT the Play CDN). The colour tokens
 * and `max-w-container` mirror the original template config exactly so the
 * ported markup keeps its identity.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#442a22',
        'primary-container': '#5d4037',
        'on-primary': '#ffffff',
        surface: '#f4faff',
        'surface-low': '#e9f6fd',
        'surface-c': '#e3f0f8',
        'surface-high': '#ddeaf2',
        'surface-variant': '#d7e4ec',
        'on-surface': '#111d23',
        'on-surface-variant': '#504441',
        outline: '#827470',
        'outline-variant': '#d4c3be',
        beige: '#ece0dc',
        wood: '#e0c9a6',
        blush: '#e7bdb1',
      },
      maxWidth: {
        container: '1280px',
      },
      fontFamily: {
        // Wired to the next/font CSS variables set in app/layout.tsx.
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [forms],
};

export default config;
