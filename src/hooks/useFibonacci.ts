import { useState, useRef, useCallback, useEffect } from 'react';

export type FibMode = "tabulation" | "recursive" | "memoization";

export interface TreeNode {
  id: string;
  n: number;
  state: "pending" | "computing" | "computed" | "memo_hit";
  result: number | null;
  children: ({ id: string, label: string } | null)[];
  parent: string | null;
}

export interface FibState {
  n: number;
  mode: FibMode;
  dp: (number | null)[];
  tree: Record<string, TreeNode>;
  rootId: string | null;
  callStack: { func: string; args: any }[];
  logs: string[];
  activeCodeLine: number | null;
  currI: number;
  highlightCells: { i: number, color: string }[];
  backtrackingEdge: { from: string, to: string | null, value: number } | null;
  isFinished: boolean;
}

export const FIB_CODES = {
  tabulation: [
    "int fib(int n) {",
    "    if (n <= 1) return n;",
    "    vector<int> dp(n + 1, 0);",
    "    dp[1] = 1;",
    "    for(int i = 2; i <= n; i++) {",
    "        dp[i] = dp[i-1] + dp[i-2];",
    "    }",
    "    return dp[n];",
    "}"
  ],
  recursive: [
    "int fib(int n) {",
    "    if(n <= 1) return n;",
    "    return fib(n-1) + fib(n-2);",
    "}"
  ],
  memoization: [
    "int fib(int n, vector<int>& memo) {",
    "    if(n <= 1) return n;",
    "    if(memo[n] != -1) return memo[n];",
    "    memo[n] = fib(n-1, memo) + fib(n-2, memo);",
    "    return memo[n];",
    "}"
  ]
};

export const useFibonacci = () => {
  const [fibState, setState] = useState<FibState>({
    n: 5,
    mode: "recursive",
    dp: [],
    tree: {},
    rootId: null,
    callStack: [],
    logs: [],
    activeCodeLine: null,
    currI: -1,
    highlightCells: [],
    backtrackingEdge: null,
    isFinished: false
  });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(5);

  useEffect(() => {
    if (running && !paused) {
      playFrames();
    }
  }, [speed]);

  const framesRef = useRef<FibState[]>([]);
  const currentFrameRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pushFrame = (state: FibState) => {
    framesRef.current.push({ ...state, dp: [...state.dp], callStack: [...state.callStack], tree: { ...state.tree } });
  };

  const initData = (n: number, mode: FibMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const initialDp = Array(n + 1).fill(null);
    setState({
      n, mode, dp: initialDp, tree: {}, rootId: null, callStack: [], logs: ["Initialized"],
      activeCodeLine: null, currI: -1, highlightCells: [], backtrackingEdge: null, isFinished: false
    });
    setRunning(false);
    setPaused(false);
  };

  const generateFrames = (n: number, mode: FibMode) => {
    framesRef.current = [];
    currentFrameRef.current = 0;
    
    let currentState: FibState = {
      n, mode,
      dp: Array(n + 1).fill(null),
      tree: {}, rootId: null, callStack: [], logs: [`Starting Fibonacci ${mode}`],
      activeCodeLine: null, currI: -1, highlightCells: [], backtrackingEdge: null, isFinished: false
    };

    const push = (line: number | null, msg: string, updates: Partial<FibState> = {}) => {
      currentState = { ...currentState, activeCodeLine: line, ...updates, logs: [...currentState.logs.slice(-4), msg] };
      pushFrame(currentState);
    };

    if (mode === "tabulation") {
      currentState.dp[0] = 0;
      push(2, `dp[0] = 0`, { dp: [...currentState.dp] });
      
      if (n >= 1) {
        currentState.dp[1] = 1;
        push(3, `dp[1] = 1`, { dp: [...currentState.dp] });
      }

      for (let i = 2; i <= n; i++) {
        push(4, `Calculating dp[${i}]`, { currI: i });
        currentState.dp[i] = currentState.dp[i - 1]! + currentState.dp[i - 2]!;
        push(5, `dp[${i}] = dp[${i-1}] + dp[${i-2}] = ${currentState.dp[i]}`, { 
            dp: [...currentState.dp],
            highlightCells: [{ i: i - 1, color: "rgba(34,197,94,0.3)" }, { i: i - 2, color: "rgba(34,197,94,0.3)" }]
        });
      }
      push(7, `Finished tabulation. Result: ${currentState.dp[n]}`, { currI: -1, highlightCells: [{ i: n, color: 'rgba(168,85,247,0.8)' }], isFinished: true });

    } else {
      let nextId = 1;
      const rootId = `fib(${n})-1`;
      currentState.rootId = rootId;
      
      if (mode === "memoization") {
         for(let i=0; i<=n; i++) currentState.dp[i] = null;
      }

      const solve = (i: number, parentId: string | null, edgeLabel: string = "", direction: "left" | "right" = "left"): number => {
        const id = `fib(${i})-${nextId++}`;
        const node: TreeNode = { id, n: i, state: "computing", result: null, children: [null, null], parent: parentId };
        
        const newTree = { ...currentState.tree, [id]: node };
        if (parentId) {
           const parentNode = { ...newTree[parentId] };
           parentNode.children = [...parentNode.children];
           parentNode.children[direction === "left" ? 0 : 1] = { id, label: edgeLabel };
           newTree[parentId] = parentNode;
        }
        
        const newStack = [...currentState.callStack, { func: "fib", args: { n: i } }];
        push(mode === "recursive" ? 0 : 0, `Called fib(${i})`, { tree: newTree, callStack: newStack, currI: i });
        
        if (i <= 1) {
           const latestNode = { ...currentState.tree[id], state: "computed" as const, result: i };
           currentState.backtrackingEdge = { from: id, to: parentId, value: i };
           push(1, `Base case hit. fib(${i}) = ${i}`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
           currentState.callStack.pop();
           currentState.backtrackingEdge = null;
           push(mode === "recursive" ? 1 : 1, `Returning ${i}`, { callStack: [...currentState.callStack], backtrackingEdge: null });
           return i;
        }

        if (mode === "memoization") {
           push(2, `Checking memo[${i}]`);
           if (currentState.dp[i] !== null && currentState.dp[i] !== undefined) {
             const latestNode = { ...currentState.tree[id], state: "memo_hit" as const, result: currentState.dp[i] };
             currentState.backtrackingEdge = { from: id, to: parentId, value: latestNode.result! };
             push(2, `Memo hit! Return ${latestNode.result}`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
             currentState.callStack.pop();
             currentState.backtrackingEdge = null;
             push(2, `Returning from memo`, { callStack: [...currentState.callStack], backtrackingEdge: null });
             return latestNode.result as number;
           }
        }

        push(mode === "recursive" ? 2 : 3, `Recursing on fib(${i-1}) and fib(${i-2})`);
        const left = solve(i-1, id, "fib(n-1)", "left");
        const right = solve(i-2, id, "fib(n-2)", "right");
        const res = left + right;

        if (mode === "memoization") {
           const newDp = [...currentState.dp];
           newDp[i] = res;
           push(4, `Saving to memo[${i}] = ${res}`, { dp: newDp });
        }

        const latestNode = { ...currentState.tree[id], state: "computed" as const, result: res };
        currentState.backtrackingEdge = { from: id, to: parentId, value: res };
        push(mode === "recursive" ? 2 : 4, `Returning ${res}`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
        
        currentState.callStack.pop();
        currentState.backtrackingEdge = null;
        push(mode === "recursive" ? 2 : 4, `Popped from stack`, { callStack: [...currentState.callStack], backtrackingEdge: null });
        return res;
      };

      solve(n, null, "");
      push(null, `Finished ${mode}.`, { currI: -1, isFinished: true, highlightCells: mode === "memoization" ? [{ i: n, color: 'rgba(168,85,247,0.8)' }] : [] });
    }

    setRunning(true);
    setPaused(false);
    playFrames();
  };

  const playFrames = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const delay = Math.max(50, 1000 - (speed - 1) * 100);
    timerRef.current = setInterval(() => {
      if (currentFrameRef.current < framesRef.current.length - 1) {
        currentFrameRef.current++;
        setState(framesRef.current[currentFrameRef.current]);
      } else {
        clearInterval(timerRef.current!);
        setRunning(false);
      }
    }, delay);
  }, [speed]);

  const pause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPaused(true);
    setRunning(false);
  };

  const resume = () => {
    setPaused(false);
    setRunning(true);
    playFrames();
  };

  const reset = (n: number, mode: FibMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    initData(n, mode);
  };

  return { fibState, running, paused, speed, setSpeed, generateFrames, pause, resume, reset };
};
