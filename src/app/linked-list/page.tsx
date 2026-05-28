"use client";
import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, IconButton, Paper, TextField, Slider, Tooltip
} from "@mui/material";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Pause from "@mui/icons-material/Pause";
import RestartAlt from "@mui/icons-material/RestartAlt";
import Header from "@/components/Header";
import { useLinkedList } from "@/hooks/useLinkedList";
import LinkedListVisualizer from "@/components/LinkedListVisualizer";
import { LL_CODES } from "@/lib/llCodes";

export default function LinkedListPage() {
  const ll = useLinkedList();
  const [valInput, setValInput] = useState<string>("10");
  const [posInput, setPosInput] = useState<string>("2");
  const [targetInput, setTargetInput] = useState<string>("15");

  // Initialize with a few nodes on mount
  useEffect(() => {
    ll.initList([15, 5, 20, 10, 25]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOp = (op: string) => {
    if (ll.running) return;
    const val = parseInt(valInput) || 0;
    const pos = parseInt(posInput) || 1;
    const target = parseInt(targetInput) || 0;
    ll.runOperation(op, { val, pos, target });
  };

  const codeSnippet = ll.currentState.activeCodeKey ? LL_CODES[ll.currentState.activeCodeKey] : [];

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header title="Linked List Playground" badge="O(N) Traversal · Pointers Visualizer" />
      
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ─── Left Sidebar (Operations) ─── */}
        <Box sx={{ width: 320, minWidth: 320, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: t => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderRight: 1, borderColor: "rgba(99,102,241,0.15)" }}>
          
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
              Global Inputs
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField label="Value" size="small" value={valInput} onChange={e => setValInput(e.target.value)} disabled={ll.running} sx={{ flex: 1 }} />
              <TextField label="Position" size="small" value={posInput} onChange={e => setPosInput(e.target.value)} disabled={ll.running} sx={{ flex: 1 }} />
            </Box>
            <TextField label="Target Value (For Search/Insert Before)" fullWidth size="small" value={targetInput} onChange={e => setTargetInput(e.target.value)} disabled={ll.running} />
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
              Insertion
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button variant="outlined" size="small" onClick={() => handleOp("insertAtHead")} disabled={ll.running}>Insert at Head (Val)</Button>
              <Button variant="outlined" size="small" onClick={() => handleOp("insertAtTail")} disabled={ll.running}>Insert at Tail (Val)</Button>
              <Button variant="outlined" size="small" onClick={() => handleOp("insertAtPosition")} disabled={ll.running}>Insert at Position (Pos, Val)</Button>
              <Button variant="outlined" size="small" onClick={() => handleOp("insertBeforeValue")} disabled={ll.running}>Insert Before (Target, Val)</Button>
              <Button variant="outlined" size="small" onClick={() => handleOp("insertAfterValue")} disabled={ll.running}>Insert After (Target, Val)</Button>
              <Button variant="outlined" size="small" onClick={() => handleOp("insertSorted")} disabled={ll.running}>Insert in Sorted List (Val)</Button>
              <Button variant="outlined" size="small" onClick={() => handleOp("insertRecursive")} disabled={ll.running}>Recursive Insert (Pos, Val)</Button>
              <Button variant="outlined" size="small" onClick={() => handleOp("pushFront")} disabled={ll.running}>Push Front (Val)</Button>
              <Button variant="outlined" size="small" onClick={() => handleOp("pushBack")} disabled={ll.running}>Push Back (Val)</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
              Deletion
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("deleteHead")} disabled={ll.running}>Delete Head</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("deleteTail")} disabled={ll.running}>Delete Tail</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("deleteByValue")} disabled={ll.running}>Delete by Value (Val)</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("deleteAtPosition")} disabled={ll.running}>Delete at Position (Pos)</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("deleteBeforeNode")} disabled={ll.running}>Delete Before Node (Target)</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("deleteAfterNode")} disabled={ll.running}>Delete After Node (Target)</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("deleteEntireList")} disabled={ll.running}>Delete Entire List</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("recursiveDelete")} disabled={ll.running}>Recursive Delete (Target)</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("popFront")} disabled={ll.running}>Pop Front</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("popBack")} disabled={ll.running}>Pop Back</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("deleteNthFromEnd")} disabled={ll.running}>Delete N-th from End (Val)</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("deleteMiddleNode")} disabled={ll.running}>Delete Middle Node</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleOp("deleteAlternateNodes")} disabled={ll.running}>Delete Alternate Nodes</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
              Search
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button variant="outlined" size="small" color="info" onClick={() => handleOp("linearSearch")} disabled={ll.running}>Linear Search (Val)</Button>
              <Button variant="outlined" size="small" color="info" onClick={() => handleOp("recursiveSearch")} disabled={ll.running}>Recursive Search (Val)</Button>
              <Button variant="outlined" size="small" color="info" onClick={() => handleOp("searchByPosition")} disabled={ll.running}>Search by Position (Pos)</Button>
              <Button variant="outlined" size="small" color="info" onClick={() => handleOp("searchLastOccurrence")} disabled={ll.running}>Search Last Occurrence (Val)</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
              Algorithms
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {["countNodes", "middleNode", "removeDuplicates", "isPalindrome"].map(op => (
                <Button key={op} variant="contained" size="small" sx={{ flex: "1 1 48%", fontSize: "0.65rem", bgcolor: "rgba(99,102,241,0.1)", color: "primary.main", boxShadow: "none", "&:hover": { bgcolor: "rgba(99,102,241,0.2)", boxShadow: "none" } }} onClick={() => handleOp(op)} disabled={ll.running}>
                  {op.replace(/([A-Z])/g, ' $1').trim()}
                </Button>
              ))}
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
              Traversal
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button variant="outlined" size="small" color="success" onClick={() => handleOp("forwardTraversal")} disabled={ll.running}>Forward Traversal</Button>
              <Button variant="outlined" size="small" color="success" onClick={() => handleOp("recursiveTraversal")} disabled={ll.running}>Recursive Traversal</Button>
              <Button variant="outlined" size="small" color="success" onClick={() => handleOp("zigzagTraversal")} disabled={ll.running}>Zigzag Traversal</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
              Reversal
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button variant="outlined" size="small" color="warning" onClick={() => handleOp("reverseIterative")} disabled={ll.running}>Iterative Reverse</Button>
              <Button variant="outlined" size="small" color="warning" onClick={() => handleOp("recursiveReverse")} disabled={ll.running}>Recursive Reverse</Button>
              <Button variant="outlined" size="small" color="warning" onClick={() => handleOp("reverseInGroups")} disabled={ll.running}>Reverse in Groups (K=Val)</Button>
              <Button variant="outlined" size="small" color="warning" onClick={() => handleOp("reverseAlternateK")} disabled={ll.running}>Reverse Alternate K (K=Val)</Button>
              <Button variant="outlined" size="small" color="warning" onClick={() => handleOp("reverseSublist")} disabled={ll.running}>Reverse Sublist (Pos→Val)</Button>
              <Button variant="outlined" size="small" color="warning" onClick={() => handleOp("pairwiseReverse")} disabled={ll.running}>Pairwise Reverse</Button>
              <Button variant="outlined" size="small" color="warning" onClick={() => handleOp("reverseUsingStack")} disabled={ll.running}>Reverse Using Stack</Button>
            </Box>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)" }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
              Sorting
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button variant="outlined" size="small" color="secondary" onClick={() => handleOp("bubbleSortLL")} disabled={ll.running}>Bubble Sort</Button>
              <Button variant="outlined" size="small" color="secondary" onClick={() => handleOp("selectionSortLL")} disabled={ll.running}>Selection Sort</Button>
              <Button variant="outlined" size="small" color="secondary" onClick={() => handleOp("insertionSortLL")} disabled={ll.running}>Insertion Sort</Button>
              <Button variant="outlined" size="small" color="secondary" href="/ll-merge-sort"
                sx={{ display: "flex", gap: 0.5, "&:hover": { borderColor: "#eab308", color: "#eab308" } }}>
                Merge Sort ↗
              </Button>
              <Button variant="outlined" size="small" color="secondary" onClick={() => handleOp("quickSortLL")} disabled={ll.running}>Quick Sort</Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", mt: "auto" }}>
             <Typography variant="caption" sx={{ fontWeight: 600, color: "text.disabled", textTransform: "uppercase", display: "block", mb: 1 }}>Animation Speed</Typography>
             <Slider min={1} max={10} defaultValue={5} onChange={(_, v) => ll.setSpeed(v as number)} size="small" sx={{ mb: 1.5, color: "primary.main" }} />
             <Box sx={{ display: "flex", gap: 1 }}>
               <Button variant="outlined" fullWidth size="small" startIcon={ll.paused ? <PlayArrow /> : <Pause />} onClick={ll.togglePause} disabled={!ll.running}>
                 {ll.paused ? "Resume" : "Pause"}
               </Button>
               <Button variant="outlined" fullWidth size="small" color="error" startIcon={<RestartAlt />} onClick={() => ll.initList([15, 5, 20, 10, 25])} disabled={ll.running}>
                 Reset
               </Button>
             </Box>
          </Paper>
        </Box>

        {/* ─── Center Canvas ─── */}
        <LinkedListVisualizer currentState={ll.currentState} />

        {/* ─── Right Sidebar (Code & Log) ─── */}
        <Box sx={{ width: 360, minWidth: 360, display: "flex", flexDirection: "column", gap: 1.5, p: 1.5, overflowY: "auto",
          bgcolor: t => t.palette.mode === "dark" ? "rgba(11,15,25,0.55)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)", borderLeft: 1, borderColor: "rgba(99,102,241,0.15)" }}>
          
          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: "none", minHeight: 250 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
              C++ Implementation {ll.currentState.activeCodeKey ? `(${ll.currentState.activeCodeKey})` : ""}
            </Typography>
            {codeSnippet && codeSnippet.length > 0 ? (
              <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "text.secondary", display: "flex", flexDirection: "column", gap: 0.3 }}>
                {codeSnippet.map((line, idx) => {
                  const isActive = ll.currentState.activeLine === idx + 1;
                  return (
                    <Box key={idx} sx={{ display: "flex", alignItems: "center", py: 0.2, bgcolor: isActive ? "rgba(99,102,241,0.2)" : "transparent", color: isActive ? "primary.main" : "inherit", px: 0.5, borderRadius: 0.5 }}>
                      <Typography sx={{ width: 20, opacity: 0.5, userSelect: "none", mr: 1, fontSize: "0.7rem", textAlign: "right" }}>{idx + 1}</Typography>
                      <Typography sx={{ whiteSpace: "pre", fontSize: "0.75rem", fontWeight: isActive ? 700 : 400 }}>{line}</Typography>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Select an operation to view its code.</Typography>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(99,102,241,0.15)", flex: 1, display: "flex", flexDirection: "column", minHeight: 150 }}>
            <Typography variant="overline" sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary" }}>Execution Log</Typography>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem", lineHeight: 1.7, color: "text.secondary" }}>
              {ll.logEntries.length === 0 ? <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>Awaiting operation...</Typography>
                : ll.logEntries.map((entry, idx) => (
                  <Box key={idx} className="animate-fade-slide-in" sx={{ py: 0.25, borderBottom: "1px solid rgba(99,102,241,0.06)", whiteSpace: "pre-wrap" }}>
                    <Box component="span" sx={{ display: "inline-block", px: 0.75, py: 0.1, borderRadius: 0.5, fontSize: "0.6rem", fontWeight: 700,
                      textTransform: "uppercase", mr: 0.5, bgcolor: entry.type === "INFO" ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)",
                      color: entry.type === "INFO" ? "#10b981" : "#6366f1" }}>
                      {entry.type}
                    </Box>
                    {entry.msg}
                  </Box>
                ))}
            </Box>
          </Paper>

        </Box>
      </Box>
    </Box>
  );
}
