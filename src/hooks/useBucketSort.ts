"use client";
import { useState, useCallback, useRef } from "react";

export interface BktItem { val: number; id: string; }

export type BktPhase = "init" | "find-max" | "distribute" | "sort-bucket" | "collect" | "done";

export interface BktState {
  originalArr: BktItem[];
  maxVal: number;
  numBuckets: number;
  buckets: BktItem[][];
  activeIdx: number | null;       // index in main array being processed
  activeBucket: number | null;    // bucket being highlighted
  activeBucketItemIdx: number | null; // item within bucket being sorted
  phase: BktPhase;
  msg: string;
  type: string;
}

const BUCKET_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e","#14b8a6",
  "#06b6d4","#3b82f6","#8b5cf6","#a855f7","#ec4899"
];

export { BUCKET_COLORS };

export function useBucketSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentState, setCurrentState] = useState<BktState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<BktState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const toItem = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `v-${i}` }));
  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]) => {
    const steps: BktState[] = [];
    const a = toItem(arr);
    const n = a.length;
    if (n === 0) return steps;

    const numBuckets = Math.min(10, n);
    const emptyBuckets = (): BktItem[][] => Array.from({ length: numBuckets }, () => []);

    const mk = (
      type: string, phase: BktPhase, msg: string,
      maxVal: number, buckets: BktItem[][], arr: BktItem[],
      activeIdx: number | null, activeBucket: number | null, activeBucketItemIdx: number | null
    ): BktState => ({
      originalArr: [...arr], maxVal, numBuckets,
      buckets: buckets.map(b => [...b]),
      activeIdx, activeBucket, activeBucketItemIdx,
      phase, msg, type,
    });

    // Phase 1: Find max
    let maxVal = a[0].val;
    for (const item of a) if (item.val > maxVal) maxVal = item.val;

    steps.push(mk("init", "init",
      `Initialize Bucket Sort. Max value = ${maxVal}. Using ${numBuckets} buckets.`,
      maxVal, emptyBuckets(), a, null, null, null));

    // Phase 2: Distribute into buckets
    const buckets: BktItem[][] = emptyBuckets();
    for (let i = 0; i < n; i++) {
      const bIdx = Math.min(Math.floor((a[i].val / (maxVal + 1)) * numBuckets), numBuckets - 1);
      steps.push(mk("distribute", "distribute",
        `arr[${i}] = ${a[i].val}. bucket_idx = floor(${a[i].val} / ${maxVal + 1} × ${numBuckets}) = ${bIdx}.`,
        maxVal, buckets, a, i, bIdx, null));
      buckets[bIdx] = [...buckets[bIdx], { ...a[i] }];
      steps.push(mk("placed", "distribute",
        `Placed ${a[i].val} into bucket[${bIdx}].`,
        maxVal, buckets, a, i, bIdx, null));
    }

    steps.push(mk("sort-start", "sort-bucket",
      `All elements distributed. Now sort each non-empty bucket with Insertion Sort.`,
      maxVal, buckets, a, null, null, null));

    // Phase 3: Sort each bucket (insertion sort)
    for (let b = 0; b < numBuckets; b++) {
      if (buckets[b].length <= 1) {
        if (buckets[b].length === 1) {
          steps.push(mk("bucket-trivial", "sort-bucket",
            `Bucket[${b}] has 1 element — already sorted.`,
            maxVal, buckets, a, null, b, null));
        }
        continue;
      }
      steps.push(mk("bucket-sort-start", "sort-bucket",
        `Sorting bucket[${b}] with ${buckets[b].length} elements using Insertion Sort.`,
        maxVal, buckets, a, null, b, null));

      const bkt = buckets[b];
      for (let i = 1; i < bkt.length; i++) {
        const key = bkt[i];
        let j = i - 1;
        steps.push(mk("ins-extract", "sort-bucket",
          `bucket[${b}]: extract key = ${key.val} (pos ${i}).`,
          maxVal, buckets, a, null, b, i));
        while (j >= 0 && bkt[j].val > key.val) {
          steps.push(mk("ins-shift", "sort-bucket",
            `bucket[${b}]: shift ${bkt[j].val} right.`,
            maxVal, buckets, a, null, b, j));
          bkt[j + 1] = bkt[j];
          buckets[b] = [...bkt];
          j--;
        }
        bkt[j + 1] = key;
        buckets[b] = [...bkt];
        steps.push(mk("ins-insert", "sort-bucket",
          `bucket[${b}]: inserted ${key.val} at position ${j + 1}.`,
          maxVal, buckets, a, null, b, j + 1));
      }
      steps.push(mk("bucket-sorted", "sort-bucket",
        `Bucket[${b}] sorted: [${buckets[b].map(x => x.val).join(", ")}].`,
        maxVal, buckets, a, null, b, null));
    }

    // Phase 4: Collect
    steps.push(mk("collect-start", "collect",
      `All buckets sorted. Collecting elements from bucket[0] → bucket[${numBuckets - 1}].`,
      maxVal, buckets, a, null, null, null));

    const result: BktItem[] = [];
    const display = [...a];
    for (let b = 0; b < numBuckets; b++) {
      for (const item of buckets[b]) {
        display[result.length] = item;
        result.push(item);
        steps.push(mk("collect", "collect",
          `Collect ${item.val} from bucket[${b}] → position ${result.length - 1}.`,
          maxVal, buckets, display, result.length - 1, b, null));
      }
    }

    steps.push(mk("done", "done",
      `✓ Bucket Sort complete. Array fully sorted.`,
      maxVal, emptyBuckets(), result, null, null, null));

    return steps;
  }, []);

  const resetState = useCallback(() => {
    setActiveStepIdx(-1); setLogEntries([]); setCurrentState(null);
  }, []);

  const applyStep = useCallback((idx: number) => {
    if (!stepsRef.current[idx]) return;
    const st = stepsRef.current[idx];
    setCurrentState(st);
    setActiveStepIdx(idx);
    setLogEntries(prev => {
      if (idx === 0) return [{ type: st.type, msg: st.msg }];
      const slice = prev.slice(0, idx);
      if (slice[slice.length - 1]?.msg !== st.msg) slice.push({ type: st.type, msg: st.msg });
      return slice;
    });
  }, []);

  const autoStep = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return;
    if (stepIdxRef.current >= stepsRef.current.length) {
      runningRef.current = false; setRunning(false); return;
    }
    applyStep(stepIdxRef.current);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const startSort = useCallback((arr: number[]) => {
    if (!arr.length) return;
    if (runningRef.current && pausedRef.current) { pausedRef.current = false; setPaused(false); autoStep(); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    resetState();
    stepsRef.current = buildSteps(arr);
    stepIdxRef.current = 0; runningRef.current = true; pausedRef.current = false;
    setRunning(true); setPaused(false); setTimeout(() => autoStep(), 10);
  }, [buildSteps, autoStep, resetState]);

  const stepSort = useCallback((arr: number[]) => {
    if (!arr.length) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current); resetState();
      stepsRef.current = buildSteps(arr);
      stepIdxRef.current = 0; runningRef.current = true; pausedRef.current = true;
      setRunning(true); setPaused(true);
    }
    if (stepIdxRef.current >= stepsRef.current.length) return;
    applyStep(stepIdxRef.current);
    stepIdxRef.current++;
  }, [buildSteps, applyStep, resetState]);

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
  }, [autoStep]);

  const resetSort = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false; pausedRef.current = false;
    setRunning(false); setPaused(false); resetState();
  }, [resetState]);

  return {
    running, paused, currentState, activeStepIdx, logEntries,
    startSort, stepSort, togglePause, resetSort,
    setSpeed: useCallback((s: number) => { speedRef.current = s; }, []),
  };
}
