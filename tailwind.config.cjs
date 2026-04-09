/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7f3',
          100: '#ffe8dd',
          200: '#ffd1bc',
          300: '#ffb18a',
          400: '#ff9466',
          500: '#ef6f43',
          600: '#dd5b34',
          700: '#bf4929',
          800: '#9b3e28',
          900: '#7f3525'
        },
        bg: '#efe8e1',
        surface: '#ffffff',
        text: '#35363a',
        muted: '#7a7d84',
        border: '#ddd2c8',
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
        soft: '0 2px 8px rgba(55, 40, 28, 0.05), 0 12px 28px rgba(55, 40, 28, 0.08)',
        panel: '0 24px 60px rgba(63, 44, 28, 0.13)',
        premium: '0 30px 84px rgba(63, 44, 28, 0.17)'
      },
      fontFamily: {
        sans: ['Inter', '"Avenir Next"', '"Helvetica Neue"', '"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif']
      }
    }
  },
  plugins: []
};
