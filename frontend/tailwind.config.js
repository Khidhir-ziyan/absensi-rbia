/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#20B2AA",
        "on-primary": "#ffffff",
        "primary-hover": "#1A9B93",
        ink: "#1A1A1A",
        "ink-muted": "#6B7280",
        canvas: "#ffffff",
        "surface-1": "#F9FAFB",
        "surface-2": "#F3F4F6",
        border: "#E5E7EB",
        "canvas-dark": "#1C1C1C",
        "surface-dark-1": "#252525",
        "surface-dark-2": "#2F2F2F",
        "border-dark": "#3A3A3A",
        "ink-dark": "#F9FAFB",
        "ink-muted-dark": "#9CA3AF",
        citation: "#20B2AA",
        "source-card": "#F0FDFC",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      maxWidth: {
        content: "720px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
        elevated: "0 4px 16px rgba(0,0,0,0.1)",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "16px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
