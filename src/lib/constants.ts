// src/lib/constants.ts
export const ROWS = 12;
export const BINS = 13;
export const MIN_BIAS = 0.4;
export const MAX_BIAS = 0.6;
export const DROP_COLUMN_INFLUENCE = 0.01;

// Symmetric payout table (edges pay more)
export const PAYOUT_TABLE: Record<number, number> = {
  0: 16,
  1: 9,
  2: 4,
  3: 2,
  4: 1.4,
  5: 1.1,
  6: 1,
  7: 1.1,
  8: 1.4,
  9: 2,
  10: 4,
  11: 9,
  12: 16,
};

export const BIN_COLORS: Record<number, string> = {
  0: '#ff0000',
  1: '#ff3300',
  2: '#ff6600',
  3: '#ff9900',
  4: '#ffcc00',
  5: '#ffff00',
  6: '#00ff00',
  7: '#ffff00',
  8: '#ffcc00',
  9: '#ff9900',
  10: '#ff6600',
  11: '#ff3300',
  12: '#ff0000',
};