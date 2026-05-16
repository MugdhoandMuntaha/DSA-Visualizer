"use client";
import { useState, useCallback, useRef } from "react";

export interface PHItem { val: number; id: string; }

export type PHPhase = "init" | "find-range" | "distribute" | "collect" | "done";

export interface PHState {
  originalArr: PHItem[];
  minVal: number;
  maxVal: number;
  holes: number[];          // count per hole (size = maxVal - minVal + 1)
  activeIdx: number | null; // index in main array being read/written
  activeHole: number | null;// hole index being highlighted
  phase: PHPhase;
  msg: string;
  type: string;
}

export function usePigeonholeSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentState, setCurrentState] = useState<PHState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<PHState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const toItem = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `ph-${i}` }));
  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]) => {
    const steps: PHState[] = [];
    const a = toItem(arr);
    const n = a.length;
    if (n === 0) return steps;

    const mk = (
      type: string, phase: PHPhase, msg: string,
      minVal: number, maxVal: number, holes: number[], arr: PHItem[],
      activeIdx: number | null, activeHole: number | null
    ): PHState => ({
      originalArr: [...arr], minVal, maxVal, holes: [...holes],
      activeIdx, activeHole, phase, msg, type,
    });

    // Phase 1: Find min/max
    let minVal = a[0].val, maxVal = a[0].val;
    for (const item of a) {
      if (item.val < minVal) minVal = item.val;
      if (item.val > maxVal) maxVal = item.val;
    }
    const range = maxVal - minVal + 1;

    steps.push(mk("init", "init",
      `Initialize Pigeonhole Sort. Min = ${minVal}, Max = ${maxVal}. Range = ${range} holes needed.`,
      minVal, maxVal, Array(range).fill(0), a, null, null));

    // Phase 2: Distribute — increment holes
    const holes = Array(range).fill(0);
    for (let i = 0; i < n; i++) {
      const h = a[i].val - minVal;
      steps.push(mk("distribute", "distribute",
        `arr[${i}] = ${a[i].val}. hole_idx = ${a[i].val} − ${minVal} = ${h}. Drop into hole[${h}].`,
        minVal, maxVal, holes, a, i, h));
      holes[h]++;
      steps.push(mk("placed", "distribute",
        `hole[${h}] count incremented to ${holes[h]}.`,
        minVal, maxVal, holes, a, i, h));
    }

    steps.push(mk("collect-start", "collect",
      `All elements in holes. Collecting back into array from hole[0] → hole[${range - 1}].`,
      minVal, maxVal, holes, a, null, null));

    // Phase 3: Collect
    const result: PHItem[] = [];
    const display = [...a];
    for (let h = 0; h < range; h++) {
      const count = holes[h];
      if (count === 0) continue;
      steps.push(mk("collect-hole", "collect",
        `hole[${h}] has ${count} element(s). Value = ${h + minVal}.`,
        minVal, maxVal, holes, display, null, h));
      for (let k = 0; k < count; k++) {
        const item: PHItem = { val: h + minVal, id: `out-${result.length}` };
        display[result.length] = item;
        result.push(item);
        steps.push(mk("collect", "collect",
          `Place ${h + minVal} at position ${result.length - 1}.`,
          minVal, maxVal, holes, [...display], result.length - 1, h));
      }
    }

    steps.push(mk("done", "done",
      `✓ Pigeonhole Sort complete. Array fully sorted.`,
      minVal, maxVal, holes, result, null, null));

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
