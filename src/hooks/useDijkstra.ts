"use client";
import { useState, useCallback, useRef } from "react";
import { GraphNode, GraphEdge } from "@/lib/graphUtils";

export interface DijkstraStep {
  type: string;
  node: number | null;
  neighbor?: number;
  pq: { id: number; dist: number }[];
  distances: Map<number, number>;
  visited: Set<number>;
  edge?: { from: number; to: number };
  msg: string;
  traversalAdd?: number;
}

interface UseDijkstraReturn {
  running: boolean;
  paused: boolean;
  pq: { id: number; dist: number }[];
  distances: Map<number, number>;
  visited: Set<number>;
  traversal: number[];
  temp: number | null;
  currentNodeId: number | null;
  highlightEdge: { from: number; to: number } | null;
  neighborChecking: number | null;
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  startDijkstra: (sourceId: number) => void;
  stepDijkstra: (sourceId: number) => void;
  togglePause: () => void;
  resetDijkstra: () => void;
  setSpeed: (speed: number) => void;
}

function getWeightedNeighbors(
  id: number,
  edges: GraphEdge[],
  nodes: GraphNode[]
): { id: number; weight: number }[] {
  const res: { id: number; weight: number }[] = [];
  edges.forEach((e) => {
    if (e.from === id) res.push({ id: e.to, weight: e.weight ?? 1 });
    else if (e.to === id) res.push({ id: e.from, weight: e.weight ?? 1 });
  });
  return res.sort((a, b) => {
    const la = nodes.find((n) => n.id === a.id)?.label || "";
    const lb = nodes.find((n) => n.id === b.id)?.label || "";
    return la.localeCompare(lb);
  });
}

export function useDijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[]
): UseDijkstraReturn {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pq, setPq] = useState<{ id: number; dist: number }[]>([]);
  const [distances, setDistances] = useState<Map<number, number>>(new Map());
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [traversal, setTraversal] = useState<number[]>([]);
  const [temp, setTemp] = useState<number | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<number | null>(null);
  const [highlightEdge, setHighlightEdge] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [neighborChecking, setNeighborChecking] = useState<number | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>(
    []
  );

  const stepsRef = useRef<DijkstraStep[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);
  const traversalRef = useRef<number[]>([]);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const lbl = useCallback(
    (id: number) => nodes.find((n) => n.id === id)?.label || String(id),
    [nodes]
  );

  const buildSteps = useCallback(
    (sourceId: number): DijkstraStep[] => {
      const steps: DijkstraStep[] = [];
      const dist = new Map<number, number>();
      const vis = new Set<number>();
      const heap: { id: number; dist: number }[] = [];

      nodes.forEach((n) => dist.set(n.id, n.id === sourceId ? 0 : Infinity));
      heap.push({ id: sourceId, dist: 0 });

      steps.push({
        type: "init",
        node: sourceId,
        pq: [...heap],
        distances: new Map(dist),
        visited: new Set(vis),
        msg: `dist[${lbl(sourceId)}] = 0; pq.push({0, ${lbl(sourceId)}});`,
      });

      while (heap.length > 0) {
        heap.sort((a, b) => a.dist - b.dist);

        steps.push({
          type: "while-check",
          node: null,
          pq: [...heap],
          distances: new Map(dist),
          visited: new Set(vis),
          msg: `!pq.empty() is true. PQ size: ${heap.length}`,
        });

        const curr = heap.shift()!;
        
        // C++ code doesn't explicitly skip visited, but we track it for UI coloring.
        if (vis.has(curr.id)) {
          // In user's code, it still iterates, but we can fast-forward or just show it popping.
        }
        vis.add(curr.id);

        steps.push({
          type: "extract-min",
          node: curr.id,
          pq: [...heap],
          distances: new Map(dist),
          visited: new Set(vis),
          msg: `auto top = pq.top(); pq.pop();\ncurrDist = ${curr.dist}, currNode = ${lbl(curr.id)}`,
          traversalAdd: curr.id,
        });

        const nbrs = getWeightedNeighbors(curr.id, edges, nodes);
        steps.push({
          type: "for-loop",
          node: curr.id,
          pq: [...heap],
          distances: new Map(dist),
          visited: new Set(vis),
          msg: `for(auto &nbr: adj[${lbl(curr.id)}]) -> ${nbrs.length} neighbors`,
        });

        for (const nb of nbrs) {
          const newDist = curr.dist + nb.weight;
          const oldDist = dist.get(nb.id) ?? Infinity;

          steps.push({
            type: "relax-check",
            node: curr.id,
            neighbor: nb.id,
            pq: [...heap],
            distances: new Map(dist),
            visited: new Set(vis),
            edge: { from: curr.id, to: nb.id },
            msg: `if(${curr.dist} + ${nb.weight} < ${oldDist === Infinity ? "∞" : oldDist})`,
          });

          if (newDist < oldDist) {
            dist.set(nb.id, newDist);
            heap.push({ id: nb.id, dist: newDist });
            steps.push({
              type: "update",
              node: curr.id,
              neighbor: nb.id,
              pq: [...heap],
              distances: new Map(dist),
              visited: new Set(vis),
              edge: { from: curr.id, to: nb.id },
              msg: `dist[${lbl(nb.id)}] = ${newDist}; pq.push({${newDist}, ${lbl(nb.id)}});`,
            });
          }
        }
      }

      steps.push({
        type: "done",
        node: null,
        pq: [],
        distances: new Map(dist),
        visited: new Set(vis),
        msg: "Algorithm complete. Shortest distances calculated.",
      });

      return steps;
    },
    [nodes, edges, lbl]
  );

  const stepMap: Record<string, number> = {
    init: 0,
    "while-check": 1,
    "extract-min": 2,
    "for-loop": 3,
    "relax-check": 4,
    update: 5,
    done: 6,
  };

  const applyStep = useCallback(
    (step: DijkstraStep) => {
      setPq(step.pq);
      setDistances(step.distances);
      setVisited(step.visited);
      setCurrentNodeId(step.node);
      setHighlightEdge(step.edge || null);
      setNeighborChecking(step.neighbor ?? null);
      if (step.traversalAdd !== undefined) {
        traversalRef.current = [...traversalRef.current, step.traversalAdd];
        setTraversal([...traversalRef.current]);
      }
      if (step.type === "extract-min") setTemp(step.node);
      else if (step.type === "done") setTemp(null);

      setActiveStepIdx(stepMap[step.type] ?? -1);
      setLogEntries((prev) => [...prev, { type: step.type, msg: step.msg }]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const autoStep = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return;
    if (stepIdxRef.current >= stepsRef.current.length) {
      runningRef.current = false;
      setRunning(false);
      setPaused(false);
      setCurrentNodeId(null);
      setHighlightEdge(null);
      setNeighborChecking(null);
      return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const resetState = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    traversalRef.current = [];
    setPq([]);
    setDistances(new Map());
    setVisited(new Set());
    setTraversal([]);
    setTemp(null);
    setCurrentNodeId(null);
    setHighlightEdge(null);
    setNeighborChecking(null);
    setActiveStepIdx(-1);
    setLogEntries([]);
  }, []);

  const startDijkstra = useCallback(
    (sourceId: number) => {
      if (runningRef.current && pausedRef.current) {
        pausedRef.current = false;
        setPaused(false);
        autoStep();
        return;
      }
      resetState();
      stepsRef.current = buildSteps(sourceId);
      stepIdxRef.current = 0;
      runningRef.current = true;
      pausedRef.current = false;
      setRunning(true);
      setPaused(false);
      setTimeout(() => autoStep(), 10);
    },
    [buildSteps, autoStep, resetState]
  );

  const stepDijkstra = useCallback(
    (sourceId: number) => {
      if (!runningRef.current) {
        resetState();
        stepsRef.current = buildSteps(sourceId);
        stepIdxRef.current = 0;
        runningRef.current = true;
        pausedRef.current = true;
        setRunning(true);
        setPaused(true);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      pausedRef.current = true;
      setPaused(true);
      if (stepIdxRef.current >= stepsRef.current.length) {
        runningRef.current = false;
        setRunning(false);
        setPaused(false);
        setCurrentNodeId(null);
        setHighlightEdge(null);
        setNeighborChecking(null);
        return;
      }
      applyStep(stepsRef.current[stepIdxRef.current]);
      stepIdxRef.current++;
    },
    [buildSteps, applyStep, resetState]
  );

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetDijkstra = useCallback(() => {
    runningRef.current = false;
    pausedRef.current = false;
    stepsRef.current = [];
    stepIdxRef.current = 0;
    resetState();
    setRunning(false);
    setPaused(false);
  }, [resetState]);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
  }, []);

  return {
    running,
    paused,
    pq,
    distances,
    visited,
    traversal,
    temp,
    currentNodeId,
    highlightEdge,
    neighborChecking,
    activeStepIdx,
    logEntries,
    startDijkstra,
    stepDijkstra,
    togglePause,
    resetDijkstra,
    setSpeed,
  };
}
