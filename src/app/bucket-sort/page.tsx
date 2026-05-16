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
import { useBucketSort } from "@/hooks/useBucketSort";
import BucketSortVisualizer from "@/components/BucketSortVisualizer";

const BKT_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Find max value and create N range-based buckets." },
  { id: "distribute", title: "Distribute", description: "Place each element into its appropriate bucket based on value range." },
  { id: "placed", title: "Element Placed", description: "Element added to its bucket." },
  { id: "sort-start", title: "Sort Buckets", description: "Sort each individual bucket using Insertion Sort." },
  { id: "sort-bucket", title: "Sorting Bucket", description: "Running Insertion Sort inside the current bucket." },
  { id: "collect-start", title: "Collect", description: "Concatenate all sorted buckets back into the main array." },
  { id: "collect", title: "Collecting", description: "Element collected from bucket into final position." },
  { id: "done", title: "Done", description: "All elements collected. Array fully sorted." },
];

export default function BucketSortPage() {
  const [baseArray, setBaseArray] = useState([0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23, 0.68]
    .map(v => Math.round(v * 100)));
  // => [78, 17, 39, 26, 72, 94, 21, 12, 23, 68] — classic textbook values × 100
  const bkt = useBucketSort(baseArray);
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));
  const [resultDialogDismissed, setResultDialogDismissed] = useState(false);
  const isDone = bkt.logEntries.some(l => l.type === "done");

  const handleUpdate = () => {
    if (bkt.running) return;
    const arr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x) && x >= 0);
    if (arr.length > 0 && arr.length <= 14) {
      setBaseArray(arr);
      setResultDialogDismissed(false);
      bkt.resetSort();
    } else {
      alert("Enter 1–14 non-negative integers.");
    }
  };

  const handlePreset = (t: "classic" | "random" | "reversed") => {
    if (bkt.running) return;
    let a: number[];
    if (t === "classic") a = [78, 17, 39, 26, 72, 94, 21, 12, 23, 68];
    else if (t === "random") a = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
    else a = [95, 85, 75, 65, 55, 45, 35, 25, 15, 5];
    setBaseArray(a);
    setArrayInput(a.join(", "));
    setResultDialogDismissed(false);
    bkt.resetSort();
  };

  const handleStart = () => {
    setResultDialogDismissed(false);
    bkt.startSort(baseArray);
  };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", distribute: "#eab308", placed: "#f97316",
    "sort-start": "#06b6d4", "sort-bucket": "#3b82f6", "bucket-sort-start": "#8b5cf6",
    "ins-extract": "#a855f7", "ins-shift": "#ec4899", "ins-insert": "#10b981",
    "bucket-sorted": "#10b981", "bucket-trivial": "#64748b",
    "collect-start": "#06b6d4", collect: "#3b82f6", done: "#14b8a6",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Bucket Sort Visualizer" badge="O(N + K) Average · Distribution Sort" />
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
              disabled={bkt.running} placeholder="e.g. 78, 17, 39, 26"
              helperText="Up to 14 non-negative integers"
              sx={{ mb: 1.5, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdate} disabled={bkt.running}
              sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>Update Array</Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Classic Example"><IconButton size="small" onClick={() => handlePreset("classic")} disabled={bkt.running}>
                <Typography sx={{ fontWeight: 900, fontSize: "0.65rem" }}>EG</Typography>
              </IconButton></Tooltip>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={bkt.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Reversed"><IconButton size="small" onClick={() => handlePreset("reversed")} disabled={bkt.running}><SignalCellularAlt sx={{ fontSize: 16, transform: "scaleX(-1)" }} /></IconButton></Tooltip>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => bkt.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart}
                disabled={baseArray.length === 0 || (bkt.running && !bkt.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={() => bkt.stepSort(baseArray)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={bkt.paused ? <PlayArrow /> : <Pause />} onClick={bkt.togglePause} disabled={!bkt.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{bkt.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={bkt.resetSort}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={BKT_STEPS} activeIdx={bkt.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* ─── Visualization ─── */}
        <BucketSortVisualizer initialArray={baseArray} currentState={bkt.currentState} />

        {/* ─── Right Sidebar ─── */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: t => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {bkt.currentState && bkt.currentState.phase !== "init" && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Current State</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { label: "# Buckets", val: bkt.currentState.numBuckets, color: "#6366f1" },
                  { label: "Max Value", val: bkt.currentState.maxVal, color: "#eab308" },
                  { label: "Active Bucket", val: bkt.currentState.activeBucket !== null ? bkt.currentState.activeBucket : "-", color: "#f97316" },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ flex: "1 1 calc(33% - 8px)", p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.3, color: item.color, fontWeight: 700, fontSize: "0.6rem" }}>{item.label}</Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.95rem", color: item.color }}>{String(item.val)}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {bkt.logEntries.length === 0
                ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
                : bkt.logEntries.map((entry, idx) => (
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
        <DialogTitle sx={{ color: "success.main", fontWeight: 800, fontSize: "1.5rem" }}>🎉 Sort Complete!</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary", fontSize: "1.1rem" }}>
            Array fully sorted using Bucket Sort with {bkt.currentState?.numBuckets ?? "?"} buckets.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", mt: 1 }}>
          <Button onClick={() => setResultDialogDismissed(true)} variant="contained" color="success" sx={{ fontWeight: 700, px: 4 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
