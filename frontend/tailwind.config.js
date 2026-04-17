/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f8f7",
          100: "#dbece8",
          200: "#b8dad3",
          300: "#8bbfb3",
          400: "#5b9f8d",
          500: "#3d8372",
          600: "#2f695c",
          700: "#285549",
          800: "#23453c",
          900: "#1f3a33"
        }
      },
      boxShadow: {
        soft: "0 20px 50px rgba(15, 23, 42, 0.08)"
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
