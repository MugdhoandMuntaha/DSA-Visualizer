import { useState, useRef } from "react";

export type FkItem = {
  id: number;
  weight: number;
  value: number;
  ratio: number;
  fractionTaken: number; // 0 to 1
  ratioCalculated?: boolean;
};

export type FkState = {
  items: FkItem[];
  sortedItems: FkItem[];
  capacity: number;
  currentWeight: number;
  totalProfit: number;
  currentIndex: number;
  phase: "input" | "calculating_ratios" | "sorting" | "traversing" | "done";
  logs: string[];
  activeCodeLine: number | null;
  fractionCalculation: string | null; // For the 'otherwise' case
};

export const FK_CODES = [
  "#include <bits/stdc++.h>",
  "using namespace std;",
  "struct Item {",
  "    int id;",
  "    double weight;",
  "    double profit;",
  "    double ratio;",
  "};",
  "bool compare(Item a, Item b) {",
  "    return a.ratio > b.ratio;",
  "}",
  "void fractionalKnapsack(vector<Item>& items, double capacity) {",
  "    for (auto &item : items) {",
  "        item.ratio = item.profit / item.weight;",
  "    }",
  "    sort(items.begin(), items.end(), compare);",
  "    double totalProfit = 0.0;",
  "    cout << \"Selected Items:\\n\";",
  "    for (auto item : items) {",
  "        if (capacity >= item.weight) {",
  "            capacity -= item.weight;",
  "            totalProfit += item.profit;",
  "            cout << \"Item \" << item.id << \" (Full)\\n\";",
  "        } else {",
  "            totalProfit += capacity * item.ratio;",
  "            cout << \"Item \" << item.id << \" (Fractional)\\n\";",
  "            capacity = 0;",
  "            break;",
  "        }",
  "    }",
  "    cout << \"Total Profit: \" << totalProfit << endl;",
  "}",
  "int main() {",
  "    vector<Item> items = {{1,10,60,0},{2,20,100,0},{3,30,120,0}};",
  "    double capacity = 50.0;",
  "    fractionalKnapsack(items, capacity);",
  "    return 0;",
  "}"
];

export function useFractionalKnapsack() {
  const [state, setState] = useState<FkState>({
    items: [],
    sortedItems: [],
    capacity: 0,
    currentWeight: 0,
    totalProfit: 0,
    currentIndex: -1,
    phase: "input",
    logs: ["Waiting for input..."],
    activeCodeLine: null,
    fractionCalculation: null,
  });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const speedRef = useRef(5);
  const framesRef = useRef<FkState[]>([]);
  const frameIdxRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const setSpeed = (s: number) => { speedRef.current = s; };

  const getDelay = () => Math.max(100, 2000 - (speedRef.current * 180));

  const runAnimation = () => {
    if (frameIdxRef.current >= framesRef.current.length) {
      setRunning(false);
      setPaused(false);
      return;
    }
    setState(framesRef.current[frameIdxRef.current]);
    frameIdxRef.current++;
    timerRef.current = setTimeout(runAnimation, getDelay());
  };

  const pause = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPaused(true);
  };

  const resume = () => {
    setPaused(false);
    runAnimation();
  };

  const reset = (initialItems: Omit<FkItem, "ratio" | "fractionTaken">[], cap: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(false);
    setPaused(false);
    framesRef.current = [];
    frameIdxRef.current = 0;

    const items = initialItems.map(i => ({ ...i, ratio: 0, fractionTaken: 0 }));

    setState({
      items,
      sortedItems: [],
      capacity: cap,
      currentWeight: 0,
      totalProfit: 0,
      currentIndex: -1,
      phase: "input",
      logs: ["Ready to start."],
      activeCodeLine: null,
      fractionCalculation: null,
    });
  };

  const generateFrames = (initialItems: Omit<FkItem, "ratio" | "fractionTaken" | "ratioCalculated">[], cap: number) => {
    const frames: FkState[] = [];
    let items = initialItems.map(i => ({ ...i, ratio: i.value / i.weight, fractionTaken: 0, ratioCalculated: false }));
    let logs: string[] = ["Started Fractional Knapsack Algorithm."];
    
    const pushFrame = (updates: Partial<FkState>) => {
      const prevFrame = frames.length > 0 ? frames[frames.length - 1] : {};
      frames.push({
        sortedItems: [], // will be filled
        capacity: cap,
        currentWeight: 0,
        totalProfit: 0,
        currentIndex: -1,
        phase: "input",
        logs: [...logs],
        activeCodeLine: null,
        fractionCalculation: null,
        ...prevFrame,
        items: JSON.parse(JSON.stringify(items)),
        ...updates
      } as FkState);
    };

    pushFrame({ phase: "calculating_ratios", activeCodeLine: 12, logs: [...logs, "Calculating value/weight ratio for each item."] });

    for (let i = 0; i < items.length; i++) {
      logs.push(`Item ${items[i].id}: Ratio = ${items[i].value} / ${items[i].weight} = ${items[i].ratio.toFixed(2)}`);
      items[i].ratioCalculated = true;
      pushFrame({
        items: JSON.parse(JSON.stringify(items)),
        currentIndex: i,
        activeCodeLine: 13,
        logs: [...logs]
      });
    }

    pushFrame({ phase: "calculating_ratios", currentIndex: -1, activeCodeLine: 14, logs: [...logs, "All ratios calculated."] });

    // Step 2: Sort
    logs.push("Sorting items by ratio in descending order.");
    pushFrame({ phase: "sorting", activeCodeLine: 15, logs: [...logs] });
    
    let fullySortedItems = [...items].sort((a, b) => b.ratio - a.ratio);
    let currentSorted: FkItem[] = [];
    
    for (let i = 0; i < fullySortedItems.length; i++) {
      currentSorted.push(fullySortedItems[i]);
      pushFrame({ 
        phase: "sorting", 
        sortedItems: JSON.parse(JSON.stringify(currentSorted)), 
        activeCodeLine: 15, 
        logs: [...logs, `Placed Item ${fullySortedItems[i].id} (Ratio: ${fullySortedItems[i].ratio.toFixed(2)}) in sorted position ${i + 1}.`] 
      });
    }

    // Step 3: Initialize
    logs.push("Initializing variables.");
    let cw = 0;
    let tp = 0;
    let sortedItems = currentSorted; // Restore sortedItems reference
    pushFrame({ phase: "traversing", sortedItems: JSON.parse(JSON.stringify(sortedItems)), currentWeight: cw, totalProfit: tp, activeCodeLine: 16, logs: [...logs] });

    // Step 4: Traverse
    pushFrame({ phase: "traversing", activeCodeLine: 18, logs: [...logs, "Traversing sorted items."] });

    for (let i = 0; i < sortedItems.length; i++) {
      let item = sortedItems[i];
      pushFrame({ currentIndex: i, activeCodeLine: 19, logs: [...logs, `Checking item ${item.id} (Weight: ${item.weight}, Value: ${item.value}, Ratio: ${item.ratio.toFixed(2)}).`] });

      if (cw + item.weight <= cap) {
        // Take entire item
        cw += item.weight;
        tp += item.value;
        sortedItems[i].fractionTaken = 1;
        logs.push(`Item ${item.id} fits entirely. Taking it.`);
        pushFrame({
          sortedItems: JSON.parse(JSON.stringify(sortedItems)),
          currentWeight: cw,
          totalProfit: tp,
          activeCodeLine: 20,
          logs: [...logs]
        });
        pushFrame({ activeCodeLine: 21 });
      } else {
        // Take fraction
        let remaining = cap - cw;
        let frac = remaining / item.weight;
        let fracProfit = frac * item.value;
        cw += remaining; // cw becomes cap
        tp += fracProfit;
        sortedItems[i].fractionTaken = frac;
        logs.push(`Item ${item.id} doesn't fit entirely. Taking fraction ${remaining}/${item.weight}.`);
        pushFrame({
          sortedItems: JSON.parse(JSON.stringify(sortedItems)),
          activeCodeLine: 23,
          logs: [...logs]
        });
        
        let fractionCalcStr = `Remaining Capacity: ${remaining}\\nItem Weight: ${item.weight}\\nFraction = ${remaining}/${item.weight} = ${frac.toFixed(2)}\\nFraction Profit = ${frac.toFixed(2)} * ${item.value} = ${fracProfit.toFixed(2)}`;
        
        pushFrame({
          currentWeight: cw,
          totalProfit: tp,
          activeCodeLine: 24,
          fractionCalculation: fractionCalcStr,
          logs: [...logs]
        });
        pushFrame({ activeCodeLine: 26 });
        pushFrame({ activeCodeLine: 27, logs: [...logs, "Knapsack full. Breaking out of loop."] });
        break;
      }
    }

    logs.push(`Process complete. Maximum Profit: ${tp.toFixed(2)}`);
    pushFrame({ phase: "done", activeCodeLine: 30, logs: [...logs], currentIndex: -1, fractionCalculation: null });

    framesRef.current = frames;
    frameIdxRef.current = 0;
    setRunning(true);
    setPaused(false);
    runAnimation();
  };

  return { state, running, paused, setSpeed, generateFrames, pause, resume, reset };
}
