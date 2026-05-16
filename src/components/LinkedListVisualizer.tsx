import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { LLSnapshot, LLNodeData } from "@/hooks/useLinkedList";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";

interface LinkedListVisualizerProps {
  currentState: LLSnapshot;
}

export default function LinkedListVisualizer({ currentState }: LinkedListVisualizerProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const { nodes, head, tail, pointers } = currentState;

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

  // Find disconnected nodes (newly created or deleted but still in state)
  const disconnected = nodes.filter(n => !visited.has(n.id));

  const allRenderedNodes = [...sequence];
  const { activeCodeKey } = currentState;

  disconnected.forEach(dNode => {
    if (activeCodeKey === "insertAtHead" || activeCodeKey === "deleteHead" || activeCodeKey === "pushFront") {
      allRenderedNodes.unshift(dNode);
    } else if (activeCodeKey === "insertAtTail" || activeCodeKey === "deleteTail" || activeCodeKey === "pushBack") {
      allRenderedNodes.push(dNode);
    } else if (activeCodeKey === "insertAtPosition" || activeCodeKey === "insertAfterValue") {
      const tempIdx = allRenderedNodes.findIndex(n => n.id === pointers["temp"]);
      if (tempIdx !== -1) allRenderedNodes.splice(tempIdx + 1, 0, dNode);
      else allRenderedNodes.unshift(dNode); // fallback
    } else if (activeCodeKey === "insertBeforeValue") {
      const currIdx = allRenderedNodes.findIndex(n => n.id === pointers["curr"]);
      if (currIdx !== -1) allRenderedNodes.splice(currIdx, 0, dNode);
      else allRenderedNodes.unshift(dNode);
    } else if (activeCodeKey === "deleteByValue" || activeCodeKey === "removeDuplicates") {
      const prevIdx = allRenderedNodes.findIndex(n => n.id === pointers["prev"]);
      if (prevIdx !== -1) allRenderedNodes.splice(prevIdx + 1, 0, dNode);
      else allRenderedNodes.unshift(dNode); // fallback (e.g. deleting head)
    } else if (activeCodeKey === "insertSorted") {
      const currIdx = allRenderedNodes.findIndex(n => n.id === pointers["curr"]);
      if (currIdx !== -1) allRenderedNodes.splice(currIdx + 1, 0, dNode);
      else allRenderedNodes.unshift(dNode);
    } else if (activeCodeKey === "insertRecursive") {
      const nwIdx = allRenderedNodes.findIndex(n => n.id === pointers["newNode"]);
      if (nwIdx === -1) {
        // Try to find position based on frame pointers
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
    if (ptr === "head") return "#10b981"; // emerald
    if (ptr === "tail") return "#f97316"; // orange
    if (ptr === "temp" || ptr === "curr") return "#06b6d4"; // cyan
    if (ptr === "prev") return "#8b5cf6"; // purple
    if (ptr === "fast") return "#ef4444"; // red
    if (ptr === "slow") return "#3b82f6"; // blue
    return "#ec4899"; // pink (default)
  };

  return (
    <Box sx={{ flex: 1, p: 3, display: "flex", flexDirection: "column", gap: 3, overflowY: "auto", position: "relative" }}>
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "white" : "black"} 1px, transparent 0)`,
        backgroundSize: "32px 32px" }} />

      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, minHeight: 300, display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center", justifyContent: "center",
          bgcolor: dark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", borderColor: "rgba(99,102,241,0.2)" }}>
        
        {allRenderedNodes.length === 0 && (
          <Typography color="text.disabled" sx={{ fontStyle: "italic" }}>List is empty.</Typography>
        )}

        <AnimatePresence mode="popLayout">
          {allRenderedNodes.map((node, index) => {
            const isDisconnected = !visited.has(node.id);
            const isLastInSequence = index === sequence.length - 1 && !isDisconnected;
            const pts = getPointersForNode(node.id);

            return (
              <Box key={node.id} sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative" }}>
                {/* Node Box */}
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: isDisconnected ? 0.5 : 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ position: "relative", zIndex: 2 }}
                >
                  <Box sx={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    width: 56, height: 56, borderRadius: "50%",
                    bgcolor: dark ? "rgba(51,65,85,0.8)" : "rgba(226,232,240,0.8)",
                    border: `2px solid ${isDisconnected ? (dark ? "#475569" : "#cbd5e1") : "#6366f1"}`,
                    boxShadow: isDisconnected ? "none" : `0 0 15px rgba(99,102,241,0.3)`
                  }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.1rem", color: isDisconnected ? "text.disabled" : "text.primary" }}>
                      {node.val}
                    </Typography>
                  </Box>

                  {/* Pointers mapping above/below */}
                  <Box sx={{ position: "absolute", top: -35, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 0.5 }}>
                    {pts.filter(p => p !== "head" && p !== "tail").map(p => (
                      <Typography key={p} sx={{ fontSize: "0.6rem", fontWeight: 700, color: getPointerColor(p), bgcolor: `${getPointerColor(p)}22`, px: 0.5, borderRadius: 0.5 }}>
                        {p} ↓
                      </Typography>
                    ))}
                  </Box>

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
      
      {/* Visual indicators for extra state (e.g. Set for duplicates, Arr for Palindrome) */}
      {currentState.extraState && (
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
