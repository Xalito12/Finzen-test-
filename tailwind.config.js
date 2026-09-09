/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#512DA8",    
        secondary: "#3F51B5",  
        cta: "#5C6BC0",        
        accent: "#7E57C2",     
      },
    },
  },
  plugins: [],
};