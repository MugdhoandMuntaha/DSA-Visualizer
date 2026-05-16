"use client";
import { useState, useRef, useCallback } from "react";
import {
  Box, Typography, ToggleButtonGroup, ToggleButton, Select, MenuItem,
  Slider, Button, Chip, IconButton, Paper, Tooltip, SelectChangeEvent,
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
import { useBellmanFord } from "@/hooks/useBellmanFord";
import { GraphNode, GraphEdge, InteractionMode } from "@/lib/graphUtils";

const BELLMAN_FORD_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "dist[src] = 0, others INT_MAX." },
  { id: "outer-loop", title: "for(i = 1 to V-1)", description: "Relax edges V-1 times." },
  { id: "node-loop", title: "for(auto &node : adj)", description: "Iterate all vertices." },
  { id: "check-relax", title: "if(dist[u] + wt < dist[v])", description: "Check if path to v via u is shorter." },
  { id: "relax", title: "dist[v] = dist[u] + wt", description: "Update shortest distance to v." },
  { id: "neg-cycle-check", title: "Cycle Check", description: "Verify if edges can still be relaxed." },
  { id: "neg-cycle-found", title: "Cycle Found!", description: "A negative weight cycle exists." },
];

export default function BellmanFordPage() {
  const graph = useGraph();
  const bf = useBellmanFord(graph.nodes, graph.edges);
  const [sourceId, setSourceId] = useState<string>("");
  const [nodeRadius, setNodeRadius] = useState(22);
  const [edgeWidth, setEdgeWidth] = useState(2);
  const [weightDialog, setWeightDialog] = useState<{ from: number; to: number } | null>(null);
  const [weightInput, setWeightInput] = useState("1");
  const canvasRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 });

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (bf.running) return;
    graph.addNode(x, y);
  }, [bf.running, graph]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (bf.running) return;
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
  }, [bf.running, graph]);

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    if (bf.running) return;
    if (graph.mode === "delete") graph.deleteEdge(edge);
    else if (graph.mode === "edge") {
      setWeightDialog({ from: edge.from, to: edge.to });
      setWeightInput(String(edge.weight ?? 1));
    }
  }, [bf.running, graph]);

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
    if (bf.running) return;
    bf.resetBellmanFord();
    graph.clearGraph();
    setTimeout(() => graph.loadPreset(type, canvasRef.current.w || 800, canvasRef.current.h || 600), 10);
    setSourceId("0");
  };

  const handleStart = () => { const id = parseInt(sourceId); if (!isNaN(id)) bf.startBellmanFord(id); };
  const handleStep = () => { const id = parseInt(sourceId); if (!isNaN(id)) bf.stepBellmanFord(id); };
  const handleReset = () => { bf.resetBellmanFord(); };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "outer-loop": "#ea580c", "node-loop": "#d97706", "check-relax": "#10b981",
    relax: "#3b82f6", "neg-cycle-check": "#7c3aed", "neg-cycle-found": "#ef4444", done: "#0891b2",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Bellman-Ford Visualizer" badge="Shortest Paths" />
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
              <ToggleButtonGroup value={graph.labelType} exclusive onChange={(_, v) => { if (v && v !== graph.labelType && !bf.running) graph.toggleLabelType(); }}
                size="small" sx={{ height: 24, "& .MuiToggleButton-root": { fontSize: "0.6rem", fontWeight: 700, px: 1, py: 0, textTransform: "none" } }}>
                <ToggleButton value="letter">A-Z</ToggleButton>
                <ToggleButton value="number">0-9</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ToggleButtonGroup value={graph.mode} exclusive onChange={(_, v: InteractionMode | null) => { if (v && !bf.running) graph.setMode(v); }}
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
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => bf.setSpeed(v as number)} size="small" sx={{ mb: 1, color: "primary.main" }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Node Size <Chip label={nodeRadius} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={14} max={40} value={nodeRadius} onChange={(_, v) => setNodeRadius(v as number)} size="small" sx={{ mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Edge Width <Chip label={edgeWidth} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={1} max={6} step={0.5} value={edgeWidth} onChange={(_, v) => setEdgeWidth(v as number)} size="small" sx={{ mb: 1.5 }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart} disabled={!sourceId || (bf.running && !bf.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={handleStep} disabled={!sourceId}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={bf.paused ? <PlayArrow /> : <Pause />} onClick={bf.togglePause} disabled={!bf.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{bf.paused ? "Resume" : "Pause"}</Button>
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
            <AlgoSteps steps={BELLMAN_FORD_STEPS} activeIdx={bf.activeStepIdx} isDone={bf.logEntries.some(l => l.type === "done")} />
          </Paper>
        </Box>

        {/* Canvas */}
        <GraphCanvas nodes={graph.nodes} edges={graph.edges} mode={graph.mode} nodeRadius={nodeRadius} edgeBaseWidth={edgeWidth}
          edgeStart={graph.edgeStart} currentNodeId={bf.currentNodeU} highlightEdge={bf.highlightEdge} neighborChecking={bf.currentNodeV}
          showWeights={true} visitedSet={new Set()} queueIds={[]} onCanvasClick={handleCanvasClick} onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick} onNodeDrag={handleNodeDrag} />

        {/* Right Sidebar */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* Iteration Status */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
              Iteration Progress <Chip label={graph.nodes.length > 0 ? `${bf.iteration} / ${graph.nodes.length - 1}` : "0 / 0"} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
            </Typography>
            <Box sx={{ mt: 2, p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "text.secondary", fontWeight: 600 }}>Relaxations</Typography>
              <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "primary.main" }}>
                i = {bf.iteration}
              </Typography>
            </Box>
            
            {/* Cycle Status */}
            <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: bf.hasNegativeCycle ? "rgba(239,68,68,0.1)" : "action.hover", border: "1px solid", borderColor: bf.hasNegativeCycle ? "error.main" : "divider" }}>
              <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "text.secondary", fontWeight: 600 }}>Negative Cycle</Typography>
              <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: bf.hasNegativeCycle ? "error.main" : "success.main" }}>
                {bf.hasNegativeCycle ? "DETECTED!" : "None"}
              </Typography>
            </Box>
          </Paper>

          {/* Distances */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
              distances <Chip label={bf.distances.size} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
              {graph.nodes.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Add nodes to see distances</Typography>
                : graph.nodes.map(n => {
                  const d = bf.distances.get(n.id) ?? Infinity;
                  const isInf = d === Infinity;
                  return (
                    <Box key={n.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1.25, py: 0.5, borderRadius: 1,
                      bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                      <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>{n.label}</Typography>
                      <Chip label={isInf ? "∞" : d} size="small" sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20, fontFamily: "var(--font-mono)",
                        bgcolor: isInf ? "rgba(148,163,184,0.1)" : "rgba(59,130,246,0.1)", color: isInf ? "text.disabled" : "primary.main",
                        border: "1px solid", borderColor: isInf ? "rgba(148,163,184,0.2)" : "rgba(59,130,246,0.3)" }} />
                    </Box>
                  );
                })}
            </Box>
          </Paper>

          {/* Log */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {bf.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Build a graph and press Start</Typography>
                : bf.logEntries.map((entry, i) => (
                  <Box key={i} className="animate-fade-slide-in" sx={{ py: 0.25, borderBottom: "1px solid rgba(99,102,241,0.06)", whiteSpace: "pre-wrap" }}>
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
