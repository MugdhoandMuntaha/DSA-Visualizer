"use client";
import React, { useState } from "react";
import {
  Box, Typography, Slider, Button, IconButton, Paper, Tooltip, TextField,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Pause from "@mui/icons-material/Pause";
import SkipNext from "@mui/icons-material/SkipNext";
import RestartAlt from "@mui/icons-material/RestartAlt";
import InputOutlined from "@mui/icons-material/InputOutlined";
import Shuffle from "@mui/icons-material/Shuffle";
import SignalCellularAlt from "@mui/icons-material/SignalCellularAlt";
import Header from "@/components/Header";
import AlgoSteps, { StepDef } from "@/components/AlgoSteps";
import { useBlockSort } from "@/hooks/useBlockSort";
import BlockSortVisualizer from "@/components/BlockSortVisualizer";

const BLOCK_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Compute block size B = √N. Divide array into contiguous blocks." },
  { id: "block-sort-start", title: "Local Sort", description: "Sort each individual block locally using Insertion Sort." },
  { id: "order-start", title: "Order Blocks", description: "All blocks locally sorted. Now, reorder the blocks globally based on their first element." },
  { id: "block-compare", title: "Compare Blocks", description: "Comparing the first elements of two blocks to find the minimum." },
  { id: "block-swapped", title: "Swap Blocks", description: "Swapped entire blocks in memory to place the smaller block first." },
  { id: "merge-start", title: "Merge Phase", description: "Blocks are roughly ordered. Progressively merge adjacent blocks." },
  { id: "merge-place", title: "Merge", description: "Standard merge operation across block boundaries." },
  { id: "done", title: "Done", description: "Array fully sorted via pedagogical Block Sort." },
];

export default function BlockSortPage() {
  const [baseArray, setBaseArray] = useState([23, 11, 45, 9, 2, 88, 31, 14, 5, 41, 19, 72, 8, 3, 27, 50]);
  const bs = useBlockSort(baseArray);
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));
  const [resultDialogDismissed, setResultDialogDismissed] = useState(false);
  const isDone = bs.logEntries.some(l => l.type === "done");

  const handleUpdate = () => {
    if (bs.running) return;
    const arr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (arr.length >= 4 && arr.length <= 20) {
      setBaseArray(arr);
      setResultDialogDismissed(false);
      bs.resetSort();
    } else {
      alert("Enter 4–20 integers.");
    }
  };

  const handlePreset = (t: "random" | "reversed" | "classic") => {
    if (bs.running) return;
    let a: number[];
    if (t === "random") a = Array.from({ length: 16 }, () => Math.floor(Math.random() * 99) + 1);
    else if (t === "reversed") a = Array.from({ length: 16 }, (_, i) => (16 - i) * 5);
    else a = [23, 11, 45, 9, 2, 88, 31, 14, 5, 41, 19, 72, 8, 3, 27, 50]; 
    setBaseArray(a);
    setArrayInput(a.join(", "));
    setResultDialogDismissed(false);
    bs.resetSort();
  };

  const handleStart = () => {
    setResultDialogDismissed(false);
    bs.startSort(baseArray);
  };

  const tagColor: Record<string, string> = {
    init: "#7c3aed",
    "block-sort-start": "#6366f1", "ins-extract": "#8b5cf6", "ins-shift": "#ec4899", "ins-place": "#10b981", "block-sort-done": "#059669",
    "order-start": "#ea580c", "block-compare": "#eab308", "block-swap-start": "#f97316", "block-swapped": "#d97706",
    "merge-start": "#06b6d4", "merge-compare": "#3b82f6", "merge-place": "#0284c7", "merge-pass-done": "#0ea5e9",
    done: "#14b8a6",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Block Sort Visualizer" badge="O(N log N) · O(1) Space Concept" />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ─── Left Sidebar ─── */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: t => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderRight: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <InputOutlined sx={{ fontSize: 18, color: "primary.main" }} /> Input Array
            </Typography>
            <TextField fullWidth size="small" value={arrayInput} onChange={e => setArrayInput(e.target.value)}
              disabled={bs.running} placeholder="e.g. 23, 11, 45, 9"
              helperText="4–20 integers"
              sx={{ mb: 1.5, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdate} disabled={bs.running}
              sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>Update Array</Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Classic"><IconButton size="small" onClick={() => handlePreset("classic")} disabled={bs.running}><Typography sx={{ fontWeight: 900, fontSize: "0.65rem" }}>EG</Typography></IconButton></Tooltip>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={bs.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Reversed"><IconButton size="small" onClick={() => handlePreset("reversed")} disabled={bs.running}><SignalCellularAlt sx={{ fontSize: 16, transform: "scaleX(-1)" }} /></IconButton></Tooltip>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => bs.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart}
                disabled={baseArray.length === 0 || (bs.running && !bs.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={() => bs.stepSort(baseArray)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={bs.paused ? <PlayArrow /> : <Pause />} onClick={bs.togglePause} disabled={!bs.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{bs.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={bs.resetSort}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={BLOCK_STEPS} activeIdx={bs.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* ─── Visualization ─── */}
        <BlockSortVisualizer initialArray={baseArray} currentState={bs.currentState} />

        {/* ─── Right Sidebar ─── */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: t => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {bs.currentState && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>State Variables</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { label: "Block Size B", val: bs.currentState.blockSize, color: "#6366f1" },
                  { label: "Total Blocks", val: bs.currentState.blocks.length, color: "#8b5cf6" },
                  { label: "Phase", val: bs.currentState.phase, color: bs.currentState.phase === "sort-blocks" ? "#6366f1" : bs.currentState.phase === "order-blocks" ? "#ea580c" : "#10b981" },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ flex: "1 1 100%", p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.3, color: item.color, fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase" }}>{item.label}</Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.95rem", color: item.color }}>{String(item.val)}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {bs.logEntries.length === 0
                ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
                : bs.logEntries.map((entry, idx) => (
                  <Box key={idx} className="animate-fade-slide-in" sx={{ py: 0.25, borderBottom: "1px solid rgba(99,102,241,0.06)", whiteSpace: "pre-wrap" }}>
                    <Box component="span" sx={{ display: "inline-block", px: 0.75, py: 0.1, borderRadius: 0.5, fontSize: "0.6rem", fontWeight: 700,
                      textTransform: "uppercase", mr: 0.5, bgcolor: `${tagColor[entry.type] || "#6366f1"}20`, color: tagColor[entry.type] || "#6366f1" }}>
                      {entry.type}
                    </Box>
                    {entry.msg}
                  </Box>
                ))}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Result Dialog */}
      <Dialog open={isDone && !resultDialogDismissed} onClose={() => setResultDialogDismissed(true)}
        sx={{ "& .MuiDialog-paper": { bgcolor: "background.paper", backgroundImage: "none", borderRadius: 3, border: "1px solid", borderColor: "success.main", textAlign: "center", p: 2 } }}>
        <DialogTitle sx={{ color: "success.main", fontWeight: 800, fontSize: "1.5rem" }}>🎉 Block Sort Complete!</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary", fontSize: "1.1rem" }}>
            Array sorted using the Block-Merge Sort concept (O(1) space optimization).
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", mt: 1 }}>
          <Button onClick={() => setResultDialogDismissed(true)} variant="contained" color="success" sx={{ fontWeight: 700, px: 4 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
