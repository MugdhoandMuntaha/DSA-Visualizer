"use client";
import { Box, Typography, Container, IconButton } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import DarkMode from "@mui/icons-material/DarkMode";
import LightMode from "@mui/icons-material/LightMode";
import { useThemeMode } from "@/components/ThemeRegistry";
import Link from "next/link";
import { CATEGORIZED_ALGORITHMS } from "@/lib/algorithms";
import AlgoCard from "@/components/AlgoCard";
import { use } from "react";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { mode, toggleTheme } = useThemeMode();
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  const categoryData = CATEGORIZED_ALGORITHMS.find(c => c.slug === slug);

  if (!categoryData) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h5" color="text.secondary">Category not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", bgcolor: "background.default" }}>
      {/* Blobs */}
      <Box className="ambient-blob" sx={{ width: 500, height: 500, bgcolor: "#818cf8", top: -120, left: -100, opacity: mode === "dark" ? 0.18 : 0.12 }} />
      <Box className="ambient-blob" sx={{ width: 400, height: 400, bgcolor: "#c4b5fd", bottom: -80, right: -60, opacity: mode === "dark" ? 0.18 : 0.12, animationDelay: "-7s" }} />
      <Box className="ambient-blob" sx={{ width: 350, height: 350, bgcolor: "#67e8f9", top: "40%", left: "50%", opacity: mode === "dark" ? 0.18 : 0.12, animationDelay: "-13s" }} />

      {/* Header */}
      <Box sx={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 1.5,
        background: mode === "dark" ? "rgba(11,15,25,0.82)" : "rgba(255,255,255,0.82)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton component={Link} href="/" size="small" sx={{ color: "text.secondary", mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)", borderRadius: 1, boxShadow: "0 0 20px rgba(124,58,237,0.15)" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="6" cy="14" r="3.5" fill="#60a5fa"/><circle cx="22" cy="6" r="3.5" fill="#a78bfa"/><circle cx="22" cy="22" r="3.5" fill="#34d399"/>
              <line x1="9" y1="13" x2="19" y2="7" stroke="#60a5fa" strokeWidth="1.5" opacity="0.7"/>
              <line x1="9" y1="15" x2="19" y2="21" stroke="#34d399" strokeWidth="1.5" opacity="0.7"/>
              <line x1="22" y1="9.5" x2="22" y2="18.5" stroke="#a78bfa" strokeWidth="1.5" opacity="0.7"/>
            </svg>
          </Box>
          <Typography variant="h6" sx={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Algorithm Visualizer</Typography>
        </Box>
        <IconButton onClick={toggleTheme} sx={{ color: "text.secondary" }}>
          {mode === "dark" ? <LightMode /> : <DarkMode />}
        </IconButton>
      </Box>

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, pt: 8, pb: 8 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
          {categoryData.category}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "text.secondary", mb: 6 }}>
          Select an algorithm to begin visualization.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 3 }}>
          {categoryData.algorithms.map(algo => <AlgoCard key={algo.title} {...algo} />)}
        </Box>
      </Container>
    </Box>
  );
}
