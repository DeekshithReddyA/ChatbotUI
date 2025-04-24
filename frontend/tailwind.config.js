/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily:{
        sans : ['Inter', 'sans-serif'],
      },
      colors: {
        background : "hsl(var(--background))",
        foreground : "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        primary:{
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        }
      }
    },
  },
  plugins: [],
}

