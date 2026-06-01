import { ReactNode } from "react";

export interface AlgoCardProps {
  title: string;
  description: string;
  complexity: string;
  href: string;
  color: string;
  icon: ReactNode;
  available: boolean;
}

export const CATEGORIZED_ALGORITHMS = [
  {
    category: "Graph Algorithms",
    slug: "graph-algorithms",
    color: "#8b5cf6", // Purple
    icon: <svg width="32" height="32" viewBox="0 0 28 28" fill="none"><circle cx="6" cy="14" r="3.5" fill="#fff"/><circle cx="22" cy="6" r="3.5" fill="#fff"/><circle cx="22" cy="22" r="3.5" fill="#fff"/><line x1="9" y1="13" x2="19" y2="7" stroke="#fff" strokeWidth="2" opacity="0.9"/><line x1="9" y1="15" x2="19" y2="21" stroke="#fff" strokeWidth="2" opacity="0.9"/><line x1="22" y1="9.5" x2="22" y2="18.5" stroke="#fff" strokeWidth="2" opacity="0.9"/></svg>,
    algorithms: [
      {
        title: "BFS", description: "Explore graphs level by level. See the queue grow and nodes get visited in breadth-first order.",
        complexity: "O(V+E)", href: "/bfs", color: "#3b82f6", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="6" r="3" fill="#fff"/><circle cx="6" cy="18" r="3" fill="#fff"/><circle cx="22" cy="18" r="3" fill="#fff"/><line x1="14" y1="9" x2="6" y2="15" stroke="#fff" strokeWidth="1.5"/><line x1="14" y1="9" x2="22" y2="15" stroke="#fff" strokeWidth="1.5"/></svg>,
      },
      {
        title: "Dijkstra's", description: "Find the shortest weighted paths from a source. Watch edge relaxation and the priority queue in action.",
        complexity: "O((V+E)logV)", href: "/dijkstra", color: "#8b5cf6", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="4" cy="14" r="3" fill="#fff"/><circle cx="24" cy="14" r="3" fill="#fff"/><circle cx="14" cy="4" r="3" fill="#fff"/><line x1="7" y1="13" x2="21" y2="13" stroke="#fff" strokeWidth="1.5"/><line x1="6" y1="12" x2="12" y2="6" stroke="#fff" strokeWidth="1.5"/><text x="14" y="22" fill="#fff" fontSize="7" fontWeight="700" textAnchor="middle">w</text></svg>,
      },
      {
        title: "DFS", description: "Explore as far as possible before backtracking. Watch the stack-based traversal unfold.",
        complexity: "O(V+E)", href: "/dfs", color: "#10b981", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="4" r="3" fill="#fff"/><circle cx="14" cy="14" r="3" fill="#fff"/><circle cx="14" cy="24" r="3" fill="#fff"/><line x1="14" y1="7" x2="14" y2="11" stroke="#fff" strokeWidth="1.5"/><line x1="14" y1="17" x2="14" y2="21" stroke="#fff" strokeWidth="1.5"/></svg>,
      },
      {
        title: "A* Search", description: "Heuristic-guided pathfinding combining best of Dijkstra's and greedy search.",
        complexity: "O(E)", href: "/astar", color: "#f59e0b", available: false,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><polygon points="14,2 17,11 26,11 19,17 21,26 14,21 7,26 9,17 2,11 11,11" fill="#fff" opacity="0.9"/></svg>,
      },
      {
        title: "Bellman-Ford", description: "Handle negative edge weights. Detect negative cycles in weighted directed graphs.",
        complexity: "O(V·E)", href: "/bellman-ford", color: "#ef4444", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="6" cy="14" r="3" fill="#fff"/><circle cx="22" cy="6" r="3" fill="#fff"/><circle cx="22" cy="22" r="3" fill="#fff"/><path d="M9 13 L19 7" stroke="#fff" strokeWidth="1.5"/><path d="M9 15 L19 21" stroke="#fff" strokeWidth="1.5"/><text x="22" y="15" fill="#fff" fontSize="8" fontWeight="700" textAnchor="middle">−</text></svg>,
      },
      {
        title: "Floyd-Warshall", description: "Compute all-pairs shortest paths. Watch the 2D distance matrix evolve dynamically.",
        complexity: "O(V³)", href: "/floyd-warshall", color: "#d946ef", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="4" width="8" height="8" rx="1" stroke="#fff" strokeWidth="1.5"/><rect x="16" y="4" width="8" height="8" rx="1" fill="#fff" opacity="0.5"/><rect x="4" y="16" width="8" height="8" rx="1" fill="#fff"/><rect x="16" y="16" width="8" height="8" rx="1" stroke="#fff" strokeWidth="1.5"/></svg>,
      },
      {
        title: "Kruskal's MST", description: "Build minimum spanning trees greedily. Watch Union-Find data structure in action.",
        complexity: "O(ElogE)", href: "/kruskal", color: "#0891b2", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="4" r="2.5" fill="#fff"/><circle cx="4" cy="24" r="2.5" fill="#fff"/><circle cx="24" cy="24" r="2.5" fill="#fff"/><circle cx="14" cy="16" r="2.5" fill="#fff"/><line x1="14" y1="6.5" x2="14" y2="13.5" stroke="#fff" strokeWidth="2"/><line x1="12" y1="17.5" x2="6" y2="22.5" stroke="#fff" strokeWidth="2"/><line x1="16" y1="17.5" x2="22" y2="22.5" stroke="#fff" strokeWidth="2"/></svg>,
      },
      {
        title: "Prim's MST", description: "Grow a minimum spanning tree from a source node using a priority queue.",
        complexity: "O((V+E)logV)", href: "/prim", color: "#059669", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="3" fill="#fff"/><circle cx="6" cy="6" r="3" fill="#fff"/><circle cx="22" cy="22" r="3" fill="#fff"/><circle cx="6" cy="22" r="2" stroke="#fff" strokeWidth="1.5"/><line x1="8.5" y1="8.5" x2="11.5" y2="11.5" stroke="#fff" strokeWidth="2"/><line x1="16.5" y1="16.5" x2="19.5" y2="19.5" stroke="#fff" strokeWidth="2"/></svg>,
      },
    ]
  },
  {
    category: "Searching & Sorting",
    slug: "searching-sorting",
    color: "#f59e0b", // Orange
    icon: <svg width="32" height="32" viewBox="0 0 28 28" fill="none"><rect x="4" y="10" width="6" height="8" rx="1" fill="#fff" opacity="0.6"/><rect x="11" y="8" width="6" height="12" rx="1" fill="#fff"/><rect x="18" y="12" width="6" height="4" rx="1" fill="#fff" opacity="0.4"/></svg>,
    algorithms: [
      {
        title: "Bubble Sort", description: "Repeatedly step through the list, compare adjacent elements and swap them if they are in the wrong order.",
        complexity: "O(N²)", href: "/bubble-sort", color: "#f43f5e", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="16" width="4" height="8" rx="1" fill="#fff" opacity="0.4"/><rect x="10" y="8" width="4" height="16" rx="1" fill="#fff"/><rect x="16" y="12" width="4" height="12" rx="1" fill="#fff" opacity="0.8"/><rect x="22" y="20" width="4" height="4" rx="1" fill="#fff" opacity="0.3"/></svg>,
      },
      {
        title: "Insertion Sort", description: "Build the sorted array one element at a time by inserting each into its correct position.",
        complexity: "O(N²)", href: "/insertion-sort", color: "#8b5cf6", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="18" width="4" height="6" rx="1" fill="#fff" opacity="0.5"/><rect x="10" y="10" width="4" height="14" rx="1" fill="#fff"/><rect x="16" y="14" width="4" height="10" rx="1" fill="#fff" opacity="0.7"/><path d="M22 6 L22 16 M20 8 L22 6 L24 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
      {
        title: "Binary Insertion Sort", description: "Insertion Sort enhanced with Binary Search to find the insertion point in O(log N) comparisons per pass.",
        complexity: "O(N log N) cmps", href: "/binary-insertion-sort", color: "#a78bfa", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="18" width="4" height="6" rx="1" fill="#fff" opacity="0.5"/><rect x="10" y="10" width="4" height="14" rx="1" fill="#fff"/><line x1="16" y1="8" x2="24" y2="8" stroke="#fff" strokeWidth="1.5"/><line x1="20" y1="4" x2="20" y2="12" stroke="#fff" strokeWidth="1.5"/><rect x="16" y="14" width="8" height="10" rx="1" fill="#fff" opacity="0.4"/></svg>,
      },
      {
        title: "Selection Sort", description: "In-place comparison sort. Divides array into a sorted and an unsorted region, repeatedly selecting the minimum.",
        complexity: "O(N²)", href: "/selection-sort", color: "#ec4899", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="10" width="4" height="14" rx="1" fill="#fff" opacity="0.4"/><rect x="10" y="18" width="4" height="6" rx="1" fill="#fff" opacity="0.4"/><rect x="16" y="6" width="4" height="18" rx="1" fill="#fff" opacity="0.8"/><rect x="22" y="14" width="4" height="10" rx="1" fill="#fff" opacity="0.4"/></svg>,
      },
      {
        title: "Linear Search", description: "Sequentially check each element of the array until a match is found or the whole array has been searched.",
        complexity: "O(N)", href: "/linear-search", color: "#14b8a6", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="12" width="4" height="4" rx="1" fill="#fff" opacity="0.4"/><rect x="10" y="12" width="4" height="4" rx="1" fill="#fff" opacity="0.4"/><rect x="16" y="12" width="4" height="4" rx="1" fill="#fff"/><rect x="22" y="12" width="4" height="4" rx="1" fill="#fff" opacity="0.4"/></svg>,
      },
      {
        title: "Binary Search", description: "Efficiently find an element in a sorted array by repeatedly dividing the search interval in half.",
        complexity: "O(logN)", href: "/binary-search", color: "#0ea5e9", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="10" width="20" height="8" rx="2" stroke="#fff" strokeWidth="1.5"/><line x1="14" y1="10" x2="14" y2="18" stroke="#fff" strokeWidth="1.5"/><circle cx="9" cy="14" r="1.5" fill="#fff"/></svg>,
      },
      {
        title: "Merge Sort", description: "Divide and conquer algorithm that splits arrays into smaller halves, sorts them, and merges them back.",
        complexity: "O(NlogN)", href: "/merge-sort", color: "#eab308", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4 L6 12 M14 4 L22 12 M6 16 L14 24 M22 16 L14 24" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
      {
        title: "Quick Sort", description: "Efficient, in-place sorting algorithm utilizing a pivot to partition arrays.",
        complexity: "O(NlogN)", href: "/quick-sort", color: "#ec4899", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="10" width="6" height="8" rx="1" fill="#fff" opacity="0.6"/><rect x="11" y="8" width="6" height="12" rx="1" fill="#fff"/><rect x="18" y="12" width="6" height="4" rx="1" fill="#fff" opacity="0.4"/></svg>,
      },
      {
        title: "Counting Sort", description: "Non-comparative sorting algorithm. Visualize the frequency and prefix sum arrays in real time.",
        complexity: "O(N+K)", href: "/counting-sort", color: "#14b8a6", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="6" width="20" height="4" rx="1" fill="#fff" opacity="0.5"/><rect x="4" y="12" width="20" height="4" rx="1" fill="#fff" opacity="0.8"/><rect x="4" y="18" width="20" height="4" rx="1" fill="#fff"/></svg>,
      },
      {
        title: "Radix Sort", description: "Non-comparative LSD Radix Sort. Watch elements scatter into 10 digit buckets and collect back each pass.",
        complexity: "O(N·K)", href: "/radix-sort", color: "#f59e0b", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="16" width="3" height="8" rx="1" fill="#fff" opacity="0.4"/><rect x="7" y="12" width="3" height="12" rx="1" fill="#fff" opacity="0.6"/><rect x="11" y="8" width="3" height="16" rx="1" fill="#fff" opacity="0.8"/><rect x="15" y="4" width="3" height="20" rx="1" fill="#fff"/><rect x="19" y="10" width="3" height="14" rx="1" fill="#fff" opacity="0.6"/><rect x="23" y="14" width="3" height="10" rx="1" fill="#fff" opacity="0.4"/></svg>,
      },
      {
        title: "Bucket Sort", description: "Distribution sort that scatters elements into range-based buckets, sorts each with Insertion Sort, then concatenates.",
        complexity: "O(N + K)", href: "/bucket-sort", color: "#a78bfa", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="10" width="5" height="14" rx="1" stroke="#fff" strokeWidth="1.5" opacity="0.5"/><rect x="10" y="8" width="5" height="16" rx="1" stroke="#fff" strokeWidth="1.5" opacity="0.8"/><rect x="17" y="12" width="5" height="12" rx="1" stroke="#fff" strokeWidth="1.5" opacity="0.5"/><rect x="5" y="14" width="2" height="4" rx="0.5" fill="#fff" opacity="0.6"/><rect x="12" y="11" width="2" height="7" rx="0.5" fill="#fff"/><rect x="19" y="15" width="2" height="3" rx="0.5" fill="#fff" opacity="0.6"/></svg>,
      },
      {
        title: "Pigeonhole Sort", description: "Distribution sort using one hole per unique value. Ideal for small-range integers with many duplicates.",
        complexity: "O(N + Range)", href: "/pigeonhole-sort", color: "#34d399", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="6" width="5" height="18" rx="1" stroke="#fff" strokeWidth="1.5" opacity="0.6"/><rect x="10" y="6" width="5" height="18" rx="1" stroke="#fff" strokeWidth="1.5" opacity="0.8"/><rect x="17" y="6" width="5" height="18" rx="1" stroke="#fff" strokeWidth="1.5" opacity="0.6"/><circle cx="5.5" cy="13" r="1.5" fill="#fff" opacity="0.9"/><circle cx="12.5" cy="10" r="1.5" fill="#fff"/><circle cx="12.5" cy="15" r="1.5" fill="#fff"/><circle cx="19.5" cy="13" r="1.5" fill="#fff" opacity="0.9"/></svg>,
      },
      {
        title: "Tim Sort", description: "Hybrid sorting algorithm combining Merge Sort and Insertion Sort. Used in Python and Java standard libraries.",
        complexity: "O(N log N)", href: "/tim-sort", color: "#6366f1", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="6" width="6" height="6" rx="1" stroke="#fff" strokeWidth="1.5"/><rect x="4" y="16" width="6" height="6" rx="1" stroke="#fff" strokeWidth="1.5"/><rect x="18" y="11" width="6" height="6" rx="1" stroke="#fff" strokeWidth="1.5"/><path d="M10 9 L14 9 L14 14 L18 14 M10 19 L14 19 L14 14" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
      {
        title: "Intro Sort", description: "Introspective Sort: starts with Quick Sort, switches to Heap Sort if recursion depth gets too deep. Used in C++ std::sort.",
        complexity: "O(N log N)", href: "/intro-sort", color: "#8b5cf6", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4 L6 10 L6 22 L22 22 L22 10 Z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 4 L14 14" stroke="#fff" strokeWidth="1.5"/><circle cx="14" cy="16" r="2" fill="#fff" opacity="0.8"/></svg>,
      },
      {
        title: "Block Sort", description: "O(1) space, stable block-merge sort algorithm. Divides the array into chunks, locally sorts, orders blocks, and merges them.",
        complexity: "O(N log N)", href: "/block-sort", color: "#ec4899", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="6" width="8" height="6" rx="1" stroke="#fff" strokeWidth="1.5"/><rect x="16" y="6" width="8" height="6" rx="1" stroke="#fff" strokeWidth="1.5"/><rect x="4" y="16" width="8" height="6" rx="1" stroke="#fff" strokeWidth="1.5"/><rect x="16" y="16" width="8" height="6" rx="1" stroke="#fff" strokeWidth="1.5"/></svg>,
      },
      {
        title: "Spreadsort", description: "Hybrid sorting algorithm blending distribution-based sorting (bucket sort) with comparison-based sorting (quick/insertion).",
        complexity: "O(N log N)", href: "/spreadsort", color: "#f97316", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 6 L14 22 M8 10 L8 22 M20 14 L20 22 M5 6 L23 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="6" r="1.5" fill="#fff"/><circle cx="8" cy="10" r="1.5" fill="#fff"/><circle cx="20" cy="14" r="1.5" fill="#fff"/></svg>,
      },
    ]
  },
  {
    category: "Linear Data Structures",
    slug: "linear-data-structures",
    color: "#14b8a6", // Teal
    icon: <svg width="32" height="32" viewBox="0 0 28 28" fill="none"><rect x="4" y="10" width="6" height="8" rx="1" stroke="#fff" strokeWidth="2"/><rect x="18" y="10" width="6" height="8" rx="1" stroke="#fff" strokeWidth="2"/><path d="M10 14 L16 14 M16 14 L14 12 M16 14 L14 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    algorithms: [
      {
        title: "Linked List", description: "Interactive playground for 18+ Advanced Linked List Algorithms including Reversals, Cycles, Palindromes, and Merge Sorts.",
        complexity: "O(N)", href: "/linked-list", color: "#14b8a6", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="10" width="6" height="8" rx="1" stroke="#fff" strokeWidth="1.5"/><rect x="18" y="10" width="6" height="8" rx="1" stroke="#fff" strokeWidth="1.5"/><path d="M10 14 L16 14 M16 14 L14 12 M16 14 L14 16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
      {
        title: "LL Merge Sort", description: "Merge Sort on Linked List with full divide & merge tree visualization. Watch slow/fast pointer splitting and sorted merging.",
        complexity: "O(NlogN)", href: "/ll-merge-sort", color: "#eab308", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="6" cy="14" r="3" stroke="#fff" strokeWidth="1.5"/><circle cx="22" cy="14" r="3" stroke="#fff" strokeWidth="1.5"/><path d="M9 14 L19 14 M19 14 L17 12 M19 14 L17 16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 4 L6 10 M14 4 L22 10 M6 18 L14 24 M22 18 L14 24" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/></svg>,
      },
      {
        title: "Stack & Queue", description: "LIFO and FIFO operations. Watch elements get pushed, popped, enqueued, and dequeued.",
        complexity: "O(1)", href: "/stack-queue", color: "#f43f5e", available: false,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M8 6 L8 22 L20 22 L20 6" stroke="#fff" strokeWidth="1.5"/><rect x="10" y="16" width="8" height="4" fill="#fff"/><rect x="10" y="10" width="8" height="4" fill="#fff" opacity="0.5"/></svg>,
      },
    ]
  },
  {
    category: "Trees",
    slug: "trees",
    color: "#22c55e", // Green
    icon: <svg width="32" height="32" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="6" r="3.5" fill="#fff"/><circle cx="8" cy="16" r="3.5" fill="#fff"/><circle cx="20" cy="16" r="3.5" fill="#fff"/><line x1="14" y1="9.5" x2="8" y2="12.5" stroke="#fff" strokeWidth="2"/><line x1="14" y1="9.5" x2="20" y2="12.5" stroke="#fff" strokeWidth="2"/></svg>,
    algorithms: [
      {
        title: "Binary Search Tree", description: "Watch insertions, deletions, and traversals (In-order, Pre-order, Post-order) on a BST.",
        complexity: "O(logN)", href: "/bst", color: "#22c55e", available: false,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="6" r="3" fill="#fff"/><circle cx="8" cy="14" r="3" fill="#fff"/><circle cx="20" cy="14" r="3" fill="#fff"/><circle cx="5" cy="22" r="3" fill="#fff"/><line x1="14" y1="9" x2="8" y2="11" stroke="#fff" strokeWidth="1.5"/><line x1="14" y1="9" x2="20" y2="11" stroke="#fff" strokeWidth="1.5"/><line x1="8" y1="17" x2="5" y2="19" stroke="#fff" strokeWidth="1.5"/></svg>,
      },
    ]
  },
  {
    category: "Dynamic Programming",
    slug: "dynamic-programming",
    color: "#e11d48", // Rose
    icon: <svg width="32" height="32" viewBox="0 0 28 28" fill="none"><rect x="4" y="4" width="5" height="5" rx="1" fill="#fff" opacity="0.4"/><rect x="11" y="4" width="5" height="5" rx="1" fill="#fff" opacity="0.6"/><rect x="18" y="4" width="5" height="5" rx="1" fill="#fff" opacity="0.8"/><rect x="4" y="11" width="5" height="5" rx="1" fill="#fff" opacity="0.6"/><rect x="11" y="11" width="5" height="5" rx="1" fill="#fff"/><rect x="18" y="11" width="5" height="5" rx="1" fill="#fff" opacity="0.8"/><rect x="4" y="18" width="5" height="5" rx="1" fill="#fff" opacity="0.8"/><rect x="11" y="18" width="5" height="5" rx="1" fill="#fff" opacity="0.8"/><rect x="18" y="18" width="5" height="5" rx="1" fill="#fff"/></svg>,
    algorithms: [
      {
        title: "LCS", description: "Longest Common Subsequence — visualize with Recursion Tree, Memoization, and Tabulation approaches side by side.",
        complexity: "O(M·N)", href: "/lcs", color: "#e11d48", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="4" width="5" height="5" rx="1" fill="#fff" opacity="0.5"/><rect x="11" y="11" width="5" height="5" rx="1" fill="#fff"/><rect x="18" y="18" width="5" height="5" rx="1" fill="#fff" opacity="0.5"/><path d="M9 6.5 L11 8.5 M16 13.5 L18 15.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      },
      {
        title: "Fibonacci", description: "The classic sequence — visualize overlapping subproblems and optimal substructure across Tabulation, Memoization, and Recursion.",
        complexity: "O(N)", href: "/fibonacci", color: "#e11d48", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M6 22 Q14 22 22 14 T6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/><circle cx="6" cy="22" r="2" fill="#fff"/><circle cx="22" cy="14" r="2" fill="#fff"/><circle cx="6" cy="6" r="2" fill="#fff"/></svg>,
      },
      {
        title: "Climbing Stairs", description: "Visualize the number of ways to climb N stairs, bridging physical stairs representation with Fibonacci-like DP.",
        complexity: "O(N)", href: "/climbing-stairs", color: "#e11d48", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M4 24 L10 24 L10 18 L16 18 L16 12 L22 12 L22 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
      },
      {
        title: "Rod Cutting", description: "Maximize profit by cutting a rod into segments. Visualizes an N-ary recursive tree, bounding cuts, and DP tabulation.",
        complexity: "O(N²)", href: "/rod-cutting", color: "#e11d48", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><line x1="4" y1="14" x2="24" y2="14" stroke="#fff" strokeWidth="4" strokeLinecap="round"/><line x1="10" y1="8" x2="10" y2="20" stroke="#fff" strokeWidth="2" strokeDasharray="2 2"/><line x1="18" y1="8" x2="18" y2="20" stroke="#fff" strokeWidth="2" strokeDasharray="2 2"/></svg>,
      },
      {
        title: "Coin Change", description: "Find the total ways to make a target amount using given coin denominations (Unbounded Knapsack).",
        complexity: "O(N * M)", href: "/coin-change", color: "#eab308", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="10" stroke="#fff" strokeWidth="2"/><text x="14" y="18" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">$</text></svg>,
      },
    ]
  },
  {
    category: "Greedy algorithms",
    slug: "greedy",
    color: "#eab308", // Yellow/Gold
    icon: <svg width="32" height="32" viewBox="0 0 28 28" fill="none"><path d="M14 4 L24 10 L24 22 L14 28 L4 22 L4 10 Z" fill="#fff" opacity="0.8"/><circle cx="14" cy="16" r="4" fill="#1e293b"/></svg>,
    algorithms: [
      {
        title: "Fractional Knapsack", description: "Maximize profit by packing items or fractions of items in a knapsack based on value-to-weight ratio.",
        complexity: "O(NlogN)", href: "/fractional-knapsack", color: "#eab308", available: true,
        icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="6" y="8" width="16" height="14" rx="2" stroke="#fff" strokeWidth="2"/><path d="M10 8 V4 H18 V8" stroke="#fff" strokeWidth="2"/><line x1="6" y1="15" x2="22" y2="15" stroke="#fff" strokeWidth="2" strokeDasharray="2 2"/></svg>,
      },
    ]
  }
];
