import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { RadixState } from "@/hooks/useRadixSort";

const BUCKET_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e","#14b8a6",
  "#06b6d4","#3b82f6","#8b5cf6","#a855f7","#ec4899"
];

interface RadixSortVisualizerProps {
  initialArray: number[];
  currentState: RadixState | null;
}

export default function RadixSortVisualizer({ initialArray, currentState }: RadixSortVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const arr = currentState?.originalArr ?? initialArray.map((v, i) => ({ val: v, id: `v-${v}-${i}` }));

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, p: 3, overflowY: "auto", position: "relative", bgcolor: "background.default" }}>
      {/* Background dots */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "white" : "black"} 1px, transparent 0)`,
        backgroundSize: "32px 32px" }} />

      {/* Pass badge */}
      {currentState && currentState.phase !== "init" && currentState.phase !== "done" && (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", position: "relative", zIndex: 1 }}>
          <Box sx={{ px: 2, py: 0.5, borderRadius: 2, bgcolor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
              Pass {currentState.pass} / {currentState.totalPasses} — Sorting by{" "}
              <Box component="span" sx={{ color: "#eab308", fontWeight: 900 }}>{currentState.digitLabel}</Box> digit
            </Typography>
          </Box>
        </Box>
      )}

      {/* Main Array Row */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(99,102,241,0.2)", position: "relative", zIndex: 1,
          background: dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
        <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block", fontSize: "0.7rem" }}>
          Current Array
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "flex-start" }}>
          {arr.map((item, idx) => {
            const isActive = currentState?.activeIdx === idx;
            const bg = isActive ? "rgba(234,179,8,0.25)" : dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.6)";
            const bd = isActive ? "#eab308" : dark ? "rgba(71,85,105,0.4)" : "rgba(148,163,184,0.3)";
            const shadow = isActive ? "0 0 14px rgba(234,179,8,0.35)" : "none";

            return (
              <Box key={`arr-pos-${idx}`} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                <motion.div
                  layout
                  animate={{ scale: isActive ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10, background: bg, border: `2px solid ${bd}`, boxShadow: shadow }}
                >
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.05rem" }}>{item.val}</Typography>
                </motion.div>
                <Typography variant="caption" sx={{ fontSize: "0.55rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>[{idx}]</Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Buckets */}
      {currentState && currentState.phase !== "init" && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(99,102,241,0.2)", position: "relative", zIndex: 1, flex: 1,
            background: dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
          <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block", fontSize: "0.7rem" }}>
            Digit Buckets (0 – 9)
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 1 }}>
            {currentState.buckets.map((bucket, bIdx) => {
              const color = BUCKET_COLORS[bIdx];
              const isActiveBucket = currentState.activeBucket === bIdx;

              return (
                <Box key={bIdx} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
                  {/* Bucket header */}
                  <Box sx={{ width: "100%", py: 0.5, borderRadius: 1.5, bgcolor: `${color}22`, border: `1.5px solid ${color}66`,
                    textAlign: "center", boxShadow: isActiveBucket ? `0 0 12px ${color}50` : "none",
                    transition: "box-shadow 0.3s ease" }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color, fontSize: "0.9rem" }}>{bIdx}</Typography>
                  </Box>

                  {/* Bucket body — items stack bottom up */}
                  <Box sx={{ minHeight: 120, width: "100%", borderRadius: 1.5, border: `1px dashed ${color}44`,
                    bgcolor: `${color}08`, display: "flex", flexDirection: "column-reverse", alignItems: "center",
                    gap: 0.5, p: 0.5, overflow: "hidden" }}>
                    {bucket.map((item, iIdx) => (
                      <motion.div
                        key={`bucket-${bIdx}-item-${iIdx}`}
                        initial={{ opacity: 0, scale: 0.7, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 22, delay: iIdx * 0.03 }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: 6, background: `${color}30`, border: `1.5px solid ${color}80`,
                          minHeight: 30, padding: "2px 0" }}
                      >
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.75rem", color }}>{item.val}</Typography>
                      </motion.div>
                    ))}
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
