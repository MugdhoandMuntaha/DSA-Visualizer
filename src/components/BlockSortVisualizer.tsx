import React from "react";
import { Box, Typography, Paper, Chip, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { BlockSortState } from "@/hooks/useBlockSort";

const BLOCK_COLORS = [
  "#6366f1", "#ec4899", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#a855f7", "#ef4444"
];

interface BlockSortVisualizerProps {
  initialArray: number[];
  currentState: BlockSortState | null;
}

export default function BlockSortVisualizer({ initialArray, currentState }: BlockSortVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const arr = currentState?.arr ?? initialArray.map((v, i) => ({ val: v, id: `bs-${i}` }));
  const phase = currentState?.phase ?? "init";
  const blocks = currentState?.blocks ?? [{ start: 0, end: arr.length - 1 }];
  const { activeBlock, insI, insJ, blockI, blockJ, mergeLeft, mergeRight } = currentState ?? {};

  // Find block index for each item
  const getBlockIndex = (idx: number) => {
    return blocks.findIndex(b => idx >= b.start && idx <= b.end);
  };

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, p: 3, overflowY: "auto", position: "relative", bgcolor: "background.default" }}>
      {/* Background dots */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "white" : "black"} 1px, transparent 0)`,
        backgroundSize: "32px 32px" }} />

      {/* Phase Badges */}
      {currentState && (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={
            phase === "sort-blocks" ? "Phase 1: Local Block Sort (Insertion)" :
            phase === "order-blocks" ? "Phase 2: Global Block Ordering" :
            phase === "merge-blocks" ? "Phase 3: Merging Sorted Blocks" :
            phase === "done" ? "✓ Done" : "Initialize"
          }
            sx={{ fontWeight: 700, 
              bgcolor: phase === "sort-blocks" ? "rgba(99,102,241,0.2)" : 
                       phase === "order-blocks" ? "rgba(249,115,22,0.2)" : 
                       phase === "merge-blocks" ? "rgba(16,185,129,0.2)" : "rgba(100,116,139,0.2)",
              color: phase === "sort-blocks" ? "#818cf8" : 
                     phase === "order-blocks" ? "#f97316" : 
                     phase === "merge-blocks" ? "#34d399" : "text.secondary",
              border: "1px solid", 
              borderColor: phase === "sort-blocks" ? "#6366f1" : 
                           phase === "order-blocks" ? "#ea580c" : 
                           phase === "merge-blocks" ? "#10b981" : "divider"}} />
        </Box>
      )}

      {/* Main Array Display */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "rgba(99,102,241,0.2)", position: "relative", zIndex: 1,
          background: dark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
        
        {/* Render blocks explicitly grouped to show chunk boundaries */}
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
          {blocks.map((block, bIdx) => {
            const color = BLOCK_COLORS[bIdx % BLOCK_COLORS.length];
            const isBlockActive = activeBlock === bIdx || blockI === bIdx || blockJ === bIdx;
            const blockItems = arr.slice(block.start, block.end + 1);
            
            let blockBg = dark ? "rgba(30,41,59,0.3)" : "rgba(241,245,249,0.5)";
            let blockBorder = dark ? "rgba(71,85,105,0.3)" : "rgba(148,163,184,0.3)";
            
            if (phase === "sort-blocks" && activeBlock === bIdx) {
               blockBg = `${color}15`; blockBorder = color;
            } else if (phase === "order-blocks") {
               if (blockI === bIdx) { blockBg = `${color}25`; blockBorder = color; }
               if (blockJ === bIdx) { blockBg = "rgba(234,179,8,0.2)"; blockBorder = "#eab308"; }
            } else if (phase === "merge-blocks") {
               const isInMerge = mergeLeft != null && mergeRight != null && block.start >= mergeLeft && block.end <= mergeRight;
               if (isInMerge) { blockBg = "rgba(16,185,129,0.15)"; blockBorder = "#10b981"; }
            } else if (phase === "done") {
               blockBg = "rgba(16,185,129,0.1)"; blockBorder = "rgba(16,185,129,0.4)";
            }

            return (
              <Box key={`block-${bIdx}`} sx={{ p: 1.5, borderRadius: 3, border: `2px ${phase === "order-blocks" ? "solid" : "dashed"} ${blockBorder}`, 
                bgcolor: blockBg, display: "flex", flexDirection: "column", gap: 1, position: "relative",
                boxShadow: (blockI === bIdx || blockJ === bIdx) ? `0 0 15px ${blockBorder}88` : "none", transition: "all 0.3s ease" }}>
                
                <Typography variant="caption" sx={{ position: "absolute", top: -10, left: 10, bgcolor: dark ? "#1e293b" : "#f1f5f9", px: 1, 
                  borderRadius: 1, color, fontWeight: 800, fontSize: "0.6rem", border: `1px solid ${color}44` }}>
                  BLOCK {bIdx}
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                  {blockItems.map((item, localIdx) => {
                    const globalIdx = block.start + localIdx;
                    
                    const isInsI = phase === "sort-blocks" && globalIdx === insI;
                    const isInsJ = phase === "sort-blocks" && globalIdx === insJ;

                    let bg = dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.8)";
                    let bd = dark ? "rgba(100,116,139,0.4)" : "rgba(148,163,184,0.4)";
                    let textColor = "text.primary";
                    let scale = 1;

                    if (isInsI) { bg = `${color}44`; bd = color; textColor = color; scale = 1.1; }
                    else if (isInsJ) { bg = "rgba(234,179,8,0.3)"; bd = "#eab308"; textColor = "#eab308"; }

                    if (phase === "order-blocks" && localIdx === 0) {
                      // Highlight the first element of each block since it's used for comparison
                      bd = color; bg = `${color}33`; textColor = color;
                      if (blockJ === bIdx || blockI === bIdx) scale = 1.1;
                    }

                    return (
                      <Box key={item.id} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                        <motion.div layout animate={{ scale }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: 8, background: bg, border: `2px solid ${bd}` }}>
                          <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.95rem", color: textColor }}>
                            {item.val}
                          </Typography>
                        </motion.div>
                        <Typography variant="caption" sx={{ fontSize: "0.55rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>
                          [{globalIdx}]
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
