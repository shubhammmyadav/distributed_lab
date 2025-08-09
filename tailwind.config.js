/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        softer: "0 4px 24px rgba(0,0,0,0.08)",
      }
    },
  },
  plugins: [],
};
