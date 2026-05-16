"use client";
import { useState, useCallback } from "react";
import { Box, Typography, ToggleButtonGroup, ToggleButton, Select, MenuItem, Slider, Button, Chip, IconButton, Paper, Tooltip, SelectChangeEvent, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
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
import { useDijkstra } from "@/hooks/useDijkstra";
import { GraphNode, GraphEdge, InteractionMode } from "@/lib/graphUtils";

const DIJKSTRA_STEPS: StepDef[] = [
  { id: "init", title: "dist[src] = 0; pq.push({0,src});", description: "Initialize distances and push source." },
  { id: "while", title: "while(!pq.empty())", description: "Process until the priority queue is empty." },
  { id: "extract", title: "auto top = pq.top(); pq.pop();", description: "Get node with smallest distance." },
  { id: "for-loop", title: "for(auto &nbr: adj[currNode])", description: "Iterate over weighted neighbors." },
  { id: "relax", title: "if(currDist + weight < dist[neighbor])", description: "Check if a shorter path is found." },
  { id: "update", title: "dist[neighbor] = ...; pq.push(...);", description: "Update distance and push to PQ." },
];

export default function DijkstraPage() {
  const graph = useGraph();
  const dijkstra = useDijkstra(graph.nodes, graph.edges);
  const [sourceId, setSourceId] = useState("");
  const [nodeRadius, setNodeRadius] = useState(22);
  const [edgeWidth, setEdgeWidth] = useState(2);
  const [weightDialog, setWeightDialog] = useState<{ from: number; to: number } | null>(null);
  const [weightInput, setWeightInput] = useState("1");

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (dijkstra.running) return;
    graph.addNode(x, y);
  }, [dijkstra.running, graph]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (dijkstra.running) return;
    if (graph.mode === "edge") {
      if (graph.edgeStart === null) graph.setEdgeStart(node.id);
      else {
        if (graph.edgeStart !== node.id) {
          setWeightDialog({ from: graph.edgeStart, to: node.id });
          setWeightInput("1");
        }
        graph.setEdgeStart(null);
      }
    } else if (graph.mode === "delete") graph.deleteNode(node.id);
  }, [dijkstra.running, graph]);

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    if (dijkstra.running) return;
    if (graph.mode === "delete") graph.deleteEdge(edge);
    else if (graph.mode === "edge") {
      setWeightDialog({ from: edge.from, to: edge.to });
      setWeightInput(String(edge.weight ?? 1));
    }
  }, [dijkstra.running, graph]);

  const confirmWeight = () => {
    if (weightDialog) {
      const w = parseInt(weightInput) || 1;
      graph.addEdge(weightDialog.from, weightDialog.to, Math.max(1, w));
    }
    setWeightDialog(null);
  };

  const handlePreset = (type: "tree" | "grid" | "random") => {
    if (dijkstra.running) return;
    dijkstra.resetDijkstra();
    graph.clearGraph();
    setTimeout(() => graph.loadPreset(type, 800, 600, true), 10);
    setSourceId("0");
  };

  const handleStart = () => { const id = parseInt(sourceId); if (!isNaN(id)) dijkstra.startDijkstra(id); };
  const handleStep = () => { const id = parseInt(sourceId); if (!isNaN(id)) dijkstra.stepDijkstra(id); };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "while-check": "#ea580c", "extract-min": "#d97706", "for-loop": "#7c3aed",
    relax: "#10b981", "no-relax": "#94a3b8", "skip-neighbor": "#94a3b8", skip: "#94a3b8",
    "loop-back": "#ea580c", done: "#0891b2",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Dijkstra's Visualizer" badge="Shortest Path" />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Sidebar */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderRight: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
                <AddCircleOutlined sx={{ fontSize: 18, color: "primary.main" }} /> Build Graph
              </Typography>
              <ToggleButtonGroup value={graph.labelType} exclusive onChange={(_, v) => { if (v && v !== graph.labelType && !dijkstra.running) graph.toggleLabelType(); }}
                size="small" sx={{ height: 24, "& .MuiToggleButton-root": { fontSize: "0.6rem", fontWeight: 700, px: 1, py: 0, textTransform: "none" } }}>
                <ToggleButton value="letter">A-Z</ToggleButton>
                <ToggleButton value="number">0-9</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ToggleButtonGroup value={graph.mode} exclusive onChange={(_, v: InteractionMode | null) => { if (v && !dijkstra.running) graph.setMode(v); }}
              size="small" fullWidth sx={{ flexWrap: "wrap", gap: 0.5, "& .MuiToggleButton-root": { flex: "1 1 calc(50% - 4px)", fontSize: "0.72rem", fontWeight: 600, textTransform: "none", borderRadius: "8px !important", border: "1px solid rgba(99,102,241,0.15) !important" } }}>
              <ToggleButton value="node"><AddCircleOutlined sx={{ fontSize: 14, mr: 0.5 }} />Node</ToggleButton>
              <ToggleButton value="edge"><Timeline sx={{ fontSize: 14, mr: 0.5 }} />Edge</ToggleButton>
              <ToggleButton value="move"><OpenWith sx={{ fontSize: 14, mr: 0.5 }} />Move</ToggleButton>
              <ToggleButton value="delete"><DeleteOutlined sx={{ fontSize: 14, mr: 0.5 }} />Delete</ToggleButton>
            </ToggleButtonGroup>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run Dijkstra
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Source Node</Typography>
            <Select size="small" fullWidth value={sourceId} onChange={(e: SelectChangeEvent) => setSourceId(e.target.value)} sx={{ mb: 1.5, mt: 0.5, fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
              <MenuItem value="">— select —</MenuItem>
              {graph.nodes.map(n => <MenuItem key={n.id} value={String(n.id)}>{n.label}</MenuItem>)}
            </Select>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => dijkstra.setSpeed(v as number)} size="small" sx={{ mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Node Size</Typography>
            <Slider min={14} max={40} value={nodeRadius} onChange={(_, v) => setNodeRadius(v as number)} size="small" sx={{ mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Edge Width</Typography>
            <Slider min={1} max={6} step={0.5} value={edgeWidth} onChange={(_, v) => setEdgeWidth(v as number)} size="small" sx={{ mb: 1.5 }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart} disabled={!sourceId || (dijkstra.running && !dijkstra.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={handleStep} disabled={!sourceId} sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={dijkstra.paused ? <PlayArrow /> : <Pause />} onClick={dijkstra.togglePause} disabled={!dijkstra.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{dijkstra.paused ? "Resume" : "Pause"}</Button>
              <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={dijkstra.resetDijkstra} sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
              <Tooltip title="Tree"><IconButton size="small" onClick={() => handlePreset("tree")}><AccountTree sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Grid"><IconButton size="small" onClick={() => handlePreset("grid")}><GridOn sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, display: "block" }}>Algorithm Steps</Typography>
            <AlgoSteps steps={DIJKSTRA_STEPS} activeIdx={dijkstra.activeStepIdx} isDone={dijkstra.logEntries.some(l => l.type === "done")} />
          </Paper>
        </Box>

        {/* Canvas */}
        <GraphCanvas nodes={graph.nodes} edges={graph.edges} mode={graph.mode} nodeRadius={nodeRadius} edgeBaseWidth={edgeWidth}
          edgeStart={graph.edgeStart} showWeights currentNodeId={dijkstra.currentNodeId} highlightEdge={dijkstra.highlightEdge}
          neighborChecking={dijkstra.neighborChecking} visitedSet={dijkstra.visited} queueIds={dijkstra.pq.map(p => p.id)}
          onCanvasClick={handleCanvasClick} onNodeClick={handleNodeClick} onEdgeClick={handleEdgeClick} onNodeDrag={(id, x, y) => graph.moveNode(id, x, y)} />

        {/* Right Sidebar */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* Priority Queue */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>
              Priority Queue <Chip label={dijkstra.pq.length} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1, minHeight: 32 }}>
              {dijkstra.pq.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>PQ is empty</Typography>
                : dijkstra.pq.map((item, i) => (
                  <Box key={`pq-${item.id}-${i}`} className="animate-pop-in" sx={{ px: 1, py: 0.5, display: "flex", flexDirection: "column", alignItems: "center",
                    borderRadius: 1, fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700,
                    bgcolor: i === 0 ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)", border: "1.5px solid", borderColor: "primary.main", color: "primary.main" }}>
                    <span>{graph.nodes.find(n => n.id === item.id)?.label}</span>
                    <Typography sx={{ fontSize: "0.55rem", color: "text.disabled" }}>d={item.dist === Infinity ? "∞" : item.dist}</Typography>
                  </Box>
                ))}
            </Box>
          </Paper>

          {/* Top (Extracted Min) */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>top</Typography>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Box sx={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1.5,
                fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 800, position: "relative",
                ...(dijkstra.temp !== null ? { bgcolor: "rgba(217,119,6,0.1)", border: "2px solid", borderColor: "warning.main", color: "warning.main",
                  boxShadow: "0 0 20px rgba(217,119,6,0.15)", animation: "tempPop 0.4s cubic-bezier(0.34,1.56,0.64,1), tempGlow 1.5s ease-in-out infinite 0.4s" }
                  : { bgcolor: "action.hover", border: "2px dashed", borderColor: "divider", color: "text.disabled" }) }}>
                {dijkstra.temp !== null ? graph.nodes.find(n => n.id === dijkstra.temp)?.label : "?"}
              </Box>
            </Box>
          </Paper>

          {/* Distance Table */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>
              Distances <Chip label={dijkstra.visited.size} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
              {graph.nodes.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Add nodes</Typography>
                : graph.nodes.map(n => {
                  const d = dijkstra.distances.get(n.id);
                  const v = dijkstra.visited.has(n.id);
                  return (
                    <Box key={n.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1.25, py: 0.5, borderRadius: 1,
                      bgcolor: v ? "rgba(16,185,129,0.06)" : "action.hover", border: "1px solid", borderColor: v ? "rgba(16,185,129,0.2)" : "divider" }}>
                      <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: v ? "success.main" : "text.secondary" }}>{n.label}</Typography>
                      <Chip label={d === undefined || d === Infinity ? "∞" : d} size="small" sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20, fontFamily: "var(--font-mono)",
                        bgcolor: v ? "rgba(16,185,129,0.1)" : "action.hover", color: v ? "success.main" : "text.secondary" }} />
                    </Box>
                  );
                })}
            </Box>
          </Paper>

          {/* Traversal */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Finalized Order</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1, minHeight: 32 }}>
              {dijkstra.traversal.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled" }}>—</Typography>
                : dijkstra.traversal.map((id, i) => (
                  <Box key={`t-${i}`} className="animate-pop-in" sx={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 1, fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, position: "relative",
                    bgcolor: "rgba(124,58,237,0.08)", border: "1.5px solid", borderColor: "secondary.main", color: "secondary.main" }}>
                    {graph.nodes.find(n => n.id === id)?.label}
                    <Box sx={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", bgcolor: "secondary.main",
                      color: "#fff", fontSize: "0.55rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</Box>
                  </Box>
                ))}
            </Box>
          </Paper>

          {/* Log */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {dijkstra.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Build a weighted graph and press Start</Typography>
                : dijkstra.logEntries.map((entry, i) => (
                  <Box key={i} className="animate-fade-slide-in" sx={{ py: 0.25, borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
                    <Box component="span" sx={{ display: "inline-block", px: 0.75, py: 0.1, borderRadius: 0.5, fontSize: "0.6rem", fontWeight: 700,
                      textTransform: "uppercase", mr: 0.5, bgcolor: `${tagColor[entry.type] || "#6366f1"}20`, color: tagColor[entry.type] || "#6366f1" }}>
                      {entry.type}
                    </Box>{entry.msg}
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
          <TextField autoFocus fullWidth type="number" label="Weight" value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
            slotProps={{ htmlInput: { min: 1 } }} sx={{ mt: 1 }} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWeightDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={confirmWeight}>Add Edge</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
