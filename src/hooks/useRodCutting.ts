import { useState, useRef, useCallback, useEffect } from 'react';

export type RCMode = "tabulation" | "recursive" | "memoization";

export interface TreeNode {
  id: string;
  i: number;
  len: number;
  state: "pending" | "computing" | "computed" | "memo_hit";
  result: number | null;
  children: ({ id: string, label: string } | null)[]; // [skip, take]
  parent: string | null;
}

export interface RCState {
  n: number;
  prices: number[];
  mode: RCMode;
  dp: (number | null)[][];
  tree: Record<string, TreeNode>;
  rootId: string | null;
  callStack: { func: string; args: any }[];
  logs: string[];
  activeCodeLine: number | null;
  currI: number;
  currLen: number;
  highlightCells: { r: number, c: number, color: string }[];
  backtrackingEdge: { from: string, to: string | null, value: number } | null;
  isFinished: boolean;
}

export const RC_CODES = {
  tabulation: [
    "int RC_tab(int n, int target_len) {",
    "    vector<vector<int>> dp(n + 2, vector<int>(target_len + 1, 0));",
    "    for(int i = n; i >= 1; i--) {",
    "        for(int len = 1; len <= target_len; len++) {",
    "            int skip = dp[i + 1][len];",
    "            int take = 0;",
    "            if(i <= len)",
    "                take = price[i] + dp[i][len - i];",
    "            dp[i][len] = max(take, skip);",
    "        }",
    "    }",
    "    return dp[1][target_len];",
    "}"
  ],
  recursive: [
    "int RC(int i, int len) {",
    "    if(i > n || len == 0) return 0;",
    "    int skip = RC(i + 1, len);",
    "    int take = 0;",
    "    if(i <= len)",
    "        take = price[i] + RC(i, len - i);",
    "    return max(take, skip);",
    "}"
  ],
  memoization: [
    "int RC(int i, int len, vector<vector<int>>& memo) {",
    "    if(i > n || len == 0) return 0;",
    "    if(memo[i][len] != -1) return memo[i][len];",
    "    int skip = RC(i + 1, len, memo);",
    "    int take = 0;",
    "    if(i <= len)",
    "        take = price[i] + RC(i, len - i, memo);",
    "    return memo[i][len] = max(take, skip);",
    "}"
  ]
};

export const useRodCutting = () => {
  const [rcState, setState] = useState<RCState>({
    n: 4,
    prices: [0, 1, 5, 8, 9, 10, 17, 17, 20],
    mode: "recursive",
    dp: [],
    tree: {},
    rootId: null,
    callStack: [],
    logs: [],
    activeCodeLine: null,
    currI: -1,
    currLen: -1,
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

  const framesRef = useRef<RCState[]>([]);
  const currentFrameRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pushFrame = (state: RCState) => {
    const deepDp = state.dp.map(row => [...row]);
    framesRef.current.push({ ...state, dp: deepDp, callStack: [...state.callStack], tree: { ...state.tree } });
  };

  const initData = (n: number, prices: number[], mode: RCMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    // User passes prices without the 0 padding, so we pad it.
    const paddedPrices = [0, ...prices];
    const initialDp = Array.from({ length: n + 2 }, () => Array(n + 1).fill(null));
    setState({
      n, prices: paddedPrices, mode, dp: initialDp, tree: {}, rootId: null, callStack: [], logs: ["Initialized"],
      activeCodeLine: null, currI: -1, currLen: -1, highlightCells: [], backtrackingEdge: null, isFinished: false
    });
    setRunning(false);
    setPaused(false);
  };

  const generateFrames = (n: number, prices: number[], mode: RCMode) => {
    framesRef.current = [];
    currentFrameRef.current = 0;
    
    const paddedPrices = [0, ...prices];
    let currentState: RCState = {
      n, prices: paddedPrices, mode,
      dp: Array.from({ length: n + 2 }, () => Array(n + 1).fill(null)),
      tree: {}, rootId: null, callStack: [], logs: [`Starting Rod Cutting ${mode}`],
      activeCodeLine: null, currI: -1, currLen: -1, highlightCells: [], backtrackingEdge: null, isFinished: false
    };

    const push = (line: number | null, msg: string, updates: Partial<RCState> = {}) => {
      currentState = { ...currentState, activeCodeLine: line, ...updates, logs: [...currentState.logs.slice(-4), msg] };
      pushFrame(currentState);
    };

    if (mode === "tabulation") {
      // Initialize base cases in DP table for visualization
      for (let i = 1; i <= n + 1; i++) {
        currentState.dp[i][0] = 0;
      }
      for (let len = 0; len <= n; len++) {
        currentState.dp[n + 1][len] = 0;
      }
      push(1, `Initialized base cases (dp[n+1][len]=0, dp[i][0]=0)`, { dp: [...currentState.dp] });

      for (let i = n; i >= 1; i--) {
        for (let len = 1; len <= n; len++) {
            push(3, `Calculating dp[${i}][${len}]`, { currI: i, currLen: len });
            const skip = currentState.dp[i + 1][len]!;
            push(4, `skip = dp[${i+1}][${len}] = ${skip}`, { highlightCells: [{ r: i+1, c: len, color: "rgba(34,197,94,0.3)" }] });
            
            let take = 0;
            if (i <= len) {
                take = paddedPrices[i] + currentState.dp[i][len - i]!;
                push(6, `take = price[${i}] + dp[${i}][${len-i}] = ${paddedPrices[i]} + ${currentState.dp[i][len-i]} = ${take}`, { highlightCells: [{ r: i, c: len - i, color: "rgba(168,85,247,0.3)" }] });
            } else {
                push(6, `Cannot take length ${i} (target length ${len} is smaller)`);
            }
            
            currentState.dp[i][len] = Math.max(take, skip);
            push(7, `dp[${i}][${len}] = max(${take}, ${skip}) = ${currentState.dp[i][len]}`, { dp: [...currentState.dp], highlightCells: [] });
        }
      }
      push(10, `Finished tabulation. Result: ${currentState.dp[1][n]}`, { currI: -1, currLen: -1, highlightCells: [{ r: 1, c: n, color: 'rgba(168,85,247,0.8)' }], isFinished: true });

    } else {
      let nextId = 1;
      const rootId = `rc(1,${n})-1`;
      currentState.rootId = rootId;
      
      if (mode === "memoization") {
         // pre-fill base cases to match DP table display
         for (let i = 1; i <= n + 1; i++) currentState.dp[i][0] = 0;
         for (let len = 0; len <= n; len++) currentState.dp[n + 1][len] = 0;
      }

      const solve = (i: number, len: number, parentId: string | null, edgeLabel: string = "", direction: "left" | "right" = "left"): number => {
        const id = `rc(${i},${len})-${nextId++}`;
        const node: TreeNode = { id, i, len, state: "computing", result: null, children: [null, null], parent: parentId };
        
        const newTree = { ...currentState.tree, [id]: node };
        if (parentId) {
           const parentNode = { ...newTree[parentId] };
           parentNode.children = [...parentNode.children];
           parentNode.children[direction === "left" ? 0 : 1] = { id, label: edgeLabel };
           newTree[parentId] = parentNode;
        }
        
        const newStack = [...currentState.callStack, { func: "RC", args: { i, len } }];
        push(0, `Called RC(${i}, ${len})`, { tree: newTree, callStack: newStack, currI: i, currLen: len });
        
        if (i > n || len === 0) {
           const latestNode = { ...currentState.tree[id], state: "computed" as const, result: 0 };
           currentState.backtrackingEdge = { from: id, to: parentId, value: 0 };
           push(1, `Base case hit. RC(${i}, ${len}) = 0`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
           currentState.callStack.pop();
           currentState.backtrackingEdge = null;
           push(1, `Returning 0`, { callStack: [...currentState.callStack], backtrackingEdge: null });
           return 0;
        }

        if (mode === "memoization") {
           push(2, `Checking memo[${i}][${len}]`);
           if (currentState.dp[i][len] !== null && currentState.dp[i][len] !== undefined) {
             const latestNode = { ...currentState.tree[id], state: "memo_hit" as const, result: currentState.dp[i][len] };
             currentState.backtrackingEdge = { from: id, to: parentId, value: latestNode.result! };
             push(2, `Memo hit! Return ${latestNode.result}`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
             currentState.callStack.pop();
             currentState.backtrackingEdge = null;
             push(2, `Returning from memo`, { callStack: [...currentState.callStack], backtrackingEdge: null });
             return latestNode.result as number;
           }
        }

        push(3, `Exploring skip case: RC(${i+1}, ${len})`);
        const skip = solve(i + 1, len, id, "Skip", "left");
        
        let take = 0;
        if (i <= len) {
            push(4, `Exploring take case: price[${i}] + RC(${i}, ${len - i})`);
            take = paddedPrices[i] + solve(i, len - i, id, "Take", "right");
        } else {
            push(4, `Take skipped: index ${i} > remaining len ${len}`);
        }

        const max_val = Math.max(take, skip);

        if (mode === "memoization") {
           const newDp = currentState.dp.map(r => [...r]);
           newDp[i][len] = max_val;
           push(7, `Saving to memo[${i}][${len}] = ${max_val}`, { dp: newDp });
        }

        const latestNode = { ...currentState.tree[id], state: "computed" as const, result: max_val };
        currentState.backtrackingEdge = { from: id, to: parentId, value: max_val };
        push(7, `Returning max(${take}, ${skip}) = ${max_val}`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
        
        currentState.callStack.pop();
        currentState.backtrackingEdge = null;
        push(7, `Popped from stack`, { callStack: [...currentState.callStack], backtrackingEdge: null });
        return max_val;
      };

      solve(1, n, null, "");
      push(null, `Finished ${mode}.`, { currI: -1, currLen: -1, isFinished: true, highlightCells: mode === "memoization" ? [{ r: 1, c: n, color: 'rgba(168,85,247,0.8)' }] : [] });
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

  const reset = (n: number, prices: number[], mode: RCMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    initData(n, prices, mode);
  };

  return { rcState, running, paused, speed, setSpeed, generateFrames, pause, resume, reset };
};
