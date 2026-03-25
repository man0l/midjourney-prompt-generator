import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,astro}'],
  theme: {
    extend: {
      colors: {
        primary: '#f0b429',
        background: {
          start: '#ede9d8',
          end: '#e4dfc8',
        },
        text: '#1a1a1a',
        accent: '#c8c0a8',
        muted: '#6b6559',
        card: '#ede9d8',
        dark: '#1c1c1c',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [typography],
};
