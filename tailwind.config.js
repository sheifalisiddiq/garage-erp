/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          300: '#7fffd4',
          400: '#2fffd4',
          500: '#00d4a9',
          600: '#00b890',
          700: '#009674',
        },
        brand: {
          50:  'var(--accent-50)',
          100: 'var(--accent-100)',
          200: 'var(--accent-100)',
          300: 'var(--accent-300)',
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
          800: 'var(--accent-700)',
        },
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        surface: {
          950: 'var(--bg)',
          900: 'var(--bg)',
          850: 'var(--bg-sidebar)',
          800: 'var(--bg-sidebar)',
          750: 'var(--bg-shell)',
          700: 'var(--card)',
          600: 'var(--card-elev)',
          500: 'var(--card-soft)',
          400: 'var(--pill-bg-hover)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter:  '-0.02em',
        widest:   '0.08em',
      },
      boxShadow: {
        card:          '0 1px 2px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        'card-hover':  '0 4px 16px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4)',
        'glow-brand':  '0 0 0 1px rgba(225,29,72,0.2), 0 4px 24px rgba(225,29,72,0.18)',
        'glow-gold':   '0 0 0 1px rgba(251,191,36,0.15), 0 4px 24px rgba(245,158,11,0.14)',
        'glow-emerald':'0 0 0 1px rgba(16,185,129,0.15), 0 4px 24px rgba(16,185,129,0.14)',
        'glow-blue':   '0 0 0 1px rgba(59,130,246,0.15), 0 4px 24px rgba(59,130,246,0.14)',
        'glow-amber':  '0 0 0 1px rgba(245,158,11,0.15), 0 4px 24px rgba(251,191,36,0.1)',
        sidebar:       '1px 0 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-up':    'fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fadeIn 0.3s ease both',
        'scale-in':   'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-right':'slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'ping-slow':  'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:     { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleIn:    { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-10px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseSoft:  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}


