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
import SignalCellularAlt from "@mui/icons-material/SignalCellularAlt";
import Shuffle from "@mui/icons-material/Shuffle";
import SortIcon from "@mui/icons-material/Sort";
import Header from "@/components/Header";
import AlgoSteps, { StepDef } from "@/components/AlgoSteps";
import { useBinarySearch } from "@/hooks/useBinarySearch";
import BinarySearchVisualizer from "@/components/BinarySearchVisualizer";

const BS_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Start with a sorted array." },
  { id: "calc-mid", title: "Calculate Mid", description: "Find the middle index of the current search space." },
  { id: "compare", title: "Compare Target", description: "Compare the middle element with the target value." },
  { id: "found", title: "Found Match", description: "Target matches the middle element!" },
  { id: "update-bounds", title: "Update Bounds", description: "Target is smaller/larger. Update left or right bounds." },
  { id: "not-found", title: "Not Found", description: "Search space exhausted. Target is not in the array." },
];

export default function BinarySearchPage() {
  const [baseArray, setBaseArray] = useState([1, 3, 5, 7, 9, 11, 15, 18, 21]);
  const [targetVal, setTargetVal] = useState<number>(9);
  
  const bs = useBinarySearch(baseArray, targetVal);
  
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));
  const [targetInput, setTargetInput] = useState(targetVal.toString());
  
  const [unsortedDialogOpen, setUnsortedDialogOpen] = useState(false);
  const [resultDialogDismissed, setResultDialogDismissed] = useState(false);
  const isDone = bs.logEntries.some(l => l.type === "found" || l.type === "not-found");

  const handleUpdate = () => {
    if (bs.running) return;
    const arr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    const targ = parseInt(targetInput.trim());
    
    if (arr.length > 0 && arr.length <= 20 && !isNaN(targ)) { 
        setBaseArray(arr); 
        setTargetVal(targ);
        setResultDialogDismissed(false);
        bs.resetSearch(); 
    } else {
        alert("Enter 1–20 valid numbers for array, and a valid number for target.");
    }
  };

  const handlePreset = (t: "random" | "reversed" | "sorted") => {
    if (bs.running) return;
    const sz = 11;
    let a: number[] = [];
    if (t === "random") a = Array.from({ length: sz }, () => Math.floor(Math.random() * 99));
    else if (t === "reversed") a = Array.from({ length: sz }, (_, i) => (sz - i) * 5);
    else { 
        a = Array.from({ length: sz }, (_, i) => i * 3 + 2); 
    }
    setBaseArray(a); setArrayInput(a.join(", ")); setResultDialogDismissed(false); bs.resetSearch();
  };

  const checkSortedAndStart = () => {
      const isSorted = baseArray.every((val, i, arr) => !i || val >= arr[i - 1]);
      if (!isSorted) {
          setUnsortedDialogOpen(true);
      } else {
          setResultDialogDismissed(false);
          bs.startSearch(baseArray, targetVal);
      }
  };

  const handleSortAndStart = () => {
      setUnsortedDialogOpen(false);
      const sorted = [...baseArray].sort((a,b) => a - b);
      setBaseArray(sorted);
      setArrayInput(sorted.join(", "));
      setResultDialogDismissed(false);
      bs.startSearch(sorted, targetVal);
  };

  const handleStartAnyway = () => {
      setUnsortedDialogOpen(false);
      setResultDialogDismissed(false);
      bs.startSearch(baseArray, targetVal);
  };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "calc-mid": "#eab308", compare: "#06b6d4",
    "update-bounds": "#f97316", found: "#10b981", "not-found": "#ef4444"
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Binary Search Visualizer" badge="O(log N) · Divide & Conquer" />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ─── Left Sidebar ─── */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderRight: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <InputOutlined sx={{ fontSize: 18, color: "primary.main" }} /> Input Data
            </Typography>
            <TextField fullWidth size="small" label="Array" value={arrayInput} onChange={e => setArrayInput(e.target.value)}
              disabled={bs.running} placeholder="e.g. 1, 3, 5, 7"
              sx={{ mb: 1.5, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
              
            <TextField fullWidth size="small" label="Target Value" value={targetInput} onChange={e => setTargetInput(e.target.value)}
              disabled={bs.running} placeholder="e.g. 5"
              sx={{ mb: 1.5, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" }, maxWidth: 120 }} />
              
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdate} disabled={bs.running}
              sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>Update Data</Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Sorted"><IconButton size="small" onClick={() => handlePreset("sorted")} disabled={bs.running}><SortIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Unsorted Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={bs.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
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
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={checkSortedAndStart}
                disabled={bs.array.length === 0 || (bs.running && !bs.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={() => bs.stepSearch(baseArray, targetVal)} disabled={bs.array.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={bs.paused ? <PlayArrow /> : <Pause />} onClick={bs.togglePause} disabled={!bs.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{bs.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={bs.resetSearch}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={BS_STEPS} activeIdx={bs.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* ─── Visualization ─── */}
        <BinarySearchVisualizer initialArray={baseArray} currentState={bs.currentState} />

        {/* ─── Right Sidebar ─── */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {bs.currentState && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Pointers State</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {[
                  { label: "Left", val: bs.currentState.left, color: "#06b6d4" },
                  { label: "Mid", val: bs.currentState.mid !== null ? bs.currentState.mid : "-", color: "#eab308" },
                  { label: "Right", val: bs.currentState.right, color: "#f97316" },
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
              {bs.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to search</Typography>
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

      {/* Unsorted Array Warning Dialog */}
      <Dialog open={unsortedDialogOpen} onClose={() => setUnsortedDialogOpen(false)}
        sx={{ "& .MuiDialog-paper": { bgcolor: "background.paper", backgroundImage: "none", borderRadius: 3, border: "1px solid", borderColor: "warning.main" } }}>
        <DialogTitle sx={{ color: "warning.main", fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
            ⚠️ Unsorted Array Detected
        </DialogTitle>
        <DialogContent>
            <DialogContentText sx={{ color: "text.secondary", mb: 2 }}>
                Binary Search only works efficiently and correctly on <strong>sorted arrays</strong>. The array you provided is currently unsorted.
            </DialogContentText>
            <DialogContentText sx={{ color: "text.secondary" }}>
                Would you like me to sort the array automatically before starting the search, or proceed anyway (which will likely fail to find the target)?
            </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={handleStartAnyway} color="error" sx={{ fontWeight: 700 }}>
                Proceed Anyway
            </Button>
            <Button onClick={handleSortAndStart} variant="contained" color="warning" sx={{ fontWeight: 700 }}>
                Yes, Sort It
            </Button>
        </DialogActions>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={isDone && !resultDialogDismissed} onClose={() => setResultDialogDismissed(true)}
        sx={{ "& .MuiDialog-paper": { bgcolor: "background.paper", backgroundImage: "none", borderRadius: 3, border: "1px solid", borderColor: bs.currentState?.phase === "found" ? "success.main" : "error.main", textAlign: "center", p: 2 } }}>
        <DialogTitle sx={{ color: bs.currentState?.phase === "found" ? "success.main" : "error.main", fontWeight: 800, fontSize: "1.5rem" }}>
            {bs.currentState?.phase === "found" ? "🎉 Target Found!" : "❌ Target Not Found"}
        </DialogTitle>
        <DialogContent>
            <DialogContentText sx={{ color: "text.secondary", fontSize: "1.1rem" }}>
                {bs.currentState?.phase === "found" 
                    ? `The target value ${targetVal} was successfully found at index ${bs.currentState.mid}.`
                    : `The target value ${targetVal} does not exist in the array.`}
            </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", mt: 1 }}>
            <Button onClick={() => setResultDialogDismissed(true)} variant="contained" color={bs.currentState?.phase === "found" ? "success" : "error"} sx={{ fontWeight: 700, px: 4 }}>
                Close
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
