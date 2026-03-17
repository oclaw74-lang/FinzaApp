/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand legacy (backward-compat)
        'prosperity-green': '#10b981',
        'golden-flow': '#f59e0b',
        'alert-red': '#ef4444',
        'flow-light': '#eff6ff',
        // Premium design system tokens
        'finza-blue': '#3d8ef8',
        'finza-green': '#00dfa2',
        'finza-red': '#ff4060',
        'finza-yellow': '#ffb340',
        'finza-purple': '#9768ff',
        'finza-cyan': '#00dfff',
        'finza-t2': '#657a9e',
        'finza-bg': '#04080f',
        'finza-bg2': '#080f1e',
        'finza-bg3': '#0d1829',
        // Semanticos via CSS vars
        background: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        sidebar: 'var(--sidebar)',
        'sidebar-foreground': 'var(--sidebar-fg)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,.10)',
        glass: '0 8px 32px rgba(0,0,0,.12)',
      },
      borderRadius: { card: '12px', xl2: '16px' },
      animation: {
        'fade-in': 'fadeIn .2s ease',
        'slide-up': 'slideUp .2s ease',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
