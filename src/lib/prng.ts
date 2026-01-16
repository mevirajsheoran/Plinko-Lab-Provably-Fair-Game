// src/lib/prng.ts

/**
 * xorshift32 PRNG implementation
 * Seeded from first 4 bytes of combinedSeed (big-endian)
 */
export function createXorshift32(seed: number): () => number {
  // Ensure seed is a valid 32-bit unsigned integer
  let state = seed >>> 0;
  
  // Prevent zero state (xorshift can't escape zero)
  if (state === 0) {
    state = 1;
  }

  return function rand(): number {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state = state >>> 0; // Keep as unsigned 32-bit
    return state / 0x100000000; // Return value in [0, 1)
  };
}

/**
 * Extract seed from hex string (first 4 bytes, big-endian)
 */
export function seedFromHex(hexString: string): number {
  const first8Chars = hexString.slice(0, 8);
  return parseInt(first8Chars, 16) >>> 0;
}

/**
 * Round a number to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}