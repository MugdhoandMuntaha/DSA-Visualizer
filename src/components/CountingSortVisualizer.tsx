import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { CSState } from "@/hooks/useCountingSort";

interface CountingSortVisualizerProps {
  initialArray: number[];
  currentState: CSState | null;
}

export default function CountingSortVisualizer({ initialArray, currentState }: CountingSortVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const renderArrayRow = (
    title: string,
    items: { val: number | string | null; id: string; active?: boolean; highlightColor?: string; label?: string; sublabel?: string }[],
    emptyMessage?: string
  ) => {
    return (
      <Box sx={{ mb: 4, width: "100%" }}>
        <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>{title}</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-start", minHeight: 60, alignItems: "center" }}>
          {items.length === 0 && emptyMessage ? (
            <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>{emptyMessage}</Typography>
          ) : (
            <AnimatePresence>
              {items.map((item, idx) => {
                const isNull = item.val === null;
                const active = item.active;
                const hc = item.highlightColor || "#6366f1";
                
                let bg = dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.6)";
                let bd = dark ? "rgba(71,85,105,0.4)" : "rgba(148,163,184,0.3)";
                let cl = "text.primary";
                let shadow = "none";

                if (active) {
                  bg = `${hc}33`; // 20% opacity
                  bd = hc;
                  shadow = `0 0 12px ${hc}40`;
                }
                
                if (isNull) {
                  bg = "transparent";
                  bd = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
                  cl = "transparent";
                }

                return (
                  <Box key={item.id} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                    {item.label && <Typography variant="caption" sx={{ fontSize: "0.6rem", color: active ? hc : "text.secondary", fontWeight: active ? 700 : 500, minHeight: 14 }}>{item.label}</Typography>}
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      style={{
                        width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 8, background: bg, border: `2px solid ${isNull ? "dashed" : "solid"}`, borderColor: bd,
                        boxShadow: shadow, position: "relative"
                      }}
                    >
                      {!isNull && <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: cl, fontSize: "1.1rem" }}>{item.val}</Typography>}
                    </motion.div>
                    {item.sublabel !== undefined && <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary", fontFamily: "var(--font-mono)", mt: 0.5 }}>{item.sublabel}</Typography>}
                  </Box>
                );
              })}
            </AnimatePresence>
          )}
        </Box>
      </Box>
    );
  };

  const origItems = (currentState?.originalArr || initialArray.map((v, i) => ({ val: v, id: `v-${v}-${i}` }))).map((item, i) => ({
    val: item.val,
    id: `orig-${i}`,
    active: currentState?.activeIdxArr === i,
    highlightColor: currentState?.phase === "find-max" ? "#eab308" : currentState?.phase === "build-output" ? "#10b981" : "#6366f1",
    sublabel: `[${i}]`
  }));

  const cntItems = currentState ? currentState.cntArr.map((v, i) => ({
    val: v,
    id: `cnt-${i}`,
    active: currentState.activeIdxCnt === i,
    highlightColor: currentState.phase === "prefix-sum" ? "#f97316" : "#06b6d4",
    sublabel: `i=${i + currentState.minVal}`
  })) : [];

  const ansItems = currentState ? currentState.ansArr.map((item, i) => ({
    val: item ? item.val : null,
    id: `ans-${i}`,
    active: currentState.activeIdxAns === i,
    highlightColor: "#10b981",
    sublabel: `[${i}]`
  })) : [];

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 4, overflowY: "auto", position: "relative", bgcolor: "background.default" }}>
      {/* Dynamic Background Pattern */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "white" : "black"} 1px, transparent 0)`,
        backgroundSize: "32px 32px" }} />

      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 2, borderColor: "rgba(99,102,241,0.2)",
          background: dark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", minHeight: "100%" }}>
        
        {renderArrayRow("1. Original Array (arr)", origItems)}
        
        {currentState && currentState.phase !== "find-max" && currentState.phase !== "init" && (
          renderArrayRow(`2. Count/Prefix Array (cntArr) ${currentState.supportNegatives ? "[Offset by minVal]" : ""}`, cntItems)
        )}
        
        {currentState && (currentState.phase === "build-output" || currentState.phase === "done") && (
          renderArrayRow("3. Output Array (ans)", ansItems)
        )}

      </Paper>
    </Box>
  );
}
