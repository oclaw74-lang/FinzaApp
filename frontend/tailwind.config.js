/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'finza-blue': {
          DEFAULT: '#366092',
          light: '#5B9BD5',
          dark: '#2A4D75',
        },
        'prosperity-green': '#00B050',
        'golden-flow': '#FFC000',
        'alert-red': '#FF0000',
        'flow-light': '#D9E1F2',
        border: '#E0E0E0',
        background: '#F8F9FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(54, 96, 146, 0.08)',
        'card-hover': '0 4px 16px rgba(54, 96, 146, 0.16)',
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
}
