"use client";
import { useState, useCallback, useRef } from "react";

export interface TimItem { val: number; id: string; }

export type TimPhase = "init" | "insertion-sort" | "merging" | "done";

export interface TimState {
  arr: TimItem[];
  runSize: number;
  // Run boundaries: [{start, end}]
  runs: { start: number; end: number }[];
  // Currently active run (during insertion sort phase)
  activeRun: number | null;
  // Insertion sort pointers
  insI: number | null;
  insJ: number | null;
  insKey: TimItem | null;
  // Merge pointers
  mergeLeft: number | null;
  mergeRight: number | null;
  mergeMid: number | null;
  mergeSize: number | null;
  phase: TimPhase;
  msg: string;
  type: string;
}

const DEFAULT_RUN = 4;

export function useTimSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentState, setCurrentState] = useState<TimState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<TimState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const toItem = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `t-${i}` }));
  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]) => {
    const steps: TimState[] = [];
    const a: TimItem[] = toItem(arr);
    const n = a.length;
    if (n === 0) return steps;

    const RUN = Math.min(DEFAULT_RUN, Math.max(2, Math.floor(n / 3)));

    // Compute initial run boundaries
    const computeRuns = (size: number) => {
      const runs: { start: number; end: number }[] = [];
      for (let s = 0; s < n; s += size) runs.push({ start: s, end: Math.min(s + size - 1, n - 1) });
      return runs;
    };

    const initialRuns = computeRuns(RUN);

    const mk = (
      type: string, phase: TimPhase, msg: string,
      arr: TimItem[], runs: { start: number; end: number }[],
      activeRun: number | null,
      insI: number | null, insJ: number | null, insKey: TimItem | null,
      mergeLeft: number | null, mergeRight: number | null, mergeMid: number | null, mergeSize: number | null
    ): TimState => ({
      arr: [...arr], runSize: RUN, runs: [...runs],
      activeRun, insI, insJ, insKey: insKey ? { ...insKey } : null,
      mergeLeft, mergeRight, mergeMid, mergeSize,
      phase, msg, type
    });

    steps.push(mk("init", "init",
      `Tim Sort: RUN size = ${RUN}. Array divided into ${initialRuns.length} run(s). Phase 1: Insertion Sort each run.`,
      a, initialRuns, null, null, null, null, null, null, null, null));

    // ─── Phase 1: Insertion Sort each run ───
    const sortedRuns = computeRuns(RUN);
    for (let r = 0; r < sortedRuns.length; r++) {
      const { start, end } = sortedRuns[r];
      steps.push(mk("run-start", "insertion-sort",
        `Insertion Sort run[${r}]: indices [${start}..${end}].`,
        a, sortedRuns, r, start, null, null, null, null, null, null));

      for (let i = start + 1; i <= end; i++) {
        const key = { ...a[i] };
        steps.push(mk("ins-extract", "insertion-sort",
          `Extract key = arr[${i}] (${key.val}).`,
          a, sortedRuns, r, i, i - 1, key, null, null, null, null));
        let j = i - 1;
        while (j >= start && a[j].val > key.val) {
          steps.push(mk("ins-shift", "insertion-sort",
            `arr[${j}] (${a[j].val}) > key (${key.val}). Shift right.`,
            a, sortedRuns, r, i, j, key, null, null, null, null));
          a[j + 1] = { ...a[j] };
          a[j] = { val: key.val, id: `hole-${Math.random()}` };
          j--;
        }
        a[j + 1] = key;
        steps.push(mk("ins-place", "insertion-sort",
          `Placed key (${key.val}) at index ${j + 1}.`,
          a, sortedRuns, r, i, j + 1, null, null, null, null, null));
      }
      steps.push(mk("run-done", "insertion-sort",
        `Run[${r}] sorted: [${a.slice(start, end + 1).map(x => x.val).join(", ")}].`,
        a, sortedRuns, r, null, null, null, null, null, null, null));
    }

    steps.push(mk("merge-phase-start", "merging",
      `Phase 2: Merge sorted runs. Starting merge size = ${RUN}.`,
      a, computeRuns(RUN), null, null, null, null, null, null, null, RUN));

    // ─── Phase 2: Merge runs ───
    let size = RUN;
    while (size < n) {
      for (let left = 0; left < n; left += 2 * size) {
        const mid = Math.min(left + size - 1, n - 1);
        const right = Math.min(left + 2 * size - 1, n - 1);
        if (mid >= right) continue;

        steps.push(mk("merge-start", "merging",
          `Merge [${left}..${mid}] with [${mid + 1}..${right}]. Merge size = ${size}.`,
          a, computeRuns(size), null, null, null, null, left, right, mid, size));

        // Merge
        const len1 = mid - left + 1;
        const len2 = right - mid;
        const L = a.slice(left, left + len1);
        const R = a.slice(mid + 1, mid + 1 + len2);
        let i = 0, j = 0, k = left;

        while (i < len1 && j < len2) {
          steps.push(mk("merge-compare", "merging",
            `Compare L[${i}]=${L[i].val} with R[${j}]=${R[j].val}.`,
            a, computeRuns(size), null, null, null, null, left, right, mid, size));
          if (L[i].val <= R[j].val) {
            a[k] = { ...L[i], id: `merge-l-${Math.random()}` }; i++;
          } else {
            a[k] = { ...R[j], id: `merge-r-${Math.random()}` }; j++;
          }
          k++;
          steps.push(mk("merge-place", "merging",
            `Placed ${a[k - 1].val} at index ${k - 1}.`,
            a, computeRuns(size), null, null, null, null, left, right, mid, size));
        }
        while (i < len1) { a[k++] = { ...L[i++], id: `merge-l-rem-${Math.random()}` }; }
        while (j < len2) { a[k++] = { ...R[j++], id: `merge-r-rem-${Math.random()}` }; }

        steps.push(mk("merge-done", "merging",
          `Merge [${left}..${right}] complete.`,
          a, computeRuns(size * 2), null, null, null, null, left, right, mid, size));
      }
      size *= 2;
    }

    steps.push(mk("done", "done",
      `✓ Tim Sort complete. Array fully sorted.`,
      a, [], null, null, null, null, null, null, null, null));

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
