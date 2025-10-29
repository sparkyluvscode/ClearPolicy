import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#4f46e5", // indigo-600
        },
        glass: {
          // Semi-transparent materials for light and dark surfaces
          light: "rgba(255, 255, 255, 0.72)",
          dark: "rgba(2, 6, 23, 0.55)", // slate-950 @ ~55%
        },
        on: {
          // Foreground colors on glass for contrast
          glassLight: "#0b1220", // near slate-950
          glassDark: "#f8fafc",  // near slate-50
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Inter", "sans-serif"],
      },
      borderRadius: {
        liquid: "1.25rem", // generous rounding for liquid edges
        '2.5xl': "1.375rem",
        '3.5xl': "1.875rem",
      },
      boxShadow: {
        // Subtle depth + inner highlights to mimic refracted edges
        'glass-sm': "0 2px 6px rgba(2, 6, 23, 0.08), 0 6px 18px rgba(2, 6, 23, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
        glass: "0 12px 30px rgba(2, 6, 23, 0.18), 0 24px 48px rgba(2, 6, 23, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 1px rgba(2, 6, 23, 0.12)",
        'glass-lg': "0 20px 60px rgba(2, 6, 23, 0.28), 0 40px 80px rgba(2, 6, 23, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 2px rgba(2, 6, 23, 0.15)",
        'inner-glass': "inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 2px rgba(2, 6, 23, 0.12)",
        'glow-accent': "0 0 0 1px rgba(79, 70, 229, 0.35), 0 12px 36px rgba(79, 70, 229, 0.35)",
      },
      backdropBlur: {
        // Keep defaults; add a slightly heavier tier
        '3xl': '52px',
      },
      transitionTimingFunction: {
        liquid: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      transitionDuration: {
        liquid: "350ms",
      },
      ringOffsetColor: {
        glass: "rgba(255,255,255,0.6)",
      },
      ringColor: {
        glass: "rgba(15,23,42,0.25)", // slate-900 @ 25%
      },
      backgroundImage: {
        'glass-noise': "radial-gradient(1200px 600px at 10% -10%, rgba(79,70,229,0.10), transparent 60%), radial-gradient(800px 400px at 110% 10%, rgba(14,165,233,0.10), transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;


