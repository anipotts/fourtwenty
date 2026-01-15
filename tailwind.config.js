/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: "#228B22",
        "leaf-dark": "#1a6b1a",
        "leaf-light": "#90EE90",
        cream: "#FFFEF5",
      },
    },
  },
  plugins: [],
};
