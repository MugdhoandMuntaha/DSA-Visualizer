"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Box, Typography, ToggleButtonGroup, ToggleButton,
  Slider, Button, Chip, IconButton, Paper, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, SelectChangeEvent
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
import Menu from "@mui/icons-material/Menu";

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
  const fw = useFloydWarshall(graph.nodes, graph.edges, graph.directed);
  const [nodeRadius, setNodeRadius] = useState(28);
  const [edgeWidth, setEdgeWidth] = useState(3.5);
  const [weightDialog, setWeightDialog] = useState<{ from: number; to: number } | null>(null);
  const [weightInput, setWeightInput] = useState("1");
  const [visualMode, setVisualMode] = useState<"modern" | "notebook">("notebook");
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  
  const [bottomHeight, setBottomHeight] = useState(260);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const parent = document.getElementById("notebook-right-pane");
      if (parent) {
        const rect = parent.getBoundingClientRect();
        const newHeight = rect.bottom - e.clientY;
        setBottomHeight(Math.max(120, Math.min(rect.height - 250, newHeight)));
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Automatically load the notebook preset on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      graph.loadPreset("notebook", 750, 250);
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard controls for Arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.getAttribute("contenteditable") !== null) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        fw.stepFloydWarshall();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        fw.prevStepFloydWarshall();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fw]);

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

  const handlePreset = (type: "tree" | "grid" | "random" | "notebook") => {
    if (fw.running) return;
    fw.resetFloydWarshall();
    graph.clearGraph();
    const h = type === "notebook" ? 250 : 600;
    setTimeout(() => graph.loadPreset(type, 750, h, true), 50);
  };

  const tagColor: Record<string, string> = {
    init: "#854d0e", "loop-via": "#b45309", check: "#4d7c0f", relax: "#1d4ed8", done: "#0f766e",
  };

  const sortedNodes = [...graph.nodes].sort((a, b) => a.label.localeCompare(b.label));

  const lbl = useCallback(
    (id: number) => graph.nodes.find((n) => n.id === id)?.label || String(id),
    [graph.nodes]
  );

  // For Column 2: Scratchpad details
  const dij = fw.currentI !== null && fw.currentJ !== null ? (fw.distances[fw.currentI]?.[fw.currentJ] ?? Infinity) : Infinity;
  const divia = fw.currentI !== null && fw.currentVia !== null ? (fw.distances[fw.currentI]?.[fw.currentVia] ?? Infinity) : Infinity;
  const dviaj = fw.currentVia !== null && fw.currentJ !== null ? (fw.distances[fw.currentVia]?.[fw.currentJ] ?? Infinity) : Infinity;
  const sum = divia + dviaj;
  const isRelaxed = sum < dij && divia !== Infinity && dviaj !== Infinity;

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Floyd-Warshall Visualizer" badge="All-Pairs Shortest Path" />
      
      {visualMode === "notebook" ? (
        // ================= RULED NOTEBOOK PAPER UI LAYOUT =================
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden", bgcolor: "#cbd5e1" }}>
          
          {/* LEFT AREA: Yellow Sticky Paper Sidebar */}
          <Box sx={{
            width: showLeftPanel ? 275 : 0,
            transition: "width 0.3s ease",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 4,
            boxShadow: showLeftPanel ? "5px 0 15px rgba(0,0,0,0.15)" : "none"
          }}>
            <Box sx={{
              width: 275,
              flex: 1,
              bgcolor: "#fef9c3", // Yellow sticky note paper color
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              position: "relative",
              borderRight: "1px solid #eab308"
            }}>
              {/* Sticky Tape strip on top */}
              <Box sx={{
                position: "absolute",
                top: 4,
                left: "25%",
                width: "50%",
                height: 14,
                bgcolor: "rgba(234, 179, 8, 0.35)", // semi-transparent yellow tape
                transform: "rotate(-1deg)",
                zIndex: 5
              }} />

              <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: "#854d0e", mb: -0.5, borderBottom: "2px dashed #ca8a04", pb: 0.5 }}>
                📋 Trace Controls
              </Typography>

              {/* Build tools in sketch button styles */}
              <Box sx={{ mt: 0.5 }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", mb: 0.5 }}>
                  1. Mode
                </Typography>
                <ToggleButtonGroup
                  value={graph.mode}
                  exclusive
                  onChange={(_, v: InteractionMode | null) => { if (v && !fw.running) graph.setMode(v); }}
                  size="small"
                  fullWidth
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                    "& .MuiToggleButton-root": {
                      flex: "1 1 calc(50% - 4px)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "none",
                      color: "#451a03 !important",
                      border: "1.5px solid #ca8a04 !important",
                      borderRadius: "6px !important",
                      py: 0.4,
                      "&.Mui-selected": {
                        bgcolor: "rgba(202, 138, 4, 0.2) !important",
                        color: "#451a03 !important"
                      }
                    }
                  }}
                >
                  <ToggleButton value="node"><AddCircleOutlined sx={{ fontSize: 12, mr: 0.5 }} />Node</ToggleButton>
                  <ToggleButton value="edge"><Timeline sx={{ fontSize: 12, mr: 0.5 }} />Edge</ToggleButton>
                  <ToggleButton value="move"><OpenWith sx={{ fontSize: 12, mr: 0.5 }} />Move</ToggleButton>
                  <ToggleButton value="delete"><DeleteOutlined sx={{ fontSize: 12, mr: 0.5 }} />Delete</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Graph Type directed/undirected in sketch style */}
              <Box sx={{ mt: 0.5 }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", mb: 0.5 }}>
                  1b. Graph Type
                </Typography>
                <ToggleButtonGroup
                  value={graph.directed ? "directed" : "undirected"}
                  exclusive
                  onChange={(_, v) => { if (v && !fw.running) graph.setDirected(v === "directed"); }}
                  size="small"
                  fullWidth
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    "& .MuiToggleButton-root": {
                      flex: 1,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "none",
                      color: "#451a03 !important",
                      border: "1.5px solid #ca8a04 !important",
                      borderRadius: "6px !important",
                      py: 0.4,
                      "&.Mui-selected": {
                        bgcolor: "rgba(202, 138, 4, 0.2) !important",
                        color: "#451a03 !important"
                      }
                    }
                  }}
                >
                  <ToggleButton value="undirected">Undirected</ToggleButton>
                  <ToggleButton value="directed">Directed</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Controls and sliders */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#854d0e", mb: -0.2 }}>Speed</Typography>
                  <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => fw.setSpeed(v as number)} size="small" sx={{ color: "#ca8a04" }} />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#854d0e", mb: -0.2 }}>Node Radius</Typography>
                    <Slider min={14} max={40} value={nodeRadius} onChange={(_, v) => setNodeRadius(v as number)} size="small" sx={{ color: "#ca8a04" }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#854d0e", mb: -0.2 }}>Edge Width</Typography>
                    <Slider min={1} max={6} step={0.5} value={edgeWidth} onChange={(_, v) => setEdgeWidth(v as number)} size="small" sx={{ color: "#ca8a04" }} />
                  </Box>
                </Box>
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlayArrow />}
                  onClick={fw.startFloydWarshall}
                  disabled={graph.nodes.length === 0 || (fw.running && !fw.paused)}
                  sx={{
                    flex: "1 1 calc(50% - 4px)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "none",
                    border: "1.5px solid #ca8a04",
                    color: "#ca8a04",
                    borderRadius: "5px",
                    py: 0.4,
                    "&:hover": { border: "1.5px solid #ca8a04", bgcolor: "rgba(202, 138, 4, 0.1)" },
                    "&.Mui-disabled": { border: "1.5px solid #eab30840", color: "#eab30840" }
                  }}
                >
                  Start
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SkipNext />}
                  onClick={fw.stepFloydWarshall}
                  disabled={graph.nodes.length === 0}
                  sx={{
                    flex: "1 1 calc(50% - 4px)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "none",
                    border: "1.5px solid #ca8a04",
                    color: "#ca8a04",
                    borderRadius: "5px",
                    py: 0.4,
                    "&:hover": { border: "1.5px solid #ca8a04", bgcolor: "rgba(202, 138, 4, 0.1)" }
                  }}
                >
                  Step
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={fw.paused ? <PlayArrow /> : <Pause />}
                  onClick={fw.togglePause}
                  disabled={!fw.running}
                  sx={{
                    flex: "1 1 calc(50% - 4px)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "none",
                    border: "1.5px solid #ca8a04",
                    color: "#ca8a04",
                    borderRadius: "5px",
                    py: 0.4,
                    "&:hover": { border: "1.5px solid #ca8a04", bgcolor: "rgba(202, 138, 4, 0.1)" }
                  }}
                >
                  {fw.paused ? "Resume" : "Pause"}
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<RestartAlt />}
                  onClick={fw.resetFloydWarshall}
                  sx={{
                    flex: "1 1 calc(50% - 4px)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "none",
                    border: "1.5px solid #ef4444",
                    borderRadius: "5px",
                    py: 0.4,
                    "&:hover": { border: "1.5px solid #ef4444", bgcolor: "rgba(239, 68, 68, 0.1)" }
                  }}
                >
                  Reset
                </Button>
              </Box>

              {/* Presets */}
              <Box sx={{ borderTop: "1.5px dashed #ca8a04", pt: 1 }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", mb: 0.5 }}>
                  Presets:
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  <Button size="small" variant="text" onClick={() => handlePreset("notebook")} sx={{ fontSize: "0.68rem", textTransform: "none", color: "#854d0e", border: "1.5px solid #ca8a04", py: 0.2, px: 0.75, borderRadius: "4px", fontWeight: 700 }}>
                    📓 Notebook Preset
                  </Button>
                  <Button size="small" variant="text" onClick={() => handlePreset("tree")} sx={{ fontSize: "0.68rem", textTransform: "none", color: "#854d0e", border: "1.5px solid #ca8a04", py: 0.2, px: 0.75, borderRadius: "4px", fontWeight: 700 }}>
                    🌳 Tree
                  </Button>
                  <Button size="small" variant="text" onClick={() => handlePreset("grid")} sx={{ fontSize: "0.68rem", textTransform: "none", color: "#854d0e", border: "1.5px solid #ca8a04", py: 0.2, px: 0.75, borderRadius: "4px", fontWeight: 700 }}>
                    🔲 Grid
                  </Button>
                </Box>
              </Box>

              {/* Visual Mode selector */}
              <Box sx={{ borderTop: "1.5px dashed #ca8a04", pt: 1 }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", mb: 0.5 }}>
                  3. Visual Style
                </Typography>
                <ToggleButtonGroup
                  value={visualMode}
                  exclusive
                  onChange={(_, v) => { if (v) setVisualMode(v); }}
                  size="small"
                  fullWidth
                  sx={{
                    height: 28,
                    "& .MuiToggleButton-root": {
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      textTransform: "none",
                      color: "#451a03 !important",
                      border: "1.5px solid #ca8a04 !important",
                      borderRadius: "6px !important",
                      "&.Mui-selected": {
                        bgcolor: "rgba(202, 138, 4, 0.2) !important",
                        color: "#451a03 !important"
                      }
                    }
                  }}
                >
                  <ToggleButton value="notebook">Notebook View</ToggleButton>
                  <ToggleButton value="modern">Modern View</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Algorithm Steps list */}
              <Box sx={{ flex: 1, overflowY: "auto", borderTop: "1.5px dashed #ca8a04", pt: 1.5, display: "flex", flexDirection: "column",
                "&::-webkit-scrollbar": { width: "3px" },
                "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(202, 138, 4, 0.2)", borderRadius: "2px" } }}>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "#854d0e", mb: 0.75 }}>
                  ✏️ Algorithm Steps
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {FLOYD_WARSHALL_STEPS.map((step, idx) => {
                    const isActive = fw.activeStepIdx === idx;
                    return (
                      <Box key={step.id} sx={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.68rem",
                        p: 0.4,
                        borderRadius: "4px",
                        bgcolor: isActive ? "#fef08a" : "transparent",
                        border: isActive ? "1.5px solid #eab308" : "none",
                        color: isActive ? "#854d0e" : "#451a03",
                        lineHeight: 1.25
                      }}>
                        <div style={{ fontWeight: 700 }}>{step.title}</div>
                        <div style={{ opacity: 0.8, fontSize: "0.62rem" }}>{step.description}</div>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* SPIRAL RING SEPARATOR: Vertical notebook rings */}
          <Box sx={{
            width: 18,
            position: "relative",
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            gap: 4.2,
            alignItems: "center",
            py: 4,
            bgcolor: "#cbd5e1",
            borderLeft: "1.5px solid #94a3b8",
            borderRight: "1.5px solid #94a3b8",
            boxShadow: "inset 2px 0 5px rgba(0,0,0,0.1), inset -2px 0 5px rgba(0,0,0,0.1)"
          }}>
            {Array.from({ length: 11 }).map((_, i) => (
              <Box key={i} sx={{
                width: 24,
                height: 10,
                borderRadius: 2,
                background: "linear-gradient(to bottom, #94a3b8, #f8fafc, #475569)",
                border: "1px solid #1e293b",
                boxShadow: "2px 2px 4px rgba(0,0,0,0.2)",
                ml: -0.2
              }} />
            ))}
          </Box>

          {/* RIGHT AREA: Ruled Notebook Paper */}
          <Box id="notebook-right-pane" sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "#fdfbf7",
            boxShadow: "inset 5px 0 15px rgba(0,0,0,0.02)"
          }}>
            
            {/* Lined Notebook Header Title bar */}
            <Box sx={{
              p: 2,
              pl: 10, // alignment offset matching red margin line
              borderBottom: "1.5px solid rgba(15, 23, 42, 0.08)",
              display: "flex",
              flexDirection: "column",
              color: "#1e293b"
            }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #cbd5e1", pb: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <IconButton 
                    onClick={() => setShowLeftPanel(prev => !prev)}
                    size="small" 
                    sx={{ 
                      color: "#854d0e",
                      border: "1.5px solid #ca8a04",
                      borderRadius: "6px",
                      bgcolor: "#fef9c3",
                      p: 0.4,
                      "&:hover": { bgcolor: "#fef08a" },
                      transition: "all 0.2s"
                    }}
                  >
                    <Menu sx={{ fontSize: 18 }} />
                  </IconButton>
                  <Typography sx={{ fontSize: "1.25rem", fontWeight: 800 }}>
                    TOPIC NAME: <span style={{ color: "#2563eb", textDecoration: "underline" }}>Floyd-Warshall Algorithm (All-Pairs Shortest Paths)</span>
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "1.0rem", color: "#64748b", fontWeight: 700 }}>
                  DAY: <span style={{ color: "#2563eb" }}>Tuesday</span> &nbsp;&nbsp;&nbsp;&nbsp; TIME: <span style={{ color: "#2563eb" }}>11:00 AM</span> &nbsp;&nbsp;&nbsp;&nbsp; DATE: <span style={{ color: "#2563eb" }}>26/05/2026</span>
                </Typography>
              </Box>
            </Box>

            {/* Ruled Sketch Canvas Component */}
            <Box sx={{ flex: 1, minHeight: "150px", display: "flex", flexDirection: "column" }}>
              <GraphCanvas
                nodes={graph.nodes}
                edges={graph.edges}
                mode={graph.mode}
                nodeRadius={nodeRadius}
                edgeBaseWidth={edgeWidth}
                edgeStart={graph.edgeStart}
                showWeights
                visualMode="notebook"
                directed={graph.directed}
                currentNodeId={fw.currentVia}
                highlightEdge={null}
                neighborChecking={fw.currentJ}
                visitedSet={new Set()}
                queueIds={[]}
                onCanvasClick={handleCanvasClick}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onNodeDrag={handleNodeDrag}
              />
            </Box>

            {/* Draggable Divider Line */}
            <Box
              onMouseDown={handleMouseDown}
              sx={{
                height: "6px",
                cursor: "ns-resize",
                bgcolor: "rgba(15, 23, 42, 0.06)",
                borderTop: "1px dashed rgba(15, 23, 42, 0.12)",
                borderBottom: "1px dashed rgba(15, 23, 42, 0.12)",
                zIndex: 10,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                "&:hover": {
                  bgcolor: "rgba(15, 23, 42, 0.15)",
                },
                "&::after": {
                  content: '""',
                  width: 36,
                  height: 4,
                  bgcolor: "rgba(15, 23, 42, 0.25)",
                  borderRadius: 1
                }
              }}
            />

            {/* Calculations Bottom Section (Dry run panels) */}
            <Box sx={{ height: bottomHeight, minHeight: "120px", p: 2, pl: 10, display: "flex", gap: 3, overflow: "hidden", position: "relative" }}>
              
              {/* Ruled Paper Horizontal Lines Overlay for details */}
              <Box sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundImage: "linear-gradient(rgba(59, 130, 246, 0.06) 1px, transparent 1px)",
                backgroundSize: "100% 28px",
                zIndex: 0,
                pointerEvents: "none"
              }} />

              {/* Red Left Margin Line Overlay */}
              <Box sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 68,
                width: 5,
                borderLeft: "1px solid rgba(239, 68, 68, 0.15)",
                borderRight: "1px solid rgba(239, 68, 68, 0.15)",
                zIndex: 0,
                pointerEvents: "none"
              }} />

              {/* Column 1: Path u → via → v */}
              <Box sx={{ zIndex: 1, display: "flex", flexDirection: "column", gap: 0.75, height: "100%" }}>
                <Typography sx={{ fontSize: "1.15rem", fontWeight: "bold", color: "#1e3a8a", textDecoration: "underline" }}>
                  Path:
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {[{ sub: "src", id: fw.currentI, color: "#2563eb" },
                    { sub: "via", id: fw.currentVia, color: "#7c3aed" },
                    { sub: "dest", id: fw.currentJ, color: "#16a34a" }].map((item, idx) => (
                    <React.Fragment key={item.sub}>
                      {idx > 0 && (
                        <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#94a3b8", lineHeight: 1 }}>→</Typography>
                      )}
                      <Box sx={{
                        textAlign: "center",
                        bgcolor: item.id !== null ? `${item.color}12` : "transparent",
                        border: item.id !== null ? `1.5px solid ${item.color}40` : "1.5px dashed #cbd5e1",
                        borderRadius: "6px",
                        px: 1.2, py: 0.4,
                        minWidth: 36,
                        transition: "all 0.2s"
                      }}>
                        <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, color: item.color, lineHeight: 1.1 }}>
                          {item.id !== null ? lbl(item.id) : "–"}
                        </Typography>
                        <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#94a3b8", mt: 0.1 }}>
                          {item.sub}
                        </Typography>
                      </Box>
                    </React.Fragment>
                  ))}
                </Box>
              </Box>

              {/* Column 2: Mathematical Scratchpad Relaxation details */}
              <Box sx={{ flex: 1, zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", pt: 0.5, overflow: "hidden", height: "100%" }}>
                <Box sx={{
                  border: "2px dashed rgba(15, 23, 42, 0.25)",
                  borderRadius: "8px",
                  p: 1.5,
                  bgcolor: "rgba(253, 251, 247, 0.75)",
                  color: "#0f172a",
                  boxShadow: "2px 2px 0px rgba(0,0,0,0.05)",
                  minHeight: 120,
                  maxHeight: "100%",
                  overflowY: "auto",
                  fontSize: "1.05rem",
                  "&::-webkit-scrollbar": { width: "4px" },
                  "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(15,23,42,0.12)", borderRadius: "2px" }
                }}>
                  <Typography sx={{ fontSize: "1.15rem", fontWeight: "bold", mb: 0.5, textDecoration: "underline", color: "#1e3a8a" }}>
                    Relaxation Check:
                  </Typography>
                  {fw.currentVia !== null && fw.currentI !== null && fw.currentJ !== null ? (
                    <Box sx={{ lineHeight: 1.45 }}>
                      <div>Checking path from <b>{lbl(fw.currentI)}</b> to <b>{lbl(fw.currentJ)}</b> via node <b>{lbl(fw.currentVia)}</b>:</div>
                      <Box sx={{ mt: 0.5 }}>
                        <div style={{ color: isRelaxed || fw.activeStepIdx === 3 ? "#16a34a" : "#dc2626", fontWeight: "500", marginTop: "6px", fontSize: "1.05rem" }}>
                          • Current dist[{lbl(fw.currentI)}][{lbl(fw.currentJ)}] = <b>{dij === Infinity ? '∞' : dij}</b> <br />
                          • Path via {lbl(fw.currentVia)} = dist[{lbl(fw.currentI)}][{lbl(fw.currentVia)}] + dist[{lbl(fw.currentVia)}][{lbl(fw.currentJ)}] <br />
                          &nbsp;&nbsp;&nbsp;&nbsp;= {divia === Infinity ? '∞' : divia} + {dviaj === Infinity ? '∞' : dviaj} = <b>{sum === Infinity ? '∞' : sum}</b> <br />
                          <div style={{ marginTop: "4px", fontWeight: "bold" }}>
                            {isRelaxed || fw.activeStepIdx === 3 ? (
                              <span>✔ Yes, {sum} &lt; {dij === Infinity ? '∞' : dij}! Update dist[{lbl(fw.currentI)}][{lbl(fw.currentJ)}] = {sum}! ✍️</span>
                            ) : (
                              <span>✖ No, {sum === Infinity ? '∞' : sum} is not shorter than {dij === Infinity ? '∞' : dij}. Keep old value.</span>
                            )}
                          </div>
                        </div>
                      </Box>
                    </Box>
                  ) : (
                    <div style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.95rem" }}>Press Start or Step to watch the all-pairs matrix updates.</div>
                  )}
                </Box>
              </Box>

              {/* Column 3: Distance Matrix */}
              <Box sx={{ flex: 1.4, zIndex: 1, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
                <Typography sx={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#1e3a8a",
                  mb: 0.5,
                  textDecoration: "underline"
                }}>
                  Distance Matrix (dist):
                </Typography>
                
                <Box sx={{
                  flex: 1,
                  overflow: "auto",
                  maxHeight: "100%",
                  "&::-webkit-scrollbar": { width: "4px", height: "4px" },
                  "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(15,23,42,0.12)", borderRadius: "2px" }
                }}>
                  {sortedNodes.length === 0 ? (
                    <Typography sx={{ color: "#64748b", fontStyle: "italic", fontSize: "0.95rem" }}>
                      Add nodes to see matrix
                    </Typography>
                  ) : (
                    <Box sx={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${sortedNodes.length + 1}, 42px)`,
                      gap: "2px",
                      p: 0.5,
                      bgcolor: "rgba(15, 23, 42, 0.05)",
                      border: "2px solid #0f172a",
                      borderRadius: "5px",
                      width: "fit-content",
                      boxShadow: "2px 2px 0px rgba(15,23,42,0.15)",
                      fontFamily: "'Architects Daughter', cursive"
                    }}>
                      {/* Header Row */}
                      <Box sx={{
                        width: 42,
                        height: 34,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "rgba(15, 23, 42, 0.05)",
                        fontWeight: 900,
                        fontSize: "0.9rem",
                        color: "#475569",
                        borderBottom: "2px solid #0f172a",
                        borderRight: "2px solid #0f172a"
                      }}>
                        dist
                      </Box>
                      {sortedNodes.map(n => (
                        <Box key={`h-${n.id}`} sx={{
                          width: 42,
                          height: 34,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "rgba(15, 23, 42, 0.05)",
                          fontWeight: 900,
                          fontSize: "1.1rem",
                          color: "#1e3a8a",
                          borderBottom: "2px solid #0f172a"
                        }}>
                          {n.label}
                        </Box>
                      ))}
                      
                      {/* Data Rows */}
                      {sortedNodes.map(u => (
                        <React.Fragment key={`r-${u.id}`}>
                          {/* Row Header */}
                          <Box sx={{
                            width: 42,
                            height: 34,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "rgba(15, 23, 42, 0.05)",
                            fontWeight: 900,
                            fontSize: "1.1rem",
                            color: "#1e3a8a",
                            borderRight: "2px solid #0f172a"
                          }}>
                            {u.label}
                          </Box>
                          {/* Cells */}
                          {sortedNodes.map(v => {
                            const d = fw.distances[u.id]?.[v.id] ?? Infinity;
                            const isInf = d === Infinity;
                            const isTarget = u.id === fw.currentI && v.id === fw.currentJ;
                            const isVia = u.id === fw.currentVia || v.id === fw.currentVia;
                            const isUpdated = isTarget && fw.activeStepIdx === 3; // relax step

                            return (
                              <Box key={`c-${u.id}-${v.id}`} sx={{ 
                                width: 42,
                                height: 34,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                bgcolor: isUpdated 
                                  ? "rgba(253, 224, 71, 0.75)" // yellow highlighter
                                  : isTarget 
                                    ? "rgba(16, 185, 129, 0.2)" // checking path green marker
                                    : isVia 
                                      ? "rgba(99, 102, 241, 0.08)" // via blue marker
                                      : "#ffffff", 
                                color: isUpdated 
                                  ? "#dc2626" 
                                  : isTarget 
                                    ? "#10b981" 
                                    : isInf 
                                      ? "#94a3b8" 
                                      : "#0f172a",
                                borderRight: "1px dashed rgba(15,23,42,0.15)",
                                borderBottom: "1px dashed rgba(15,23,42,0.15)",
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
                </Box>
              </Box>

              {/* Column 4: Execution Log */}
              <Box sx={{ flex: 1, zIndex: 1, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
                <Typography sx={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#1e3a8a",
                  mb: 0.5,
                  textDecoration: "underline"
                }}>
                  Execution Log:
                </Typography>
                <Box sx={{
                  flex: 1,
                  bgcolor: "rgba(255, 255, 255, 0.45)",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "8px",
                  p: 1.5,
                  overflowY: "auto",
                  boxShadow: "inset 0px 2px 4px rgba(0,0,0,0.02)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  "&::-webkit-scrollbar": { width: "4px" },
                  "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(15,23,42,0.12)", borderRadius: "2px" }
                }}>
                  {fw.logEntries.length === 0 ? (
                    <Typography variant="caption" sx={{ color: "#64748b", fontStyle: "italic", fontSize: "0.95rem" }}>
                      Press Start to watch trace log.
                    </Typography>
                  ) : (
                    fw.logEntries.map((entry, idx) => (
                      <Box key={idx} sx={{ py: 0.25, borderBottom: "1px solid rgba(15,23,42,0.05)", whiteSpace: "pre-wrap", color: "#334155" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          marginRight: "6px",
                          backgroundColor: `${tagColor[entry.type] || "#ca8a04"}20`,
                          color: tagColor[entry.type] || "#ca8a04"
                        }}>
                          {entry.type}
                        </span>
                        {entry.msg}
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : (
        // ================= MODERN GLASSMORPHIC UI LAYOUT =================
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
              
              {/* Directed / Undirected switch in modern mode */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 0.5 }}>Graph Type</Typography>
                <ToggleButtonGroup
                  value={graph.directed ? "directed" : "undirected"}
                  exclusive
                  onChange={(_, v) => { if (v && !fw.running) graph.setDirected(v === "directed"); }}
                  size="small"
                  fullWidth
                  sx={{ height: 28 }}
                >
                  <ToggleButton value="undirected" sx={{ fontSize: "0.72rem" }}>Undirected</ToggleButton>
                  <ToggleButton value="directed" sx={{ fontSize: "0.72rem" }}>Directed</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Speed</Typography>
              <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => fw.setSpeed(v as number)} size="small" sx={{ mb: 1, color: "primary.main" }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Node Size <Chip label={nodeRadius} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
              <Slider min={14} max={40} value={nodeRadius} onChange={(_, v) => setNodeRadius(v as number)} size="small" sx={{ mb: 1 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Edge Width <Chip label={edgeWidth} size="small" sx={{ fontSize: "0.65rem", height: 18, ml: 0.5 }} /></Typography>
              <Slider min={1} max={6} step={0.5} value={edgeWidth} onChange={(_, v) => setEdgeWidth(v as number)} size="small" sx={{ mb: 1.5 }} />

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
                <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={fw.startFloydWarshall} disabled={graph.nodes.length === 0 || (fw.running && !fw.paused)}
                  sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", "&:hover": { filter: "brightness(1.1)" } }}>Start</Button>
                <Button variant="outlined" size="small" startIcon={<SkipNext />} onClick={fw.stepFloydWarshall} disabled={graph.nodes.length === 0}
                  sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Step</Button>
                <Button variant="outlined" size="small" startIcon={fw.paused ? <PlayArrow /> : <Pause />} onClick={fw.togglePause} disabled={!fw.running}
                  sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>{fw.paused ? "Resume" : "Pause"}</Button>
                <Button variant="outlined" size="small" color="error" startIcon={<RestartAlt />} onClick={fw.resetFloydWarshall}
                  sx={{ flex: "1 1 calc(50% - 4px)", fontSize: "0.75rem" }}>Reset</Button>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", mr: 0.5 }}>Presets:</Typography>
                <Tooltip title="Binary Tree"><IconButton size="small" onClick={() => handlePreset("tree")}><AccountTree sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                <Tooltip title="Grid"><IconButton size="small" onClick={() => handlePreset("grid")}><GridOn sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                <Tooltip title="Random"><IconButton size="small" onClick={() => handlePreset("random")}><Shuffle sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              </Box>
              
              <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 0.5 }}>Visual Style</Typography>
                <ToggleButtonGroup
                  value={visualMode}
                  exclusive
                  onChange={(_, v) => { if (v) setVisualMode(v); }}
                  size="small"
                  fullWidth
                  sx={{ height: 28 }}
                >
                  <ToggleButton value="notebook" sx={{ fontSize: "0.68rem" }}>Notebook View</ToggleButton>
                  <ToggleButton value="modern" sx={{ fontSize: "0.68rem" }}>Modern View</ToggleButton>
                </ToggleButtonGroup>
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
            showWeights={true} visitedSet={new Set()} queueIds={[]} directed={graph.directed} onCanvasClick={handleCanvasClick} onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick} onNodeDrag={handleNodeDrag} />

          {/* Right Sidebar */}
          <Box sx={{ width: 340, minWidth: 340, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
            bgcolor: (t) => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
            backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>

            {/* Active Nodes: u → via → v */}
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
                Path Check (u → via → v)
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                {[{ label: "u (i)", id: fw.currentI, color: "primary.main" },
                  { label: "via (k)", id: fw.currentVia, color: "secondary.main" },
                  { label: "v (j)", id: fw.currentJ, color: "success.main" }].map((item, idx) => (
                  <React.Fragment key={item.label}>
                    {idx > 0 && (
                      <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "text.disabled", lineHeight: 1 }}>→</Typography>
                    )}
                    <Box sx={{ flex: 1, p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                      <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "text.secondary", fontWeight: 600 }}>{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: item.color }}>
                        {item.id !== null ? graph.nodes.find(n => n.id === item.id)?.label : "-"}
                      </Typography>
                    </Box>
                  </React.Fragment>
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
      )}

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
