import React from "react";
import { Box, Typography, Paper, Chip, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { IntroState } from "@/hooks/useIntroSort";

interface IntroSortVisualizerProps {
  initialArray: number[];
  currentState: IntroState | null;
}

export default function IntroSortVisualizer({ initialArray, currentState }: IntroSortVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const arr = currentState?.arr ?? initialArray.map((v, i) => ({ val: v, id: `in-${i}` }));
  const phase = currentState?.phase ?? "init";
  const { activeRange, pivotIdx, i: qsI, j: qsJ, heapSize, activeNode, compareNode, insI, insJ } = currentState ?? {};

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, p: 3, overflowY: "auto", position: "relative", bgcolor: "background.default" }}>
      {/* Background dots */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "white" : "black"} 1px, transparent 0)`,
        backgroundSize: "32px 32px" }} />

      {/* Phase Badges */}
      {currentState && (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={phase === "quick-sort" ? "Primary: Quick Sort" : phase === "heap-sort" ? "Fallback: Heap Sort" : phase === "insertion-sort" ? "Optimization: Insertion Sort" : phase === "done" ? "✓ Done" : "Initialize"}
            sx={{ fontWeight: 700, 
              bgcolor: phase === "quick-sort" ? "rgba(99,102,241,0.2)" : phase === "heap-sort" ? "rgba(249,115,22,0.2)" : phase === "insertion-sort" ? "rgba(16,185,129,0.2)" : "rgba(100,116,139,0.2)",
              color: phase === "quick-sort" ? "#818cf8" : phase === "heap-sort" ? "#f97316" : phase === "insertion-sort" ? "#34d399" : "text.secondary",
              border: "1px solid", borderColor: phase === "quick-sort" ? "#6366f1" : phase === "heap-sort" ? "#ea580c" : phase === "insertion-sort" ? "#10b981" : "divider"}} />
          
          {phase !== "done" && phase !== "init" && (
             <Chip size="small" label={`Recursion Depth: ${currentState.currentDepth} / ${currentState.depthLimit}`}
               sx={{ fontWeight: 700, bgcolor: currentState.currentDepth >= currentState.depthLimit ? "rgba(239,68,68,0.2)" : "rgba(139,92,246,0.15)",
                 color: currentState.currentDepth >= currentState.depthLimit ? "#ef4444" : "#a855f7", border: "1px solid",
                 borderColor: currentState.currentDepth >= currentState.depthLimit ? "#dc2626" : "#8b5cf6" }} />
          )}
        </Box>
      )}

      {/* Main Array */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(99,102,241,0.2)", position: "relative", zIndex: 1,
          background: dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "flex-start" }}>
          {arr.map((item, idx) => {
            const inActiveRange = activeRange && idx >= activeRange[0] && idx <= activeRange[1];
            
            // Sub-algorithm specific states
            const isQsPivot = phase === "quick-sort" && idx === pivotIdx;
            const isQsI = phase === "quick-sort" && idx === qsI;
            const isQsJ = phase === "quick-sort" && idx === qsJ;

            const isHeapActive = phase === "heap-sort" && idx === activeNode;
            const isHeapCompare = phase === "heap-sort" && idx === compareNode;
            const isHeapSorted = phase === "heap-sort" && activeRange && idx > activeRange[0] + (heapSize ?? 0) - 1 && idx <= activeRange[1];

            const isInsI = phase === "insertion-sort" && idx === insI;
            const isInsJ = phase === "insertion-sort" && idx === insJ;

            let bg = dark ? "rgba(51,65,85,0.3)" : "rgba(226,232,240,0.4)";
            let bd = dark ? "rgba(71,85,105,0.2)" : "rgba(148,163,184,0.2)";
            let color = "text.disabled";
            let shadow = "none";
            let scale = 1;

            if (phase === "done") {
              bg = "rgba(16,185,129,0.15)"; bd = "#10b981"; color = "#10b981";
            } else if (inActiveRange) {
              bg = dark ? "rgba(51,65,85,0.8)" : "rgba(226,232,240,0.9)";
              bd = dark ? "rgba(100,116,139,0.6)" : "rgba(148,163,184,0.6)";
              color = "text.primary";
            }

            // Quick Sort highlights
            if (isQsPivot) { bg = "rgba(139,92,246,0.3)"; bd = "#8b5cf6"; color = "#8b5cf6"; shadow = "0 0 14px rgba(139,92,246,0.5)"; scale = 1.1; }
            else if (isQsI) { bd = "#eab308"; color = "#eab308"; }
            else if (isQsJ) { bg = "rgba(6,182,212,0.2)"; bd = "#06b6d4"; color = "#06b6d4"; }

            // Heap Sort highlights
            if (isHeapActive) { bg = "rgba(249,115,22,0.3)"; bd = "#f97316"; color = "#f97316"; shadow = "0 0 14px rgba(249,115,22,0.5)"; scale = 1.1; }
            else if (isHeapCompare) { bg = "rgba(234,179,8,0.2)"; bd = "#eab308"; color = "#eab308"; }
            else if (isHeapSorted) { bg = "rgba(16,185,129,0.15)"; bd = "#10b981"; color = "#10b981"; }

            // Insertion Sort highlights
            if (isInsI) { bg = "rgba(236,72,153,0.3)"; bd = "#ec4899"; color = "#ec4899"; scale = 1.1; }
            else if (isInsJ) { bg = "rgba(234,179,8,0.2)"; bd = "#eab308"; color = "#eab308"; }

            return (
              <Box key={item.id} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, opacity: inActiveRange || phase === "done" || phase === "init" ? 1 : 0.3, transition: "opacity 0.3s" }}>
                <motion.div
                  layout
                  animate={{ scale }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10, background: bg, border: `2px solid ${bd}`, boxShadow: shadow }}
                >
                  <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1rem", color }}>{item.val}</Typography>
                </motion.div>
                <Typography variant="caption" sx={{ fontSize: "0.55rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>[{idx}]</Typography>

                {/* Sub-algorithm pointers */}
                <Box sx={{ height: 16, display: "flex", gap: 0.5, justifyContent: "center" }}>
                  {isQsI && <Box sx={{ px: 0.5, borderRadius: 0.5, bgcolor: "#eab308", color: "#fff", fontSize: "0.5rem", fontWeight: 800 }}>i</Box>}
                  {isQsJ && <Box sx={{ px: 0.5, borderRadius: 0.5, bgcolor: "#06b6d4", color: "#fff", fontSize: "0.5rem", fontWeight: 800 }}>j</Box>}
                  {isInsJ && <Box sx={{ px: 0.5, borderRadius: 0.5, bgcolor: "#eab308", color: "#fff", fontSize: "0.5rem", fontWeight: 800 }}>j</Box>}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
