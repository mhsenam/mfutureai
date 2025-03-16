/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0f172a', // Dark blue
          lighter: '#1e293b', // Slightly lighter dark blue
          lightest: '#334155', // Even lighter dark blue
          accent: '#3b82f6', // Blue accent
          hover: '#1f2937', // Hover state color
          border: '#374151', // Border color
          text: {
            primary: '#f1f5f9',
            secondary: '#cbd5e1',
            muted: '#94a3b8',
          },
        },
      },
      backgroundColor: {
        dark: {
          primary: '#0f172a',
          secondary: '#1e293b',
          accent: '#3b82f6',
          hover: '#1f2937',
          card: '#1e293b',
          input: '#1e293b',
        },
      },
      textColor: {
        dark: {
          primary: '#f1f5f9',
          secondary: '#cbd5e1',
          muted: '#94a3b8',
          accent: '#60a5fa',
        },
      },
      borderColor: {
        dark: {
          DEFAULT: '#374151',
          accent: '#3b82f6',
          hover: '#4b5563',
        },
      },
      ringColor: {
        dark: {
          DEFAULT: '#374151',
          accent: '#3b82f6',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
} 