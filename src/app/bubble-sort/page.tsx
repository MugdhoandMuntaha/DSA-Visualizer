"use client";
import React, { useState, useCallback } from "react";
import {
  Box, Typography, Slider, Button, Chip, IconButton, Paper, Tooltip, TextField
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
import ArrayCanvas from "@/components/ArrayCanvas";
import AlgoSteps, { StepDef } from "@/components/AlgoSteps";
import { useBubbleSort } from "@/hooks/useBubbleSort";

const BUBBLE_SORT_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Start with the unsorted array." },
  { id: "outer-loop", title: "Outer Loop (i)", description: "Begin pass i. Assume not swapped." },
  { id: "compare", title: "Compare Adjacent", description: "if (arr[j] > arr[j+1])" },
  { id: "swap", title: "Swap", description: "swap(arr[j], arr[j+1]), set swapped = true." },
  { id: "check-swap", title: "Check Optimization", description: "If no swaps occurred in this pass, array is sorted." },
  { id: "early-exit", title: "Early Exit", description: "Break out of outer loop." },
  { id: "done", title: "Done", description: "Array is fully sorted." },
];

export default function BubbleSortPage() {
  const [baseArray, setBaseArray] = useState<number[]>([45, 12, 67, 34, 89, 23, 56, 78, 15, 90]);
  const bs = useBubbleSort(baseArray);
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));

  const isDone = bs.logEntries.some(l => l.type === "done");
  const n = bs.array.length;

  const getSortedIndices = () => {
    if (isDone) return Array.from({ length: n }, (_, k) => k);
    if (bs.currentI < 0) return [];
    // At pass i, the last i elements are already sorted from previous passes.
    // If the step is check-swap and we are done with the pass, one more is sorted,
    // but the hook sets i to the *current* pass.
    return Array.from({ length: n }, (_, k) => k).slice(n - Math.max(0, bs.currentI));
  };

  const handleUpdateArray = () => {
    if (bs.running) return;
    const newArr = arrayInput.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (newArr.length > 0 && newArr.length <= 50) {
      setBaseArray(newArr);
      bs.resetBubbleSort();
    } else {
      alert("Please enter between 1 and 50 valid numbers.");
    }
  };

  const handlePreset = (type: "random" | "reversed" | "nearly-sorted") => {
    if (bs.running) return;
    let newArr: number[] = [];
    const size = 15;
    if (type === "random") {
      newArr = Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);
    } else if (type === "reversed") {
      newArr = Array.from({ length: size }, (_, i) => (size - i) * 6);
    } else if (type === "nearly-sorted") {
      newArr = Array.from({ length: size }, (_, i) => i * 6 + 5);
      // Swap a few
      const temp = newArr[2]; newArr[2] = newArr[4]; newArr[4] = temp;
      const temp2 = newArr[10]; newArr[10] = newArr[11]; newArr[11] = temp2;
    }
    setBaseArray(newArr);
    setArrayInput(newArr.join(", "));
    bs.resetBubbleSort();
  };

  const handleStart = () => { bs.startBubbleSort(baseArray); };
  const handleStep = () => { bs.stepBubbleSort(baseArray); };
  const handleReset = () => { bs.resetBubbleSort(); };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "outer-loop": "#ea580c", compare: "#f59e0b", swap: "#ef4444",
    "check-swap": "#8b5cf6", "early-exit": "#10b981", done: "#0891b2",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Bubble Sort Visualizer" badge="O(N²) Sorting" />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Sidebar */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderRight: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* Array Input Panel */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", backdropFilter: "blur(10px)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <InputOutlined sx={{ fontSize: 18, color: "primary.main" }} /> Input Array
            </Typography>
            <TextField fullWidth size="small" variant="outlined" value={arrayInput} onChange={(e) => setArrayInput(e.target.value)}
              disabled={bs.running} placeholder="e.g. 5, 2, 8, 1, 9"
              sx={{ mb: 1, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdateArray} disabled={bs.running} sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>
              Update Array
            </Button>
            
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={bs.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Reversed"><IconButton size="small" onClick={() => handlePreset("reversed")} disabled={bs.running}><SignalCellularAlt sx={{ fontSize: 16, transform: "scaleX(-1)" }} /></IconButton></Tooltip>
              <Tooltip title="Nearly Sorted"><IconButton size="small" onClick={() => handlePreset("nearly-sorted")} disabled={bs.running}><SortIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
          </Paper>

          {/* Controls Panel */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => bs.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart} disabled={bs.array.length === 0 || (bs.running && !bs.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={handleStep} disabled={bs.array.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={bs.paused ? <PlayArrow /> : <Pause />} onClick={bs.togglePause} disabled={!bs.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{bs.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={handleReset}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          {/* Steps */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={BUBBLE_SORT_STEPS} activeIdx={bs.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* Canvas */}
        <ArrayCanvas 
          array={bs.array} 
          currentJ={bs.currentJ >= 0 ? bs.currentJ : undefined} 
          compareWith={bs.currentJ >= 0 ? bs.currentJ + 1 : undefined}
          sortedIndices={getSortedIndices()}
        />

        {/* Right Sidebar */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* Variables */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
              State Variables
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              {[{ label: "i (Pass)", val: bs.currentI >= 0 ? bs.currentI : "-", color: "primary.main" },
                { label: "j (Index)", val: bs.currentJ >= 0 ? bs.currentJ : "-", color: "warning.main" },
                { label: "swapped", val: bs.currentI >= 0 ? (bs.swapped ? "true" : "false") : "-", color: bs.swapped ? "success.main" : "text.secondary" }].map(item => (
                <Box key={item.label} sx={{ flex: 1, p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "text.secondary", fontWeight: 600 }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: item.color }}>
                    {item.val}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Log */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {bs.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
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
    </Box>
  );
}
