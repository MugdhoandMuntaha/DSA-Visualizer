"use client";
import { useState, useCallback, useRef } from "react";

export interface BSItem { val: number; id: string; }

export type BSPhase = "init" | "searching" | "found" | "not-found";

export interface BSState {
  originalArr: BSItem[];
  target: number;
  left: number;
  right: number;
  mid: number | null;
  phase: BSPhase;
  msg: string;
  type: string;
}

export function useBinarySearch(initialArray: number[], initialTarget: number) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  
  const toBS = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `v-${v}-${i}` }));
  const [arrayState, setArrayState] = useState<BSItem[]>(toBS(initialArray));
  const [targetState, setTargetState] = useState<number>(initialTarget);
  const [currentState, setCurrentState] = useState<BSState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<BSState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[], target: number) => {
    const steps: BSState[] = [];
    const a = toBS(arr);
    const n = a.length;
    
    if (n === 0) return steps;

    const mk = (
      type: string, phase: BSPhase, msg: string,
      left: number, right: number, mid: number | null
    ): BSState => {
      return {
        originalArr: [...a], target, left, right, mid, phase, msg, type
      };
    };

    steps.push(mk("init", "init", `Initialize Binary Search for target = ${target}.`, 0, n - 1, null));

    let l = 0;
    let r = n - 1;

    while (l <= r) {
      let m = Math.floor((l + r) / 2);
      steps.push(mk("calc-mid", "searching", `Search space [${l}..${r}]. Calculate mid = Math.floor((${l} + ${r}) / 2) = ${m}.`, l, r, m));
      steps.push(mk("compare", "searching", `Compare arr[${m}] (${a[m].val}) with target (${target}).`, l, r, m));

      if (a[m].val === target) {
        steps.push(mk("found", "found", `Match! Target ${target} found at index ${m}.`, l, r, m));
        return steps;
      } else if (a[m].val < target) {
        steps.push(mk("update-bounds", "searching", `arr[${m}] < ${target}. Target must be in the right half. Update left = ${m + 1}.`, l, r, m));
        l = m + 1;
      } else {
        steps.push(mk("update-bounds", "searching", `arr[${m}] > ${target}. Target must be in the left half. Update right = ${m - 1}.`, l, r, m));
        r = m - 1;
      }
    }

    steps.push(mk("not-found", "not-found", `Pointers crossed (left > right). Search space exhausted. Target ${target} not found in array.`, l, r, null));

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

  const startSearch = useCallback((arr: number[], target: number) => {
    if (!arr.length) return;
    if (runningRef.current && pausedRef.current) { pausedRef.current = false; setPaused(false); autoStep(); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    resetState();
    setArrayState(toBS(arr));
    setTargetState(target);
    stepsRef.current = buildSteps(arr, target);
    stepIdxRef.current = 0; runningRef.current = true; pausedRef.current = false;
    setRunning(true); setPaused(false); setTimeout(() => autoStep(), 10);
  }, [buildSteps, autoStep, resetState]);

  const stepSearch = useCallback((arr: number[], target: number) => {
    if (!arr.length) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current); resetState();
      setArrayState(toBS(arr));
      setTargetState(target);
      stepsRef.current = buildSteps(arr, target);
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

  const resetSearch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false; pausedRef.current = false;
    setRunning(false); setPaused(false);
    resetState();
  }, [resetState]);

  return {
    running, paused, array: arrayState, target: targetState, currentState, activeStepIdx, logEntries,
    startSearch, stepSearch, togglePause, resetSearch,
    setSpeed: useCallback((s: number) => { speedRef.current = s; }, []),
  };
}
