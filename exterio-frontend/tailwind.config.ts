import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /**
         * Graphite: the one neutral ramp for every surface, hairline and text role. Content is
         * dark on white; the page around it stays quiet so the eye goes to the work.
         */
        stone: {
          50: '#f6f7f5', // page background
          100: '#eff1ee', // raised: inputs, active rows, table heads
          200: '#e3e6e2', // hairline
          300: '#cfd3ce', // strong hairline, input border
          400: '#9da39c',
          500: '#6b716a', // muted text and icons
          600: '#4b504a', // secondary text
          700: '#353934',
          800: '#232622',
          900: '#141714', // primary text
          950: '#0b0d0b',
        },
        /**
         * The self-healing cutting mat, kept for the product's moments only: the estimate total
         * and the sign-in story. Cream `line` is its grid and text, `ink` its brightest text.
         */
        mat: {
          DEFAULT: '#2b6656',
          deep: '#245747',
          line: '#dfe9c6',
          ink: '#f4f6ea',
        },
        /** Dark ink: labels, handles and chips drawn over the house photo. */
        ink: '#10241d',
        /**
         * Mat green: the single accent. Primary action, the current step, selection and the
         * one figure that matters. 700 carries white text at about 8:1.
         */
        brand: {
          50: '#eef5f2',
          100: '#d7e8e0',
          200: '#afd0c3',
          300: '#80b19e',
          400: '#4f8f78',
          500: '#367862',
          600: '#2b6656',
          700: '#245747',
          800: '#1c463a',
          900: '#15362d',
        },
      },
      fontFamily: {
        sans: [
          'Nohemi',
          '"IBM Plex Sans"',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.05)',
        raised: '0 8px 24px rgb(0 0 0 / 0.08)',
      },
      backgroundImage: {
        // Muted text with a lighter band that `animate-text-shimmer` sweeps across it.
        'text-shimmer':
          'linear-gradient(90deg, #78716c 0%, #78716c 40%, #d6d3d1 50%, #78716c 60%, #78716c 100%)',
        // Major lines every 60px, minor every 12px, like a mat ruled in inches and tenths.
        'cutting-mat': [
          'linear-gradient(to right, rgb(223 233 198 / 0.22) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgb(223 233 198 / 0.22) 1px, transparent 1px)',
          'linear-gradient(to right, rgb(223 233 198 / 0.08) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgb(223 233 198 / 0.08) 1px, transparent 1px)',
        ].join(', '),
        // The page: one faint 60px drafting grid, felt rather than seen. No fine lines: they
        // made the page busier than the work on it.
        'paper-grid': [
          'linear-gradient(to right, rgb(20 23 20 / 0.035) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgb(20 23 20 / 0.035) 1px, transparent 1px)',
        ].join(', '),
      },
      backgroundSize: {
        'mat-grid': '60px 60px, 60px 60px, 12px 12px, 12px 12px',
        'grid-60': '60px 60px',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        DEFAULT: '160ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
        // Auto-detect: a sheen sweeping across the photo while the AI works, then each found
        // part's outline tracing in, its name tag popping up and its row sliding into the list.
        sweep: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(200%)' },
        },
        'draw-in': {
          from: { strokeDashoffset: 'var(--outline)', fillOpacity: '0' },
          to: { strokeDashoffset: '0' },
        },
        'tag-in': {
          '0%, 40%': { opacity: '0', transform: 'scale(0.7)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'row-in': {
          from: { opacity: '0', transform: 'translateX(10px)', backgroundColor: '#d7e8e0' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        // A light sweeping through a line of text, for a step that is still running.
        'text-shimmer': {
          from: { backgroundPosition: '100% 0' },
          to: { backgroundPosition: '-100% 0' },
        },
        // Before / after on the sign-in page, one 6 s cycle per house: a moment of the photo as
        // it is, the new finishes sweep in, then the arrows draw and their labels hold.
        reveal: {
          '0%, 10%': { clipPath: 'inset(0 100% 0 0)' },
          '32%, 100%': { clipPath: 'inset(0 0% 0 0)' },
        },
        divider: {
          '0%, 10%': { left: '0%', opacity: '1' },
          '32%': { left: '100%', opacity: '1' },
          '34%, 100%': { left: '100%', opacity: '0' },
        },
        draw: {
          '0%, 34%': { strokeDashoffset: '1' },
          '46%, 100%': { strokeDashoffset: '0' },
        },
        callouts: {
          '0%, 36%': { opacity: '0' },
          '44%, 94%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 320ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slide-up 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'text-shimmer': 'text-shimmer 1.8s linear infinite',
        sweep: 'sweep 1.8s ease-in-out infinite',
        'draw-in': 'draw-in 700ms ease-out both',
        'tag-in': 'tag-in 600ms cubic-bezier(0.2, 1.4, 0.4, 1) both',
        'row-in': 'row-in 450ms ease-out both',
        reveal: 'reveal 6s cubic-bezier(0.65, 0, 0.35, 1) both',
        divider: 'divider 6s cubic-bezier(0.65, 0, 0.35, 1) both',
        draw: 'draw 6s cubic-bezier(0.22, 1, 0.36, 1) both',
        callouts: 'callouts 6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
