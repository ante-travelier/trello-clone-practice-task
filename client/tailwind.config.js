/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Chakra Petch', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
      },
      colors: {
        void: {
          950: 'var(--void-950)',
          900: 'var(--void-900)',
          850: 'var(--void-850)',
          800: 'var(--void-800)',
          700: 'var(--void-700)',
          600: 'var(--void-600)',
          500: 'var(--void-500)',
        },
        neon: {
          cyan: '#00e5ff',
          indigo: '#6366f1',
          purple: '#a855f7',
          green: '#22d3ee',
        },
        fg: {
          DEFAULT: 'var(--fg)',
          soft: 'var(--fg-soft)',
          dim: 'var(--fg-dim)',
          muted: 'var(--fg-muted)',
          faint: 'var(--fg-faint)',
        },
        edge: {
          DEFAULT: 'var(--edge)',
          strong: 'var(--edge-strong)',
        },
        tint: 'var(--tint)',
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 229, 255, 0.3), 0 0 40px rgba(0, 229, 255, 0.1)',
        'neon-indigo': '0 0 15px rgba(99, 102, 241, 0.3), 0 0 40px rgba(99, 102, 241, 0.1)',
        'neon-hover': '0 0 20px rgba(0, 229, 255, 0.4), 0 0 60px rgba(99, 102, 241, 0.15)',
        'card-glow': '0 0 10px rgba(99, 102, 241, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #6366f1, #00e5ff)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
