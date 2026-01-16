// src/components/VerifierForm.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PathDecision } from '@/types';

interface VerifyResult {
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
  path: PathDecision[];
  isValid: boolean;
  storedRound?: {
    id: string;
    binIndex: number;
    pegMapHash: string;
    commitHex: string;
  };
}

export default function VerifierForm() {
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('');
  const [dropColumn, setDropColumn] = useState(6);
  const [roundId, setRoundId] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const params = new URLSearchParams({
        serverSeed,
        clientSeed,
        nonce,
        dropColumn: dropColumn.toString(),
      });
      
      if (roundId) {
        params.append('roundId', roundId);
      }

      const response = await fetch(`/api/verify?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadTestVector = () => {
    setServerSeed('b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc');
    setClientSeed('candidate-hello');
    setNonce('42');
    setDropColumn(6);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">🔍 Verify Round</h2>
        
        <button
          onClick={loadTestVector}
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Load Test Vector
        </button>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Server Seed</label>
          <input
            type="text"
            value={serverSeed}
            onChange={(e) => setServerSeed(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none font-mono text-sm"
            placeholder="64 character hex string"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Client Seed</label>
          <input
            type="text"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Your client seed"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nonce</label>
            <input
              type="text"
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder="Round nonce"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Drop Column (0-12)</label>
            <input
              type="number"
              min={0}
              max={12}
              value={dropColumn}
              onChange={(e) => setDropColumn(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Round ID (optional)</label>
          <input
            type="text"
            value={roundId}
            onChange={(e) => setRoundId(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Compare against stored round"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleVerify}
          disabled={loading || !serverSeed || !clientSeed || !nonce}
          className="w-full py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify Round'}
        </motion.button>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded p-4 text-red-300">
            {error}
          </div>
        )}
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-xl font-bold">
            {result.storedRound ? (
              result.isValid ? (
                <>
                  <span className="text-green-400">✅</span>
                  <span className="text-green-400">Verified!</span>
                </>
              ) : (
                <>
                  <span className="text-red-400">❌</span>
                  <span className="text-red-400">Mismatch!</span>
                </>
              )
            ) : (
              <>
                <span className="text-blue-400">ℹ️</span>
                <span className="text-blue-400">Computed Results</span>
              </>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400">Commit Hash:</span>
              <code className="block mt-1 p-2 bg-slate-900 rounded font-mono text-xs break-all">
                {result.commitHex}
              </code>
            </div>
            
            <div>
              <span className="text-slate-400">Combined Seed:</span>
              <code className="block mt-1 p-2 bg-slate-900 rounded font-mono text-xs break-all">
                {result.combinedSeed}
              </code>
            </div>
            
            <div>
              <span className="text-slate-400">Peg Map Hash:</span>
              <code className="block mt-1 p-2 bg-slate-900 rounded font-mono text-xs break-all">
                {result.pegMapHash}
              </code>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400">Final Bin:</span>
                <span className="ml-2 text-2xl font-bold text-yellow-400">
                  {result.binIndex}
                </span>
              </div>
            </div>
          </div>

          {/* Path Replay */}
          <div>
            <div className="text-slate-400 text-sm mb-2">Path Replay:</div>
            <div className="bg-slate-900 rounded p-3 max-h-48 overflow-y-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left">Row</th>
                    <th className="text-left">Bias</th>
                    <th className="text-left">RNG</th>
                    <th className="text-left">Dir</th>
                    <th className="text-left">Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {result.path.map((step, i) => (
                    <tr key={i} className="text-slate-300">
                      <td>{step.row}</td>
                      <td>{step.adjustedBias.toFixed(4)}</td>
                      <td>{step.random.toFixed(4)}</td>
                      <td>{step.wentRight ? '→ R' : '← L'}</td>
                      <td>{step.posAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}