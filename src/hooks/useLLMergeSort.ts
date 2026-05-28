"use client";
import { useState, useCallback, useRef } from "react";

export interface LLMergeAnimData {
  leftArr: number[];
  rightArr: number[];
  leftPtr: number;
  rightPtr: number;
  result: (number | null)[];
  lastFrom: "left" | "right" | null;
  lastResultIdx: number;
}

export interface LLMergeSortStep {
  type: string;
  values: number[];
  activeRange: [number, number] | null;
  leftRange: [number, number] | null;
  rightRange: [number, number] | null;
  dividedRanges: string[];
  mergedRangesData: [string, number[]][];
  mergeAnim: LLMergeAnimData | null;
  msg: string;
  activeLine: number;
  depth: number;
}

interface UseLLMergeSortReturn {
  running: boolean;
  paused: boolean;
  values: number[];
  activeRange: [number, number] | null;
  leftRange: [number, number] | null;
  rightRange: [number, number] | null;
  dividedRanges: Set<string>;
  mergedRangesMap: Map<string, number[]>;
  mergeAnim: LLMergeAnimData | null;
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  activeLine: number;
  startSort: (arr: number[]) => void;
  stepSort: (arr: number[]) => void;
  togglePause: () => void;
  resetSort: () => void;
  setSpeed: (speed: number) => void;
}

export function useLLMergeSort(initialArray: number[]): UseLLMergeSortReturn {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [values, setValues] = useState<number[]>([...initialArray]);

  const [activeRange, setActiveRange] = useState<[number, number] | null>(null);
  const [leftRange, setLeftRange] = useState<[number, number] | null>(null);
  const [rightRange, setRightRange] = useState<[number, number] | null>(null);
  const [dividedRanges, setDividedRanges] = useState<Set<string>>(new Set());
  const [mergedRangesMap, setMergedRangesMap] = useState<Map<string, number[]>>(new Map());
  const [mergeAnim, setMergeAnim] = useState<LLMergeAnimData | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);
  const [activeLine, setActiveLine] = useState<number>(0);

  const stepsRef = useRef<LLMergeSortStep[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1600 - (speedRef.current - 1) * 150;

  const buildSteps = useCallback((arr: number[]): LLMergeSortStep[] => {
    const steps: LLMergeSortStep[] = [];
    const a = [...arr];
    const divRanges = new Set<string>();
    const mrgRanges = new Map<string, number[]>();

    const snap = () => ({
      dividedRanges: [...divRanges],
      mergedRangesData: [...mrgRanges.entries()] as [string, number[]][],
    });

    const pushStep = (
      type: string, aRange: [number, number] | null,
      lRange: [number, number] | null, rRange: [number, number] | null,
      anim: LLMergeAnimData | null, line: number, depth: number, msg: string
    ) => {
      steps.push({
        type, values: [...a], activeRange: aRange,
        leftRange: lRange, rightRange: rRange,
        ...snap(), mergeAnim: anim, msg, activeLine: line, depth,
      });
    };

    pushStep("init", [0, a.length - 1], null, null, null, 19, 0,
      `mergeSort() called on linked list: [${a.join(" → ")}]`);

    function mergeSortRec(l: number, r: number, depth: number) {
      pushStep("divide", [l, r], null, null, null, 19, depth,
        `${"  ".repeat(depth)}mergeSort([${a.slice(l, r + 1).join(", ")}])`);

      if (l >= r) {
        mrgRanges.set(`${l}-${r}`, [a[l]]);
        pushStep("base", [l, r], null, null, null, 20, depth,
          `${"  ".repeat(depth)}Base case: single node [${a[l]}]`);
        return;
      }

      const mid = l + Math.floor((r - l) / 2);
      divRanges.add(`${l}-${r}`);

      pushStep("split", [l, r], [l, mid], [mid + 1, r], null, 21, depth,
        `${"  ".repeat(depth)}Split: slow/fast → mid=${mid}. Left=[${a.slice(l, mid + 1).join(", ")}] Right=[${a.slice(mid + 1, r + 1).join(", ")}]`);

      // Recurse left
      pushStep("recurse-left", [l, r], [l, mid], [mid + 1, r], null, 23, depth,
        `${"  ".repeat(depth)}mergeSort(left half)`);
      mergeSortRec(l, mid, depth + 1);

      // Recurse right
      pushStep("recurse-right", [l, r], [l, mid], [mid + 1, r], null, 23, depth,
        `${"  ".repeat(depth)}mergeSort(right half)`);
      mergeSortRec(mid + 1, r, depth + 1);

      // Merge
      pushStep("merge-start", [l, r], [l, mid], [mid + 1, r], null, 9, depth,
        `${"  ".repeat(depth)}merge(left=[${a.slice(l, mid + 1).join(", ")}], right=[${a.slice(mid + 1, r + 1).join(", ")}])`);

      const L = a.slice(l, mid + 1);
      const R = a.slice(mid + 1, r + 1);
      const resultSlots: (number | null)[] = new Array(r - l + 1).fill(null);

      const makeAnim = (lp: number, rp: number, lf: "left" | "right" | null, lri: number): LLMergeAnimData => ({
        leftArr: [...L], rightArr: [...R], leftPtr: lp, rightPtr: rp,
        result: [...resultSlots], lastFrom: lf, lastResultIdx: lri,
      });

      let i = 0, j = 0, k = l;

      while (i < L.length && j < R.length) {
        pushStep("compare", [l, r], [l, mid], [mid + 1, r], makeAnim(i, j, null, -1), 10, depth,
          `${"  ".repeat(depth)}Compare: ${L[i]} vs ${R[j]}`);

        if (L[i] <= R[j]) {
          a[k] = L[i];
          resultSlots[k - l] = L[i];
          pushStep("place", [l, r], [l, mid], [mid + 1, r], makeAnim(i + 1, j, "left", k - l), 11, depth,
            `${"  ".repeat(depth)}${L[i]} ≤ ${R[j]} → take ${L[i]} from left`);
          i++;
        } else {
          a[k] = R[j];
          resultSlots[k - l] = R[j];
          pushStep("place", [l, r], [l, mid], [mid + 1, r], makeAnim(i, j + 1, "right", k - l), 14, depth,
            `${"  ".repeat(depth)}${R[j]} < ${L[i]} → take ${R[j]} from right`);
          j++;
        }
        k++;
      }

      while (i < L.length) {
        a[k] = L[i];
        resultSlots[k - l] = L[i];
        pushStep("copy-left", [l, r], [l, mid], [mid + 1, r], makeAnim(i + 1, j, "left", k - l), 11, depth,
          `${"  ".repeat(depth)}Copy remaining left: ${L[i]}`);
        i++; k++;
      }

      while (j < R.length) {
        a[k] = R[j];
        resultSlots[k - l] = R[j];
        pushStep("copy-right", [l, r], [l, mid], [mid + 1, r], makeAnim(i, j + 1, "right", k - l), 14, depth,
          `${"  ".repeat(depth)}Copy remaining right: ${R[j]}`);
        j++; k++;
      }

      mrgRanges.set(`${l}-${r}`, a.slice(l, r + 1));
      pushStep("merge-done", [l, r], null, null, null, 9, depth,
        `${"  ".repeat(depth)}Merged: [${a.slice(l, r + 1).join(" → ")}]`);
    }

    if (a.length > 0) mergeSortRec(0, a.length - 1, 0);

    pushStep("done", [0, a.length - 1], null, null, null, 0, 0,
      `✓ Merge Sort complete: [${a.join(" → ")}]`);

    return steps;
  }, []);

  const stepMap: Record<string, number> = {
    init: 0, divide: 1, base: 1, split: 2, "recurse-left": 2, "recurse-right": 2,
    "merge-start": 3, compare: 4, place: 4, "copy-left": 4, "copy-right": 4, "merge-done": 5, done: 6,
  };

  const applyStep = useCallback((step: LLMergeSortStep) => {
    setValues(step.values);
    setActiveRange(step.activeRange);
    setLeftRange(step.leftRange);
    setRightRange(step.rightRange);
    setDividedRanges(new Set(step.dividedRanges));
    setMergedRangesMap(new Map(step.mergedRangesData));
    setMergeAnim(step.mergeAnim);
    setActiveStepIdx(stepMap[step.type] ?? -1);
    setActiveLine(step.activeLine);
    setLogEntries((prev) => [...prev, { type: step.type, msg: step.msg }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoStep = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return;
    if (stepIdxRef.current >= stepsRef.current.length) {
      runningRef.current = false; setRunning(false); setPaused(false); return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const resetState = useCallback(() => {
    setValues([...initialArray]);
    setActiveRange(null); setLeftRange(null); setRightRange(null);
    setDividedRanges(new Set()); setMergedRangesMap(new Map());
    setMergeAnim(null); setActiveStepIdx(-1); setActiveLine(0); setLogEntries([]);
  }, [initialArray]);

  const startSort = useCallback((arr: number[]) => {
    if (arr.length === 0) return;
    if (runningRef.current && pausedRef.current) {
      pausedRef.current = false; setPaused(false); autoStep(); return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    resetState();
    stepsRef.current = buildSteps(arr);
    stepIdxRef.current = 0;
    runningRef.current = true; pausedRef.current = false;
    setRunning(true); setPaused(false);
    setTimeout(() => autoStep(), 10);
  }, [buildSteps, autoStep, resetState]);

  const stepSort = useCallback((arr: number[]) => {
    if (arr.length === 0) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      resetState();
      stepsRef.current = buildSteps(arr);
      stepIdxRef.current = 0;
      runningRef.current = true; pausedRef.current = true;
      setRunning(true); setPaused(true);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    pausedRef.current = true; setPaused(true);
    if (stepIdxRef.current >= stepsRef.current.length) {
      runningRef.current = false; setRunning(false); setPaused(false); return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
  }, [buildSteps, applyStep, resetState]);

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current; setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetSort = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false; pausedRef.current = false;
    stepsRef.current = []; stepIdxRef.current = 0;
    setRunning(false); setPaused(false);
    resetState();
  }, [resetState]);

  const setSpeed = useCallback((speed: number) => { speedRef.current = speed; }, []);

  return {
    running, paused, values,
    activeRange, leftRange, rightRange,
    dividedRanges, mergedRangesMap, mergeAnim,
    activeStepIdx, logEntries, activeLine,
    startSort, stepSort, togglePause, resetSort, setSpeed,
  };
}
