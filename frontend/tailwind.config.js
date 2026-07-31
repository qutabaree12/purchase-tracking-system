/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef1f8',
          100: '#d5dcee',
          200: '#aab9dd',
          300: '#7f96cc',
          400: '#5473bb',
          500: '#2b5797',
          600: '#1a2b5c',
          700: '#15224a',
          800: '#101a38',
          900: '#0b1226',
        },
        brand: {
          green: '#007a33',
          emerald: '#00a651',
          navy: '#1a2b5c',
          badge: '#dc3545',
          text: '#6b7280',
          border: '#dee2e6',
          line: '#e9ecef',
          page: '#f8f9fa',
          rowhover: '#fafbfc',
        },
      },
    },
  },
  plugins: [],
}
