/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edf4fb',
          100: '#d8e8f7',
          200: '#b5d2ee',
          300: '#86b3df',
          400: '#5c95ce',
          500: '#397abd',
          600: '#1f659f',
          700: '#0f548c',
          800: '#0b4675',
          900: '#07345a'
        },
        bg: '#f1f3f6',
        surface: '#ffffff',
        text: '#1f2a36',
        muted: '#5f6c79',
        border: '#ccd4dc',
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
        soft: '0 1px 2px rgba(7, 52, 90, 0.08), 0 8px 24px rgba(7, 52, 90, 0.08)',
        panel: '0 10px 32px rgba(10, 32, 58, 0.12)'
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif']
      }
    }
  },
  plugins: []
};
