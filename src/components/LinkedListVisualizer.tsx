import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { LLSnapshot, LLNodeData } from "@/hooks/useLinkedList";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface LinkedListVisualizerProps {
  currentState: LLSnapshot;
}

/* ── Sort-specific metadata helpers ── */
const SORT_OPS = new Set(["bubbleSortLL", "selectionSortLL", "insertionSortLL", "mergeSortLL", "quickSortLL"]);

function isSortOp(key: string | null) {
  return key !== null && SORT_OPS.has(key);
}

export default function LinkedListVisualizer({ currentState }: LinkedListVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const { nodes, head, tail, pointers } = currentState;
  const extra = currentState.extraState as any;
  const sortType = extra?._sort as string | undefined;
  const isSorting = isSortOp(currentState.activeCodeKey);

  // Build the logical sequence from head
  const sequence: LLNodeData[] = [];
  const visited = new Set<string>();
  let curr = head;

  while (curr && !visited.has(curr)) {
    visited.add(curr);
    const node = nodes.find(n => n.id === curr);
    if (node) {
      sequence.push(node);
      curr = node.nextId;
    } else {
      break;
    }
  }

  // Find disconnected nodes
  const disconnected = nodes.filter(n => !visited.has(n.id));
  const allRenderedNodes = [...sequence];
  const { activeCodeKey } = currentState;

  if (!isSorting) {
    disconnected.forEach(dNode => {
      if (activeCodeKey === "insertAtHead" || activeCodeKey === "deleteHead" || activeCodeKey === "pushFront") {
        allRenderedNodes.unshift(dNode);
      } else if (activeCodeKey === "insertAtTail" || activeCodeKey === "deleteTail" || activeCodeKey === "pushBack") {
        allRenderedNodes.push(dNode);
      } else if (activeCodeKey === "insertAtPosition" || activeCodeKey === "insertAfterValue") {
        const tempIdx = allRenderedNodes.findIndex(n => n.id === pointers["temp"]);
        if (tempIdx !== -1) allRenderedNodes.splice(tempIdx + 1, 0, dNode);
        else allRenderedNodes.unshift(dNode);
      } else if (activeCodeKey === "insertBeforeValue") {
        const currIdx = allRenderedNodes.findIndex(n => n.id === pointers["curr"]);
        if (currIdx !== -1) allRenderedNodes.splice(currIdx, 0, dNode);
        else allRenderedNodes.unshift(dNode);
      } else if (activeCodeKey === "deleteByValue" || activeCodeKey === "removeDuplicates") {
        const prevIdx = allRenderedNodes.findIndex(n => n.id === pointers["prev"]);
        if (prevIdx !== -1) allRenderedNodes.splice(prevIdx + 1, 0, dNode);
        else allRenderedNodes.unshift(dNode);
      } else if (activeCodeKey === "insertSorted") {
        const currIdx = allRenderedNodes.findIndex(n => n.id === pointers["curr"]);
        if (currIdx !== -1) allRenderedNodes.splice(currIdx + 1, 0, dNode);
        else allRenderedNodes.unshift(dNode);
      } else if (activeCodeKey === "insertRecursive") {
        const nwIdx = allRenderedNodes.findIndex(n => n.id === pointers["newNode"]);
        if (nwIdx === -1) {
          let inserted = false;
          for (let i = 10; i >= 0; i--) {
            const fIdx = allRenderedNodes.findIndex(n => n.id === pointers[`frame${i}`]);
            if (fIdx !== -1) { allRenderedNodes.splice(fIdx + 1, 0, dNode); inserted = true; break; }
          }
          if (!inserted) allRenderedNodes.unshift(dNode);
        }
      } else {
        allRenderedNodes.push(dNode);
      }
    });
  }

  // Helper to get all pointers pointing to a specific node ID
  const getPointersForNode = (id: string) => {
    const pts: string[] = [];
    if (head === id) pts.push("head");
    if (tail === id) pts.push("tail");
    for (const [name, pId] of Object.entries(pointers)) {
      if (pId === id) pts.push(name);
    }
    return pts;
  };

  const getPointerColor = (ptr: string) => {
    if (ptr === "head") return "#10b981";
    if (ptr === "tail") return "#f97316";
    if (ptr === "temp" || ptr === "curr") return "#06b6d4";
    if (ptr === "prev") return "#8b5cf6";
    if (ptr === "fast") return "#ef4444";
    if (ptr === "slow") return "#3b82f6";
    if (ptr === "pivot") return "#ec4899";
    if (ptr === "i") return "#6366f1";
    if (ptr === "j") return "#06b6d4";
    if (ptr === "min") return "#f97316";
    return "#ec4899";
  };

  /* ── Sort-aware node styling ── */
  const getSortNodeStyle = (node: LLNodeData) => {
    const id = node.id;
    let bg = dark ? "rgba(51,65,85,0.8)" : "rgba(226,232,240,0.8)";
    let border = "#6366f1";
    let shadow = "0 0 15px rgba(99,102,241,0.3)";
    let scale = 1;
    let label = "";
    let labelColor = "";
    let isSorted = false;

    if (!sortType || !extra) return { bg, border, shadow, scale, label, labelColor, isSorted };

    const sortedSet = new Set(extra.sorted || []);

    if (sortType === "bubble") {
      if ((extra.comparing || []).includes(id)) {
        bg = "rgba(245,158,11,0.3)"; border = "#f59e0b"; shadow = "0 0 20px rgba(245,158,11,0.4)"; scale = 1.08;
        label = "comparing"; labelColor = "#f59e0b";
      } else if ((extra.swapping || []).includes(id)) {
        bg = "rgba(139,92,246,0.35)"; border = "#8b5cf6"; shadow = "0 0 20px rgba(139,92,246,0.5)"; scale = 1.12;
        label = "swap"; labelColor = "#8b5cf6";
      } else if (sortedSet.has(id)) {
        bg = "rgba(16,185,129,0.2)"; border = "#10b981"; shadow = "0 0 12px rgba(16,185,129,0.3)"; isSorted = true;
      }
    } else if (sortType === "selection") {
      if ((extra.swapping || []).includes(id)) {
        bg = "rgba(139,92,246,0.35)"; border = "#8b5cf6"; shadow = "0 0 20px rgba(139,92,246,0.5)"; scale = 1.12;
        label = "swap"; labelColor = "#8b5cf6";
      } else if (id === extra.scanning) {
        bg = "rgba(6,182,212,0.25)"; border = "#06b6d4"; shadow = "0 0 16px rgba(6,182,212,0.4)"; scale = 1.05;
        label = "j"; labelColor = "#06b6d4";
      } else if (id === extra.minId && !sortedSet.has(id)) {
        bg = "rgba(249,115,22,0.25)"; border = "#f97316"; shadow = "0 0 16px rgba(249,115,22,0.4)"; scale = 1.05;
        label = "min"; labelColor = "#f97316";
      } else if (id === extra.target && !sortedSet.has(id)) {
        bg = "transparent"; border = "#6366f1"; shadow = "none";
        label = "i"; labelColor = "#6366f1";
      } else if (sortedSet.has(id)) {
        bg = "rgba(16,185,129,0.2)"; border = "#10b981"; shadow = "0 0 12px rgba(16,185,129,0.3)"; isSorted = true;
      }
    } else if (sortType === "insertion") {
      if (id === extra.keyId) {
        bg = "rgba(139,92,246,0.35)"; border = "#8b5cf6"; shadow = "0 0 24px rgba(139,92,246,0.5)"; scale = 1.1;
        label = "key"; labelColor = "#8b5cf6";
      } else if (sortedSet.has(id)) {
        bg = "rgba(16,185,129,0.2)"; border = "#10b981"; shadow = "0 0 12px rgba(16,185,129,0.3)"; isSorted = true;
      } else {
        bg = dark ? "rgba(51,65,85,0.4)" : "rgba(226,232,240,0.4)";
        border = dark ? "#475569" : "#cbd5e1"; shadow = "none";
      }
    } else if (sortType === "merge") {
      const compVals = extra.comparing || [];
      if (compVals.includes(node.val) && extra.phase === "merge") {
        bg = "rgba(245,158,11,0.3)"; border = "#f59e0b"; shadow = "0 0 20px rgba(245,158,11,0.4)"; scale = 1.08;
        label = "compare"; labelColor = "#f59e0b";
      } else if (extra.phase === "complete") {
        bg = "rgba(16,185,129,0.2)"; border = "#10b981"; shadow = "0 0 12px rgba(16,185,129,0.3)"; isSorted = true;
      }
    } else if (sortType === "quick") {
      if (id === extra.pivotId) {
        bg = "rgba(236,72,153,0.3)"; border = "#ec4899"; shadow = "0 0 20px rgba(236,72,153,0.5)"; scale = 1.1;
        label = "pivot"; labelColor = "#ec4899";
      } else if (id === extra.comparing) {
        bg = "rgba(245,158,11,0.3)"; border = "#f59e0b"; shadow = "0 0 20px rgba(245,158,11,0.4)"; scale = 1.08;
        label = "curr"; labelColor = "#f59e0b";
      } else if (sortedSet.has(id)) {
        bg = "rgba(16,185,129,0.2)"; border = "#10b981"; shadow = "0 0 12px rgba(16,185,129,0.3)"; isSorted = true;
      }
    }

    return { bg, border, shadow, scale, label, labelColor, isSorted };
  };

  /* ── Sort legend colors ── */
  const getSortLegend = (): { label: string; color: string }[] => {
    if (!sortType) return [];
    if (sortType === "bubble") return [
      { label: "Comparing", color: "#f59e0b" }, { label: "Swapping", color: "#8b5cf6" }, { label: "Sorted", color: "#10b981" }
    ];
    if (sortType === "selection") return [
      { label: "Target (i)", color: "#6366f1" }, { label: "Min", color: "#f97316" }, { label: "Scanning (j)", color: "#06b6d4" },
      { label: "Swapping", color: "#8b5cf6" }, { label: "Sorted", color: "#10b981" }
    ];
    if (sortType === "insertion") return [
      { label: "Key", color: "#8b5cf6" }, { label: "Sorted", color: "#10b981" }, { label: "Unsorted", color: dark ? "#475569" : "#94a3b8" }
    ];
    if (sortType === "merge") return [
      { label: "Comparing", color: "#f59e0b" }, { label: "Sorted", color: "#10b981" }
    ];
    if (sortType === "quick") return [
      { label: "Pivot", color: "#ec4899" }, { label: "Comparing", color: "#f59e0b" }, { label: "Sorted", color: "#10b981" }
    ];
    return [];
  };

  return (
    <Box sx={{ flex: 1, p: 3, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", position: "relative" }}>
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "white" : "black"} 1px, transparent 0)`,
        backgroundSize: "32px 32px" }} />

      {/* Sort title bar */}
      {isSorting && sortType && (
        <Paper variant="outlined" sx={{ px: 2, py: 1, borderColor: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between",
          bgcolor: dark ? "rgba(15,23,42,0.5)" : "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)" }}>
          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.5, color: "primary.main" }}>
            {sortType === "bubble" && "Bubble Sort"}
            {sortType === "selection" && "Selection Sort"}
            {sortType === "insertion" && "Insertion Sort"}
            {sortType === "merge" && "Merge Sort"}
            {sortType === "quick" && "Quick Sort"}
            {" "}on Linked List
          </Typography>
          {extra?.pass && <Typography variant="caption" sx={{ fontFamily: "var(--font-mono)", color: "text.secondary" }}>Pass {extra.pass}</Typography>}
          {extra?.depth !== undefined && sortType === "merge" && <Typography variant="caption" sx={{ fontFamily: "var(--font-mono)", color: "text.secondary" }}>Depth {extra.depth} · {extra.phase}</Typography>}
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, minHeight: 300, display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center", justifyContent: "center",
          bgcolor: dark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", borderColor: "rgba(99,102,241,0.2)" }}>
        
        {allRenderedNodes.length === 0 && (
          <Typography color="text.disabled" sx={{ fontStyle: "italic" }}>List is empty.</Typography>
        )}

        <AnimatePresence mode="popLayout">
          {allRenderedNodes.map((node, index) => {
            const isDisconnected = !visited.has(node.id);
            const pts = getPointersForNode(node.id);
            const sortStyle = isSorting ? getSortNodeStyle(node) : null;

            const bg = sortStyle ? sortStyle.bg : (dark ? "rgba(51,65,85,0.8)" : "rgba(226,232,240,0.8)");
            const borderCol = sortStyle ? sortStyle.border : (isDisconnected ? (dark ? "#475569" : "#cbd5e1") : "#6366f1");
            const shadow = sortStyle ? sortStyle.shadow : (isDisconnected ? "none" : "0 0 15px rgba(99,102,241,0.3)");
            const animScale = sortStyle ? sortStyle.scale : 1;

            return (
              <Box key={node.id} sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative" }}>
                {/* Node Box */}
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: isDisconnected ? 0.5 : 1, scale: animScale, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ position: "relative", zIndex: 2 }}
                >
                  <Box sx={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    width: 56, height: 56, borderRadius: "50%",
                    bgcolor: bg,
                    border: `2px solid ${borderCol}`,
                    boxShadow: shadow,
                    transition: "background-color 0.25s, border-color 0.25s, box-shadow 0.25s"
                  }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.1rem", color: isDisconnected ? "text.disabled" : "text.primary" }}>
                      {node.val}
                    </Typography>
                  </Box>

                  {/* Sorted checkmark */}
                  {sortStyle?.isSorted && (
                    <Box sx={{ position: "absolute", top: -4, right: -4, bgcolor: "background.paper", borderRadius: "50%", zIndex: 3 }}>
                      <CheckCircleIcon sx={{ fontSize: 16, color: "#10b981" }} />
                    </Box>
                  )}

                  {/* Sort-specific label badge (above node) */}
                  {sortStyle?.label && (
                    <Box sx={{ position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)", zIndex: 4 }}>
                      <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, bgcolor: `${sortStyle.labelColor}22`, border: `1px solid ${sortStyle.labelColor}`,
                        color: sortStyle.labelColor, fontSize: "0.58rem", fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        {sortStyle.label}
                      </Box>
                    </Box>
                  )}

                  {/* Pointers above (non-sort) */}
                  {!isSorting && (
                    <Box sx={{ position: "absolute", top: -35, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 0.5 }}>
                      {pts.filter(p => p !== "head" && p !== "tail").map(p => (
                        <Typography key={p} sx={{ fontSize: "0.6rem", fontWeight: 700, color: getPointerColor(p), bgcolor: `${getPointerColor(p)}22`, px: 0.5, borderRadius: 0.5 }}>
                          {p} ↓
                        </Typography>
                      ))}
                    </Box>
                  )}

                  <Box sx={{ position: "absolute", bottom: -25, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                    {pts.filter(p => p === "head" || p === "tail").map(p => (
                      <Typography key={p} sx={{ fontSize: "0.6rem", fontWeight: 700, color: getPointerColor(p), bgcolor: `${getPointerColor(p)}22`, px: 0.5, borderRadius: 0.5 }}>
                        ↑ {p.toUpperCase()}
                      </Typography>
                    ))}
                  </Box>
                </motion.div>

                {/* Arrow to Next */}
                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {node.nextId ? (
                    <ArrowRightAltIcon sx={{ fontSize: 32, color: "#6366f1", opacity: 0.7 }} />
                  ) : (
                    <Typography sx={{ color: "text.disabled", fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, ml: -1 }}>NULL</Typography>
                  )}
                </motion.div>
              </Box>
            );
          })}
        </AnimatePresence>
      </Paper>

      {/* Sort Legend */}
      {isSorting && sortType && (
        <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, borderColor: "rgba(99,102,241,0.2)",
          bgcolor: dark ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.4)", display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
          <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.65rem", mr: 1 }}>Legend</Typography>
          {getSortLegend().map(item => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>{item.label}</Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Merge sort sub-arrays panel */}
      {sortType === "merge" && extra?.phase && extra.phase !== "complete" && (extra.left?.length > 0 || extra.right?.length > 0 || extra.merged?.length > 0) && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: "rgba(99,102,241,0.2)",
          bgcolor: dark ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.4)", display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
          {extra.left?.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 700, color: "#06b6d4", fontSize: "0.65rem" }}>Left</Typography>
              <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#06b6d4", fontWeight: 600 }}>
                [{extra.left.join(", ")}]
              </Typography>
            </Box>
          )}
          {extra.right?.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 700, color: "#f97316", fontSize: "0.65rem" }}>Right</Typography>
              <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#f97316", fontWeight: 600 }}>
                [{extra.right.join(", ")}]
              </Typography>
            </Box>
          )}
          {extra.merged?.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 700, color: "#10b981", fontSize: "0.65rem" }}>Merged</Typography>
              <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
                [{extra.merged.join(", ")}]
              </Typography>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Generic extra state (non-sort) */}
      {currentState.extraState && !isSorting && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: "rgba(99,102,241,0.2)", display: "flex", gap: 2, flexWrap: "wrap", bgcolor: dark ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.4)" }}>
          {Object.entries(currentState.extraState).map(([k, v]) => (
            <Box key={k} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.65rem" }}>{k.toUpperCase()}</Typography>
              <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "primary.main", fontWeight: 600 }}>
                {Array.isArray(v) ? `[ ${v.join(", ")} ]` : String(v)}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}
