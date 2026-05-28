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
  // Enhanced relaxation details
  sourceId: number | null;
  currentDist?: number | null;
  neighborWeight?: number | null;
  oldDist?: number | null;
  newDist?: number | null;
  changedNode?: number | null;
  relaxResult?: 'relaxed' | 'not-relaxed' | null;
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
  // Enhanced details
  sourceNodeId: number | null;
  currentDist: number | null;
  neighborWeight: number | null;
  oldDist: number | null;
  newDist: number | null;
  changedNode: number | null;
  relaxResult: 'relaxed' | 'not-relaxed' | null;
  startBellmanFord: (sourceId: number) => void;
  stepBellmanFord: (sourceId: number) => void;
  prevStepBellmanFord: () => void;
  togglePause: () => void;
  resetBellmanFord: () => void;
  setSpeed: (speed: number) => void;
}

function getWeightedNeighbors(
  id: number,
  edges: GraphEdge[],
  nodes: GraphNode[],
  directed: boolean
): { id: number; weight: number }[] {
  const res: { id: number; weight: number }[] = [];
  edges.forEach((e) => {
    if (e.from === id) res.push({ id: e.to, weight: e.weight ?? 1 });
    else if (!directed && e.to === id) res.push({ id: e.from, weight: e.weight ?? 1 });
  });
  return res.sort((a, b) => {
    const la = nodes.find((n) => n.id === a.id)?.label || "";
    const lb = nodes.find((n) => n.id === b.id)?.label || "";
    return la.localeCompare(lb);
  });
}

export function useBellmanFord(
  nodes: GraphNode[],
  edges: GraphEdge[],
  directed: boolean = false
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

  // Enhanced calculation states
  const [sourceNodeId, setSourceNodeId] = useState<number | null>(null);
  const [currentDistState, setCurrentDistState] = useState<number | null>(null);
  const [neighborWeightState, setNeighborWeightState] = useState<number | null>(null);
  const [oldDistState, setOldDistState] = useState<number | null>(null);
  const [newDistState, setNewDistState] = useState<number | null>(null);
  const [changedNode, setChangedNode] = useState<number | null>(null);
  const [relaxResult, setRelaxResult] = useState<'relaxed' | 'not-relaxed' | null>(null);

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
        sourceId,
        changedNode: sourceId,
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
          sourceId,
        });

        for (const node of nodes) {
          const u = node.id;
          const nbrs = getWeightedNeighbors(u, edges, nodes, directed);
          
          if (nbrs.length > 0) {
            steps.push({
              type: "node-loop",
              nodeU: u, nodeV: null,
              distances: new Map(dist),
              iteration: i,
              hasNegativeCycle: false,
              msg: `for(auto &nbr : adj[${lbl(u)}])`,
              sourceId,
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
              sourceId,
              currentDist: du,
              neighborWeight: wt,
              oldDist: dv,
              newDist: du === Infinity ? Infinity : du + wt,
              relaxResult: du !== Infinity && du + wt < dv ? 'relaxed' : 'not-relaxed',
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
                sourceId,
                currentDist: du,
                neighborWeight: wt,
                oldDist: dv,
                newDist: du + wt,
                changedNode: v,
                relaxResult: 'relaxed',
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
        sourceId,
      });

      let negCycleFound = false;
      for (const node of nodes) {
        if (negCycleFound) break;
        const u = node.id;
        const nbrs = getWeightedNeighbors(u, edges, nodes, directed);
        
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
              sourceId,
              currentDist: du,
              neighborWeight: wt,
              oldDist: dv,
              newDist: du + wt,
              changedNode: v,
              relaxResult: 'relaxed',
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
        sourceId,
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

      // Enhanced details
      setSourceNodeId(step.sourceId);
      setCurrentDistState(step.currentDist ?? null);
      setNeighborWeightState(step.neighborWeight ?? null);
      setOldDistState(step.oldDist ?? null);
      setNewDistState(step.newDist ?? null);
      setChangedNode(step.changedNode ?? null);
      setRelaxResult(step.relaxResult ?? null);

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

  const resetState = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDistances(new Map());
    setIteration(0);
    setHasNegativeCycle(false);
    setCurrentNodeU(null);
    setCurrentNodeV(null);
    setHighlightEdge(null);
    setActiveStepIdx(-1);
    setLogEntries([]);

    // Reset enhanced states
    setSourceNodeId(null);
    setCurrentDistState(null);
    setNeighborWeightState(null);
    setOldDistState(null);
    setNewDistState(null);
    setChangedNode(null);
    setRelaxResult(null);
  }, []);

  const startBellmanFord = useCallback(
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

  const stepBellmanFord = useCallback(
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
        setCurrentNodeU(null);
        setCurrentNodeV(null);
        setHighlightEdge(null);
        return;
      }
      applyStep(stepsRef.current[stepIdxRef.current]);
      stepIdxRef.current++;
    },
    [buildSteps, applyStep, resetState]
  );

  const prevStepBellmanFord = useCallback(() => {
    if (stepsRef.current.length === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    runningRef.current = true;
    setRunning(true);
    pausedRef.current = true;
    setPaused(true);

    if (stepIdxRef.current > 1) {
      const targetIdx = stepIdxRef.current - 2;
      applyStep(stepsRef.current[targetIdx]);
      stepIdxRef.current = targetIdx + 1;
      setLogEntries((prev) => prev.slice(0, targetIdx + 1));
    } else if (stepIdxRef.current === 1) {
      applyStep(stepsRef.current[0]);
      stepIdxRef.current = 1;
      setLogEntries((prev) => prev.slice(0, 1));
    }
  }, [applyStep]);

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetBellmanFord = useCallback(() => {
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
    distances,
    iteration,
    hasNegativeCycle,
    currentNodeU,
    currentNodeV,
    highlightEdge,
    activeStepIdx,
    logEntries,
    // Enhanced details
    sourceNodeId,
    currentDist: currentDistState,
    neighborWeight: neighborWeightState,
    oldDist: oldDistState,
    newDist: newDistState,
    changedNode,
    relaxResult,
    startBellmanFord,
    stepBellmanFord,
    prevStepBellmanFord,
    togglePause,
    resetBellmanFord,
    setSpeed,
  };
}
