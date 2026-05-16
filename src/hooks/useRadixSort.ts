"use client";
import { useState, useCallback, useRef } from "react";

export interface RadixItem { val: number; id: string; }

export type RadixPhase = "init" | "find-max" | "init-buckets" | "distribute" | "collect" | "done";

export interface RadixState {
  originalArr: RadixItem[];
  digit: number;        // current digit place: 1, 10, 100, ...
  digitLabel: string;   // "1s", "10s", "100s", ...
  maxVal: number;
  buckets: RadixItem[][];   // 10 buckets
  activeIdx: number | null;
  activeBucket: number | null;
  phase: RadixPhase;
  msg: string;
  type: string;
  pass: number;
  totalPasses: number;
}

export function useRadixSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);

  const toRad = (arr: number[]) =>
    arr.map((v, i) => ({ val: v, id: `v-${v}-${i}` }));

  const [currentState, setCurrentState] = useState<RadixState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<RadixState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]) => {
    const steps: RadixState[] = [];
    const a = toRad(arr);
    const n = a.length;
    if (n === 0) return steps;

    const emptyBuckets = (): RadixItem[][] => Array.from({ length: 10 }, () => []);

    const mk = (
      type: string, phase: RadixPhase, msg: string,
      digit: number, digitLabel: string, maxVal: number,
      buckets: RadixItem[][], arr: RadixItem[],
      activeIdx: number | null, activeBucket: number | null,
      pass: number, totalPasses: number
    ): RadixState => ({
      originalArr: [...arr],
      digit, digitLabel, maxVal,
      buckets: buckets.map(b => [...b]),
      activeIdx, activeBucket,
      phase, msg, type, pass, totalPasses
    });

    // Find max
    let maxVal = a[0].val;
    for (const item of a) {
      if (item.val > maxVal) maxVal = item.val;
    }
    const totalPasses = Math.max(1, Math.floor(Math.log10(maxVal)) + 1);

    steps.push(mk("init", "init", `Initialize Radix Sort. Max value = ${maxVal}. Total digit passes = ${totalPasses}.`,
      1, "1s", maxVal, emptyBuckets(), a, null, null, 0, totalPasses));

    let cur = [...a];
    let digit = 1;
    let pass = 1;

    while (Math.floor((maxVal) / digit) > 0) {
      const label = digit === 1 ? "1s" : digit === 10 ? "10s" : digit === 100 ? "100s" : `${digit}s`;

      steps.push(mk("start-pass", "init-buckets", `Pass ${pass}/${totalPasses}: Sort by ${label} digit. Initialize 10 empty buckets (0-9).`,
        digit, label, maxVal, emptyBuckets(), cur, null, null, pass, totalPasses));

      // Distribute
      const buckets: RadixItem[][] = emptyBuckets();
      for (let i = 0; i < n; i++) {
        const b = Math.floor(cur[i].val / digit) % 10;
        steps.push(mk("distribute", "distribute",
          `arr[${i}] = ${cur[i].val}. Digit (${label}) = ${b}. Place in bucket[${b}].`,
          digit, label, maxVal, buckets, cur, i, b, pass, totalPasses));
        buckets[b] = [...buckets[b], { ...cur[i] }];
        steps.push(mk("placed", "distribute",
          `${cur[i].val} placed in bucket[${b}].`,
          digit, label, maxVal, buckets, cur, i, b, pass, totalPasses));
      }

      steps.push(mk("collect-start", "collect", `Collect elements from buckets 0→9 back into array.`,
        digit, label, maxVal, buckets, cur, null, null, pass, totalPasses));

      // Collect
      const next: RadixItem[] = [];
      for (let b = 0; b < 10; b++) {
        for (const item of buckets[b]) {
          next.push(item);
          steps.push(mk("collect", "collect",
            `Collect ${item.val} from bucket[${b}] into position ${next.length - 1}.`,
            digit, label, maxVal, buckets, [...next, ...cur.slice(next.length)], next.length - 1, b, pass, totalPasses));
        }
      }

      cur = next;
      steps.push(mk("pass-done", "collect", `Pass ${pass} complete. Array sorted by ${label} digit.`,
        digit, label, maxVal, emptyBuckets(), cur, null, null, pass, totalPasses));

      digit *= 10;
      pass++;
      if (digit > maxVal * 10) break;
    }

    steps.push(mk("done", "done", `✓ Radix Sort complete. Array is fully sorted.`,
      digit / 10, "done", maxVal, emptyBuckets(), cur, null, null, pass - 1, totalPasses));

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
