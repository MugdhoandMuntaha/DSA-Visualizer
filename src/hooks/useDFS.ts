"use client";
import { useState, useCallback, useRef } from "react";
import { GraphNode, GraphEdge, getNeighbors } from "@/lib/graphUtils";

export interface DFSStep {
  type: string;
  node: number | null;
  neighbor?: number;
  stack: number[];
  visited: Set<number>;
  edge?: { from: number; to: number };
  msg: string;
  traversalAdd?: number;
}

interface UseDFSReturn {
  running: boolean;
  paused: boolean;
  stack: number[];
  visited: Set<number>;
  traversal: number[];
  currentNodeId: number | null;
  highlightEdge: { from: number; to: number } | null;
  neighborChecking: number | null;
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  startDFS: (sourceId: number) => void;
  stepDFS: (sourceId: number) => void;
  togglePause: () => void;
  resetDFS: () => void;
  setSpeed: (speed: number) => void;
}

export function useDFS(
  nodes: GraphNode[],
  edges: GraphEdge[]
): UseDFSReturn {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stack, setStack] = useState<number[]>([]);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [traversal, setTraversal] = useState<number[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<number | null>(null);
  const [highlightEdge, setHighlightEdge] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [neighborChecking, setNeighborChecking] = useState<number | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<DFSStep[]>([]);
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
    (sourceId: number): DFSStep[] => {
      const steps: DFSStep[] = [];
      const visitedSet = new Set<number>();
      const callStack: number[] = [];

      steps.push({
        type: "init",
        node: null,
        stack: [...callStack],
        visited: new Set(visitedSet),
        msg: `unordered_map<T, bool> visited;\nDFSHelper(${lbl(sourceId)}, visited);`,
      });

      const dfsHelper = (src: number) => {
        callStack.push(src);
        visitedSet.add(src);

        steps.push({
          type: "visit",
          node: src,
          stack: [...callStack],
          visited: new Set(visitedSet),
          msg: `visited[${lbl(src)}] = true;\ncout << ${lbl(src)} << " ";`,
          traversalAdd: src,
        });

        const nbrs = getNeighbors(src, edges, nodes);
        steps.push({
          type: "for-loop",
          node: src,
          stack: [...callStack],
          visited: new Set(visitedSet),
          msg: nbrs.length === 0
            ? `adj[${lbl(src)}] is empty.`
            : `for(auto &nbr : adj[${lbl(src)}]) -> neighbors: [${nbrs.map(lbl).join(", ")}]`,
        });

        for (const nb of nbrs) {
          steps.push({
            type: "check-neighbor",
            node: src,
            neighbor: nb,
            stack: [...callStack],
            visited: new Set(visitedSet),
            edge: { from: src, to: nb },
            msg: `T node = ${lbl(nb)};\nif(!visited[${lbl(nb)}])`,
          });

          if (!visitedSet.has(nb)) {
            steps.push({
              type: "recurse",
              node: src,
              neighbor: nb,
              stack: [...callStack],
              visited: new Set(visitedSet),
              edge: { from: src, to: nb },
              msg: `!visited[${lbl(nb)}] is true.\nDFSHelper(${lbl(nb)}, visited);`,
            });
            dfsHelper(nb);
            
            // Step to show returning back to this node
            steps.push({
              type: "return",
              node: src,
              stack: [...callStack],
              visited: new Set(visitedSet),
              msg: `Returned to DFSHelper(${lbl(src)})`,
            });
          } else {
            steps.push({
              type: "skip",
              node: src,
              neighbor: nb,
              stack: [...callStack],
              visited: new Set(visitedSet),
              edge: { from: src, to: nb },
              msg: `!visited[${lbl(nb)}] is false. Skip.`,
            });
          }
        }

        callStack.pop();
        steps.push({
          type: "end-func",
          node: callStack.length > 0 ? callStack[callStack.length - 1] : null,
          stack: [...callStack],
          visited: new Set(visitedSet),
          msg: `End of DFSHelper(${lbl(src)})`,
        });
      };

      dfsHelper(sourceId);

      steps.push({
        type: "done",
        node: null,
        stack: [],
        visited: new Set(visitedSet),
        msg: "cout << endl;\n✓ DFS complete.",
      });

      return steps;
    },
    [nodes, edges, lbl]
  );

  const stepMap: Record<string, number> = {
    init: 0,
    visit: 1,
    "for-loop": 2,
    "check-neighbor": 3,
    recurse: 4,
    skip: 3,
    return: 2,
    "end-func": 5,
    done: 6,
  };

  const applyStep = useCallback(
    (step: DFSStep) => {
      setStack(step.stack);
      setVisited(step.visited);
      setCurrentNodeId(step.node);
      setHighlightEdge(step.edge || null);
      setNeighborChecking(step.neighbor ?? null);
      if (step.traversalAdd !== undefined) {
        traversalRef.current = [...traversalRef.current, step.traversalAdd];
        setTraversal([...traversalRef.current]);
      }

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

  const startDFS = useCallback(
    (sourceId: number) => {
      if (runningRef.current && pausedRef.current) {
        pausedRef.current = false;
        setPaused(false);
        autoStep();
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      traversalRef.current = [];
      setStack([]);
      setVisited(new Set());
      setTraversal([]);
      setCurrentNodeId(null);
      setHighlightEdge(null);
      setNeighborChecking(null);
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

  const stepDFS = useCallback(
    (sourceId: number) => {
      if (!runningRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        traversalRef.current = [];
        setStack([]);
        setVisited(new Set());
        setTraversal([]);
        setCurrentNodeId(null);
        setHighlightEdge(null);
        setNeighborChecking(null);
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
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetDFS = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false;
    pausedRef.current = false;
    traversalRef.current = [];
    stepsRef.current = [];
    stepIdxRef.current = 0;
    setRunning(false);
    setPaused(false);
    setStack([]);
    setVisited(new Set());
    setTraversal([]);
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
    running,
    paused,
    stack,
    visited,
    traversal,
    currentNodeId,
    highlightEdge,
    neighborChecking,
    activeStepIdx,
    logEntries,
    startDFS,
    stepDFS,
    togglePause,
    resetDFS,
    setSpeed,
  };
}
