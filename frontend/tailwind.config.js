/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ef233c",
          dark: "#c81d32",
          strong: "#b81b33",
        },
        secondary: "#2b2d42",
        accent: "#8d99ae",
        muted: "#5c6478",
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
      transitionDuration: {
        micro: "150ms",
        reveal: "300ms",
        page: "600ms",
      },
      transitionTimingFunction: {
        "soft-out": "cubic-bezier(.22, 1, .36, 1)",
        bounce: "cubic-bezier(.34, 1.56, .64, 1)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(1rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(.6)" },
          "60%": { opacity: "1", transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "draw-check": {
          to: { "stroke-dashoffset": "0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.35s infinite",
        "toast-in": "toast-in 380ms cubic-bezier(.22, 1, .36, 1) both",
        pop: "pop 300ms cubic-bezier(.34, 1.56, .64, 1) both",
        "draw-check": "draw-check 420ms cubic-bezier(.22, 1, .36, 1) forwards",
      },
    },
  },
  plugins: [],
};
