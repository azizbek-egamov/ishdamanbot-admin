/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#ffb3b5",
        "primary-container": "#ff5165",
        "on-primary": "#680018",
        "secondary": "#70ffba",
        "secondary-container": "#01e599",
        "on-secondary": "#003822",
        "tertiary": "#47d6ff",
        "tertiary-container": "#009ec0",
        "background": "#12131a",
        "surface": "#12131a",
        "surface-container-lowest": "#0d0e14",
        "surface-container-low": "#1a1b22",
        "surface-container": "#1e1f26",
        "surface-container-high": "#282a31",
        "surface-container-highest": "#33343c",
        "on-surface": "#e2e1eb",
        "on-surface-variant": "#9ca3af",
        "outline": "#ae8788",
        "error": "#ffb4ab",
        "error-container": "#93000a",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-red': '0 0 15px rgba(255, 81, 101, 0.4)',
        'neon-green': '0 0 15px rgba(1, 229, 153, 0.4)',
        'neon-blue': '0 0 15px rgba(71, 214, 255, 0.4)',
      }
    },
  },
  plugins: [],
}
