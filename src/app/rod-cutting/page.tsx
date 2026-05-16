"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Slider, TextField, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { PlayArrow, Pause, RestartAlt } from '@mui/icons-material';
import { useRodCutting, RC_CODES, RCMode } from '@/hooks/useRodCutting';
import { RodCuttingVisualizer } from '@/components/RodCuttingVisualizer';

export default function RodCuttingPage() {
  const rc = useRodCutting();
  const [nInput, setNInput] = useState(4);
  const [pricesInput, setPricesInput] = useState("1, 5, 8, 9, 10, 17, 17, 20");
  const [mode, setMode] = useState<RCMode>("recursive");

  const parsePrices = () => {
    return pricesInput.split(",").map(p => parseInt(p.trim())).filter(p => !isNaN(p));
  };

  useEffect(() => {
    rc.reset(nInput, parsePrices(), mode);
  }, []);

  const handleStart = () => {
    const prices = parsePrices();
    if (nInput > prices.length) {
      alert(`Please provide at least ${nInput} prices!`);
      return;
    }
    rc.generateFrames(nInput, prices, mode);
  };

  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: RCMode | null) => {
    if (newMode !== null) {
      setMode(newMode);
      rc.reset(nInput, parsePrices(), newMode);
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", bgcolor: "#0f172a", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ flex: "none", p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", bgcolor: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 1.5 }}>
            <span style={{ color: "#e11d48" }}>Rod Cutting</span>
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Dynamic Programming: Visualize Tabulation vs Memoization vs Recursion
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
             <Typography variant="body2" sx={{ color: "text.secondary" }}>Mode:</Typography>
             <ToggleButtonGroup value={mode} exclusive onChange={handleModeChange} size="small">
               <ToggleButton value="tabulation" sx={{ color: "text.primary", "&.Mui-selected": { bgcolor: "rgba(225,29,72,0.2)", color: "#e11d48" } }}>Tabulation</ToggleButton>
               <ToggleButton value="memoization" sx={{ color: "text.primary", "&.Mui-selected": { bgcolor: "rgba(225,29,72,0.2)", color: "#e11d48" } }}>Memoization</ToggleButton>
               <ToggleButton value="recursive" sx={{ color: "text.primary", "&.Mui-selected": { bgcolor: "rgba(225,29,72,0.2)", color: "#e11d48" } }}>Recursion Tree</ToggleButton>
             </ToggleButtonGroup>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              type="number"
              size="small"
              label="Rod Length (n)"
              value={nInput}
              onChange={(e) => setNInput(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
              disabled={rc.running}
              sx={{ width: 120, input: { color: "#fff" }, label: { color: "text.secondary" } }}
              slotProps={{ htmlInput: { min: 1, max: 7 } }}
            />
            <TextField
              size="small"
              label="Prices (comma separated)"
              value={pricesInput}
              onChange={(e) => setPricesInput(e.target.value)}
              disabled={rc.running}
              sx={{ width: 200, input: { color: "#fff" }, label: { color: "text.secondary" } }}
            />
            <Button variant="contained" sx={{ bgcolor: "#e11d48", "&:hover": { bgcolor: "#be123c" } }} onClick={handleStart} disabled={rc.running || nInput < 1}>
              Start DP
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Sidebar (Code & Logs) */}
        <Box sx={{ width: 400, flex: "none", borderRight: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", p: 2, gap: 2, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(225,29,72,0.15)", flex: "none" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Code ({mode})</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, bgcolor: "rgba(0,0,0,0.3)", p: 1, borderRadius: 1 }}>
              {RC_CODES[mode].map((line, idx) => (
                <Typography
                  key={idx}
                  variant="caption"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    color: rc.rcState.activeCodeLine === idx ? "#fff" : "text.secondary",
                    bgcolor: rc.rcState.activeCodeLine === idx ? "rgba(225,29,72,0.3)" : "transparent",
                    py: 0.25,
                    px: 0.5,
                    borderRadius: 0.5,
                    borderLeft: rc.rcState.activeCodeLine === idx ? "2px solid #e11d48" : "2px solid transparent",
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.2)", display: "inline-block", width: "1.5rem", userSelect: "none" }}>{idx + 1}</span>
                  <span dangerouslySetInnerHTML={{ __html: line.replace(/ /g, "&nbsp;") }} />
                </Typography>
              ))}
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(225,29,72,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1 }}>Execution Logs</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
              {rc.rcState.logs.map((log, idx) => (
                <Typography key={idx} variant="caption" sx={{ fontFamily: "var(--font-mono)", color: idx === rc.rcState.logs.length - 1 ? "#fff" : "text.secondary" }}>
                  {log}
                </Typography>
              ))}
            </Box>
          </Paper>
          
          {(mode === "memoization" || mode === "recursive") && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(225,29,72,0.15)", flex: "none", minHeight: 120 }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>Call Stack</Typography>
              {rc.rcState.callStack && rc.rcState.callStack.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column-reverse", gap: 0.5 }}>
                  {rc.rcState.callStack.map((frame, idx) => (
                    <Box key={idx} sx={{ p: 0.75, borderRadius: 1, bgcolor: idx === rc.rcState.callStack.length - 1 ? "rgba(225,29,72,0.15)" : "action.hover", border: "1px solid", borderColor: idx === rc.rcState.callStack.length - 1 ? "primary.main" : "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: idx === rc.rcState.callStack.length - 1 ? 700 : 500, color: idx === rc.rcState.callStack.length - 1 ? "primary.main" : "text.primary" }}>
                        {frame.func}()
                      </Typography>
                      <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "text.secondary" }}>
                        {Object.entries(frame.args).map(([k, v]) => `${k}=${v}`).join(", ")}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Stack empty</Typography>
              )}
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(225,29,72,0.15)", mt: "auto" }}>
             <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Animation Speed</Typography>
             <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => rc.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "#e11d48" }} />
             <Box sx={{ display: "flex", gap: 1 }}>
               <Button variant="outlined" fullWidth size="small" startIcon={rc.paused ? <PlayArrow /> : <Pause />} onClick={rc.paused ? rc.resume : rc.pause} disabled={!rc.running && !rc.paused}>
                 {rc.paused ? "Resume" : "Pause"}
               </Button>
               <Button variant="outlined" fullWidth size="small" color="error" startIcon={<RestartAlt />} onClick={() => rc.reset(nInput, parsePrices(), mode)} disabled={rc.running}>
                 Reset
               </Button>
             </Box>
          </Paper>
        </Box>

        {/* Visualization Area */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", p: 3 }}>
          {mode === "memoization" && rc.rcState.dp && rc.rcState.dp.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: "rgba(225,29,72,0.3)", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography variant="overline" sx={{ mb: 1, fontWeight: 700 }}>Memoization Table (Rows: i, Cols: len)</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, justifyContent: "center" }}>
                {rc.rcState.dp.map((row, i) => {
                  if (i === 0 || i > nInput) return null;
                  return (
                    <Box key={`m-r-${i}`} sx={{ display: "flex", gap: 0.5 }}>
                      {row.map((val, len) => {
                        if (len > nInput) return null;
                        return (
                          <Box key={`m-c-${i}-${len}`} sx={{ 
                            width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", 
                            bgcolor: val !== null ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                            border: "1px solid", borderColor: val !== null ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)",
                            borderRadius: 1
                          }}>
                            <Typography variant="caption" sx={{ fontSize: "0.6rem", color: val !== null ? "#fff" : "text.disabled" }}>
                              {val !== null ? val : "-"}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          )}
          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "center" }}>
             <RodCuttingVisualizer rcState={rc.rcState} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
