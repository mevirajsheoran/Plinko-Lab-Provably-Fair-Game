// src/lib/crypto.ts
import { createHash, randomBytes } from 'crypto';

/**
 * Generate SHA-256 hash of input string
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate random hex string
 */
export function generateRandomHex(bytes: number = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Generate commit hash: SHA256(serverSeed:nonce)
 */
export function generateCommitHex(serverSeed: string, nonce: string): string {
  return sha256(`${serverSeed}:${nonce}`);
}

/**
 * Generate combined seed: SHA256(serverSeed:clientSeed:nonce)
 */
export function generateCombinedSeed(
  serverSeed: string,
  clientSeed: string,
  nonce: string
): string {
  return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}

/**
 * Generate peg map hash
 */
export function generatePegMapHash(pegMap: number[][]): string {
  return sha256(JSON.stringify(pegMap));
}