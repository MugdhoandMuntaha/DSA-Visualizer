"use client";
import { useState, useCallback, useRef } from "react";
import { GraphNode, GraphEdge } from "@/lib/graphUtils";

export interface BellmanFordStep {
  type: string;
  nodeU: number | null;
  nodeV: number | null;
  distances: Map<number, number>;
  iteration: number;
  hasNegativeCycle: boolean;
  edge?: { from: number; to: number };
  msg: string;
}

interface UseBellmanFordReturn {
  running: boolean;
  paused: boolean;
  distances: Map<number, number>;
  iteration: number;
  hasNegativeCycle: boolean;
  currentNodeU: number | null;
  currentNodeV: number | null;
  highlightEdge: { from: number; to: number } | null;
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  startBellmanFord: (sourceId: number) => void;
  stepBellmanFord: (sourceId: number) => void;
  togglePause: () => void;
  resetBellmanFord: () => void;
  setSpeed: (speed: number) => void;
}

function getWeightedNeighbors(
  id: number,
  edges: GraphEdge[],
  nodes: GraphNode[]
): { id: number; weight: number }[] {
  const res: { id: number; weight: number }[] = [];
  edges.forEach((e) => {
    // For Bellman-Ford we assume undirected if not strictly directed, 
    // visualizer currently models edges as undirected by default, so we treat as bidirected
    if (e.from === id) res.push({ id: e.to, weight: e.weight ?? 1 });
    else if (e.to === id) res.push({ id: e.from, weight: e.weight ?? 1 });
  });
  return res.sort((a, b) => {
    const la = nodes.find((n) => n.id === a.id)?.label || "";
    const lb = nodes.find((n) => n.id === b.id)?.label || "";
    return la.localeCompare(lb);
  });
}

export function useBellmanFord(
  nodes: GraphNode[],
  edges: GraphEdge[]
): UseBellmanFordReturn {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [distances, setDistances] = useState<Map<number, number>>(new Map());
  const [iteration, setIteration] = useState<number>(0);
  const [hasNegativeCycle, setHasNegativeCycle] = useState(false);
  const [currentNodeU, setCurrentNodeU] = useState<number | null>(null);
  const [currentNodeV, setCurrentNodeV] = useState<number | null>(null);
  const [highlightEdge, setHighlightEdge] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<BellmanFordStep[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const lbl = useCallback(
    (id: number) => nodes.find((n) => n.id === id)?.label || String(id),
    [nodes]
  );

  const buildSteps = useCallback(
    (sourceId: number): BellmanFordStep[] => {
      const steps: BellmanFordStep[] = [];
      const dist = new Map<number, number>();
      nodes.forEach((n) => dist.set(n.id, Infinity));
      dist.set(sourceId, 0);

      const V = nodes.length;

      steps.push({
        type: "init",
        nodeU: null, nodeV: null,
        distances: new Map(dist),
        iteration: 0,
        hasNegativeCycle: false,
        msg: `dist[${lbl(sourceId)}] = 0; initialize all others to INT_MAX.`,
      });

      // Relax V-1 times
      for (let i = 1; i <= V - 1; i++) {
        steps.push({
          type: "outer-loop",
          nodeU: null, nodeV: null,
          distances: new Map(dist),
          iteration: i,
          hasNegativeCycle: false,
          msg: `Iteration ${i} of ${V - 1}`,
        });

        for (const node of nodes) {
          const u = node.id;
          const nbrs = getWeightedNeighbors(u, edges, nodes);
          
          if (nbrs.length > 0) {
            steps.push({
              type: "node-loop",
              nodeU: u, nodeV: null,
              distances: new Map(dist),
              iteration: i,
              hasNegativeCycle: false,
              msg: `for(auto &nbr : adj[${lbl(u)}])`,
            });
          }

          for (const nbr of nbrs) {
            const v = nbr.id;
            const wt = nbr.weight;
            const du = dist.get(u) as number;
            const dv = dist.get(v) as number;

            steps.push({
              type: "check-relax",
              nodeU: u, nodeV: v,
              distances: new Map(dist),
              iteration: i,
              hasNegativeCycle: false,
              edge: { from: u, to: v },
              msg: `if(dist[${lbl(u)}] + ${wt} < dist[${lbl(v)}])\n${du === Infinity ? "INT_MAX" : du} + ${wt} < ${dv === Infinity ? "INT_MAX" : dv}`,
            });

            if (du !== Infinity && du + wt < dv) {
              dist.set(v, du + wt);
              steps.push({
                type: "relax",
                nodeU: u, nodeV: v,
                distances: new Map(dist),
                iteration: i,
                hasNegativeCycle: false,
                edge: { from: u, to: v },
                msg: `dist[${lbl(v)}] = ${du + wt}; // Relaxed edge`,
              });
            }
          }
        }
      }

      // Negative cycle check
      steps.push({
        type: "neg-cycle-check",
        nodeU: null, nodeV: null,
        distances: new Map(dist),
        iteration: V,
        hasNegativeCycle: false,
        msg: `Checking for negative weight cycles...`,
      });

      let negCycleFound = false;
      for (const node of nodes) {
        if (negCycleFound) break;
        const u = node.id;
        const nbrs = getWeightedNeighbors(u, edges, nodes);
        
        for (const nbr of nbrs) {
          const v = nbr.id;
          const wt = nbr.weight;
          const du = dist.get(u) as number;
          const dv = dist.get(v) as number;

          if (du !== Infinity && du + wt < dv) {
            negCycleFound = true;
            steps.push({
              type: "neg-cycle-found",
              nodeU: u, nodeV: v,
              distances: new Map(dist),
              iteration: V,
              hasNegativeCycle: true,
              edge: { from: u, to: v },
              msg: `Negative cycle detected at edge ${lbl(u)} -> ${lbl(v)}!`,
            });
            break;
          }
        }
      }

      steps.push({
        type: "done",
        nodeU: null, nodeV: null,
        distances: new Map(dist),
        iteration: V,
        hasNegativeCycle: negCycleFound,
        msg: negCycleFound ? "Algorithm terminated: Negative Cycle Found!" : "✓ Bellman-Ford complete. Shortest paths found.",
      });

      return steps;
    },
    [nodes, edges, lbl]
  );

  const stepMap: Record<string, number> = {
    init: 0,
    "outer-loop": 1,
    "node-loop": 2,
    "check-relax": 3,
    "relax": 4,
    "neg-cycle-check": 5,
    "neg-cycle-found": 6,
    done: 7,
  };

  const applyStep = useCallback(
    (step: BellmanFordStep) => {
      setDistances(step.distances);
      setIteration(step.iteration);
      setHasNegativeCycle(step.hasNegativeCycle);
      setCurrentNodeU(step.nodeU);
      setCurrentNodeV(step.nodeV);
      setHighlightEdge(step.edge || null);

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
      setCurrentNodeU(null);
      setCurrentNodeV(null);
      setHighlightEdge(null);
      return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const startBellmanFord = useCallback(
    (sourceId: number) => {
      if (runningRef.current && pausedRef.current) {
        pausedRef.current = false;
        setPaused(false);
        autoStep();
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      setDistances(new Map());
      setIteration(0);
      setHasNegativeCycle(false);
      setCurrentNodeU(null);
      setCurrentNodeV(null);
      setHighlightEdge(null);
      setActiveStepIdx(-1);
      setLogEntries([]);

      stepsRef.current = buildSteps(sourceId);
      stepIdxRef.current = 0;
      runningRef.current = true;
      pausedRef.current = false;
      setRunning(true);
      setPaused(false);

      setTimeout(() => autoStep(), 10);
    },
    [buildSteps, autoStep]
  );

  const stepBellmanFord = useCallback(
    (sourceId: number) => {
      if (!runningRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setDistances(new Map());
        setIteration(0);
        setHasNegativeCycle(false);
        setCurrentNodeU(null);
        setCurrentNodeV(null);
        setHighlightEdge(null);
        setActiveStepIdx(-1);
        setLogEntries([]);

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
        setCurrentNodeU(null);
        setCurrentNodeV(null);
        setHighlightEdge(null);
        return;
      }
      applyStep(stepsRef.current[stepIdxRef.current]);
      stepIdxRef.current++;
    },
    [buildSteps, applyStep]
  );

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetBellmanFord = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false;
    pausedRef.current = false;
    stepsRef.current = [];
    stepIdxRef.current = 0;
    setRunning(false);
    setPaused(false);
    setDistances(new Map());
    setIteration(0);
    setHasNegativeCycle(false);
    setCurrentNodeU(null);
    setCurrentNodeV(null);
    setHighlightEdge(null);
    setActiveStepIdx(-1);
    setLogEntries([]);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
  }, []);

  return {
    running,
    paused,
    distances,
    iteration,
    hasNegativeCycle,
    currentNodeU,
    currentNodeV,
    highlightEdge,
    activeStepIdx,
    logEntries,
    startBellmanFord,
    stepBellmanFord,
    togglePause,
    resetBellmanFord,
    setSpeed,
  };
}
