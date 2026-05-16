"use client";
import { useState, useCallback, useRef } from "react";

export interface MergeAnimData {
  leftArr: number[];
  rightArr: number[];
  leftPtr: number;
  rightPtr: number;
  result: (number | null)[];
  lastFrom: "left" | "right" | null;
  lastResultIdx: number;
}

export interface CallStackItem {
  func: string;
  args: Record<string, string | number>;
}

export interface MergeSortStep {
  type: string;
  array: number[];
  l: number;
  r: number;
  mid: number;
  leftRange: [number, number] | null;
  rightRange: [number, number] | null;
  mergedIndices: number[];
  compareI: number;
  compareJ: number;
  dividedRanges: string[];
  mergedRangesData: [string, number[]][];
  mergeAnim: MergeAnimData | null;
  msg: string;
  activeLine: number;
  callStack: CallStackItem[];
}

interface UseMergeSortReturn {
  running: boolean;
  paused: boolean;
  array: number[];
  activeRange: [number, number] | null;
  leftRange: [number, number] | null;
  rightRange: [number, number] | null;
  mergedIndices: number[];
  compareI: number;
  compareJ: number;
  dividedRanges: Set<string>;
  mergedRangesMap: Map<string, number[]>;
  mergeAnim: MergeAnimData | null;
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  activeLine: number;
  callStack: CallStackItem[];
  startSort: (initialArray: number[]) => void;
  stepSort: (initialArray: number[]) => void;
  togglePause: () => void;
  resetSort: () => void;
  setSpeed: (speed: number) => void;
}

export function useMergeSort(initialArray: number[]): UseMergeSortReturn {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [arrayState, setArrayState] = useState<number[]>([...initialArray]);

  const [activeRange, setActiveRange] = useState<[number, number] | null>(null);
  const [leftRange, setLeftRange] = useState<[number, number] | null>(null);
  const [rightRange, setRightRange] = useState<[number, number] | null>(null);
  const [mergedIndices, setMergedIndices] = useState<number[]>([]);
  const [compareI, setCompareI] = useState(-1);
  const [compareJ, setCompareJ] = useState(-1);
  const [dividedRanges, setDividedRanges] = useState<Set<string>>(new Set());
  const [mergedRangesMap, setMergedRangesMap] = useState<Map<string, number[]>>(new Map());
  const [mergeAnim, setMergeAnim] = useState<MergeAnimData | null>(null);

  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);
  const [activeLine, setActiveLine] = useState<number>(0);
  const [callStack, setCallStack] = useState<CallStackItem[]>([]);

  const stepsRef = useRef<MergeSortStep[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]): MergeSortStep[] => {
    const steps: MergeSortStep[] = [];
    const a = [...arr];
    const divRanges = new Set<string>();
    const mrgRanges = new Map<string, number[]>();
    const stack: CallStackItem[] = [];

    const snap = () => ({
      dividedRanges: [...divRanges],
      mergedRangesData: [...mrgRanges.entries()] as [string, number[]][],
    });

    const pushStep = (
      type: string, l: number, r: number, mid: number,
      leftR: [number, number] | null, rightR: [number, number] | null,
      mergedIdx: number[], cI: number, cJ: number,
      anim: MergeAnimData | null, line: number, msg: string
    ) => {
      steps.push({
        type, array: [...a], l, r, mid,
        leftRange: leftR, rightRange: rightR, mergedIndices: mergedIdx,
        compareI: cI, compareJ: cJ, ...snap(), mergeAnim: anim, msg,
        activeLine: line, callStack: [...stack]
      });
    };

    pushStep("init", 0, a.length - 1, -1, null, null, [], -1, -1, null, 15, `Initialize Merge Sort for array of size ${a.length}.`);

    function mergeSortRec(l: number, r: number) {
      stack.push({ func: "mergeSort", args: { l, r } });
      
      pushStep("divide", l, r, -1, null, null, [], -1, -1, null, 15, `mergeSort(arr, ${l}, ${r})`);
      pushStep("divide", l, r, -1, null, null, [], -1, -1, null, 16, `if(${l} >= ${r})`);

      if (l >= r) {
        mrgRanges.set(`${l}-${r}`, [a[l]]);
        pushStep("divide", l, r, -1, null, null, [], -1, -1, null, 16, `Base case reached.`);
        stack.pop();
        return;
      }

      const mid = l + Math.floor((r - l) / 2);
      divRanges.add(`${l}-${r}`);

      pushStep("divide", l, r, mid, [l, mid], [mid + 1, r], [], -1, -1, null, 17, `mid = ${l} + (${r} - ${l}) / 2 = ${mid}`);
      
      pushStep("divide", l, r, mid, [l, mid], [mid + 1, r], [], -1, -1, null, 18, `Call mergeSort(arr, ${l}, ${mid})`);
      mergeSortRec(l, mid);

      pushStep("divide", l, r, mid, [l, mid], [mid + 1, r], [], -1, -1, null, 19, `Call mergeSort(arr, ${mid + 1}, ${r})`);
      mergeSortRec(mid + 1, r);

      pushStep("merge-start", l, r, mid, [l, mid], [mid + 1, r], [], -1, -1, null, 20, `Call merge(arr, ${l}, ${mid}, ${r})`);
      
      stack.push({ func: "merge", args: { l, m: mid, r } });

      const n1 = mid - l + 1;
      const n2 = r - mid;
      const L = a.slice(l, l + n1);
      const R = a.slice(mid + 1, mid + 1 + n2);
      const resultSlots: (number | null)[] = new Array(r - l + 1).fill(null);

      const makeAnim = (lp: number, rp: number, lf: "left" | "right" | null, lri: number): MergeAnimData => ({
        leftArr: [...L], rightArr: [...R], leftPtr: lp, rightPtr: rp,
        result: [...resultSlots], lastFrom: lf, lastResultIdx: lri,
      });

      pushStep("merge-start", l, r, mid, [l, mid], [mid + 1, r], [], -1, -1, makeAnim(0, 0, null, -1), 2, `n1 = ${n1}, n2 = ${n2}`);
      pushStep("merge-start", l, r, mid, [l, mid], [mid + 1, r], [], -1, -1, makeAnim(0, 0, null, -1), 3, `Create temp arrays L[${n1}], R[${n2}]`);
      pushStep("merge-start", l, r, mid, [l, mid], [mid + 1, r], [], -1, -1, makeAnim(0, 0, null, -1), 4, `Copy data to temp array L`);
      pushStep("merge-start", l, r, mid, [l, mid], [mid + 1, r], [], -1, -1, makeAnim(0, 0, null, -1), 5, `Copy data to temp array R`);
      pushStep("merge-start", l, r, mid, [l, mid], [mid + 1, r], [], -1, -1, makeAnim(0, 0, null, -1), 6, `Initialize pointers i=0, j=0, k=${l}`);

      let i = 0, j = 0, k = l;
      const merged: number[] = [];

      while (i < n1 && j < n2) {
        pushStep("compare", l, r, mid, [l, mid], [mid + 1, r], [...merged], l + i, mid + 1 + j, makeAnim(i, j, null, -1), 7, `while(${i} < ${n1} && ${j} < ${n2})`);
        pushStep("compare", l, r, mid, [l, mid], [mid + 1, r], [...merged], l + i, mid + 1 + j, makeAnim(i, j, null, -1), 8, `if(L[${i}] <= R[${j}])`);

        if (L[i] <= R[j]) {
          a[k] = L[i]; merged.push(k);
          resultSlots[k - l] = L[i];
          pushStep("place", l, r, mid, [l, mid], [mid + 1, r], [...merged], l + i, -1, makeAnim(i + 1, j, "left", k - l), 8, `L[${i}] (${L[i]}) ≤ R[${j}] (${R[j]}). arr[${k}] = L[${i}].`);
          i++;
        } else {
          a[k] = R[j]; merged.push(k);
          resultSlots[k - l] = R[j];
          pushStep("place", l, r, mid, [l, mid], [mid + 1, r], [...merged], -1, mid + 1 + j, makeAnim(i, j + 1, "right", k - l), 9, `R[${j}] (${R[j]}) < L[${i}] (${L[i]}). arr[${k}] = R[${j}].`);
          j++;
        }
        k++;
      }

      pushStep("compare", l, r, mid, [l, mid], [mid + 1, r], [...merged], -1, -1, makeAnim(i, j, null, -1), 7, `Loop condition failed.`);

      pushStep("copy-left", l, r, mid, [l, mid], [mid + 1, r], [...merged], -1, -1, makeAnim(i, j, null, -1), 11, `while(${i} < ${n1})`);
      while (i < n1) {
        a[k] = L[i]; merged.push(k);
        resultSlots[k - l] = L[i];
        pushStep("copy-left", l, r, mid, [l, mid], [mid + 1, r], [...merged], l + i, -1, makeAnim(i + 1, j, "left", k - l), 11, `Copy remaining L[${i}] (${L[i]}) to arr[${k}].`);
        i++; k++;
      }

      pushStep("copy-right", l, r, mid, [l, mid], [mid + 1, r], [...merged], -1, -1, makeAnim(i, j, null, -1), 12, `while(${j} < ${n2})`);
      while (j < n2) {
        a[k] = R[j]; merged.push(k);
        resultSlots[k - l] = R[j];
        pushStep("copy-right", l, r, mid, [l, mid], [mid + 1, r], [...merged], -1, mid + 1 + j, makeAnim(i, j + 1, "right", k - l), 12, `Copy remaining R[${j}] (${R[j]}) to arr[${k}].`);
        j++; k++;
      }

      mrgRanges.set(`${l}-${r}`, a.slice(l, r + 1));
      
      pushStep("merge-done", l, r, mid, null, null, merged, -1, -1, null, 13, `Merge complete for arr[${l}..${r}].`);
      stack.pop(); // Pop merge
      stack.pop(); // Pop mergeSortRec
    }

    mergeSortRec(0, a.length - 1);

    pushStep("done", 0, a.length - 1, -1, null, null, [], -1, -1, null, 0, `✓ Merge Sort complete.`);

    return steps;
  }, []);

  const stepMap: Record<string, number> = {
    init: 0, divide: 1, "merge-start": 2, compare: 3,
    place: 4, "copy-left": 4, "copy-right": 4, "merge-done": 5, done: 6,
  };

  const applyStep = useCallback((step: MergeSortStep) => {
    setArrayState(step.array);
    setActiveRange([step.l, step.r]);
    setLeftRange(step.leftRange);
    setRightRange(step.rightRange);
    setMergedIndices(step.mergedIndices);
    setCompareI(step.compareI);
    setCompareJ(step.compareJ);
    setDividedRanges(new Set(step.dividedRanges));
    setMergedRangesMap(new Map(step.mergedRangesData));
    setMergeAnim(step.mergeAnim);
    setActiveStepIdx(stepMap[step.type] ?? -1);
    setActiveLine(step.activeLine);
    setCallStack(step.callStack);
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

  const resetState = () => {
    setArrayState([...initialArray]);
    setActiveRange(null);
    setLeftRange(null);
    setRightRange(null);
    setMergedIndices([]);
    setCompareI(-1);
    setCompareJ(-1);
    setDividedRanges(new Set());
    setMergedRangesMap(new Map());
    setMergeAnim(null);
    setActiveStepIdx(-1);
    setActiveLine(0);
    setCallStack([]);
    setLogEntries([]);
  };

  const startSort = useCallback((arr: number[]) => {
    if (arr.length === 0) return;
    if (runningRef.current && pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
      autoStep();
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    resetState();
    stepsRef.current = buildSteps(arr);
    stepIdxRef.current = 0;
    runningRef.current = true;
    pausedRef.current = false;
    setRunning(true);
    setPaused(false);
    setTimeout(() => autoStep(), 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildSteps, autoStep]);

  const stepSort = useCallback((arr: number[]) => {
    if (arr.length === 0) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      resetState();
      stepsRef.current = buildSteps(arr);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildSteps, applyStep]);

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetSort = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false;
    pausedRef.current = false;
    stepsRef.current = [];
    stepIdxRef.current = 0;
    setRunning(false);
    setPaused(false);
    resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialArray]);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
  }, []);

  return {
    running, paused, array: arrayState,
    activeRange, leftRange, rightRange, mergedIndices, compareI, compareJ,
    dividedRanges, mergedRangesMap, mergeAnim,
    activeStepIdx, logEntries, activeLine, callStack,
    startSort, stepSort, togglePause, resetSort, setSpeed,
  };
}
