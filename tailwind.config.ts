import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
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
      },
    },
  },
  plugins: [],
};

export default config;
