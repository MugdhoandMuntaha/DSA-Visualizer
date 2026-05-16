"use client";
import React, { useState, useRef, useCallback } from "react";
import {
  Box, Typography, ToggleButtonGroup, ToggleButton, Select, MenuItem,
  Slider, Button, Chip, IconButton, Paper, Tooltip, SelectChangeEvent,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel,
} from "@mui/material";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Pause from "@mui/icons-material/Pause";
import SkipNext from "@mui/icons-material/SkipNext";
import RestartAlt from "@mui/icons-material/RestartAlt";
import AddCircleOutlined from "@mui/icons-material/AddCircleOutlined";
import Timeline from "@mui/icons-material/Timeline";
import OpenWith from "@mui/icons-material/OpenWith";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import AccountTree from "@mui/icons-material/AccountTree";
import GridOn from "@mui/icons-material/GridOn";
import Shuffle from "@mui/icons-material/Shuffle";
import Header from "@/components/Header";
import GraphCanvas from "@/components/GraphCanvas";
import AlgoSteps, { StepDef } from "@/components/AlgoSteps";
import { useGraph } from "@/hooks/useGraph";
import { usePrim } from "@/hooks/usePrim";
import { GraphNode, GraphEdge, InteractionMode } from "@/lib/graphUtils";

const PRIM_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "key[src] = 0, others ∞. Push src to PQ." },
  { id: "extract-min", title: "Extract Min", description: "Pop node u with smallest key from PQ." },
  { id: "include-mst", title: "Include in MST", description: "Mark mst[u] = true." },
  { id: "check-neighbor", title: "Check Neighbors", description: "For each v adjacent to u." },
  { id: "update-key", title: "Update Key", description: "If wt < key[v], update key and push to PQ." },
  { id: "done", title: "Done", description: "Minimum Spanning Tree complete." },
];

export default function PrimPage() {
  const graph = useGraph();
  const pr = usePrim(graph.nodes, graph.edges);
  const [sourceId, setSourceId] = useState<string>("");
  const [nodeRadius, setNodeRadius] = useState(22);
  const [edgeWidth, setEdgeWidth] = useState(2);
  const [weightDialog, setWeightDialog] = useState<{ from: number; to: number } | null>(null);
  const [weightInput, setWeightInput] = useState("1");
  const [showOnlyMST, setShowOnlyMST] = useState(false);
  const canvasRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 });

  const isDone = pr.logEntries.some(l => l.type === "done");

  React.useEffect(() => {
    if (isDone && pr.mstEdges.length > 0) {
      setShowOnlyMST(true);
    } else if (!pr.running && pr.activeStepIdx <= 0) {
      setShowOnlyMST(false);
    }
  }, [isDone, pr.mstEdges.length, pr.running, pr.activeStepIdx]);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (pr.running) return;
    graph.addNode(x, y);
  }, [pr.running, graph]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (pr.running) return;
    if (graph.mode === "edge") {
      if (graph.edgeStart === null) { graph.setEdgeStart(node.id); }
      else { 
        if (graph.edgeStart !== node.id) {
          setWeightDialog({ from: graph.edgeStart, to: node.id });
          setWeightInput("1");
        }
        graph.setEdgeStart(null); 
      }
    } else if (graph.mode === "delete") { graph.deleteNode(node.id); }
  }, [pr.running, graph]);

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    if (pr.running) return;
    if (graph.mode === "delete") graph.deleteEdge(edge);
    else if (graph.mode === "edge") {
      setWeightDialog({ from: edge.from, to: edge.to });
      setWeightInput(String(edge.weight ?? 1));
    }
  }, [pr.running, graph]);

  const confirmWeight = () => {
    if (weightDialog) {
      const w = parseInt(weightInput);
      graph.addEdge(weightDialog.from, weightDialog.to, isNaN(w) ? 1 : w);
    }
    setWeightDialog(null);
  };

  const handleNodeDrag = useCallback((id: number, x: number, y: number) => {
    graph.moveNode(id, x, y);
  }, [graph]);

  const handlePreset = (type: "tree" | "grid" | "random") => {
    if (pr.running) return;
    pr.resetPrim();
    graph.clearGraph();
    // Prim's is generally weighted
    setTimeout(() => graph.loadPreset(type, canvasRef.current.w || 800, canvasRef.current.h || 600, true), 10);
    setSourceId("0");
  };

  const handleStart = () => { const id = parseInt(sourceId); if (!isNaN(id)) pr.startPrim(id); };
  const handleStep = () => { const id = parseInt(sourceId); if (!isNaN(id)) pr.stepPrim(id); };
  const handleReset = () => { pr.resetPrim(); };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "extract-min": "#ea580c", "mst-check": "#94a3b8", "include-mst": "#10b981",
    "check-neighbor": "#3b82f6", "update-key": "#f59e0b", "skip-update": "#94a3b8", done: "#0891b2",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Prim's Visualizer" badge="Minimum Spanning Tree" />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Sidebar */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderRight: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* Mode Panel */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", backdropFilter: "blur(10px)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
                <AddCircleOutlined sx={{ fontSize: 18, color: "primary.main" }} /> Build Graph
              </Typography>
              <ToggleButtonGroup value={graph.labelType} exclusive onChange={(_, v) => { if (v && v !== graph.labelType && !pr.running) graph.toggleLabelType(); }}
                size="small" sx={{ height: 24, "& .MuiToggleButton-root": { fontSize: "0.6rem", fontWeight: 700, px: 1, py: 0, textTransform: "none" } }}>
                <ToggleButton value="letter">A-Z</ToggleButton>
                <ToggleButton value="number">0-9</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ToggleButtonGroup value={graph.mode} exclusive onChange={(_, v: InteractionMode | null) => { if (v && !pr.running) graph.setMode(v); }}
              size="small" fullWidth sx={{ flexWrap: "wrap", gap: 0.5, "& .MuiToggleButton-root": { flex: "1 1 calc(50% - 4px)", fontSize: "0.72rem", fontWeight: 600, textTransform: "none", borderRadius: "8px !important", border: "1px solid rgba(99,102,241,0.15) !important" } }}>
              <ToggleButton value="node"><AddCircleOutlined sx={{ fontSize: 14, mr: 0.5 }} />Node</ToggleButton>
              <ToggleButton value="edge"><Timeline sx={{ fontSize: 14, mr: 0.5 }} />Edge</ToggleButton>
              <ToggleButton value="move"><OpenWith sx={{ fontSize: 14, mr: 0.5 }} />Move</ToggleButton>
              <ToggleButton value="delete"><DeleteOutlined sx={{ fontSize: 14, mr: 0.5 }} />Delete</ToggleButton>
            </ToggleButtonGroup>
          </Paper>

          {/* Controls Panel */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Algorithm
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.05em" }}>Source Node</Typography>
            <Select size="small" fullWidth value={sourceId} onChange={(e: SelectChangeEvent) => setSourceId(e.target.value)}
              sx={{ mb: 1.5, mt: 0.5, fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
              <MenuItem value="">— select —</MenuItem>
              {graph.nodes.map(n => <MenuItem key={n.id} value={String(n.id)}>{n.label}</MenuItem>)}
            </Select>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => pr.setSpeed(v as number)} size="small" sx={{ mb: 1, color: "primary.main" }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Node Size <Chip label={nodeRadius} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={14} max={40} value={nodeRadius} onChange={(_, v) => setNodeRadius(v as number)} size="small" sx={{ mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Edge Width <Chip label={edgeWidth} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={1} max={6} step={0.5} value={edgeWidth} onChange={(_, v) => setEdgeWidth(v as number)} size="small" sx={{ mb: 1.5 }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart} disabled={!sourceId || graph.nodes.length === 0 || (pr.running && !pr.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={handleStep} disabled={!sourceId || graph.nodes.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={pr.paused ? <PlayArrow /> : <Pause />} onClick={pr.togglePause} disabled={!pr.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{pr.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={handleReset}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Binary Tree"><IconButton size="small" onClick={() => handlePreset("tree")}><AccountTree sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Grid"><IconButton size="small" onClick={() => handlePreset("grid")}><GridOn sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
          </Paper>

          {/* Steps */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={PRIM_STEPS} activeIdx={pr.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* Canvas */}
        <GraphCanvas nodes={graph.nodes} edges={showOnlyMST ? pr.mstEdges : graph.edges} mode={graph.mode} nodeRadius={nodeRadius} edgeBaseWidth={edgeWidth}
          edgeStart={graph.edgeStart} currentNodeId={pr.currentNodeU} highlightEdge={pr.currentEdge} mstEdges={pr.mstEdges} neighborChecking={pr.currentNodeV}
          showWeights={true} visitedSet={pr.mstSet} queueIds={pr.pq.map(item => item.id)} onCanvasClick={handleCanvasClick} onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick} onNodeDrag={handleNodeDrag} />

        {/* Right Sidebar */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* Total Cost & Toggle */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
                  MST Cost
                </Typography>
                <Typography variant="h4" sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "primary.main", mt: 0.5 }}>
                  {pr.totalCost}
                </Typography>
              </Box>
              <FormControlLabel
                control={<Switch size="small" checked={showOnlyMST} onChange={(e) => setShowOnlyMST(e.target.checked)} color="success" />}
                label={<Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mt: 0.5 }}>MST Only</Typography>}
                labelPlacement="bottom"
                sx={{ m: 0, '& .MuiFormControlLabel-label': { mt: 0.5 } }}
              />
            </Box>
          </Paper>

          {/* PQ Table */}
          {pr.pq.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", maxHeight: 180, display: "flex", flexDirection: "column" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                Min Heap (Priority Queue)
              </Typography>
              <Box sx={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {pr.pq.map((item, idx) => (
                  <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 0.75, borderRadius: 1,
                    bgcolor: idx === 0 ? "rgba(234,88,12,0.1)" : "action.hover",
                    border: "1px solid", borderColor: idx === 0 ? "rgba(234,88,12,0.3)" : "divider" }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 600, color: idx === 0 ? "warning.main" : "text.secondary" }}>
                      {graph.nodes.find(n => n.id === item.id)?.label}
                    </Typography>
                    <Chip label={`wt: ${item.weight}`} size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700,
                      bgcolor: idx === 0 ? "warning.main" : "action.hover", color: idx === 0 ? "#fff" : "text.primary" }} />
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Key & Parent Array */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              Node Data (Key / Parent)
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", bgcolor: "divider", border: "1px solid", borderColor: "divider" }}>
              <Box sx={{ bgcolor: "action.hover", p: 1, textAlign: "center", fontWeight: 700, fontSize: "0.7rem", color: "text.secondary" }}>Node</Box>
              <Box sx={{ bgcolor: "action.hover", p: 1, textAlign: "center", fontWeight: 700, fontSize: "0.7rem", color: "text.secondary" }}>Key</Box>
              <Box sx={{ bgcolor: "action.hover", p: 1, textAlign: "center", fontWeight: 700, fontSize: "0.7rem", color: "text.secondary" }}>Parent</Box>
              
              {graph.nodes.map(n => {
                const k = pr.keyMap.get(n.id) ?? Infinity;
                const pId = pr.parentMap.get(n.id);
                const isInf = k === Infinity;
                const inMst = pr.mstSet.has(n.id);
                return (
                  <React.Fragment key={n.id}>
                    <Box sx={{ bgcolor: inMst ? "rgba(16,185,129,0.1)" : "background.paper", p: 1, textAlign: "center", fontSize: "0.75rem", fontFamily: "var(--font-mono)", fontWeight: 600, color: inMst ? "success.main" : "text.primary" }}>{n.label}</Box>
                    <Box sx={{ bgcolor: inMst ? "rgba(16,185,129,0.1)" : "background.paper", p: 1, textAlign: "center", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: isInf ? "text.disabled" : "primary.main", fontWeight: 700 }}>
                      {isInf ? "∞" : k}
                    </Box>
                    <Box sx={{ bgcolor: inMst ? "rgba(16,185,129,0.1)" : "background.paper", p: 1, textAlign: "center", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "secondary.main" }}>
                      {pId !== undefined && pId !== n.id ? graph.nodes.find(node => node.id === pId)?.label : "-"}
                    </Box>
                  </React.Fragment>
                );
              })}
            </Box>
          </Paper>

          {/* Log */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {pr.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Build a graph and press Start</Typography>
                : pr.logEntries.map((entry, idx) => (
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

      {/* Weight Input Dialog */}
      <Dialog open={!!weightDialog} onClose={() => setWeightDialog(null)} maxWidth="xs">
        <DialogTitle sx={{ fontSize: "1rem" }}>Edge Weight</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth type="number" label="Weight (can be negative)" value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
            sx={{ mt: 1 }} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWeightDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={confirmWeight}>Save Edge</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
