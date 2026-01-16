// src/components/RecentRounds.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PAYOUT_TABLE } from '@/lib/constants';

interface RoundSummary {
  id: string;
  createdAt: string;
  status: string;
  nonce: string;
  commitHex: string;
  clientSeed: string | null;
  pegMapHash: string | null;
  dropColumn: number | null;
  binIndex: number | null;
  payoutMultiplier: number | null;
  betCents: number | null;
  serverSeed: string | null;
}

export default function RecentRounds() {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRounds = async () => {
    try {
      const response = await fetch('/api/rounds?limit=10');
      if (!response.ok) {
        throw new Error('Failed to fetch rounds');
      }
      const data = await response.json();
      setRounds(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch rounds:', err);
      setError('Failed to load recent rounds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchRounds, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-4">Recent Rounds</h3>
        <div className="text-slate-400 text-center py-4">
          <div className="animate-pulse">Loading rounds...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-4">Recent Rounds</h3>
        <div className="text-red-400 text-center py-4">{error}</div>
        <button
          onClick={fetchRounds}
          className="w-full mt-2 py-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Recent Rounds</h3>
        <button
          onClick={fetchRounds}
          className="text-xs text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          🔄
        </button>
      </div>
      
      {rounds.length === 0 ? (
        <div className="text-slate-400 text-center py-4">
          No rounds played yet. Drop a ball to get started!
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {rounds.map((round) => (
            <Link
              key={round.id}
              href={`/verify?roundId=${round.id}&serverSeed=${round.serverSeed || ''}&clientSeed=${round.clientSeed || ''}&nonce=${round.nonce}&dropColumn=${round.dropColumn || 6}`}
              className="block bg-slate-700 rounded p-3 hover:bg-slate-600 transition-colors group"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">
                      Bin {round.binIndex}
                    </span>
                    <span className={`text-sm font-bold ${
                      (round.payoutMultiplier || 0) >= 4 
                        ? 'text-green-400' 
                        : (round.payoutMultiplier || 0) >= 2 
                          ? 'text-yellow-400' 
                          : 'text-slate-400'
                    }`}>
                      {round.payoutMultiplier}x
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(round.createdAt).toLocaleTimeString()} · 
                    Drop Col {round.dropColumn}
                  </div>
                </div>
                <div className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Verify →
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 font-mono truncate">
                ID: {round.id.slice(0, 12)}...
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {rounds.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <Link
            href="/verify"
            className="block text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View Verifier Page →
          </Link>
        </div>
      )}
    </div>
  );
}