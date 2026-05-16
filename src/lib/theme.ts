"use client";
import { createTheme, type ThemeOptions } from "@mui/material/styles";

const shared: ThemeOptions = {
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.03em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700 },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    button: { fontWeight: 600, textTransform: "none" as const },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: "8px 20px" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backdropFilter: "blur(12px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { height: 4 },
        thumb: { width: 16, height: 16 },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    primary: { main: "#6366f1", light: "#818cf8", dark: "#4f46e5" },
    secondary: { main: "#7c3aed", light: "#a78bfa", dark: "#6d28d9" },
    success: { main: "#10b981", light: "#34d399", dark: "#059669" },
    warning: { main: "#d97706", light: "#fbbf24", dark: "#b45309" },
    error: { main: "#ef4444", light: "#f87171", dark: "#dc2626" },
    info: { main: "#0891b2", light: "#22d3ee", dark: "#0e7490" },
    background: { default: "#f4f6fb", paper: "#ffffff" },
    text: { primary: "#1e293b", secondary: "#475569" },
  },
});

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#818cf8", light: "#a5b4fc", dark: "#6366f1" },
    secondary: { main: "#a78bfa", light: "#c4b5fd", dark: "#7c3aed" },
    success: { main: "#34d399", light: "#6ee7b7", dark: "#10b981" },
    warning: { main: "#fbbf24", light: "#fcd34d", dark: "#d97706" },
    error: { main: "#f87171", light: "#fca5a5", dark: "#ef4444" },
    info: { main: "#22d3ee", light: "#67e8f9", dark: "#0891b2" },
    background: { default: "#0b0f19", paper: "#111827" },
    text: { primary: "#f1f5f9", secondary: "#94a3b8" },
  },
});
