"use client";
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import {
  lightTheme,
  darkTheme,
  draculaTheme,
  nordTheme,
  cyberpunkTheme,
  matrixTheme,
  solarizedTheme,
} from "@/lib/theme";

interface ThemeContextType {
  mode: "light" | "dark";
  themeName: string;
  setThemeName: (name: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  themeName: "default",
  setThemeName: () => {},
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const [themeName, setThemeNameState] = useState<string>("default");

  // Load from localStorage on client side mount
  useEffect(() => {
    const savedMode = localStorage.getItem("theme-mode") as "light" | "dark";
    if (savedMode) setMode(savedMode);
    
    const savedTheme = localStorage.getItem("theme-name");
    if (savedTheme) setThemeNameState(savedTheme);
  }, []);

  const setThemeName = useCallback((name: string) => {
    setThemeNameState(name);
    localStorage.setItem("theme-name", name);
    // Auto-adjust mode to dark for dark-only themes
    if (name !== "default") {
      setMode("dark");
      localStorage.setItem("theme-mode", "dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme-mode", next);
      return next;
    });
    // If they were on a custom theme and toggled, reset to default to make it look clean
    setThemeNameState("default");
    localStorage.setItem("theme-name", "default");
  }, []);

  const theme = useMemo(() => {
    switch (themeName) {
      case "dracula":
        return draculaTheme;
      case "nord":
        return nordTheme;
      case "cyberpunk":
        return cyberpunkTheme;
      case "matrix":
        return matrixTheme;
      case "solarized":
        return solarizedTheme;
      case "default":
      default:
        return mode === "light" ? lightTheme : darkTheme;
    }
  }, [themeName, mode]);

  return (
    <ThemeContext.Provider value={{ mode, themeName, setThemeName, toggleTheme }}>
      <AppRouterCacheProvider options={{ key: "mui" }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </ThemeContext.Provider>
  );
}
