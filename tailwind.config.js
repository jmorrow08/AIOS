/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          light: '#0e153a',
          dark: '#020c1b',
          accent: '#5d8bf4',
          highlight: '#f4f1bb',
        },
      },
    },
  },
  plugins: [],
};
