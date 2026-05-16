"use client";
import { useState, useRef, useCallback } from "react";
import {
  Box, Typography, ToggleButtonGroup, ToggleButton, Select, MenuItem,
  Slider, Button, Chip, IconButton, Paper, Tooltip, SelectChangeEvent,
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
import { useBFS } from "@/hooks/useBFS";
import { GraphNode, GraphEdge, InteractionMode } from "@/lib/graphUtils";

const BFS_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "q.push(src); visited[src] = true;" },
  { id: "while", title: "while(!q.empty())", description: "Check if queue has nodes to process." },
  { id: "front-pop", title: "temp = q.front(); q.pop();", description: "Dequeue front node into temp." },
  { id: "cout", title: "cout << temp", description: "Output / process the current node." },
  { id: "for-loop", title: "for(auto &nbr : adj[temp])", description: "Iterate over neighbors of temp." },
  { id: "enqueue", title: "if(!visited[nbr])", description: "visited[nbr] = true; q.push(nbr);" },
  { id: "repeat", title: "Loop back", description: "Go back to while(!q.empty()) check." },
];

export default function BFSPage() {
  const graph = useGraph();
  const bfs = useBFS(graph.nodes, graph.edges);
  const [sourceId, setSourceId] = useState<string>("");
  const [nodeRadius, setNodeRadius] = useState(22);
  const [edgeWidth, setEdgeWidth] = useState(2);
  const canvasRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 });

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (bfs.bfsRunning) return;
    graph.addNode(x, y);
  }, [bfs.bfsRunning, graph]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (bfs.bfsRunning) return;
    if (graph.mode === "edge") {
      if (graph.edgeStart === null) { graph.setEdgeStart(node.id); }
      else { if (graph.edgeStart !== node.id) graph.addEdge(graph.edgeStart, node.id); graph.setEdgeStart(null); }
    } else if (graph.mode === "delete") { graph.deleteNode(node.id); }
  }, [bfs.bfsRunning, graph]);

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    if (bfs.bfsRunning) return;
    if (graph.mode === "delete") graph.deleteEdge(edge);
  }, [bfs.bfsRunning, graph]);

  const handleNodeDrag = useCallback((id: number, x: number, y: number) => {
    graph.moveNode(id, x, y);
  }, [graph]);

  const handlePreset = (type: "tree" | "grid" | "random") => {
    if (bfs.bfsRunning) return;
    bfs.resetBFS();
    graph.clearGraph();
    setTimeout(() => graph.loadPreset(type, canvasRef.current.w || 800, canvasRef.current.h || 600), 10);
    setSourceId("0");
  };

  const handleStart = () => { const id = parseInt(sourceId); if (!isNaN(id)) bfs.startBFS(id); };
  const handleStep = () => { const id = parseInt(sourceId); if (!isNaN(id)) bfs.stepBFS(id); };
  const handleReset = () => { bfs.resetBFS(); };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "while-check": "#ea580c", "front-pop": "#d97706", cout: "#10b981",
    "for-loop": "#7c3aed", enqueue: "#3b82f6", skip: "#94a3b8", "loop-back": "#ea580c",
    "while-end": "#ea580c", done: "#0891b2",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="BFS Visualizer" badge="Breadth-First Search" />
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
              <ToggleButtonGroup value={graph.labelType} exclusive onChange={(_, v) => { if (v && v !== graph.labelType && !bfs.bfsRunning) graph.toggleLabelType(); }}
                size="small" sx={{ height: 24, "& .MuiToggleButton-root": { fontSize: "0.6rem", fontWeight: 700, px: 1, py: 0, textTransform: "none" } }}>
                <ToggleButton value="letter">A-Z</ToggleButton>
                <ToggleButton value="number">0-9</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ToggleButtonGroup value={graph.mode} exclusive onChange={(_, v: InteractionMode | null) => { if (v && !bfs.bfsRunning) graph.setMode(v); }}
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
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run BFS
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.05em" }}>Source Node</Typography>
            <Select size="small" fullWidth value={sourceId} onChange={(e: SelectChangeEvent) => setSourceId(e.target.value)}
              sx={{ mb: 1.5, mt: 0.5, fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
              <MenuItem value="">— select —</MenuItem>
              {graph.nodes.map(n => <MenuItem key={n.id} value={String(n.id)}>{n.label}</MenuItem>)}
            </Select>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => bfs.setSpeed(v as number)} size="small" sx={{ mb: 1, color: "primary.main" }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Node Size <Chip label={nodeRadius} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={14} max={40} value={nodeRadius} onChange={(_, v) => setNodeRadius(v as number)} size="small" sx={{ mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Edge Width <Chip label={edgeWidth} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={1} max={6} step={0.5} value={edgeWidth} onChange={(_, v) => setEdgeWidth(v as number)} size="small" sx={{ mb: 1.5 }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart} disabled={!sourceId || (bfs.bfsRunning && !bfs.bfsPaused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={handleStep} disabled={!sourceId}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={bfs.bfsPaused ? <PlayArrow /> : <Pause />} onClick={bfs.togglePause} disabled={!bfs.bfsRunning}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{bfs.bfsPaused ? "Resume" : "Pause"}</Button>
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
            <AlgoSteps steps={BFS_STEPS} activeIdx={bfs.activeStepIdx} isDone={bfs.logEntries.some(l => l.type === "done")} />
          </Paper>
        </Box>

        {/* Canvas */}
        <GraphCanvas nodes={graph.nodes} edges={graph.edges} mode={graph.mode} nodeRadius={nodeRadius} edgeBaseWidth={edgeWidth}
          edgeStart={graph.edgeStart} currentNodeId={bfs.currentNodeId} highlightEdge={bfs.highlightEdge} neighborChecking={bfs.neighborChecking}
          visitedSet={bfs.bfsVisited} queueIds={bfs.bfsQueue} onCanvasClick={handleCanvasClick} onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick} onNodeDrag={handleNodeDrag} />

        {/* Right Sidebar */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* Queue */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
              Queue <Chip label={bfs.bfsQueue.length} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1, minHeight: 32 }}>
              {bfs.bfsQueue.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>q is empty</Typography>
                : bfs.bfsQueue.map((id, i) => (
                  <Box key={`q-${id}-${i}`} className="animate-pop-in" sx={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 1, fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700,
                    bgcolor: i === 0 ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)", border: "1.5px solid", borderColor: "primary.main", color: "primary.main",
                    ...(i === 0 && { animation: "pulseFront 1.2s ease-in-out infinite" }) }}>
                    {graph.nodes.find(n => n.id === id)?.label}
                  </Box>
                ))}
            </Box>
          </Paper>

          {/* Temp */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>temp</Typography>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Box sx={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1.5,
                fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 800, position: "relative",
                ...(bfs.bfsTemp !== null ? { bgcolor: "rgba(217,119,6,0.1)", border: "2px solid", borderColor: "warning.main", color: "warning.main",
                  boxShadow: "0 0 20px rgba(217,119,6,0.15)", animation: "tempPop 0.4s cubic-bezier(0.34,1.56,0.64,1), tempGlow 1.5s ease-in-out infinite 0.4s" }
                  : { bgcolor: "action.hover", border: "2px dashed", borderColor: "divider", color: "text.disabled" }) }}>
                {bfs.bfsTemp !== null ? graph.nodes.find(n => n.id === bfs.bfsTemp)?.label : "?"}
              </Box>
            </Box>
          </Paper>

          {/* Visited */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
              visited <Chip label={bfs.bfsVisited.size} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
              {graph.nodes.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Add nodes to see the map</Typography>
                : graph.nodes.map(n => {
                  const v = bfs.bfsVisited.has(n.id);
                  return (
                    <Box key={n.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1.25, py: 0.5, borderRadius: 1,
                      bgcolor: v ? "rgba(16,185,129,0.06)" : "action.hover", border: "1px solid", borderColor: v ? "rgba(16,185,129,0.2)" : "divider" }}>
                      <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: v ? "success.main" : "text.secondary" }}>{n.label}</Typography>
                      <Chip label={v ? "True" : "False"} size="small" sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20,
                        bgcolor: v ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", color: v ? "success.main" : "error.main",
                        border: "1px solid", borderColor: v ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.15)" }} />
                    </Box>
                  );
                })}
            </Box>
          </Paper>

          {/* Traversal */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Traversal Order</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1, minHeight: 32 }}>
              {bfs.bfsTraversal.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled" }}>—</Typography>
                : bfs.bfsTraversal.map((id, i) => (
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
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ maxHeight: 200, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {bfs.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Build a graph and press Start</Typography>
                : bfs.logEntries.map((entry, i) => (
                  <Box key={i} className="animate-fade-slide-in" sx={{ py: 0.25, borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
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
