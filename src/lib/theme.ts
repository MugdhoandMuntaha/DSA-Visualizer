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

export const draculaTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#bd93f9", light: "#d6bcfa", dark: "#9b66f2" },
    secondary: { main: "#ff79c6", light: "#ff9ecd", dark: "#ff4da6" },
    success: { main: "#50fa7b", light: "#85fc9e", dark: "#1bf953" },
    warning: { main: "#f1fa8c", light: "#f7fca8", dark: "#e2f754" },
    error: { main: "#ff5555", light: "#ff8080", dark: "#ff1a1a" },
    info: { main: "#8be9fd", light: "#b3f2fe", dark: "#4ce0fc" },
    background: { default: "#1e1f29", paper: "#282a36" },
    text: { primary: "#f8f8f2", secondary: "#6272a4" },
  },
});

export const nordTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#88c0d0", light: "#8fbcbb", dark: "#5e81ac" },
    secondary: { main: "#81a1c1", light: "#88c0d0", dark: "#4c566a" },
    success: { main: "#a3be8c", light: "#b5cca2", dark: "#8fae73" },
    warning: { main: "#ebcb8b", light: "#f1dca4", dark: "#e2b65e" },
    error: { main: "#bf616a", light: "#cc8289", dark: "#b0444f" },
    info: { main: "#8fbcbb", light: "#a3c8c7", dark: "#729f9e" },
    background: { default: "#2e3440", paper: "#3b4252" },
    text: { primary: "#d8dee9", secondary: "#4c566a" },
  },
});

export const cyberpunkTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#f1c40f", light: "#fde396", dark: "#e1a81e" },
    secondary: { main: "#e84393", light: "#ffb4d2", dark: "#e24b80" },
    success: { main: "#2ecc71", light: "#66ffb3", dark: "#00a852" },
    warning: { main: "#e67e22", light: "#f8a593", dark: "#c74d32" },
    error: { main: "#d63031", light: "#ff9999", dark: "#cc0000" },
    info: { main: "#00a8ff", light: "#80fff4", dark: "#00bfa9" },
    background: { default: "#0b0914", paper: "#161224" },
    text: { primary: "#f5f6fa", secondary: "#a4b0be" },
  },
});

export const matrixTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#00ff66", light: "#66ff99", dark: "#00cc44" },
    secondary: { main: "#00cc44", light: "#33ff77", dark: "#008822" },
    success: { main: "#00ff66", light: "#88ffaa", dark: "#00aa44" },
    warning: { main: "#adff2f", light: "#bbff66", dark: "#66cc00" },
    error: { main: "#ff3333", light: "#ff8888", dark: "#cc0000" },
    info: { main: "#33ffcc", light: "#88ffe6", dark: "#00cc99" },
    background: { default: "#060a07", paper: "#0d140e" },
    text: { primary: "#d5ffd5", secondary: "#008833" },
  },
});

export const solarizedTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#268bd2", light: "#74b9ff", dark: "#1b6ca3" },
    secondary: { main: "#d33682", light: "#ff7675", dark: "#9c350c" },
    success: { main: "#859900", light: "#a4b0be", dark: "#587200" },
    warning: { main: "#b58900", light: "#fed330", dark: "#806000" },
    error: { main: "#dc322f", light: "#ff7675", dark: "#b31b1b" },
    info: { main: "#2aa198", light: "#81ecec", dark: "#1f7d75" },
    background: { default: "#002b36", paper: "#073642" },
    text: { primary: "#93a1a1", secondary: "#586e75" },
  },
});
