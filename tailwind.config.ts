import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0A0B14",
          panel: "#10121C",
          border: "#1E2030",
          blue: "#0052FF",
          blueLight: "#3B82F6",
          green: "#22C55E",
          red: "#EF4444",
          text: "#E5E7EB",
          mute: "#8B8FA3",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
