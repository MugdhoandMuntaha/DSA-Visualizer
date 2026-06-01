"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import { useThemeMode } from "@/components/ThemeRegistry";
import {
  GraphNode,
  GraphEdge,
  AlgoColorSchemes,
  LIGHT_COLORS,
  DARK_COLORS,
  nodeAt,
  edgeAt,
  InteractionMode,
} from "@/lib/graphUtils";

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  mode: InteractionMode;
  nodeRadius: number;
  edgeBaseWidth: number;
  edgeStart: number | null;
  visualMode?: "modern" | "notebook";
  directed?: boolean;
  showWeights?: boolean;
  // Algorithm state
  currentNodeId?: number | null;
  highlightEdge?: { from: number; to: number } | null;
  mstEdges?: GraphEdge[];
  neighborChecking?: number | null;
  visitedSet?: Set<number>;
  queueIds?: number[];
  // Callbacks
  onCanvasClick: (x: number, y: number) => void;
  onNodeClick: (node: GraphNode) => void;
  onEdgeClick: (edge: GraphEdge) => void;
  onNodeDrag: (id: number, x: number, y: number) => void;
  getCanvasSize?: () => { w: number; h: number };
}

// Custom sketchy drawing helper functions for Notebook Mode
function drawSketchyLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";

  // Draw 2 sketchy passes
  for (let pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    // Add small random noise to starting coordinate
    const sx = x1 + (Math.random() - 0.5) * 0.8;
    const sy = y1 + (Math.random() - 0.5) * 0.8;
    ctx.moveTo(sx, sy);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    // Subdivide the line to wobble it
    const steps = Math.max(3, Math.floor(len / 35));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = x1 + dx * t;
      const py = y1 + dy * t;

      if (i === steps) {
        ctx.lineTo(x2 + (Math.random() - 0.5) * 0.8, y2 + (Math.random() - 0.5) * 0.8);
      } else {
        // wobble perp to line
        const perpX = -dy / len;
        const perpY = dx / len;
        const wobble = (Math.random() - 0.5) * 1.5;
        ctx.lineTo(
          px + perpX * wobble + (Math.random() - 0.5) * 0.4,
          py + perpY * wobble + (Math.random() - 0.5) * 0.4
        );
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawSketchyCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fillColor: string,
  strokeColor: string,
  strokeWidth: number,
  isDoubleCircle = false
) {
  ctx.save();
  ctx.lineCap = "round";

  // Fill inside with soft marker color
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();

  const drawPass = (rad: number) => {
    // Draw sketch stroke twice
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      const steps = 36;
      const startAngle = Math.random() * Math.PI * 2;

      for (let i = 0; i <= steps + 1; i++) {
        const angle = startAngle + (i / steps) * Math.PI * 2;
        // wobble the radius slightly
        const wobble = (Math.random() - 0.5) * 1.2;
        const curR = rad + wobble;
        const px = cx + Math.cos(angle) * curR;
        const py = cy + Math.sin(angle) * curR;

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }
  };

  drawPass(r);
  if (isDoubleCircle) {
    drawPass(r + 5); // outer circle for double circle representation
  }

  ctx.restore();
}

export default function GraphCanvas({
  nodes,
  edges,
  mode,
  nodeRadius,
  edgeBaseWidth,
  edgeStart,
  showWeights = false,
  visualMode = "modern",
  directed = false,
  currentNodeId,
  highlightEdge,
  mstEdges = [],
  neighborChecking,
  visitedSet = new Set(),
  queueIds = [],
  onCanvasClick,
  onNodeClick,
  onEdgeClick,
  onNodeDrag,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ node: GraphNode; offX: number; offY: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number; hasDragged: boolean } | null>(null);
  const { mode: themeMode } = useThemeMode();

  const getColors = useCallback((): AlgoColorSchemes => {
    if (visualMode === "notebook") {
      return {
        unvisited: { fill: "#ffffff", stroke: "#0f172a", text: "#0f172a" }, // navy/dark blue ink
        inQueue: { fill: "#eff6ff", stroke: "#2563eb", text: "#2563eb" },   // blue ink
        current: { fill: "#fef2f2", stroke: "#dc2626", text: "#dc2626" },   // red ink
        visited: { fill: "#f0fdf4", stroke: "#16a34a", text: "#16a34a" },   // green ink
        neighbor: { fill: "#faf5ff", stroke: "#7c3aed", text: "#7c3aed" },  // purple ink
      };
    }
    return themeMode === "dark" ? DARK_COLORS : LIGHT_COLORS;
  }, [themeMode, visualMode]);

  const getNodeColor = useCallback(
    (n: GraphNode) => {
      const colors = getColors();
      if (n.id === currentNodeId) return colors.current;
      if (neighborChecking === n.id) return colors.neighbor;
      if (visitedSet.has(n.id) && !queueIds.includes(n.id)) return colors.visited;
      if (queueIds.includes(n.id)) return colors.inQueue;
      return colors.unvisited;
    },
    [currentNodeId, neighborChecking, visitedSet, queueIds, getColors]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width / devicePixelRatio;
    const h = canvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    // Grid / Background
    if (visualMode === "notebook") {
      ctx.save();
      // Cream notebook paper background
      ctx.fillStyle = "#fdfbf7";
      ctx.fillRect(0, 0, w, h);

      // Blue horizontal rules (infinite wrap/pan)
      ctx.strokeStyle = "rgba(59, 130, 246, 0.16)";
      ctx.lineWidth = 1;
      const startY = (pan.y % 28) - 28;
      for (let y = startY; y < h + 28; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Red double margin line on the left (pans horizontally)
      ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(68 + pan.x, 0);
      ctx.lineTo(68 + pan.x, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(72 + pan.x, 0);
      ctx.lineTo(72 + pan.x, h);
      ctx.stroke();
      
      ctx.restore();
    } else {
      ctx.save();
      ctx.strokeStyle = themeMode === "dark" ? "rgba(99,102,241,0.04)" : "rgba(99,102,241,0.06)";
      ctx.lineWidth = 1;
      const step = 40;
      const startX = (pan.x % step) - step;
      const startY = (pan.y % step) - step;
      for (let x = startX; x < w + step; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = startY; y < h + step; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Save and translate coordinate system for graph elements (Nodes, Edges, Weights)
    ctx.save();
    ctx.translate(pan.x, pan.y);

    // Edges
    edges.forEach((e) => {
      const a = nodes.find((n) => n.id === e.from);
      const b = nodes.find((n) => n.id === e.to);
      if (!a || !b) return;

      const isHighlighted =
        highlightEdge &&
        ((highlightEdge.from === e.from && highlightEdge.to === e.to) ||
          (!directed && highlightEdge.from === e.to && highlightEdge.to === e.from));
          
      const isMst = mstEdges.some(me => 
        (me.from === e.from && me.to === e.to) || (me.from === e.to && me.to === e.from));

      // Calculate line start/end offset by nodeRadius from node center
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const startX = dist === 0 ? a.x : a.x + (dx * nodeRadius) / dist;
      const startY = dist === 0 ? a.y : a.y + (dy * nodeRadius) / dist;
      const endX = dist === 0 ? b.x : b.x - (dx * nodeRadius) / dist;
      const endY = dist === 0 ? b.y : b.y - (dy * nodeRadius) / dist;

      // Arrowhead calculations
      const angle = Math.atan2(dy, dx);
      const arrowLength = 12;
      const arrowWidth = 6;
      const x_b = endX - arrowLength * Math.cos(angle);
      const y_b = endY - arrowLength * Math.sin(angle);
      const xc1 = x_b - arrowWidth * Math.sin(angle);
      const yc1 = y_b + arrowWidth * Math.cos(angle);
      const xc2 = x_b + arrowWidth * Math.sin(angle);
      const yc2 = y_b - arrowWidth * Math.cos(angle);

      if (visualMode === "notebook") {
        let color = "#334155"; // standard dark grey ink
        let width = edgeBaseWidth + 0.5;

        if (isHighlighted) {
          color = "#dc2626"; // red pen
          width = edgeBaseWidth + 1.5;
        } else if (isMst) {
          color = "#16a34a"; // green pen
          width = edgeBaseWidth + 1.5;
        }

        drawSketchyLine(ctx, startX, startY, endX, endY, color, width);

        // Arrowhead for directed edges in notebook mode
        if (directed) {
          ctx.save();
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(xc1 + (Math.random() - 0.5) * 1.5, yc1 + (Math.random() - 0.5) * 1.5);
          ctx.lineTo(xc2 + (Math.random() - 0.5) * 1.5, yc2 + (Math.random() - 0.5) * 1.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Edge weights in Notebook mode
        if (showWeights && e.weight !== undefined) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const fontSize = Math.max(12, nodeRadius * 0.65);
          ctx.save();
          ctx.font = `800 ${fontSize}px 'JetBrains Mono', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          // Draw a small background circle/box for weight slightly transparent
          const text = String(e.weight);
          ctx.fillStyle = "rgba(253, 251, 247, 0.85)";
          const tw = ctx.measureText(text).width + 6;
          ctx.beginPath();
          ctx.arc(mx, my, tw / 2 + 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = isHighlighted ? "#dc2626" : "#0f172a";
          ctx.fillText(text, mx, my);
          ctx.restore();
        }
      } else {
        ctx.save();
        let color = themeMode === "dark" ? "rgba(71,85,105,0.5)" : "rgba(71,85,105,0.6)";
        let width = edgeBaseWidth;

        if (isHighlighted) {
          color = themeMode === "dark" ? "#fbbf24" : "#d97706";
          width = edgeBaseWidth + 2;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
        } else if (isMst) {
          color = themeMode === "dark" ? "#34d399" : "#10b981"; // Emerald green
          width = edgeBaseWidth + 1.5;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();

        // Arrowhead for directed edges in modern mode
        if (directed) {
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(xc1, yc1);
          ctx.lineTo(xc2, yc2);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
        }

        // Weight label
        if (showWeights && e.weight !== undefined) {
          ctx.shadowBlur = 0;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const fontSize = Math.max(10, nodeRadius * 0.5);
          ctx.font = `700 ${fontSize}px 'Inter', sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // Background pill
          const text = String(e.weight);
          const tw = ctx.measureText(text).width + 8;
          ctx.fillStyle = themeMode === "dark" ? "#1e293b" : "#ffffff";
          ctx.beginPath();
          ctx.roundRect(mx - tw / 2, my - fontSize / 2 - 2, tw, fontSize + 4, 4);
          ctx.fill();
          ctx.strokeStyle = themeMode === "dark" ? "rgba(71,85,105,0.5)" : "rgba(148,163,184,0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = themeMode === "dark" ? "#fbbf24" : "#d97706";
          ctx.fillText(text, mx, my);
        }
        ctx.restore();
      }
    });

    // Nodes
    nodes.forEach((n) => {
      const c = getNodeColor(n);
      
      if (visualMode === "notebook") {
        ctx.save();
        // Check if this is the source node. The source node gets a double circle in the user sketch!
        // In Dijkstra's, we can check if it is node ID 0 (the default source) or the current dijkstra source.
        // Wait, how do we know if it's the source? Let's check if n.label === "0" or n.id === 0 (the initial node).
        // Since the preset has Node 0 as source, let's treat the node labeled "0" (or label match) as the source,
        // or node id 0. Let's make it n.id === 0 (or label === "0") to draw a double circle!
        const isSource = n.id === 0 || n.label === "0";
        
        drawSketchyCircle(ctx, n.x, n.y, nodeRadius, c.fill, c.stroke, 2.2, isSource);
        
        // Draw handwritten label text
        ctx.fillStyle = c.text;
        const fontSize = Math.max(13, Math.round(nodeRadius * 0.7));
        ctx.font = `800 ${fontSize}px 'Inter', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, n.x, n.y);
        
        // Highlight active select dashed ring
        if (edgeStart === n.id) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, nodeRadius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(124, 58, 237, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
        }
        ctx.restore();
      } else {
        ctx.save();
        if (c !== getColors().unvisited) {
          ctx.shadowColor = c.stroke;
          ctx.shadowBlur = 18;
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = c.fill;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = c.stroke;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = c.text;
        const fontSize = Math.max(11, Math.round(nodeRadius * 0.65));
        ctx.font = `800 ${fontSize}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, n.x, n.y);

        if (edgeStart === n.id) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, nodeRadius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = "#a78bfa";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }
    });

    // Restore coordinate system translation
    ctx.restore();
  }, [
    nodes,
    edges,
    nodeRadius,
    edgeBaseWidth,
    edgeStart,
    showWeights,
    visualMode,
    currentNodeId,
    highlightEdge,
    mstEdges,
    neighborChecking,
    visitedSet,
    queueIds,
    themeMode,
    getNodeColor,
    getColors,
    pan.x,
    pan.y,
  ]);

  // Resize
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    if (width === 0 || height === 0) return;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    draw();
  }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    resize();

    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [resize]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const p = getPos(e);
    const gx = p.x - pan.x;
    const gy = p.y - pan.y;
    const hitNode = nodeAt(nodes, gx, gy, nodeRadius);

    if (hitNode && mode === "move") {
      dragRef.current = {
        node: hitNode,
        offX: p.x - hitNode.x,
        offY: p.y - hitNode.y,
      };
    } else {
      panRef.current = {
        startX: p.x,
        startY: p.y,
        startPanX: pan.x,
        startPanY: pan.y,
        hasDragged: false,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const p = getPos(e);
    const gx = p.x - pan.x;
    const gy = p.y - pan.y;

    if (dragRef.current) {
      onNodeDrag(
        dragRef.current.node.id,
        p.x - dragRef.current.offX,
        p.y - dragRef.current.offY
      );
    } else if (panRef.current) {
      const dx = p.x - panRef.current.startX;
      const dy = p.y - panRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        panRef.current.hasDragged = true;
      }
      setPan({
        x: panRef.current.startPanX + dx,
        y: panRef.current.startPanY + dy,
      });
    }

    // Cursor
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hit = nodeAt(nodes, gx, gy, nodeRadius);
    const hitEdge = edgeAt(edges, nodes, gx, gy);

    if (dragRef.current) {
      canvas.style.cursor = "grabbing";
    } else if (panRef.current && panRef.current.hasDragged) {
      canvas.style.cursor = "grabbing";
    } else if (mode === "move") {
      canvas.style.cursor = hit ? "grab" : "grab";
    } else if (mode === "delete") {
      canvas.style.cursor = hit || hitEdge ? "pointer" : "grab";
    } else if (mode === "edge") {
      canvas.style.cursor = hit || hitEdge ? "pointer" : "grab";
    } else {
      canvas.style.cursor = hit ? "pointer" : "grab";
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const p = getPos(e);
    const gx = p.x - pan.x;
    const gy = p.y - pan.y;

    if (dragRef.current) {
      dragRef.current = null;
    }

    if (panRef.current) {
      if (!panRef.current.hasDragged) {
        const hitNode = nodeAt(nodes, gx, gy, nodeRadius);
        if (hitNode) {
          if (mode === "edge" || mode === "delete") {
            onNodeClick(hitNode);
          }
        } else {
          const hitEdge = edgeAt(edges, nodes, gx, gy);
          if (hitEdge) {
            onEdgeClick(hitEdge);
          } else if (mode === "node") {
            onCanvasClick(gx, gy);
          }
        }
      }
      panRef.current = null;
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        background: (theme) =>
          `radial-gradient(ellipse at 30% 20%, ${
            theme.palette.mode === "dark"
              ? "rgba(99,102,241,0.06)"
              : "rgba(99,102,241,0.04)"
          }, transparent 60%), radial-gradient(ellipse at 70% 80%, ${
            theme.palette.mode === "dark"
              ? "rgba(34,211,233,0.04)"
              : "rgba(34,211,233,0.03)"
          }, transparent 60%), ${theme.palette.background.default}`,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </Box>
  );
}
