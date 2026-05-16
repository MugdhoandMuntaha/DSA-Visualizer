import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { SelState } from "@/hooks/useSelectionSort";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface SelectionSortVisualizerProps {
  initialArray: number[];
  currentState: SelState | null;
}

export default function SelectionSortVisualizer({ initialArray, currentState }: SelectionSortVisualizerProps) {
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
           <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary" }}>Selection Sort</Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", minHeight: 120 }}>
          {arrToRender.map((item, idx) => {
            
            let isSorted = false;
            let isTarget = false;
            let isMin = false;
            let isScan = false;
            let isSwapping = false;

            if (currentState && currentState.phase !== "init") {
                if (idx < currentState.sortedUpTo) isSorted = true;
                if (currentState.phase === "done") isSorted = true;
                if (idx === currentState.i) isTarget = true;
                if (idx === currentState.minIdx) isMin = true;
                if (idx === currentState.j) isScan = true;
                if (currentState.phase === "swapping" && (isTarget || isMin)) isSwapping = true;
            }

            let bg = dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.6)";
            let bd = dark ? "rgba(71,85,105,0.4)" : "rgba(148,163,184,0.3)";
            let cl = "text.primary";
            let shadow = "none";

            if (isSorted) {
                bg = "rgba(16,185,129,0.15)"; bd = "#10b981"; cl = "#10b981";
            } else if (isSwapping) {
                bg = "rgba(139,92,246,0.3)"; bd = "#8b5cf6"; cl = "#8b5cf6"; shadow = "0 0 16px rgba(139,92,246,0.4)";
            } else if (isMin) {
                bg = "rgba(249,115,22,0.2)"; bd = "#f97316"; cl = "#f97316"; shadow = "0 0 16px rgba(249,115,22,0.3)";
            } else if (isScan) {
                bg = "rgba(6,182,212,0.2)"; bd = "#06b6d4"; cl = "#06b6d4"; shadow = "0 0 16px rgba(6,182,212,0.3)";
            } else if (isTarget) {
                bg = "transparent"; bd = "#6366f1"; cl = "text.primary";
            }

            return (
              <Box key={item.id} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" sx={{ fontSize: "0.6rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>[{idx}]</Typography>
                <motion.div
                  layout
                  initial={{ scale: 0.9 }}
                  animate={{ scale: isSwapping ? 1.1 : isScan || isMin ? 1.05 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 12, background: bg, border: `2px ${isTarget && !isSwapping ? "dashed" : "solid"} ${bd}`,
                    boxShadow: shadow, position: "relative"
                  }}
                >
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: cl, fontSize: "1.2rem" }}>{item.val}</Typography>
                  {isSorted && (
                    <Box sx={{ position: "absolute", top: -6, right: -6, bgcolor: "background.paper", borderRadius: "50%" }}>
                       <CheckCircleIcon sx={{ fontSize: 16, color: "#10b981" }} />
                    </Box>
                  )}
                </motion.div>
                
                {/* Pointer Indicators */}
                <Box sx={{ height: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", pt: 0.5, gap: 0.5 }}>
                   {isTarget && !isSorted && <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, border: "1px solid #6366f1", color: "#6366f1", fontSize: "0.6rem", fontWeight: 800 }}>i (target)</Box>}
                   {isMin && !isSorted && <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, bgcolor: "#f97316", color: "#fff", fontSize: "0.6rem", fontWeight: 800 }}>min</Box>}
                   {isScan && !isSorted && <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, bgcolor: "#06b6d4", color: "#fff", fontSize: "0.6rem", fontWeight: 800 }}>j</Box>}
                </Box>
              </Box>
            );
          })}
        </Box>

      </Paper>
    </Box>
  );
}
