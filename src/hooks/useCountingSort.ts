"use client";
import { useState, useCallback, useRef } from "react";

export interface CSItem { val: number; id: string; }

export type CSPhase = "init" | "find-max" | "init-cnt" | "count-freq" | "prefix-sum" | "build-output" | "done";

export interface CSState {
  originalArr: CSItem[];
  maxVal: number;
  minVal: number;
  cntArr: number[];
  ansArr: (CSItem | null)[];
  phase: CSPhase;
  activeIdxArr: number | null;
  activeIdxCnt: number | null;
  activeIdxAns: number | null;
  supportNegatives: boolean;
  msg: string;
  type: string;
}

export function useCountingSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supportNegatives, setSupportNegatives] = useState(false);
  const toCS = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `v-${v}-${i}` }));
  const [arrayState, setArrayState] = useState<CSItem[]>(toCS(initialArray));
  const [currentState, setCurrentState] = useState<CSState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<CSState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[], useNegatives: boolean) => {
    const steps: CSState[] = [];
    const a = toCS(arr);
    const n = a.length;
    let minV = 0, maxV = 0;
    
    if (n === 0) return steps;

    const mk = (
      type: string, phase: CSPhase, msg: string,
      maxVal: number, minVal: number, cntArr: number[], ansArr: (CSItem | null)[],
      activeIdxArr: number | null, activeIdxCnt: number | null, activeIdxAns: number | null
    ): CSState => {
      return {
        originalArr: [...a], maxVal, minVal, cntArr: [...cntArr], ansArr: [...ansArr],
        phase, activeIdxArr, activeIdxCnt, activeIdxAns, supportNegatives: useNegatives,
        msg, type
      };
    };

    let emptyCnt: number[] = [];
    let emptyAns: (CSItem | null)[] = Array(n).fill(null);

    steps.push(mk("init", "init", `Initialize Counting Sort for ${n} elements.`, 0, 0, [], emptyAns, null, null, null));

    // Phase 1: Find Max (and Min if negative support)
    minV = a[0].val;
    maxV = a[0].val;
    for (let i = 0; i < n; i++) {
      if (a[i].val > maxV) maxV = a[i].val;
      if (useNegatives && a[i].val < minV) minV = a[i].val;
      
      const isLast = i === n - 1;
      let m = `Scan index ${i}. val=${a[i].val}.`;
      if (useNegatives) m += ` Max=${maxV}, Min=${minV}.`;
      else m += ` Max=${maxV}.`;
      
      steps.push(mk("find-max", "find-max", m, maxV, minV, [], emptyAns, i, null, null));
    }

    if (!useNegatives) minV = 0;

    // Phase 2: Init count array
    const range = maxV - minV + 1;
    if (range > 30) {
      // Safety cap check (should be handled by UI, but double check)
      steps.push(mk("error", "done", `Range too large (${range}). Aborting.`, maxV, minV, [], emptyAns, null, null, null));
      return steps;
    }

    let cArr = Array(range).fill(0);
    steps.push(mk("init-cnt", "init-cnt", `Create count array of size ${range} initialized to 0.`, maxV, minV, cArr, emptyAns, null, null, null));

    // Phase 3: Count Frequencies
    for (let i = 0; i < n; i++) {
      const v = a[i].val;
      const cIdx = v - minV;
      cArr[cIdx]++;
      steps.push(mk("count-freq", "count-freq", `arr[${i}] = ${v}. Increment cntArr[${v}${useNegatives?` - (${minV})`:""}] to ${cArr[cIdx]}.`, maxV, minV, cArr, emptyAns, i, cIdx, null));
    }

    // Phase 4: Prefix Sums
    for (let i = 1; i < range; i++) {
      cArr[i] += cArr[i - 1];
      steps.push(mk("prefix-sum", "prefix-sum", `Prefix Sum: cntArr[${i}] = cntArr[${i}] + cntArr[${i-1}] = ${cArr[i]}.`, maxV, minV, cArr, emptyAns, null, i, null));
    }

    // Phase 5: Build Output
    let ans = Array(n).fill(null);
    for (let i = n - 1; i >= 0; i--) {
      const v = a[i].val;
      const cIdx = v - minV;
      const pos = cArr[cIdx] - 1;
      
      ans[pos] = a[i];
      steps.push(mk("build-output", "build-output", `arr[${i}] = ${v}. pos = cntArr[${cIdx}] - 1 = ${pos}. Place in ans[${pos}].`, maxV, minV, cArr, ans, i, cIdx, pos));

      cArr[cIdx]--;
      steps.push(mk("build-output", "build-output", `Decrement cntArr[${cIdx}] to ${cArr[cIdx]}.`, maxV, minV, cArr, ans, i, cIdx, pos));
    }

    steps.push(mk("done", "done", `✓ Counting Sort complete.`, maxV, minV, cArr, ans, null, null, null));

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

  const startSort = useCallback((arr: number[], useNeg: boolean) => {
    if (!arr.length) return;
    if (runningRef.current && pausedRef.current) { pausedRef.current = false; setPaused(false); autoStep(); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    resetState();
    setSupportNegatives(useNeg);
    stepsRef.current = buildSteps(arr, useNeg);
    stepIdxRef.current = 0; runningRef.current = true; pausedRef.current = false;
    setRunning(true); setPaused(false); setTimeout(() => autoStep(), 10);
  }, [buildSteps, autoStep, resetState]);

  const stepSort = useCallback((arr: number[], useNeg: boolean) => {
    if (!arr.length) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current); resetState();
      setSupportNegatives(useNeg);
      stepsRef.current = buildSteps(arr, useNeg);
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
    running, paused, array: arrayState, currentState, activeStepIdx, logEntries, supportNegatives,
    startSort, stepSort, togglePause, resetSort,
    setSpeed: useCallback((s: number) => { speedRef.current = s; }, []),
  };
}
