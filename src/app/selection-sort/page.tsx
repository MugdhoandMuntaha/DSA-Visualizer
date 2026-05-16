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
import { useSelectionSort } from "@/hooks/useSelectionSort";
import SelectionSortVisualizer from "@/components/SelectionSortVisualizer";

const SEL_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Start with the full unsorted array." },
  { id: "start-pass", title: "Start Pass", description: "Set the target index i and assume arr[i] is the minimum." },
  { id: "compare", title: "Scan for Minimum", description: "Scan the remaining elements (j) to find the actual minimum." },
  { id: "new-min", title: "Update Minimum", description: "Found a smaller element! Update min pointer." },
  { id: "swap", title: "Swap", description: "Swap the target element with the minimum element found." },
  { id: "no-swap", title: "No Swap", description: "Target was already the minimum. No swap needed." },
  { id: "swapped", title: "Pass Complete", description: "The element at index i is now sorted." },
  { id: "done", title: "Done", description: "Entire array is sorted." },
];

export default function SelectionSortPage() {
  const [baseArray, setBaseArray] = useState([29, 10, 14, 37, 14, 25, 9]);
  
  const sel = useSelectionSort(baseArray);
  
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));
  
  const [resultDialogDismissed, setResultDialogDismissed] = useState(false);
  const isDone = sel.logEntries.some(l => l.type === "done");

  const handleUpdate = () => {
    if (sel.running) return;
    const arr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    
    if (arr.length > 0 && arr.length <= 15) { 
        setBaseArray(arr); 
        setResultDialogDismissed(false);
        sel.resetSort(); 
    } else {
        alert("Enter 1–15 valid numbers.");
    }
  };

  const handlePreset = (t: "random" | "reversed" | "nearly") => {
    if (sel.running) return;
    const sz = 9;
    let a: number[] = [];
    if (t === "random") a = Array.from({ length: sz }, () => Math.floor(Math.random() * 99));
    else if (t === "reversed") a = Array.from({ length: sz }, (_, i) => (sz - i) * 5);
    else { 
        a = [1, 2, 4, 3, 5, 6, 8, 7, 9]; 
    }
    setBaseArray(a); setArrayInput(a.join(", "));
    setResultDialogDismissed(false);
    sel.resetSort();
  };

  const handleStart = () => {
      setResultDialogDismissed(false);
      sel.startSort(baseArray);
  };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "start-pass": "#8b5cf6", compare: "#06b6d4", "new-min": "#f97316",
    swap: "#ec4899", "swapped": "#10b981", "no-swap": "#64748b", done: "#14b8a6"
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Selection Sort Visualizer" badge="O(N²) · In-Place Sorting" />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ─── Left Sidebar ─── */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderRight: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <InputOutlined sx={{ fontSize: 18, color: "primary.main" }} /> Input Array
            </Typography>
            <TextField fullWidth size="small" value={arrayInput} onChange={e => setArrayInput(e.target.value)}
              disabled={sel.running} placeholder="e.g. 29, 10, 14, 37"
              sx={{ mb: 1.5, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
              
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdate} disabled={sel.running}
              sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>Update Data</Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={sel.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Reversed"><IconButton size="small" onClick={() => handlePreset("reversed")} disabled={sel.running}><SignalCellularAlt sx={{ fontSize: 16, transform: "scaleX(-1)" }} /></IconButton></Tooltip>
              <Tooltip title="Nearly Sorted"><IconButton size="small" onClick={() => handlePreset("nearly")} disabled={sel.running}><Typography sx={{ fontWeight: 900 }}>~</Typography></IconButton></Tooltip>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>

            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => sel.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart}
                disabled={sel.array.length === 0 || (sel.running && !sel.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={() => sel.stepSort(baseArray)} disabled={sel.array.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={sel.paused ? <PlayArrow /> : <Pause />} onClick={sel.togglePause} disabled={!sel.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{sel.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={sel.resetSort}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={SEL_STEPS} activeIdx={sel.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* ─── Visualization ─── */}
        <SelectionSortVisualizer initialArray={baseArray} currentState={sel.currentState} />

        {/* ─── Right Sidebar ─── */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {sel.currentState && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Pointer State</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { label: "Target (i)", val: sel.currentState.i !== null ? sel.currentState.i : "-", color: "#6366f1" },
                  { label: "MinIdx", val: sel.currentState.minIdx !== null ? sel.currentState.minIdx : "-", color: "#f97316" },
                  { label: "Scan (j)", val: sel.currentState.j !== null ? sel.currentState.j : "-", color: "#06b6d4" },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ flex: 1, p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.3, color: item.color, fontWeight: 700 }}>{item.label}</Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.1rem", color: item.color }}>{item.val}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {sel.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
                : sel.logEntries.map((entry, idx) => (
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
        <DialogTitle sx={{ color: "success.main", fontWeight: 800, fontSize: "1.5rem" }}>
            🎉 Sorting Complete!
        </DialogTitle>
        <DialogContent>
            <DialogContentText sx={{ color: "text.secondary", fontSize: "1.1rem" }}>
                The array has been fully sorted using Selection Sort.
            </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", mt: 1 }}>
            <Button onClick={() => setResultDialogDismissed(true)} variant="contained" color={"success"} sx={{ fontWeight: 700, px: 4 }}>
                Close
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
