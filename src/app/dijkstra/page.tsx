"use client";
import { useState, useCallback, useEffect, useRef } from "react";
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
import Menu from "@mui/icons-material/Menu";
import Header from "@/components/Header";
import GraphCanvas from "@/components/GraphCanvas";
import AlgoSteps, { StepDef } from "@/components/AlgoSteps";
import { useGraph } from "@/hooks/useGraph";
import { useDijkstra } from "@/hooks/useDijkstra";
import { GraphNode, GraphEdge, InteractionMode } from "@/lib/graphUtils";

const DIJKSTRA_STEPS: StepDef[] = [
  { id: "pre-init", title: "vector<int> dist(V, INF);", description: "Initialize all node distances to infinity." },
  { id: "init", title: "dist[src] = 0; pq.push({0,src});", description: "Set source distance to 0 and push to PQ." },
  { id: "while", title: "while(!pq.empty())", description: "Process until the priority queue is empty." },
  { id: "extract", title: "auto top = pq.top(); pq.pop();", description: "Get node with smallest distance." },
  { id: "for-loop", title: "for(auto &nbr: adj[currNode])", description: "Iterate over weighted neighbors." },
  { id: "relax", title: "if(currDist + weight < dist[neighbor])", description: "Check if a shorter path is found." },
  { id: "update", title: "dist[neighbor] = ...; pq.push(...);", description: "Update distance and push to PQ." },
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
            <Box key={node.id} sx={{ width: 46.5, textAlign: "center", fontSize: "0.9rem", fontWeight: 700, mt: 0.1, color: "#475569" }}>
              {node.label}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default function DijkstraPage() {
  const graph = useGraph();
  const dijkstra = useDijkstra(graph.nodes, graph.edges);
  const [sourceId, setSourceId] = useState("");
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
  }, []);

  // Reset sourceId if the selected node is deleted
  useEffect(() => {
    if (sourceId && !graph.nodes.some(n => String(n.id) === sourceId)) {
      setSourceId("");
    }
  }, [graph.nodes, sourceId]);

  // Track the history of distance array updates during dijkstra steps
  useEffect(() => {
    if (dijkstra.activeStepIdx === -1) {
      setDistHistory([]);
      return;
    }

    if (!dijkstra.running) return;

    const currentDist = new Map(dijkstra.distances);
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
  }, [dijkstra.distances, dijkstra.activeStepIdx, dijkstra.running]);

  // Scroll to bottom of distance stack
  useEffect(() => {
    if (distContainerRef.current) {
      distContainerRef.current.scrollTop = distContainerRef.current.scrollHeight;
    }
  }, [distHistory]);

  const getNeighborsForAdjList = useCallback((nodeId: number) => {
    const res: { id: number; label: string; weight: number }[] = [];
    graph.edges.forEach((e) => {
      if (e.from === nodeId) {
        const target = graph.nodes.find(n => n.id === e.to);
        if (target) res.push({ id: target.id, label: target.label, weight: e.weight ?? 1 });
      } else if (e.to === nodeId) {
        const target = graph.nodes.find(n => n.id === e.from);
        if (target) res.push({ id: target.id, label: target.label, weight: e.weight ?? 1 });
      }
    });
    return res.sort((a, b) => a.label.localeCompare(b.label));
  }, [graph.nodes, graph.edges]);

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

  const handlePreset = (type: "tree" | "grid" | "random" | "notebook") => {
    if (dijkstra.running) return;
    dijkstra.resetDijkstra();
    graph.clearGraph();
    // Wait briefly for canvas resizing
    const h = type === "notebook" ? 250 : 480;
    setTimeout(() => graph.loadPreset(type, 750, h, true), 50);
    setSourceId(type === "notebook" ? "0" : "");
  };

  const handleStart = useCallback(() => {
    const id = parseInt(sourceId);
    if (!isNaN(id)) dijkstra.startDijkstra(id);
  }, [sourceId, dijkstra]);

  const handleStep = useCallback(() => {
    const id = parseInt(sourceId);
    if (!isNaN(id)) dijkstra.stepDijkstra(id);
  }, [sourceId, dijkstra]);

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
        dijkstra.prevStepDijkstra();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStep, dijkstra]);

  const tagColor: Record<string, string> = {
    init: "#7c3aed", "while-check": "#ea580c", "extract-min": "#d97706", "for-loop": "#7c3aed",
    relax: "#10b981", "no-relax": "#94a3b8", "skip-neighbor": "#94a3b8", skip: "#94a3b8",
    "loop-back": "#ea580c", done: "#0891b2",
  };

  const lbl = useCallback(
    (id: number) => graph.nodes.find((n) => n.id === id)?.label || String(id),
    [graph.nodes]
  );

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: visualMode === "notebook" ? "#f3ede2" : "background.default" }}>
      {/* Dynamic Font Loading */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@600;700&display=swap" rel="stylesheet" />

      <Header title="Dijkstra's Visualizer" badge="Shortest Path" />

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
                onChange={(_, v: InteractionMode | null) => { if (v && !dijkstra.running) graph.setMode(v); }}
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
                    color: "#451a03 !important", // force dark brown ink color
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
                  color: "#0f172a !important", // force dark slate text color
                  border: "1.5px solid #ca8a04",
                  height: 32,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-select": { color: "#0f172a !important" }, // selected text
                  "& .MuiSvgIcon-root": { color: "#ca8a04 !important" }, // dropdown arrow
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
                onChange={(_, v) => dijkstra.setSpeed(v as number)}
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
                disabled={!sourceId || (dijkstra.running && !dijkstra.paused)}
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
                startIcon={dijkstra.paused ? <PlayArrow /> : <Pause />}
                onClick={dijkstra.togglePause}
                disabled={!dijkstra.running}
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
                {dijkstra.paused ? "Resume" : "Pause"}
              </Button>

              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<RestartAlt />}
                onClick={dijkstra.resetDijkstra}
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
                {DIJKSTRA_STEPS.map((step, idx) => {
                  const isActive = dijkstra.activeStepIdx === idx;
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
                    TOPIC NAME: <span style={{ color: "#2563eb", textDecoration: "underline" }}>Dijkstra's Algorithm (Single Source Shortest Path)</span>
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "1.0rem", color: "#64748b", fontWeight: 700 }}>
                  DAY: <span style={{ color: "#2563eb" }}>Monday</span> &nbsp;&nbsp;&nbsp;&nbsp; TIME: <span style={{ color: "#2563eb" }}>10:15 AM</span> &nbsp;&nbsp;&nbsp;&nbsp; DATE: <span style={{ color: "#2563eb" }}>25/05/2026</span>
                </Typography>
              </Box>
            </Box>

            {/* Ruled Sketch Canvas Component */}
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
                currentNodeId={dijkstra.currentNodeId}
                highlightEdge={dijkstra.highlightEdge}
                neighborChecking={dijkstra.neighborChecking}
                visitedSet={dijkstra.visited}
                queueIds={dijkstra.pq.map(p => p.id)}
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

              {/* Column 1: Adjacency List */}
              <Box sx={{ flex: 1.1, display: "flex", flexDirection: "column", zIndex: 1, overflow: "hidden", height: "100%" }}>
                <Typography sx={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#1e3a8a",
                  mb: 0.5,
                  textDecoration: "underline"
                }}>
                  Adjacency List:
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
                  {graph.nodes.map(node => {
                    const neighbors = getNeighborsForAdjList(node.id);
                    const isActiveNode = node.id === dijkstra.currentNodeId;
                    return (
                      <Box 
                        key={node.id} 
                        sx={{ 
                          fontFamily: "var(--font-mono)", 
                          fontSize: "1.1rem", 
                          py: 0.2, 
                          display: "flex", 
                          alignItems: "center",
                          bgcolor: isActiveNode ? "rgba(15, 23, 42, 0.03)" : "transparent",
                          borderRadius: "4px",
                          px: 0.5
                        }}
                      >
                        <span style={{ 
                          fontWeight: isActiveNode ? "bold" : "normal",
                          color: isActiveNode ? "#1e3a8a" : "#0f172a" 
                        }}>
                          {node.label}
                        </span>
                        <span style={{ color: "#64748b", margin: "0 6px" }}>&rarr;</span>
                        <span>{"{"}</span>
                        {neighbors.length === 0 ? (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>empty</span>
                        ) : (
                          neighbors.map((nb, i) => {
                            const isCurrentPair = isActiveNode && nb.id === dijkstra.neighborChecking;
                            return (
                              <span key={nb.id}>
                                {i > 0 && <span style={{ color: "#64748b" }}>, </span>}
                                <span style={{
                                  fontWeight: isCurrentPair ? "bold" : "normal",
                                  color: isCurrentPair ? "#dc2626" : "#0f172a",
                                  backgroundColor: isCurrentPair ? "rgba(253, 224, 71, 0.6)" : "transparent",
                                  padding: isCurrentPair ? "1px 4px" : "0",
                                  borderRadius: isCurrentPair ? "3px" : "0",
                                  border: isCurrentPair ? "1px dashed #ca8a04" : "none",
                                  display: "inline-block"
                                }}>
                                  ({nb.label}, {nb.weight})
                                </span>
                              </span>
                            );
                          })
                        )}
                        <span>{"}"}</span>
                      </Box>
                    );
                  })}
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
                  Src = {dijkstra.sourceNodeId !== null ? lbl(dijkstra.sourceNodeId) : "0"}
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

              {/* Middle Column: Mathematical Scratchpad Relaxation details */}
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
                  {dijkstra.currentNodeId !== null ? (
                    <Box sx={{ lineHeight: 1.45 }}>
                      <div>Current node: <b>{lbl(dijkstra.currentNodeId)}</b> (distance = <b>{dijkstra.currentDist === Infinity ? '∞' : dijkstra.currentDist}</b>)</div>
                      {dijkstra.neighborChecking !== null ? (
                        <Box sx={{ mt: 0.5 }}>
                          <div>Checking neighbor <b>{lbl(dijkstra.neighborChecking)}</b> (edge weight = <b>{dijkstra.neighborWeight}</b>)</div>
                          <div style={{ color: dijkstra.relaxResult === 'relaxed' ? "#16a34a" : "#dc2626", fontWeight: "500", marginTop: "6px", fontSize: "1.05rem" }}>
                            • New path weight = {dijkstra.currentDist} + {dijkstra.neighborWeight} = <b>{dijkstra.newDist}</b> <br />
                            • Old distance to {lbl(dijkstra.neighborChecking)} = <b>{dijkstra.oldDist === Infinity ? '∞' : dijkstra.oldDist}</b> <br />
                            <div style={{ marginTop: "4px", fontWeight: "bold" }}>
                              {dijkstra.relaxResult === 'relaxed' ? (
                                <span>✔ Yes, {dijkstra.newDist} &lt; {dijkstra.oldDist === Infinity ? '∞' : dijkstra.oldDist}! Update distance and push node {lbl(dijkstra.neighborChecking)} to PQ! ✍️</span>
                              ) : (
                                <span>✖ No, {dijkstra.newDist} is not shorter than {dijkstra.oldDist === Infinity ? '∞' : dijkstra.oldDist}. Keep old distance.</span>
                              )}
                            </div>
                          </div>
                        </Box>
                      ) : (
                        <div style={{ color: "#64748b", fontStyle: "italic", marginTop: "6px" }}>Scanning neighbors of node {lbl(dijkstra.currentNodeId)}...</div>
                      )}
                    </Box>
                  ) : (
                    <div style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.95rem" }}>Choose source, press Start or Step to watch the dry run trace.</div>
                  )}
                </Box>
              </Box>

              {/* Right Column: Priority Queue vertical beaker/cup container */}
              <Box sx={{ width: 130, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, mr: 1 }}>
                <Box sx={{
                  borderLeft: "3px solid #0f172a",
                  borderRight: "3px solid #0f172a",
                  borderBottom: "3px solid #0f172a",
                  borderRadius: "0 0 14px 14px",
                  width: 105,
                  height: 140,
                  display: "flex",
                  flexDirection: "column-reverse",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  p: 0.75,
                  pb: 1.25,
                  bgcolor: "rgba(255,255,255,0.45)",
                  boxShadow: "0px 3px 5px rgba(0,0,0,0.05)",
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { width: "3px" },
                  "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(15,23,42,0.12)", borderRadius: "2px" },
                  "&::-webkit-scrollbar-track": { bgcolor: "transparent" }
                }}>
                  {dijkstra.pq.length === 0 ? (
                    <Typography sx={{ fontSize: "1.05rem", color: "#64748b", mb: 2, fontStyle: "italic" }}>empty</Typography>
                  ) : (
                    dijkstra.pq.map((item, idx) => (
                      <Box
                        key={`pq-${item.id}-${idx}`}
                        className="animate-pop-in"
                        sx={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: idx === 0 ? "#dc2626" : "#2563eb",
                          border: idx === 0 ? "2.5px solid #dc2626" : "2.5px solid #2563eb",
                          borderRadius: "4px",
                          bgcolor: "#ffffff",
                          px: 0.5,
                          py: 0.15,
                          my: 0.15,
                          width: "85%",
                          textAlign: "center",
                          boxShadow: "1px 1px 0px rgba(0,0,0,0.1)",
                          flexShrink: 0
                        }}
                      >
                        {`{${item.dist === Infinity ? '∞' : item.dist}, ${lbl(item.id)}}`}
                      </Box>
                    ))
                  )}
                </Box>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", mt: 0.5 }}>
                  pq
                </Typography>
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

            {/* Adjacency List */}
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", display: "block", mb: 1.5 }}>
                Adjacency List
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {graph.nodes.length === 0 ? (
                  <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Empty graph</Typography>
                ) : (
                  graph.nodes.map(node => {
                    const neighbors = getNeighborsForAdjList(node.id);
                    const isActiveNode = node.id === dijkstra.currentNodeId;
                    return (
                      <Box 
                        key={node.id} 
                        sx={{ 
                          fontFamily: "var(--font-mono)", 
                          fontSize: "0.72rem", 
                          py: 0.3, 
                          display: "flex", 
                          alignItems: "center",
                          bgcolor: isActiveNode ? "rgba(99, 102, 241, 0.08)" : "transparent",
                          borderRadius: 1,
                          px: 0.75
                        }}
                      >
                        <span style={{ 
                          fontWeight: isActiveNode ? "bold" : "normal",
                          color: isActiveNode ? "#6366f1" : "inherit" 
                        }}>
                          {node.label}
                        </span>
                        <span style={{ color: "rgba(148, 163, 184, 0.7)", margin: "0 6px" }}>&rarr;</span>
                        <span>{"{"}</span>
                        {neighbors.length === 0 ? (
                          <span style={{ color: "text.disabled", fontStyle: "italic" }}>empty</span>
                        ) : (
                          neighbors.map((nb, i) => {
                            const isCurrentPair = isActiveNode && nb.id === dijkstra.neighborChecking;
                            return (
                              <span key={nb.id}>
                                {i > 0 && <span style={{ color: "text.disabled" }}>, </span>}
                                <span style={{
                                  fontWeight: isCurrentPair ? "bold" : "normal",
                                  color: isCurrentPair ? "#d97706" : "inherit",
                                  backgroundColor: isCurrentPair ? "rgba(217, 119, 6, 0.15)" : "transparent",
                                  padding: isCurrentPair ? "1px 3px" : "0",
                                  borderRadius: isCurrentPair ? "2px" : "0",
                                  border: isCurrentPair ? "1px dashed #d97706" : "none",
                                  display: "inline-block"
                                }}>
                                  ({nb.label}, {nb.weight})
                                </span>
                              </span>
                            );
                          })
                        )}
                        <span>{"}"}</span>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Paper>

            {/* Calculation Details */}
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", lineHeight: 1 }}>Current State</Typography>
              
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "rgba(99,102,241,0.05)", p: 1, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>Source:</Typography>
                <Chip label={dijkstra.sourceNodeId !== null ? graph.nodes.find(n => n.id === dijkstra.sourceNodeId)?.label : "-"} size="small" sx={{ height: 20, fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 700, bgcolor: "rgba(99,102,241,0.1)", color: "primary.main" }} />
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "rgba(217,119,6,0.05)", p: 1, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>Current (u):</Typography>
                <Chip label={dijkstra.currentNodeId !== null ? `${graph.nodes.find(n => n.id === dijkstra.currentNodeId)?.label} (d=${dijkstra.currentDist === Infinity || dijkstra.currentDist === null ? '∞' : dijkstra.currentDist})` : "-"} size="small" sx={{ height: 20, fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 700, bgcolor: "rgba(217,119,6,0.1)", color: "warning.main" }} />
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "rgba(16,185,129,0.05)", p: 1, borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>Neighbor (v):</Typography>
                <Chip label={dijkstra.neighborChecking !== null ? `${graph.nodes.find(n => n.id === dijkstra.neighborChecking)?.label} (w=${dijkstra.neighborWeight})` : "-"} size="small" sx={{ height: 20, fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 700, bgcolor: "rgba(16,185,129,0.1)", color: "success.main" }} />
              </Box>

              <Box sx={{ mt: 0.5, p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" sx={{ display: "block", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "text.secondary", mb: 0.5 }}>
                  Is new path shorter?
                </Typography>
                {dijkstra.neighborChecking !== null && dijkstra.oldDist !== null && dijkstra.newDist !== null ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700 }}>
                      New Path: {dijkstra.currentDist} + {dijkstra.neighborWeight} = {dijkstra.newDist}
                    </Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: dijkstra.relaxResult === 'relaxed' ? "success.main" : "error.main" }}>
                      Old Path: {dijkstra.oldDist === Infinity ? '∞' : dijkstra.oldDist}
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, textAlign: "center", color: dijkstra.relaxResult === 'relaxed' ? "success.main" : "error.main" }}>
                      {dijkstra.relaxResult === 'relaxed' ? "✔ Yes, update & push to PQ!" : "✖ No, keep old distance."}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "text.disabled" }}>Waiting...</Typography>
                )}
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
                    const isChanged = dijkstra.changedNode === n.id;
                    return (
                      <Box key={n.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1.25, py: 0.5, borderRadius: 1,
                        bgcolor: isChanged ? "rgba(16,185,129,0.15)" : v ? "rgba(16,185,129,0.06)" : "action.hover", border: "1px solid", 
                        borderColor: isChanged ? "success.main" : v ? "rgba(16,185,129,0.2)" : "divider", transition: "all 0.3s ease" }}>
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: isChanged ? "success.main" : v ? "success.main" : "text.secondary" }}>{n.label}</Typography>
                        <Chip label={d === undefined || d === Infinity ? "∞" : d} size="small" sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20, fontFamily: "var(--font-mono)",
                          bgcolor: isChanged ? "success.main" : v ? "rgba(16,185,129,0.1)" : "action.hover", color: isChanged ? "#fff" : v ? "success.main" : "text.secondary", transition: "all 0.3s ease" }} />
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
      )}

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
