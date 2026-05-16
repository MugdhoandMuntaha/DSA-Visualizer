"use client";
import React, { useState, useRef, useCallback } from "react";
import {
  Box, Typography, ToggleButtonGroup, ToggleButton,
  Slider, Button, Chip, IconButton, Paper, Tooltip,
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
import { useKruskal } from "@/hooks/useKruskal";
import { GraphNode, GraphEdge, InteractionMode } from "@/lib/graphUtils";

const KRUSKAL_STEPS: StepDef[] = [
  { id: "init", title: "Initialize DSU", description: "parent[v] = v, rank[v] = 0." },
  { id: "sort", title: "Sort Edges", description: "Sort all edges by weight." },
  { id: "check-edge", title: "Pick Smallest Edge", description: "Get the next smallest edge (u, v)." },
  { id: "find-parent", title: "Find Parent", description: "Check if u and v have the same root." },
  { id: "union", title: "Union / Cycle", description: "If roots differ, union sets. Else discard." },
  { id: "done", title: "Done", description: "Minimum Spanning Tree complete." },
];

export default function KruskalPage() {
  const graph = useGraph();
  const kr = useKruskal(graph.nodes, graph.edges);
  const [nodeRadius, setNodeRadius] = useState(22);
  const [edgeWidth, setEdgeWidth] = useState(2);
  const [weightDialog, setWeightDialog] = useState<{ from: number; to: number } | null>(null);
  const [weightInput, setWeightInput] = useState("1");
  const [showOnlyMST, setShowOnlyMST] = useState(false);
  const canvasRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 });

  const isDone = kr.logEntries.some(l => l.type === "done");

  React.useEffect(() => {
    if (isDone && kr.mstEdges.length > 0) {
      setShowOnlyMST(true);
    } else if (!kr.running && kr.activeStepIdx <= 0) {
      setShowOnlyMST(false);
    }
  }, [isDone, kr.mstEdges.length, kr.running, kr.activeStepIdx]);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (kr.running) return;
    graph.addNode(x, y);
  }, [kr.running, graph]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (kr.running) return;
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
  }, [kr.running, graph]);

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    if (kr.running) return;
    if (graph.mode === "delete") graph.deleteEdge(edge);
    else if (graph.mode === "edge") {
      setWeightDialog({ from: edge.from, to: edge.to });
      setWeightInput(String(edge.weight ?? 1));
    }
  }, [kr.running, graph]);

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
    if (kr.running) return;
    kr.resetKruskal();
    graph.clearGraph();
    // Kruskal's is generally weighted
    setTimeout(() => graph.loadPreset(type, canvasRef.current.w || 800, canvasRef.current.h || 600, true), 10);
  };

  const handleStart = () => { kr.startKruskal(); };
  const handleStep = () => { kr.stepKruskal(); };
  const handleReset = () => { kr.resetKruskal(); };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", sort: "#ea580c", "check-edge": "#10b981", "find-parent": "#3b82f6", 
    union: "#10b981", cycle: "#ef4444", done: "#0891b2",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Kruskal's Visualizer" badge="Minimum Spanning Tree" />
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
              <ToggleButtonGroup value={graph.labelType} exclusive onChange={(_, v) => { if (v && v !== graph.labelType && !kr.running) graph.toggleLabelType(); }}
                size="small" sx={{ height: 24, "& .MuiToggleButton-root": { fontSize: "0.6rem", fontWeight: 700, px: 1, py: 0, textTransform: "none" } }}>
                <ToggleButton value="letter">A-Z</ToggleButton>
                <ToggleButton value="number">0-9</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ToggleButtonGroup value={graph.mode} exclusive onChange={(_, v: InteractionMode | null) => { if (v && !kr.running) graph.setMode(v); }}
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
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => kr.setSpeed(v as number)} size="small" sx={{ mb: 1, color: "primary.main" }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Node Size <Chip label={nodeRadius} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={14} max={40} value={nodeRadius} onChange={(_, v) => setNodeRadius(v as number)} size="small" sx={{ mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Edge Width <Chip label={edgeWidth} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={1} max={6} step={0.5} value={edgeWidth} onChange={(_, v) => setEdgeWidth(v as number)} size="small" sx={{ mb: 1.5 }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart} disabled={graph.nodes.length === 0 || (kr.running && !kr.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={handleStep} disabled={graph.nodes.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={kr.paused ? <PlayArrow /> : <Pause />} onClick={kr.togglePause} disabled={!kr.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{kr.paused ? "Resume" : "Pause"}</Button>
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
            <AlgoSteps steps={KRUSKAL_STEPS} activeIdx={kr.activeStepIdx} isDone={isDone} />
          </Paper>
        </Box>

        {/* Canvas */}
        <GraphCanvas nodes={graph.nodes} edges={showOnlyMST ? kr.mstEdges : graph.edges} mode={graph.mode} nodeRadius={nodeRadius} edgeBaseWidth={edgeWidth}
          edgeStart={graph.edgeStart} highlightEdge={kr.currentEdge} mstEdges={kr.mstEdges}
          showWeights={true} visitedSet={new Set()} queueIds={[]} onCanvasClick={handleCanvasClick} onNodeClick={handleNodeClick}
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
                  {kr.totalCost}
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

          {/* Sorted Edges Table */}
          {kr.sortedEdges.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", maxHeight: 200, display: "flex", flexDirection: "column" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                Sorted Edges
              </Typography>
              <Box sx={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {kr.sortedEdges.map((e, idx) => {
                  const isMst = kr.mstEdges.some(me => (me.from === e.from && me.to === e.to) || (me.from === e.to && me.to === e.from));
                  const isCurrent = kr.currentEdge && ((kr.currentEdge.from === e.from && kr.currentEdge.to === e.to) || (kr.currentEdge.from === e.to && kr.currentEdge.to === e.from));
                  return (
                    <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 0.75, borderRadius: 1,
                      bgcolor: isCurrent ? "rgba(251,191,36,0.15)" : isMst ? "rgba(16,185,129,0.1)" : "action.hover",
                      border: "1px solid", borderColor: isCurrent ? "warning.main" : isMst ? "success.main" : "divider" }}>
                      <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 600, color: "text.secondary" }}>
                        {graph.nodes.find(n => n.id === e.from)?.label} - {graph.nodes.find(n => n.id === e.to)?.label}
                      </Typography>
                      <Chip label={e.weight} size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700,
                        bgcolor: isMst ? "success.main" : "action.hover", color: isMst ? "#fff" : "text.primary" }} />
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          )}

          {/* DSU Parent Array */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              Disjoint Set (DSU)
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", bgcolor: "divider", border: "1px solid", borderColor: "divider" }}>
              <Box sx={{ bgcolor: "action.hover", p: 1, textAlign: "center", fontWeight: 700, fontSize: "0.7rem", color: "text.secondary" }}>Node</Box>
              <Box sx={{ bgcolor: "action.hover", p: 1, textAlign: "center", fontWeight: 700, fontSize: "0.7rem", color: "text.secondary" }}>Parent</Box>
              <Box sx={{ bgcolor: "action.hover", p: 1, textAlign: "center", fontWeight: 700, fontSize: "0.7rem", color: "text.secondary" }}>Rank</Box>
              
              {graph.nodes.map(n => {
                const pId = kr.parent.get(n.id);
                const r = kr.rank.get(n.id);
                return (
                  <React.Fragment key={n.id}>
                    <Box sx={{ bgcolor: "background.paper", p: 1, textAlign: "center", fontSize: "0.75rem", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{n.label}</Box>
                    <Box sx={{ bgcolor: "background.paper", p: 1, textAlign: "center", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "primary.main", fontWeight: 700 }}>
                      {pId !== undefined ? graph.nodes.find(node => node.id === pId)?.label : "-"}
                    </Box>
                    <Box sx={{ bgcolor: "background.paper", p: 1, textAlign: "center", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "secondary.main" }}>
                      {r !== undefined ? r : "-"}
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
              {kr.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Build a graph and press Start</Typography>
                : kr.logEntries.map((entry, idx) => (
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
