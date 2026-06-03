/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#F5F6FA',
          dark: '#ECEDF2',
          card: '#FFFFFF',
          hover: '#F0F1F5',
        },
        gold: {
          DEFAULT: '#C9A800',
          dark: '#9A8000',
          light: '#E8C800',
        },
        live: '#22c55e',
        accent: {
          red: '#E63946',
          cyan: '#00D4FF',
          purple: '#7B5EA7',
        },
      },
      animation: {
        pulse2: 'pulse2 1.5s ease-in-out infinite',
        slideUp: 'slideUp 0.4s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out',
        ticker: 'ticker 20s linear infinite',
      },
      keyframes: {
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}
