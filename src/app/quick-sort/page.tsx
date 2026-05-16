"use client";
import React, { useState } from "react";
import {
  Box, Typography, Slider, Button, IconButton, Paper, Tooltip, TextField,
  Select, MenuItem, FormControl, InputLabel
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
import QuickSortTree from "@/components/QuickSortTree";
import AlgoSteps, { StepDef } from "@/components/AlgoSteps";
import { useQuickSort, PartitionMethod, PivotStrategy } from "@/hooks/useQuickSort";

const GET_STEPS = (method: string): StepDef[] => {
  if (method === "counting") return [
    { id: "init", title: "Initialize", description: "Start with the full unsorted array." },
    { id: "pick-pivot", title: "Pick Pivot", description: "Choose pivot." },
    { id: "count", title: "Count Elements", description: "Count elements ≤ pivot." },
    { id: "place-pivot", title: "Place Pivot", description: "Swap pivot into correct position." },
    { id: "scan-i", title: "Scan i →", description: "Move i right until arr[i] > pivot." },
    { id: "scan-j", title: "Scan j ←", description: "Move j left until arr[j] ≤ pivot." },
    { id: "swap", title: "Swap i and j", description: "Swap out-of-place elements." },
    { id: "partition-done", title: "Partition Done", description: "Split array around final pivot position." },
    { id: "combine", title: "Combine", description: "Subarrays and pivot are now sorted." },
    { id: "done", title: "Done", description: "Entire array is sorted." },
  ];
  if (method === "lomuto") return [
    { id: "init", title: "Initialize", description: "Start with the full unsorted array." },
    { id: "pick-pivot", title: "Pick Pivot", description: "Choose pivot and move to end." },
    { id: "scan-j", title: "Scan j →", description: "Iterate j through array." },
    { id: "swap", title: "Swap to Store", description: "If arr[j] < pivot, swap to store index." },
    { id: "place-pivot", title: "Place Pivot", description: "Swap pivot into final position." },
    { id: "partition-done", title: "Partition Done", description: "Split array." },
    { id: "combine", title: "Combine", description: "Subarrays and pivot are now sorted." },
    { id: "done", title: "Done", description: "Entire array is sorted." },
  ];
  return [
    { id: "init", title: "Initialize", description: "Start with the full unsorted array." },
    { id: "pick-pivot", title: "Pick Pivot", description: "Choose pivot." },
    { id: "scan-i", title: "Scan i →", description: "Move i right until arr[i] ≥ pivot." },
    { id: "scan-j", title: "Scan j ←", description: "Move j left until arr[j] ≤ pivot." },
    { id: "swap", title: "Swap i and j", description: "Swap arr[i] and arr[j]." },
    { id: "partition-done", title: "Partition Done", description: "Pointers cross. Split array." },
    { id: "combine", title: "Combine", description: "Subarrays sorted." },
    { id: "done", title: "Done", description: "Entire array is sorted." },
  ];
};

export default function QuickSortPage() {
  const [baseArray, setBaseArray] = useState([4, 3, 1, 2, 5, 9, 7, 10, 6]);
  const qs = useQuickSort(baseArray);
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));
  const [selPart, setSelPart] = useState<PartitionMethod>("counting");
  const [selPivot, setSelPivot] = useState<PivotStrategy>("first");
  const isDone = qs.logEntries.some(l => l.type === "done");

  const handleUpdate = () => {
    if (qs.running) return;
    const arr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (arr.length > 0 && arr.length <= 16) { setBaseArray(arr); qs.resetSort(); }
    else alert("Enter 1–16 valid numbers.");
  };

  const handlePreset = (t: "random" | "reversed" | "nearly") => {
    if (qs.running) return;
    const sz = 8;
    let a: number[] = [];
    if (t === "random") a = Array.from({ length: sz }, () => Math.floor(Math.random() * 99) + 1);
    else if (t === "reversed") a = Array.from({ length: sz }, (_, i) => (sz - i) * 8);
    else { a = Array.from({ length: sz }, (_, i) => i * 8 + 5); [a[2], a[5]] = [a[5], a[2]]; }
    setBaseArray(a); setArrayInput(a.join(", ")); qs.resetSort();
  };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "pick-pivot": "#10b981", count: "#eab308", "place-pivot": "#10b981", "scan-i": "#06b6d4", "scan-j": "#f97316",
    swap: "#ef4444", "partition-done": "#3b82f6", "base-case": "#64748b", combine: "#10b981", done: "#0891b2",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Quick Sort Visualizer" badge="O(N log N) avg · Hoare Partition" />
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
              disabled={qs.running} placeholder="e.g. 4, 3, 1, 2, 5"
              sx={{ mb: 1, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdate} disabled={qs.running}
              sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>Update Array</Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={qs.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Reversed"><IconButton size="small" onClick={() => handlePreset("reversed")} disabled={qs.running}><SignalCellularAlt sx={{ fontSize: 16, transform: "scaleX(-1)" }} /></IconButton></Tooltip>
              <Tooltip title="Nearly Sorted"><IconButton size="small" onClick={() => handlePreset("nearly")} disabled={qs.running}><SortIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: "0.75rem" }}>Partition</InputLabel>
                <Select value={selPart} label="Partition" onChange={e => setSelPart(e.target.value as PartitionMethod)} sx={{ fontSize: "0.75rem" }} disabled={qs.running}>
                  <MenuItem value="counting" sx={{ fontSize: "0.75rem" }}>Counting</MenuItem>
                  <MenuItem value="lomuto" sx={{ fontSize: "0.75rem" }}>Lomuto</MenuItem>
                  <MenuItem value="hoare" sx={{ fontSize: "0.75rem" }}>Hoare</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: "0.75rem" }}>Pivot Strategy</InputLabel>
                <Select value={selPivot} label="Pivot Strategy" onChange={e => setSelPivot(e.target.value as PivotStrategy)} sx={{ fontSize: "0.75rem" }} disabled={qs.running}>
                  <MenuItem value="first" sx={{ fontSize: "0.75rem" }}>First Element</MenuItem>
                  <MenuItem value="last" sx={{ fontSize: "0.75rem" }}>Last Element</MenuItem>
                  <MenuItem value="random" sx={{ fontSize: "0.75rem" }}>Random Element</MenuItem>
                  <MenuItem value="median" sx={{ fontSize: "0.75rem" }}>Median of 3</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => qs.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={() => qs.startSort(baseArray, selPart, selPivot)}
                disabled={qs.array.length === 0 || (qs.running && !qs.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={() => qs.stepSort(baseArray, selPart, selPivot)} disabled={qs.array.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={qs.paused ? <PlayArrow /> : <Pause />} onClick={qs.togglePause} disabled={!qs.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{qs.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={qs.resetSort}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={GET_STEPS(qs.partitionMethod)} activeIdx={qs.activeStepIdx} isDone={isDone} />
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Legend</Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {[
                { color: "#10b981", label: "Pivot" },
                ...(qs.partitionMethod === "counting" ? [{ color: "#eab308", label: "Count (cnt)" }] : []),
                { color: "#06b6d4", label: qs.partitionMethod === "lomuto" ? "Store ptr (s)" : "i pointer" },
                { color: "#f97316", label: qs.partitionMethod === "lomuto" ? "Scan ptr (j)" : "j pointer" },
                { color: "#ef4444", label: "Swap" },
                { color: "#8b5cf6", label: "Active" },
              ].map(item => (
                <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>{item.label}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* ─── Tree Visualization ─── */}
        <QuickSortTree
          initialArray={baseArray}
          treeLevels={qs.treeLevels} parentMap={qs.parentMap}
          partitionedRanges={qs.partitionedRanges}
          sortedRangesMap={qs.sortedRangesMap}
          pivotMap={qs.pivotMap}
          snapshotMap={qs.snapshotMap}
          activeRange={qs.activeRange}
          qsAnim={qs.qsAnim}
        />

        {/* ─── Right Sidebar ─── */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Current Range</Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              {[
                { label: "low", val: qs.activeRange ? qs.activeRange[0] : "-" },
                { label: "high", val: qs.activeRange ? qs.activeRange[1] : "-" },
              ].map(item => (
                <Box key={item.label} sx={{ flex: 1, p: 1.5, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "text.secondary", fontWeight: 600 }}>{item.label}</Typography>
                  <Typography variant="h6" sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "primary.main" }}>{item.val}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {qs.qsAnim && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Partition State</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {[
                  { label: "Pivot", val: qs.qsAnim.pivotVal, color: "#10b981" },
                  ...(qs.partitionMethod === "counting" ? [{ label: "Cnt (≤)", val: qs.qsAnim.cnt, color: "#eab308" }] : []),
                  { label: qs.partitionMethod === "lomuto" ? "Store" : qs.qsAnim.phase === "counting" ? "Scan i" : "i", val: qs.qsAnim.iPtr >= 0 ? qs.qsAnim.iPtr : "-", color: "#06b6d4" },
                  { label: "j", val: qs.qsAnim.jPtr >= 0 ? qs.qsAnim.jPtr : "-", color: "#f97316" },
                ].map(item => (
                  <Box key={item.label} sx={{ flex: 1, p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
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
              {qs.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
                : qs.logEntries.map((entry, idx) => (
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
