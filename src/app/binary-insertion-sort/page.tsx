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
import { useBinaryInsertionSort } from "@/hooks/useBinaryInsertionSort";
import BinaryInsertionSortVisualizer from "@/components/BinaryInsertionSortVisualizer";

const BIS_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Index 0 is trivially sorted. Begin from index 1." },
  { id: "extract", title: "Extract Key", description: "Pick arr[i] as the key to be inserted into the sorted region." },
  { id: "calc-mid", title: "Calc Mid", description: "Binary Search: Calculate the midpoint of the search space." },
  { id: "compare", title: "Compare Key", description: "Compare the key with the midpoint element." },
  { id: "update-bounds", title: "Update Bounds", description: "Narrow the binary search window (left or right)." },
  { id: "found-pos", title: "Position Found", description: "Binary Search complete. Insertion index located." },
  { id: "shift", title: "Shift Elements", description: "Shift sorted elements right to make room for the key." },
  { id: "insert", title: "Insert Key", description: "Drop the key into its correct position." },
  { id: "done", title: "Done", description: "Entire array is sorted." },
];

export default function BinaryInsertionSortPage() {
  const [baseArray, setBaseArray] = useState([12, 5, 23, 8, 42, 16, 7]);
  const bis = useBinaryInsertionSort(baseArray);
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));
  const [resultDialogDismissed, setResultDialogDismissed] = useState(false);
  const isDone = bis.logEntries.some(l => l.type === "done");

  const handleUpdate = () => {
    if (bis.running) return;
    const arr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (arr.length > 0 && arr.length <= 14) {
      setBaseArray(arr);
      setResultDialogDismissed(false);
      bis.resetSort();
    } else {
      alert("Enter 1–14 valid numbers.");
    }
  };

  const handlePreset = (t: "random" | "reversed" | "nearly") => {
    if (bis.running) return;
    const sz = 8;
    let a: number[] = [];
    if (t === "random") a = Array.from({ length: sz }, () => Math.floor(Math.random() * 99));
    else if (t === "reversed") a = Array.from({ length: sz }, (_, i) => (sz - i) * 6);
    else a = [1, 3, 2, 5, 4, 7, 6, 8];
    setBaseArray(a);
    setArrayInput(a.join(", "));
    setResultDialogDismissed(false);
    bis.resetSort();
  };

  const handleStart = () => {
    setResultDialogDismissed(false);
    bis.startSort(baseArray);
  };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", extract: "#8b5cf6", "calc-mid": "#eab308", compare: "#06b6d4",
    "update-bounds": "#f97316", "found-pos": "#3b82f6", shift: "#ec4899",
    shifted: "#64748b", insert: "#10b981", inserted: "#10b981", done: "#14b8a6",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Binary Insertion Sort Visualizer" badge="O(N log N) comparisons · O(N²) shifts" />
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
              disabled={bis.running} placeholder="e.g. 12, 5, 23, 8"
              sx={{ mb: 1.5, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdate} disabled={bis.running}
              sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>Update Array</Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={bis.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Reversed"><IconButton size="small" onClick={() => handlePreset("reversed")} disabled={bis.running}><SignalCellularAlt sx={{ fontSize: 16, transform: "scaleX(-1)" }} /></IconButton></Tooltip>
              <Tooltip title="Nearly Sorted"><IconButton size="small" onClick={() => handlePreset("nearly")} disabled={bis.running}><Typography sx={{ fontWeight: 900 }}>~</Typography></IconButton></Tooltip>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => bis.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart}
                disabled={bis.array.length === 0 || (bis.running && !bis.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={() => bis.stepSort(baseArray)}
                disabled={bis.array.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={bis.paused ? <PlayArrow /> : <Pause />} onClick={bis.togglePause} disabled={!bis.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{bis.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={bis.resetSort}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={BIS_STEPS} activeIdx={bis.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* ─── Visualization ─── */}
        <BinaryInsertionSortVisualizer initialArray={baseArray} currentState={bis.currentState} />

        {/* ─── Right Sidebar ─── */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: t => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {bis.currentState && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>State Variables</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { label: "i", val: bis.currentState.i !== null ? bis.currentState.i : "-", color: "#6366f1" },
                  { label: "Key", val: bis.currentState.keyItem?.val !== undefined && bis.currentState.keyItem?.val !== null ? bis.currentState.keyItem.val : "-", color: "#8b5cf6" },
                  { label: "Left", val: bis.currentState.left !== null ? bis.currentState.left : "-", color: "#06b6d4" },
                  { label: "Mid", val: bis.currentState.mid !== null ? bis.currentState.mid : "-", color: "#eab308" },
                  { label: "Right", val: bis.currentState.right !== null ? bis.currentState.right : "-", color: "#ec4899" },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ flex: "1 1 calc(33% - 8px)", p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.3, color: item.color, fontWeight: 700 }}>{item.label}</Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1rem", color: item.color }}>{String(item.val)}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {bis.logEntries.length === 0
                ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
                : bis.logEntries.map((entry, idx) => (
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
            The array has been fully sorted using Binary Insertion Sort with O(N log N) comparisons.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", mt: 1 }}>
          <Button onClick={() => setResultDialogDismissed(true)} variant="contained" color="success" sx={{ fontWeight: 700, px: 4 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
