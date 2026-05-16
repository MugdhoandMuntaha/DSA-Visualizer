"use client";
import { useRef, useEffect, useCallback } from "react";
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

export default function GraphCanvas({
  nodes,
  edges,
  mode,
  nodeRadius,
  edgeBaseWidth,
  edgeStart,
  showWeights = false,
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
  const { mode: themeMode } = useThemeMode();

  const getColors = useCallback((): AlgoColorSchemes => {
    return themeMode === "dark" ? DARK_COLORS : LIGHT_COLORS;
  }, [themeMode]);

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

    // Grid
    ctx.save();
    ctx.strokeStyle = themeMode === "dark" ? "rgba(99,102,241,0.04)" : "rgba(99,102,241,0.06)";
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();

    // Edges
    edges.forEach((e) => {
      const a = nodes.find((n) => n.id === e.from);
      const b = nodes.find((n) => n.id === e.to);
      if (!a || !b) return;
      ctx.save();

      const isHighlighted =
        highlightEdge &&
        ((highlightEdge.from === e.from && highlightEdge.to === e.to) ||
          (highlightEdge.from === e.to && highlightEdge.to === e.from));
          
      const isMst = mstEdges.some(me => 
        (me.from === e.from && me.to === e.to) || (me.from === e.to && me.to === e.from));

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
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();

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
    });

    // Nodes
    nodes.forEach((n) => {
      const c = getNodeColor(n);
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
    });
  }, [
    nodes,
    edges,
    nodeRadius,
    edgeBaseWidth,
    edgeStart,
    showWeights,
    currentNodeId,
    highlightEdge,
    mstEdges,
    neighborChecking,
    visitedSet,
    queueIds,
    themeMode,
    getNodeColor,
    getColors,
  ]);

  // Resize
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    draw();
  }, [draw]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
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
    const hitNode = nodeAt(nodes, p.x, p.y, nodeRadius);

    if (mode === "node") {
      if (!hitNode) onCanvasClick(p.x, p.y);
    } else if (mode === "edge") {
      if (hitNode) onNodeClick(hitNode);
      else {
        const hitEdge = edgeAt(edges, nodes, p.x, p.y);
        if (hitEdge) onEdgeClick(hitEdge);
      }
    } else if (mode === "move") {
      if (hitNode) {
        dragRef.current = {
          node: hitNode,
          offX: p.x - hitNode.x,
          offY: p.y - hitNode.y,
        };
      }
    } else if (mode === "delete") {
      if (hitNode) onNodeClick(hitNode);
      else {
        const hitEdge = edgeAt(edges, nodes, p.x, p.y);
        if (hitEdge) onEdgeClick(hitEdge);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const p = getPos(e);
      onNodeDrag(
        dragRef.current.node.id,
        p.x - dragRef.current.offX,
        p.y - dragRef.current.offY
      );
    }
    // Cursor
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = getPos(e);
    const hit = nodeAt(nodes, p.x, p.y, nodeRadius);
    if (mode === "move") canvas.style.cursor = hit ? "grab" : "default";
    else if (mode === "delete")
      canvas.style.cursor = hit || edgeAt(edges, nodes, p.x, p.y) ? "pointer" : "default";
    else if (mode === "edge") canvas.style.cursor = hit || edgeAt(edges, nodes, p.x, p.y) ? "pointer" : "crosshair";
    else canvas.style.cursor = "crosshair";
  };

  const handleMouseUp = () => {
    dragRef.current = null;
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
      />
    </Box>
  );
}
