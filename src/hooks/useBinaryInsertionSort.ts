"use client";
import { useState, useCallback, useRef } from "react";

export interface BISItem { val: number | null; id: string; }

export type BISPhase = "init" | "extract" | "search" | "shift" | "insert" | "done";

export interface BISState {
  originalArr: BISItem[];
  i: number | null;
  keyItem: BISItem | null;
  left: number | null;
  right: number | null;
  mid: number | null;
  shiftIdx: number | null;
  phase: BISPhase;
  msg: string;
  type: string;
}

export function useBinaryInsertionSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  
  const toBIS = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `v-${v}-${i}` }));
  const [arrayState, setArrayState] = useState<BISItem[]>(toBIS(initialArray));
  const [currentState, setCurrentState] = useState<BISState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<BISState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]) => {
    const steps: BISState[] = [];
    const a: BISItem[] = toBIS(arr);
    const n = a.length;
    
    if (n === 0) return steps;

    const mk = (
      type: string, phase: BISPhase, msg: string,
      i: number | null, keyItem: BISItem | null, 
      left: number | null, right: number | null, mid: number | null, shiftIdx: number | null
    ): BISState => {
      return {
        originalArr: [...a], i, keyItem: keyItem ? { ...keyItem } : null, left, right, mid, shiftIdx, phase, msg, type
      };
    };

    steps.push(mk("init", "init", `Initialize Binary Insertion Sort. Element at index 0 is trivially sorted.`, null, null, null, null, null, null));

    for (let i = 1; i < n; i++) {
      let keyItem = { ...a[i] };
      
      // Temporarily mark the extracted slot as empty by replacing its value
      a[i] = { val: null, id: `empty-${i}` };
      
      steps.push(mk("extract", "extract", `Pass ${i}: Extract arr[${i}] (${keyItem.val}) as key.`, i, keyItem, null, null, null, null));
      
      let l = 0;
      let r = i - 1;
      
      while (l <= r) {
        let m = Math.floor((l + r) / 2);
        steps.push(mk("calc-mid", "search", `Search space [${l}..${r}]. Calculate mid = ${m}.`, i, keyItem, l, r, m, null));
        steps.push(mk("compare", "search", `Compare key (${keyItem.val}) with arr[${m}] (${a[m].val}).`, i, keyItem, l, r, m, null));
        
        // Note: safe to cast a[m].val to number as it's within the sorted portion [0..i-1]
        if (keyItem.val! < (a[m].val as number)) {
          steps.push(mk("update-bounds", "search", `key < arr[${m}]. Target must be to the left. Update right = ${m - 1}.`, i, keyItem, l, r, m, null));
          r = m - 1;
        } else {
          steps.push(mk("update-bounds", "search", `key >= arr[${m}]. Target must be to the right. Update left = ${m + 1}.`, i, keyItem, l, r, m, null));
          l = m + 1;
        }
      }
      
      steps.push(mk("found-pos", "search", `Search complete. Insertion point is index ${l}.`, i, keyItem, l, r, null, null));
      
      for (let j = i - 1; j >= l; j--) {
        steps.push(mk("shift", "shift", `Shift arr[${j}] (${a[j].val}) to arr[${j + 1}].`, i, keyItem, l, r, null, j));
        a[j + 1] = { ...a[j] };
        a[j] = { val: null, id: `empty-${j}` }; // Leave current spot empty for visuals
      }
      
      if (i - 1 >= l) {
          steps.push(mk("shifted", "shift", `Shifting complete.`, i, keyItem, l, r, null, null));
      }
      
      steps.push(mk("insert", "insert", `Insert key (${keyItem.val}) into arr[${l}].`, i, keyItem, l, r, null, null));
      a[l] = keyItem;
      steps.push(mk("inserted", "insert", `Pass ${i} complete.`, i, null, null, null, null, null));
    }
    
    steps.push(mk("done", "done", `Array is fully sorted.`, null, null, null, null, null, null));

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
    setArrayState(toBIS(arr));
    stepsRef.current = buildSteps(arr);
    stepIdxRef.current = 0; runningRef.current = true; pausedRef.current = false;
    setRunning(true); setPaused(false); setTimeout(() => autoStep(), 10);
  }, [buildSteps, autoStep, resetState]);

  const stepSort = useCallback((arr: number[]) => {
    if (!arr.length) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current); resetState();
      setArrayState(toBIS(arr));
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
