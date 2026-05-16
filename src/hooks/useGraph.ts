"use client";
import { useState, useCallback } from "react";
import {
  GraphNode,
  GraphEdge,
  InteractionMode,
  makeLabel,
  edgeExists,
} from "@/lib/graphUtils";

interface UseGraphReturn {
  nodes: GraphNode[];
  edges: GraphEdge[];
  mode: InteractionMode;
  setMode: (m: InteractionMode) => void;
  edgeStart: number | null;
  setEdgeStart: (id: number | null) => void;
  addNode: (x: number, y: number) => void;
  addEdge: (a: number, b: number, weight?: number) => void;
  deleteNode: (id: number) => void;
  deleteEdge: (e: GraphEdge) => void;
  moveNode: (id: number, x: number, y: number) => void;
  clearGraph: () => void;
  loadPreset: (
    type: "tree" | "grid" | "random",
    canvasW: number,
    canvasH: number,
    weighted?: boolean
  ) => void;
  setNodes: React.Dispatch<React.SetStateAction<GraphNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<GraphEdge[]>>;
  labelType: "number" | "letter";
  toggleLabelType: () => void;
}

export function useGraph(): UseGraphReturn {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [nextId, setNextId] = useState(0);
  const [mode, setMode] = useState<InteractionMode>("node");
  const [edgeStart, setEdgeStart] = useState<number | null>(null);
  const [labelType, setLabelType] = useState<"number" | "letter">("letter");

  const toggleLabelType = useCallback(() => {
    setLabelType((prev) => {
      const next = prev === "letter" ? "number" : "letter";
      setNodes((nodes) => nodes.map(n => ({ ...n, label: makeLabel(n.id, next) })));
      return next;
    });
  }, []);

  const addNode = useCallback(
    (x: number, y: number) => {
      const label = makeLabel(nextId, labelType);
      setNodes((prev) => [...prev, { id: nextId, x, y, label }]);
      setNextId((prev) => prev + 1);
    },
    [nextId, labelType]
  );

  const addEdge = useCallback(
    (a: number, b: number, weight?: number) => {
      setEdges((prev) => {
        const exists = prev.some((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a));
        if (exists) {
          return prev.map((e) =>
            (e.from === a && e.to === b) || (e.from === b && e.to === a)
              ? { ...e, weight }
              : e
          );
        }
        return [...prev, { from: a, to: b, weight }];
      });
    },
    []
  );

  const deleteNode = useCallback((id: number) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
  }, []);

  const deleteEdge = useCallback((edge: GraphEdge) => {
    setEdges((prev) => prev.filter((e) => e !== edge));
  }, []);

  const moveNode = useCallback((id: number, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  }, []);

  const clearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNextId(0);
    setEdgeStart(null);
  }, []);

  const loadPreset = useCallback(
    (
      type: "tree" | "grid" | "random",
      canvasW: number,
      canvasH: number,
      weighted?: boolean
    ) => {
      const newNodes: GraphNode[] = [];
      const newEdges: GraphEdge[] = [];
      let id = 0;
      const cx = canvasW / 2;
      const cy = canvasH / 2;

      const add = (x: number, y: number) => {
        newNodes.push({ id, x, y, label: makeLabel(id, labelType) });
        id++;
      };
      const link = (a: number, b: number) => {
        const w = weighted ? Math.floor(Math.random() * 9) + 1 : undefined;
        newEdges.push({ from: a, to: b, weight: w });
      };

      if (type === "tree") {
        const positions: [number, number][] = [
          [cx, cy - 130],
          [cx - 140, cy - 30],
          [cx + 140, cy - 30],
          [cx - 210, cy + 80],
          [cx - 70, cy + 80],
          [cx + 70, cy + 80],
          [cx + 210, cy + 80],
        ];
        positions.forEach(([x, y]) => add(x, y));
        [
          [0, 1],
          [0, 2],
          [1, 3],
          [1, 4],
          [2, 5],
          [2, 6],
        ].forEach(([a, b]) => link(a, b));
      } else if (type === "grid") {
        const s = 90,
          cols = 4,
          rows = 3;
        const ox = cx - ((cols - 1) * s) / 2;
        const oy = cy - ((rows - 1) * s) / 2;
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) add(ox + c * s, oy + r * s);
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const nid = r * cols + c;
            if (c < cols - 1) link(nid, nid + 1);
            if (r < rows - 1) link(nid, nid + cols);
          }
      } else {
        const count = 8;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const r = 120 + Math.random() * 60;
          add(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        }
        for (let i = 1; i < count; i++) {
          const target = Math.floor(Math.random() * i);
          link(i, target);
        }
        for (let i = 0; i < 3; i++) {
          const a = Math.floor(Math.random() * count);
          const b = Math.floor(Math.random() * count);
          if (a !== b && !newEdges.some((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a)))
            link(a, b);
        }
      }

      setNodes(newNodes);
      setEdges(newEdges);
      setNextId(id);
      setEdgeStart(null);
    },
    [labelType]
  );

  return {
    nodes,
    edges,
    mode,
    setMode,
    edgeStart,
    setEdgeStart,
    addNode,
    addEdge,
    deleteNode,
    deleteEdge,
    moveNode,
    clearGraph,
    loadPreset,
    setNodes,
    setEdges,
    labelType,
    toggleLabelType,
  };
}
