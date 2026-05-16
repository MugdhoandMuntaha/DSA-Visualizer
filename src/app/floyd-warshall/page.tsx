"use client";
import React, { useState, useRef, useCallback } from "react";
import {
  Box, Typography, ToggleButtonGroup, ToggleButton,
  Slider, Button, Chip, IconButton, Paper, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
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
import { useFloydWarshall } from "@/hooks/useFloydWarshall";
import { GraphNode, GraphEdge, InteractionMode } from "@/lib/graphUtils";

const FLOYD_WARSHALL_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "dist[i][j] = weight, dist[i][i] = 0." },
  { id: "loop-via", title: "for(via = 0 to n-1)", description: "Consider each node as an intermediate." },
  { id: "check", title: "Check Paths", description: "if(dist[i][via] + dist[via][j] < dist[i][j])" },
  { id: "relax", title: "Relax Edge", description: "dist[i][j] = dist[i][via] + dist[via][j]" },
  { id: "done", title: "Done", description: "All-Pairs Shortest Paths calculated." },
];

export default function FloydWarshallPage() {
  const graph = useGraph();
  const fw = useFloydWarshall(graph.nodes, graph.edges);
  const [nodeRadius, setNodeRadius] = useState(22);
  const [edgeWidth, setEdgeWidth] = useState(2);
  const [weightDialog, setWeightDialog] = useState<{ from: number; to: number } | null>(null);
  const [weightInput, setWeightInput] = useState("1");
  const canvasRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 });

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (fw.running) return;
    graph.addNode(x, y);
  }, [fw.running, graph]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (fw.running) return;
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
  }, [fw.running, graph]);

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    if (fw.running) return;
    if (graph.mode === "delete") graph.deleteEdge(edge);
    else if (graph.mode === "edge") {
      setWeightDialog({ from: edge.from, to: edge.to });
      setWeightInput(String(edge.weight ?? 1));
    }
  }, [fw.running, graph]);

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
    if (fw.running) return;
    fw.resetFloydWarshall();
    graph.clearGraph();
    setTimeout(() => graph.loadPreset(type, canvasRef.current.w || 800, canvasRef.current.h || 600), 10);
  };

  const handleStart = () => { fw.startFloydWarshall(); };
  const handleStep = () => { fw.stepFloydWarshall(); };
  const handleReset = () => { fw.resetFloydWarshall(); };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "loop-via": "#ea580c", check: "#10b981", relax: "#3b82f6", done: "#0891b2",
  };

  const sortedNodes = [...graph.nodes].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Floyd-Warshall Visualizer" badge="All-Pairs Shortest Path" />
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
              <ToggleButtonGroup value={graph.labelType} exclusive onChange={(_, v) => { if (v && v !== graph.labelType && !fw.running) graph.toggleLabelType(); }}
                size="small" sx={{ height: 24, "& .MuiToggleButton-root": { fontSize: "0.6rem", fontWeight: 700, px: 1, py: 0, textTransform: "none" } }}>
                <ToggleButton value="letter">A-Z</ToggleButton>
                <ToggleButton value="number">0-9</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ToggleButtonGroup value={graph.mode} exclusive onChange={(_, v: InteractionMode | null) => { if (v && !fw.running) graph.setMode(v); }}
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
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => fw.setSpeed(v as number)} size="small" sx={{ mb: 1, color: "primary.main" }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Node Size <Chip label={nodeRadius} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={14} max={40} value={nodeRadius} onChange={(_, v) => setNodeRadius(v as number)} size="small" sx={{ mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Edge Width <Chip label={edgeWidth} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={1} max={6} step={0.5} value={edgeWidth} onChange={(_, v) => setEdgeWidth(v as number)} size="small" sx={{ mb: 1.5 }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart} disabled={graph.nodes.length === 0 || (fw.running && !fw.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={handleStep} disabled={graph.nodes.length === 0}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={fw.paused ? <PlayArrow /> : <Pause />} onClick={fw.togglePause} disabled={!fw.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{fw.paused ? "Resume" : "Pause"}</Button>
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
            <AlgoSteps steps={FLOYD_WARSHALL_STEPS} activeIdx={fw.activeStepIdx} isDone={fw.logEntries.some(l => l.type === "done")} />
          </Paper>
        </Box>

        {/* Canvas */}
        <GraphCanvas nodes={graph.nodes} edges={graph.edges} mode={graph.mode} nodeRadius={nodeRadius} edgeBaseWidth={edgeWidth}
          edgeStart={graph.edgeStart} currentNodeId={fw.currentVia} highlightEdge={null} neighborChecking={fw.currentJ}
          showWeights={true} visitedSet={new Set()} queueIds={[]} onCanvasClick={handleCanvasClick} onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick} onNodeDrag={handleNodeDrag} />

        {/* Right Sidebar */}
        <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* Active Nodes */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
              Current Nodes
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              {[{ label: "via", id: fw.currentVia, color: "secondary.main" },
                { label: "i", id: fw.currentI, color: "primary.main" },
                { label: "j", id: fw.currentJ, color: "success.main" }].map(item => (
                <Box key={item.label} sx={{ flex: 1, p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "text.secondary", fontWeight: 600 }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: item.color }}>
                    {item.id !== null ? graph.nodes.find(n => n.id === item.id)?.label : "-"}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Distance Matrix */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", overflowX: "auto", flexShrink: 0 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              Distance Matrix (dist)
            </Typography>
            {sortedNodes.length === 0 ? (
              <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Add nodes to see matrix</Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: `auto repeat(${sortedNodes.length}, 1fr)`, gap: "1px", bgcolor: "divider", border: "1px solid", borderColor: "divider" }}>
                {/* Header Row */}
                <Box sx={{ bgcolor: "action.hover", p: 1 }} />
                {sortedNodes.map(n => (
                  <Box key={`h-${n.id}`} sx={{ bgcolor: "action.hover", p: 1, textAlign: "center", fontWeight: 700, fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "text.secondary" }}>
                    {n.label}
                  </Box>
                ))}
                
                {/* Data Rows */}
                {sortedNodes.map(u => (
                  <React.Fragment key={`r-${u.id}`}>
                    {/* Row Header */}
                    <Box sx={{ bgcolor: "action.hover", p: 1, textAlign: "center", fontWeight: 700, fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "text.secondary" }}>
                      {u.label}
                    </Box>
                    {/* Cells */}
                    {sortedNodes.map(v => {
                      const d = fw.distances[u.id]?.[v.id] ?? Infinity;
                      const isInf = d === Infinity;
                      const isTarget = u.id === fw.currentI && v.id === fw.currentJ;
                      const isVia = u.id === fw.currentVia || v.id === fw.currentVia;

                      return (
                        <Box key={`c-${u.id}-${v.id}`} sx={{ 
                          bgcolor: isTarget ? "rgba(16,185,129,0.15)" : isVia ? "rgba(99,102,241,0.05)" : (t) => t.palette.background.paper, 
                          p: 1, textAlign: "center", fontSize: "0.75rem", fontFamily: "var(--font-mono)",
                          color: isTarget ? "success.main" : isInf ? "text.disabled" : "text.primary",
                          fontWeight: isTarget ? 800 : 500,
                          transition: "all 0.2s"
                        }}>
                          {isInf ? "∞" : d}
                        </Box>
                      );
                    })}
                  </React.Fragment>
                ))}
              </Box>
            )}
          </Paper>

          {/* Log */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {fw.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Build a graph and press Start</Typography>
                : fw.logEntries.map((entry, idx) => (
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
