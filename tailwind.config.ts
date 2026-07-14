import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#F5F5F7",
        paper: "#0B0B0D",
        panel: "#18181C",
        teal: {
          DEFAULT: "#E5177C",
          dark: "#B8115F",
          light: "#3A1526",
        },
        gold: {
          DEFAULT: "#D89A2E",
          light: "#3A2A12",
        },
        line: "#2A2A30",
        brand: {
          purple: "#6B4FA0",
          blue: "#2AA9C4",
          green: "#6DBE2C",
        },
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
