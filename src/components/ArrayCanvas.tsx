"use client";
import { Box, Typography } from "@mui/material";
import { useThemeMode } from "@/components/ThemeRegistry";

interface ArrayCanvasProps {
  array: number[];
  currentJ?: number;
  compareWith?: number;
  sortedIndices?: number[];
  keyIndex?: number;
  shiftingIndices?: number[];
  // Merge sort ranges
  leftRange?: [number, number] | null;
  rightRange?: [number, number] | null;
  activeRange?: [number, number] | null;
  mergedIndices?: number[];
}

export default function ArrayCanvas({
  array,
  currentJ,
  compareWith,
  sortedIndices = [],
  keyIndex,
  shiftingIndices = [],
  leftRange,
  rightRange,
  activeRange,
  mergedIndices = [],
}: ArrayCanvasProps) {
  const { mode: themeMode } = useThemeMode();
  const maxVal = Math.max(...array, 1);

  const inRange = (idx: number, range?: [number, number] | null) =>
    range ? idx >= range[0] && idx <= range[1] : false;

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: (t) => t.palette.background.default }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", flex: 1, gap: { xs: 0.5, sm: 1 }, p: { xs: 2, md: 4 }, overflowX: "auto" }}>
        {array.map((val, idx) => {
          const isComparing = idx === currentJ || idx === compareWith;
          const isKey = idx === keyIndex;
          const isShifting = shiftingIndices.includes(idx);
          const isSorted = sortedIndices.includes(idx);
          const isMerged = mergedIndices.includes(idx);
          const isLeft = inRange(idx, leftRange);
          const isRight = inRange(idx, rightRange);
          const isInActive = inRange(idx, activeRange);
          const isDimmed = activeRange && !isInActive;
          const heightPct = Math.max((val / maxVal) * 100, 5);

          let bgColor = themeMode === "dark" ? "rgba(59,130,246,0.8)" : "rgba(96,165,250,0.8)";
          let borderColor = themeMode === "dark" ? "#3b82f6" : "#60a5fa";
          let textColor: string = "text.secondary";
          let glow = "none";

          if (isMerged) {
            bgColor = themeMode === "dark" ? "rgba(139,92,246,0.85)" : "rgba(167,139,250,0.85)";
            borderColor = "#8b5cf6";
            textColor = "secondary.main";
            glow = `0 0 14px ${bgColor}`;
          } else if (isKey) {
            bgColor = themeMode === "dark" ? "rgba(139,92,246,0.9)" : "rgba(167,139,250,0.9)";
            borderColor = "#8b5cf6";
            textColor = "secondary.main";
            glow = `0 0 24px ${bgColor}`;
          } else if (isShifting) {
            bgColor = themeMode === "dark" ? "rgba(239,68,68,0.7)" : "rgba(248,113,113,0.7)";
            borderColor = "#ef4444";
            textColor = "error.main";
            glow = `0 0 16px ${bgColor}`;
          } else if (isSorted) {
            bgColor = themeMode === "dark" ? "rgba(16,185,129,0.8)" : "rgba(52,211,153,0.8)";
            borderColor = "#10b981";
            textColor = "success.main";
            glow = `0 0 10px ${bgColor}`;
          } else if (isComparing) {
            bgColor = themeMode === "dark" ? "rgba(245,158,11,0.9)" : "rgba(251,191,36,0.9)";
            borderColor = "#f59e0b";
            textColor = "warning.main";
            glow = `0 0 20px ${bgColor}`;
          } else if (isLeft) {
            bgColor = themeMode === "dark" ? "rgba(6,182,212,0.75)" : "rgba(34,211,238,0.75)";
            borderColor = "#06b6d4";
            textColor = "info.main";
            glow = `0 0 10px ${bgColor}`;
          } else if (isRight) {
            bgColor = themeMode === "dark" ? "rgba(249,115,22,0.75)" : "rgba(251,146,60,0.75)";
            borderColor = "#f97316";
            textColor = "warning.main";
            glow = `0 0 10px ${bgColor}`;
          }

          return (
            <Box key={`bar-${idx}`} sx={{
              display: "flex", flexDirection: "column", alignItems: "center",
              width: "100%", maxWidth: 60, minWidth: 20, height: "100%", justifyContent: "flex-end",
              opacity: isDimmed ? 0.25 : 1, transition: "opacity 0.3s",
            }}>
              <Box sx={{
                  width: "100%",
                  height: `${heightPct}%`,
                  bgcolor: bgColor,
                  border: "2px solid",
                  borderColor: borderColor,
                  borderRadius: "6px 6px 0 0",
                  transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, box-shadow 0.2s, opacity 0.3s",
                  boxShadow: glow,
                }} />
              <Typography sx={{ mt: 1, fontFamily: "var(--font-mono)", fontWeight: 800, color: textColor, fontSize: { xs: "0.65rem", sm: "0.85rem" }, transition: "color 0.2s" }}>
                {val}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

