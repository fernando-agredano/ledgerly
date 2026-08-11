import { createTheme } from "@mui/material/styles";

// Scoped MUI theme so Material components (used on the Dashboard page only)
// pick up the app's existing Inter typeface and navy/brand palette instead
// of Material's defaults, and don't clash visually with the Tailwind UI
// used everywhere else.
export const muiTheme = createTheme({
  palette: {
    primary: { main: "#3d72f4", dark: "#1e3a8a", light: "#93b8fd" },
    background: { default: "#f8fafc", paper: "#ffffff" },
    text: { primary: "#0f1c33", secondary: "#64748b" },
  },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 1px 2px rgba(15, 28, 51, 0.04), 0 2px 8px rgba(15, 28, 51, 0.04)",
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});
