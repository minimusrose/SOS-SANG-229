/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ef233c",
          dark: "#c81d32",
        },
        secondary: "#2b2d42",
        accent: "#8d99ae",
        light: "#edf2f4",
        success: "#00b090",
      },
      boxShadow: {
        card: "0 8px 30px rgb(43 45 66 / 0.08)",
        soft: "0 4px 20px rgb(43 45 66 / 0.06)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
