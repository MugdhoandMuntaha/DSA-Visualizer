"use client";
import { useState, useCallback, useRef } from "react";
import { GraphNode, GraphEdge } from "@/lib/graphUtils";

export interface KruskalStep {
  type: string;
  edge: GraphEdge | null;
  parent: Map<number, number>;
  rank: Map<number, number>;
  mstEdges: GraphEdge[];
  totalCost: number;
  msg: string;
}

interface UseKruskalReturn {
  running: boolean;
  paused: boolean;
  parent: Map<number, number>;
  rank: Map<number, number>;
  mstEdges: GraphEdge[];
  sortedEdges: GraphEdge[];
  totalCost: number;
  currentEdge: GraphEdge | null;
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  startKruskal: () => void;
  stepKruskal: () => void;
  togglePause: () => void;
  resetKruskal: () => void;
  setSpeed: (speed: number) => void;
}

export function useKruskal(
  nodes: GraphNode[],
  edges: GraphEdge[]
): UseKruskalReturn {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [parentState, setParentState] = useState<Map<number, number>>(new Map());
  const [rankState, setRankState] = useState<Map<number, number>>(new Map());
  const [mstEdges, setMstEdges] = useState<GraphEdge[]>([]);
  const [sortedEdges, setSortedEdges] = useState<GraphEdge[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [currentEdge, setCurrentEdge] = useState<GraphEdge | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<KruskalStep[]>([]);
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

  const buildSteps = useCallback((): KruskalStep[] => {
    const steps: KruskalStep[] = [];
    const parent = new Map<number, number>();
    const rank = new Map<number, number>();
    const mst: GraphEdge[] = [];
    let cost = 0;

    // Disjoint Set Union logic
    const findParent = (node: number): number => {
      if (parent.get(node) === node) return node;
      const p = findParent(parent.get(node) as number);
      parent.set(node, p); // Path compression
      return p;
    };

    const unionSet = (u: number, v: number) => {
      const rootU = findParent(u);
      const rootV = findParent(v);
      const rankU = rank.get(rootU) as number;
      const rankV = rank.get(rootV) as number;

      if (rankU < rankV) {
        parent.set(rootU, rootV);
      } else if (rankU > rankV) {
        parent.set(rootV, rootU);
      } else {
        parent.set(rootV, rootU);
        rank.set(rootU, rankU + 1);
      }
    };

    // Initialize DSU
    nodes.forEach((n) => {
      parent.set(n.id, n.id);
      rank.set(n.id, 0);
    });

    steps.push({
      type: "init",
      edge: null,
      parent: new Map(parent),
      rank: new Map(rank),
      mstEdges: [...mst],
      totalCost: cost,
      msg: `Initialized DSU: parent[v] = v, rank[v] = 0.`,
    });

    // Extract unique edges and sort them by weight
    const uniqueEdges: GraphEdge[] = [];
    const seen = new Set<string>();
    edges.forEach(e => {
      const min = Math.min(e.from, e.to);
      const max = Math.max(e.from, e.to);
      const key = `${min}-${max}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEdges.push({ ...e, weight: e.weight ?? 1 });
      }
    });

    uniqueEdges.sort((a, b) => (a.weight as number) - (b.weight as number));
    setSortedEdges(uniqueEdges);

    steps.push({
      type: "sort",
      edge: null,
      parent: new Map(parent),
      rank: new Map(rank),
      mstEdges: [...mst],
      totalCost: cost,
      msg: `Sorted ${uniqueEdges.length} edges by weight.`,
    });

    for (const edge of uniqueEdges) {
      const u = edge.from;
      const v = edge.to;
      const wt = edge.weight as number;

      steps.push({
        type: "check-edge",
        edge,
        parent: new Map(parent),
        rank: new Map(rank),
        mstEdges: [...mst],
        totalCost: cost,
        msg: `Checking edge ${lbl(u)} - ${lbl(v)} (wt: ${wt})`,
      });

      const parentU = findParent(u);
      const parentV = findParent(v);

      steps.push({
        type: "find-parent",
        edge,
        parent: new Map(parent),
        rank: new Map(rank),
        mstEdges: [...mst],
        totalCost: cost,
        msg: `findParent(${lbl(u)}) = ${lbl(parentU)}\nfindParent(${lbl(v)}) = ${lbl(parentV)}`,
      });

      if (parentU !== parentV) {
        cost += wt;
        mst.push(edge);
        unionSet(u, v);

        steps.push({
          type: "union",
          edge,
          parent: new Map(parent),
          rank: new Map(rank),
          mstEdges: [...mst],
          totalCost: cost,
          msg: `Different parents! No cycle.\nunionSet(${lbl(u)}, ${lbl(v)})\nAdded to MST. Total Cost = ${cost}`,
        });
      } else {
        steps.push({
          type: "cycle",
          edge,
          parent: new Map(parent),
          rank: new Map(rank),
          mstEdges: [...mst],
          totalCost: cost,
          msg: `Same parents! Adding edge ${lbl(u)} - ${lbl(v)} would create a cycle. Discarding.`,
        });
      }
    }

    steps.push({
      type: "done",
      edge: null,
      parent: new Map(parent),
      rank: new Map(rank),
      mstEdges: [...mst],
      totalCost: cost,
      msg: `✓ Kruskal's MST complete. Total Cost = ${cost}`,
    });

    return steps;
  }, [nodes, edges, lbl]);

  const stepMap: Record<string, number> = {
    init: 0,
    sort: 1,
    "check-edge": 2,
    "find-parent": 3,
    union: 4,
    cycle: 4, // cycle goes to same block conceptually, or we can map it to 4 "unionSet / discard"
    done: 5,
  };

  const applyStep = useCallback(
    (step: KruskalStep) => {
      setParentState(step.parent);
      setRankState(step.rank);
      setMstEdges(step.mstEdges);
      setTotalCost(step.totalCost);
      setCurrentEdge(step.edge);
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
      setCurrentEdge(null);
      return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const startKruskal = useCallback(() => {
    if (nodes.length === 0 || edges.length === 0) return;
    if (runningRef.current && pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
      autoStep();
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setParentState(new Map());
    setRankState(new Map());
    setMstEdges([]);
    setSortedEdges([]);
    setTotalCost(0);
    setCurrentEdge(null);
    setActiveStepIdx(-1);
    setLogEntries([]);

    stepsRef.current = buildSteps();
    stepIdxRef.current = 0;
    runningRef.current = true;
    pausedRef.current = false;
    setRunning(true);
    setPaused(false);

    setTimeout(() => autoStep(), 10);
  }, [nodes.length, edges.length, buildSteps, autoStep]);

  const stepKruskal = useCallback(() => {
    if (nodes.length === 0 || edges.length === 0) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setParentState(new Map());
      setRankState(new Map());
      setMstEdges([]);
      setSortedEdges([]);
      setTotalCost(0);
      setCurrentEdge(null);
      setActiveStepIdx(-1);
      setLogEntries([]);

      stepsRef.current = buildSteps();
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
      setCurrentEdge(null);
      return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
  }, [nodes.length, edges.length, buildSteps, applyStep]);

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetKruskal = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false;
    pausedRef.current = false;
    stepsRef.current = [];
    stepIdxRef.current = 0;
    setRunning(false);
    setPaused(false);
    setParentState(new Map());
    setRankState(new Map());
    setMstEdges([]);
    setSortedEdges([]);
    setTotalCost(0);
    setCurrentEdge(null);
    setActiveStepIdx(-1);
    setLogEntries([]);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
  }, []);

  return {
    running,
    paused,
    parent: parentState,
    rank: rankState,
    mstEdges,
    sortedEdges,
    totalCost,
    currentEdge,
    activeStepIdx,
    logEntries,
    startKruskal,
    stepKruskal,
    togglePause,
    resetKruskal,
    setSpeed,
  };
}
