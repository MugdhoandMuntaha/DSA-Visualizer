"use client";
import { useState, useCallback, useRef } from "react";
import { GraphNode, GraphEdge } from "@/lib/graphUtils";

export interface FloydWarshallStep {
  type: string;
  via: number | null;
  i: number | null;
  j: number | null;
  distances: Record<number, Record<number, number>>;
  msg: string;
}

interface UseFloydWarshallReturn {
  running: boolean;
  paused: boolean;
  distances: Record<number, Record<number, number>>;
  currentVia: number | null;
  currentI: number | null;
  currentJ: number | null;
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  startFloydWarshall: () => void;
  stepFloydWarshall: () => void;
  togglePause: () => void;
  resetFloydWarshall: () => void;
  setSpeed: (speed: number) => void;
}

export function useFloydWarshall(
  nodes: GraphNode[],
  edges: GraphEdge[]
): UseFloydWarshallReturn {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [distances, setDistances] = useState<Record<number, Record<number, number>>>({});
  const [currentVia, setCurrentVia] = useState<number | null>(null);
  const [currentI, setCurrentI] = useState<number | null>(null);
  const [currentJ, setCurrentJ] = useState<number | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<FloydWarshallStep[]>([]);
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

  const buildSteps = useCallback((): FloydWarshallStep[] => {
    const steps: FloydWarshallStep[] = [];
    const dist: Record<number, Record<number, number>> = {};
    const nodeIds = nodes.map((n) => n.id).sort((a, b) => lbl(a).localeCompare(lbl(b)));

    // Deep copy helper for dist
    const cloneDist = () => {
      const copy: Record<number, Record<number, number>> = {};
      for (const u of nodeIds) {
        copy[u] = { ...dist[u] };
      }
      return copy;
    };

    // Initialize distance matrix
    for (const u of nodeIds) {
      dist[u] = {};
      for (const v of nodeIds) {
        if (u === v) dist[u][v] = 0;
        else dist[u][v] = Infinity;
      }
    }

    // Fill adjacency weights
    // Treating edges as bidirected as visualizer does not currently enforce direction
    edges.forEach((e) => {
      const wt = e.weight ?? 1;
      if (dist[e.from] && dist[e.from][e.to] !== undefined) dist[e.from][e.to] = Math.min(dist[e.from][e.to], wt);
      if (dist[e.to] && dist[e.to][e.from] !== undefined) dist[e.to][e.from] = Math.min(dist[e.to][e.from], wt);
    });

    steps.push({
      type: "init",
      via: null, i: null, j: null,
      distances: cloneDist(),
      msg: `Initialized distance matrix with adjacency weights.`,
    });

    // Floyd-Warshall Logic
    for (const via of nodeIds) {
      steps.push({
        type: "loop-via",
        via, i: null, j: null,
        distances: cloneDist(),
        msg: `via = ${lbl(via)}`,
      });

      for (const i of nodeIds) {
        for (const j of nodeIds) {
          const dij = dist[i][j];
          const divia = dist[i][via];
          const dviaj = dist[via][j];

          steps.push({
            type: "check",
            via, i, j,
            distances: cloneDist(),
            msg: `Checking dist[${lbl(i)}][${lbl(j)}] vs dist[${lbl(i)}][${lbl(via)}] + dist[${lbl(via)}][${lbl(j)}]\n(${dij === Infinity ? "INF" : dij} vs ${divia === Infinity ? "INF" : divia} + ${dviaj === Infinity ? "INF" : dviaj})`,
          });

          if (divia !== Infinity && dviaj !== Infinity && divia + dviaj < dij) {
            dist[i][j] = divia + dviaj;
            steps.push({
              type: "relax",
              via, i, j,
              distances: cloneDist(),
              msg: `Relaxed! dist[${lbl(i)}][${lbl(j)}] = ${divia + dviaj}`,
            });
          }
        }
      }
    }

    steps.push({
      type: "done",
      via: null, i: null, j: null,
      distances: cloneDist(),
      msg: `✓ Floyd-Warshall complete. All-pairs shortest paths found.`,
    });

    return steps;
  }, [nodes, edges, lbl]);

  const stepMap: Record<string, number> = {
    init: 0,
    "loop-via": 1,
    check: 2,
    relax: 3,
    done: 4,
  };

  const applyStep = useCallback(
    (step: FloydWarshallStep) => {
      setDistances(step.distances);
      setCurrentVia(step.via);
      setCurrentI(step.i);
      setCurrentJ(step.j);
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
      setCurrentVia(null);
      setCurrentI(null);
      setCurrentJ(null);
      return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const startFloydWarshall = useCallback(() => {
    if (nodes.length === 0) return;
    if (runningRef.current && pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
      autoStep();
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setDistances({});
    setCurrentVia(null);
    setCurrentI(null);
    setCurrentJ(null);
    setActiveStepIdx(-1);
    setLogEntries([]);

    stepsRef.current = buildSteps();
    stepIdxRef.current = 0;
    runningRef.current = true;
    pausedRef.current = false;
    setRunning(true);
    setPaused(false);

    setTimeout(() => autoStep(), 10);
  }, [nodes.length, buildSteps, autoStep]);

  const stepFloydWarshall = useCallback(() => {
    if (nodes.length === 0) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setDistances({});
      setCurrentVia(null);
      setCurrentI(null);
      setCurrentJ(null);
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
      setCurrentVia(null);
      setCurrentI(null);
      setCurrentJ(null);
      return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
  }, [nodes.length, buildSteps, applyStep]);

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetFloydWarshall = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false;
    pausedRef.current = false;
    stepsRef.current = [];
    stepIdxRef.current = 0;
    setRunning(false);
    setPaused(false);
    setDistances({});
    setCurrentVia(null);
    setCurrentI(null);
    setCurrentJ(null);
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
    currentVia,
    currentI,
    currentJ,
    activeStepIdx,
    logEntries,
    startFloydWarshall,
    stepFloydWarshall,
    togglePause,
    resetFloydWarshall,
    setSpeed,
  };
}
