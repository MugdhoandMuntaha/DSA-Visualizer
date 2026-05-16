"use client";
import { useState, useCallback, useRef } from "react";

export interface InsertionSortStep {
  type: string;
  array: number[];
  i: number;
  j: number;
  keyValue: number;
  shiftingIndices: number[];
  msg: string;
}

interface UseInsertionSortReturn {
  running: boolean;
  paused: boolean;
  array: number[];
  currentI: number;
  currentJ: number;
  keyValue: number | null;
  shiftingIndices: number[];
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  startSort: (initialArray: number[]) => void;
  stepSort: (initialArray: number[]) => void;
  togglePause: () => void;
  resetSort: () => void;
  setSpeed: (speed: number) => void;
}

export function useInsertionSort(initialArray: number[]): UseInsertionSortReturn {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [arrayState, setArrayState] = useState<number[]>([...initialArray]);

  const [currentI, setCurrentI] = useState(-1);
  const [currentJ, setCurrentJ] = useState(-1);
  const [keyValue, setKeyValue] = useState<number | null>(null);
  const [shiftingIndices, setShiftingIndices] = useState<number[]>([]);

  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<InsertionSortStep[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]): InsertionSortStep[] => {
    const steps: InsertionSortStep[] = [];
    const n = arr.length;
    const a = [...arr];

    steps.push({
      type: "init", array: [...a], i: -1, j: -1, keyValue: -1, shiftingIndices: [],
      msg: `Initialize Insertion Sort for array of size ${n}.`,
    });

    for (let i = 1; i < n; i++) {
      const key = a[i];

      steps.push({
        type: "pick-key", array: [...a], i, j: i - 1, keyValue: key, shiftingIndices: [],
        msg: `i = ${i}. Pick key = arr[${i}] = ${key}. j = ${i - 1}.`,
      });

      let j = i - 1;
      const shifted: number[] = [];

      while (j >= 0 && a[j] > key) {
        steps.push({
          type: "compare", array: [...a], i, j, keyValue: key, shiftingIndices: [...shifted, j],
          msg: `arr[${j}] (${a[j]}) > key (${key}). Shift arr[${j}] right.`,
        });

        a[j + 1] = a[j];
        shifted.push(j);

        steps.push({
          type: "shift", array: [...a], i, j, keyValue: key, shiftingIndices: [...shifted],
          msg: `arr[${j + 1}] = arr[${j}] = ${a[j]}. Shifted.`,
        });

        j--;
      }

      if (j >= 0) {
        steps.push({
          type: "compare-stop", array: [...a], i, j, keyValue: key, shiftingIndices: [],
          msg: `arr[${j}] (${a[j]}) ≤ key (${key}). Stop shifting.`,
        });
      } else {
        steps.push({
          type: "compare-stop", array: [...a], i, j, keyValue: key, shiftingIndices: [],
          msg: `j = ${j}. Reached beginning of array. Stop shifting.`,
        });
      }

      a[j + 1] = key;

      steps.push({
        type: "insert", array: [...a], i, j: j + 1, keyValue: key, shiftingIndices: [],
        msg: `Insert key (${key}) at position ${j + 1}. arr[${j + 1}] = ${key}.`,
      });
    }

    steps.push({
      type: "done", array: [...a], i: -1, j: -1, keyValue: -1, shiftingIndices: [],
      msg: `✓ Insertion Sort complete.`,
    });

    return steps;
  }, []);

  const stepMap: Record<string, number> = {
    init: 0,
    "pick-key": 1,
    compare: 2,
    shift: 3,
    "compare-stop": 2,
    insert: 4,
    done: 5,
  };

  const applyStep = useCallback((step: InsertionSortStep) => {
    setArrayState(step.array);
    setCurrentI(step.i);
    setCurrentJ(step.j);
    setKeyValue(step.keyValue);
    setShiftingIndices(step.shiftingIndices);
    setActiveStepIdx(stepMap[step.type] ?? -1);
    setLogEntries((prev) => [...prev, { type: step.type, msg: step.msg }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoStep = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return;
    if (stepIdxRef.current >= stepsRef.current.length) {
      runningRef.current = false;
      setRunning(false);
      setPaused(false);
      return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const startSort = useCallback((arr: number[]) => {
    if (arr.length === 0) return;
    if (runningRef.current && pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
      autoStep();
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);

    setArrayState([...arr]);
    setCurrentI(-1);
    setCurrentJ(-1);
    setKeyValue(null);
    setShiftingIndices([]);
    setActiveStepIdx(-1);
    setLogEntries([]);

    stepsRef.current = buildSteps(arr);
    stepIdxRef.current = 0;
    runningRef.current = true;
    pausedRef.current = false;
    setRunning(true);
    setPaused(false);

    setTimeout(() => autoStep(), 10);
  }, [buildSteps, autoStep]);

  const stepSort = useCallback((arr: number[]) => {
    if (arr.length === 0) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setArrayState([...arr]);
      setCurrentI(-1);
      setCurrentJ(-1);
      setKeyValue(null);
      setShiftingIndices([]);
      setActiveStepIdx(-1);
      setLogEntries([]);

      stepsRef.current = buildSteps(arr);
      stepIdxRef.current = 0;
      runningRef.current = true;
      pausedRef.current = true;
      setRunning(true);
      setPaused(true);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    pausedRef.current = true;
    setPaused(true);

    if (stepIdxRef.current >= stepsRef.current.length) {
      runningRef.current = false;
      setRunning(false);
      setPaused(false);
      return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
  }, [buildSteps, applyStep]);

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep();
    else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetSort = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false;
    pausedRef.current = false;
    stepsRef.current = [];
    stepIdxRef.current = 0;
    setRunning(false);
    setPaused(false);

    setArrayState([...initialArray]);
    setCurrentI(-1);
    setCurrentJ(-1);
    setKeyValue(null);
    setShiftingIndices([]);
    setActiveStepIdx(-1);
    setLogEntries([]);
  }, [initialArray]);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
  }, []);

  return {
    running,
    paused,
    array: arrayState,
    currentI,
    currentJ,
    keyValue,
    shiftingIndices,
    activeStepIdx,
    logEntries,
    startSort,
    stepSort,
    togglePause,
    resetSort,
    setSpeed,
  };
}
