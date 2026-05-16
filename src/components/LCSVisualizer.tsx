"use client";

import React, { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { LCSState, TreeNode } from '../hooks/useLCS';

const TreeEdges: React.FC<{ tree: Record<string, TreeNode>, backtrackingEdge: any }> = ({ tree, backtrackingEdge }) => {
  const [edges, React_useState] = React.useState<any[]>([]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const newEdges: any[] = [];
      const containerEl = document.getElementById("lcs-tree-container");
      if (!containerEl) return;
      const containerRect = containerEl.getBoundingClientRect();

      for (const nodeId in tree) {
        const node = tree[nodeId];
        const parentEl = document.getElementById(`node-${nodeId}`);
        if (!parentEl) continue;
        const parentRect = parentEl.getBoundingClientRect();
        
        const pX = parentRect.left + parentRect.width / 2 - containerRect.left + containerEl.scrollLeft;
        const pY = parentRect.bottom - containerRect.top + containerEl.scrollTop;

        node.children.forEach((child) => {
          if (!child) return;
          const childEl = document.getElementById(`node-${child.id}`);
          if (!childEl) return;
          const childRect = childEl.getBoundingClientRect();
          const cX = childRect.left + childRect.width / 2 - containerRect.left + containerEl.scrollLeft;
          const cY = childRect.top - containerRect.top + containerEl.scrollTop;
          
          const childNode = tree[child.id];
          const isReturned = childNode?.state === "computed" || childNode?.state === "memo_hit";
          const isCurrentlyBacktracking = backtrackingEdge?.from === child.id && backtrackingEdge?.to === nodeId;
          
          newEdges.push({
             id: `${nodeId}-${child.id}`,
             x1: pX, y1: pY, x2: cX, y2: cY,
             isBack: isReturned,
             isActive: isCurrentlyBacktracking,
             returnValue: childNode?.result,
             label: child.label,
             color: isReturned ? "#60a5fa" : "rgba(255,255,255,0.2)"
          });
        });
      }
      React_useState(newEdges);
    }, 10);
    return () => clearTimeout(timer);
  }, [tree, backtrackingEdge]);

  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "visible" }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {edges.map(e => {
        const dx = e.x1 - e.x2;
        const dy = e.y1 - e.y2;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const offset = 30; // Push the curve outwards by 30px
        const cx = (e.x1 + e.x2) / 2 + nx * offset;
        const cy = (e.y1 + e.y2) / 2 + ny * offset;

        const tx = 0.25 * e.x2 + 0.5 * cx + 0.25 * e.x1;
        const ty = 0.25 * e.y2 + 0.5 * cy + 0.25 * e.y1;

        return (
          <g key={e.id}>
            {/* Base forward edge always visible */}
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <text x={(e.x1 + e.x2) / 2} y={(e.y1 + e.y2) / 2} fill={e.label === "Take" ? "#4ade80" : "#f87171"} fontSize="10" textAnchor="middle" dy="-5" dx={e.x2 > e.x1 ? 10 : -10}>
              {e.label}
            </text>

            {/* Glowing backtracking path from child UP to parent */}
            {e.isBack && (
              <>
                <path 
                  d={`M ${e.x2} ${e.y2} Q ${cx} ${cy} ${e.x1} ${e.y1}`} 
                  fill="none" 
                  stroke={e.isActive ? "#60a5fa" : "rgba(96, 165, 250, 0.4)"} 
                  strokeWidth={e.isActive ? 3 : 2} 
                  filter={e.isActive ? "url(#glow)" : "none"} 
                  markerEnd="url(#arrowhead)" 
                />
                <text 
                  x={tx} 
                  y={ty} 
                  fill={e.isActive ? "#60a5fa" : "rgba(96, 165, 250, 0.8)"} 
                  fontSize={e.isActive ? "14" : "12"} 
                  fontWeight="bold" 
                  textAnchor="middle" 
                  dy="-5"
                >
                  {e.returnValue}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export const LCSVisualizer: React.FC<{ lcsState: LCSState }> = ({ lcsState }) => {
  const { mode, s1, s2, dp, tree, rootId, currI, currJ, comparing, highlightCells, backtrackingEdge, isFinished, allLCS } = lcsState;

  const renderTabulation = () => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2, overflow: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ width: 40, height: 40, mr: 1 }} />
          <Box sx={{ width: 40, height: 40, mr: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="body2" sx={{ color: "text.disabled" }}>Ø</Typography>
          </Box>
          {s2.split('').map((char, idx) => (
            <Box key={`col-${idx}`} sx={{ width: 40, height: 40, mr: 1, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: comparing && comparing[1] === idx ? "2px solid #e11d48" : "none" }}>
              <Typography variant="h6" sx={{ color: comparing && comparing[1] === idx ? "#e11d48" : "text.secondary", fontWeight: comparing && comparing[1] === idx ? 700 : 500 }}>
                {char}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {dp.map((row, i) => (
          <Box key={`row-${i}`} sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ width: 40, height: 40, mr: 1, display: "flex", alignItems: "center", justifyContent: "center", borderRight: comparing && comparing[0] === i - 1 ? "2px solid #e11d48" : "none" }}>
              <Typography variant={i === 0 ? "body2" : "h6"} sx={{ color: comparing && comparing[0] === i - 1 ? "#e11d48" : "text.secondary", fontWeight: comparing && comparing[0] === i - 1 ? 700 : 500 }}>
                {i === 0 ? "Ø" : s1[i - 1]}
              </Typography>
            </Box>
            
            {row.map((val, j) => {
              const isActive = currI === i && currJ === j;
              const hl = highlightCells.find(h => h.r === i && h.c === j);
              const bgColor = isActive ? "rgba(225,29,72,0.8)" : (hl ? hl.color : "rgba(255,255,255,0.05)");
              const isBaseCase = i === 0 || j === 0;
              
              return (
                <Paper
                  key={`cell-${i}-${j}`}
                  variant="outlined"
                  sx={{
                    width: 40, height: 40, mr: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    bgcolor: bgColor,
                    borderColor: isActive ? "#e11d48" : "rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    boxShadow: isActive ? "0 0 15px rgba(225,29,72,0.5)" : "none"
                  }}
                >
                  <Typography variant="body1" sx={{ color: isActive ? "#fff" : (isBaseCase ? "text.disabled" : "text.primary"), fontWeight: isActive ? 700 : 400 }}>
                    {val !== null ? val : ""}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  const renderTree = (nodeId: string, parentId: string | null = null, edgeLabel: string = "") => {
    const node = tree[nodeId];
    if (!node) return null;

    let bgColor = "rgba(255,255,255,0.05)";
    let borderColor = "rgba(255,255,255,0.1)";
    let textColor = "text.primary";
    
    if (node.state === "computing") {
      bgColor = "rgba(225,29,72,0.2)";
      borderColor = "#e11d48";
      textColor = "#fff";
    } else if (node.state === "computed") {
      bgColor = "rgba(34,197,94,0.1)";
      borderColor = "#22c55e";
      textColor = "#4ade80";
    } else if (node.state === "memo_hit") {
      bgColor = "rgba(234,179,8,0.1)";
      borderColor = "#eab308";
      textColor = "#fde047";
    }

    const leftChild = node.children[0];
    const rightChild = node.children[1];
    const hasChildren = leftChild || rightChild;

    return (
      <Box key={nodeId} sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", position: "relative" }}>
        <Paper
          id={`node-${nodeId}`}
          variant="outlined"
          sx={{
            p: 1, px: 1.5,
            bgcolor: bgColor,
            borderColor: borderColor,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 80,
            zIndex: 2,
            boxShadow: node.state === "computing" ? "0 0 15px rgba(225,29,72,0.4)" : "none",
            position: "relative"
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: "var(--font-mono)", color: "text.secondary", fontSize: "0.65rem" }}>
            LCS({node.i},{node.j})
          </Typography>
          {(node.result !== null || node.state === "computed" || node.state === "memo_hit") && (
            <Typography variant="body2" sx={{ color: textColor, fontWeight: 700 }}>
              {node.result}
            </Typography>
          )}
        </Paper>

        {hasChildren && (
          <Box sx={{ display: "flex", width: "100%", mt: 4, position: "relative" }}>
            <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
              {leftChild ? renderTree(leftChild.id, node.id, leftChild.label) : null}
            </Box>
            <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
              {rightChild ? renderTree(rightChild.id, node.id, rightChild.label) : null}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderComparison = () => {
    return (
      <Paper variant="outlined" sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, mb: 4, position: "sticky", top: 0, zIndex: 10, bgcolor: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)", borderColor: "rgba(225,29,72,0.3)", alignSelf: "center", minWidth: Math.max(s1.length, s2.length) * 36 + 80 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>Character Comparison</Typography>
        
        <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 3 }}>
          {comparing && (
             <svg style={{ position: "absolute", top: 32, left: 0, width: "100%", height: 24, pointerEvents: "none", zIndex: 2 }}>
                <line 
                  x1={`${40 + 2 + 16 + comparing[0] * 36}px`} 
                  y1="0" 
                  x2={`${40 + 2 + 16 + comparing[1] * 36}px`} 
                  y2="24" 
                  stroke={s1[comparing[0]] === s2[comparing[1]] ? "#4ade80" : "#f87171"} 
                  strokeWidth="3"
                  strokeDasharray={s1[comparing[0]] === s2[comparing[1]] ? "none" : "4 4"}
                />
             </svg>
          )}

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="overline" sx={{ width: 40, color: "text.disabled", fontWeight: 700 }}>S1</Typography>
            {s1.split('').map((char, i) => {
              const isComp = comparing && comparing[0] === i;
              const isMatch = isComp && s1[comparing[0]] === s2[comparing[1]];
              return (
                <Box key={`s1-${i}`} sx={{ width: 32, height: 32, mx: "2px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1, bgcolor: isComp ? (isMatch ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)") : "rgba(255,255,255,0.05)", border: "1px solid", borderColor: isComp ? (isMatch ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.1)", transition: "all 0.3s ease", zIndex: 1, boxShadow: isComp ? (isMatch ? "0 0 10px rgba(34,197,94,0.4)" : "0 0 10px rgba(248,113,113,0.4)") : "none" }}>
                  <Typography sx={{ fontWeight: 700, color: isComp ? "#fff" : "text.secondary" }}>{char}</Typography>
                </Box>
              );
            })}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="overline" sx={{ width: 40, color: "text.disabled", fontWeight: 700 }}>S2</Typography>
            {s2.split('').map((char, j) => {
              const isComp = comparing && comparing[1] === j;
              const isMatch = isComp && s1[comparing[0]] === s2[comparing[1]];
              return (
                <Box key={`s2-${j}`} sx={{ width: 32, height: 32, mx: "2px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1, bgcolor: isComp ? (isMatch ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)") : "rgba(255,255,255,0.05)", border: "1px solid", borderColor: isComp ? (isMatch ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.1)", transition: "all 0.3s ease", zIndex: 1, boxShadow: isComp ? (isMatch ? "0 0 10px rgba(34,197,94,0.4)" : "0 0 10px rgba(248,113,113,0.4)") : "none" }}>
                  <Typography sx={{ fontWeight: 700, color: isComp ? "#fff" : "text.secondary" }}>{char}</Typography>
                </Box>
              );
            })}
          </Box>
          
          {comparing && (() => {
             const isMatch = s1[comparing[0]] === s2[comparing[1]];
             return (
               <Box sx={{ mt: 2, p: 2, bgcolor: isMatch ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)", borderRadius: 1, border: "1px solid", borderColor: isMatch ? "#22c55e" : "#ef4444", textAlign: "center", animation: "fadeIn 0.3s ease" }}>
                 <Typography variant="body1" sx={{ color: isMatch ? "#4ade80" : "#f87171", fontWeight: 700 }}>
                   {isMatch 
                     ? `MATCH! '${s1[comparing[0]]}' == '${s2[comparing[1]]}'. Action: Take character and recurse on LCS(${comparing[0]}, ${comparing[1]}). (+1 to Result)` 
                     : `MISMATCH. '${s1[comparing[0]]}' != '${s2[comparing[1]]}'. Action: Branch to max( LCS(${comparing[0]}, ${comparing[1]+1}), LCS(${comparing[0]+1}, ${comparing[1]}) )`}
                 </Typography>
               </Box>
             );
          })()}

          {isFinished && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(168,85,247,0.1)", borderRadius: 1, border: "1px solid", borderColor: "#a855f7", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
              <Typography variant="body1" sx={{ color: "#c084fc", fontWeight: 700, mb: 1 }}>
                Algorithm Finished!
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Total Valid Longest Common Subsequences (Length: {allLCS.length > 0 ? allLCS[0].length : 0})
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center", mt: 1 }}>
                {allLCS.length > 0 ? allLCS.map((str, idx) => (
                  <Paper key={idx} sx={{ px: 2, py: 0.5, bgcolor: "#1e1b4b", color: "#a855f7", border: "1px solid #c084fc", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {str}
                  </Paper>
                )) : (
                  <Typography variant="body2" sx={{ color: "text.disabled" }}>None found.</Typography>
                )}
              </Box>
            </Box>
          )}

        </Box>
      </Paper>
    );
  };

  return (
    <Box id="lcs-scroll-container" sx={{ width: "100%", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", pt: 4, px: 4, position: "relative" }}>
      {renderComparison()}
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
        {mode === "tabulation" ? renderTabulation() : (rootId ? (
          <Box id="lcs-tree-container" sx={{ width: "fit-content", minWidth: 800, position: "relative" }}>
            <TreeEdges tree={tree} backtrackingEdge={backtrackingEdge} />
            {renderTree(rootId)}
          </Box>
        ) : null)}
      </Box>
    </Box>
  );
};
