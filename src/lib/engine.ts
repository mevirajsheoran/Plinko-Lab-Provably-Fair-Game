// src/lib/engine.ts
import { ROWS, MIN_BIAS, MAX_BIAS, DROP_COLUMN_INFLUENCE, PAYOUT_TABLE } from './constants';
import { createXorshift32, seedFromHex, roundTo } from './prng';
import { generateCombinedSeed, generatePegMapHash } from './crypto';

export interface PegMap {
  map: number[][];
  hash: string;
}

export interface PathDecision {
  row: number;
  pegIndex: number;
  leftBias: number;
  adjustedBias: number;
  random: number;
  wentRight: boolean;
  posAfter: number;
}

export interface GameResult {
  pegMap: PegMap;
  path: PathDecision[];
  binIndex: number;
  payoutMultiplier: number;
}

/**
 * Generate peg map with left biases
 * Uses PRNG to generate leftBias ∈ [0.4, 0.6] for each peg
 */
export function generatePegMap(rand: () => number): PegMap {
  const map: number[][] = [];
  
  for (let row = 0; row < ROWS; row++) {
    const pegsInRow: number[] = [];
    const numPegs = row + 1;
    
    for (let peg = 0; peg < numPegs; peg++) {
      // leftBias = 0.5 + (rand() - 0.5) * 0.2
      const rawBias = 0.5 + (rand() - 0.5) * 0.2;
      const leftBias = roundTo(rawBias, 6);
      pegsInRow.push(leftBias);
    }
    
    map.push(pegsInRow);
  }
  
  const hash = generatePegMapHash(map);
  return { map, hash };
}

/**
 * Simulate ball drop through the peg map
 */
export function simulateDrop(
  pegMap: number[][],
  dropColumn: number,
  rand: () => number
): { path: PathDecision[]; binIndex: number } {
  const path: PathDecision[] = [];
  let pos = 0; // Number of right moves so far
  
  // Calculate drop column adjustment
  const adj = (dropColumn - Math.floor(ROWS / 2)) * DROP_COLUMN_INFLUENCE;
  
  for (let row = 0; row < ROWS; row++) {
    // Get peg at index min(pos, row)
    const pegIndex = Math.min(pos, row);
    const leftBias = pegMap[row][pegIndex];
    
    // Apply drop column adjustment
    const adjustedBias = Math.max(0, Math.min(1, leftBias + adj));
    
    // Generate random value and decide direction
    const random = roundTo(rand(), 10);
    const wentRight = random >= adjustedBias;
    
    if (wentRight) {
      pos += 1;
    }
    
    path.push({
      row,
      pegIndex,
      leftBias,
      adjustedBias: roundTo(adjustedBias, 6),
      random,
      wentRight,
      posAfter: pos,
    });
  }
  
  return { path, binIndex: pos };
}

/**
 * Run complete game simulation
 */
export function runGame(
  serverSeed: string,
  clientSeed: string,
  nonce: string,
  dropColumn: number
): GameResult {
  // Generate combined seed
  const combinedSeed = generateCombinedSeed(serverSeed, clientSeed, nonce);
  
  // Create PRNG from combined seed
  const seed = seedFromHex(combinedSeed);
  const rand = createXorshift32(seed);
  
  // Generate peg map (uses first part of PRNG stream)
  const pegMap = generatePegMap(rand);
  
  // Simulate drop (uses remaining PRNG stream)
  const { path, binIndex } = simulateDrop(pegMap.map, dropColumn, rand);
  
  // Get payout multiplier
  const payoutMultiplier = PAYOUT_TABLE[binIndex] || 1;
  
  return {
    pegMap,
    path,
    binIndex,
    payoutMultiplier,
  };
}

/**
 * Verify a round's outcome
 */
export function verifyRound(
  serverSeed: string,
  clientSeed: string,
  nonce: string,
  dropColumn: number
): {
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
  path: PathDecision[];
} {
  const { generateCommitHex, generateCombinedSeed: genCombined } = require('./crypto');
  
  const commitHex = generateCommitHex(serverSeed, nonce);
  const combinedSeed = genCombined(serverSeed, clientSeed, nonce);
  
  const result = runGame(serverSeed, clientSeed, nonce, dropColumn);
  
  return {
    commitHex,
    combinedSeed,
    pegMapHash: result.pegMap.hash,
    binIndex: result.binIndex,
    path: result.path,
  };
}