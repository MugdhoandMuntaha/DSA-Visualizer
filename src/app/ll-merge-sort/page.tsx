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
import Shuffle from "@mui/icons-material/Shuffle";
import SignalCellularAlt from "@mui/icons-material/SignalCellularAlt";
import SortIcon from "@mui/icons-material/Sort";
import Header from "@/components/Header";
import LLMergeSortTree from "@/components/LLMergeSortTree";
import AlgoSteps, { StepDef } from "@/components/AlgoSteps";
import { useLLMergeSort } from "@/hooks/useLLMergeSort";

const STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "Start with the full unsorted linked list." },
  { id: "divide", title: "Find Middle", description: "Use slow/fast pointers to find mid node." },
  { id: "split", title: "Split", description: "Disconnect at mid. Create left & right sublists." },
  { id: "merge-start", title: "Begin Merge", description: "Merge two sorted sublists into one." },
  { id: "compare", title: "Compare Heads", description: "Compare head of left & right sublists." },
  { id: "merge-done", title: "Merge Complete", description: "Sublist merged and sorted." },
  { id: "done", title: "Done", description: "Entire linked list is sorted." },
];

const CODE_LINES = [
  "Node* getMiddle(Node* head){",
  "    if(!head) return head;",
  "    Node* slow=head, *fast=head->next;",
  "    while(fast && fast->next){",
  "        slow=slow->next;",
  "        fast=fast->next->next;",
  "    }",
  "    return slow;",
  "}",
  "Node* merge(Node* a, Node* b){",
  "    if(!a) return b; if(!b) return a;",
  "    if(a->data <= b->data){",
  "        a->next = merge(a->next, b);",
  "        return a;",
  "    } else {",
  "        b->next = merge(a, b->next);",
  "        return b;",
  "    }",
  "}",
  "Node* mergeSort(Node* head){",
  "    if(!head || !head->next) return head;",
  "    Node* mid = getMiddle(head);",
  "    Node* half = mid->next;",
  "    mid->next = NULL;",
  "    return merge(mergeSort(head), mergeSort(half));",
  "}"
];

export default function LLMergeSortPage() {
  const [baseArray, setBaseArray] = useState<number[]>([38, 27, 43, 3, 9, 82, 10]);
  const ms = useLLMergeSort(baseArray);
  const [arrayInput, setArrayInput] = useState(baseArray.join(", "));

  const isDone = ms.logEntries.some(l => l.type === "done");

  const handleUpdateArray = () => {
    if (ms.running) return;
    const newArr = arrayInput.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (newArr.length > 0 && newArr.length <= 15) {
      setBaseArray(newArr);
      ms.resetSort();
    } else {
      alert("Please enter between 1 and 15 valid numbers.");
    }
  };

  const handlePreset = (type: "random" | "reversed" | "nearly-sorted") => {
    if (ms.running) return;
    let newArr: number[] = [];
    const size = 7;
    if (type === "random") {
      newArr = Array.from({ length: size }, () => Math.floor(Math.random() * 99) + 1);
    } else if (type === "reversed") {
      newArr = Array.from({ length: size }, (_, i) => (size - i) * 8);
    } else {
      newArr = Array.from({ length: size }, (_, i) => i * 8 + 5);
      const temp = newArr[2]; newArr[2] = newArr[4]; newArr[4] = temp;
    }
    setBaseArray(newArr);
    setArrayInput(newArr.join(", "));
    ms.resetSort();
  };

  const handleStart = () => { ms.startSort(baseArray); };
  const handleStep = () => { ms.stepSort(baseArray); };
  const handleReset = () => { ms.resetSort(); };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", divide: "#3b82f6", base: "#94a3b8", split: "#06b6d4",
    "recurse-left": "#3b82f6", "recurse-right": "#f97316",
    "merge-start": "#ea580c", compare: "#f59e0b",
    place: "#8b5cf6", "copy-left": "#06b6d4", "copy-right": "#f97316",
    "merge-done": "#10b981", done: "#0891b2",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="LL Merge Sort" badge="O(N log N) · Divide & Conquer" />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Sidebar */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderRight: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* Array Input */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <InputOutlined sx={{ fontSize: 18, color: "primary.main" }} /> Input List
            </Typography>
            <TextField fullWidth size="small" variant="outlined" value={arrayInput} onChange={(e) => setArrayInput(e.target.value)}
              disabled={ms.running} placeholder="e.g. 38, 27, 43, 3"
              sx={{ mb: 1, "& .MuiInputBase-input": { fontFamily: "var(--font-mono)", fontSize: "0.8rem" } }} />
            <Button fullWidth variant="outlined" size="small" onClick={handleUpdateArray} disabled={ms.running} sx={{ mb: 1.5, fontSize: "0.75rem", fontWeight: 700 }}>
              Update List
            </Button>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")} disabled={ms.running}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Reversed"><IconButton size="small" onClick={() => handlePreset("reversed")} disabled={ms.running}><SignalCellularAlt sx={{ fontSize: 16, transform: "scaleX(-1)" }} /></IconButton></Tooltip>
              <Tooltip title="Nearly Sorted"><IconButton size="small" onClick={() => handlePreset("nearly-sorted")} disabled={ms.running}><SortIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
          </Paper>

          {/* Controls */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => ms.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart} disabled={baseArray.length === 0 || (ms.running && !ms.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={handleStep} disabled={baseArray.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={ms.paused ? <PlayArrow /> : <Pause />} onClick={ms.togglePause} disabled={!ms.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{ms.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={handleReset}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
          </Paper>

          {/* Steps */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={STEPS} activeIdx={ms.activeStepIdx} isDone={isDone} />
          </Paper>

          {/* Legend */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Legend</Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {[
                { color: "#06b6d4", label: "Left" },
                { color: "#f97316", label: "Right" },
                { color: "#8b5cf6", label: "Active" },
                { color: "#10b981", label: "Merged" },
              ].map(item => (
                <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>{item.label}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Center: Tree Visualization */}
        <LLMergeSortTree
          initialArray={baseArray}
          dividedRanges={ms.dividedRanges}
          mergedRangesMap={ms.mergedRangesMap}
          activeRange={ms.activeRange}
          leftRange={ms.leftRange}
          rightRange={ms.rightRange}
          mergeAnim={ms.mergeAnim}
        />

        {/* Right Sidebar */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* C++ Code */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: "none", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>C++ Implementation</Typography>
            <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "text.secondary", display: "flex", flexDirection: "column", gap: 0.3 }}>
              {CODE_LINES.map((line, idx) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", py: 0.2,
                  bgcolor: ms.activeLine === idx + 1 ? "rgba(99,102,241,0.2)" : "transparent",
                  color: ms.activeLine === idx + 1 ? "primary.main" : "inherit", px: 0.5, borderRadius: 0.5 }}>
                  <Typography sx={{ width: 20, opacity: 0.5, userSelect: "none", mr: 1, fontSize: "0.65rem", textAlign: "right" }}>{idx + 1}</Typography>
                  <Typography sx={{ whiteSpace: "pre", fontSize: "0.72rem", fontWeight: ms.activeLine === idx + 1 ? 700 : 400 }}>{line}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Current State */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Current List</Typography>
            <Box sx={{ display: "flex", gap: "3px", flexWrap: "wrap", alignItems: "center" }}>
              {ms.values.map((v, i) => (
                <Chip key={i} label={v} size="small" sx={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700, height: 22,
                  bgcolor: isDone ? "rgba(16,185,129,0.15)" : "action.hover",
                  color: isDone ? "success.main" : "text.secondary",
                  border: "1px solid", borderColor: isDone ? "success.main" : "divider" }} />
              ))}
            </Box>
          </Paper>

          {/* Log */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {ms.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Press Start to sort</Typography>
                : ms.logEntries.map((entry, idx) => (
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
