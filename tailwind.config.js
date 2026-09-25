/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#512DA8",
        secondary: "#3F51B5",
        accent: "#7E57C2",
        "accent-light": "#5C6BC0",
        bg: "#F5F3FA",
        "bg-dark": "#1A1233",
        text: "#1E1B2E",
        "text-secondary": "#6B6580",
        success: "#2E7D32",
        alert: "#F9A825",
        error: "#C62828",
        card: "#FFFFFF",
        border: "#E8E4F0",
      },
    },
  },
  plugins: [],
};