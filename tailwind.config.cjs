/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f8fb',
          100: '#e7eff4',
          200: '#c5d8e6',
          300: '#9bb9cf',
          400: '#6b93b2',
          500: '#4a7496',
          600: '#355c7a',
          700: '#27465f',
          800: '#1a344b',
          900: '#112336'
        },
        bg: '#f5f8fb',
        surface: '#ffffff',
        text: '#172a3a',
        muted: '#5d7182',
        border: '#d7e0e8',
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
        soft: '0 1px 2px rgba(17, 35, 54, 0.06), 0 8px 24px rgba(17, 35, 54, 0.06)',
        panel: '0 8px 30px rgba(39, 70, 95, 0.08)'
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif']
      }
    }
  },
  plugins: []
};
