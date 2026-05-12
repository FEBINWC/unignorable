module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./src/**/*.component.ts",
  ],
  theme: {
    extend: {
      colors: {
        primary: { light: "#ff8c42", DEFAULT: "#e85d04", dark: "#c94d00" },
        accent: { light: "#2a2a2a", DEFAULT: "#1a1a1a", dark: "#111111" },
        surface: { light: "#2a2a2a", DEFAULT: "#1e1e1e", dark: "#141414" },
        success: { light: "#4caf50", DEFAULT: "#2e7d32", dark: "#1b5e20" },
        warning: { light: "#ffb74d", DEFAULT: "#ff9800", dark: "#e65100" },
        error: { light: "#ef5350", DEFAULT: "#d32f2f", dark: "#b71c1c" },
        exam: "#e85d04",
        sales: "#4caf50",
        coding: "#bb86fc",
      },
    },
  },
  plugins: [],
};
