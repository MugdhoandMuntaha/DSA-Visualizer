"use client";
import { useState, useCallback, useRef } from "react";

export interface BubbleSortStep {
  type: string;
  array: number[];
  i: number;
  j: number;
  swapped: boolean;
  msg: string;
}

interface UseBubbleSortReturn {
  running: boolean;
  paused: boolean;
  array: number[];
  currentI: number;
  currentJ: number;
  swapped: boolean;
  activeStepIdx: number;
  logEntries: { type: string; msg: string }[];
  startBubbleSort: (initialArray: number[]) => void;
  stepBubbleSort: (initialArray: number[]) => void;
  togglePause: () => void;
  resetBubbleSort: () => void;
  setSpeed: (speed: number) => void;
}

export function useBubbleSort(initialArray: number[]): UseBubbleSortReturn {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [arrayState, setArrayState] = useState<number[]>([...initialArray]);
  
  const [currentI, setCurrentI] = useState<number>(-1);
  const [currentJ, setCurrentJ] = useState<number>(-1);
  const [swapped, setSwapped] = useState<boolean>(false);
  
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<BubbleSortStep[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]): BubbleSortStep[] => {
    const steps: BubbleSortStep[] = [];
    const n = arr.length;
    let currentArr = [...arr];
    
    steps.push({
      type: "init", array: [...currentArr], i: -1, j: -1, swapped: false,
      msg: `Initialize Bubble Sort for array of size ${n}.`
    });

    for (let i = 0; i < n - 1; i++) {
      let isSwapped = false;
      
      steps.push({
        type: "outer-loop", array: [...currentArr], i, j: -1, swapped: isSwapped,
        msg: `i = ${i}. Begin pass ${i + 1}.`
      });

      for (let j = 0; j < n - i - 1; j++) {
        steps.push({
          type: "compare", array: [...currentArr], i, j, swapped: isSwapped,
          msg: `Compare arr[${j}] (${currentArr[j]}) and arr[${j + 1}] (${currentArr[j + 1]}).`
        });

        if (currentArr[j] > currentArr[j + 1]) {
          // Swap
          const temp = currentArr[j];
          currentArr[j] = currentArr[j + 1];
          currentArr[j + 1] = temp;
          isSwapped = true;

          steps.push({
            type: "swap", array: [...currentArr], i, j, swapped: isSwapped,
            msg: `arr[${j}] > arr[${j + 1}], so swap them.`
          });
        }
      }

      steps.push({
        type: "check-swap", array: [...currentArr], i, j: -1, swapped: isSwapped,
        msg: `Pass complete. Were any elements swapped? ${isSwapped ? "Yes." : "No."}`
      });

      if (!isSwapped) {
        steps.push({
          type: "early-exit", array: [...currentArr], i, j: -1, swapped: isSwapped,
          msg: `No elements were swapped. Array is sorted. Early exit.`
        });
        break;
      }
    }

    steps.push({
      type: "done", array: [...currentArr], i: -1, j: -1, swapped: false,
      msg: `✓ Bubble Sort complete.`
    });

    return steps;
  }, []);

  const stepMap: Record<string, number> = {
    init: 0,
    "outer-loop": 1,
    "compare": 2,
    "swap": 3,
    "check-swap": 4,
    "early-exit": 5,
    done: 6,
  };

  const applyStep = useCallback((step: BubbleSortStep) => {
    setArrayState(step.array);
    setCurrentI(step.i);
    setCurrentJ(step.j);
    setSwapped(step.swapped);
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

  const startBubbleSort = useCallback((arr: number[]) => {
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
    setSwapped(false);
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

  const stepBubbleSort = useCallback((arr: number[]) => {
    if (arr.length === 0) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setArrayState([...arr]);
      setCurrentI(-1);
      setCurrentJ(-1);
      setSwapped(false);
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

  const resetBubbleSort = useCallback(() => {
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
    setSwapped(false);
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
    swapped,
    activeStepIdx,
    logEntries,
    startBubbleSort,
    stepBubbleSort,
    togglePause,
    resetBubbleSort,
    setSpeed,
  };
}
