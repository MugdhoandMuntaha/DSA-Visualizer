import React from "react";
import { Box, Typography, Paper, useTheme, Chip } from "@mui/material";
import { motion } from "framer-motion";
import { SpreadSortState } from "@/hooks/useSpreadSort";

const BIN_COLORS = [
  "#6366f1", "#ec4899", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#a855f7", "#ef4444"
];

interface SpreadSortVisualizerProps {
  initialArray: number[];
  currentState: SpreadSortState | null;
}

export default function SpreadSortVisualizer({ initialArray, currentState }: SpreadSortVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const arr = currentState?.originalArr ?? initialArray.map((v, i) => ({ val: v, id: `ss-${i}` }));
  const bins = currentState?.bins ?? [];
  const { minVal, maxVal, numBins, phase, activeIdx, activeBin, activeBinItemIdx, subSortType } = currentState ?? {
    minVal: Math.min(...initialArray), maxVal: Math.max(...initialArray), numBins: Math.max(3, Math.min(6, Math.floor(initialArray.length / 2)))
  };

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, p: 3, overflowY: "auto", position: "relative", bgcolor: "background.default" }}>
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "white" : "black"} 1px, transparent 0)`,
        backgroundSize: "32px 32px" }} />

      {/* Main Array Row */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(99,102,241,0.2)", position: "relative", zIndex: 1,
          background: dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
        <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block", fontSize: "0.7rem" }}>
          {phase === "done" ? "✓ Sorted Array" : "Current Array"}
        </Typography>
        
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "flex-start" }}>
          {arr.map((item, idx) => {
            const isActive = phase === "distribute" && activeIdx === idx;
            const isDone = phase === "done";
            
            // Determine theoretical bin index to color it during distribute
            const theoreticalBin = phase === "distribute" ? Math.min(numBins - 1, Math.floor(((item.val - minVal) / Math.max(1, (maxVal - minVal + 1))) * numBins)) : -1;
            const color = (isDone || theoreticalBin >= 0) ? BIN_COLORS[(isDone ? 0 : theoreticalBin) % BIN_COLORS.length] : "#6366f1";
            
            let bg = dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.6)";
            let bd = dark ? "rgba(71,85,105,0.4)" : "rgba(148,163,184,0.3)";
            let shadow = "none";
            let op = 1;

            if (isDone) {
              bg = `${color}22`; bd = `${color}88`;
            } else if (isActive) {
              bg = `${color}33`; bd = color; shadow = `0 0 14px ${color}55`;
            } else if (phase !== "init" && phase !== "distribute" && phase !== "collect") {
              op = 0.2; // Dim main array when sorting bins
            }

            return (
              <Box key={item.id} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, opacity: op, transition: "opacity 0.3s" }}>
                <motion.div
                  layout
                  animate={{ scale: isActive ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10, background: bg, border: `2px solid ${bd}`, boxShadow: shadow }}
                >
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.05rem", color: isActive || isDone ? color : "text.primary" }}>
                    {item.val}
                  </Typography>
                </motion.div>
                <Typography variant="caption" sx={{ fontSize: "0.55rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>[{idx}]</Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Bins Grid */}
      {currentState && phase !== "init" && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(99,102,241,0.2)", position: "relative", zIndex: 1, flex: 1,
            background: dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.7rem" }}>
              Bins (Spread/Distribution Phase)
            </Typography>
            {phase === "sort-bins" && activeBin !== null && subSortType && (
              <Chip size="small" label={`Bin ${activeBin}: ${subSortType === "quick" ? "Quick Sort" : "Insertion Sort"} Fallback`} 
                sx={{ bgcolor: subSortType === "quick" ? "rgba(139,92,246,0.2)" : "rgba(236,72,153,0.2)", 
                      color: subSortType === "quick" ? "#a855f7" : "#ec4899", fontWeight: 700 }} />
            )}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${numBins}, 1fr)`, gap: 1.5 }}>
            {bins.map((bin, bIdx) => {
              const color = BIN_COLORS[bIdx % BIN_COLORS.length];
              const isActiveB = activeBin === bIdx;
              const rangeMin = Math.floor(minVal + (bIdx / numBins) * (maxVal - minVal + 1));
              const rangeMax = Math.floor(minVal + ((bIdx + 1) / numBins) * (maxVal - minVal + 1)) - 1;

              return (
                <Box key={`bin-${bIdx}`} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {/* Bin Header */}
                  <Box sx={{ width: "100%", py: 0.5, borderRadius: 1.5, bgcolor: `${color}15`, border: `1px solid ${color}44`,
                    textAlign: "center", boxShadow: isActiveB ? `0 0 10px ${color}44` : "none", transition: "all 0.3s" }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color, fontSize: "0.75rem" }}>Bin {bIdx}</Typography>
                    <Typography sx={{ fontSize: "0.55rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>[{rangeMin}–{rangeMax}]</Typography>
                  </Box>

                  {/* Bin Elements */}
                  <Box sx={{ minHeight: 120, width: "100%", borderRadius: 2, border: `2px ${isActiveB ? "solid" : "dashed"} ${isActiveB ? color : color + "33"}`,
                    bgcolor: `${color}05`, display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 0.5, p: 1, overflow: "hidden" }}>
                    {bin.map((item, iIdx) => {
                      const isItemActive = isActiveB && activeBinItemIdx === iIdx;
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.5, y: -20 }}
                          animate={{ opacity: 1, scale: isItemActive ? 1.1 : 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 350, damping: 22 }}
                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: 6, background: isItemActive ? `${color}44` : `${color}15`, 
                            border: `1.5px solid ${isItemActive ? color : color + "66"}`,
                            minHeight: 32, padding: "2px 0", boxShadow: isItemActive ? `0 0 10px ${color}66` : "none" }}
                        >
                          <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.85rem", color }}>{item.val}</Typography>
                        </motion.div>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
