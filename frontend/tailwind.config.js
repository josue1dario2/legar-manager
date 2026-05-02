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
          DEFAULT: '#4F46E5',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#0F172A',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#10B981',
          foreground: '#ffffff',
        },
        background: '#F8FAFC',
        foreground: '#0F172A',
        card: '#ffffff',
        'card-foreground': '#0F172A',
        muted: '#F1F5F9',
        'muted-foreground': '#64748B',
        border: '#E2E8F0',
        ring: '#4F46E5',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}