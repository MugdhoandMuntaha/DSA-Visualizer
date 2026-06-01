"use client";
import { Box, Typography, useTheme } from "@mui/material";

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
  const theme = useTheme();
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

          const isDark = theme.palette.mode === "dark";
          let bgColor = `${theme.palette.primary.main}cc`;
          let borderColor = theme.palette.primary.main;
          let textColor: string = "text.secondary";
          let glow = "none";

          if (isMerged) {
            bgColor = `${theme.palette.secondary.main}d9`;
            borderColor = theme.palette.secondary.main;
            textColor = "secondary.main";
            glow = `0 0 14px ${bgColor}`;
          } else if (isKey) {
            bgColor = `${theme.palette.secondary.main}e6`;
            borderColor = theme.palette.secondary.main;
            textColor = "secondary.main";
            glow = `0 0 24px ${bgColor}`;
          } else if (isShifting) {
            bgColor = `${theme.palette.error.main}b3`;
            borderColor = theme.palette.error.main;
            textColor = "error.main";
            glow = `0 0 16px ${bgColor}`;
          } else if (isSorted) {
            bgColor = `${theme.palette.success.main}cc`;
            borderColor = theme.palette.success.main;
            textColor = "success.main";
            glow = `0 0 10px ${bgColor}`;
          } else if (isComparing) {
            bgColor = `${theme.palette.warning.main}e6`;
            borderColor = theme.palette.warning.main;
            textColor = "warning.main";
            glow = `0 0 20px ${bgColor}`;
          } else if (isLeft) {
            bgColor = `${theme.palette.info.main}c0`;
            borderColor = theme.palette.info.main;
            textColor = "info.main";
            glow = `0 0 10px ${bgColor}`;
          } else if (isRight) {
            // Using error or warning for right side in merge sort splits
            bgColor = `${theme.palette.warning.main}c0`;
            borderColor = theme.palette.warning.main;
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

