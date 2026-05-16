"use client";
import { useState, useCallback, useRef } from "react";
import { GraphNode, GraphEdge, getNeighbors } from "@/lib/graphUtils";

export interface BFSStep {
  type: string;
  node: number | null;
  neighbor?: number;
  queue: number[];
  visited: Set<number>;
  edge?: { from: number; to: number };
  msg: string;
  traversalAdd?: number;
}

interface UseBFSReturn {
  bfsRunning: boolean;
  bfsPaused: boolean;
  bfsQueue: number[];
  bfsVisited: Set<number>;
  bfsTraversal: number[];
  bfsTemp: number | null;
  currentNodeId: number | null;
  highlightEdge: { from: number; to: number } | null;
  neighborChecking: number | null;
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  startBFS: (sourceId: number) => void;
  stepBFS: (sourceId: number) => void;
  togglePause: () => void;
  resetBFS: () => void;
  setSpeed: (speed: number) => void;
}

export function useBFS(
  nodes: GraphNode[],
  edges: GraphEdge[]
): UseBFSReturn {
  const [bfsRunning, setBfsRunning] = useState(false);
  const [bfsPaused, setBfsPaused] = useState(false);
  const [bfsQueue, setBfsQueue] = useState<number[]>([]);
  const [bfsVisited, setBfsVisited] = useState<Set<number>>(new Set());
  const [bfsTraversal, setBfsTraversal] = useState<number[]>([]);
  const [bfsTemp, setBfsTemp] = useState<number | null>(null);
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

  const stepsRef = useRef<BFSStep[]>([]);
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
    (sourceId: number): BFSStep[] => {
      const steps: BFSStep[] = [];
      const visited = new Set<number>();
      const queue: number[] = [];
      visited.add(sourceId);
      queue.push(sourceId);

      steps.push({
        type: "init",
        node: sourceId,
        queue: [...queue],
        visited: new Set(visited),
        msg: `q.push(${lbl(sourceId)}); visited[${lbl(sourceId)}] = true;`,
      });

      while (queue.length > 0) {
        steps.push({
          type: "while-check",
          node: null,
          queue: [...queue],
          visited: new Set(visited),
          msg: `!q.empty() → true (size = ${queue.length}). Enter loop.`,
        });

        const curr = queue.shift()!;
        steps.push({
          type: "front-pop",
          node: curr,
          queue: [...queue],
          visited: new Set(visited),
          msg: `temp = q.front() → ${lbl(curr)}; q.pop();`,
        });

        steps.push({
          type: "cout",
          node: curr,
          queue: [...queue],
          visited: new Set(visited),
          msg: `cout << temp → output "${lbl(curr)}"`,
          traversalAdd: curr,
        });

        const nbrs = getNeighbors(curr, edges, nodes);
        steps.push({
          type: "for-loop",
          node: curr,
          queue: [...queue],
          visited: new Set(visited),
          msg:
            nbrs.length === 0
              ? `adj[${lbl(curr)}] is empty — no neighbors.`
              : `Iterating adj[${lbl(curr)}]: neighbors = [${nbrs.map(lbl).join(", ")}]`,
        });

        for (const nb of nbrs) {
          if (!visited.has(nb)) {
            visited.add(nb);
            queue.push(nb);
            steps.push({
              type: "enqueue",
              node: curr,
              neighbor: nb,
              queue: [...queue],
              visited: new Set(visited),
              edge: { from: curr, to: nb },
              msg: `!visited[${lbl(nb)}] → true. visited[${lbl(nb)}] = true; q.push(${lbl(nb)});`,
            });
          } else {
            steps.push({
              type: "skip",
              node: curr,
              neighbor: nb,
              queue: [...queue],
              visited: new Set(visited),
              edge: { from: curr, to: nb },
              msg: `!visited[${lbl(nb)}] → false. Already visited, skip.`,
            });
          }
        }

        steps.push({
          type: "loop-back",
          node: null,
          queue: [...queue],
          visited: new Set(visited),
          msg: `End of for loop. Back to while(!q.empty()).`,
        });
      }

      steps.push({
        type: "while-end",
        node: null,
        queue: [],
        visited: new Set(visited),
        msg: `!q.empty() → false. Exit loop.`,
      });

      steps.push({
        type: "done",
        node: null,
        queue: [],
        visited: new Set(visited),
        msg: "✓ BFS complete. All reachable nodes visited.",
      });

      return steps;
    },
    [nodes, edges, lbl]
  );

  const stepMap: Record<string, number> = {
    init: 0,
    "while-check": 1,
    "front-pop": 2,
    cout: 3,
    "for-loop": 4,
    enqueue: 5,
    skip: 5,
    "loop-back": 6,
    "while-end": 1,
    done: 6,
  };

  const applyStep = useCallback(
    (step: BFSStep) => {
      setBfsQueue(step.queue);
      setBfsVisited(step.visited);
      setCurrentNodeId(step.node);
      setHighlightEdge(step.edge || null);
      setNeighborChecking(step.neighbor ?? null);
      if (step.traversalAdd !== undefined) {
        traversalRef.current = [...traversalRef.current, step.traversalAdd];
        setBfsTraversal([...traversalRef.current]);
      }
      if (step.type === "front-pop") setBfsTemp(step.node);
      else if (step.type === "done") setBfsTemp(null);

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
      setBfsRunning(false);
      setBfsPaused(false);
      setCurrentNodeId(null);
      setHighlightEdge(null);
      setNeighborChecking(null);
      return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const startBFS = useCallback(
    (sourceId: number) => {
      if (runningRef.current && pausedRef.current) {
        pausedRef.current = false;
        setBfsPaused(false);
        autoStep();
        return;
      }
      // Reset
      if (timerRef.current) clearTimeout(timerRef.current);
      traversalRef.current = [];
      setBfsQueue([]);
      setBfsVisited(new Set());
      setBfsTraversal([]);
      setBfsTemp(null);
      setCurrentNodeId(null);
      setHighlightEdge(null);
      setNeighborChecking(null);
      setActiveStepIdx(-1);
      setLogEntries([]);

      stepsRef.current = buildSteps(sourceId);
      stepIdxRef.current = 0;
      runningRef.current = true;
      pausedRef.current = false;
      setBfsRunning(true);
      setBfsPaused(false);

      // Start auto stepping after a microtask to let state settle
      setTimeout(() => autoStep(), 10);
    },
    [buildSteps, autoStep]
  );

  const stepBFS = useCallback(
    (sourceId: number) => {
      if (!runningRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        traversalRef.current = [];
        setBfsQueue([]);
        setBfsVisited(new Set());
        setBfsTraversal([]);
        setBfsTemp(null);
        setCurrentNodeId(null);
        setHighlightEdge(null);
        setNeighborChecking(null);
        setActiveStepIdx(-1);
        setLogEntries([]);

        stepsRef.current = buildSteps(sourceId);
        stepIdxRef.current = 0;
        runningRef.current = true;
        pausedRef.current = true;
        setBfsRunning(true);
        setBfsPaused(true);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      pausedRef.current = true;
      setBfsPaused(true);
      if (stepIdxRef.current >= stepsRef.current.length) {
        runningRef.current = false;
        setBfsRunning(false);
        setBfsPaused(false);
        setCurrentNodeId(null);
        setHighlightEdge(null);
        setNeighborChecking(null);
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
    setBfsPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetBFS = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false;
    pausedRef.current = false;
    traversalRef.current = [];
    stepsRef.current = [];
    stepIdxRef.current = 0;
    setBfsRunning(false);
    setBfsPaused(false);
    setBfsQueue([]);
    setBfsVisited(new Set());
    setBfsTraversal([]);
    setBfsTemp(null);
    setCurrentNodeId(null);
    setHighlightEdge(null);
    setNeighborChecking(null);
    setActiveStepIdx(-1);
    setLogEntries([]);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
  }, []);

  return {
    bfsRunning,
    bfsPaused,
    bfsQueue,
    bfsVisited,
    bfsTraversal,
    bfsTemp,
    currentNodeId,
    highlightEdge,
    neighborChecking,
    activeStepIdx,
    logEntries,
    startBFS,
    stepBFS,
    togglePause,
    resetBFS,
    setSpeed,
  };
}
