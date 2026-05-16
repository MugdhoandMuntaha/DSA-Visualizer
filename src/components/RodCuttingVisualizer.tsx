import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { RCState, TreeNode } from '../hooks/useRodCutting';

const TreeEdges: React.FC<{ tree: Record<string, TreeNode>, backtrackingEdge: any }> = ({ tree, backtrackingEdge }) => {
  const [edges, React_useState] = React.useState<any[]>([]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const newEdges: any[] = [];
      const containerEl = document.getElementById("rc-tree-container");
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
        const offset = 30;
        const cx = (e.x1 + e.x2) / 2 + nx * offset;
        const cy = (e.y1 + e.y2) / 2 + ny * offset;

        const tx = 0.25 * e.x2 + 0.5 * cx + 0.25 * e.x1;
        const ty = 0.25 * e.y2 + 0.5 * cy + 0.25 * e.y1;

        return (
          <g key={e.id}>
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <text x={(e.x1 + e.x2) / 2} y={(e.y1 + e.y2) / 2} fill="#60a5fa" fontSize="10" textAnchor="middle" dy="-5" dx={e.x2 > e.x1 ? 10 : -10}>
              {e.label}
            </text>

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

export const RodCuttingVisualizer: React.FC<{ rcState: RCState }> = ({ rcState }) => {
  const { mode, n, prices, dp, tree, rootId, currI, currLen, highlightCells, backtrackingEdge, isFinished } = rcState;

  const renderPhysicalRod = () => {
    return (
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderColor: "rgba(225,29,72,0.3)", bgcolor: "rgba(0,0,0,0.2)", borderRadius: 3, overflow: "hidden" }}>
        <Typography variant="overline" sx={{ mb: 2, fontWeight: 700, color: "text.secondary", display: "block" }}>Physical Rod View</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
           {/* Current Available Pieces */}
           <Box>
             <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>Available Piece Lengths & Prices</Typography>
             <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {prices.map((p, idx) => {
                   if (idx === 0) return null; // skip 0-padding
                   const isAnalyzing = currI === idx;
                   return (
                     <Box key={`piece-${idx}`} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                         <Typography variant="caption" sx={{ color: isAnalyzing ? "#f43f5e" : "text.secondary", fontWeight: isAnalyzing ? 700 : 400 }}>Len {idx}</Typography>
                         <Box sx={{ 
                             width: idx * 30, height: 24, 
                             background: isAnalyzing ? "linear-gradient(180deg, #f43f5e, #be123c)" : "linear-gradient(180deg, #64748b, #334155)",
                             border: `2px solid ${isAnalyzing ? "#f43f5e" : "rgba(255,255,255,0.1)"}`,
                             borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center",
                             boxShadow: isAnalyzing ? "0 0 15px rgba(225,29,72,0.4)" : "none",
                             transition: "all 0.3s ease"
                         }}>
                             <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700, fontSize: "0.65rem" }}>${p}</Typography>
                         </Box>
                     </Box>
                   )
                })}
             </Box>
           </Box>

           {/* Remaining Rod */}
           <Box>
             <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>Target Remaining Length: {currLen !== -1 ? currLen : "N/A"}</Typography>
             {currLen > 0 && (
                 <Box sx={{ 
                     width: currLen * 30, height: 16, 
                     background: "linear-gradient(180deg, #3b82f6, #1d4ed8)", border: `2px solid #3b82f6`,
                     borderRadius: 1,
                     boxShadow: "0 0 15px rgba(59,130,246,0.3)"
                 }} />
             )}
           </Box>
        </Box>
      </Paper>
    );
  };

  const renderTabulation = () => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2, overflow: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ width: 60, mr: 1 }} />
          {Array(n + 1).fill(null).map((_, idx) => (
            <Box key={`col-${idx}`} sx={{ width: 40, height: 40, mr: 1, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: currLen === idx ? "2px solid #e11d48" : "none" }}>
              <Typography variant="h6" sx={{ color: currLen === idx ? "#e11d48" : "text.secondary", fontWeight: currLen === idx ? 700 : 500 }}>
                {idx}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {dp.map((row, i) => {
          if (i === 0 || i > n) return null; // Only show relevant rows 1 to n
          return (
            <Box key={`row-${i}`} sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ width: 60, mr: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 1, borderRight: currI === i ? "2px solid #e11d48" : "none" }}>
                   <Typography variant="body2" sx={{ color: currI === i ? "#e11d48" : "text.secondary", fontWeight: currI === i ? 700 : 500 }}>
                     i={i}
                   </Typography>
                </Box>
                {row.map((val, len) => {
                  if (len > n) return null;
                  const isActive = currI === i && currLen === len;
                  const hl = highlightCells.find(h => h.r === i && h.c === len);
                  const bgColor = isActive ? "rgba(225,29,72,0.8)" : (hl ? hl.color : "rgba(255,255,255,0.05)");
                  
                  return (
                    <Paper
                      key={`cell-${i}-${len}`}
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
                      <Typography variant="body1" sx={{ color: isActive ? "#fff" : "text.primary", fontWeight: isActive ? 700 : 400 }}>
                        {val !== null ? val : ""}
                      </Typography>
                    </Paper>
                  );
                })}
            </Box>
          );
        })}
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
            RC({node.i}, {node.len})
          </Typography>
          {(node.result !== null || node.state === "computed" || node.state === "memo_hit") && (
            <Typography variant="body2" sx={{ color: textColor, fontWeight: 700 }}>
              {node.result}
            </Typography>
          )}
        </Paper>

        {hasChildren && (
          <Box sx={{ display: "flex", width: "100%", mt: 6, position: "relative", gap: 2 }}>
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

  return (
    <Box id="rc-scroll-container" sx={{ width: "100%", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", pt: 4, px: 4, position: "relative" }}>
      <Paper elevation={0} sx={{ p: 3, bgcolor: "rgba(15,23,42,0.6)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)", mb: 4, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, mb: 1 }}>
            Rod Cutting (n = {n})
          </Typography>

          {isFinished && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(168,85,247,0.1)", borderRadius: 1, border: "1px solid", borderColor: "#a855f7", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
              <Typography variant="body1" sx={{ color: "#c084fc", fontWeight: 700, mb: 1 }}>
                Algorithm Finished!
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Max Profit for length {n}: {dp[1]?.[n] !== null && dp[1]?.[n] !== undefined ? dp[1][n] : tree[`rc(1,${n})-1`]?.result}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {renderPhysicalRod()}

      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
        {mode === "tabulation" ? renderTabulation() : (rootId ? (
          <Box id="rc-tree-container" sx={{ width: "fit-content", minWidth: 800, position: "relative" }}>
            <TreeEdges tree={tree} backtrackingEdge={backtrackingEdge} />
            {renderTree(rootId)}
          </Box>
        ) : null)}
      </Box>
    </Box>
  );
};
