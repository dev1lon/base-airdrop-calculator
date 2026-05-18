import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#FFFFFF",
          panel: "#F4F5F8",
          panelStrong: "#EDEEF2",
          border: "#E5E7EB",
          blue: "#0052FF",
          blueHover: "#0040CC",
          blueLight: "#E8EEFF",
          green: "#15A36E",
          red: "#DC2626",
          text: "#0A0B0E",
          mute: "#5C6473",
          muteSoft: "#8B8FA3",
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
