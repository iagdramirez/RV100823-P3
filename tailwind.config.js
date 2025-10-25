/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#121212',
        secondary: '#1e1e1e',
        tertiary: '#2a2a2a',
        accent: '#00d084',
        text: '#ffffff',
        textSecondary: '#a1a1aa',
      },
    },
  },
  plugins: [],
}