/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        "surface-2": "var(--bg-surface-2)",
        "surface-3": "var(--bg-surface-3)",
        "th-border": "var(--border)",
        "th-border-hover": "var(--border-hover)",
        "th-text": "var(--text-primary)",
        "th-muted": "var(--text-secondary)",
      },
      fontFamily: {
        heading: ["Sora", "system-ui", "sans-serif"],
        body: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.15)",
        "glow-lg":
          "0 0 30px rgba(99, 102, 241, 0.2), 0 0 60px rgba(6, 182, 212, 0.06)",
        "glow-sm": "0 0 10px rgba(99, 102, 241, 0.1)",
      },
    },
  },
  plugins: [],
};
