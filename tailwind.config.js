/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: "#2d6a4f",
        "leaf-dark": "#1b4332",
        "leaf-light": "#74c69d",
        "leaf-accent": "#52b788",
        cream: "#faf8f0",
        "cream-dark": "#f0ece0",
        sage: "#b7e4c7",
      },
    },
  },
  plugins: [],
};
