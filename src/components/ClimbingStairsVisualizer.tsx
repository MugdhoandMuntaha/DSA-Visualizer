import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { CSState, TreeNode } from '../hooks/useClimbingStairs';

const TreeEdges: React.FC<{ tree: Record<string, TreeNode>, backtrackingEdge: any }> = ({ tree, backtrackingEdge }) => {
  const [edges, React_useState] = React.useState<any[]>([]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const newEdges: any[] = [];
      const containerEl = document.getElementById("cs-tree-container");
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

export const ClimbingStairsVisualizer: React.FC<{ csState: CSState }> = ({ csState }) => {
  const { mode, n, dp, tree, rootId, currI, highlightCells, backtrackingEdge, isFinished } = csState;

  const renderPhysicalStairs = () => {
    return (
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderColor: "rgba(225,29,72,0.3)", bgcolor: "rgba(0,0,0,0.2)", borderRadius: 3, overflow: "hidden" }}>
        <Typography variant="overline" sx={{ mb: 2, fontWeight: 700, color: "text.secondary", display: "block" }}>Physical Stairs View</Typography>
        <Box sx={{ display: "flex", alignItems: "flex-end", height: 250, width: "100%", overflowX: "auto", pb: 2, gap: 1 }}>
           {Array(n + 1).fill(0).map((_, idx) => {
              const isActive = currI === idx;
              const isHighlight = highlightCells.find(h => h.i === idx);
              
              let bgColor = "rgba(255,255,255,0.05)";
              let borderColor = "rgba(255,255,255,0.1)";
              let textColor = "text.secondary";
              let shadow = "none";
              
              if (isActive) {
                bgColor = "rgba(225,29,72,0.8)";
                borderColor = "#e11d48";
                textColor = "#fff";
                shadow = "0 -10px 20px rgba(225,29,72,0.5)";
              } else if (isHighlight) {
                bgColor = isHighlight.color;
                borderColor = "rgba(34,197,94,0.8)";
                textColor = "#4ade80";
              }

              // Base case stairs 1 and 2 have special styling if pre-filled
              if ((idx === 1 || idx === 2) && dp[idx] !== null && !isActive && !isHighlight) {
                 bgColor = "rgba(96,165,250,0.15)";
                 borderColor = "rgba(96,165,250,0.5)";
                 textColor = "#93c5fd";
              }

              return (
                <Box key={idx} sx={{ 
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
                  width: 60, height: Math.max(40, (idx + 1) * 20), minHeight: 40,
                  bgcolor: bgColor, borderTop: `2px solid ${borderColor}`, borderRight: `2px solid ${borderColor}`, borderLeft: `2px solid ${borderColor}`,
                  borderTopLeftRadius: 4, borderTopRightRadius: 4,
                  transition: "all 0.3s ease",
                  boxShadow: shadow,
                  position: "relative",
                  flexShrink: 0
                }}>
                   <Typography variant="body2" sx={{ fontWeight: 800, color: textColor, mt: 1 }}>
                     S{idx}
                   </Typography>
                   {(dp[idx] !== null && dp[idx] !== undefined) && (
                     <Typography variant="caption" sx={{ color: isActive ? "#fff" : "text.secondary", fontWeight: 700, mt: 0.5 }}>
                       {dp[idx]} ways
                     </Typography>
                   )}
                </Box>
              )
           })}
        </Box>
      </Paper>
    );
  };

  const renderTabulation = () => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2, overflow: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {Array(n + 1).fill(null).map((_, idx) => (
            <Box key={`col-${idx}`} sx={{ width: 40, height: 40, mr: 1, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: currI === idx ? "2px solid #e11d48" : "none" }}>
              <Typography variant="h6" sx={{ color: currI === idx ? "#e11d48" : "text.secondary", fontWeight: currI === idx ? 700 : 500 }}>
                {idx}
              </Typography>
            </Box>
          ))}
        </Box>
        
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            {dp.map((val, idx) => {
              const isActive = currI === idx;
              const hl = highlightCells.find(h => h.i === idx);
              const bgColor = isActive ? "rgba(225,29,72,0.8)" : (hl ? hl.color : "rgba(255,255,255,0.05)");
              
              return (
                <Paper
                  key={`cell-${idx}`}
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
            minWidth: 60,
            zIndex: 2,
            boxShadow: node.state === "computing" ? "0 0 15px rgba(225,29,72,0.4)" : "none",
            position: "relative"
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: "var(--font-mono)", color: "text.secondary", fontSize: "0.65rem" }}>
            cs({node.n})
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

  return (
    <Box id="cs-scroll-container" sx={{ width: "100%", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", pt: 4, px: 4, position: "relative" }}>
      <Paper elevation={0} sx={{ p: 3, bgcolor: "rgba(15,23,42,0.6)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)", mb: 4, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, mb: 1 }}>
            Climbing Stairs (n = {n})
          </Typography>

          {isFinished && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(168,85,247,0.1)", borderRadius: 1, border: "1px solid", borderColor: "#a855f7", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
              <Typography variant="body1" sx={{ color: "#c084fc", fontWeight: 700, mb: 1 }}>
                Algorithm Finished!
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Total ways to climb {n} stairs: {dp[n] !== null && dp[n] !== undefined ? dp[n] : tree[`cs(${n})-1`]?.result}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {renderPhysicalStairs()}

      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
        {mode === "tabulation" ? renderTabulation() : (rootId ? (
          <Box id="cs-tree-container" sx={{ width: "fit-content", minWidth: 800, position: "relative" }}>
            <TreeEdges tree={tree} backtrackingEdge={backtrackingEdge} />
            {renderTree(rootId)}
          </Box>
        ) : null)}
      </Box>
    </Box>
  );
};
