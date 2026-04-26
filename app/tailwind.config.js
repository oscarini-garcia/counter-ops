/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fef3ed',
          100: '#fde0d0',
          200: '#fbbfa0',
          400: '#f08060',
          500: '#e8613a',
          600: '#c2410c',
          700: '#9a3412',
        },
      },
      fontFamily: {
        sans: ['Nunito', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'rgba(200,90,50,0.12)',
      },
    },
  },
  plugins: [],
}
