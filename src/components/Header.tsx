"use client";
import React, { useState } from "react";
import { AppBar, Toolbar, Typography, IconButton, Chip, Box, Menu, MenuItem } from "@mui/material";
import DarkMode from "@mui/icons-material/DarkMode";
import LightMode from "@mui/icons-material/LightMode";
import Home from "@mui/icons-material/Home";
import Palette from "@mui/icons-material/Palette";
import Circle from "@mui/icons-material/Circle";
import { useThemeMode } from "@/components/ThemeRegistry";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  badge?: string;
}

const THEMES = [
  { id: "default", name: "Default (Slate)", color: "#6366f1" },
  { id: "dracula", name: "Dracula (Vampire)", color: "#bd93f9" },
  { id: "nord", name: "Nordic Frost", color: "#88c0d0" },
  { id: "cyberpunk", name: "Cyberpunk 2077", color: "#fbc531" },
  { id: "matrix", name: "Hacker Matrix", color: "#00ff66" },
  { id: "solarized", name: "Solarized Dark", color: "#268bd2" },
];

export default function Header({ title = "Algorithm Visualizer", badge }: HeaderProps) {
  const { mode, themeName, setThemeName, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenThemeMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseThemeMenu = () => {
    setAnchorEl(null);
  };
  const handleSelectTheme = (name: string) => {
    setThemeName(name);
    handleCloseThemeMenu();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: mode === "dark"
          ? "rgba(11, 15, 25, 0.82)"
          : "rgba(255, 255, 255, 0.82)",
        backdropFilter: "blur(16px)",
        borderBottom: 1,
        borderColor: "rgba(99, 102, 241, 0.15)",
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: "56px !important" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
              borderRadius: 1,
              boxShadow: "0 0 20px rgba(124, 58, 237, 0.15)",
              mr: 1.5,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="6" cy="14" r="3.5" fill="#60a5fa" />
              <circle cx="22" cy="6" r="3.5" fill="#a78bfa" />
              <circle cx="22" cy="22" r="3.5" fill="#34d399" />
              <line x1="9" y1="13" x2="19" y2="7" stroke="#60a5fa" strokeWidth="1.5" opacity="0.7" />
              <line x1="9" y1="15" x2="19" y2="21" stroke="#34d399" strokeWidth="1.5" opacity="0.7" />
              <line x1="22" y1="9.5" x2="22" y2="18.5" stroke="#a78bfa" strokeWidth="1.5" opacity="0.7" />
            </svg>
          </Box>
        </Link>

        <Typography
          variant="h6"
          sx={{
            fontSize: "1.15rem",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            flexGrow: 0,
          }}
        >
          {title}
        </Typography>

        {badge && (
          <Chip
            label={badge}
            size="small"
            sx={{
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              bgcolor: "rgba(99, 102, 241, 0.12)",
              color: "secondary.main",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          />
        )}

        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          component={Link}
          href="/"
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <Home fontSize="small" />
        </IconButton>

        <IconButton onClick={handleOpenThemeMenu} size="small" sx={{ color: "text.secondary" }}>
          <Palette fontSize="small" />
        </IconButton>

        <IconButton onClick={toggleTheme} size="small" sx={{ color: "text.secondary" }}>
          {mode === "dark" ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseThemeMenu}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                background: mode === "dark" ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
                borderRadius: 2,
                minWidth: 190,
              }
            }
          }}
        >
          {THEMES.map((themeOption) => (
            <MenuItem 
              key={themeOption.id} 
              selected={themeName === themeOption.id}
              onClick={() => handleSelectTheme(themeOption.id)}
              sx={{ py: 1, display: "flex", alignItems: "center", gap: 1.5 }}
            >
              <Circle sx={{ color: themeOption.color, fontSize: 10 }} />
              <Typography sx={{ fontSize: "0.85rem", fontWeight: themeName === themeOption.id ? 700 : 500 }}>
                {themeOption.name}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
