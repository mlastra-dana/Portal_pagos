/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3edff',
          100: '#eadfff',
          200: '#d8c2ff',
          300: '#a779ff',
          400: '#8f56f2',
          500: '#6d28e0',
          600: '#5f1ec9',
          700: '#4b16b6',
          800: '#331080',
          900: '#0f0f1f'
        },
        accent: '#a779ff',
        bg: '#f7f4ff',
        surface: '#ffffff',
        text: '#0f0f1f',
        muted: '#596070',
        border: '#ded4ef',
        success: '#0f766e',
        warning: '#9a5b00',
        danger: '#b42318'
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1rem'
      },
      boxShadow: {
        soft: '0 2px 8px rgba(15, 15, 31, 0.05), 0 12px 28px rgba(75, 22, 182, 0.08)',
        panel: '0 24px 60px rgba(75, 22, 182, 0.14)',
        premium: '0 30px 84px rgba(75, 22, 182, 0.17)'
      },
      fontFamily: {
        sans: ['Inter', '"Avenir Next"', '"Helvetica Neue"', '"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif']
      }
    }
  },
  plugins: []
};
