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
import { useTimSort } from "@/hooks/useTimSort";
import TimSortVisualizer from "@/components/TimSortVisualizer";

const TIM_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Compute RUN size. Divide the array into small runs." },
  { id: "run-start", title: "Start Run", description: "Begin Insertion Sort on the current run." },
  { id: "ins-extract", title: "Extract Key", description: "Pick arr[i] as the key to insert into the sorted portion of this run." },
  { id: "ins-shift", title: "Shift", description: "Shift elements right to make room for the key." },
  { id: "ins-place", title: "Place Key", description: "Insert the key at its correct position within the run." },
  { id: "run-done", title: "Run Done", description: "Current run is sorted. Move to the next run." },
  { id: "merge-phase-start", title: "Begin Merging", description: "All runs sorted. Now progressively merge runs together." },
  { id: "merge-start", title: "Merge Window", description: "Merge two adjacent runs into a single sorted block." },
  { id: "merge-compare", title: "Compare", description: "Compare leading elements from left and right halves." },
  { id: "merge-place", title: "Place", description: "Write the smaller element to the output position." },
  { id: "merge-done", title: "Merge Done", description: "Two runs successfully merged." },
  { id: "done", title: "Done", description: "All runs merged. Array fully sorted." },
];

export default function TimSortPage() {
  const [baseArray, setBaseArray] = useState([5, 21, 7, 23, 19, 2, 14, 8, 11, 3, 17, 1]);
  const ts = useTimSort(baseArray);
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));
  const [resultDialogDismissed, setResultDialogDismissed] = useState(false);
  const isDone = ts.logEntries.some(l => l.type === "done");

  const handleUpdate = () => {
    if (ts.running) return;
    const arr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (arr.length >= 2 && arr.length <= 16) {
      setBaseArray(arr);
      setResultDialogDismissed(false);
      ts.resetSort();
    } else {
      alert("Enter 2–16 integers.");
    }
  };

  const handlePreset = (t: "random" | "reversed" | "nearly") => {
    if (ts.running) return;
    let a: number[];
    if (t === "random") a = Array.from({ length: 12 }, () => Math.floor(Math.random() * 99) + 1);
    else if (t === "reversed") a = Array.from({ length: 12 }, (_, i) => 12 - i).map(v => v * 5);
    else a = [1, 2, 4, 3, 5, 6, 8, 7, 9, 11, 10, 12];
    setBaseArray(a);
    setArrayInput(a.join(", "));
    setResultDialogDismissed(false);
    ts.resetSort();
  };

  const handleStart = () => {
    setResultDialogDismissed(false);
    ts.startSort(baseArray);
  };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "run-start": "#6366f1", "ins-extract": "#8b5cf6",
    "ins-shift": "#ec4899", "ins-place": "#10b981", "run-done": "#22c55e",
    "merge-phase-start": "#06b6d4", "merge-start": "#3b82f6",
    "merge-compare": "#eab308", "merge-place": "#f97316",
    "merge-done": "#10b981", done: "#14b8a6",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Tim Sort Visualizer" badge="O(N log N) · Insertion Sort + Merge Sort Hybrid" />
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
              disabled={ts.running} placeholder="e.g. 5, 21, 7, 23, 19"
              helperText="2–16 integers"
              sx={{ mb: 1.5, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdate} disabled={ts.running}
              sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>Update Array</Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={ts.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Reversed"><IconButton size="small" onClick={() => handlePreset("reversed")} disabled={ts.running}><SignalCellularAlt sx={{ fontSize: 16, transform: "scaleX(-1)" }} /></IconButton></Tooltip>
              <Tooltip title="Nearly Sorted"><IconButton size="small" onClick={() => handlePreset("nearly")} disabled={ts.running}><Typography sx={{ fontWeight: 900 }}>~</Typography></IconButton></Tooltip>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => ts.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart}
                disabled={baseArray.length === 0 || (ts.running && !ts.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={() => ts.stepSort(baseArray)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={ts.paused ? <PlayArrow /> : <Pause />} onClick={ts.togglePause} disabled={!ts.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{ts.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={ts.resetSort}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={TIM_STEPS} activeIdx={ts.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* ─── Visualization ─── */}
        <TimSortVisualizer initialArray={baseArray} currentState={ts.currentState} />

        {/* ─── Right Sidebar ─── */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: t => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {ts.currentState && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>State Variables</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { label: "RUN Size", val: ts.currentState.runSize, color: "#6366f1" },
                  { label: "Active Run", val: ts.currentState.activeRun !== null ? ts.currentState.activeRun : "-", color: "#8b5cf6" },
                  { label: "Ins i", val: ts.currentState.insI !== null ? ts.currentState.insI : "-", color: "#ec4899" },
                  { label: "Ins j", val: ts.currentState.insJ !== null ? ts.currentState.insJ : "-", color: "#eab308" },
                  { label: "Merge L", val: ts.currentState.mergeLeft !== null ? ts.currentState.mergeLeft : "-", color: "#06b6d4" },
                  { label: "Merge R", val: ts.currentState.mergeRight !== null ? ts.currentState.mergeRight : "-", color: "#f97316" },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ flex: "1 1 calc(33% - 8px)", p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.3, color: item.color, fontWeight: 700, fontSize: "0.58rem" }}>{item.label}</Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.9rem", color: item.color }}>{String(item.val)}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {ts.logEntries.length === 0
                ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
                : ts.logEntries.map((entry, idx) => (
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
        <DialogTitle sx={{ color: "success.main", fontWeight: 800, fontSize: "1.5rem" }}>🎉 Tim Sort Complete!</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary", fontSize: "1.1rem" }}>
            Array fully sorted using Tim Sort — the same algorithm powering Python&apos;s built-in <Box component="code" sx={{ fontFamily: "var(--font-mono)", bgcolor: "action.hover", px: 0.5, borderRadius: 0.5 }}>sorted()</Box> function!
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", mt: 1 }}>
          <Button onClick={() => setResultDialogDismissed(true)} variant="contained" color="success" sx={{ fontWeight: 700, px: 4 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
