/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Earthy, recycling-inspired palette — kept out of default
        // SaaS-blue / dark-mode territory on purpose.
        bark: "#2B2118",      // near-black text, warm not cold
        leaf: "#2F6B4F",      // primary — deep recycling green
        leafLight: "#E7F0EA", // primary surface tint
        clay: "#C96F4A",      // accent — terracotta, used sparingly
        paper: "#F4F1E9",     // app background, warm off-white
        sand: "#EFE8D8",      // card background
        line: "#DDD3BE",      // hairline borders
        ok: "#2F6B4F",
        warn: "#B8862E",
        danger: "#B3402F",
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
};
