import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { FkState } from '@/hooks/useFractionalKnapsack';
import { motion, AnimatePresence } from 'framer-motion';

const ITEM_COLORS = [
  '#38bdf8', '#f43f5e', '#a855f7', '#22c55e', '#eab308', 
  '#f97316', '#ec4899', '#84cc16', '#14b8a6', '#6366f1'
];

export function FractionalKnapsackVisualizer({ state }: { state: FkState }) {
  const { items, sortedItems, capacity, currentWeight, totalProfit, currentIndex, phase, fractionCalculation } = state;

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      
      {/* Top Variables Box */}
      <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
        <Paper 
          component={motion.div}
          animate={{
            scale: phase === 'done' ? [1, 1.05, 1] : 1,
            boxShadow: phase === 'done' ? '0 0 20px rgba(234, 179, 8, 0.6)' : 'none'
          }}
          transition={{ duration: 1, repeat: phase === 'done' ? Infinity : 0 }}
          sx={{ p: 2, minWidth: 200, textAlign: 'center', bgcolor: 'rgba(30,41,59,0.8)', border: '1px solid', borderColor: 'rgba(234,179,8,0.3)', borderRadius: 2 }}
        >
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>Total Profit</Typography>
          <Typography variant="h4" sx={{ color: '#eab308', fontWeight: 800 }}>
            {totalProfit.toFixed(2)}
          </Typography>
        </Paper>

        <Paper 
          component={motion.div}
          animate={{
            scale: phase === 'done' ? [1, 1.05, 1] : 1,
            boxShadow: phase === 'done' ? '0 0 20px rgba(56, 189, 248, 0.6)' : 'none'
          }}
          transition={{ duration: 1, repeat: phase === 'done' ? Infinity : 0 }}
          sx={{ p: 2, minWidth: 200, textAlign: 'center', bgcolor: 'rgba(30,41,59,0.8)', border: '1px solid', borderColor: 'rgba(56,189,248,0.3)', borderRadius: 2 }}
        >
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>Current Weight / Capacity</Typography>
          <Typography variant="h4" sx={{ color: '#38bdf8', fontWeight: 800 }}>
            {currentWeight.toFixed(2)} / {capacity}
          </Typography>
          <Box sx={{ width: '100%', height: 6, bgcolor: 'rgba(255,255,255,0.1)', mt: 1, borderRadius: 3, overflow: 'hidden' }}>
             <Box sx={{ height: '100%', bgcolor: '#38bdf8', width: `${Math.min(100, (currentWeight/capacity)*100)}%`, transition: 'width 0.3s ease' }} />
          </Box>
        </Paper>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
        
        {/* Left: Items Table */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Items (Initial)</Typography>
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.9)', color: 'text.secondary' }}>Item</TableCell>
                  <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.9)', color: 'text.secondary' }}>Weight</TableCell>
                  <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.9)', color: 'text.secondary' }}>Value</TableCell>
                  <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.9)', color: 'text.secondary' }}>Ratio (V/W)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => {
                  const isCurrentCalculating = phase === 'calculating_ratios' && currentIndex === idx;
                  const color = ITEM_COLORS[item.id % ITEM_COLORS.length];
                  return (
                    <TableRow key={item.id} sx={{ bgcolor: isCurrentCalculating ? 'rgba(234,179,8,0.2)' : 'transparent', transition: 'background-color 0.3s' }}>
                      <TableCell sx={{ color: color, fontWeight: 'bold' }}>{item.id}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{item.weight}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{item.value}</TableCell>
                      <TableCell sx={{ color: '#eab308', fontWeight: 'bold' }}>
                        {item.ratioCalculated ? (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {item.ratio.toFixed(2)}
                          </motion.span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Middle: Sorted Items Array & Fraction Calc */}
        <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Sorted Items Array (Descending Ratio)</Typography>
          {sortedItems.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <AnimatePresence>
                {sortedItems.map((item, idx) => {
                  const isCurrent = currentIndex === idx;
                  const takenStr = item.fractionTaken > 0 ? (item.fractionTaken === 1 ? '100%' : `${(item.fractionTaken * 100).toFixed(1)}%`) : '';
                  const itemColor = ITEM_COLORS[item.id % ITEM_COLORS.length];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 120, damping: 14 }}
                    >
                      <Paper sx={{ 
                        width: 100, p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        bgcolor: isCurrent ? 'rgba(234,179,8,0.2)' : (item.fractionTaken > 0 ? `${itemColor}20` : 'rgba(30,41,59,0.8)'),
                        border: '2px solid', 
                        borderColor: isCurrent ? '#eab308' : (item.fractionTaken > 0 ? itemColor : 'rgba(255,255,255,0.1)'),
                        position: 'relative', overflow: 'hidden'
                      }}>
                        {/* Fill background to indicate taken fraction */}
                        {item.fractionTaken > 0 && (
                          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${item.fractionTaken * 100}%`, bgcolor: `${itemColor}40`, zIndex: 0 }} />
                        )}
                        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                           <Typography variant="caption" sx={{ color: itemColor, fontWeight: 'bold', display: 'block' }}>Item {item.id}</Typography>
                           <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>R: {item.ratio.toFixed(1)}</Typography>
                           <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>W:{item.weight} V:{item.value}</Typography>
                           {takenStr && <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold', mt: 0.5, display: 'block' }}>Taken: {takenStr}</Typography>}
                        </Box>
                      </Paper>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>Waiting for sorting...</Typography>
            </Box>
          )}

          {/* Fraction Calculation Box */}
          <AnimatePresence>
            {fractionCalculation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Paper sx={{ p: 2, bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#ef4444', mb: 1, fontWeight: 700 }}>Fractional Item Encountered!</Typography>
                  <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', p: 1.5, borderRadius: 1 }}>
                     {fractionCalculation.split('\\n').map((line, i) => (
                       <Typography key={i} variant="body2" sx={{ fontFamily: 'var(--font-mono)', color: '#fff', my: 0.5 }}>
                         {line}
                       </Typography>
                     ))}
                  </Box>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Right: Knapsack Visualization */}
        <Box sx={{ width: 180, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Knapsack Storage</Typography>
          
          <Box sx={{ position: 'relative', width: 140, height: 350, mt: 2 }}>
            {/* Top Flap / Handle */}
            <Box sx={{ 
              position: 'absolute', top: -16, left: '25%', right: '25%', height: 20, 
              bgcolor: '#1e293b', borderRadius: '10px 10px 0 0', 
              border: '4px solid #475569', borderBottom: 'none', zIndex: 0
            }} />
            
            {/* Side Pouches / Straps */}
            <Box sx={{ position: 'absolute', top: '30%', left: -12, width: 16, height: 120, bgcolor: '#0f172a', border: '4px solid #475569', borderRight: 'none', borderRadius: '20px 0 0 20px', zIndex: 0 }} />
            <Box sx={{ position: 'absolute', top: '30%', right: -12, width: 16, height: 120, bgcolor: '#0f172a', border: '4px solid #475569', borderLeft: 'none', borderRadius: '0 20px 20px 0', zIndex: 0 }} />
            
            <Paper sx={{ 
              width: '100%', height: '100%', 
              border: '4px solid #475569', 
              borderTopLeftRadius: 40, borderTopRightRadius: 40, 
              borderBottomLeftRadius: 20, borderBottomRightRadius: 20, 
              bgcolor: 'rgba(15,23,42,0.8)', position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column-reverse', p: 0.5, zIndex: 1,
              boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.8)'
            }}>
              {/* Background dashed lines for capacity */}
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0, opacity: 0.2, pointerEvents: 'none' }}>
                {[...Array(6)].map((_, i) => <Box key={i} sx={{ borderTop: '1px dashed #fff', width: '100%', height: '20%' }} />)}
              </Box>

              {/* Render items that have fractionTaken > 0 */}
              <AnimatePresence>
                {sortedItems.map(item => {
                  if (item.fractionTaken === 0) return null;
                  const heightPercent = (item.weight * item.fractionTaken / capacity) * 100;
                  const color = ITEM_COLORS[item.id % ITEM_COLORS.length];
                  return (
                    <motion.div
                      key={`ks-${item.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${heightPercent}%`, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      style={{ 
                        width: '100%', 
                        backgroundColor: color, 
                        borderRadius: 4,
                        marginBottom: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        zIndex: 1,
                        boxShadow: 'inset 0 -4px 10px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.3)'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold', fontSize: '0.7rem', textShadow: '0px 0px 4px rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.1 }}>
                        Item {item.id}<br/>{heightPercent.toFixed(0)}% of Bag<br/>(W: {(item.weight * item.fractionTaken).toFixed(1)})
                      </Typography>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Paper>
          </Box>
        </Box>

      </Box>

    </Box>
  );
}
