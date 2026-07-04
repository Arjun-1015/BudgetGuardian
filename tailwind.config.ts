import type { Config } from "tailwindcss";

// Design tokens — "financial weather" system.
// Light mode: green-tinted mist background, deep forest ink text.
// Dark mode: deep teal-charcoal background.
// Risk states read like weather: calm sage -> ochre -> storm rust.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        mist: "#F1F5F1",
        ink: "#182524",
        "ink-soft": "#3B4A47",
        charcoal: "#132422",
        "charcoal-soft": "#1C302D",
        brand: {
          DEFAULT: "#3F6E67",
          soft: "#6FA787",
          deep: "#264B45",
        },
        safe: "#6FA787",
        warning: "#D9A15B",
        danger: "#C25B4E",
        card: {
          light: "rgba(255,255,255,0.6)",
          dark: "rgba(28,48,45,0.55)",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "22px",
        pill: "999px",
      },
      backdropBlur: {
        glass: "18px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(24, 37, 36, 0.08)",
        "glass-dark": "0 8px 32px rgba(0, 0, 0, 0.35)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
