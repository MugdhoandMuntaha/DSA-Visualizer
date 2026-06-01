"use client";
import { useState, useRef, useCallback, useEffect } from "react";
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
import Menu from "@mui/icons-material/Menu";
import Header from "@/components/Header";
import GraphCanvas from "@/components/GraphCanvas";
import AlgoSteps, { StepDef } from "@/components/AlgoSteps";
import { useGraph } from "@/hooks/useGraph";
import { useBellmanFord } from "@/hooks/useBellmanFord";
import { GraphNode, GraphEdge, InteractionMode } from "@/lib/graphUtils";

const BELLMAN_FORD_STEPS: StepDef[] = [
  { id: "init", title: "dist[src] = 0; others = INF;", description: "Initialize source distance to 0, all others to infinity." },
  { id: "outer-loop", title: "for (int i = 1; i <= V-1; ++i)", description: "Relax all edges V-1 times." },
  { id: "node-loop", title: "for (auto &u : nodes)", description: "Iterate through each node in the graph." },
  { id: "check-relax", title: "if (dist[u] + wt < dist[v])", description: "Check if path to v via u is shorter." },
  { id: "relax", title: "dist[v] = dist[u] + wt;", description: "Update the shortest distance to neighbor v." },
  { id: "neg-cycle-check", title: "for (auto &edge : edges)", description: "Iterate edges to check for negative cycles." },
  { id: "neg-cycle-found", title: "Negative cycle detected!", description: "A negative weight cycle exists in the graph." },
];

const DistanceRow = ({
  distances,
  nodes,
  previousDistances
}: {
  distances: Map<number, number>;
  nodes: GraphNode[];
  previousDistances?: Map<number, number>;
}) => {
  // Sort nodes by ID to ensure column consistency
  const sortedNodes = [...nodes].sort((a, b) => a.id - b.id);
  
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, my: 0.5 }}>
      <Typography sx={{ fontStyle: "italic", fontSize: "1.25rem", fontWeight: 700, mt: 0.75, minWidth: 90, color: "#1e293b", fontFamily: "'Architects Daughter', cursive" }}>
        distance =
      </Typography>
      <Box sx={{ fontFamily: "'Architects Daughter', cursive" }}>
        {/* Cells */}
        <Box sx={{ display: "flex", border: "2.5px solid #0f172a", borderRadius: "5px", bgcolor: "#ffffff", boxShadow: "2px 2px 0px rgba(15,23,42,0.15)" }}>
          {sortedNodes.map((node, i) => {
            const d = distances.get(node.id);
            const prevD = previousDistances ? previousDistances.get(node.id) : undefined;
            const isUpdated = previousDistances !== undefined && d !== prevD;
            const valStr = d === undefined || d === Infinity ? "∞" : String(d);
            return (
              <Box key={node.id} sx={{
                width: 44,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: isUpdated ? "#dc2626" : "#0f172a",
                bgcolor: isUpdated ? "rgba(253, 224, 71, 0.65)" : "#ffffff",
                borderRight: i < sortedNodes.length - 1 ? "2.5px solid #0f172a" : "none",
                transition: "all 0.3s ease"
              }}>
                {valStr}
              </Box>
            );
          })}
        </Box>
        {/* Indices */}
        <Box sx={{ display: "flex" }}>
          {sortedNodes.map((node) => (
            <Box key={node.id} sx={{ width: 46.5, textAlign: "center", fontSize: "1.1rem", fontWeight: 700, mt: 0.1, color: "#475569" }}>
              {node.label}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default function BellmanFordPage() {
  const graph = useGraph();
  const bf = useBellmanFord(graph.nodes, graph.edges, graph.directed);
  const [sourceId, setSourceId] = useState<string>("");
  const [nodeRadius, setNodeRadius] = useState(28);
  const [edgeWidth, setEdgeWidth] = useState(3.5);
  const [weightDialog, setWeightDialog] = useState<{ from: number; to: number } | null>(null);
  const [weightInput, setWeightInput] = useState("1");
  const [visualMode, setVisualMode] = useState<"modern" | "notebook">("notebook");
  const [distHistory, setDistHistory] = useState<Map<number, number>[]>([]);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const distContainerRef = useRef<HTMLDivElement>(null);
  const [bottomHeight, setBottomHeight] = useState(250);
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
      setSourceId("0");
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset sourceId if the selected node is deleted
  useEffect(() => {
    if (sourceId && !graph.nodes.some(n => String(n.id) === sourceId)) {
      setSourceId("");
    }
  }, [graph.nodes, sourceId]);

  // Track the history of distance array updates during bellman ford steps
  useEffect(() => {
    if (bf.activeStepIdx === -1) {
      setDistHistory([]);
      return;
    }

    if (!bf.running) return;

    const currentDist = new Map(bf.distances);
    setDistHistory((prev) => {
      if (prev.length === 0) {
        return [currentDist];
      }
      
      const lastDist = prev[prev.length - 1];
      let hasChanged = false;
      
      for (const [nodeId, distVal] of currentDist.entries()) {
        if (lastDist.get(nodeId) !== distVal) {
          hasChanged = true;
          break;
        }
      }
      
      if (hasChanged) {
        return [...prev, currentDist];
      }
      return prev;
    });
  }, [bf.distances, bf.activeStepIdx, bf.running]);

  // Scroll to bottom of distance stack
  useEffect(() => {
    if (distContainerRef.current) {
      distContainerRef.current.scrollTop = distContainerRef.current.scrollHeight;
    }
  }, [distHistory]);

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

  const handlePreset = (type: "tree" | "grid" | "random" | "notebook") => {
    if (bf.running) return;
    bf.resetBellmanFord();
    graph.clearGraph();
    const h = type === "notebook" ? 250 : 480;
    setTimeout(() => graph.loadPreset(type, 750, h, true), 50);
    setSourceId(type === "notebook" ? "0" : "");
  };

  const handleStart = useCallback(() => { const id = parseInt(sourceId); if (!isNaN(id)) bf.startBellmanFord(id); }, [sourceId, bf]);
  const handleStep = useCallback(() => { const id = parseInt(sourceId); if (!isNaN(id)) bf.stepBellmanFord(id); }, [sourceId, bf]);
  const handleReset = () => { bf.resetBellmanFord(); };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.getAttribute("contenteditable") !== null) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        bf.prevStepBellmanFord();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStep, bf]);

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "outer-loop": "#ea580c", "node-loop": "#d97706", "check-relax": "#10b981",
    relax: "#3b82f6", "neg-cycle-check": "#7c3aed", "neg-cycle-found": "#ef4444", done: "#0891b2",
  };

  const lbl = useCallback(
    (id: number) => graph.nodes.find((n) => n.id === id)?.label || String(id),
    [graph.nodes]
  );

  const getDirectedEdgesForEdgeList = useCallback(() => {
    const list: { from: number; fromLabel: string; to: number; toLabel: string; weight: number }[] = [];
    // Sort nodes just like in useBellmanFord.ts buildSteps
    const sortedNodes = [...graph.nodes].sort((a, b) => a.id - b.id);
    sortedNodes.forEach(node => {
      const u = node.id;
      const nbrs: { id: number; label: string; weight: number }[] = [];
      graph.edges.forEach((e) => {
        if (e.from === u) {
          const target = graph.nodes.find(n => n.id === e.to);
          if (target) nbrs.push({ id: target.id, label: target.label, weight: e.weight ?? 1 });
        } else if (!graph.directed && e.to === u) {
          const target = graph.nodes.find(n => n.id === e.from);
          if (target) nbrs.push({ id: target.id, label: target.label, weight: e.weight ?? 1 });
        }
      });
      nbrs.sort((a, b) => a.label.localeCompare(b.label));

      nbrs.forEach(nb => {
        list.push({
          from: u,
          fromLabel: node.label,
          to: nb.id,
          toLabel: nb.label,
          weight: nb.weight
        });
      });
    });
    return list;
  }, [graph.nodes, graph.edges, graph.directed]);

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: visualMode === "notebook" ? "#f3ede2" : "background.default" }}>
      {/* Dynamic Font Loading */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@600;700&display=swap" rel="stylesheet" />

      <Header title="Bellman-Ford Visualizer" badge="Shortest Paths" />

      {/* Visual Mode Toggler */}
      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 3,
        py: 0.75,
        bgcolor: visualMode === "notebook" ? "#fcfaf6" : "background.paper",
        borderBottom: "1px solid",
        borderColor: visualMode === "notebook" ? "rgba(30, 41, 59, 0.12)" : "divider",
        transition: "all 0.3s ease",
        zIndex: 10
      }}>
        <Typography variant="subtitle2" sx={{
          fontWeight: 700,
          color: visualMode === "notebook" ? "#0f172a" : "text.primary"
        }}>
          {visualMode === "notebook" ? "📝 Notebook Dry Run Active (Image Replica)" : "💻 Modern High-Tech UI"}
        </Typography>
        
        <ToggleButtonGroup
          value={visualMode}
          exclusive
          onChange={(_, v) => { if (v) setVisualMode(v); }}
          size="small"
          sx={{
            height: 28,
            bgcolor: visualMode === "notebook" ? "#ffffff" : "transparent",
            border: visualMode === "notebook" ? "1.5px solid #0f172a" : "inherit",
            borderRadius: "6px",
            overflow: "hidden",
            "& .MuiToggleButton-root": {
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "none",
              px: 2,
              py: 0.25,
              color: visualMode === "notebook" ? "#0f172a" : "text.secondary",
              borderColor: visualMode === "notebook" ? "#0f172a" : "divider",
              "&.Mui-selected": {
                bgcolor: visualMode === "notebook" ? "#0f172a" : "primary.main",
                color: visualMode === "notebook" ? "#ffffff" : "primary.contrastText",
                "&:hover": {
                  bgcolor: visualMode === "notebook" ? "#1e293b" : "primary.dark",
                }
              }
            }
          }}
        >
          <ToggleButton value="notebook">📝 Notebook Sketch</ToggleButton>
          <ToggleButton value="modern">💻 Modern UI</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Main Content Workspace */}
      {visualMode === "notebook" ? (
        // ================= NOTEBOOK SKETCH LAYOUT =================
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
          
          {/* LEFT PANEL: Styled as a Yellow Legal Pad / Clipboard */}
          <Box sx={{
            width: showLeftPanel ? 290 : 0,
            minWidth: showLeftPanel ? 290 : 0,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            bgcolor: "#fef9c3", // warm yellow note
            borderRight: showLeftPanel ? "1px dashed rgba(15, 23, 42, 0.15)" : "none",
            display: "flex",
            flexDirection: "column",
            gap: showLeftPanel ? 1.25 : 0,
            p: showLeftPanel ? 2 : 0,
            opacity: showLeftPanel ? 1 : 0,
            pointerEvents: showLeftPanel ? "auto" : "none",
            overflow: showLeftPanel ? "auto" : "hidden",
            position: "relative",
            boxShadow: "inset -5px 0 15px rgba(0,0,0,0.03)",
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(202, 138, 4, 0.3)", borderRadius: "2px" },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" }
          }}>
            {/* Binder Clip Tape effect */}
            <Box sx={{
              position: "absolute",
              top: -6,
              left: "30%",
              width: "40%",
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
                onChange={(_, v: InteractionMode | null) => { if (v && !bf.running) graph.setMode(v); }}
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
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", mb: 0.5 }}>
                1b. Graph Type
              </Typography>
              <ToggleButtonGroup
                value={graph.directed ? "directed" : "undirected"}
                exclusive
                onChange={(_, v) => { if (v && !bf.running) graph.setDirected(v === "directed"); }}
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

            {/* Source select in handwritten style */}
            <Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", mb: 0.5 }}>
                2. Source Node
              </Typography>
              <Select
                size="small"
                fullWidth
                value={sourceId}
                onChange={(e: SelectChangeEvent) => setSourceId(e.target.value)}
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  bgcolor: "#ffffff",
                  color: "#0f172a !important",
                  border: "1.5px solid #ca8a04",
                  height: 32,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-select": { color: "#0f172a !important" },
                  "& .MuiSvgIcon-root": { color: "#ca8a04 !important" },
                }}
                MenuProps={{
                  slotProps: {
                    paper: {
                      sx: {
                        bgcolor: "#ffffff !important",
                        color: "#0f172a !important",
                        border: "1.5px solid #ca8a04",
                        boxShadow: "3px 3px 10px rgba(0,0,0,0.1)",
                        "& .MuiMenuItem-root": {
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "#0f172a !important",
                          "&:hover": {
                            bgcolor: "rgba(202, 138, 4, 0.1) !important",
                          },
                          "&.Mui-selected": {
                            bgcolor: "rgba(202, 138, 4, 0.2) !important",
                            "&:hover": {
                              bgcolor: "rgba(202, 138, 4, 0.3) !important",
                            }
                          }
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="" sx={{ color: "#0f172a !important" }}>— select —</MenuItem>
                {graph.nodes.map(n => <MenuItem key={n.id} value={String(n.id)} sx={{ color: "#0f172a !important" }}>{n.label}</MenuItem>)}
              </Select>
            </Box>

            {/* Speed slider sketchy */}
            <Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#854d0e", mb: -0.5 }}>
                3. Speed
              </Typography>
              <Slider
                min={1}
                max={10}
                defaultValue={5}
                onChange={(_, v) => bf.setSpeed(v as number)}
                size="small"
                sx={{ color: "#ca8a04", py: 1 }}
              />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PlayArrow />}
                onClick={handleStart}
                disabled={!sourceId || (bf.running && !bf.paused)}
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
                onClick={handleStep}
                disabled={!sourceId}
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
                startIcon={bf.paused ? <PlayArrow /> : <Pause />}
                onClick={bf.togglePause}
                disabled={!bf.running}
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
                {bf.paused ? "Resume" : "Pause"}
              </Button>

              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<RestartAlt />}
                onClick={handleReset}
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

            {/* Presets and notebook reload */}
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

            {/* C++ Code steps in handwritten font */}
            <Box sx={{ flex: 1, overflowY: "auto", borderTop: "1.5px dashed #ca8a04", pt: 1.5, display: "flex", flexDirection: "column",
              "&::-webkit-scrollbar": { width: "3px" },
              "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(202, 138, 4, 0.2)", borderRadius: "2px" } }}>
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "#854d0e", mb: 0.75 }}>
                ✏️ Algorithm Trace Code
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {BELLMAN_FORD_STEPS.map((step, idx) => {
                  const isActive = bf.activeStepIdx === idx;
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
                    TOPIC NAME: <span style={{ color: "#2563eb", textDecoration: "underline" }}>Bellman-Ford Algorithm (Shortest Paths / Negative Weights)</span>
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "1.0rem", color: "#64748b", fontWeight: 700 }}>
                  DAY: <span style={{ color: "#2563eb" }}>Monday</span> &nbsp;&nbsp;&nbsp;&nbsp; TIME: <span style={{ color: "#2563eb" }}>10:15 AM</span> &nbsp;&nbsp;&nbsp;&nbsp; DATE: <span style={{ color: "#2563eb" }}>25/05/2026</span>
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
                currentNodeId={bf.currentNodeU}
                highlightEdge={bf.highlightEdge}
                neighborChecking={bf.currentNodeV}
                visitedSet={new Set()}
                queueIds={[]}
                onCanvasClick={handleCanvasClick}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onNodeDrag={(id, x, y) => graph.moveNode(id, x, y)}
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

              {/* Column 1: Edge List Representation */}
              <Box sx={{ flex: 1.1, display: "flex", flexDirection: "column", zIndex: 1, overflow: "hidden", height: "100%" }}>
                <Typography sx={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#1e3a8a",
                  mb: 0.5,
                  textDecoration: "underline"
                }}>
                  Edge List:
                </Typography>
                <Box sx={{
                  flex: 1,
                  overflowY: "auto",
                  pr: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  "&::-webkit-scrollbar": { width: "4px" },
                  "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(15,23,42,0.12)", borderRadius: "2px" },
                  "&::-webkit-scrollbar-track": { bgcolor: "transparent" }
                }}>
                  {getDirectedEdgesForEdgeList().length === 0 ? (
                    <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>No edges defined</Typography>
                  ) : (
                    getDirectedEdgesForEdgeList().map((edge, idx) => {
                      const isCurrentEdge = bf.currentNodeU === edge.from && bf.currentNodeV === edge.to;
                      return (
                        <Box 
                          key={`${edge.from}-${edge.to}-${idx}`} 
                          sx={{ 
                            fontFamily: "var(--font-mono)", 
                            fontSize: "1.1rem", 
                            py: 0.2, 
                            display: "flex", 
                            alignItems: "center",
                            bgcolor: isCurrentEdge ? "rgba(253, 224, 71, 0.65)" : "transparent",
                            borderRadius: isCurrentEdge ? "3px" : "4px",
                            px: 0.5,
                            border: isCurrentEdge ? "1px dashed #ca8a04" : "none"
                          }}
                        >
                          <span style={{ 
                            fontWeight: isCurrentEdge ? "bold" : "normal",
                            color: isCurrentEdge ? "#dc2626" : "#0f172a"
                          }}>
                            {edge.fromLabel} &rarr; {edge.toLabel} &nbsp;(wt: {edge.weight})
                          </span>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Box>

              {/* Column 2: Source Note and Distance History Stack */}
              <Box sx={{ flex: 1.1, display: "flex", flexDirection: "column", zIndex: 1, overflow: "hidden", height: "100%" }}>
                <Typography sx={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: "#dc2626", // red pen ink
                  mb: 0.5
                }}>
                  Src = {bf.sourceNodeId !== null ? lbl(bf.sourceNodeId) : "0"}
                </Typography>

                <Box
                  ref={distContainerRef}
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1.5,
                    "&::-webkit-scrollbar": { width: "4px" },
                    "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(15,23,42,0.12)", borderRadius: "2px" },
                    "&::-webkit-scrollbar-track": { bgcolor: "transparent" }
                  }}
                >
                  {distHistory.length === 0 ? (
                    <Box sx={{ opacity: 0.8 }}>
                      <DistanceRow distances={new Map(graph.nodes.map(n => [n.id, Infinity]))} nodes={graph.nodes} />
                    </Box>
                  ) : (
                    distHistory.map((distMap, idx) => (
                      <Box key={idx} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", opacity: idx === distHistory.length - 1 ? 1 : 0.6 }}>
                        {idx > 0 && (
                          <Box sx={{ pl: 14, my: 0.1, color: "#475569", fontSize: "1.3rem", fontWeight: 900 }}>
                            ↓
                          </Box>
                        )}
                        <DistanceRow 
                          distances={distMap} 
                          nodes={graph.nodes} 
                          previousDistances={idx > 0 ? distHistory[idx - 1] : new Map(graph.nodes.map(n => [n.id, Infinity]))}
                        />
                      </Box>
                    ))
                  )}
                </Box>
              </Box>

              {/* Column 3: Mathematical Scratchpad Relaxation details */}
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
                  {bf.currentNodeU !== null ? (
                    <Box sx={{ lineHeight: 1.45 }}>
                      <div>Current node (u): <b>{lbl(bf.currentNodeU)}</b> (distance = <b>{bf.currentDist === Infinity ? '∞' : bf.currentDist}</b>)</div>
                      {bf.currentNodeV !== null ? (
                        <Box sx={{ mt: 0.5 }}>
                          <div>Checking neighbor (v): <b>{lbl(bf.currentNodeV)}</b> (edge weight = <b>{bf.neighborWeight}</b>)</div>
                          <div style={{ color: bf.relaxResult === 'relaxed' ? "#16a34a" : "#dc2626", fontWeight: "500", marginTop: "6px", fontSize: "1.05rem" }}>
                            • New path weight = {bf.currentDist === Infinity ? '∞' : bf.currentDist} + {bf.neighborWeight} = <b>{bf.newDist === Infinity ? '∞' : bf.newDist}</b> <br />
                            • Old distance to {lbl(bf.currentNodeV)} = <b>{bf.oldDist === Infinity ? '∞' : bf.oldDist}</b> <br />
                            <div style={{ marginTop: "4px", fontWeight: "bold" }}>
                              {bf.relaxResult === 'relaxed' ? (
                                <span>✔ Yes, {bf.newDist} &lt; {bf.oldDist === Infinity ? '∞' : bf.oldDist}! Update distance to {lbl(bf.currentNodeV)}! ✍️</span>
                              ) : (
                                <span>✖ No, {bf.newDist === Infinity || bf.currentDist === Infinity ? "Infinity path" : `${bf.newDist} is not shorter than ${bf.oldDist === Infinity ? '∞' : bf.oldDist}`}. Keep old distance.</span>
                              )}
                            </div>
                          </div>
                        </Box>
                      ) : (
                        <div style={{ color: "#64748b", fontStyle: "italic", marginTop: "6px" }}>Scanning neighbors of node {lbl(bf.currentNodeU)}...</div>
                      )}
                    </Box>
                  ) : (
                    <div style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.95rem" }}>Choose source, press Start or Step to watch the dry run trace.</div>
                  )}
                </Box>
              </Box>

              {/* Column 4: Iteration status and Negative Cycle warning card */}
              <Box sx={{ width: 150, display: "flex", flexDirection: "column", gap: 1.5, zIndex: 1 }}>
                <Box sx={{
                  border: "2px solid #ca8a04",
                  borderRadius: "6px",
                  p: 1,
                  bgcolor: "#fef9c3",
                  boxShadow: "2px 2px 0px rgba(202, 138, 4, 0.15)",
                  textAlign: "center"
                }}>
                  <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#854d0e" }}>
                    ITERATION
                  </Typography>
                  <Typography sx={{ fontSize: "1.45rem", fontWeight: 900, color: "#a16207", mt: 0.5 }}>
                    {graph.nodes.length > 0 ? `${bf.iteration} / ${graph.nodes.length - 1}` : "0 / 0"}
                  </Typography>
                </Box>

                <Box sx={{
                  border: bf.hasNegativeCycle ? "2.5px solid #dc2626" : "2px dashed #94a3b8",
                  borderRadius: "6px",
                  p: 1.25,
                  bgcolor: bf.hasNegativeCycle ? "#fee2e2" : "rgba(255,255,255,0.45)",
                  boxShadow: bf.hasNegativeCycle ? "2px 2px 0px rgba(220, 38, 38, 0.15)" : "none",
                  textAlign: "center"
                }}>
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: bf.hasNegativeCycle ? "#991b1b" : "#475569" }}>
                    NEGATIVE CYCLE
                  </Typography>
                  <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: bf.hasNegativeCycle ? "#dc2626" : "#22c55e", mt: 0.5 }}>
                    {bf.hasNegativeCycle ? "⚠️ DETECTED!" : "✔ NONE"}
                  </Typography>
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
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase" }}>Graph Type</Typography>
                <ToggleButtonGroup value={graph.directed ? "directed" : "undirected"} exclusive 
                  onChange={(_, v) => { if (v && !bf.running) graph.setDirected(v === "directed"); }}
                  size="small" sx={{ height: 24, "& .MuiToggleButton-root": { fontSize: "0.6rem", fontWeight: 700, px: 1, py: 0, textTransform: "none" } }}>
                  <ToggleButton value="undirected">Undirected</ToggleButton>
                  <ToggleButton value="directed">Directed</ToggleButton>
                </ToggleButtonGroup>
              </Box>
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
              <Box sx={{ display: "flex", gap: 0.5, items: "center" }}>
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
            showWeights={true} visitedSet={new Set()} queueIds={[]} directed={graph.directed} onCanvasClick={handleCanvasClick} onNodeClick={handleNodeClick}
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

            {/* Edge List representation */}
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "block", mb: 1.5 }}>
                Edge List
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxHeight: 180, overflowY: "auto" }}>
                {getDirectedEdgesForEdgeList().length === 0 ? (
                  <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>No edges defined</Typography>
                ) : (
                  getDirectedEdgesForEdgeList().map((edge, idx) => {
                    const isCurrentEdge = bf.currentNodeU === edge.from && bf.currentNodeV === edge.to;
                    return (
                      <Box 
                        key={`${edge.from}-${edge.to}-${idx}`} 
                        sx={{ 
                          fontFamily: "var(--font-mono)", 
                          fontSize: "0.72rem", 
                          py: 0.3, 
                          px: 0.75,
                          bgcolor: isCurrentEdge ? "rgba(99, 102, 241, 0.15)" : "transparent",
                          border: isCurrentEdge ? "1.5px dashed" : "1px solid transparent",
                          borderColor: isCurrentEdge ? "primary.main" : "transparent",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ 
                          fontWeight: isCurrentEdge ? "bold" : "normal",
                          color: isCurrentEdge ? "primary.main" : "inherit"
                        }}>
                          {edge.fromLabel} &rarr; {edge.toLabel} &nbsp;(wt: {edge.weight})
                        </span>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Paper>

            {/* Calculation Details */}
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", lineHeight: 1 }}>Current State</Typography>
              
              <Box sx={{ display: "flex", items: "center", justifyContent: "space-between", bgcolor: "rgba(99,102,241,0.05)", p: 1, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>Source:</Typography>
                <Chip label={bf.sourceNodeId !== null ? graph.nodes.find(n => n.id === bf.sourceNodeId)?.label : "-"} size="small" sx={{ height: 20, fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 700, bgcolor: "rgba(99,102,241,0.1)", color: "primary.main" }} />
              </Box>

              <Box sx={{ display: "flex", items: "center", justifyContent: "space-between", bgcolor: "rgba(217,119,6,0.05)", p: 1, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>Edge Start (u):</Typography>
                <Chip label={bf.currentNodeU !== null ? `${graph.nodes.find(n => n.id === bf.currentNodeU)?.label} (d=${bf.currentDist === Infinity || bf.currentDist === null ? '∞' : bf.currentDist})` : "-"} size="small" sx={{ height: 20, fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 700, bgcolor: "rgba(217,119,6,0.1)", color: "warning.main" }} />
              </Box>

              <Box sx={{ display: "flex", items: "center", justifyContent: "space-between", bgcolor: "rgba(16,185,129,0.05)", p: 1, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>Edge End (v):</Typography>
                <Chip label={bf.currentNodeV !== null ? `${graph.nodes.find(n => n.id === bf.currentNodeV)?.label} (w=${bf.neighborWeight})` : "-"} size="small" sx={{ height: 20, fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 700, bgcolor: "rgba(16,185,129,0.1)", color: "success.main" }} />
              </Box>

              <Box sx={{ mt: 0.5, p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" sx={{ display: "block", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "text.secondary", mb: 0.5 }}>
                  Is path to v via u shorter?
                </Typography>
                {bf.currentNodeV !== null && bf.oldDist !== null && bf.newDist !== null ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700 }}>
                      New Path: {bf.currentDist} + {bf.neighborWeight} = {bf.newDist}
                    </Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: bf.relaxResult === 'relaxed' ? "success.main" : "error.main" }}>
                      Old Path: {bf.oldDist === Infinity ? '∞' : bf.oldDist}
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, textAlign: "center", color: bf.relaxResult === 'relaxed' ? "success.main" : "error.main" }}>
                      {bf.relaxResult === 'relaxed' ? "✔ Yes, relax edge!" : "✖ No, keep old distance."}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "text.disabled" }}>Waiting...</Typography>
                )}
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
                    const isChanged = bf.changedNode === n.id;
                    return (
                      <Box key={n.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1.25, py: 0.5, borderRadius: 1,
                        bgcolor: isChanged ? "rgba(16,185,129,0.15)" : "action.hover", border: "1px solid", 
                        borderColor: isChanged ? "success.main" : "divider", transition: "all 0.3s ease" }}>
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: isChanged ? "success.main" : "text.secondary" }}>{n.label}</Typography>
                        <Chip label={isInf ? "∞" : d} size="small" sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20, fontFamily: "var(--font-mono)",
                          bgcolor: isChanged ? "success.main" : isInf ? "rgba(148,163,184,0.1)" : "rgba(59,130,246,0.1)", color: isChanged ? "#fff" : isInf ? "text.disabled" : "primary.main",
                          border: "1px solid", borderColor: isChanged ? "success.main" : isInf ? "rgba(148,163,184,0.2)" : "rgba(59,130,246,0.3)" }} />
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
