import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#132A36",
        paper: "#F2F4F3",
        panel: "#FFFFFF",
        teal: {
          DEFAULT: "#2F6F65",
          dark: "#204B44",
          light: "#DCEAE7",
        },
        gold: {
          DEFAULT: "#B98B2A",
          light: "#F3E6C6",
        },
        line: "#DBDFDD",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
