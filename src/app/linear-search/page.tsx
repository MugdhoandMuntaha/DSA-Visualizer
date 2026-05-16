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
import { useLinearSearch } from "@/hooks/useLinearSearch";
import LinearSearchVisualizer from "@/components/LinearSearchVisualizer";
import SortIcon from "@mui/icons-material/Sort";

const LS_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Start at the first element (index 0)." },
  { id: "compare", title: "Compare", description: "Check if the current element matches the target." },
  { id: "found", title: "Match Found", description: "Target matches! Search terminates." },
  { id: "move-next", title: "Move Next", description: "Not a match. Move to the next element." },
  { id: "not-found", title: "Not Found", description: "Reached the end. Target is not in the array." },
];

export default function LinearSearchPage() {
  const [baseArray, setBaseArray] = useState([12, 5, 23, 8, 42, 16, 7, 19, 31]);
  const [targetVal, setTargetVal] = useState<number>(16);
  
  const ls = useLinearSearch(baseArray, targetVal);
  
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));
  const [targetInput, setTargetInput] = useState(targetVal.toString());
  
  const [resultDialogDismissed, setResultDialogDismissed] = useState(false);
  const isDone = ls.logEntries.some(l => l.type === "found" || l.type === "not-found");

  const handleUpdate = () => {
    if (ls.running) return;
    const arr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    const targ = parseInt(targetInput.trim());
    
    if (arr.length > 0 && arr.length <= 20 && !isNaN(targ)) { 
        setBaseArray(arr); 
        setTargetVal(targ);
        setResultDialogDismissed(false);
        ls.resetSearch(); 
    } else {
        alert("Enter 1–20 valid numbers for array, and a valid number for target.");
    }
  };

  const handlePreset = (t: "random" | "sorted" | "target-end") => {
    if (ls.running) return;
    const sz = 11;
    let a: number[] = [];
    let targ = targetVal;
    if (t === "random") {
        a = Array.from({ length: sz }, () => Math.floor(Math.random() * 99));
        targ = a[Math.floor(Math.random() * sz)];
    } else if (t === "sorted") {
        a = Array.from({ length: sz }, (_, i) => i * 4 + 2);
        targ = a[4];
    } else if (t === "target-end") { 
        a = [5, 12, 3, 19, 8, 24, 7, 11, 42]; 
        targ = 42;
    }
    setBaseArray(a); setArrayInput(a.join(", "));
    setTargetVal(targ); setTargetInput(targ.toString());
    setResultDialogDismissed(false);
    ls.resetSearch();
  };

  const handleStart = () => {
      setResultDialogDismissed(false);
      ls.startSearch(baseArray, targetVal);
  };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", compare: "#eab308", "move-next": "#f97316",
    found: "#10b981", "not-found": "#ef4444"
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Linear Search Visualizer" badge="O(N) · Sequential Search" />
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
              disabled={ls.running} placeholder="e.g. 12, 5, 23, 8"
              sx={{ mb: 1.5, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
              
            <TextField fullWidth size="small" label="Target Value" value={targetInput} onChange={e => setTargetInput(e.target.value)}
              disabled={ls.running} placeholder="e.g. 16"
              sx={{ mb: 1.5, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" }, maxWidth: 120 }} />
              
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdate} disabled={ls.running}
              sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>Update Data</Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={ls.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Sorted"><IconButton size="small" onClick={() => handlePreset("sorted")} disabled={ls.running}><SortIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Target at End"><IconButton size="small" onClick={() => handlePreset("target-end")} disabled={ls.running}><Typography sx={{ fontWeight: 900 }}>❯</Typography></IconButton></Tooltip>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>

            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => ls.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart}
                disabled={ls.array.length === 0 || (ls.running && !ls.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={() => ls.stepSearch(baseArray, targetVal)} disabled={ls.array.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={ls.paused ? <PlayArrow /> : <Pause />} onClick={ls.togglePause} disabled={!ls.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{ls.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={ls.resetSearch}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={LS_STEPS} activeIdx={ls.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* ─── Visualization ─── */}
        <LinearSearchVisualizer initialArray={baseArray} currentState={ls.currentState} />

        {/* ─── Right Sidebar ─── */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {ls.currentState && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Pointer State</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {[
                  { label: "Current Index (i)", val: ls.currentState.currIdx !== null ? ls.currentState.currIdx : "-", color: "#eab308" },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ flex: 1, p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.3, color: item.color, fontWeight: 700 }}>{item.label}</Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.2rem", color: item.color }}>{item.val}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {ls.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to search</Typography>
                : ls.logEntries.map((entry, idx) => (
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
        sx={{ "& .MuiDialog-paper": { bgcolor: "background.paper", backgroundImage: "none", borderRadius: 3, border: "1px solid", borderColor: ls.currentState?.phase === "found" ? "success.main" : "error.main", textAlign: "center", p: 2 } }}>
        <DialogTitle sx={{ color: ls.currentState?.phase === "found" ? "success.main" : "error.main", fontWeight: 800, fontSize: "1.5rem" }}>
            {ls.currentState?.phase === "found" ? "🎉 Target Found!" : "❌ Target Not Found"}
        </DialogTitle>
        <DialogContent>
            <DialogContentText sx={{ color: "text.secondary", fontSize: "1.1rem" }}>
                {ls.currentState?.phase === "found" 
                    ? `The target value ${targetVal} was successfully found at index ${ls.currentState.currIdx}.`
                    : `The target value ${targetVal} does not exist in the array.`}
            </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", mt: 1 }}>
            <Button onClick={() => setResultDialogDismissed(true)} variant="contained" color={ls.currentState?.phase === "found" ? "success" : "error"} sx={{ fontWeight: 700, px: 4 }}>
                Close
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
