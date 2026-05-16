"use client";
import React, { useState } from "react";
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
import { useInsertionSort } from "@/hooks/useInsertionSort";

const INSERTION_SORT_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Start from i = 1 (first element is trivially sorted)." },
  { id: "pick-key", title: "Pick Key", description: "key = arr[i]. Set j = i - 1." },
  { id: "compare", title: "Compare & Shift", description: "While j ≥ 0 and arr[j] > key, shift arr[j] right." },
  { id: "shift", title: "Shift Right", description: "arr[j+1] = arr[j]. Decrement j." },
  { id: "insert", title: "Insert Key", description: "arr[j+1] = key at the correct position." },
  { id: "done", title: "Done", description: "Array is fully sorted." },
];

export default function InsertionSortPage() {
  const [baseArray, setBaseArray] = useState<number[]>([45, 12, 67, 34, 89, 23, 56, 78, 15, 90]);
  const is = useInsertionSort(baseArray);
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));

  const isDone = is.logEntries.some(l => l.type === "done");
  const n = is.array.length;

  // In insertion sort, elements 0..i-1 are sorted after pass i completes
  const getSortedIndices = () => {
    if (isDone) return Array.from({ length: n }, (_, k) => k);
    if (is.currentI <= 0) return [];
    // The sorted portion is 0..currentI-1 (elements before the current key)
    return Array.from({ length: is.currentI }, (_, k) => k);
  };

  const handleUpdateArray = () => {
    if (is.running) return;
    const newArr = arrayInput.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (newArr.length > 0 && newArr.length <= 50) {
      setBaseArray(newArr);
      is.resetSort();
    } else {
      alert("Please enter between 1 and 50 valid numbers.");
    }
  };

  const handlePreset = (type: "random" | "reversed" | "nearly-sorted") => {
    if (is.running) return;
    let newArr: number[] = [];
    const size = 15;
    if (type === "random") {
      newArr = Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);
    } else if (type === "reversed") {
      newArr = Array.from({ length: size }, (_, i) => (size - i) * 6);
    } else if (type === "nearly-sorted") {
      newArr = Array.from({ length: size }, (_, i) => i * 6 + 5);
      const temp = newArr[2]; newArr[2] = newArr[4]; newArr[4] = temp;
      const temp2 = newArr[10]; newArr[10] = newArr[11]; newArr[11] = temp2;
    }
    setBaseArray(newArr);
    setArrayInput(newArr.join(", "));
    is.resetSort();
  };

  const handleStart = () => { is.startSort(baseArray); };
  const handleStep = () => { is.stepSort(baseArray); };
  const handleReset = () => { is.resetSort(); };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "pick-key": "#8b5cf6", compare: "#f59e0b", "compare-stop": "#94a3b8",
    shift: "#ef4444", insert: "#10b981", done: "#0891b2",
  };

  // Find which index currently holds the key value (for purple highlight)
  // During shifting, the key's "slot" is at currentI initially, but as elements shift,
  // the key is conceptually "floating" — we highlight currentI (the original position).
  const getKeyIndex = (): number | undefined => {
    if (is.keyValue === null || is.currentI < 0) return undefined;
    // After insert step, the key lands at currentJ
    const lastLog = is.logEntries[is.logEntries.length - 1];
    if (lastLog?.type === "insert") return is.currentJ;
    return is.currentI;
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Insertion Sort Visualizer" badge="O(N²) Sorting" />
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
              disabled={is.running} placeholder="e.g. 5, 2, 8, 1, 9"
              sx={{ mb: 1, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdateArray} disabled={is.running} sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>
              Update Array
            </Button>

            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={is.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Reversed"><IconButton size="small" onClick={() => handlePreset("reversed")} disabled={is.running}><SignalCellularAlt sx={{ fontSize: 16, transform: "scaleX(-1)" }} /></IconButton></Tooltip>
              <Tooltip title="Nearly Sorted"><IconButton size="small" onClick={() => handlePreset("nearly-sorted")} disabled={is.running}><SortIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
          </Paper>

          {/* Controls Panel */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => is.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart} disabled={is.array.length === 0 || (is.running && !is.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={handleStep} disabled={is.array.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={is.paused ? <PlayArrow /> : <Pause />} onClick={is.togglePause} disabled={!is.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{is.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={handleReset}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          {/* Steps */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={INSERTION_SORT_STEPS} activeIdx={is.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* Canvas */}
        <ArrayCanvas
          array={is.array}
          currentJ={is.currentJ >= 0 ? is.currentJ : undefined}
          keyIndex={getKeyIndex()}
          shiftingIndices={is.shiftingIndices}
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
              {[
                { label: "i", val: is.currentI >= 0 ? is.currentI : "-", color: "primary.main" },
                { label: "j", val: is.currentJ >= 0 ? is.currentJ : "-", color: "warning.main" },
                { label: "key", val: is.keyValue !== null && is.currentI >= 0 ? is.keyValue : "-", color: "secondary.main" },
              ].map(item => (
                <Box key={item.label} sx={{ flex: 1, p: 1.5, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "text.secondary", fontWeight: 600 }}>{item.label}</Typography>
                  <Typography variant="h6" sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: item.color }}>
                    {item.val}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Visual sorted region indicator */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
              Array State
            </Typography>
            <Box sx={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
              {is.array.map((val, idx) => {
                const isSorted = isDone || (is.currentI > 0 && idx < is.currentI);
                const isKeyPos = idx === getKeyIndex();
                const isShift = is.shiftingIndices.includes(idx);
                return (
                  <Chip key={idx} label={val} size="small" sx={{
                    fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, height: 24,
                    bgcolor: isKeyPos ? "rgba(139,92,246,0.2)" : isShift ? "rgba(239,68,68,0.15)" : isSorted ? "rgba(16,185,129,0.15)" : "action.hover",
                    color: isKeyPos ? "secondary.main" : isShift ? "error.main" : isSorted ? "success.main" : "text.secondary",
                    border: "1px solid",
                    borderColor: isKeyPos ? "secondary.main" : isShift ? "error.main" : isSorted ? "success.main" : "divider",
                  }} />
                );
              })}
            </Box>
            <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10b981" }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>Sorted</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#8b5cf6" }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>Key</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#ef4444" }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>Shifting</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Log */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {is.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
                : is.logEntries.map((entry, idx) => (
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
