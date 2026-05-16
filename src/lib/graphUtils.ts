// Graph utility types and functions shared across all algorithm visualizers

export interface GraphNode {
  id: number;
  x: number;
  y: number;
  label: string;
}

export interface GraphEdge {
  from: number;
  to: number;
  weight?: number;
}

export type InteractionMode = "node" | "edge" | "move" | "delete";

export interface NodeColorScheme {
  fill: string;
  stroke: string;
  text: string;
}

export interface AlgoColorSchemes {
  unvisited: NodeColorScheme;
  inQueue: NodeColorScheme;
  current: NodeColorScheme;
  visited: NodeColorScheme;
  neighbor: NodeColorScheme;
}

export const LIGHT_COLORS: AlgoColorSchemes = {
  unvisited: { fill: "#ffffff", stroke: "#94a3b8", text: "#334155" },
  inQueue: { fill: "rgba(59,130,246,0.12)", stroke: "#3b82f6", text: "#2563eb" },
  current: { fill: "rgba(217,119,6,0.14)", stroke: "#d97706", text: "#b45309" },
  visited: { fill: "rgba(16,185,129,0.12)", stroke: "#10b981", text: "#059669" },
  neighbor: { fill: "rgba(124,58,237,0.12)", stroke: "#7c3aed", text: "#6d28d9" },
};

export const DARK_COLORS: AlgoColorSchemes = {
  unvisited: { fill: "#1e293b", stroke: "#475569", text: "#cbd5e1" },
  inQueue: { fill: "rgba(96,165,250,0.18)", stroke: "#60a5fa", text: "#60a5fa" },
  current: { fill: "rgba(251,191,36,0.22)", stroke: "#fbbf24", text: "#fbbf24" },
  visited: { fill: "rgba(52,211,153,0.18)", stroke: "#34d399", text: "#34d399" },
  neighbor: { fill: "rgba(167,139,250,0.18)", stroke: "#a78bfa", text: "#a78bfa" },
};

export function nodeAt(
  nodes: GraphNode[],
  x: number,
  y: number,
  nodeRadius: number
): GraphNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (Math.hypot(n.x - x, n.y - y) <= nodeRadius + 4) return n;
  }
  return null;
}

export function edgeAt(
  edges: GraphEdge[],
  nodes: GraphNode[],
  x: number,
  y: number
): GraphEdge | null {
  for (const e of edges) {
    const a = nodes.find((n) => n.id === e.from);
    const b = nodes.find((n) => n.id === e.to);
    if (!a || !b) continue;
    const dist = pointToSegDist(x, y, a.x, a.y, b.x, b.y);
    if (dist < 8) return e;
  }
  return null;
}

function pointToSegDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1,
    dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function getNeighbors(
  id: number,
  edges: GraphEdge[],
  nodes: GraphNode[]
): number[] {
  const res: number[] = [];
  edges.forEach((e) => {
    if (e.from === id) res.push(e.to);
    else if (e.to === id) res.push(e.from);
  });
  return res.sort((a, b) => {
    const la = nodes.find((n) => n.id === a)?.label || "";
    const lb = nodes.find((n) => n.id === b)?.label || "";
    return la.localeCompare(lb);
  });
}

export function edgeExists(
  edges: GraphEdge[],
  a: number,
  b: number
): boolean {
  return edges.some(
    (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a)
  );
}

export function makeLabel(id: number, type: "number" | "letter" = "letter"): string {
  if (type === "number") return id.toString();
  return (
    String.fromCharCode(65 + (id % 26)) +
    (id >= 26 ? Math.floor(id / 26).toString() : "")
  );
}
