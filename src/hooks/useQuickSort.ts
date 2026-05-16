"use client";
import { useState, useCallback, useRef } from "react";

export type PartitionMethod = "counting" | "lomuto" | "hoare";
export type PivotStrategy = "first" | "last" | "random" | "median";
export interface QSItem { val: number; id: string; }
export interface QSAnimData {
  pivotVal: number; cnt: number; iPtr: number; jPtr: number;
  subarray: QSItem[]; low: number; pivotPos: number;
  lastSwap: [number, number] | null; phase: "counting" | "swapping";
}
export interface QSTreeNode { l: number; r: number; isPivot?: boolean; phantom?: boolean; }
export interface QuickSortStep {
  type: string; array: QSItem[]; l: number; r: number;
  partRanges: string[]; sortedData: [string, QSItem[]][];
  pivotData: [string, number][]; snapData: [string, QSItem[]][];
  qsAnim: QSAnimData | null; msg: string;
}

export function useQuickSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [partitionMethod, setPartitionMethod] = useState<PartitionMethod>("counting");
  const [pivotStrategy, setPivotStrategy] = useState<PivotStrategy>("first");
  const toQS = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `v-${v}-${i}` }));
  const [arrayState, setArrayState] = useState<QSItem[]>(toQS(initialArray));
  const [activeRange, setActiveRange] = useState<[number, number] | null>(null);
  const [partitionedRanges, setPartitionedRanges] = useState<Set<string>>(new Set());
  const [sortedRangesMap, setSortedRangesMap] = useState<Map<string, QSItem[]>>(new Map());
  const [pivotMap, setPivotMap] = useState<Map<string, number>>(new Map());
  const [snapshotMap, setSnapshotMap] = useState<Map<string, QSItem[]>>(new Map());
  const [qsAnim, setQsAnim] = useState<QSAnimData | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);
  const treeLevelsRef = useRef<QSTreeNode[][]>([]);
  const parentMapRef = useRef<Map<string, string>>(new Map());
  const [treeLevels, setTreeLevels] = useState<QSTreeNode[][]>([]);
  const [parentMap, setParentMap] = useState<Map<string, string>>(new Map());
  const stepsRef = useRef<QuickSortStep[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);
  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[], partMethod: PartitionMethod, pivotStrat: PivotStrategy) => {
    const steps: QuickSortStep[] = [];
    const a = toQS(arr); const n = a.length;
    const partR = new Set<string>();
    const sortR = new Map<string, QSItem[]>();
    const pivots = new Map<string, number>();
    const snaps = new Map<string, QSItem[]>();
    const lvls: QSTreeNode[][] = [];
    const pMap = new Map<string, string>();

    const snap = () => ({
      partRanges: [...partR], sortedData: [...sortR.entries()] as [string, QSItem[]][],
      pivotData: [...pivots.entries()] as [string, number][],
      snapData: [...snaps.entries()] as [string, QSItem[]][],
    });
    const mk = (type: string, l: number, r: number, anim: QSAnimData | null, msg: string): QuickSortStep => {
      if (type !== "combine" && type !== "done" && type !== "init") {
        snaps.set(`${l}-${r}`, a.slice(l, r + 1));
      }
      return { type, array: [...a], l, r, ...snap(), qsAnim: anim, msg };
    };

    const addLvl = (l: number, r: number, level: number, isPivot?: boolean) => {
      if (!lvls[level]) lvls[level] = [];
      lvls[level].push({ l, r, isPivot });
    };

    steps.push(mk("init", 0, n - 1, null, `Initialize Quick Sort for ${n} elements.`));

    function qsRec(low: number, high: number, level: number) {
      if (low > high) return;
      addLvl(low, high, level);
      if (low === high) {
        sortR.set(`${low}-${high}`, [a[low]]);
        snaps.set(`${low}-${high}`, [a[low]]);
        steps.push(mk("base-case", low, high, null, `Base case: arr[${low}] = ${a[low].val}.`));
        return;
      }
      const k = `${low}-${high}`;
      // Pivot Selection
      let pIdx = low;
      if (pivotStrat === "last") pIdx = high;
      else if (pivotStrat === "random") pIdx = Math.floor(Math.random() * (high - low + 1)) + low;
      else if (pivotStrat === "median") {
        const mid = Math.floor((low + high) / 2);
        const vals = [ {v: a[low].val, i: low}, {v: a[mid].val, i: mid}, {v: a[high].val, i: high} ];
        vals.sort((x, y) => x.v - y.v);
        pIdx = vals[1].i;
      }

      let targetPIdx = low; // default for counting and hoare
      if (partMethod === "lomuto") targetPIdx = high;

      if (pIdx !== targetPIdx) {
        steps.push(mk("pick-pivot", low, high,
          { pivotVal: a[pIdx].val, cnt: 0, iPtr: pIdx, jPtr: -1, subarray: a.slice(low, high + 1), low, pivotPos: pIdx, lastSwap: null, phase: "counting" },
          `Selected pivot arr[${pIdx}]=${a[pIdx].val} (${pivotStrat}). Swap to ${targetPIdx}.`));
        [a[pIdx], a[targetPIdx]] = [a[targetPIdx], a[pIdx]];
      }

      const pivotVal = a[targetPIdx].val;
      pivots.set(k, pivotVal);

      if (partMethod === "counting") {
          steps.push(mk("pick-pivot", low, high,
            { pivotVal, cnt: 0, iPtr: low, jPtr: -1, subarray: a.slice(low, high + 1), low, pivotPos: low, lastSwap: null, phase: "counting" },
            `Pivot = arr[${low}] = ${pivotVal}.`));

          let cnt = 0;
          for (let i = low + 1; i <= high; i++) {
            if (a[i].val <= pivotVal) {
              cnt++;
              steps.push(mk("count", low, high,
                { pivotVal, cnt, iPtr: i, jPtr: -1, subarray: a.slice(low, high + 1), low, pivotPos: low, lastSwap: null, phase: "counting" },
                `arr[${i}]=${a[i].val} ≤ ${pivotVal}. Count=${cnt}.`));
            } else {
              steps.push(mk("count", low, high,
                { pivotVal, cnt, iPtr: i, jPtr: -1, subarray: a.slice(low, high + 1), low, pivotPos: low, lastSwap: null, phase: "counting" },
                `arr[${i}]=${a[i].val} > ${pivotVal}. Skip.`));
            }
          }

          let pivotIdx = cnt + low;
          [a[low], a[pivotIdx]] = [a[pivotIdx], a[low]];
          
          steps.push(mk("place-pivot", low, high,
            { pivotVal, cnt, iPtr: -1, jPtr: -1, subarray: a.slice(low, high + 1), low, pivotPos: pivotIdx, lastSwap: [low, pivotIdx], phase: "swapping" },
            `Place pivot at index ${pivotIdx}.`));

          let i = low, j = high;
          while (i < pivotIdx && j > pivotIdx) {
            while (i < pivotIdx && a[i].val <= pivotVal) {
              steps.push(mk("scan-i", low, high,
                 { pivotVal, cnt, iPtr: i, jPtr: j, subarray: a.slice(low, high + 1), low, pivotPos: pivotIdx, lastSwap: null, phase: "swapping" },
                 `arr[${i}]=${a[i].val} ≤ ${pivotVal}. i++.`));
              i++;
            }
            if (i < pivotIdx) {
              steps.push(mk("scan-i", low, high,
                 { pivotVal, cnt, iPtr: i, jPtr: j, subarray: a.slice(low, high + 1), low, pivotPos: pivotIdx, lastSwap: null, phase: "swapping" },
                 `arr[${i}]=${a[i].val} > ${pivotVal}. Stop i.`));
            }

            while (j > pivotIdx && a[j].val > pivotVal) {
              steps.push(mk("scan-j", low, high,
                 { pivotVal, cnt, iPtr: i, jPtr: j, subarray: a.slice(low, high + 1), low, pivotPos: pivotIdx, lastSwap: null, phase: "swapping" },
                 `arr[${j}]=${a[j].val} > ${pivotVal}. j--.`));
              j--;
            }
            if (j > pivotIdx) {
              steps.push(mk("scan-j", low, high,
                 { pivotVal, cnt, iPtr: i, jPtr: j, subarray: a.slice(low, high + 1), low, pivotPos: pivotIdx, lastSwap: null, phase: "swapping" },
                 `arr[${j}]=${a[j].val} ≤ ${pivotVal}. Stop j.`));
            }

            if (i < pivotIdx && j > pivotIdx) {
              [a[i], a[j]] = [a[j], a[i]];
              steps.push(mk("swap", low, high,
                 { pivotVal, cnt, iPtr: i, jPtr: j, subarray: a.slice(low, high + 1), low, pivotPos: pivotIdx, lastSwap: [i, j], phase: "swapping" },
                 `Swap arr[${i}] and arr[${j}].`));
              i++;
              j--;
            }
          }

          let si = pivotIdx;
          partR.add(k);
          addLvl(si, si, level + 1, true);
          snaps.set(`${si}-${si}`, [a[si]]);
          sortR.set(`${si}-${si}`, [a[si]]);
          pMap.set(`${si}-${si}`, k);
          steps.push(mk("partition-done", low, high, null, `Split → [${low}..${si - 1}] | pivot(${pivotVal}) | [${si + 1}..${high}].`));
          if (si > low) { pMap.set(`${low}-${si - 1}`, k); qsRec(low, si - 1, level + 1); }
          if (si < high) { pMap.set(`${si + 1}-${high}`, k); qsRec(si + 1, high, level + 1); }

      } else if (partMethod === "lomuto") {
          steps.push(mk("pick-pivot", low, high,
            { pivotVal, cnt: 0, iPtr: low, jPtr: low, subarray: a.slice(low, high + 1), low, pivotPos: high, lastSwap: null, phase: "swapping" },
            `Pivot = arr[${high}] = ${pivotVal}.`));

          let si = low;
          for (let j = low; j < high; j++) {
            if (a[j].val < pivotVal) {
              if (si !== j) {
                [a[si], a[j]] = [a[j], a[si]];
                steps.push(mk("swap", low, high,
                  { pivotVal, cnt: 0, iPtr: si + 1, jPtr: j + 1, subarray: a.slice(low, high + 1), low, pivotPos: high, lastSwap: [si, j], phase: "swapping" },
                  `arr[${j}]=${a[j].val} < ${pivotVal}, swap arr[${si}]↔arr[${j}].`));
              } else {
                steps.push(mk("scan-j", low, high,
                  { pivotVal, cnt: 0, iPtr: si + 1, jPtr: j + 1, subarray: a.slice(low, high + 1), low, pivotPos: high, lastSwap: null, phase: "swapping" },
                  `arr[${j}]=${a[j].val} < ${pivotVal}, advance store.`));
              }
              si++;
            } else {
              steps.push(mk("scan-j", low, high,
                { pivotVal, cnt: 0, iPtr: si, jPtr: j + 1, subarray: a.slice(low, high + 1), low, pivotPos: high, lastSwap: null, phase: "swapping" },
                `arr[${j}]=${a[j].val} ≥ ${pivotVal}, skip.`));
            }
          }

          [a[si], a[high]] = [a[high], a[si]];
          steps.push(mk("place-pivot", low, high,
            { pivotVal, cnt: 0, iPtr: si, jPtr: high, subarray: a.slice(low, high + 1), low, pivotPos: si, lastSwap: [si, high], phase: "swapping" },
            `Place pivot ${pivotVal} at index ${si}.`));

          partR.add(k);
          addLvl(si, si, level + 1, true);
          snaps.set(`${si}-${si}`, [a[si]]);
          sortR.set(`${si}-${si}`, [a[si]]);
          pMap.set(`${si}-${si}`, k);
          steps.push(mk("partition-done", low, high, null, `Split → [${low}..${si - 1}] | pivot(${pivotVal}) | [${si + 1}..${high}].`));
          if (si > low) { pMap.set(`${low}-${si - 1}`, k); qsRec(low, si - 1, level + 1); }
          if (si < high) { pMap.set(`${si + 1}-${high}`, k); qsRec(si + 1, high, level + 1); }

      } else if (partMethod === "hoare") {
          steps.push(mk("pick-pivot", low, high,
            { pivotVal, cnt: 0, iPtr: low, jPtr: high, subarray: a.slice(low, high + 1), low, pivotPos: low, lastSwap: null, phase: "swapping" },
            `Pivot = arr[${low}] = ${pivotVal}.`));

          let i = low - 1;
          let j = high + 1;
          while (true) {
            do {
              i++;
              steps.push(mk("scan-i", low, high,
                { pivotVal, cnt: 0, iPtr: i, jPtr: j === high + 1 ? high : j, subarray: a.slice(low, high + 1), low, pivotPos: low, lastSwap: null, phase: "swapping" },
                `arr[${i}]=${a[i].val} < ${pivotVal} ?`));
            } while (a[i].val < pivotVal);

            do {
              j--;
              steps.push(mk("scan-j", low, high,
                { pivotVal, cnt: 0, iPtr: i, jPtr: j, subarray: a.slice(low, high + 1), low, pivotPos: low, lastSwap: null, phase: "swapping" },
                `arr[${j}]=${a[j].val} > ${pivotVal} ?`));
            } while (a[j].val > pivotVal);

            if (i >= j) {
              steps.push(mk("partition-done", low, high, null, `Pointers crossed at ${j}. Split → [${low}..${j}] | [${j + 1}..${high}].`));
              partR.add(k);
              pMap.set(`${low}-${j}`, k);
              pMap.set(`${j + 1}-${high}`, k);
              qsRec(low, j, level + 1);
              qsRec(j + 1, high, level + 1);
              break;
            }

            [a[i], a[j]] = [a[j], a[i]];
            steps.push(mk("swap", low, high,
              { pivotVal, cnt: 0, iPtr: i, jPtr: j, subarray: a.slice(low, high + 1), low, pivotPos: low, lastSwap: [i, j], phase: "swapping" },
              `Swap arr[${i}] and arr[${j}].`));
          }
      }

      sortR.set(k, a.slice(low, high + 1));
      steps.push(mk("combine", low, high, null, `Sorted: [${a.slice(low, high + 1).map(x=>x.val).join(", ")}].`));
    }

    qsRec(0, n - 1, 0);
    steps.push(mk("done", 0, n - 1, null, `✓ Quick Sort complete.`));

    // Phantom spacers
    const maxLvl = lvls.length - 1;
    const parents = new Set<string>();
    for (const [, v] of pMap) parents.add(v);
    for (let lv = 0; lv < maxLvl; lv++) {
      for (const nd of lvls[lv]) {
        if (nd.phantom) continue;
        if (!parents.has(`${nd.l}-${nd.r}`)) {
          for (let d = lv + 1; d <= maxLvl; d++)
            lvls[d].push({ l: nd.l, r: nd.r, phantom: true });
        }
      }
    }
    for (const lv of lvls) lv.sort((a, b) => a.l - b.l);
    treeLevelsRef.current = lvls;
    parentMapRef.current = pMap;
    return steps;
  }, []);

  const sMap: Record<string, number> = {
    init: 0, "pick-pivot": 1, count: 2, "place-pivot": 3, "scan-i": 4, "scan-j": 5, swap: 6,
    "partition-done": 7, "base-case": 7, combine: 8, done: 9,
  };

  const applyStep = useCallback((s: QuickSortStep) => {
    setArrayState(s.array); setActiveRange([s.l, s.r]);
    setPartitionedRanges(new Set(s.partRanges));
    setSortedRangesMap(new Map(s.sortedData));
    setPivotMap(new Map(s.pivotData));
    setSnapshotMap(new Map(s.snapData));
    setQsAnim(s.qsAnim);
    setActiveStepIdx(sMap[s.type] ?? -1);
    setLogEntries(p => [...p, { type: s.type, msg: s.msg }]);
  }, []);

  const autoStep = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return;
    if (stepIdxRef.current >= stepsRef.current.length) {
      runningRef.current = false; setRunning(false); setPaused(false); return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]);
    stepIdxRef.current++;
    timerRef.current = setTimeout(autoStep, getDelay());
  }, [applyStep]);

  const resetState = useCallback(() => {
    setArrayState(toQS(initialArray)); setActiveRange(null);
    setPartitionedRanges(new Set()); setSortedRangesMap(new Map());
    setPivotMap(new Map()); setSnapshotMap(new Map()); setQsAnim(null);
    setActiveStepIdx(-1); setLogEntries([]); setTreeLevels([]); setParentMap(new Map());
  }, [initialArray]);

  const startSort = useCallback((arr: number[], partMethod: PartitionMethod, pivotStrat: PivotStrategy) => {
    if (!arr.length) return;
    if (runningRef.current && pausedRef.current) { pausedRef.current = false; setPaused(false); autoStep(); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    resetState();
    setPartitionMethod(partMethod); setPivotStrategy(pivotStrat);
    stepsRef.current = buildSteps(arr, partMethod, pivotStrat);
    setTreeLevels(treeLevelsRef.current); setParentMap(parentMapRef.current);
    stepIdxRef.current = 0; runningRef.current = true; pausedRef.current = false;
    setRunning(true); setPaused(false); setTimeout(() => autoStep(), 10);
  }, [buildSteps, autoStep, resetState]);

  const stepSort = useCallback((arr: number[], partMethod: PartitionMethod, pivotStrat: PivotStrategy) => {
    if (!arr.length) return;
    if (!runningRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current); resetState();
      setPartitionMethod(partMethod); setPivotStrategy(pivotStrat);
      stepsRef.current = buildSteps(arr, partMethod, pivotStrat);
      setTreeLevels(treeLevelsRef.current); setParentMap(parentMapRef.current);
      stepIdxRef.current = 0; runningRef.current = true; pausedRef.current = true;
      setRunning(true); setPaused(true);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    pausedRef.current = true; setPaused(true);
    if (stepIdxRef.current >= stepsRef.current.length) {
      runningRef.current = false; setRunning(false); setPaused(false); return;
    }
    applyStep(stepsRef.current[stepIdxRef.current]); stepIdxRef.current++;
  }, [buildSteps, applyStep, resetState]);

  const togglePause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current; setPaused(pausedRef.current);
    if (!pausedRef.current) autoStep(); else if (timerRef.current) clearTimeout(timerRef.current);
  }, [autoStep]);

  const resetSort = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runningRef.current = false; pausedRef.current = false;
    stepsRef.current = []; stepIdxRef.current = 0;
    setRunning(false); setPaused(false); resetState();
  }, [resetState]);

  return {
    running, paused, array: arrayState, activeRange,
    partitionedRanges, sortedRangesMap, pivotMap, snapshotMap, qsAnim,
    treeLevels, parentMap, activeStepIdx, logEntries,
    partitionMethod, pivotStrategy,
    startSort, stepSort, togglePause, resetSort,
    setSpeed: useCallback((s: number) => { speedRef.current = s; }, []),
  };
}
