/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.tsx',
    './*.ts',
    './components/**/*.{tsx,ts}',
    './services/**/*.{tsx,ts}',
    './types/**/*.{tsx,ts}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-void': '#08080F',
        'bg-dark': '#0E0E18',
        'bg-midnight': '#151522',
        'bg-slate': '#1A1A2E',
        'primary-blue': '#4DA3FF',
        'accent-purple': '#8B5CF6',
        'accent-cyan': '#22D3EE',
        'text-main': '#FFFFFF',
        'text-muted': 'rgba(255,255,255,0.65)',
        'neon-blue': '#4DA3FF',
        'neon-purple': '#8B5CF6',
        'neon-pink': '#EC4899',
        'neon-magenta': '#D946EF',
        'crimson': '#1A1A2E',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
