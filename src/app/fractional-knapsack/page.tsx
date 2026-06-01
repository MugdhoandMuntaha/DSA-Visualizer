"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Slider, TextField } from '@mui/material';
import { PlayArrow, Pause, RestartAlt } from '@mui/icons-material';
import { useFractionalKnapsack, FK_CODES } from '@/hooks/useFractionalKnapsack';
import { FractionalKnapsackVisualizer } from '@/components/FractionalKnapsackVisualizer';

export default function FractionalKnapsackPage() {
  const fk = useFractionalKnapsack();
  const [capacity, setCapacity] = useState(50);
  const [weightsInput, setWeightsInput] = useState("10, 20, 30");
  const [valuesInput, setValuesInput] = useState("60, 100, 120");

  const parseInputs = () => {
    const weights = weightsInput.split(",").map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p > 0);
    const values = valuesInput.split(",").map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p > 0);
    
    if (weights.length !== values.length) {
      return null; // Mismatch
    }
    
    return weights.map((w, idx) => ({ id: idx + 1, weight: w, value: values[idx] }));
  };

  useEffect(() => {
    const items = parseInputs();
    if (items) {
      fk.reset(items, capacity);
    }
  }, []);

  const handleStart = () => {
    const items = parseInputs();
    if (!items) {
      alert("Please ensure Weights and Values have the same number of valid elements.");
      return;
    }
    if (items.length === 0) {
      alert("Please provide valid items!");
      return;
    }
    fk.generateFrames(items, capacity);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", bgcolor: "#0f172a", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ flex: "none", p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", bgcolor: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 1.5 }}>
            <span style={{ color: "#eab308" }}>Fractional Knapsack</span>
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Greedy Algorithms - Maximize profit based on value-to-weight ratio.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              type="number"
              size="small"
              label="Capacity"
              value={capacity}
              onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={fk.running}
              sx={{ width: 100, input: { color: "#fff" }, label: { color: "text.secondary" } }}
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <TextField
              size="small"
              label="Weights (comma separated)"
              value={weightsInput}
              onChange={(e) => setWeightsInput(e.target.value)}
              disabled={fk.running}
              sx={{ width: 180, input: { color: "#fff" }, label: { color: "text.secondary" } }}
            />
            <TextField
              size="small"
              label="Values (comma separated)"
              value={valuesInput}
              onChange={(e) => setValuesInput(e.target.value)}
              disabled={fk.running}
              sx={{ width: 180, input: { color: "#fff" }, label: { color: "text.secondary" } }}
            />
            <Button variant="contained" sx={{ bgcolor: "#eab308", color: "#000", "&:hover": { bgcolor: "#ca8a04" } }} onClick={handleStart} disabled={fk.running || capacity < 1}>
              Start Greedy
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Sidebar (Code & Logs) */}
        <Box sx={{ width: 400, flex: "none", borderRight: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", p: 2, gap: 2, bgcolor: "rgba(0,0,0,0.2)" }}>
          
          {/* Controls */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(234,179,8,0.15)", flex: "none" }}>
             <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Animation Speed</Typography>
             <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => fk.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "#eab308" }} />
             <Box sx={{ display: "flex", gap: 1 }}>
               <Button variant="outlined" fullWidth size="small" sx={{ borderColor: "#eab308", color: "#eab308" }} startIcon={fk.paused ? <PlayArrow /> : <Pause />} onClick={fk.paused ? fk.resume : fk.pause} disabled={!fk.running && !fk.paused}>
                 {fk.paused ? "Resume" : "Pause"}
               </Button>
               <Button variant="outlined" fullWidth size="small" color="error" startIcon={<RestartAlt />} onClick={() => {
                   const items = parseInputs();
                   if (items) fk.reset(items, capacity);
               }} disabled={fk.running}>
                 Reset
               </Button>
             </Box>
          </Paper>

          {/* Greedy Code */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(234,179,8,0.15)", flex: 1.5, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Greedy Code</Typography>
            <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 0.5, bgcolor: "rgba(0,0,0,0.3)", p: 1, borderRadius: 1 }}>
              {FK_CODES.map((line, idx) => (
                <Typography
                  key={idx}
                  variant="caption"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    color: fk.state.activeCodeLine === idx ? "#fff" : "text.secondary",
                    bgcolor: fk.state.activeCodeLine === idx ? "rgba(234,179,8,0.3)" : "transparent",
                    py: 0.25,
                    px: 0.5,
                    borderRadius: 0.5,
                    borderLeft: fk.state.activeCodeLine === idx ? "2px solid #eab308" : "2px solid transparent",
                    transition: "all 0.2s",
                    whiteSpace: "pre"
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.2)", display: "inline-block", width: "1.5rem", userSelect: "none" }}>{idx + 1}</span>
                  <span dangerouslySetInnerHTML={{ __html: line.replace(/ /g, "&nbsp;") }} />
                </Typography>
              ))}
            </Box>
          </Paper>

          {/* Logs */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(234,179,8,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1 }}>Execution Logs</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
              {fk.state.logs.map((log, idx) => (
                <Typography key={idx} variant="caption" sx={{ fontFamily: "var(--font-mono)", color: idx === fk.state.logs.length - 1 ? "#fff" : "text.secondary" }}>
                  {log}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Visualization Area */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <FractionalKnapsackVisualizer state={fk.state} />
        </Box>
      </Box>
    </Box>
  );
}
