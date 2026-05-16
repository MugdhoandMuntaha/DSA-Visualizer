"use client";
import { useMemo } from "react";
import { Box, Typography, Chip } from "@mui/material";
import { useThemeMode } from "@/components/ThemeRegistry";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import MergeIcon from "@mui/icons-material/Merge";
import type { MergeAnimData } from "@/hooks/useMergeSort";

interface TreeNode {
  l: number;
  r: number;
  phantom?: boolean;
}

interface MergeSortTreeProps {
  initialArray: number[];
  dividedRanges: Set<string>;
  mergedRangesMap: Map<string, number[]>;
  activeRange: [number, number] | null;
  leftRange: [number, number] | null;
  rightRange: [number, number] | null;
  mergeAnim: MergeAnimData | null;
}

export default function MergeSortTree({
  initialArray,
  dividedRanges,
  mergedRangesMap,
  activeRange,
  leftRange,
  rightRange,
  mergeAnim,
}: MergeSortTreeProps) {
  const { mode: themeMode } = useThemeMode();
  const n = initialArray.length;
  const dark = themeMode === "dark";

  const { levels, parentMap } = useMemo(() => {
    const lvls: TreeNode[][] = [];
    const pMap = new Map<string, string>();

    function build(l: number, r: number, level: number) {
      if (!lvls[level]) lvls[level] = [];
      lvls[level].push({ l, r });
      if (l < r) {
        const mid = l + Math.floor((r - l) / 2);
        pMap.set(`${l}-${mid}`, `${l}-${r}`);
        pMap.set(`${mid + 1}-${r}`, `${l}-${r}`);
        build(l, mid, level + 1);
        build(mid + 1, r, level + 1);
      }
    }

    if (n > 0) build(0, n - 1, 0);

    const maxLvl = lvls.length - 1;
    for (let lvl = 0; lvl < maxLvl; lvl++) {
      for (const node of lvls[lvl]) {
        if (node.l === node.r && !node.phantom) {
          for (let deeper = lvl + 1; deeper <= maxLvl; deeper++) {
            lvls[deeper].push({ l: node.l, r: node.r, phantom: true });
          }
        }
      }
    }
    for (const level of lvls) {
      level.sort((a, b) => a.l - b.l);
    }

    return { levels: lvls, parentMap: pMap };
  }, [n]);

  const key = (node: TreeNode) => `${node.l}-${node.r}`;

  const isNodeVisible = (node: TreeNode, levelIdx: number) => {
    if (levelIdx === 0) return true;
    const parentKey = parentMap.get(key(node));
    return parentKey ? dividedRanges.has(parentKey) : false;
  };

  const isActive = (node: TreeNode) =>
    activeRange && activeRange[0] === node.l && activeRange[1] === node.r;
  const isLeftChild = (node: TreeNode) =>
    leftRange && leftRange[0] === node.l && leftRange[1] === node.r;
  const isRightChild = (node: TreeNode) =>
    rightRange && rightRange[0] === node.l && rightRange[1] === node.r;

  // ── Chip styling for normal tree nodes ──
  const nodeChipSx = (visible: boolean, active: boolean, left: boolean, right: boolean, merged: boolean) => {
    let bg = dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.7)";
    let border = dark ? "rgba(71,85,105,0.5)" : "rgba(148,163,184,0.4)";
    let color = "text.secondary";
    let shadow = "none";
    if (merged) {
      bg = dark ? "rgba(16,185,129,0.2)" : "rgba(52,211,153,0.2)";
      border = "#10b981"; color = "success.main"; shadow = `0 0 12px rgba(16,185,129,0.3)`;
    } else if (active) {
      bg = dark ? "rgba(139,92,246,0.25)" : "rgba(167,139,250,0.25)";
      border = "#8b5cf6"; color = "secondary.main"; shadow = `0 0 14px rgba(139,92,246,0.3)`;
    } else if (left) {
      bg = dark ? "rgba(6,182,212,0.2)" : "rgba(34,211,238,0.2)";
      border = "#06b6d4"; color = "info.main";
    } else if (right) {
      bg = dark ? "rgba(249,115,22,0.2)" : "rgba(251,146,60,0.2)";
      border = "#f97316"; color = "warning.main";
    }
    return {
      fontFamily: "var(--font-mono)", fontSize: "0.72rem", fontWeight: 700,
      height: "auto", py: 0.5, px: 1,
      bgcolor: bg, color, border: `1.5px solid ${border}`,
      opacity: visible ? 1 : 0.15,
      transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: shadow,
      "& .MuiChip-label": { px: 0.5, whiteSpace: "normal", textAlign: "center" },
    };
  };

  const lineColor = dark ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.25)";
  const mergeLineColor = dark ? "rgba(16,185,129,0.4)" : "rgba(16,185,129,0.3)";

  /* ── Connectors ── */
  const DivideConnector = ({ parentLevel }: { parentLevel: TreeNode[] }) => (
    <Box sx={{ display: "flex", width: "100%", height: 28 }}>
      {parentLevel.map((node) => {
        const k = key(node);
        const vis = dividedRanges.has(k);
        if (node.l === node.r) return <Box key={k} sx={{ flex: 1 }} />;
        const mid = node.l + Math.floor((node.r - node.l) / 2);
        const total = node.r - node.l + 1;
        const leftCenter = ((mid - node.l + 1) / total) * 50;
        const rightCenter = 100 - ((node.r - mid) / total) * 50;
        return (
          <Box key={k} sx={{ flex: total, position: "relative", height: "100%", opacity: vis ? 1 : 0.1, transition: "opacity 0.3s" }}>
            <Box sx={{ position: "absolute", left: "50%", top: 0, width: 1.5, height: "40%", bgcolor: lineColor, transform: "translateX(-50%)" }} />
            <Box sx={{ position: "absolute", left: `${leftCenter}%`, width: `${rightCenter - leftCenter}%`, top: "40%", height: 1.5, bgcolor: lineColor }} />
            <Box sx={{ position: "absolute", left: `${leftCenter}%`, top: "40%", width: 1.5, height: "60%", bgcolor: lineColor }} />
            <Box sx={{ position: "absolute", left: `${rightCenter}%`, top: "40%", width: 1.5, height: "60%", bgcolor: lineColor }} />
          </Box>
        );
      })}
    </Box>
  );

  const MergeConnector = ({ parentLevel }: { parentLevel: TreeNode[] }) => (
    <Box sx={{ display: "flex", width: "100%", height: 28 }}>
      {parentLevel.map((node) => {
        const k = key(node);
        const vis = mergedRangesMap.has(k) || (mergeAnim && activeRange && activeRange[0] === node.l && activeRange[1] === node.r);
        if (node.l === node.r) return <Box key={k} sx={{ flex: 1 }} />;
        const mid = node.l + Math.floor((node.r - node.l) / 2);
        const total = node.r - node.l + 1;
        const leftCenter = ((mid - node.l + 1) / total) * 50;
        const rightCenter = 100 - ((node.r - mid) / total) * 50;
        return (
          <Box key={k} sx={{ flex: total, position: "relative", height: "100%", opacity: vis ? 1 : 0.1, transition: "opacity 0.3s" }}>
            <Box sx={{ position: "absolute", left: `${leftCenter}%`, top: 0, width: 1.5, height: "60%", bgcolor: mergeLineColor }} />
            <Box sx={{ position: "absolute", left: `${rightCenter}%`, top: 0, width: 1.5, height: "60%", bgcolor: mergeLineColor }} />
            <Box sx={{ position: "absolute", left: `${leftCenter}%`, width: `${rightCenter - leftCenter}%`, top: "60%", height: 1.5, bgcolor: mergeLineColor }} />
            <Box sx={{ position: "absolute", left: "50%", top: "60%", width: 1.5, height: "40%", bgcolor: mergeLineColor, transform: "translateX(-50%)" }} />
          </Box>
        );
      })}
    </Box>
  );

  /* ── Animated merge element chips ── */
  const ElementChip = ({ val, state, fromSide }: {
    val: number | null;
    state: "pointer" | "used" | "waiting" | "empty" | "placed" | "just-placed";
    fromSide?: "left" | "right" | null;
  }) => {
    let bg: string, border: string, color: string, shadow: string, opacity: number;

    switch (state) {
      case "pointer":
        bg = dark ? "rgba(250,204,21,0.3)" : "rgba(253,224,71,0.4)";
        border = "#eab308"; color = "#eab308"; shadow = `0 0 14px rgba(234,179,8,0.4)`; opacity = 1;
        break;
      case "just-placed":
        bg = fromSide === "left"
          ? (dark ? "rgba(6,182,212,0.35)" : "rgba(34,211,238,0.35)")
          : (dark ? "rgba(249,115,22,0.35)" : "rgba(251,146,60,0.35)");
        border = fromSide === "left" ? "#06b6d4" : "#f97316";
        color = fromSide === "left" ? "#06b6d4" : "#f97316";
        shadow = `0 0 16px ${fromSide === "left" ? "rgba(6,182,212,0.5)" : "rgba(249,115,22,0.5)"}`;
        opacity = 1;
        break;
      case "placed":
        bg = dark ? "rgba(16,185,129,0.15)" : "rgba(52,211,153,0.15)";
        border = "rgba(16,185,129,0.4)"; color = "#10b981"; shadow = "none"; opacity = 0.85;
        break;
      case "used":
        bg = dark ? "rgba(51,65,85,0.3)" : "rgba(203,213,225,0.3)";
        border = dark ? "rgba(71,85,105,0.3)" : "rgba(148,163,184,0.3)";
        color = dark ? "rgba(148,163,184,0.4)" : "rgba(100,116,139,0.4)";
        shadow = "none"; opacity = 0.4;
        break;
      case "empty":
        bg = "transparent";
        border = dark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)";
        color = "text.disabled"; shadow = "none"; opacity = 0.5;
        break;
      default: // waiting
        bg = dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.6)";
        border = dark ? "rgba(71,85,105,0.4)" : "rgba(148,163,184,0.3)";
        color = "text.secondary"; shadow = "none"; opacity = 0.7;
    }

    return (
      <Box sx={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: 28, height: 26, px: 0.75, borderRadius: "6px",
        fontFamily: "var(--font-mono)", fontSize: "0.72rem", fontWeight: 700,
        bgcolor: bg, border: `1.5px ${state === "empty" ? "dashed" : "solid"} ${border}`,
        color, boxShadow: shadow, opacity,
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {val !== null ? val : "·"}
      </Box>
    );
  };

  /* ── Render merge-animated source array (L or R) ── */
  const MergeSourceRow = ({ arr, ptr, side, label }: {
    arr: number[]; ptr: number; side: "left" | "right"; label: string;
  }) => {
    const sideColor = side === "left" ? "#06b6d4" : "#f97316";
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, flex: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: sideColor, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          {arr.map((val, idx) => (
            <ElementChip key={idx} val={val}
              state={idx < ptr ? "used" : idx === ptr ? "pointer" : "waiting"} />
          ))}
        </Box>
      </Box>
    );
  };

  /* ── Render merge result row ── */
  const MergeResultRow = ({ anim }: { anim: MergeAnimData }) => (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, width: "100%" }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Result
      </Typography>
      <Box sx={{ display: "flex", gap: "4px", justifyContent: "center" }}>
        {anim.result.map((val, idx) => (
          <ElementChip key={idx} val={val}
            state={val === null ? "empty" : idx === anim.lastResultIdx ? "just-placed" : "placed"}
            fromSide={idx === anim.lastResultIdx ? anim.lastFrom : null} />
        ))}
      </Box>
    </Box>
  );

  if (n === 0) return <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography color="text.disabled">No array</Typography></Box>;

  // Which merge tree node key is being actively merged right now
  const activeMergeKey = mergeAnim && activeRange ? `${activeRange[0]}-${activeRange[1]}` : null;
  const activeMergeLeftKey = mergeAnim && leftRange ? `${leftRange[0]}-${leftRange[1]}` : null;
  const activeMergeRightKey = mergeAnim && rightRange ? `${rightRange[0]}-${rightRange[1]}` : null;

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "auto",
      bgcolor: (t) => t.palette.background.default, p: { xs: 1, md: 2 } }}>

      {/* ════ DIVIDE TREE ════ */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, justifyContent: "center" }}>
        <CallSplitIcon sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="overline" sx={{ fontSize: "0.8rem", fontWeight: 800, color: "primary.main", letterSpacing: "0.12em" }}>
          Divide Phase
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0, mb: 1, px: 1 }}>
        {levels.map((level, levelIdx) => (
          <Box key={`div-${levelIdx}`}>
            <Box sx={{ display: "flex", width: "100%", justifyContent: "center" }}>
              {level.map((node) => {
                if (node.phantom) return <Box key={`ph-${node.l}`} sx={{ flex: 1 }} />;
                const vis = isNodeVisible(node, levelIdx);
                const vals = initialArray.slice(node.l, node.r + 1);
                return (
                  <Box key={key(node)} sx={{ flex: node.r - node.l + 1, display: "flex", justifyContent: "center", px: 0.5, py: 0.4 }}>
                    <Chip label={vals.join(", ")} size="small"
                      sx={nodeChipSx(vis, !!isActive(node), !!isLeftChild(node), !!isRightChild(node), false)} />
                  </Box>
                );
              })}
            </Box>
            {levelIdx < levels.length - 1 && <DivideConnector parentLevel={level} />}
          </Box>
        ))}
      </Box>

      {/* ════ SEPARATOR ════ */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 2, px: 4 }}>
        <Box sx={{ flex: 1, height: 1, background: dark
          ? "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)"
          : "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)" }} />
        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.65rem" }}>● ● ●</Typography>
        <Box sx={{ flex: 1, height: 1, background: dark
          ? "linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)"
          : "linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)" }} />
      </Box>

      {/* ════ MERGE ANIMATION PANEL ════ */}
      {mergeAnim && (
        <Box sx={{
          mx: "auto", mb: 2, p: 2, borderRadius: 2, width: "fit-content", maxWidth: "90%",
          border: `1.5px solid ${dark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.2)"}`,
          bgcolor: dark ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.03)",
          backdropFilter: "blur(8px)",
        }}>
          <Typography variant="caption" sx={{ display: "block", textAlign: "center", mb: 1.5, fontWeight: 700, color: "success.main", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Merging [{activeRange?.[0]}..{activeRange?.[1]}]
          </Typography>
          {/* Source arrays side by side */}
          <Box sx={{ display: "flex", gap: 3, justifyContent: "center", mb: 1.5 }}>
            <MergeSourceRow arr={mergeAnim.leftArr} ptr={mergeAnim.leftPtr} side="left" label={`Left [${leftRange?.[0]}..${leftRange?.[1]}]`} />
            <MergeSourceRow arr={mergeAnim.rightArr} ptr={mergeAnim.rightPtr} side="right" label={`Right [${rightRange?.[0]}..${rightRange?.[1]}]`} />
          </Box>
          {/* Arrow */}
          <Box sx={{ textAlign: "center", color: "text.disabled", fontSize: "0.8rem", mb: 0.5 }}>▼</Box>
          {/* Result */}
          <MergeResultRow anim={mergeAnim} />
        </Box>
      )}

      {/* ════ MERGE TREE ════ */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, justifyContent: "center" }}>
        <MergeIcon sx={{ fontSize: 18, color: "success.main" }} />
        <Typography variant="overline" sx={{ fontSize: "0.8rem", fontWeight: 800, color: "success.main", letterSpacing: "0.12em" }}>
          Merge Phase
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0, px: 1 }}>
        {[...levels].reverse().map((level, rowIdx) => {
          const actualLevel = levels.length - 1 - rowIdx;
          const parentLevelIdx = actualLevel - 1;
          return (
            <Box key={`mrg-${rowIdx}`}>
              <Box sx={{ display: "flex", width: "100%", justifyContent: "center" }}>
                {level.map((node) => {
                  if (node.phantom) return <Box key={`mph-${node.l}`} sx={{ flex: 1 }} />;
                  const k = key(node);
                  const isMerged = mergedRangesMap.has(k);
                  const mergedVals = mergedRangesMap.get(k);
                  const isLeaf = node.l === node.r;
                  const vis = isMerged || (isLeaf && isNodeVisible(node, actualLevel));

                  // During active merge, highlight the parent node being built
                  const isBeingMerged = k === activeMergeKey;
                  // During active merge, highlight source children
                  const isSourceLeft = k === activeMergeLeftKey;
                  const isSourceRight = k === activeMergeRightKey;

                  let chipContent: string;
                  let chipSx;

                  if (isBeingMerged && mergeAnim) {
                    // Show partial result in the parent node
                    const placed = mergeAnim.result.filter(v => v !== null) as number[];
                    chipContent = placed.length > 0 ? placed.join(", ") : "...";
                    chipSx = nodeChipSx(true, false, false, false, false);
                    chipSx = {
                      ...chipSx,
                      bgcolor: dark ? "rgba(139,92,246,0.2)" : "rgba(167,139,250,0.2)",
                      border: "1.5px solid #8b5cf6",
                      color: "secondary.main",
                      opacity: 1,
                      boxShadow: "0 0 16px rgba(139,92,246,0.3)",
                    };
                  } else if (isSourceLeft && mergeAnim) {
                    chipContent = mergeAnim.leftArr.join(", ");
                    chipSx = nodeChipSx(true, false, false, false, false);
                    chipSx = {
                      ...chipSx,
                      bgcolor: dark ? "rgba(6,182,212,0.2)" : "rgba(34,211,238,0.2)",
                      border: "1.5px solid #06b6d4",
                      color: "info.main",
                      opacity: 1,
                      boxShadow: "0 0 10px rgba(6,182,212,0.3)",
                    };
                  } else if (isSourceRight && mergeAnim) {
                    chipContent = mergeAnim.rightArr.join(", ");
                    chipSx = nodeChipSx(true, false, false, false, false);
                    chipSx = {
                      ...chipSx,
                      bgcolor: dark ? "rgba(249,115,22,0.2)" : "rgba(251,146,60,0.2)",
                      border: "1.5px solid #f97316",
                      color: "warning.main",
                      opacity: 1,
                      boxShadow: "0 0 10px rgba(249,115,22,0.3)",
                    };
                  } else {
                    chipContent = isMerged && mergedVals ? mergedVals.join(", ") : isLeaf ? String(initialArray[node.l]) : "?";
                    chipSx = nodeChipSx(vis, !!isActive(node), false, false, isMerged);
                  }

                  return (
                    <Box key={k} sx={{ flex: node.r - node.l + 1, display: "flex", justifyContent: "center", px: 0.5, py: 0.4 }}>
                      <Chip label={chipContent} size="small" sx={chipSx} />
                    </Box>
                  );
                })}
              </Box>
              {parentLevelIdx >= 0 && <MergeConnector parentLevel={levels[parentLevelIdx]} />}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
