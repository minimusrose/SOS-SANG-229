/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FDF4F5",
          100: "#F8E4E7",
          200: "#EFC7CD",
          500: "#B4233A",
          600: "#8F1C2E",
          700: "#6F1624",
          800: "#4C1019",
        },
        sand: {
          50: "#F8F4EF",
          100: "#F1EAE2",
          200: "#E4D8CB",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgb(28 25 23 / 0.06), 0 8px 24px rgb(28 25 23 / 0.06)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
