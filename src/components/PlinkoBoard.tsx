// src/components/PlinkoBoard.tsx
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROWS, BINS, BIN_COLORS, PAYOUT_TABLE } from '@/lib/constants';
import { PathDecision } from '@/types';

interface PlinkoBoardProps {
  dropColumn: number;
  path: PathDecision[] | null;
  binIndex: number | null;
  isAnimating: boolean;
  onAnimationComplete: () => void;
  reducedMotion: boolean;
  onPegHit: (pegIndex: number) => void;
  tiltMode: boolean;
  debugMode: boolean;
  goldenBall: boolean;
  theme: 'default' | 'dungeon';
}

interface BallPosition {
  x: number;
  y: number;
}

export default function PlinkoBoard({
  dropColumn,
  path,
  binIndex,
  isAnimating,
  onAnimationComplete,
  reducedMotion,
  onPegHit,
  tiltMode,
  debugMode,
  goldenBall,
  theme,
}: PlinkoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ballPos, setBallPos] = useState<BallPosition | null>(null);
  const [currentRow, setCurrentRow] = useState(-1);
  const [showConfetti, setShowConfetti] = useState(false);
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 600, height: 700 });

  // Calculate board dimensions
  const pegSpacing = dimensions.width / (ROWS + 2);
  const rowHeight = (dimensions.height - 100) / (ROWS + 1);
  const pegRadius = 6;
  const ballRadius = 10;

  // Get peg position
  const getPegPosition = useCallback((row: number, pegIndex: number) => {
    const pegsInRow = row + 1;
    const rowWidth = pegsInRow * pegSpacing;
    const startX = (dimensions.width - rowWidth) / 2 + pegSpacing / 2;
    
    return {
      x: startX + pegIndex * pegSpacing,
      y: 50 + row * rowHeight,
    };
  }, [dimensions, pegSpacing, rowHeight]);

  // Get bin position
  const getBinPosition = useCallback((binIdx: number) => {
    const binWidth = dimensions.width / BINS;
    return {
      x: binIdx * binWidth + binWidth / 2,
      y: dimensions.height - 30,
    };
  }, [dimensions]);

  // Get drop position
  const getDropPosition = useCallback((column: number) => {
    const binWidth = dimensions.width / BINS;
    return {
      x: column * binWidth + binWidth / 2,
      y: 20,
    };
  }, [dimensions]);

  // Draw board
  const drawBoard = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Background
    const bgColor = theme === 'dungeon' ? '#1a0a0a' : '#0f172a';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw pegs
    for (let row = 0; row < ROWS; row++) {
      for (let peg = 0; peg <= row; peg++) {
        const pos = getPegPosition(row, peg);
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pegRadius, 0, Math.PI * 2);
        
        // Highlight current row in debug mode
        if (debugMode && row === currentRow) {
          ctx.fillStyle = '#fbbf24';
        } else if (theme === 'dungeon') {
          ctx.fillStyle = '#8b4513';
        } else {
          ctx.fillStyle = '#64748b';
        }
        ctx.fill();
        
        // Glow effect
        if (row === currentRow && isAnimating) {
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw bins
    const binWidth = dimensions.width / BINS;
    for (let i = 0; i < BINS; i++) {
      const binX = i * binWidth;
      const binY = dimensions.height - 60;
      
      // Bin background
      ctx.fillStyle = BIN_COLORS[i];
      ctx.globalAlpha = binIndex === i && !isAnimating ? 1 : 0.6;
      ctx.fillRect(binX + 2, binY, binWidth - 4, 60);
      ctx.globalAlpha = 1;
      
      // Bin multiplier text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${PAYOUT_TABLE[i]}x`, binX + binWidth / 2, binY + 35);
    }

    // Draw drop column indicator
    const dropPos = getDropPosition(dropColumn);
    ctx.beginPath();
    ctx.moveTo(dropPos.x, 10);
    ctx.lineTo(dropPos.x - 8, 0);
    ctx.lineTo(dropPos.x + 8, 0);
    ctx.closePath();
    ctx.fillStyle = goldenBall ? '#ffd700' : '#3b82f6';
    ctx.fill();

    // Draw ball if animating
    if (ballPos) {
      ctx.beginPath();
      ctx.arc(ballPos.x, ballPos.y, ballRadius, 0, Math.PI * 2);
      
      if (goldenBall) {
        const gradient = ctx.createRadialGradient(
          ballPos.x, ballPos.y, 0,
          ballPos.x, ballPos.y, ballRadius
        );
        gradient.addColorStop(0, '#fff7cc');
        gradient.addColorStop(0.5, '#ffd700');
        gradient.addColorStop(1, '#b8860b');
        ctx.fillStyle = gradient;
      } else {
        const gradient = ctx.createRadialGradient(
          ballPos.x, ballPos.y, 0,
          ballPos.x, ballPos.y, ballRadius
        );
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(1, '#2563eb');
        ctx.fillStyle = gradient;
      }
      
      ctx.shadowColor = goldenBall ? '#ffd700' : '#3b82f6';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Debug overlay
    if (debugMode && path && currentRow >= 0 && currentRow < path.length) {
      const decision = path[currentRow];
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Row: ${decision.row}`, 10, 20);
      ctx.fillText(`Bias: ${decision.adjustedBias.toFixed(4)}`, 10, 35);
      ctx.fillText(`RNG: ${decision.random.toFixed(4)}`, 10, 50);
      ctx.fillText(`→ ${decision.wentRight ? 'Right' : 'Left'}`, 10, 65);
    }
  }, [
    dimensions, getPegPosition, getDropPosition, dropColumn,
    ballPos, binIndex, isAnimating, currentRow, debugMode,
    path, theme, goldenBall
  ]);

  // Animation logic
  useEffect(() => {
    if (!isAnimating || !path || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let currentStep = 0;
    let progress = 0;
    const duration = reducedMotion ? 50 : 150; // ms per row

    const startPos = getDropPosition(dropColumn);
    setBallPos(startPos);
    setCurrentRow(-1);

    const animate = () => {
      if (currentStep >= path.length) {
        // Animation complete - move to final bin
        const finalBin = getBinPosition(binIndex!);
        setBallPos({ x: finalBin.x, y: finalBin.y });
        setShowConfetti(true);
        onAnimationComplete();
        return;
      }

      progress += 16; // ~60fps

      if (progress >= duration) {
        // Move to next row
        const decision = path[currentStep];
        setCurrentRow(decision.row);
        onPegHit(decision.pegIndex);
        
        // Calculate new position
        const pegPos = getPegPosition(decision.row, decision.pegIndex);
        const offsetX = decision.wentRight ? pegSpacing / 2 : -pegSpacing / 2;
        
        setBallPos({
          x: pegPos.x + offsetX,
          y: pegPos.y + rowHeight / 2,
        });

        currentStep++;
        progress = 0;
      } else {
        // Interpolate position
        const t = progress / duration;
        const eased = 1 - Math.pow(1 - t, 3); // Ease out cubic
        
        if (currentStep === 0) {
          const start = getDropPosition(dropColumn);
          const pegPos = getPegPosition(0, 0);
          setBallPos({
            x: start.x + (pegPos.x - start.x) * eased,
            y: start.y + (pegPos.y - start.y) * eased,
          });
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    isAnimating, path, reducedMotion, dropColumn, binIndex,
    getPegPosition, getBinPosition, getDropPosition, onAnimationComplete,
    onPegHit, pegSpacing, rowHeight
  ]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBoard(ctx);
  }, [drawBoard]);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const width = Math.min(container.clientWidth, 600);
        const height = Math.min(width * 1.17, 700);
        setDimensions({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Hide confetti after delay
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <div 
      className={`relative ${tiltMode ? 'transform rotate-3' : ''} transition-transform duration-300`}
      style={{ filter: tiltMode ? 'sepia(0.3) contrast(1.1)' : 'none' }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="rounded-lg shadow-2xl"
        aria-label="Plinko game board"
        role="img"
      />
      
      <AnimatePresence>
        {showConfetti && binIndex !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-4xl font-bold text-white drop-shadow-lg">
              {PAYOUT_TABLE[binIndex]}x! 🎉
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}