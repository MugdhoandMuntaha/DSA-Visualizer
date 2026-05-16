"use client";
import { useState, useCallback, useRef } from "react";

export interface BlockItem { val: number; id: string; }

export type BlockPhase = "init" | "sort-blocks" | "order-blocks" | "merge-blocks" | "done";

export interface BlockSortState {
  arr: BlockItem[];
  blockSize: number;
  blocks: { start: number; end: number }[];
  phase: BlockPhase;
  activeBlock: number | null;
  
  // Sub-pointers
  insI: number | null;
  insJ: number | null;
  blockI: number | null;
  blockJ: number | null;
  mergeLeft: number | null;
  mergeRight: number | null;

  msg: string;
  type: string;
}

export function useBlockSort(initialArray: number[]) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentState, setCurrentState] = useState<BlockSortState | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<{ type: string; msg: string }[]>([]);

  const stepsRef = useRef<BlockSortState[]>([]);
  const stepIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);

  const toItem = (arr: number[]) => arr.map((v, i) => ({ val: v, id: `bs-${i}` }));
  const getDelay = () => 1800 - (speedRef.current - 1) * 170;

  const buildSteps = useCallback((arr: number[]) => {
    const steps: BlockSortState[] = [];
    const a: BlockItem[] = toItem(arr);
    const n = a.length;
    if (n === 0) return steps;

    // Use block size sqrt(N) or similar. For N=16, B=4
    const B = Math.max(2, Math.floor(Math.sqrt(n)));
    
    const blocks: { start: number; end: number }[] = [];
    for (let i = 0; i < n; i += B) {
      blocks.push({ start: i, end: Math.min(i + B - 1, n - 1) });
    }

    const mk = (
      type: string, phase: BlockPhase, msg: string,
      arr: BlockItem[], curBlocks: { start: number; end: number }[],
      activeBlock: number | null = null,
      insI: number | null = null, insJ: number | null = null,
      blockI: number | null = null, blockJ: number | null = null,
      mergeLeft: number | null = null, mergeRight: number | null = null
    ): BlockSortState => ({
      arr: [...arr], blockSize: B, blocks: [...curBlocks], phase, activeBlock,
      insI, insJ, blockI, blockJ, mergeLeft, mergeRight, msg, type
    });

    steps.push(mk("init", "init",
      `Initialize Block Sort. Array size ${n}. Block size B = ${B}. Total ${blocks.length} blocks.`,
      a, blocks));

    // Phase 1: Sort each block individually using Insertion Sort
    for (let b = 0; b < blocks.length; b++) {
      const { start, end } = blocks[b];
      steps.push(mk("block-sort-start", "sort-blocks",
        `Phase 1: Sort Block ${b} [${start}..${end}].`,
        a, blocks, b));

      for (let i = start + 1; i <= end; i++) {
        let key = { ...a[i] };
        let j = i - 1;
        steps.push(mk("ins-extract", "sort-blocks",
          `Extract element ${key.val} at index ${i}.`,
          a, blocks, b, i, j));

        while (j >= start && a[j].val > key.val) {
          steps.push(mk("ins-shift", "sort-blocks",
            `Shift ${a[j].val} to the right.`,
            a, blocks, b, i, j));
          a[j + 1] = { ...a[j] };
          a[j] = { val: key.val, id: `hole-${Math.random()}` }; // prevent duplicate ID glitch
          j--;
        }
        a[j + 1] = key;
        steps.push(mk("ins-place", "sort-blocks",
          `Place element at index ${j + 1}.`,
          a, blocks, b, null, j + 1));
      }
      steps.push(mk("block-sort-done", "sort-blocks",
        `Block ${b} is sorted.`,
        a, blocks, b));
    }

    // Phase 2: Order blocks by their first element (Selection sort of blocks)
    // Conceptually, in a full block sort, we tag blocks or use a buffer.
    // For visualization, we just swap entire blocks to order them.
    steps.push(mk("order-start", "order-blocks",
      `Phase 2: Order all blocks globally based on their first element.`,
      a, blocks));

    for (let i = 0; i < blocks.length - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < blocks.length; j++) {
        steps.push(mk("block-compare", "order-blocks",
          `Compare Block ${minIdx} (starts with ${a[blocks[minIdx].start].val}) and Block ${j} (starts with ${a[blocks[j].start].val}).`,
          a, blocks, null, null, null, minIdx, j));
        
        if (a[blocks[j].start].val < a[blocks[minIdx].start].val) {
          minIdx = j;
        }
      }

      if (minIdx !== i) {
        steps.push(mk("block-swap-start", "order-blocks",
          `Block ${minIdx} is smaller. Swap Block ${i} and Block ${minIdx}.`,
          a, blocks, null, null, null, i, minIdx));
        
        // Swap entire blocks
        // Since blocks might have different sizes (e.g. the last one), we swap them in the array,
        // but wait! If they have different sizes, array shifting is needed.
        // For simplicity, we just extract, shift and insert to swap.
        const blockI = a.slice(blocks[i].start, blocks[i].end + 1);
        const blockMin = a.slice(blocks[minIdx].start, blocks[minIdx].end + 1);
        
        // Remove both blocks and reinsert
        // Wait, shifting sub-arrays in place correctly:
        // Actually, just standard array splice is easiest to get the final state,
        // then we update the `a` array.
        const tempA = [...a];
        const removedMin = tempA.splice(blocks[minIdx].start, blocks[minIdx].end - blocks[minIdx].start + 1);
        const removedI = tempA.splice(blocks[i].start, blocks[i].end - blocks[i].start + 1);
        
        // Re-insert into tempA
        // Since we removed Min (which is after I), and then I, the array shrunk.
        // Let's do it safely:
        let newA: BlockItem[] = [];
        for(let bIdx = 0; bIdx < blocks.length; bIdx++) {
           if (bIdx === i) newA.push(...blockMin);
           else if (bIdx === minIdx) newA.push(...blockI);
           else newA.push(...a.slice(blocks[bIdx].start, blocks[bIdx].end + 1));
        }
        for(let k=0; k<n; k++) a[k] = newA[k];

        // Recompute block boundaries since sizes might have swapped
        let cur = 0;
        for(let bIdx = 0; bIdx < blocks.length; bIdx++) {
           const size = (bIdx === i) ? blockMin.length : (bIdx === minIdx) ? blockI.length : (blocks[bIdx].end - blocks[bIdx].start + 1);
           blocks[bIdx] = { start: cur, end: cur + size - 1 };
           cur += size;
        }

        steps.push(mk("block-swapped", "order-blocks",
          `Blocks swapped.`,
          a, blocks, null, null, null, i, minIdx));
      }
    }

    steps.push(mk("merge-start", "merge-blocks",
      `Phase 3: Merge adjacent sorted blocks.`,
      a, blocks));

    // Phase 3: Merge adjacent blocks progressively
    let currentBlocks = [...blocks];
    while (currentBlocks.length > 1) {
      const nextBlocks: { start: number; end: number }[] = [];
      for (let i = 0; i < currentBlocks.length; i += 2) {
        if (i + 1 < currentBlocks.length) {
          const b1 = currentBlocks[i];
          const b2 = currentBlocks[i+1];
          steps.push(mk("merge-compare", "merge-blocks",
            `Merge Block [${b1.start}..${b1.end}] and Block [${b2.start}..${b2.end}].`,
            a, currentBlocks, null, null, null, null, null, b1.start, b2.end));
          
          // Merge
          const len1 = b1.end - b1.start + 1;
          const len2 = b2.end - b2.start + 1;
          const L = a.slice(b1.start, b1.end + 1);
          const R = a.slice(b2.start, b2.end + 1);
          let p1 = 0, p2 = 0, k = b1.start;

          while (p1 < len1 && p2 < len2) {
            if (L[p1].val <= R[p2].val) {
              a[k] = { ...L[p1], id: `m-l-${Math.random()}` }; p1++;
            } else {
              a[k] = { ...R[p2], id: `m-r-${Math.random()}` }; p2++;
            }
            k++;
            steps.push(mk("merge-place", "merge-blocks",
              `Placed ${a[k-1].val} into merged block.`,
              a, currentBlocks, null, null, null, null, null, b1.start, b2.end));
          }
          while (p1 < len1) { a[k++] = { ...L[p1++], id: `m-l-rem-${Math.random()}` }; }
          while (p2 < len2) { a[k++] = { ...R[p2++], id: `m-r-rem-${Math.random()}` }; }

          nextBlocks.push({ start: b1.start, end: b2.end });
        } else {
          nextBlocks.push(currentBlocks[i]);
        }
      }
      currentBlocks = nextBlocks;
      steps.push(mk("merge-pass-done", "merge-blocks",
        `Pass complete. Remaining blocks: ${currentBlocks.length}.`,
        a, currentBlocks));
    }

    steps.push(mk("done", "done",
      `✓ Block Sort complete. Array fully sorted.`,
      a, currentBlocks));

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
