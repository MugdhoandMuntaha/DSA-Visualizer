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
import { useDFS } from "@/hooks/useDFS";
import { GraphNode, GraphEdge, InteractionMode } from "@/lib/graphUtils";

const DFS_STEPS: StepDef[] = [
  { id: "init", title: "Initialize", description: "visited map and call DFSHelper(src, visited)" },
  { id: "visit", title: "visited[src] = true", description: "Mark node as visited and print." },
  { id: "for-loop", title: "for(auto &nbr : adj[src])", description: "Iterate over neighbors of the node." },
  { id: "check-neighbor", title: "if(!visited[node])", description: "Check if neighbor is unvisited." },
  { id: "recurse", title: "DFSHelper(node, visited)", description: "Recursive call for unvisited neighbor." },
  { id: "end-func", title: "Return", description: "End of DFSHelper loop, returning to parent call." },
];

export default function DFSPage() {
  const graph = useGraph();
  const dfs = useDFS(graph.nodes, graph.edges);
  const [sourceId, setSourceId] = useState<string>("");
  const [nodeRadius, setNodeRadius] = useState(22);
  const [edgeWidth, setEdgeWidth] = useState(2);
  const canvasRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 });

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (dfs.running) return;
    graph.addNode(x, y);
  }, [dfs.running, graph]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (dfs.running) return;
    if (graph.mode === "edge") {
      if (graph.edgeStart === null) { graph.setEdgeStart(node.id); }
      else { if (graph.edgeStart !== node.id) graph.addEdge(graph.edgeStart, node.id); graph.setEdgeStart(null); }
    } else if (graph.mode === "delete") { graph.deleteNode(node.id); }
  }, [dfs.running, graph]);

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    if (dfs.running) return;
    if (graph.mode === "delete") graph.deleteEdge(edge);
  }, [dfs.running, graph]);

  const handleNodeDrag = useCallback((id: number, x: number, y: number) => {
    graph.moveNode(id, x, y);
  }, [graph]);

  const handlePreset = (type: "tree" | "grid" | "random") => {
    if (dfs.running) return;
    dfs.resetDFS();
    graph.clearGraph();
    setTimeout(() => graph.loadPreset(type, canvasRef.current.w || 800, canvasRef.current.h || 600), 10);
    setSourceId("0");
  };

  const handleStart = () => { const id = parseInt(sourceId); if (!isNaN(id)) dfs.startDFS(id); };
  const handleStep = () => { const id = parseInt(sourceId); if (!isNaN(id)) dfs.stepDFS(id); };
  const handleReset = () => { dfs.resetDFS(); };

  const tagColor: Record<string, string> = {
    init: "#7c3aed", visit: "#10b981", "for-loop": "#7c3aed", "check-neighbor": "#ea580c",
    recurse: "#3b82f6", skip: "#94a3b8", return: "#ea580c", "end-func": "#ea580c", done: "#0891b2",
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="DFS Visualizer" badge="Depth-First Search" />
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
              <ToggleButtonGroup value={graph.labelType} exclusive onChange={(_, v) => { if (v && v !== graph.labelType && !dfs.running) graph.toggleLabelType(); }}
                size="small" sx={{ height: 24, "& .MuiToggleButton-root": { fontSize: "0.6rem", fontWeight: 700, px: 1, py: 0, textTransform: "none" } }}>
                <ToggleButton value="letter">A-Z</ToggleButton>
                <ToggleButton value="number">0-9</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ToggleButtonGroup value={graph.mode} exclusive onChange={(_, v: InteractionMode | null) => { if (v && !dfs.running) graph.setMode(v); }}
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
              <PlayArrow sx={{ fontSize: 18, color: "primary.main" }} /> Run DFS
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.05em" }}>Source Node</Typography>
            <Select size="small" fullWidth value={sourceId} onChange={(e: SelectChangeEvent) => setSourceId(e.target.value)}
              sx={{ mb: 1.5, mt: 0.5, fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
              <MenuItem value="">— select —</MenuItem>
              {graph.nodes.map(n => <MenuItem key={n.id} value={String(n.id)}>{n.label}</MenuItem>)}
            </Select>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Speed</Typography>
            <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => dfs.setSpeed(v as number)} size="small" sx={{ mb: 1, color: "primary.main" }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Node Size <Chip label={nodeRadius} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={14} max={40} value={nodeRadius} onChange={(_, v) => setNodeRadius(v as number)} size="small" sx={{ mb: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Edge Width <Chip label={edgeWidth} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
            <Slider min={1} max={6} step={0.5} value={edgeWidth} onChange={(_, v) => setEdgeWidth(v as number)} size="small" sx={{ mb: 1.5 }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
              <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={handleStart} disabled={!sourceId || (dfs.running && !dfs.paused)}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
              <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={handleStep} disabled={!sourceId}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
              <Button variant="outlined" size="small" startIcon={dfs.paused ? <PlayArrow /> : <Pause />} onClick={dfs.togglePause} disabled={!dfs.running}
                sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{dfs.paused ? "Resume" : "Pause"}</Button>
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
            <AlgoSteps steps={DFS_STEPS} activeIdx={dfs.activeStepIdx} isDone={dfs.logEntries.some(l => l.type === "done")} />
          </Paper>
        </Box>

        {/* Canvas */}
        <GraphCanvas nodes={graph.nodes} edges={graph.edges} mode={graph.mode} nodeRadius={nodeRadius} edgeBaseWidth={edgeWidth}
          edgeStart={graph.edgeStart} currentNodeId={dfs.currentNodeId} highlightEdge={dfs.highlightEdge} neighborChecking={dfs.neighborChecking}
          visitedSet={dfs.visited} queueIds={dfs.stack} onCanvasClick={handleCanvasClick} onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick} onNodeDrag={handleNodeDrag} />

        {/* Right Sidebar */}
        <Box sx={{ width: 300, minWidth: 300, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

          {/* Call Stack */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
              Call Stack <Chip label={dfs.stack.length} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1, minHeight: 32, flexDirection: "column-reverse" }}>
              {dfs.stack.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Stack is empty</Typography>
                : dfs.stack.map((id, i) => (
                  <Box key={`s-${id}-${i}`} className="animate-pop-in" sx={{ width: "100%", height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 1, fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700,
                    bgcolor: i === dfs.stack.length - 1 ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)", border: "1.5px solid", borderColor: "primary.main", color: "primary.main",
                    ...(i === dfs.stack.length - 1 && { animation: "pulseFront 1.2s ease-in-out infinite" }) }}>
                    DFSHelper({graph.nodes.find(n => n.id === id)?.label})
                  </Box>
                ))}
            </Box>
          </Paper>

          {/* Visited */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
              visited <Chip label={dfs.visited.size} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
              {graph.nodes.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Add nodes to see the map</Typography>
                : graph.nodes.map(n => {
                  const v = dfs.visited.has(n.id);
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
              {dfs.traversal.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled" }}>—</Typography>
                : dfs.traversal.map((id, i) => (
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
              {dfs.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Build a graph and press Start</Typography>
                : dfs.logEntries.map((entry, i) => (
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
    </Box>
  );
}
