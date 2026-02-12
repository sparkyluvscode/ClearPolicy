import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "var(--cp-accent)",
        },
        cream: {
          50: "#FDFCF7",
          100: "#F9F7F0",
          200: "#F5F3EB",
          300: "#E8E6DF",
          400: "#D4D2C8",
        },
        civic: {
          blue: "#4A7BBA",
          green: "#5EAF8E",
          coral: "#E07A5F",
          gold: "#D4A574",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        heading: ["'Fraunces'", "'Lora'", "Georgia", "serif"],
      },
      borderRadius: {
        "2.5xl": "1.375rem",
        "3.5xl": "1.875rem",
      },
      boxShadow: {
        soft: "var(--cp-shadow-soft)",
        card: "var(--cp-shadow-card)",
        elevated: "var(--cp-shadow-elevated)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
    },
  },
  plugins: [],
};

export default config;
