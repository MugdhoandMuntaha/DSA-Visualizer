"use client";
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { lightTheme, darkTheme } from "@/lib/theme";

interface ThemeContextType {
  mode: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const theme = useMemo(() => (mode === "light" ? lightTheme : darkTheme), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <AppRouterCacheProvider options={{ key: "mui" }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </ThemeContext.Provider>
  );
}
