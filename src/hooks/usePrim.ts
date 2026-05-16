"use client";
import { useState, useCallback, useRef } from "react";
import { GraphNode, GraphEdge, getNeighbors } from "@/lib/graphUtils";

export interface PrimStep {
  type: string;
  u: number | null;
  v: number | null;
  edge: GraphEdge | null;
  key: Map<number, number>;
  mstSet: Set<number>;
  parent: Map<number, number>;
  pq: { weight: number; id: number }[];
  mstEdges: GraphEdge[];
  totalCost: number;
  msg: string;
}

interface UsePrimReturn {
  running: boolean;
  paused: boolean;
  keyMap: Map<number, number>;
  mstSet: Set<number>;
  parentMap: Map<number, number>;
  pq: { weight: number; id: number }[];
  mstEdges: GraphEdge[];
  totalCost: number;
  currentNodeU: number | null;
  currentNodeV: number | null;
  currentEdge: GraphEdge | null;
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  startPrim: (srcId: number) => void;
  stepPrim: (srcId: number) => void;
  togglePause: () => void;
  resetPrim: () => void;
  setSpeed: (speed: number) => void;
}

export function usePrim(nodes: GraphNode[], edges: GraphEdge[]): UsePrimReturn {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [keyMap, setKeyMap] = useState<Map<number, number>>(new Map());
  const [mstSet, setMstSet] = useState<Set<number>>(new Set());
  const [parentMap, setParentMap] = useState<Map<number, number>>(new Map());
  const [pqState, setPqState] = useState<{ weight: number; id: number }[]>([]);
  const [mstEdges, setMstEdges] = useState<GraphEdge[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);

  const [currentNodeU, setCurrentNodeU] = useState<number | null>(null);
  const [currentNodeV, setCurrentNodeV] = useState<number | null>(null);
  const [currentEdge, setCurrentEdge] = useState<GraphEdge | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<PrimStep[]>([]);
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
    (srcId: number): PrimStep[] => {
      const steps: PrimStep[] = [];
      const key = new Map<number, number>();
      const mst = new Set<number>();
      const parent = new Map<number, number>();
      const pq: { weight: number; id: number }[] = [];
      const currentMstEdges: GraphEdge[] = [];
      let cost = 0;

      // Initialize
      nodes.forEach((n) => {
        key.set(n.id, Infinity);
      });
      key.set(srcId, 0);
      parent.set(srcId, srcId);
      pq.push({ weight: 0, id: srcId });

      steps.push({
        type: "init", u: null, v: null, edge: null,
        key: new Map(key), mstSet: new Set(mst), parent: new Map(parent), pq: [...pq], mstEdges: [...currentMstEdges], totalCost: cost,
        msg: `Initialize key[${lbl(srcId)}] = 0. All other keys = ∞. Push {0, ${lbl(srcId)}} to priority queue.`,
      });

      while (pq.length > 0) {
        // Pop min from PQ
        pq.sort((a, b) => a.weight - b.weight);
        const top = pq.shift()!;
        const u = top.id;

        steps.push({
          type: "extract-min", u, v: null, edge: null,
          key: new Map(key), mstSet: new Set(mst), parent: new Map(parent), pq: [...pq], mstEdges: [...currentMstEdges], totalCost: cost,
          msg: `Extract min from PQ: Node ${lbl(u)} with key ${top.weight}.`,
        });

        if (mst.has(u)) {
          steps.push({
            type: "mst-check", u, v: null, edge: null,
            key: new Map(key), mstSet: new Set(mst), parent: new Map(parent), pq: [...pq], mstEdges: [...currentMstEdges], totalCost: cost,
            msg: `Node ${lbl(u)} is already in MST. Continue.`,
          });
          continue;
        }

        // Add to MST
        mst.add(u);
        const pId = parent.get(u);
        if (pId !== undefined && pId !== u) {
          // Find the edge that connects pId and u
          const edge = edges.find(e => (e.from === pId && e.to === u) || (e.from === u && e.to === pId));
          if (edge) {
            currentMstEdges.push(edge);
            cost += edge.weight ?? 1;
          }
        }

        steps.push({
          type: "include-mst", u, v: null, edge: null,
          key: new Map(key), mstSet: new Set(mst), parent: new Map(parent), pq: [...pq], mstEdges: [...currentMstEdges], totalCost: cost,
          msg: `Add ${lbl(u)} to MST. mst[${lbl(u)}] = true.`,
        });

        // Check neighbors
        const nbrs = getNeighbors(u, edges, nodes);
        for (const v of nbrs) {
          const edge = edges.find((e) => (e.from === u && e.to === v) || (e.from === v && e.to === u));
          if (!edge) continue;
          const wt = edge.weight ?? 1;

          steps.push({
            type: "check-neighbor", u, v, edge,
            key: new Map(key), mstSet: new Set(mst), parent: new Map(parent), pq: [...pq], mstEdges: [...currentMstEdges], totalCost: cost,
            msg: `Check neighbor ${lbl(v)} of ${lbl(u)}. Weight = ${wt}. key[${lbl(v)}] = ${key.get(v) === Infinity ? "∞" : key.get(v)}.`,
          });

          if (!mst.has(v) && wt < (key.get(v) as number)) {
            key.set(v, wt);
            parent.set(v, u);
            pq.push({ weight: wt, id: v });

            steps.push({
              type: "update-key", u, v, edge,
              key: new Map(key), mstSet: new Set(mst), parent: new Map(parent), pq: [...pq], mstEdges: [...currentMstEdges], totalCost: cost,
              msg: `Weight < key[${lbl(v)}]. Update key[${lbl(v)}] = ${wt}, parent[${lbl(v)}] = ${lbl(u)}. Push {${wt}, ${lbl(v)}} to PQ.`,
            });
          } else {
            steps.push({
              type: "skip-update", u, v, edge,
              key: new Map(key), mstSet: new Set(mst), parent: new Map(parent), pq: [...pq], mstEdges: [...currentMstEdges], totalCost: cost,
              msg: mst.has(v) ? `Node ${lbl(v)} is already in MST. Skip.` : `Weight >= key[${lbl(v)}]. Skip.`,
            });
          }
        }
      }

      steps.push({
        type: "done", u: null, v: null, edge: null,
        key: new Map(key), mstSet: new Set(mst), parent: new Map(parent), pq: [...pq], mstEdges: [...currentMstEdges], totalCost: cost,
        msg: `✓ Prim's MST complete. Total Cost = ${cost}.`,
      });

      return steps;
    },
    [nodes, edges, lbl]
  );

  const stepMap: Record<string, number> = {
    init: 0,
    "extract-min": 1,
    "mst-check": 1,
    "include-mst": 2,
    "check-neighbor": 3,
    "update-key": 4,
    "skip-update": 4,
    done: 5,
  };

  const applyStep = useCallback((step: PrimStep) => {
    setKeyMap(step.key);
    setMstSet(step.mstSet);
    setParentMap(step.parent);
    setPqState(step.pq);
    setMstEdges(step.mstEdges);
    setTotalCost(step.totalCost);

    setCurrentNodeU(step.u);
    setCurrentNodeV(step.v);
    setCurrentEdge(step.edge);
    setActiveStepIdx(stepMap[step.type] ?? -1);
    setLogEntries((prev) => [...prev, { type: step.type, msg: step.msg }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoStep = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return;
    if (stepIdxRef.current >= stepsRef.current.length) {
      runningRef.current = false;
      setRunning(false);
      setPaused(false);
      return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const startPrim = useCallback(
    (srcId: number) => {
      if (nodes.length === 0 || edges.length === 0) return;
      if (runningRef.current && pausedRef.current) {
        pausedRef.current = false;
        setPaused(false);
        autoStep();
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);

      setKeyMap(new Map());
      setMstSet(new Set());
      setParentMap(new Map());
      setPqState([]);
      setMstEdges([]);
      setTotalCost(0);

      setCurrentNodeU(null);
      setCurrentNodeV(null);
      setCurrentEdge(null);
      setActiveStepIdx(-1);
      setLogEntries([]);

      stepsRef.current = buildSteps(srcId);
      stepIdxRef.current = 0;
      runningRef.current = true;
      pausedRef.current = false;
      setRunning(true);
      setPaused(false);

      setTimeout(() => autoStep(), 10);
    },
    [nodes.length, edges.length, buildSteps, autoStep]
  );

  const stepPrim = useCallback(
    (srcId: number) => {
      if (nodes.length === 0 || edges.length === 0) return;
      if (!runningRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setKeyMap(new Map());
        setMstSet(new Set());
        setParentMap(new Map());
        setPqState([]);
        setMstEdges([]);
        setTotalCost(0);

        setCurrentNodeU(null);
        setCurrentNodeV(null);
        setCurrentEdge(null);
        setActiveStepIdx(-1);
        setLogEntries([]);

        stepsRef.current = buildSteps(srcId);
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
        return;
      }
      applyStep(stepsRef.current[stepIdxRef.current]);
      stepIdxRef.current++;
    },
    [nodes.length, edges.length, buildSteps, applyStep]
  );

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetPrim = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false;
    pausedRef.current = false;
    stepsRef.current = [];
    stepIdxRef.current = 0;
    setRunning(false);
    setPaused(false);

    setKeyMap(new Map());
    setMstSet(new Set());
    setParentMap(new Map());
    setPqState([]);
    setMstEdges([]);
    setTotalCost(0);

    setCurrentNodeU(null);
    setCurrentNodeV(null);
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
    keyMap,
    mstSet,
    parentMap,
    pq: pqState,
    mstEdges,
    totalCost,
    currentNodeU,
    currentNodeV,
    currentEdge,
    activeStepIdx,
    logEntries,
    startPrim,
    stepPrim,
    togglePause,
    resetPrim,
    setSpeed,
  };
}
