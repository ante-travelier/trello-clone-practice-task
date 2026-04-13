/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          base: 'var(--color-base)',
          surface: 'var(--color-surface)',
          card: 'var(--color-card)',
          elevated: 'var(--color-elevated)',
          border: 'var(--color-border)',
          hover: 'var(--color-hover)',
        },
        theme: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
          faint: 'var(--color-text-faint)',
          accent: 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
        },
        neon: {
          indigo: '#6366f1',
          cyan: '#22d3ee',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          purple: '#a855f7',
          orange: '#f97316',
          pink: '#ec4899',
        },
      },
      boxShadow: {
        'neon-indigo': '0 0 15px rgba(99, 102, 241, 0.3), 0 0 45px rgba(99, 102, 241, 0.1)',
        'neon-cyan': '0 0 15px rgba(34, 211, 238, 0.3), 0 0 45px rgba(34, 211, 238, 0.1)',
        'neon-green': '0 0 12px rgba(16, 185, 129, 0.4)',
        'neon-red': '0 0 12px rgba(239, 68, 68, 0.4)',
        'neon-purple': '0 0 12px rgba(168, 85, 247, 0.4)',
        'glow-sm': 'var(--shadow-glow-sm)',
        'glow-md': 'var(--shadow-glow-md)',
        'glow-lg': 'var(--shadow-glow-lg)',
        'theme-xl': 'var(--shadow-xl)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-accent': 'linear-gradient(135deg, #6366f1, #22d3ee)',
        'gradient-accent-hover': 'linear-gradient(135deg, #818cf8, #67e8f9)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
