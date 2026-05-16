"use client";
import React, { useState } from "react";
import {
  Box, Typography, Slider, Button, IconButton, Paper, Tooltip, TextField, FormControlLabel, Switch
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
import { useCountingSort } from "@/hooks/useCountingSort";
import CountingSortVisualizer from "@/components/CountingSortVisualizer";

const CS_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Start with the full unsorted array." },
  { id: "find-max", title: "Find Max/Min", description: "Scan array to find maximum (and minimum) values." },
  { id: "init-cnt", title: "Init Count Array", description: "Create cntArr initialized to 0." },
  { id: "count-freq", title: "Count Frequencies", description: "Increment cntArr[arr[i]] for each element." },
  { id: "prefix-sum", title: "Prefix Sum", description: "cntArr[i] += cntArr[i-1] to find placement indices." },
  { id: "build-output", title: "Build Output", description: "Iterate backwards, placing elements into output array." },
  { id: "done", title: "Done", description: "Entire array is sorted." },
];

export default function CountingSortPage() {
  const [baseArray, setBaseArray] = useState([4, 2, 2, 8, 3, 3, 1]);
  const cs = useCountingSort(baseArray);
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));
  const [useNegatives, setUseNegatives] = useState(false);
  const isDone = cs.logEntries.some(l => l.type === "done");

  const handleUpdate = () => {
    if (cs.running) return;
    const arr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (arr.length > 0 && arr.length <= 16) { 
        setBaseArray(arr); cs.resetSort(); 
    } else {
        alert("Enter 1–16 valid numbers.");
    }
  };

  const handlePreset = (t: "random" | "reversed" | "nearly" | "negatives") => {
    if (cs.running) return;
    const sz = 8;
    let a: number[] = [];
    if (t === "random") a = Array.from({ length: sz }, () => Math.floor(Math.random() * 10));
    else if (t === "reversed") a = Array.from({ length: sz }, (_, i) => sz - i);
    else if (t === "negatives") {
        a = [3, -2, 5, 0, -5, 2, -2, 4];
        setUseNegatives(true);
    } else { 
        a = [1, 2, 3, 5, 4, 6, 7, 8]; 
    }
    setBaseArray(a); setArrayInput(a.join(", ")); cs.resetSort();
  };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "find-max": "#eab308", "init-cnt": "#64748b", "count-freq": "#06b6d4",
    "prefix-sum": "#f97316", "build-output": "#10b981", done: "#0891b2", error: "#ef4444"
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Counting Sort Visualizer" badge="O(N + K) · Non-Comparative" />
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
              disabled={cs.running} placeholder="e.g. 4, 2, 2, 8"
              sx={{ mb: 1, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdate} disabled={cs.running}
              sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>Update Array</Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={cs.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Reversed"><IconButton size="small" onClick={() => handlePreset("reversed")} disabled={cs.running}><SignalCellularAlt sx={{ fontSize: 16, transform: "scaleX(-1)" }} /></IconButton></Tooltip>
              <Tooltip title="Negative Values"><IconButton size="small" onClick={() => handlePreset("negatives")} disabled={cs.running}><Typography sx={{ fontWeight: 900 }}>-</Typography></IconButton></Tooltip>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>

            <FormControlLabel
                control={<Switch size="small" checked={useNegatives} onChange={(e) => setUseNegatives(e.target.checked)} disabled={cs.running} />}
                label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Support Negatives (Hashing)</Typography>}
                sx={{ mb: 2 }}
            />

            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => cs.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={() => cs.startSort(baseArray, useNegatives)}
                disabled={cs.array.length === 0 || (cs.running && !cs.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={() => cs.stepSort(baseArray, useNegatives)} disabled={cs.array.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={cs.paused ? <PlayArrow /> : <Pause />} onClick={cs.togglePause} disabled={!cs.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{cs.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={cs.resetSort}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={CS_STEPS} activeIdx={cs.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* ─── Visualization ─── */}
        <CountingSortVisualizer initialArray={baseArray} currentState={cs.currentState} />

        {/* ─── Right Sidebar ─── */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {cs.currentState && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Algorithm State</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {[
                  { label: "Max Val", val: cs.currentState.maxVal, color: "#eab308" },
                  ...(cs.currentState.supportNegatives ? [{ label: "Min Val", val: cs.currentState.minVal, color: "#eab308" }] : []),
                  { label: "Phase", val: cs.currentState.phase, color: "#3b82f6" },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ flex: 1, p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.3, color: item.color, fontWeight: 700 }}>{item.label}</Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.9rem", color: item.color }}>{item.val}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {cs.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
                : cs.logEntries.map((entry, idx) => (
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
