import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F8CFF',
        secondary: '#7C5CFF',
        electric: '#32E7FF',
        royal: '#6D5CFF',
        copper: {
          50: '#fff4ea',
          100: '#fce1c8',
          400: '#d98742',
          500: '#C6793F',
          600: '#a85f2d',
        },
        pcb: {
          dark: '#0A1410',
          cream: '#F3F0E4',
          green: '#4ADE80',
          red: '#FF5A45',
        },
      },
      boxShadow: {
        pcb: '0 20px 60px rgba(0,0,0,0.24)',
        premium: '0 20px 60px rgba(0, 0, 0, 0.28)',
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(50,231,255,0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
