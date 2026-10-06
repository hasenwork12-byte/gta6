import type { Config } from "tailwindcss";

// Accent colours are CSS variables (see src/app/globals.css) so the whole
// palette can be swapped in one place.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent-1) / <alpha-value>)",
        accent2: "rgb(var(--accent-2) / <alpha-value>)",
        good: "rgb(var(--good) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        marqueeY: {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-50%)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(-1.5deg)" },
          "50%": { transform: "translateY(-14px) rotate(1.5deg)" },
        },
        shadowPulse: {
          "0%, 100%": { transform: "scaleX(1)", opacity: "0.55" },
          "50%": { transform: "scaleX(0.82)", opacity: "0.3" },
        },
        // Coin falls into the pig's slot and vanishes behind the body.
        coinDrop: {
          "0%": { transform: "translateY(-20px) rotateY(0deg)", opacity: "0" },
          "15%": { opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "translateY(28px) rotateY(540deg)", opacity: "0" },
        },
        twinkle: {
          "0%, 100%": { transform: "scale(0.4)", opacity: "0" },
          "50%": { transform: "scale(1)", opacity: "1" },
        },
        burst: {
          "0%": { transform: "translate(0, 0) scale(0.6)", opacity: "1" },
          "100%": { transform: "translate(var(--dx), var(--dy)) scale(1)", opacity: "0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shadowPulse: "shadowPulse 6s ease-in-out infinite",
        coinDrop: "coinDrop 2.4s cubic-bezier(0.5, 0, 0.75, 0) infinite",
        twinkle: "twinkle 2.8s ease-in-out infinite",
        burst: "burst 1.1s cubic-bezier(0.2, 0.7, 0.3, 1) forwards",
        marquee: "marquee var(--marquee-duration, 40s) linear infinite",
        marqueeY: "marqueeY var(--marquee-duration, 30s) linear infinite",
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
