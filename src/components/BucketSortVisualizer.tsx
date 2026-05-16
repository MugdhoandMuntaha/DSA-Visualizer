import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { BktState, BUCKET_COLORS } from "@/hooks/useBucketSort";

interface BucketSortVisualizerProps {
  initialArray: number[];
  currentState: BktState | null;
}

export default function BucketSortVisualizer({ initialArray, currentState }: BucketSortVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const arr = currentState?.originalArr ?? initialArray.map((v, i) => ({ val: v, id: `v-${i}` }));
  const buckets = currentState?.buckets ?? [];
  const numBuckets = currentState?.numBuckets ?? Math.min(10, initialArray.length);

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
          {currentState?.phase === "done" ? "✓ Sorted Array" : "Current Array"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "flex-start" }}>
          {arr.map((item, idx) => {
            const isActive = currentState?.activeIdx === idx;
            const isDone = currentState?.phase === "done";

            // Determine which bucket this item would belong to to color it
            const bIdx = currentState
              ? Math.min(Math.floor((item.val / (currentState.maxVal + 1)) * numBuckets), numBuckets - 1)
              : -1;
            const bucketColor = bIdx >= 0 ? BUCKET_COLORS[bIdx % BUCKET_COLORS.length] : "#6366f1";

            let bg = dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.6)";
            let bd = dark ? "rgba(71,85,105,0.4)" : "rgba(148,163,184,0.3)";
            let shadow = "none";

            if (isDone) {
              bg = `${bucketColor}22`; bd = `${bucketColor}88`;
            } else if (isActive) {
              bg = `${bucketColor}33`; bd = bucketColor; shadow = `0 0 14px ${bucketColor}55`;
            }

            return (
              <Box key={`arr-${idx}`} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                <motion.div
                  layout
                  animate={{ scale: isActive ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10, background: bg, border: `2px solid ${bd}`, boxShadow: shadow }}
                >
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.05rem", color: isActive || isDone ? bucketColor : "text.primary" }}>
                    {item.val}
                  </Typography>
                </motion.div>
                <Typography variant="caption" sx={{ fontSize: "0.55rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>[{idx}]</Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Buckets Grid */}
      {currentState && currentState.phase !== "init" && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(99,102,241,0.2)", position: "relative", zIndex: 1, flex: 1,
            background: dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
          <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block", fontSize: "0.7rem" }}>
            Buckets (Range-Based)
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${numBuckets}, 1fr)`, gap: 1 }}>
            {buckets.map((bucket, bIdx) => {
              const color = BUCKET_COLORS[bIdx % BUCKET_COLORS.length];
              const isActiveBucket = currentState.activeBucket === bIdx;
              const rangeMin = Math.ceil((bIdx / numBuckets) * (currentState.maxVal + 1));
              const rangeMax = Math.ceil(((bIdx + 1) / numBuckets) * (currentState.maxVal + 1)) - 1;

              return (
                <Box key={`bucket-${bIdx}`} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
                  {/* Bucket header */}
                  <Box sx={{ width: "100%", py: 0.5, borderRadius: 1.5, bgcolor: `${color}22`, border: `1.5px solid ${color}66`,
                    textAlign: "center", boxShadow: isActiveBucket ? `0 0 14px ${color}60` : "none",
                    transition: "box-shadow 0.35s ease" }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color, fontSize: "0.75rem" }}>{bIdx}</Typography>
                    <Typography sx={{ fontSize: "0.5rem", color: `${color}bb`, fontFamily: "var(--font-mono)" }}>
                      [{rangeMin}–{rangeMax}]
                    </Typography>
                  </Box>

                  {/* Bucket body */}
                  <Box sx={{ minHeight: 100, width: "100%", borderRadius: 1.5, border: `1px dashed ${color}44`,
                    bgcolor: `${color}08`, display: "flex", flexDirection: "column-reverse", alignItems: "center",
                    gap: 0.5, p: 0.5, overflow: "hidden" }}>
                    {bucket.map((item, iIdx) => {
                      const isSorting = isActiveBucket && currentState.phase === "sort-bucket"
                        && currentState.activeBucketItemIdx === iIdx;
                      return (
                        <motion.div
                          key={`b${bIdx}-i${iIdx}`}
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: isSorting ? 1.1 : 1, backgroundColor: isSorting ? `${color}60` : `${color}30` }}
                          transition={{ type: "spring", stiffness: 350, damping: 22 }}
                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: 6, border: `1.5px solid ${isSorting ? color : color + "70"}`,
                            minHeight: 28, padding: "2px 0" }}
                        >
                          <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.7rem", color }}>{item.val}</Typography>
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
