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
import Header from "@/components/Header";
import AlgoSteps, { StepDef } from "@/components/AlgoSteps";
import { usePigeonholeSort } from "@/hooks/usePigeonholeSort";
import PigeonholeSortVisualizer from "@/components/PigeonholeSortVisualizer";

const PH_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Find min and max values. Create (max − min + 1) holes, all initialized to 0." },
  { id: "distribute", title: "Distribute", description: "For each element, compute hole_idx = val − min and increment that hole." },
  { id: "placed", title: "Placed", description: "Element dropped into its pigeonhole." },
  { id: "collect-start", title: "Begin Collect", description: "Scan holes left to right and write values back into the array." },
  { id: "collect-hole", title: "Inspect Hole", description: "Check how many elements are in this hole." },
  { id: "collect", title: "Collect", description: "Write the hole's value back into the next output position." },
  { id: "done", title: "Done", description: "All holes drained. Array is fully sorted." },
];

export default function PigeonholeSortPage() {
  const [baseArray, setBaseArray] = useState([8, 3, 2, 7, 4, 6, 8, 3, 1, 5]);
  const ph = usePigeonholeSort(baseArray);
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));
  const [resultDialogDismissed, setResultDialogDismissed] = useState(false);
  const isDone = ph.logEntries.some(l => l.type === "done");

  const handleUpdate = () => {
    if (ph.running) return;
    const arr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x) && x >= 0);
    const range = arr.length > 0 ? Math.max(...arr) - Math.min(...arr) + 1 : 0;
    if (arr.length > 0 && arr.length <= 14 && range <= 20) {
      setBaseArray(arr);
      setResultDialogDismissed(false);
      ph.resetSort();
    } else {
      alert("Enter 1–14 non-negative integers with a value range ≤ 20 (for a clean hole grid).");
    }
  };

  const handlePreset = (t: "classic" | "random" | "duplicates") => {
    if (ph.running) return;
    let a: number[];
    if (t === "classic") a = [8, 3, 2, 7, 4, 6, 8, 3, 1, 5];
    else if (t === "random") {
      const base = Math.floor(Math.random() * 10);
      a = Array.from({ length: 10 }, () => base + Math.floor(Math.random() * 10));
    } else a = [5, 3, 5, 2, 3, 5, 1, 4, 2, 3]; // many duplicates
    setBaseArray(a);
    setArrayInput(a.join(", "));
    setResultDialogDismissed(false);
    ph.resetSort();
  };

  const handleStart = () => {
    setResultDialogDismissed(false);
    ph.startSort(baseArray);
  };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", distribute: "#eab308", placed: "#f97316",
    "collect-start": "#06b6d4", "collect-hole": "#3b82f6",
    collect: "#10b981", done: "#14b8a6",
  };

  const rangeSize = baseArray.length > 0
    ? Math.max(...baseArray) - Math.min(...baseArray) + 1
    : 0;

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Pigeonhole Sort Visualizer" badge="O(N + Range) · Distribution Sort" />
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
              disabled={ph.running} placeholder="e.g. 8, 3, 2, 7, 4"
              helperText={`Up to 14 integers · Range ≤ 20 · Current range: ${rangeSize}`}
              sx={{ mb: 1.5, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdate} disabled={ph.running}
              sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>Update Array</Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Classic"><IconButton size="small" onClick={() => handlePreset("classic")} disabled={ph.running}>
                <Typography sx={{ fontWeight: 900, fontSize: "0.65rem" }}>EG</Typography>
              </IconButton></Tooltip>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={ph.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Many Duplicates"><IconButton size="small" onClick={() => handlePreset("duplicates")} disabled={ph.running}>
                <Typography sx={{ fontWeight: 900, fontSize: "0.65rem" }}>DUP</Typography>
              </IconButton></Tooltip>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => ph.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart}
                disabled={baseArray.length === 0 || (ph.running && !ph.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={() => ph.stepSort(baseArray)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={ph.paused ? <PlayArrow /> : <Pause />} onClick={ph.togglePause} disabled={!ph.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{ph.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={ph.resetSort}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={PH_STEPS} activeIdx={ph.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* ─── Visualization ─── */}
        <PigeonholeSortVisualizer initialArray={baseArray} currentState={ph.currentState} />

        {/* ─── Right Sidebar ─── */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: t => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {ph.currentState && ph.currentState.phase !== "init" && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Current State</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { label: "Min Val", val: ph.currentState.minVal, color: "#06b6d4" },
                  { label: "Max Val", val: ph.currentState.maxVal, color: "#f97316" },
                  { label: "# Holes", val: ph.currentState.holes.length, color: "#6366f1" },
                  { label: "Active Hole", val: ph.currentState.activeHole !== null ? ph.currentState.activeHole : "-", color: "#eab308" },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ flex: "1 1 calc(50% - 8px)", p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
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
              {ph.logEntries.length === 0
                ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
                : ph.logEntries.map((entry, idx) => (
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
            Array fully sorted using Pigeonhole Sort with {ph.currentState?.holes.length ?? "?"} holes.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", mt: 1 }}>
          <Button onClick={() => setResultDialogDismissed(true)} variant="contained" color="success" sx={{ fontWeight: 700, px: 4 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
