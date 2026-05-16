import { useState, useRef, useCallback, useEffect } from 'react';

export type CCMode = "tabulation" | "recursive" | "memoization";

export interface TreeNode {
  id: string;
  i: number;
  amount: number;
  state: "pending" | "computing" | "computed" | "memo_hit";
  result: number | null;
  children: ({ id: string, label: string } | null)[]; // [skip, take]
  parent: string | null;
}

export interface CCState {
  n: number;
  coins: number[];
  mode: CCMode;
  dp: (number | null)[][];
  tree: Record<string, TreeNode>;
  rootId: string | null;
  callStack: { func: string; args: any }[];
  logs: string[];
  activeCodeLine: number | null;
  currI: number;
  currAmount: number;
  highlightCells: { r: number, c: number, color: string }[];
  backtrackingEdge: { from: string, to: string | null, value: number } | null;
  foundCombinations: number[][];
  isFinished: boolean;
}

export const CC_CODES = {
  tabulation: [
    "int CC_tab(int n, int target) {",
    "    vector<vector<int>> dp(n + 2, vector<int>(target + 1, 0));",
    "    for(int i = 1; i <= n + 1; i++) dp[i][0] = 1;",
    "    for(int i = n; i >= 1; i--) {",
    "        for(int amount = 1; amount <= target; amount++) {",
    "            int skip = dp[i + 1][amount];",
    "            int take = 0;",
    "            if(coin[i] <= amount)",
    "                take = dp[i][amount - coin[i]];",
    "            dp[i][amount] = take + skip;",
    "        }",
    "    }",
    "    return dp[1][target];",
    "}"
  ],
  recursive: [
    "int CC(int i, int amount) {",
    "    if(amount == 0) return 1;",
    "    if(i > n || amount < 0) return 0;",
    "    int skip = CC(i + 1, amount);",
    "    int take = 0;",
    "    if(coin[i] <= amount)",
    "        take = CC(i, amount - coin[i]);",
    "    return take + skip;",
    "}"
  ],
  memoization: [
    "int CC(int i, int amount, vector<vector<int>>& memo) {",
    "    if(amount == 0) return 1;",
    "    if(i > n || amount < 0) return 0;",
    "    if(memo[i][amount] != -1) return memo[i][amount];",
    "    int skip = CC(i + 1, amount, memo);",
    "    int take = 0;",
    "    if(coin[i] <= amount)",
    "        take = CC(i, amount - coin[i], memo);",
    "    return memo[i][amount] = take + skip;",
    "}"
  ]
};

export const useCoinChange = () => {
  const [ccState, setState] = useState<CCState>({
    n: 3,
    coins: [0, 1, 2, 5],
    mode: "recursive",
    dp: [],
    tree: {},
    rootId: null,
    callStack: [],
    logs: [],
    activeCodeLine: null,
    currI: -1,
    currAmount: -1,
    highlightCells: [],
    backtrackingEdge: null,
    foundCombinations: [],
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

  const framesRef = useRef<CCState[]>([]);
  const currentFrameRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pushFrame = (state: CCState) => {
    const deepDp = state.dp.map(row => [...row]);
    framesRef.current.push({ ...state, dp: deepDp, callStack: [...state.callStack], tree: { ...state.tree }, foundCombinations: [...state.foundCombinations] });
  };

  const initData = (n: number, coins: number[], mode: CCMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const paddedCoins = [0, ...coins];
    const initialDp = Array.from({ length: n + 2 }, () => Array(n + 1).fill(null));
    setState({
      n, coins: paddedCoins, mode, dp: initialDp, tree: {}, rootId: null, callStack: [], logs: ["Initialized"],
      activeCodeLine: null, currI: -1, currAmount: -1, highlightCells: [], backtrackingEdge: null, foundCombinations: [], isFinished: false
    });
    setRunning(false);
    setPaused(false);
  };

  const generateFrames = (n: number, targetAmount: number, coins: number[], mode: CCMode) => {
    framesRef.current = [];
    currentFrameRef.current = 0;
    
    const paddedCoins = [0, ...coins];
    let currentState: CCState = {
      n: coins.length, coins: paddedCoins, mode,
      dp: Array.from({ length: coins.length + 2 }, () => Array(targetAmount + 1).fill(null)),
      tree: {}, rootId: null, callStack: [], logs: [`Starting Coin Change ${mode}`],
      activeCodeLine: null, currI: -1, currAmount: -1, highlightCells: [], backtrackingEdge: null, foundCombinations: [], isFinished: false
    };
    const maxI = coins.length;

    const push = (line: number | null, msg: string, updates: Partial<CCState> = {}) => {
      currentState = { ...currentState, activeCodeLine: line, ...updates, logs: [...currentState.logs.slice(-4), msg] };
      pushFrame(currentState);
    };

    if (mode === "tabulation") {
      for (let i = 1; i <= maxI + 1; i++) {
        currentState.dp[i][0] = 1;
      }
      for (let amt = 1; amt <= targetAmount; amt++) {
        currentState.dp[maxI + 1][amt] = 0;
      }
      push(2, `Initialized base cases (amount=0 -> 1)`, { dp: [...currentState.dp] });

      for (let i = maxI; i >= 1; i--) {
        for (let amt = 1; amt <= targetAmount; amt++) {
            push(4, `Calculating dp[${i}][${amt}]`, { currI: i, currAmount: amt });
            const skip = currentState.dp[i + 1][amt]!;
            push(5, `skip = dp[${i+1}][${amt}] = ${skip}`, { highlightCells: [{ r: i+1, c: amt, color: "rgba(34,197,94,0.3)" }] });
            
            let take = 0;
            if (paddedCoins[i] <= amt) {
                take = currentState.dp[i][amt - paddedCoins[i]]!;
                push(8, `take = dp[${i}][${amt}-${paddedCoins[i]}] = ${take}`, { highlightCells: [{ r: i, c: amt - paddedCoins[i], color: "rgba(168,85,247,0.3)" }] });
            } else {
                push(7, `Cannot take coin ${paddedCoins[i]} (target amount ${amt} is smaller)`);
            }
            
            currentState.dp[i][amt] = take + skip;
            push(9, `dp[${i}][${amt}] = ${take} + ${skip} = ${currentState.dp[i][amt]}`, { dp: [...currentState.dp], highlightCells: [] });
        }
      }
      push(12, `Finished tabulation. Result: ${currentState.dp[1][targetAmount]}`, { currI: -1, currAmount: -1, highlightCells: [{ r: 1, c: targetAmount, color: 'rgba(168,85,247,0.8)' }], isFinished: true });

    } else {
      let nextId = 1;
      const rootId = `cc(1,${targetAmount})-1`;
      currentState.rootId = rootId;
      
      if (mode === "memoization") {
         for (let i = 1; i <= maxI + 1; i++) currentState.dp[i][0] = 1;
         for (let amt = 1; amt <= targetAmount; amt++) currentState.dp[maxI + 1][amt] = 0;
      }

      const solve = (i: number, amount: number, parentId: string | null, edgeLabel: string = "", direction: "left" | "right" = "left", currentCombo: number[] = []): number => {
        const id = `cc(${i},${amount})-${nextId++}`;
        const node: TreeNode = { id, i, amount, state: "computing", result: null, children: [null, null], parent: parentId };
        
        const newTree = { ...currentState.tree, [id]: node };
        if (parentId) {
           const parentNode = { ...newTree[parentId] };
           parentNode.children = [...parentNode.children];
           parentNode.children[direction === "left" ? 0 : 1] = { id, label: edgeLabel };
           newTree[parentId] = parentNode;
        }
        
        const newStack = [...currentState.callStack, { func: "CC", args: { i, amount } }];
        push(0, `Called CC(${i}, ${amount})`, { tree: newTree, callStack: newStack, currI: i, currAmount: amount });
        
        if (amount === 0) {
           const latestNode = { ...currentState.tree[id], state: "computed" as const, result: 1 };
           currentState.backtrackingEdge = { from: id, to: parentId, value: 1 };
           const newCombos = [...currentState.foundCombinations, [...currentCombo]];
           push(1, `Base case hit. CC(${i}, 0) = 1`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge, foundCombinations: newCombos });
           currentState.foundCombinations = newCombos;
           currentState.callStack.pop();
           currentState.backtrackingEdge = null;
           push(1, `Returning 1`, { callStack: [...currentState.callStack], backtrackingEdge: null });
           return 1;
        }

        if (i > maxI || amount < 0) {
           const latestNode = { ...currentState.tree[id], state: "computed" as const, result: 0 };
           currentState.backtrackingEdge = { from: id, to: parentId, value: 0 };
           push(2, `Base case hit (Out of bounds). Return 0`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
           currentState.callStack.pop();
           currentState.backtrackingEdge = null;
           push(2, `Returning 0`, { callStack: [...currentState.callStack], backtrackingEdge: null });
           return 0;
        }

        if (mode === "memoization") {
           push(3, `Checking memo[${i}][${amount}]`);
           if (currentState.dp[i][amount] !== null && currentState.dp[i][amount] !== undefined) {
             const latestNode = { ...currentState.tree[id], state: "memo_hit" as const, result: currentState.dp[i][amount] };
             currentState.backtrackingEdge = { from: id, to: parentId, value: latestNode.result! };
             push(3, `Memo hit! Return ${latestNode.result}`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
             currentState.callStack.pop();
             currentState.backtrackingEdge = null;
             push(3, `Returning from memo`, { callStack: [...currentState.callStack], backtrackingEdge: null });
             return latestNode.result as number;
           }
        }

        push(4, `Exploring skip case: CC(${i+1}, ${amount})`);
        const skip = solve(i + 1, amount, id, "Skip", "left", [...currentCombo]);
        
        let take = 0;
        if (paddedCoins[i] <= amount) {
            push(6, `Exploring take case: CC(${i}, ${amount - paddedCoins[i]})`);
            take = solve(i, amount - paddedCoins[i], id, "Take", "right", [...currentCombo, paddedCoins[i]]);
        } else {
            push(5, `Take skipped: coin ${paddedCoins[i]} > amount ${amount}`);
        }

        const ways = take + skip;

        if (mode === "memoization") {
           const newDp = currentState.dp.map(r => [...r]);
           newDp[i][amount] = ways;
           push(9, `Saving to memo[${i}][${amount}] = ${ways}`, { dp: newDp });
        }

        const latestNode = { ...currentState.tree[id], state: "computed" as const, result: ways };
        currentState.backtrackingEdge = { from: id, to: parentId, value: ways };
        push(10, `Returning take(${take}) + skip(${skip}) = ${ways}`, { tree: { ...currentState.tree, [id]: latestNode }, backtrackingEdge: currentState.backtrackingEdge });
        
        currentState.callStack.pop();
        currentState.backtrackingEdge = null;
        push(10, `Popped from stack`, { callStack: [...currentState.callStack], backtrackingEdge: null });
        return ways;
      };

      solve(1, targetAmount, null, "", "left", []);
      push(null, `Finished ${mode}.`, { currI: -1, currAmount: -1, isFinished: true, highlightCells: mode === "memoization" ? [{ r: 1, c: targetAmount, color: 'rgba(168,85,247,0.8)' }] : [] });
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

  const reset = (n: number, coins: number[], mode: CCMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    initData(n, coins, mode);
  };

  return { ccState, running, paused, speed, setSpeed, generateFrames, pause, resume, reset };
};
