"use client";
import { Box, Typography, Card, CardContent, IconButton, Container } from "@mui/material";
import DarkMode from "@mui/icons-material/DarkMode";
import LightMode from "@mui/icons-material/LightMode";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { useThemeMode } from "@/components/ThemeRegistry";
import Link from "next/link";
import { CATEGORIZED_ALGORITHMS } from "@/lib/algorithms";

export default function HomePage() {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden",
      bgcolor: "background.default" }}>
      {/* Blobs */}
      <Box className="ambient-blob" sx={{ width: 500, height: 500, bgcolor: "#818cf8", top: -120, left: -100, opacity: mode === "dark" ? 0.18 : 0.12 }} />
      <Box className="ambient-blob" sx={{ width: 400, height: 400, bgcolor: "#c4b5fd", bottom: -80, right: -60, opacity: mode === "dark" ? 0.18 : 0.12, animationDelay: "-7s" }} />
      <Box className="ambient-blob" sx={{ width: 350, height: 350, bgcolor: "#67e8f9", top: "40%", left: "50%", opacity: mode === "dark" ? 0.18 : 0.12, animationDelay: "-13s" }} />

      {/* Header */}
      <Box sx={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 1.5,
        background: mode === "dark" ? "rgba(11,15,25,0.82)" : "rgba(255,255,255,0.82)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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

      {/* Hero */}
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, pt: 8, pb: 4, textAlign: "center" }}>
        <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 800, mb: 2,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa, #22d3ee)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          See Algorithms Come Alive
        </Typography>
        <Typography variant="h6" sx={{ color: "text.secondary", fontWeight: 400, maxWidth: 600, mx: "auto", mb: 6, lineHeight: 1.7 }}>
          Build graphs, run algorithms step-by-step, and watch data structures update in real time with beautiful animations.
        </Typography>

        {/* Categories Grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 4, textAlign: "left", pb: 8 }}>
          {CATEGORIZED_ALGORITHMS.map(group => (
            <Card key={group.slug} component={Link} href={`/category/${group.slug}`} elevation={0} sx={{ 
              textDecoration: "none", display: "block", position: "relative",
              bgcolor: (t) => t.palette.mode === "dark" ? "rgba(17,24,39,0.65)" : "rgba(255,255,255,0.75)",
              backdropFilter: "blur(20px)", border: "1px solid", borderColor: "divider", overflow: "hidden", borderRadius: 3,
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: "translateY(-6px)",
                borderColor: `${group.color}60`,
                boxShadow: `0 12px 40px ${group.color}20`,
                "& .arrow-icon": { transform: "translateX(6px)", color: group.color, opacity: 1 },
                "& .bg-icon": { transform: "scale(1.1) rotate(-5deg)", opacity: mode === "dark" ? 0.15 : 0.08 }
              }
            }}>
              {/* Subtle background SVG */}
              <Box className="bg-icon" sx={{ position: "absolute", right: -20, bottom: -20, width: 140, height: 140, color: group.color, opacity: mode === "dark" ? 0.05 : 0.03, transition: "all 0.5s ease" }}>
                {group.icon}
              </Box>

              <CardContent sx={{ p: 4, position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Box sx={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 2, background: `linear-gradient(135deg, ${group.color}, ${group.color}99)`,
                      boxShadow: `0 0 20px ${group.color}40`, color: "#fff" }}>
                      {group.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {group.category}
                    </Typography>
                  </Box>
                  <ArrowForward className="arrow-icon" sx={{ color: "text.disabled", opacity: 0.7, transition: "all 0.3s ease", mt: 1 }} />
                </Box>
                <Typography variant="body1" sx={{ color: "text.secondary", mb: 3, lineHeight: 1.6 }}>
                  Explore {group.algorithms.length} algorithms including {group.algorithms.slice(0, 2).map(a => a.title).join(", ")} and more.
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {group.algorithms.slice(0, 3).map(algo => (
                    <Box key={algo.title} sx={{ 
                      px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: "0.75rem", fontWeight: 700,
                      bgcolor: `${group.color}15`, color: mode === "dark" ? `${group.color}` : `${group.color}`, border: `1px solid ${group.color}30`
                    }}>
                      {algo.title}
                    </Box>
                  ))}
                  {group.algorithms.length > 3 && (
                    <Box sx={{ 
                      px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: "0.75rem", fontWeight: 700,
                      bgcolor: "transparent", color: "text.secondary" 
                    }}>
                      +{group.algorithms.length - 3} more
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", py: 4, mt: 4 }}>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          Built with Next.js, Material UI & TailwindCSS • More algorithms coming soon
        </Typography>
      </Box>
    </Box>
  );
}
