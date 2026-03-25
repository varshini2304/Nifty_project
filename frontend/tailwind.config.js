// frontend/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      colors: {
        brandBlue: '#1B4F72',
        brandBlueLight: '#2E86C1',
        brandGreen: '#1E8449',
        brandRed: '#922B21',
        brandBg: '#F4F6F9',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
