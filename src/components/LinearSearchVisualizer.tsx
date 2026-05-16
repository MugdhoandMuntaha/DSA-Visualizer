import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { LSState } from "@/hooks/useLinearSearch";

interface LinearSearchVisualizerProps {
  initialArray: number[];
  currentState: LSState | null;
}

export default function LinearSearchVisualizer({ initialArray, currentState }: LinearSearchVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const arrToRender = currentState ? currentState.originalArr : initialArray.map((v, i) => ({ val: v, id: `v-${v}-${i}` }));

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 4, overflowY: "auto", position: "relative", bgcolor: "background.default", alignItems: "center", justifyContent: "center" }}>
      {/* Dynamic Background Pattern */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "white" : "black"} 1px, transparent 0)`,
        backgroundSize: "32px 32px" }} />

      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 6, borderColor: "rgba(99,102,241,0.2)",
          background: dark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", width: "100%", maxWidth: 900 }}>
        
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
           <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary" }}>Linear Search</Typography>
           {currentState && (
               <Typography variant="h6" sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: currentState.phase === "found" ? "#10b981" : currentState.phase === "not-found" ? "#ef4444" : "primary.main" }}>
                   Target: {currentState.target}
               </Typography>
           )}
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", minHeight: 120 }}>
          {arrToRender.map((item, idx) => {
            
            let isPast = false;
            let isCurr = false;

            if (currentState && currentState.phase !== "init") {
                if (currentState.currIdx !== null && idx < currentState.currIdx) {
                    isPast = true;
                }
                if (idx === currentState.currIdx) isCurr = true;
                if (currentState.phase === "not-found") isPast = true; // All elements checked
            }

            let bg = dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.6)";
            let bd = dark ? "rgba(71,85,105,0.4)" : "rgba(148,163,184,0.3)";
            let cl = "text.primary";
            let shadow = "none";

            if (isCurr) {
              if (currentState?.phase === "found") {
                  bg = "rgba(16,185,129,0.2)"; bd = "#10b981"; cl = "#10b981"; shadow = "0 0 16px rgba(16,185,129,0.3)";
              } else if (currentState?.type === "not-found") {
                  // Should theoretically not happen as curr is null when not found, but safety
                  bg = "rgba(239,68,68,0.2)"; bd = "#ef4444"; cl = "#ef4444"; shadow = "0 0 16px rgba(239,68,68,0.3)";
              } else {
                  bg = "rgba(234,179,8,0.2)"; bd = "#eab308"; cl = "#eab308"; shadow = "0 0 16px rgba(234,179,8,0.3)";
              }
            } else if (!isPast && currentState && currentState.phase !== "init") {
              bg = "rgba(99,102,241,0.1)"; bd = "#6366f1";
            }

            return (
              <Box key={item.id} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, opacity: isPast ? 0.3 : 1, transition: "opacity 0.4s ease" }}>
                <Typography variant="caption" sx={{ fontSize: "0.6rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>[{idx}]</Typography>
                <motion.div
                  layout
                  initial={{ scale: 0.9 }}
                  animate={{ scale: isCurr ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 12, background: bg, border: `2px solid ${bd}`,
                    boxShadow: shadow, position: "relative"
                  }}
                >
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: cl, fontSize: "1.2rem" }}>{item.val}</Typography>
                </motion.div>
                
                {/* Pointer Indicators */}
                <Box sx={{ height: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", pt: 0.5, gap: 0.5 }}>
                   {isCurr && <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, bgcolor: currentState?.phase === "found" ? "#10b981" : "#eab308", color: "#fff", fontSize: "0.7rem", fontWeight: 800 }}>i</Box>}
                </Box>
              </Box>
            );
          })}
        </Box>

      </Paper>
    </Box>
  );
}
