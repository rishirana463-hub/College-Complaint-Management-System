/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f1fd",
          100: "#e5e3fb",
          200: "#cbc7f7",
          300: "#a8a0f2",
          400: "#8a7ff0",
          500: "#7c6cf0",
          600: "#5b4fe0",
          700: "#4338ca",
          800: "#372aa8",
          900: "#2b2180",
        },
      },
      boxShadow: {
        soft: "0 20px 50px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
