// src/components/GameControls.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PAYOUT_TABLE } from '@/lib/constants';

interface GameControlsProps {
  dropColumn: number;
  setDropColumn: (col: number) => void;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  clientSeed: string;
  setClientSeed: (seed: string) => void;
  onDrop: () => void;
  isDisabled: boolean;
  balance: number;
  commitHex: string | null;
  nonce: string | null;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export default function GameControls({
  dropColumn,
  setDropColumn,
  betAmount,
  setBetAmount,
  clientSeed,
  setClientSeed,
  onDrop,
  isDisabled,
  balance,
  commitHex,
  nonce,
  soundEnabled,
  setSoundEnabled,
}: GameControlsProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-6">
      {/* Balance */}
      <div className="text-center">
        <div className="text-sm text-slate-400">Balance</div>
        <div className="text-3xl font-bold text-green-400">
          ${(balance / 100).toFixed(2)}
        </div>
      </div>

      text

      {/* Sound Toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="w-full py-2 px-4 rounded bg-slate-700 hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
        aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
      >
        {soundEnabled ? '🔊' : '🔇'} Sound {soundEnabled ? 'On' : 'Off'}
      </button>

      {/* Drop Column Selector */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Drop Column: {dropColumn}
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDropColumn(Math.max(0, dropColumn - 1))}
            disabled={isDisabled || dropColumn === 0}
            className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Move left"
          >
            ←
          </button>
          <input
            type="range"
            min={0}
            max={12}
            value={dropColumn}
            onChange={(e) => setDropColumn(parseInt(e.target.value))}
            disabled={isDisabled}
            className="flex-1"
            aria-label="Drop column slider"
          />
          <button
            onClick={() => setDropColumn(Math.min(12, dropColumn + 1))}
            disabled={isDisabled || dropColumn === 12}
            className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Move right"
          >
            →
          </button>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Use arrow keys or A/D to adjust
        </div>
      </div>

      {/* Bet Amount */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Bet Amount: ${(betAmount / 100).toFixed(2)}
        </label>
        <div className="flex gap-2">
          {[100, 500, 1000, 2500].map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={isDisabled}
              className={`flex-1 py-2 rounded text-sm transition-colors ${betAmount === amount
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600'
                } disabled:opacity-50`}
            >
              ${(amount / 100).toFixed(0)}
            </button>
          ))}
        </div>
      </div>

      {/* Client Seed */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Client Seed (optional)
        </label>
        <input
          type="text"
          value={clientSeed}
          onChange={(e) => setClientSeed(e.target.value)}
          disabled={isDisabled}
          placeholder="Enter your seed..."
          className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Drop Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onDrop}
        disabled={isDisabled || betAmount > balance}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-lg hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isDisabled ? 'Playing...' : 'Drop Ball 🎱'}
      </motion.button>
      <div className="text-xs text-slate-500 text-center">
        Press Space or Enter to drop
      </div>

      {/* Fairness Info */}
      {commitHex && (
        <div className="bg-slate-900 rounded p-4 text-xs">
          <div className="text-slate-400 mb-2">🔐 Provably Fair</div>
          <div className="space-y-1">
            <div>
              <span className="text-slate-500">Commit:</span>
              <span className="text-slate-300 ml-2 font-mono break-all">
                {commitHex.slice(0, 16)}...
              </span>
            </div>
            <div>
              <span className="text-slate-500">Nonce:</span>
              <span className="text-slate-300 ml-2 font-mono">{nonce}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payout Table */}
      <div className="bg-slate-900 rounded p-4">
        <div className="text-sm text-slate-400 mb-3">Payout Table</div>
        <div className="grid grid-cols-7 gap-1 text-xs text-center">
          {Object.entries(PAYOUT_TABLE).map(([bin, mult]) => (
            <div
              key={bin}
              className={`py-1 rounded ${parseInt(bin) === 6
                  ? 'bg-green-600'
                  : mult >= 9
                    ? 'bg-red-600'
                    : mult >= 4
                      ? 'bg-orange-600'
                      : 'bg-slate-700'
                }`}
            >
              {mult}x
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}