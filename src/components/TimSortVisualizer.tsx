import React from "react";
import { Box, Typography, Paper, Chip, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { TimState } from "@/hooks/useTimSort";

const RUN_COLORS = [
  "#6366f1","#ec4899","#f97316","#eab308","#22c55e",
  "#14b8a6","#06b6d4","#3b82f6","#a855f7","#ef4444"
];

interface TimSortVisualizerProps {
  initialArray: number[];
  currentState: TimState | null;
}

export default function TimSortVisualizer({ initialArray, currentState }: TimSortVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const arr = currentState?.arr ?? initialArray.map((v, i) => ({ val: v, id: `t-${i}` }));
  const runs = currentState?.runs ?? [];
  const phase = currentState?.phase ?? "init";

  // Map each index to its run index
  const runOf: number[] = new Array(arr.length).fill(-1);
  runs.forEach(({ start, end }, r) => {
    for (let i = start; i <= end; i++) runOf[i] = r;
  });

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, p: 3, overflowY: "auto", position: "relative", bgcolor: "background.default" }}>
      {/* Background dots */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "white" : "black"} 1px, transparent 0)`,
        backgroundSize: "32px 32px" }} />

      {/* Phase badge */}
      {currentState && (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", position: "relative", zIndex: 1 }}>
          <Chip size="small" label={phase === "insertion-sort" ? "Phase 1: Insertion Sort Runs" : phase === "merging" ? "Phase 2: Merge Runs" : phase === "done" ? "✓ Done" : "Initialize"}
            sx={{ fontWeight: 700, bgcolor: phase === "insertion-sort" ? "rgba(99,102,241,0.2)" : phase === "merging" ? "rgba(6,182,212,0.2)" : phase === "done" ? "rgba(16,185,129,0.2)" : "rgba(100,116,139,0.2)",
              color: phase === "insertion-sort" ? "#818cf8" : phase === "merging" ? "#22d3ee" : phase === "done" ? "#34d399" : "text.secondary",
              border: "1px solid", borderColor: phase === "insertion-sort" ? "#6366f1" : phase === "merging" ? "#06b6d4" : phase === "done" ? "#10b981" : "divider"}} />
          {currentState.mergeSize !== null && (
            <Chip size="small" label={`Merge window: ${currentState.mergeSize}`}
              sx={{ fontWeight: 700, bgcolor: "rgba(234,179,8,0.15)", color: "#eab308", border: "1px solid #eab308" }} />
          )}
        </Box>
      )}

      {/* Main Array */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(99,102,241,0.2)", position: "relative", zIndex: 1,
          background: dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
        <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", mb: 2, display: "block", fontSize: "0.7rem" }}>
          {phase === "done" ? "✓ Sorted Array" : "Array"} — run boundaries color-coded
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "flex-start" }}>
          {arr.map((item, idx) => {
            const rIdx = runOf[idx];
            const color = rIdx >= 0 ? RUN_COLORS[rIdx % RUN_COLORS.length] : "#64748b";

            const isInsKey = currentState?.insKey?.id === item.id && phase === "insertion-sort";
            const isInsI = currentState?.insI === idx && phase === "insertion-sort";
            const isInsJ = currentState?.insJ === idx && phase === "insertion-sort";
            const isInMergeWindow = currentState?.mergeLeft !== null && currentState?.mergeRight !== null
              && idx >= (currentState?.mergeLeft ?? 0) && idx <= (currentState?.mergeRight ?? -1);
            const isMergeMid = currentState?.mergeMid === idx;

            let bg = `${color}18`;
            let bd = `${color}55`;
            let shadow = "none";
            let scale = 1;

            if (isInsKey) { bg = `${color}44`; bd = color; shadow = `0 0 14px ${color}66`; scale = 1.15; }
            else if (isInsI) { bg = `${color}30`; bd = color; shadow = `0 0 8px ${color}44`; scale = 1.05; }
            else if (isInsJ) { bg = "rgba(234,179,8,0.25)"; bd = "#eab308"; }
            else if (isMergeMid) { bg = "rgba(234,179,8,0.2)"; bd = "#eab308"; shadow = "0 0 12px rgba(234,179,8,0.4)"; }
            else if (isInMergeWindow && phase === "merging") { bg = "rgba(6,182,212,0.12)"; bd = "#06b6d466"; }

            if (phase === "done") { bg = `${color}20`; bd = `${color}88`; }

            return (
              <Box key={`arr-${idx}`} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                {/* Run color indicator dot */}
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color, opacity: 0.8 }} />
                <motion.div
                  layout
                  animate={{ scale }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10, background: bg, border: `2px solid ${bd}`, boxShadow: shadow }}
                >
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1rem", color }}>{item.val}</Typography>
                </motion.div>
                <Typography variant="caption" sx={{ fontSize: "0.5rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>[{idx}]</Typography>

                {/* Pointer labels */}
                <Box sx={{ height: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start" }}>
                  {isMergeMid && <Box sx={{ px: 0.6, py: 0.1, borderRadius: 0.5, bgcolor: "#eab308", color: "#fff", fontSize: "0.55rem", fontWeight: 800 }}>mid</Box>}
                  {isInsI && !isInsKey && <Box sx={{ px: 0.6, py: 0.1, borderRadius: 0.5, bgcolor: color, color: "#fff", fontSize: "0.55rem", fontWeight: 800 }}>i</Box>}
                  {isInsJ && <Box sx={{ px: 0.6, py: 0.1, borderRadius: 0.5, border: `1px solid #eab308`, color: "#eab308", fontSize: "0.55rem", fontWeight: 700 }}>j</Box>}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Run boundary labels */}
        {runs.length > 0 && phase !== "done" && (
          <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {runs.map(({ start, end }, r) => {
              const color = RUN_COLORS[r % RUN_COLORS.length];
              const isActive = currentState?.activeRun === r;
              return (
                <Box key={r} sx={{ px: 1.5, py: 0.4, borderRadius: 1.5, border: `1.5px solid ${color}${isActive ? "" : "66"}`,
                  bgcolor: `${color}${isActive ? "22" : "0d"}`,
                  boxShadow: isActive ? `0 0 10px ${color}44` : "none", transition: "all 0.3s ease" }}>
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.65rem", color }}>
                    Run[{r}]: [{start}–{end}]
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Extracted Key (during insertion sort) */}
      {currentState?.insKey && phase === "insertion-sort" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1, pl: 1 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>Extracted Key:</Typography>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 10, background: "rgba(139,92,246,0.25)", border: "2px solid #8b5cf6",
              boxShadow: "0 0 16px rgba(139,92,246,0.35)" }}
          >
            <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 900, color: "#8b5cf6", fontSize: "1.1rem" }}>
              {currentState.insKey.val}
            </Typography>
          </motion.div>
        </Box>
      )}
    </Box>
  );
}
