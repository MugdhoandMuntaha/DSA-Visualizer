"use client";
import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useThemeMode } from "@/components/ThemeRegistry";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import MergeIcon from "@mui/icons-material/Merge";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import type { LLMergeAnimData } from "@/hooks/useLLMergeSort";

interface TreeNode { l: number; r: number; phantom?: boolean; }

interface LLMergeSortTreeProps {
  initialArray: number[];
  dividedRanges: Set<string>;
  mergedRangesMap: Map<string, number[]>;
  activeRange: [number, number] | null;
  leftRange: [number, number] | null;
  rightRange: [number, number] | null;
  mergeAnim: LLMergeAnimData | null;
}

/* ── Single linked-list node circle ── */
function LLNode({ val, color, borderColor, glow, opacity = 1, size = 30 }: {
  val: number | string; color: string; borderColor: string; glow?: string; opacity?: number; size?: number;
}) {
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${borderColor}`, color, fontFamily: "var(--font-mono)",
      fontSize: size < 28 ? "0.6rem" : "0.72rem", fontWeight: 800,
      boxShadow: glow || "none", opacity, transition: "all 0.3s ease",
    }}>
      {val}
    </Box>
  );
}

/* ── Row of LL nodes with arrows ── */
function LLChain({ vals, color, borderColor, glow, opacity = 1, size = 30 }: {
  vals: (number | string | null)[]; color: string; borderColor: string; glow?: string; opacity?: number; size?: number;
}) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.3 }}>
      {vals.map((v, i) => (
        <Box key={i} sx={{ display: "inline-flex", alignItems: "center", gap: 0.3 }}>
          <LLNode val={v !== null ? v : "·"} color={color} borderColor={borderColor}
            glow={glow} opacity={v === null ? 0.3 : opacity} size={size} />
          {i < vals.length - 1 && (
            <ArrowRightAltIcon sx={{ fontSize: size < 28 ? 14 : 18, color: borderColor, opacity: 0.5 }} />
          )}
        </Box>
      ))}
      <Typography sx={{ color: borderColor, fontFamily: "var(--font-mono)", fontSize: "0.55rem",
        fontWeight: 700, ml: 0.3, opacity: 0.5 }}>NULL</Typography>
    </Box>
  );
}

export default function LLMergeSortTree({
  initialArray, dividedRanges, mergedRangesMap,
  activeRange, leftRange, rightRange, mergeAnim,
}: LLMergeSortTreeProps) {
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
    for (const level of lvls) level.sort((a, b) => a.l - b.l);
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
  const isLeft = (node: TreeNode) =>
    leftRange && leftRange[0] === node.l && leftRange[1] === node.r;
  const isRight = (node: TreeNode) =>
    rightRange && rightRange[0] === node.l && rightRange[1] === node.r;

  const getNodeStyle = (vis: boolean, active: boolean, left: boolean, right: boolean, merged: boolean) => {
    let color = dark ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.7)";
    let border = dark ? "rgba(71,85,105,0.5)" : "rgba(148,163,184,0.4)";
    let glow: string | undefined;
    if (merged) { color = "#10b981"; border = "#10b981"; glow = "0 0 12px rgba(16,185,129,0.4)"; }
    else if (active) { color = "#8b5cf6"; border = "#8b5cf6"; glow = "0 0 14px rgba(139,92,246,0.4)"; }
    else if (left) { color = "#06b6d4"; border = "#06b6d4"; glow = "0 0 10px rgba(6,182,212,0.3)"; }
    else if (right) { color = "#f97316"; border = "#f97316"; glow = "0 0 10px rgba(249,115,22,0.3)"; }
    return { color, border, glow, opacity: vis ? 1 : 0.12 };
  };

  const lineColor = dark ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.25)";
  const mergeLineColor = dark ? "rgba(16,185,129,0.4)" : "rgba(16,185,129,0.3)";

  const DivideConnector = ({ parentLevel }: { parentLevel: TreeNode[] }) => (
    <Box sx={{ display: "flex", width: "100%", height: 24 }}>
      {parentLevel.map((node) => {
        const k = key(node);
        const vis = dividedRanges.has(k);
        if (node.l === node.r) return <Box key={k} sx={{ flex: 1 }} />;
        const total = node.r - node.l + 1;
        const mid = node.l + Math.floor((node.r - node.l) / 2);
        const leftCenter = ((mid - node.l + 1) / total) * 50;
        const rightCenter = 100 - ((node.r - mid) / total) * 50;
        return (
          <Box key={k} sx={{ flex: total, position: "relative", height: "100%", opacity: vis ? 1 : 0.08, transition: "opacity 0.3s" }}>
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
    <Box sx={{ display: "flex", width: "100%", height: 24 }}>
      {parentLevel.map((node) => {
        const k = key(node);
        const vis = mergedRangesMap.has(k) || (mergeAnim && activeRange && activeRange[0] === node.l && activeRange[1] === node.r);
        if (node.l === node.r) return <Box key={k} sx={{ flex: 1 }} />;
        const total = node.r - node.l + 1;
        const mid = node.l + Math.floor((node.r - node.l) / 2);
        const leftCenter = ((mid - node.l + 1) / total) * 50;
        const rightCenter = 100 - ((node.r - mid) / total) * 50;
        return (
          <Box key={k} sx={{ flex: total, position: "relative", height: "100%", opacity: vis ? 1 : 0.08, transition: "opacity 0.3s" }}>
            <Box sx={{ position: "absolute", left: `${leftCenter}%`, top: 0, width: 1.5, height: "60%", bgcolor: mergeLineColor }} />
            <Box sx={{ position: "absolute", left: `${rightCenter}%`, top: 0, width: 1.5, height: "60%", bgcolor: mergeLineColor }} />
            <Box sx={{ position: "absolute", left: `${leftCenter}%`, width: `${rightCenter - leftCenter}%`, top: "60%", height: 1.5, bgcolor: mergeLineColor }} />
            <Box sx={{ position: "absolute", left: "50%", top: "60%", width: 1.5, height: "40%", bgcolor: mergeLineColor, transform: "translateX(-50%)" }} />
          </Box>
        );
      })}
    </Box>
  );

  /* ── Merge animation: source rows ── */
  const MergeSourceRow = ({ arr, ptr, side, label }: {
    arr: number[]; ptr: number; side: "left" | "right"; label: string;
  }) => {
    const sideColor = side === "left" ? "#06b6d4" : "#f97316";
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, flex: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: sideColor, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
          {arr.map((val, idx) => {
            const isUsed = idx < ptr;
            const isPointer = idx === ptr;
            let color = dark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.5)";
            let border = dark ? "rgba(71,85,105,0.3)" : "rgba(148,163,184,0.3)";
            let glow: string | undefined;
            let opacity = 0.4;
            if (isPointer) {
              color = "#eab308"; border = "#eab308"; glow = "0 0 14px rgba(234,179,8,0.4)"; opacity = 1;
            } else if (!isUsed) {
              color = sideColor; border = sideColor; opacity = 0.7;
            }
            return (
              <Box key={idx} sx={{ display: "inline-flex", alignItems: "center", gap: 0.3 }}>
                <LLNode val={val} color={color} borderColor={border} glow={glow} opacity={opacity} size={26} />
                {idx < arr.length - 1 && <ArrowRightAltIcon sx={{ fontSize: 12, color: border, opacity: 0.4 }} />}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  /* ── Merge result row ── */
  const MergeResultRow = ({ anim }: { anim: LLMergeAnimData }) => (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, width: "100%" }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Merged List
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
        {anim.result.map((val, idx) => {
          const isJustPlaced = idx === anim.lastResultIdx;
          const isPlaced = val !== null && !isJustPlaced;
          let color = dark ? "rgba(71,85,105,0.3)" : "rgba(148,163,184,0.3)";
          let border = color;
          let glow: string | undefined;
          let opacity = 0.3;
          if (isJustPlaced) {
            const fromColor = anim.lastFrom === "left" ? "#06b6d4" : "#f97316";
            color = fromColor; border = fromColor;
            glow = `0 0 16px ${anim.lastFrom === "left" ? "rgba(6,182,212,0.5)" : "rgba(249,115,22,0.5)"}`;
            opacity = 1;
          } else if (isPlaced) {
            color = "#10b981"; border = "rgba(16,185,129,0.4)"; opacity = 0.85;
          }
          return (
            <Box key={idx} sx={{ display: "inline-flex", alignItems: "center", gap: 0.3 }}>
              <LLNode val={val !== null ? val : "·"} color={color} borderColor={border}
                glow={glow} opacity={opacity} size={26} />
              {idx < anim.result.length - 1 && (
                <ArrowRightAltIcon sx={{ fontSize: 12, color: val !== null ? "#10b981" : "rgba(99,102,241,0.2)", opacity: 0.4 }} />
              )}
            </Box>
          );
        })}
        <Typography sx={{ color: "#10b981", fontFamily: "var(--font-mono)", fontSize: "0.5rem",
          fontWeight: 700, ml: 0.3, opacity: 0.5 }}>NULL</Typography>
      </Box>
    </Box>
  );

  if (n === 0) return <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography color="text.disabled">No list</Typography></Box>;

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
          Divide Phase — Split with Slow/Fast Pointers
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
                const style = getNodeStyle(vis, !!isActive(node), !!isLeft(node), !!isRight(node), false);
                return (
                  <Box key={key(node)} sx={{ flex: node.r - node.l + 1, display: "flex", justifyContent: "center", px: 0.5, py: 0.5 }}>
                    <LLChain vals={vals} color={style.color} borderColor={style.border}
                      glow={style.glow} opacity={style.opacity} size={n > 8 ? 26 : 30} />
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
          mx: "auto", mb: 2, p: 2, borderRadius: 2, width: "fit-content", maxWidth: "95%",
          border: `1.5px solid ${dark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.2)"}`,
          bgcolor: dark ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.03)",
          backdropFilter: "blur(8px)",
        }}>
          <Typography variant="caption" sx={{ display: "block", textAlign: "center", mb: 1.5, fontWeight: 700, color: "success.main", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Merging [{activeRange?.[0]}..{activeRange?.[1]}]
          </Typography>
          <Box sx={{ display: "flex", gap: 3, justifyContent: "center", mb: 1.5 }}>
            <MergeSourceRow arr={mergeAnim.leftArr} ptr={mergeAnim.leftPtr} side="left"
              label={`Left [${leftRange?.[0]}..${leftRange?.[1]}]`} />
            <MergeSourceRow arr={mergeAnim.rightArr} ptr={mergeAnim.rightPtr} side="right"
              label={`Right [${rightRange?.[0]}..${rightRange?.[1]}]`} />
          </Box>
          <Box sx={{ textAlign: "center", color: "text.disabled", fontSize: "0.8rem", mb: 0.5 }}>▼</Box>
          <MergeResultRow anim={mergeAnim} />
        </Box>
      )}

      {/* ════ MERGE TREE ════ */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, justifyContent: "center" }}>
        <MergeIcon sx={{ fontSize: 18, color: "success.main" }} />
        <Typography variant="overline" sx={{ fontSize: "0.8rem", fontWeight: 800, color: "success.main", letterSpacing: "0.12em" }}>
          Merge Phase — Sorted Merge of Sub-lists
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

                  const isBeingMerged = k === activeMergeKey;
                  const isSourceLeft = k === activeMergeLeftKey;
                  const isSourceRight = k === activeMergeRightKey;

                  let vals: (number | string)[];
                  let style: ReturnType<typeof getNodeStyle>;

                  if (isBeingMerged && mergeAnim) {
                    const placed = mergeAnim.result.filter(v => v !== null) as number[];
                    vals = placed.length > 0 ? placed : ["?"];
                    style = { color: "#8b5cf6", border: "#8b5cf6", glow: "0 0 16px rgba(139,92,246,0.4)", opacity: 1 };
                  } else if (isSourceLeft && mergeAnim) {
                    vals = mergeAnim.leftArr;
                    style = { color: "#06b6d4", border: "#06b6d4", glow: "0 0 10px rgba(6,182,212,0.3)", opacity: 1 };
                  } else if (isSourceRight && mergeAnim) {
                    vals = mergeAnim.rightArr;
                    style = { color: "#f97316", border: "#f97316", glow: "0 0 10px rgba(249,115,22,0.3)", opacity: 1 };
                  } else {
                    vals = isMerged && mergedVals ? mergedVals : isLeaf ? [initialArray[node.l]] : ["?"];
                    style = getNodeStyle(vis, !!isActive(node), false, false, isMerged);
                  }

                  return (
                    <Box key={k} sx={{ flex: node.r - node.l + 1, display: "flex", justifyContent: "center", px: 0.5, py: 0.5 }}>
                      <LLChain vals={vals} color={style.color} borderColor={style.border}
                        glow={style.glow} opacity={style.opacity} size={n > 8 ? 26 : 30} />
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
