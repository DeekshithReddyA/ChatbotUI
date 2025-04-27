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
        border: "hsl(var(--border))",
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
        },
        // Settings button text
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
      keyframes: {
        "pulse-glow" : {
          "0%, 100%": {opacity: 0.7},
          "50%": {opacity: 1},
        },
        "message-appear" : {
          from : { opacity: 0, transform: "translateY(10px)" }, 
          to: { opacity: 1, transform: "translateY(0)" }
        },
      },
      animation:{
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "message-appear": "message-appear 0.3s ease-in-out forwards",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}

