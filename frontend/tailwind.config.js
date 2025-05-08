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
        "blink" : {
          "0%, 100%": {opacity: 0},
          "50%": {opacity: 1},
        },
        "pulseScale": {
          '0%, 100%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.2)' },
        },
      },
      animation:{
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "message-appear": "message-appear 0.3s ease-in-out forwards",
        "pulse-scale": 'pulseScale 1.5s infinite ease-in-out',
        "typing-cursor": 'blink 1s infinite step-start',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}

