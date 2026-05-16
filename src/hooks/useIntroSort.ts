"use client";
import { useState, useCallback, useRef } from "react";

export interface IntroItem { val: number; id: string; }

export type IntroPhase = "init" | "quick-sort" | "heap-sort" | "insertion-sort" | "done";

export interface IntroState {
  arr: IntroItem[];
  phase: IntroPhase;
  activeRange: [number, number] | null;
  depthLimit: number;
  currentDepth: number;
  
  // Quick Sort state
  pivotIdx: number | null;
  i: number | null;
  j: number | null;

  // Heap Sort state
  heapSize: number | null;
  activeNode: number | null;
  compareNode: number | null;

  // Insertion Sort state
  insI: number | null;
  insJ: number | null;

  msg: string;
  type: string;
}

export function useIntroSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentState, setCurrentState] = useState<IntroState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<IntroState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const toItem = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `in-${i}` }));
  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]) => {
    const steps: IntroState[] = [];
    const a: IntroItem[] = toItem(arr);
    const n = a.length;
    if (n === 0) return steps;

    // To ensure Heap Sort is triggered for demonstration, we use a slightly aggressive depth limit
    const initialDepthLimit = Math.max(1, Math.floor(Math.log2(n))); 

    const mk = (
      type: string, phase: IntroPhase, msg: string,
      arr: IntroItem[], activeRange: [number, number] | null, depthLimit: number, currentDepth: number,
      pivotIdx: number | null = null, i: number | null = null, j: number | null = null,
      heapSize: number | null = null, activeNode: number | null = null, compareNode: number | null = null,
      insI: number | null = null, insJ: number | null = null
    ): IntroState => ({
      arr: [...arr], phase, activeRange, depthLimit, currentDepth,
      pivotIdx, i, j, heapSize, activeNode, compareNode, insI, insJ,
      msg, type
    });

    steps.push(mk("init", "init",
      `Initialize Intro Sort. Elements: ${n}. Initial depth limit: ${initialDepthLimit}.`,
      a, null, initialDepthLimit, 0));

    // Insertion Sort for small subarrays
    const insertionSort = (left: number, right: number, depth: number) => {
      steps.push(mk("switch-ins", "insertion-sort",
        `Subarray size ${right - left + 1} < 4. Switching to Insertion Sort for range [${left}..${right}].`,
        a, [left, right], initialDepthLimit, depth));
      
      for (let i = left + 1; i <= right; i++) {
        let key = { ...a[i] };
        let j = i - 1;
        steps.push(mk("ins-extract", "insertion-sort",
          `Extract ${key.val} at index ${i}.`,
          a, [left, right], initialDepthLimit, depth, null, null, null, null, null, null, i, j));
        
        while (j >= left && a[j].val > key.val) {
          a[j + 1] = { ...a[j] };
          a[j] = { val: key.val, id: `hole-${Math.random()}` };
          steps.push(mk("ins-shift", "insertion-sort",
            `Shift ${a[j+1].val} to the right.`,
            a, [left, right], initialDepthLimit, depth, null, null, null, null, null, null, i, j));
          j--;
        }
        a[j + 1] = key;
        steps.push(mk("ins-place", "insertion-sort",
          `Insert key at index ${j + 1}.`,
          a, [left, right], initialDepthLimit, depth, null, null, null, null, null, null, i, j + 1));
      }
    };

    // Heap Sort fallback
    const heapify = (left: number, right: number, nNode: number, i: number, depth: number) => {
      let largest = i;
      let l = left + 2 * (i - left) + 1;
      let r = left + 2 * (i - left) + 2;

      steps.push(mk("heap-compare", "heap-sort",
        `Heapify at node ${i} (val=${a[i].val}).`,
        a, [left, right], initialDepthLimit, depth, null, null, null, nNode, i, null));

      if (l <= right && l < left + nNode && a[l].val > a[largest].val) largest = l;
      if (r <= right && r < left + nNode && a[r].val > a[largest].val) largest = r;

      if (largest !== i) {
        steps.push(mk("heap-swap", "heap-sort",
          `Swap node ${i} (${a[i].val}) with ${largest} (${a[largest].val}).`,
          a, [left, right], initialDepthLimit, depth, null, null, null, nNode, i, largest));
        
        const temp = { ...a[i] };
        a[i] = { ...a[largest] };
        a[largest] = temp;
        
        heapify(left, right, nNode, largest, depth);
      }
    };

    const heapSort = (left: number, right: number, depth: number) => {
      steps.push(mk("switch-heap", "heap-sort",
        `Depth limit reached! Switching to Heap Sort for range [${left}..${right}].`,
        a, [left, right], initialDepthLimit, depth));

      const size = right - left + 1;

      // Build max heap
      for (let i = left + Math.floor(size / 2) - 1; i >= left; i--) {
        heapify(left, right, size, i, depth);
      }

      // Extract elements
      for (let i = right; i > left; i--) {
        steps.push(mk("heap-extract", "heap-sort",
          `Extract max element ${a[left].val} and move to end of heap range.`,
          a, [left, right], initialDepthLimit, depth, null, null, null, i - left + 1, left, i));
        
        const temp = { ...a[left] };
        a[left] = { ...a[i] };
        a[i] = temp;

        heapify(left, right, i - left, left, depth);
      }
    };

    // Quick Sort core
    const partition = (left: number, right: number, depth: number): number => {
      const pivot = a[right].val;
      steps.push(mk("qs-pivot", "quick-sort",
        `Partition range [${left}..${right}]. Pivot chosen: ${pivot}.`,
        a, [left, right], initialDepthLimit, depth, right, null, null));

      let i = left - 1;
      for (let j = left; j < right; j++) {
        steps.push(mk("qs-compare", "quick-sort",
          `Compare arr[${j}]=${a[j].val} with pivot ${pivot}.`,
          a, [left, right], initialDepthLimit, depth, right, i, j));

        if (a[j].val <= pivot) {
          i++;
          const temp = { ...a[i] };
          a[i] = { ...a[j] };
          a[j] = temp;
          steps.push(mk("qs-swap", "quick-sort",
            `Swapped arr[${i}] and arr[${j}].`,
            a, [left, right], initialDepthLimit, depth, right, i, j));
        }
      }
      
      const temp = { ...a[i + 1] };
      a[i + 1] = { ...a[right] };
      a[right] = temp;
      
      steps.push(mk("qs-placed", "quick-sort",
        `Pivot ${pivot} placed at final index ${i + 1}.`,
        a, [left, right], initialDepthLimit, depth, i + 1, null, null));

      return i + 1;
    };

    const introsortUtil = (left: number, right: number, depthLimit: number, currentDepth: number) => {
      const size = right - left + 1;
      if (size <= 1) return;

      if (size < 4) {
        insertionSort(left, right, currentDepth);
        return;
      }

      if (depthLimit === 0) {
        heapSort(left, right, currentDepth);
        return;
      }

      const p = partition(left, right, currentDepth);
      introsortUtil(left, p - 1, depthLimit - 1, currentDepth + 1);
      introsortUtil(p + 1, right, depthLimit - 1, currentDepth + 1);
    };

    introsortUtil(0, n - 1, initialDepthLimit, 0);

    steps.push(mk("done", "done",
      `✓ Intro Sort complete. Array fully sorted.`,
      a, null, initialDepthLimit, 0));

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
