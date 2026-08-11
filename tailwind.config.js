/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        navy: {
          50: "#f5f7fb",
          100: "#e7ecf5",
          200: "#c7d3e7",
          300: "#9bb0d2",
          400: "#6985b3",
          500: "#476299",
          600: "#324b7e",
          700: "#263a64",
          800: "#1a2942",
          900: "#0f1c33",
          950: "#08111f",
        },
        brand: {
          50: "#eff5ff",
          100: "#dbe7fe",
          200: "#bfd4fe",
          300: "#93b8fd",
          400: "#6092f9",
          500: "#3d72f4",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 28, 51, 0.04), 0 2px 8px rgba(15, 28, 51, 0.04)",
        "card-hover":
          "0 2px 4px rgba(15, 28, 51, 0.06), 0 8px 24px rgba(15, 28, 51, 0.08)",
      },
    },
  },
  plugins: [],
};
