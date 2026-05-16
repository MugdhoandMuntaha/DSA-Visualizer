"use client";
import { useState, useCallback, useRef } from "react";

export interface SelItem { val: number; id: string; }

export type SelPhase = "init" | "finding-min" | "swapping" | "done";

export interface SelState {
  originalArr: SelItem[];
  i: number | null;
  j: number | null;
  minIdx: number | null;
  sortedUpTo: number;
  phase: SelPhase;
  msg: string;
  type: string;
}

export function useSelectionSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  
  const toSel = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `v-${v}-${i}` }));
  const [arrayState, setArrayState] = useState<SelItem[]>(toSel(initialArray));
  const [currentState, setCurrentState] = useState<SelState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<SelState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]) => {
    const steps: SelState[] = [];
    const a = toSel(arr);
    const n = a.length;
    
    if (n === 0) return steps;

    const mk = (
      type: string, phase: SelPhase, msg: string,
      i: number | null, j: number | null, minIdx: number | null, sortedUpTo: number
    ): SelState => {
      return {
        originalArr: [...a], i, j, minIdx, sortedUpTo, phase, msg, type
      };
    };

    steps.push(mk("init", "init", `Initialize Selection Sort.`, null, null, null, 0));

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      steps.push(mk("start-pass", "finding-min", `Target index: ${i}. Assume arr[${i}] (${a[i].val}) is minimum.`, i, null, minIdx, i));
      
      for (let j = i + 1; j < n; j++) {
        steps.push(mk("compare", "finding-min", `Compare arr[${j}] (${a[j].val}) with current min (${a[minIdx].val}).`, i, j, minIdx, i));
        if (a[j].val < a[minIdx].val) {
          minIdx = j;
          steps.push(mk("new-min", "finding-min", `Found smaller element! New minimum is arr[${minIdx}] (${a[minIdx].val}).`, i, j, minIdx, i));
        }
      }
      
      if (minIdx !== i) {
        steps.push(mk("swap", "swapping", `Swap target arr[${i}] (${a[i].val}) with minimum arr[${minIdx}] (${a[minIdx].val}).`, i, null, minIdx, i));
        
        let temp = a[i];
        a[i] = a[minIdx];
        a[minIdx] = temp;
        
        steps.push(mk("swapped", "swapping", `Swap complete.`, i, null, minIdx, i + 1));
      } else {
        steps.push(mk("no-swap", "swapping", `arr[${i}] is already the minimum. No swap needed.`, i, null, minIdx, i + 1));
      }
    }
    
    steps.push(mk("done", "done", `Array is fully sorted.`, null, null, null, n));

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
      if (slice[slice.length - 1]?.msg !== st.msg) {
        slice.push({ type: st.type, msg: st.msg });
      }
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
    setArrayState(toSel(arr));
    stepsRef.current = buildSteps(arr);
    stepIdxRef.current = 0; runningRef.current = true; pausedRef.current = false;
    setRunning(true); setPaused(false); setTimeout(() => autoStep(), 10);
  }, [buildSteps, autoStep, resetState]);

  const stepSort = useCallback((arr: number[]) => {
    if (!arr.length) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current); resetState();
      setArrayState(toSel(arr));
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
    setRunning(false); setPaused(false);
    resetState();
  }, [resetState]);

  return {
    running, paused, array: arrayState, currentState, activeStepIdx, logEntries,
    startSort, stepSort, togglePause, resetSort,
    setSpeed: useCallback((s: number) => { speedRef.current = s; }, []),
  };
}
