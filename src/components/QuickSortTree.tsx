"use client";
import { Box, Typography } from "@mui/material";
import { useThemeMode } from "@/components/ThemeRegistry";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import MergeIcon from "@mui/icons-material/Merge";
import type { QSAnimData, QSTreeNode, QSItem } from "@/hooks/useQuickSort";
import { motion } from "framer-motion";

interface Props {
  initialArray: number[];
  treeLevels: QSTreeNode[][];
  parentMap: Map<string, string>;
  partitionedRanges: Set<string>;
  sortedRangesMap: Map<string, QSItem[]>;
  pivotMap: Map<string, number>;
  snapshotMap: Map<string, QSItem[]>;
  activeRange: [number, number] | null;
  qsAnim: QSAnimData | null;
}

export default function QuickSortTree({
  initialArray, treeLevels, parentMap,
  partitionedRanges, sortedRangesMap, pivotMap, snapshotMap, activeRange, qsAnim,
}: Props) {
  const { mode } = useThemeMode();
  const dark = mode === "dark";
  const n = initialArray.length;
  const key = (nd: QSTreeNode) => `${nd.l}-${nd.r}`;

  const isVis = (nd: QSTreeNode, lvl: number) => {
    if (lvl === 0) return true;
    const pk = parentMap.get(key(nd));
    return pk ? partitionedRanges.has(pk) : false;
  };
  const isAct = (nd: QSTreeNode) => activeRange && activeRange[0] === nd.l && activeRange[1] === nd.r;

  const lnClr = dark ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.25)";
  const cbClr = dark ? "rgba(16,185,129,0.4)" : "rgba(16,185,129,0.3)";

  const elSx = (isPiv: boolean, clr: string) => ({
    minWidth: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: "4px", fontFamily: "var(--font-mono)", fontSize: "0.72rem", fontWeight: 700,
    bgcolor: isPiv ? (dark ? "rgba(16,185,129,0.3)" : "rgba(52,211,153,0.3)") : "transparent",
    color: isPiv ? "#10b981" : clr,
    border: isPiv ? "1px solid #10b981" : "1px solid transparent",
    transition: "all 0.3s ease",
  });

  /* ── Partition node ── */
  const PNode = ({ nd, lvl }: { nd: QSTreeNode; lvl: number }) => {
    const vis = isVis(nd, lvl);
    const act = !!isAct(nd);
    const k = key(nd);
    const sorted = sortedRangesMap.has(k);
    const pv = pivotMap.get(k);
    const vals = snapshotMap.get(k) || initialArray.slice(nd.l, nd.r + 1).map((v, i) => ({ val: v, id: `v-${v}-${nd.l + i}` }));

    let bg = dark ? "rgba(51,65,85,0.6)" : "rgba(226,232,240,0.7)";
    let bd = dark ? "rgba(71,85,105,0.5)" : "rgba(148,163,184,0.4)";
    let cl = "text.secondary"; let sh = "none";

    if (nd.isPivot) {
      bg = dark ? "rgba(16,185,129,0.25)" : "rgba(52,211,153,0.25)";
      bd = "#10b981"; cl = "success.main"; sh = "0 0 10px rgba(16,185,129,0.3)";
    } else if (sorted) {
      bg = dark ? "rgba(16,185,129,0.15)" : "rgba(52,211,153,0.15)";
      bd = "#10b981"; cl = "success.main"; sh = "0 0 8px rgba(16,185,129,0.2)";
    } else if (act) {
      bg = dark ? "rgba(139,92,246,0.25)" : "rgba(167,139,250,0.25)";
      bd = "#8b5cf6"; cl = "secondary.main"; sh = "0 0 14px rgba(139,92,246,0.3)";
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.3 }}>
        {(nd.isPivot || pv !== undefined) && (
          <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, color: "#10b981", letterSpacing: "0.08em" }}>pivot</Typography>
        )}
        <Box sx={{ display: "flex", gap: "2px", p: "3px 6px", borderRadius: "8px",
          bgcolor: bg, border: `1.5px solid ${bd}`, boxShadow: sh,
          opacity: vis ? 1 : 0.12, transition: "all 0.35s ease" }}>
          {vals.map((v) => <Box component={motion.div} layout transition={{ type: "spring", stiffness: 300, damping: 25 }} key={v.id} sx={elSx(pv !== undefined && v.val === pv, cl)}>{v.val}</Box>)}
        </Box>
      </Box>
    );
  };

  /* ── Combine node ── */
  const CNode = ({ nd, lvl }: { nd: QSTreeNode; lvl: number }) => {
    const k = key(nd);
    const sorted = sortedRangesMap.has(k);
    const sv = sortedRangesMap.get(k);
    const vis = sorted || (nd.l === nd.r && isVis(nd, lvl));
    const vals = sorted && sv ? sv : nd.l === nd.r ? [{ val: initialArray[nd.l], id: `v-${initialArray[nd.l]}-${nd.l}` }] : [];

    let bg = dark ? "rgba(51,65,85,0.4)" : "rgba(226,232,240,0.5)";
    let bd = dark ? "rgba(71,85,105,0.3)" : "rgba(148,163,184,0.3)";
    let cl = "text.disabled";
    if (sorted) { bg = dark ? "rgba(16,185,129,0.15)" : "rgba(52,211,153,0.15)"; bd = "#10b981"; cl = "success.main"; }

    return (
      <Box sx={{ display: "flex", gap: "2px", p: "3px 6px", borderRadius: "8px",
        bgcolor: bg, border: `1.5px solid ${bd}`, opacity: vis ? 1 : 0.12,
        transition: "all 0.35s ease", boxShadow: sorted ? "0 0 8px rgba(16,185,129,0.2)" : "none" }}>
        {vals.length > 0 ? vals.map((v) => (
          <Box component={motion.div} layout transition={{ type: "spring", stiffness: 300, damping: 25 }} key={v.id} sx={{ minWidth: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "4px", fontFamily: "var(--font-mono)", fontSize: "0.72rem", fontWeight: 700, color: cl }}>{v.val}</Box>
        )) : (
          <Box sx={{ minWidth: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "text.disabled" }}>?</Box>
        )}
      </Box>
    );
  };

  /* ── Connector with multi-child support ── */
  const Conn = ({ parentLevel, lc, inv }: { parentLevel: QSTreeNode[]; lc: string; inv?: boolean }) => (
    <Box sx={{ display: "flex", width: "100%", height: 28 }}>
      {parentLevel.map((nd) => {
        const k = key(nd);
        const vis = partitionedRanges.has(k);
        if (nd.phantom || nd.l === nd.r) return <Box key={k || `p${nd.l}`} sx={{ flex: 1 }} />;

        const kids: { l: number; r: number }[] = [];
        for (const [ck, pk] of parentMap.entries()) {
          if (pk === k) { const [cl, cr] = ck.split("-").map(Number); kids.push({ l: cl, r: cr }); }
        }
        kids.sort((a, b) => a.l - b.l);
        if (!kids.length) return <Box key={k} sx={{ flex: nd.r - nd.l + 1 }} />;

        const total = nd.r - nd.l + 1;
        const centers = kids.map(c => ((c.l - nd.l + (c.r - c.l + 1) / 2) / total) * 100);
        const first = centers[0], last = centers[centers.length - 1];

        return (
          <Box key={k} sx={{ flex: total, position: "relative", height: "100%", opacity: vis ? 1 : 0.1, transition: "opacity 0.3s" }}>
            {inv ? (<>
              {centers.map((c, i) => <Box key={i} sx={{ position: "absolute", left: `${c}%`, top: 0, width: 1.5, height: "60%", bgcolor: lc, transform: "translateX(-50%)" }} />)}
              <Box sx={{ position: "absolute", left: `${first}%`, width: `${last - first}%`, top: "60%", height: 1.5, bgcolor: lc }} />
              <Box sx={{ position: "absolute", left: "50%", top: "60%", width: 1.5, height: "40%", bgcolor: lc, transform: "translateX(-50%)" }} />
            </>) : (<>
              <Box sx={{ position: "absolute", left: "50%", top: 0, width: 1.5, height: "40%", bgcolor: lc, transform: "translateX(-50%)" }} />
              <Box sx={{ position: "absolute", left: `${first}%`, width: `${last - first}%`, top: "40%", height: 1.5, bgcolor: lc }} />
              {centers.map((c, i) => <Box key={i} sx={{ position: "absolute", left: `${c}%`, top: "40%", width: 1.5, height: "60%", bgcolor: lc, transform: "translateX(-50%)" }} />)}
            </>)}
          </Box>
        );
      })}
    </Box>
  );

  /* ── Anim panel ── */
  const Anim = ({ a }: { a: QSAnimData }) => (
    <Box sx={{ mx: "auto", mb: 2, p: 2, borderRadius: 2, width: "fit-content", maxWidth: "90%",
      border: `1.5px solid ${dark ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.2)"}`,
      bgcolor: dark ? "rgba(139,92,246,0.05)" : "rgba(139,92,246,0.03)" }}>
      <Typography variant="caption" sx={{ display: "block", textAlign: "center", mb: 1.5, fontWeight: 700, color: "secondary.main", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Partitioning [{activeRange?.[0]}..{activeRange?.[1]}] — Pivot: {a.pivotVal}
      </Typography>
      <Box sx={{ display: "flex", gap: "4px", justifyContent: "center" }}>
        {a.subarray.map((item, idx) => {
          const val = item.val;
          const ri = a.low + idx;
          const isI = ri === a.iPtr;
          const isJ = ri === a.jPtr;
          const isPiv = ri === a.pivotPos;
          const isSw = a.lastSwap && (ri === a.lastSwap[0] || ri === a.lastSwap[1]);
          let bg = dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.6)";
          let bd = dark ? "rgba(71,85,105,0.4)" : "rgba(148,163,184,0.3)";
          let cl = "text.secondary"; let sh = "none"; let lb = "";

          if (isSw) { bg = dark ? "rgba(239,68,68,0.3)" : "rgba(248,113,113,0.3)"; bd = "#ef4444"; cl = "#ef4444"; sh = "0 0 14px rgba(239,68,68,0.4)"; }
          else if (isPiv) { bg = dark ? "rgba(16,185,129,0.3)" : "rgba(52,211,153,0.3)"; bd = "#10b981"; cl = "#10b981"; lb = "piv"; }
          else if (isI && isJ) { bg = dark ? "rgba(250,204,21,0.3)" : "rgba(253,224,71,0.3)"; bd = "#eab308"; cl = "#eab308"; lb = "i,j"; }
          else if (isI) { bg = dark ? "rgba(6,182,212,0.3)" : "rgba(34,211,238,0.3)"; bd = "#06b6d4"; cl = "#06b6d4"; lb = a.phase === "counting" ? "scan" : "i"; }
          else if (isJ) { bg = dark ? "rgba(249,115,22,0.3)" : "rgba(251,146,60,0.3)"; bd = "#f97316"; cl = "#f97316"; lb = "j"; }

          return (
            <Box component={motion.div} layout transition={{ type: "spring", stiffness: 300, damping: 25 }} key={item.id} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.3 }}>
              <Typography sx={{ fontSize: "0.5rem", fontWeight: 700, color: cl, minHeight: 12 }}>{lb}</Typography>
              <Box sx={{ minWidth: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700,
                bgcolor: bg, border: `1.5px solid ${bd}`, color: cl, boxShadow: sh, transition: "all 0.3s ease" }}>{val}</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  if (!n || !treeLevels.length) return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography color="text.disabled" sx={{ fontStyle: "italic" }}>Press Start to visualize</Typography>
    </Box>
  );

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "auto",
      bgcolor: (t) => t.palette.background.default, p: { xs: 1, md: 2 } }}>
      {/* Partition Tree */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, justifyContent: "center" }}>
        <CallSplitIcon sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="overline" sx={{ fontSize: "0.8rem", fontWeight: 800, color: "primary.main", letterSpacing: "0.12em" }}>Partition Phase</Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0, mb: 1, px: 1 }}>
        {treeLevels.map((lv, li) => (
          <Box key={`pt-${li}`}>
            <Box sx={{ display: "flex", width: "100%", justifyContent: "center" }}>
              {lv.map(nd => nd.phantom ? <Box key={`ph-${nd.l}`} sx={{ flex: 1 }} />
                : <Box key={key(nd)} sx={{ flex: nd.r - nd.l + 1, display: "flex", justifyContent: "center", px: 0.5, py: 0.4 }}><PNode nd={nd} lvl={li} /></Box>
              )}
            </Box>
            {li < treeLevels.length - 1 && <Conn parentLevel={lv} lc={lnClr} />}
          </Box>
        ))}
      </Box>
      {qsAnim && <Anim a={qsAnim} />}
      {/* Separator */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 2, px: 4 }}>
        <Box sx={{ flex: 1, height: 1, background: dark ? "linear-gradient(90deg,transparent,rgba(99,102,241,0.3),transparent)" : "linear-gradient(90deg,transparent,rgba(99,102,241,0.2),transparent)" }} />
        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: "0.65rem" }}>● ● ●</Typography>
        <Box sx={{ flex: 1, height: 1, background: dark ? "linear-gradient(90deg,transparent,rgba(16,185,129,0.3),transparent)" : "linear-gradient(90deg,transparent,rgba(16,185,129,0.2),transparent)" }} />
      </Box>
      {/* Combine Tree */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, justifyContent: "center" }}>
        <MergeIcon sx={{ fontSize: 18, color: "success.main" }} />
        <Typography variant="overline" sx={{ fontSize: "0.8rem", fontWeight: 800, color: "success.main", letterSpacing: "0.12em" }}>Sorted (Sandwich Combine)</Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0, px: 1 }}>
        {[...treeLevels].reverse().map((lv, ri) => {
          const al = treeLevels.length - 1 - ri;
          return (
            <Box key={`cb-${ri}`}>
              <Box sx={{ display: "flex", width: "100%", justifyContent: "center" }}>
                {lv.map(nd => nd.phantom ? <Box key={`mph-${nd.l}`} sx={{ flex: 1 }} />
                  : <Box key={key(nd)} sx={{ flex: nd.r - nd.l + 1, display: "flex", justifyContent: "center", px: 0.5, py: 0.4 }}><CNode nd={nd} lvl={al} /></Box>
                )}
              </Box>
              {al - 1 >= 0 && <Conn parentLevel={treeLevels[al - 1]} lc={cbClr} inv />}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
