/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6FFE6',
          100: '#B3FFCC',
          200: '#80FFA3',
          300: '#4DFF80',
          400: '#1AFF66',
          500: '#00FF66',
          600: '#00CC52',
          700: '#00993D',
          800: '#006629',
          900: '#003314',
        },
        surface: {
          DEFAULT: '#0A0A0A',
          card: '#1E1E1E',
          border: '#2A2A2A',
          hover: '#1A3A1A',
        },
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0, 255, 102, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 255, 102, 0.5)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
