/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff3ed',
          100: '#ffe1d2',
          200: '#ffc2a6',
          300: '#ff9c6d',
          400: '#f77943',
          500: '#ea5b31',
          600: '#d44f29',
          700: '#b14124',
          800: '#913722',
          900: '#782f20'
        },
        bg: '#f3f1ee',
        surface: '#ffffff',
        text: '#2f2f33',
        muted: '#6f747b',
        border: '#e6dfd8',
        success: '#0f766e',
        warning: '#b76e00',
        danger: '#b42318'
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1rem'
      },
      boxShadow: {
        soft: '0 2px 6px rgba(55, 40, 28, 0.04), 0 10px 24px rgba(55, 40, 28, 0.06)',
        panel: '0 24px 60px rgba(63, 44, 28, 0.10)',
        premium: '0 28px 80px rgba(63, 44, 28, 0.12)'
      },
      fontFamily: {
        sans: ['Inter', '"Avenir Next"', '"Helvetica Neue"', '"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif']
      }
    }
  },
  plugins: []
};
