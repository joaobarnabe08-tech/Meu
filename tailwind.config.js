/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Premium black + gold theme
        gold: {
          50: '#FBF7E9',
          100: '#F5EBC4',
          200: '#EDD98E',
          300: '#E0C45A',
          400: '#D4AF37',
          500: '#B8932B',
          600: '#9A7A22',
          700: '#7A611B',
          800: '#5C4915',
          900: '#3D3010',
        },
        viper: {
          50: '#F6F6F6',
          100: '#E2E2E2',
          200: '#C9C9C9',
          300: '#9F9F9F',
          400: '#6B6B6B',
          500: '#3D3D3D',
          600: '#2A2A2A',
          700: '#1A1A1A',
          800: '#121212',
          900: '#0B0B0B',
          950: '#050505',
        },
      },
    },
  },
  plugins: [],
};
