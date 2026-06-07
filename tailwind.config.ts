import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mountain: {
          950: "#0a1628",
          900: "#0f2137",
          800: "#1a3348",
          700: "#2d4a5e",
          500: "#4a7c8c",
          300: "#8fb4b8",
          100: "#d4e4e8",
        },
        summit: {
          500: "#f59e0b",
          400: "#fbbf24",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
