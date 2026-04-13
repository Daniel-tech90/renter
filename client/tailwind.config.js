/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', hover: '#4338CA' },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-particle': 'floatParticle 10s ease-in-out infinite',
        'pulse-slow': 'pulse 6s ease-in-out infinite',
        'gradient-shift': 'gradientShift 10s ease infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)', opacity: '0.1' },
          '25%': { transform: 'translateY(-20px) rotate(5deg)', opacity: '0.2' },
          '50%': { transform: 'translateY(-35px) rotate(-5deg)', opacity: '0.15' },
          '75%': { transform: 'translateY(-15px) rotate(3deg)', opacity: '0.2' },
        },
        floatParticle: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)', opacity: '0.3' },
          '33%': { transform: 'translateY(-30px) translateX(15px)', opacity: '0.6' },
          '66%': { transform: 'translateY(-15px) translateX(-10px)', opacity: '0.4' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
