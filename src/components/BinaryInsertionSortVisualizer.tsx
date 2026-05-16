import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { BISState } from "@/hooks/useBinaryInsertionSort";

interface BinaryInsertionSortVisualizerProps {
  initialArray: number[];
  currentState: BISState | null;
}

export default function BinaryInsertionSortVisualizer({ initialArray, currentState }: BinaryInsertionSortVisualizerProps) {
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
           <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary" }}>Binary Insertion Sort</Typography>
        </Box>

        {/* Extracted Key Area */}
        <Box sx={{ display: "flex", justifyContent: "center", minHeight: 80, mb: -4 }}>
            <AnimatePresence>
                {currentState?.keyItem && (
                    <motion.div
                        layoutId={`val-${currentState.keyItem.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{
                            width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: 12, background: "rgba(139,92,246,0.2)", border: "2px solid #8b5cf6",
                            boxShadow: "0 0 20px rgba(139,92,246,0.3)", position: "relative", flexDirection: "column"
                        }}
                    >
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#8b5cf6", fontSize: "1.3rem" }}>{currentState.keyItem.val}</Typography>
                        <Typography variant="caption" sx={{ position: "absolute", top: -20, fontSize: "0.65rem", fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase" }}>Extracted Key</Typography>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>

        {/* Array */}
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", minHeight: 120 }}>
          {arrToRender.map((item, idx) => {
            
            let isSorted = false;
            let isEmpty = item.val === null;
            let isOutSearch = false;
            let isMid = false;
            let isLeft = false;
            let isRight = false;
            let isShiftTarget = false;

            if (currentState && currentState.phase !== "init" && currentState.i !== null) {
                if (idx < currentState.i || currentState.phase === "done") isSorted = true;
                
                if (currentState.phase === "search") {
                    if (idx < (currentState.left ?? 0) || idx > (currentState.right ?? -1)) isOutSearch = true;
                    if (idx === currentState.mid) isMid = true;
                    if (idx === currentState.left) isLeft = true;
                    if (idx === currentState.right) isRight = true;
                }
                
                if (currentState.phase === "shift" && currentState.shiftIdx !== null && idx === currentState.shiftIdx) {
                    isShiftTarget = true;
                }
            }

            let bg = dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.6)";
            let bd = dark ? "rgba(71,85,105,0.4)" : "rgba(148,163,184,0.3)";
            let cl = "text.primary";
            let shadow = "none";
            let borderStyle = "solid";

            if (isEmpty) {
                bg = "transparent"; bd = dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"; cl = "transparent"; borderStyle = "dashed";
            } else if (isShiftTarget) {
                bg = "rgba(249,115,22,0.2)"; bd = "#f97316"; cl = "#f97316"; shadow = "0 0 16px rgba(249,115,22,0.3)";
            } else if (isMid) {
                bg = "rgba(234,179,8,0.2)"; bd = "#eab308"; cl = "#eab308"; shadow = "0 0 16px rgba(234,179,8,0.3)";
            } else if (isSorted && !isOutSearch) {
                bg = "rgba(16,185,129,0.15)"; bd = "#10b981"; cl = "#10b981";
            }

            return (
              <Box key={idx} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, opacity: isOutSearch && !isEmpty ? 0.3 : 1, transition: "opacity 0.4s ease" }}>
                <Typography variant="caption" sx={{ fontSize: "0.6rem", color: "text.secondary", fontFamily: "var(--font-mono)" }}>[{idx}]</Typography>
                
                <Box sx={{ width: 56, height: 56, position: "relative" }}>
                    {isEmpty ? (
                        <Box sx={{ width: "100%", height: "100%", borderRadius: 12, border: `2px dashed ${bd}`, bgcolor: "transparent" }} />
                    ) : (
                        <motion.div
                        layoutId={`val-${item.id}`}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: isMid ? 1.1 : 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{
                            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: 12, background: bg, border: `2px ${borderStyle} ${bd}`,
                            boxShadow: shadow, position: "absolute", inset: 0
                        }}
                        >
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: cl, fontSize: "1.2rem" }}>{item.val}</Typography>
                        </motion.div>
                    )}
                </Box>
                
                {/* Pointer Indicators */}
                <Box sx={{ height: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", pt: 0.5, gap: 0.5 }}>
                   {isMid && <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, bgcolor: "#eab308", color: "#fff", fontSize: "0.65rem", fontWeight: 800 }}>M</Box>}
                   {isShiftTarget && <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, bgcolor: "#f97316", color: "#fff", fontSize: "0.6rem", fontWeight: 800 }}>SHIFT</Box>}
                   <Box sx={{ display: "flex", gap: 0.5 }}>
                     {isLeft && <Box sx={{ px: 0.6, py: 0.1, borderRadius: 0.5, border: "1px solid #06b6d4", color: "#06b6d4", fontSize: "0.6rem", fontWeight: 700 }}>L</Box>}
                     {isRight && <Box sx={{ px: 0.6, py: 0.1, borderRadius: 0.5, border: "1px solid #ec4899", color: "#ec4899", fontSize: "0.6rem", fontWeight: 700 }}>R</Box>}
                   </Box>
                </Box>
              </Box>
            );
          })}
        </Box>

      </Paper>
    </Box>
  );
}
