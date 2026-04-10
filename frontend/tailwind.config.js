/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        sand: "#f5efe3",
        clay: "#d97706",
        tide: "#0f766e",
        ember: "#9f1239"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"]
      },
      boxShadow: {
        soft: "0 24px 80px -48px rgba(15, 23, 42, 0.5)"
      }
    }
  },
  plugins: []
};

