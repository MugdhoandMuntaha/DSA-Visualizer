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
  // Enhanced calculation data
  sourceId: number;
  currentDist?: number;
  neighborWeight?: number;
  oldDist?: number;
  newDist?: number;
  changedNode?: number; // node whose dist was just updated
  relaxResult?: 'relaxed' | 'not-relaxed' | null;
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
  // Enhanced calculation state
  sourceNodeId: number | null;
  currentDist: number | null;
  neighborWeight: number | null;
  oldDist: number | null;
  newDist: number | null;
  changedNode: number | null;
  relaxResult: 'relaxed' | 'not-relaxed' | null;
  startDijkstra: (sourceId: number) => void;
  stepDijkstra: (sourceId: number) => void;
  prevStepDijkstra: () => void;
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
  // Enhanced calculation state
  const [sourceNodeId, setSourceNodeId] = useState<number | null>(null);
  const [currentDistState, setCurrentDistState] = useState<number | null>(null);
  const [neighborWeightState, setNeighborWeightState] = useState<number | null>(null);
  const [oldDistState, setOldDistState] = useState<number | null>(null);
  const [newDistState, setNewDistState] = useState<number | null>(null);
  const [changedNode, setChangedNode] = useState<number | null>(null);
  const [relaxResult, setRelaxResult] = useState<'relaxed' | 'not-relaxed' | null>(null);

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

      // 1. Pre-init: All nodes infinity, PQ empty
      const initialDist = new Map<number, number>();
      nodes.forEach((n) => initialDist.set(n.id, Infinity));
      steps.push({
        type: "pre-init",
        node: null,
        pq: [],
        distances: new Map(initialDist),
        visited: new Set(vis),
        msg: "Initialize all node distances to ∞.",
        sourceId,
      });

      // Initialize distances for the rest of the algorithm
      nodes.forEach((n) => dist.set(n.id, n.id === sourceId ? 0 : Infinity));
      heap.push({ id: sourceId, dist: 0 });

      steps.push({
        type: "init",
        node: sourceId,
        pq: [...heap],
        distances: new Map(dist),
        visited: new Set(vis),
        msg: `Set dist[${lbl(sourceId)}] = 0; pq.push({0, ${lbl(sourceId)}});`,
        sourceId,
        changedNode: sourceId,
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
          sourceId,
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
          sourceId,
          currentDist: curr.dist,
        });

        const nbrs = getWeightedNeighbors(curr.id, edges, nodes);
        steps.push({
          type: "for-loop",
          node: curr.id,
          pq: [...heap],
          distances: new Map(dist),
          visited: new Set(vis),
          msg: `for(auto &nbr: adj[${lbl(curr.id)}]) -> ${nbrs.length} neighbors`,
          sourceId,
          currentDist: curr.dist,
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
            sourceId,
            currentDist: curr.dist,
            neighborWeight: nb.weight,
            oldDist,
            newDist: newDist,
            relaxResult: newDist < oldDist ? 'relaxed' : 'not-relaxed',
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
              sourceId,
              currentDist: curr.dist,
              neighborWeight: nb.weight,
              oldDist,
              newDist,
              changedNode: nb.id,
              relaxResult: 'relaxed',
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
        sourceId,
      });

      return steps;
    },
    [nodes, edges, lbl]
  );

  const stepMap: Record<string, number> = {
    "pre-init": 0,
    init: 1,
    "while-check": 2,
    "extract-min": 3,
    "for-loop": 4,
    "relax-check": 5,
    update: 6,
    done: 7,
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

      // Enhanced calculation state
      setSourceNodeId(step.sourceId ?? null);
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
    // Reset enhanced state
    setSourceNodeId(null);
    setCurrentDistState(null);
    setNeighborWeightState(null);
    setOldDistState(null);
    setNewDistState(null);
    setChangedNode(null);
    setRelaxResult(null);
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

  const prevStepDijkstra = useCallback(() => {
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
    // Enhanced calculation state
    sourceNodeId,
    currentDist: currentDistState,
    neighborWeight: neighborWeightState,
    oldDist: oldDistState,
    newDist: newDistState,
    changedNode,
    relaxResult,
    startDijkstra,
    stepDijkstra,
    prevStepDijkstra,
    togglePause,
    resetDijkstra,
    setSpeed,
  };
}
