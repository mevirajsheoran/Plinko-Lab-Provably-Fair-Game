// src/types/index.ts
export interface Round {
  id: string;
  createdAt: Date;
  status: 'CREATED' | 'STARTED' | 'REVEALED';
  nonce: string;
  commitHex: string;
  serverSeed?: string | null;
  clientSeed?: string | null;
  combinedSeed?: string | null;
  pegMapHash?: string | null;
  rows: number;
  dropColumn?: number | null;
  binIndex?: number | null;
  payoutMultiplier?: number | null;
  betCents?: number | null;
  pathJson?: PathDecision[] | null;
  revealedAt?: Date | null;
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

export interface GameState {
  roundId: string | null;
  commitHex: string | null;
  nonce: string | null;
  status: 'IDLE' | 'COMMITTED' | 'STARTED' | 'ANIMATING' | 'REVEALED';
  dropColumn: number;
  betAmount: number;
  clientSeed: string;
  result: GameResult | null;
  balance: number;
  recentRounds: Round[];
}

export interface GameResult {
  binIndex: number;
  payoutMultiplier: number;
  path: PathDecision[];
  serverSeed: string;
}

export interface VerifyResult {
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
  path: PathDecision[];
  isValid: boolean;
  storedRound?: Round;
}