import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { PHState } from "@/hooks/usePigeonholeSort";

interface PigeonholeSortVisualizerProps {
  initialArray: number[];
  currentState: PHState | null;
}

// Generate a hue from hole index for coloring
const holeColor = (h: number, total: number) => {
  const hue = Math.round((h / Math.max(total - 1, 1)) * 260) + 20; // 20–280 range
  return `hsl(${hue}, 80%, 60%)`;
};

export default function PigeonholeSortVisualizer({ initialArray, currentState }: PigeonholeSortVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const arr = currentState?.originalArr ?? initialArray.map((v, i) => ({ val: v, id: `ph-${i}` }));
  const holes = currentState?.holes ?? [];
  const minVal = currentState?.minVal ?? 0;
  const range = holes.length;

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, p: 3, overflowY: "auto", position: "relative", bgcolor: "background.default" }}>
      {/* Background dots */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "white" : "black"} 1px, transparent 0)`,
        backgroundSize: "32px 32px" }} />

      {/* Main Array Row */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(99,102,241,0.2)", position: "relative", zIndex: 1,
          background: dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
        <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block", fontSize: "0.7rem" }}>
          {currentState?.phase === "done" ? "✓ Sorted Array" : "Input Array"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "flex-start" }}>
          {arr.map((item, idx) => {
            const isActive = currentState?.activeIdx === idx;
            const isDone = currentState?.phase === "done";
            // Determine hole for color
            const hIdx = currentState ? item.val - minVal : -1;
            const color = hIdx >= 0 && hIdx < range ? holeColor(hIdx, range) : "#6366f1";

            let bg = dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.6)";
            let bd = dark ? "rgba(71,85,105,0.4)" : "rgba(148,163,184,0.3)";
            let shadow = "none";

            if (isDone) { bg = `${color}22`; bd = `${color}99`; }
            else if (isActive) { bg = `${color}33`; bd = color; shadow = `0 0 14px ${color}66`; }

            return (
              <Box key={`arr-${idx}`} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                <motion.div
                  layout
                  animate={{ scale: isActive ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10, background: bg, border: `2px solid ${bd}`, boxShadow: shadow }}
                >
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.05rem",
                    color: (isActive || isDone) ? color : "text.primary" }}>{item.val}</Typography>
                </motion.div>
                <Typography variant="caption" sx={{ fontSize: "0.55rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>[{idx}]</Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Holes Grid */}
      {currentState && currentState.phase !== "init" && range > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(99,102,241,0.2)", position: "relative", zIndex: 1, flex: 1,
            background: dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.7rem" }}>
              Pigeonholes (hole[i] = count of value {minVal} + i)
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              Range: {currentState.minVal} – {currentState.maxVal} ({range} holes)
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {holes.map((count, h) => {
              const color = holeColor(h, range);
              const isActive = currentState.activeHole === h;
              const val = h + minVal;

              return (
                <Box key={`hole-${h}`} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, minWidth: 54 }}>
                  {/* Value label */}
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.7rem", color }}>
                    val={val}
                  </Typography>

                  {/* Hole container — birds stacked */}
                  <Box sx={{ width: 52, minHeight: 80, borderRadius: 1.5, border: `1.5px ${isActive ? "solid" : "dashed"} ${isActive ? color : color + "55"}`,
                    bgcolor: `${color}${isActive ? "18" : "08"}`, display: "flex", flexDirection: "column-reverse",
                    alignItems: "center", gap: 0.4, p: 0.5, overflow: "hidden",
                    boxShadow: isActive ? `0 0 14px ${color}55` : "none",
                    transition: "box-shadow 0.3s ease, border-color 0.3s ease" }}>
                    {Array.from({ length: count }).map((_, k) => (
                      <motion.div
                        key={`hole-${h}-bird-${k}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        style={{ width: 36, height: 26, borderRadius: 6, background: `${color}40`,
                          border: `1.5px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.7rem", color }}>{val}</Typography>
                      </motion.div>
                    ))}
                  </Box>

                  {/* Count badge */}
                  <Box sx={{ px: 0.8, py: 0.1, borderRadius: 1, bgcolor: count > 0 ? `${color}22` : "transparent",
                    border: `1px solid ${count > 0 ? color + "66" : "transparent"}` }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.65rem",
                      color: count > 0 ? color : "text.disabled" }}>×{count}</Typography>
                  </Box>

                  {/* Hole index */}
                  <Typography variant="caption" sx={{ fontSize: "0.5rem", color: "text.disabled", fontFamily: "var(--font-mono)" }}>
                    [{h}]
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
