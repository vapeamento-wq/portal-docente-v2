/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#F15A24',
          gold: '#db9b32',
          navy: '#003366',
        },
      },
    },
  },
  plugins: [],
};
