"use client";
import { useState, useCallback, useRef } from "react";

export interface SpreadItem { val: number; id: string; }

export type SpreadPhase = "init" | "distribute" | "sort-bins" | "collect" | "done";

export interface SpreadSortState {
  originalArr: SpreadItem[];
  bins: SpreadItem[][];
  minVal: number;
  maxVal: number;
  numBins: number;
  phase: SpreadPhase;
  activeIdx: number | null;
  activeBin: number | null;
  
  // Local sort state
  activeBinItemIdx: number | null;
  subSortType: "insertion" | "quick" | null;
  
  msg: string;
  type: string;
}

export function useSpreadSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentState, setCurrentState] = useState<SpreadSortState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<SpreadSortState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const toItem = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `ss-${i}` }));
  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]) => {
    const steps: SpreadSortState[] = [];
    const a: SpreadItem[] = toItem(arr);
    const n = a.length;
    if (n === 0) return steps;

    const BINS = Math.max(3, Math.min(6, Math.floor(n / 2))); // e.g. 3-6 bins

    const mk = (
      type: string, phase: SpreadPhase, msg: string,
      bins: SpreadItem[][],
      activeIdx: number | null, activeBin: number | null,
      activeBinItemIdx: number | null = null, subSortType: "insertion" | "quick" | null = null
    ): SpreadSortState => ({
      originalArr: [...a], bins: bins.map(b => [...b]),
      minVal, maxVal, numBins: BINS, phase, activeIdx, activeBin,
      activeBinItemIdx, subSortType, msg, type
    });

    let minVal = a[0].val;
    let maxVal = a[0].val;
    for (let i = 1; i < n; i++) {
      if (a[i].val < minVal) minVal = a[i].val;
      if (a[i].val > maxVal) maxVal = a[i].val;
    }

    const initialBins: SpreadItem[][] = Array.from({ length: BINS }, () => []);

    steps.push(mk("init", "init",
      `Initialize Spreadsort. Min=${minVal}, Max=${maxVal}. Creating ${BINS} bins.`,
      initialBins, null, null));

    // Phase 1: Distribute
    const currentBins: SpreadItem[][] = Array.from({ length: BINS }, () => []);
    for (let i = 0; i < n; i++) {
      const item = a[i];
      let bIdx = Math.floor(((item.val - minVal) / (maxVal - minVal + 1)) * BINS);
      if (bIdx >= BINS) bIdx = BINS - 1;

      steps.push(mk("distribute", "distribute",
        `Compute bin index for ${item.val}: ${bIdx}.`,
        currentBins, i, bIdx));

      currentBins[bIdx].push(item);

      steps.push(mk("placed", "distribute",
        `${item.val} dropped into Bin ${bIdx}.`,
        currentBins, i, bIdx));
    }

    steps.push(mk("sort-start", "sort-bins",
      `All elements distributed. Now apply hybrid internal sorts to each bin based on size.`,
      currentBins, null, null));

    // Phase 2: Sort bins (Hybrid)
    for (let bIdx = 0; bIdx < BINS; bIdx++) {
      const bin = currentBins[bIdx];
      if (bin.length <= 1) {
        steps.push(mk("bin-sorted", "sort-bins",
          `Bin ${bIdx} has ${bin.length} element(s). Already sorted.`,
          currentBins, null, bIdx));
        continue;
      }

      const isQuick = bin.length > 3;
      steps.push(mk("bin-algo-choice", "sort-bins",
        `Bin ${bIdx} size = ${bin.length}. Using ${isQuick ? "Quick Sort" : "Insertion Sort"} fallback.`,
        currentBins, null, bIdx, null, isQuick ? "quick" : "insertion"));

      if (isQuick) {
        // Simple Quick Sort simulation for the bin
        const binSorted = [...bin].sort((x, y) => x.val - y.val);
        // Just show a mock partition step to represent quick sort
        steps.push(mk("qs-pivot", "sort-bins",
          `Quick Sorting Bin ${bIdx}. Selecting pivot...`,
          currentBins, null, bIdx, bin.length - 1, "quick"));
        
        currentBins[bIdx] = binSorted;

        steps.push(mk("bin-sorted", "sort-bins",
          `Bin ${bIdx} sorted via Quick Sort.`,
          currentBins, null, bIdx, null, "quick"));

      } else {
        // Insertion Sort simulation for the bin
        for (let i = 1; i < bin.length; i++) {
          let key = { ...bin[i] };
          let j = i - 1;
          steps.push(mk("ins-extract", "sort-bins",
            `Insertion Sort: extract ${key.val}.`,
            currentBins, null, bIdx, i, "insertion"));
          
          while (j >= 0 && bin[j].val > key.val) {
            bin[j + 1] = { ...bin[j] };
            bin[j] = { val: key.val, id: `bin-hole-${Math.random()}` }; // prevent key duplicate
            steps.push(mk("ins-shift", "sort-bins",
              `Shift ${bin[j+1].val} right.`,
              currentBins, null, bIdx, j, "insertion"));
            j--;
          }
          bin[j + 1] = key;
          steps.push(mk("ins-insert", "sort-bins",
            `Place ${key.val}.`,
            currentBins, null, bIdx, j + 1, "insertion"));
        }
      }
    }

    steps.push(mk("collect-start", "collect",
      `All bins sorted. Concatenate bins back into the main array.`,
      currentBins, null, null));

    // Phase 3: Collect
    let outputIdx = 0;
    for (let bIdx = 0; bIdx < BINS; bIdx++) {
      for (let i = 0; i < currentBins[bIdx].length; i++) {
        const item = currentBins[bIdx][i];
        steps.push(mk("collect", "collect",
          `Collect ${item.val} from Bin ${bIdx} to index ${outputIdx}.`,
          currentBins, outputIdx, bIdx));
        outputIdx++;
      }
    }

    steps.push(mk("done", "done",
      `✓ Spreadsort complete!`,
      currentBins, null, null));

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
