import { useState, useRef, useCallback } from 'react';

export type LCSMode = "tabulation" | "recursive" | "memoization";

export interface TreeNode {
  id: string;
  i: number;
  j: number;
  state: "pending" | "computing" | "computed" | "memo_hit";
  result: number | null;
  children: ({ id: string, label: string } | null)[]; // Always length 2: [left, right]
  parent: string | null;
}

export interface LCSState {
  s1: string;
  s2: string;
  mode: LCSMode;
  dp: (number | null)[][];
  tree: Record<string, TreeNode>;
  rootId: string | null;
  callStack: { func: string; args: any }[];
  logs: string[];
  activeCodeLine: number | null;
  currI: number;
  currJ: number;
  comparing: [number, number] | null;
  highlightCells: { r: number, c: number, color: string }[];
  backtrackingEdge: { from: string, to: string | null, value: number } | null;
  allLCS: string[];
  isFinished: boolean;
}

export const LCS_CODES = {
  tabulation: [
    "int lcs(string s1, string s2) {",
    "    int n = s1.length(), m = s2.length();",
    "    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));",
    "    for(int i = 1; i <= n; i++) {",
    "        for(int j = 1; j <= m; j++) {",
    "            if(s1[i-1] == s2[j-1]) {",
    "                dp[i][j] = 1 + dp[i-1][j-1];",
    "            } else {",
    "                dp[i][j] = max(dp[i-1][j], dp[i][j-1]);",
    "            }",
    "        }",
    "    }",
    "    return dp[n][m];",
    "}"
  ],
  recursive: [
    "int lcs(int i, int j, string& s1, string& s2) {",
    "    if(i == 0 || j == 0) return 0;",
    "    if(s1[i-1] == s2[j-1]) {",
    "        return 1 + lcs(i-1, j-1, s1, s2);",
    "    }",
    "    return max(lcs(i-1, j, s1, s2), lcs(i, j-1, s1, s2));",
    "}"
  ],
  memoization: [
    "int lcs(int i, int j, string& s1, string& s2, vector<vector<int>>& memo) {",
    "    if(i == 0 || j == 0) return 0;",
    "    if(memo[i][j] != -1) return memo[i][j];",
    "    if(s1[i-1] == s2[j-1]) {",
    "        return memo[i][j] = 1 + lcs(i-1, j-1, s1, s2, memo);",
    "    }",
    "    return memo[i][j] = max(lcs(i-1, j, s1, s2, memo), lcs(i, j-1, s1, s2, memo));",
    "}"
  ]
};

export function useLCS() {
  const [state, setState] = useState<LCSState>({
    s1: "ABCBDAB",
    s2: "BDCAB",
    mode: "tabulation",
    dp: [],
    tree: {},
    rootId: null,
    callStack: [],
    logs: ["Ready to run LCS."],
    activeCodeLine: null,
    currI: -1,
    currJ: -1,
    comparing: null,
    highlightCells: [],
    backtrackingEdge: null,
    allLCS: [],
    isFinished: false
  });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const speedRef = useRef(5);
  const framesRef = useRef<LCSState[]>([]);
  const currentFrameRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const setSpeed = useCallback((s: number) => { speedRef.current = s; }, []);

  const getDelay = () => {
    return Math.max(50, 1000 - (speedRef.current - 1) * 100);
  };

  const pushFrame = (newState: LCSState) => {
    framesRef.current.push(JSON.parse(JSON.stringify(newState)));
  };

  const runAnimation = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (currentFrameRef.current < framesRef.current.length) {
        setState(framesRef.current[currentFrameRef.current]);
        currentFrameRef.current++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        setRunning(false);
      }
    }, getDelay());
  }, []);

  const togglePause = useCallback(() => {
    if (paused) {
      setPaused(false);
      runAnimation();
    } else {
      setPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [paused, runAnimation]);

  const initData = (s1: string, s2: string, mode: LCSMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const n = s1.length;
    const m = s2.length;
    const initialDp: (number | null)[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(null));
    
    if (mode === "tabulation") {
      for(let i = 0; i <= n; i++) initialDp[i][0] = 0;
      for(let j = 0; j <= m; j++) initialDp[0][j] = 0;
    } else if (mode === "memoization") {
      for(let i = 0; i <= n; i++) {
        for(let j=0; j <= m; j++) {
           if(i===0 || j===0) initialDp[i][j] = 0;
        }
      }
    }

    setState({
      s1, s2, mode, dp: initialDp, tree: {}, rootId: null, callStack: [], logs: ["Initialized"],
      activeCodeLine: null, currI: -1, currJ: -1, comparing: null, highlightCells: [], backtrackingEdge: null, allLCS: [], isFinished: false
    });
    setRunning(false);
    setPaused(false);
  };

  const generateFrames = (s1: string, s2: string, mode: LCSMode) => {
    framesRef.current = [];
    currentFrameRef.current = 0;
    
    const n = s1.length;
    const m = s2.length;
    
    let currentState: LCSState = {
      s1, s2, mode,
      dp: Array(n + 1).fill(null).map(() => Array(m + 1).fill(null)),
      tree: {}, rootId: null, callStack: [], logs: [`Starting LCS ${mode}`],
      activeCodeLine: null, currI: -1, currJ: -1, comparing: null, highlightCells: [], backtrackingEdge: null, allLCS: [], isFinished: false
    };

    const push = (line: number | null, msg: string, updates: Partial<LCSState> = {}) => {
      currentState = { ...currentState, activeCodeLine: line, ...updates, logs: [...currentState.logs.slice(-4), msg] };
      pushFrame(currentState);
    };

    const S = new Set<string>();
    const tempDp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
    for(let i=1; i<=n; i++) {
        for(let j=1; j<=m; j++) {
            if(s1[i-1] === s2[j-1]) tempDp[i][j] = 1 + tempDp[i-1][j-1];
            else tempDp[i][j] = Math.max(tempDp[i-1][j], tempDp[i][j-1]);
        }
    }
    const backtrackAll = (i: number, j: number, currentStr: string) => {
        if (i === 0 || j === 0) {
            S.add(currentStr.split('').reverse().join(''));
            return;
        }
        if (s1[i-1] === s2[j-1]) backtrackAll(i-1, j-1, currentStr + s1[i-1]);
        else if (tempDp[i-1][j] > tempDp[i][j-1]) backtrackAll(i-1, j, currentStr);
        else if (tempDp[i][j-1] > tempDp[i-1][j]) backtrackAll(i, j-1, currentStr);
        else { backtrackAll(i-1, j, currentStr); backtrackAll(i, j-1, currentStr); }
    }
    backtrackAll(n, m, "");
    const computedLCS = Array.from(S);

    if (mode === "tabulation") {
      for(let i = 0; i <= n; i++) currentState.dp[i][0] = 0;
      for(let j = 0; j <= m; j++) currentState.dp[0][j] = 0;
      push(2, `Initialized dp array with zeros for base cases.`, { dp: currentState.dp });
      
      for(let i = 1; i <= n; i++) {
        for(let j = 1; j <= m; j++) {
          push(5, `Comparing s1[${i-1}]='${s1[i-1]}' and s2[${j-1}]='${s2[j-1]}'`, { currI: i, currJ: j, comparing: [i-1, j-1] });
          
          if(s1[i-1] === s2[j-1]) {
            const val = currentState.dp[i-1][j-1]! + 1;
            const newDp = currentState.dp.map(r => [...r]);
            newDp[i][j] = val;
            push(6, `Match! dp[${i}][${j}] = 1 + dp[${i-1}][${j-1}] = ${val}`, { 
              dp: newDp, 
              highlightCells: [{r: i-1, c: j-1, color: 'rgba(34,197,94,0.4)'}, {r: i, c: j, color: 'rgba(234,179,8,0.5)'}] 
            });
          } else {
            const up = currentState.dp[i-1][j]!;
            const left = currentState.dp[i][j-1]!;
            const val = Math.max(up, left);
            const newDp = currentState.dp.map(r => [...r]);
            newDp[i][j] = val;
            push(8, `Mismatch. dp[${i}][${j}] = max(${up}, ${left}) = ${val}`, { 
              dp: newDp,
              highlightCells: [{r: i-1, c: j, color: 'rgba(168,85,247,0.4)'}, {r: i, c: j-1, color: 'rgba(168,85,247,0.4)'}, {r: i, c: j, color: 'rgba(234,179,8,0.5)'}]
            });
          }
        }
      }
      push(11, `Finished tabulation. Result: ${currentState.dp[n][m]}`, { currI: -1, currJ: -1, comparing: null, highlightCells: [{ r: n, c: m, color: 'rgba(168,85,247,0.8)' }], isFinished: true, allLCS: computedLCS });

    } else {
      // recursive or memoization
      let nextId = 1;
      const rootId = `lcs(${n},${m})-1`;
      currentState.rootId = rootId;
      
      if (mode === "memoization") {
         for(let i=0; i<=n; i++) {
           for(let j=0; j<=m; j++) {
             if(i===0 || j===0) currentState.dp[i][j] = 0;
           }
         }
      }

      const solve = (i: number, j: number, parentId: string | null, edgeLabel: string = "", direction: "left" | "right" = "left"): number => {
        const id = `lcs(${i},${j})-${nextId++}`;
        const node: TreeNode = { id, i, j, state: "computing", result: null, children: [null, null], parent: parentId };
        
        const newTree = { ...currentState.tree, [id]: node };
        if (parentId) {
           const parentNode = { ...newTree[parentId] };
           parentNode.children = [...parentNode.children];
           parentNode.children[direction === "left" ? 0 : 1] = { id, label: edgeLabel };
           newTree[parentId] = parentNode;
        }
        
        const newStack = [...currentState.callStack, { func: "lcs", args: { i, j } }];
        push(mode === "recursive" ? 0 : 0, `Called lcs(${i}, ${j})`, { tree: newTree, callStack: newStack, currI: i, currJ: j });
        
        if (i === 0 || j === 0) {
           const latestNode = { ...currentState.tree[id], state: "computed" as const, result: 0 };
           currentState.backtrackingEdge = { from: id, to: parentId, value: 0 };
           push(1, `Base case hit. lcs(${i}, ${j}) = 0`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
           currentState.callStack.pop();
           currentState.backtrackingEdge = null;
           push(mode === "recursive" ? 1 : 1, `Returning 0`, { callStack: [...currentState.callStack], backtrackingEdge: null });
           return 0;
        }

        if (mode === "memoization") {
           push(2, `Checking memo[${i}][${j}]`);
           if (currentState.dp[i][j] !== null && currentState.dp[i][j] !== undefined) {
             const latestNode = { ...currentState.tree[id], state: "memo_hit" as const, result: currentState.dp[i][j] };
             currentState.backtrackingEdge = { from: id, to: parentId, value: latestNode.result! };
             push(2, `Memo hit! Return ${latestNode.result}`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
             currentState.callStack.pop();
             currentState.backtrackingEdge = null;
             push(2, `Returning from memo`, { callStack: [...currentState.callStack], backtrackingEdge: null });
             return latestNode.result as number;
           }
        }

        push(mode === "recursive" ? 2 : 3, `Comparing s1[${i-1}] and s2[${j-1}]`, { comparing: [i-1, j-1] });
        
        let res: number;
        if (s1[i-1] === s2[j-1]) {
           push(mode === "recursive" ? 3 : 4, `Match! Recursing on lcs(${i-1}, ${j-1})`);
           res = 1 + solve(i-1, j-1, id, "Take", "right");
           push(mode === "recursive" ? 3 : 4, `lcs(${i}, ${j}) result = ${res}`);
        } else {
           push(mode === "recursive" ? 5 : 6, `Mismatch. Recursing on max(lcs(${i-1}, ${j}), lcs(${i}, ${j-1}))`);
           const left = solve(i-1, j, id, "Skip s1", "left");
           const right = solve(i, j-1, id, "Skip s2", "right");
           res = Math.max(left, right);
           push(mode === "recursive" ? 5 : 6, `lcs(${i}, ${j}) result = max(${left}, ${right}) = ${res}`);
        }

        if (mode === "memoization") {
           const newDp = currentState.dp.map(r => [...r]);
           newDp[i][j] = res;
           push(6, `Saving to memo[${i}][${j}] = ${res}`, { dp: newDp });
        }

        const latestNode = { ...currentState.tree[id], state: "computed" as const, result: res };
        currentState.backtrackingEdge = { from: id, to: parentId, value: res };
        push(mode === "recursive" ? 6 : 7, `Returning ${res}`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
        
        currentState.callStack.pop();
        currentState.backtrackingEdge = null;
        push(mode === "recursive" ? 6 : 7, `Popped from stack`, { callStack: [...currentState.callStack], backtrackingEdge: null });
        return res;
      };

      solve(n, m, null, "");
      push(null, `Finished ${mode}.`, { comparing: null, currI: -1, currJ: -1, isFinished: true, allLCS: computedLCS, highlightCells: mode === "memoization" ? [{ r: n, c: m, color: 'rgba(168,85,247,0.8)' }] : [] });
    }

    setRunning(true);
    setPaused(false);
    runAnimation();
  };

  return {
    ...state,
    running,
    paused,
    setSpeed,
    togglePause,
    initData,
    generateFrames
  };
}
