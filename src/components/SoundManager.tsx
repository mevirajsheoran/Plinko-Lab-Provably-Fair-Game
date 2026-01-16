// src/components/RecentRounds.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Round } from '@/types';
import { PAYOUT_TABLE } from '@/lib/constants';

export default function RecentRounds() {
const [rounds, setRounds] = useState<Round[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
const fetchRounds = async () => {
try {
const response = await fetch('/api/rounds?limit=10');
const data = await response.json();
setRounds(data);
} catch (error) {
console.error('Failed to fetch rounds:', error);
} finally {
setLoading(false);
}
};



fetchRounds();
const interval = setInterval(fetchRounds, 10000);
return () => clearInterval(interval);
}, []);

if (loading) {
return (
<div className="bg-slate-800 rounded-lg p-4">
<div className="text-slate-400 text-center">Loading rounds...</div>
</div>
);
}

return (
<div className="bg-slate-800 rounded-lg p-4">
<h3 className="text-lg font-bold text-white mb-4">Recent Rounds</h3>

text

  {rounds.length === 0 ? (
    <div className="text-slate-400 text-center py-4">No rounds yet</div>
  ) : (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {rounds.map((round) => (
        <Link
          key={round.id}
          href={`/verify?roundId=${round.id}&serverSeed=${round.serverSeed}&clientSeed=${round.clientSeed}&nonce=${round.nonce}&dropColumn=${round.dropColumn}`}
          className="block bg-slate-700 rounded p-3 hover:bg-slate-600 transition-colors"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-slate-300">
                Bin {round.binIndex} → {round.payoutMultiplier}x
              </div>
              <div className="text-xs text-slate-500">
                {new Date(round.createdAt).toLocaleTimeString()}
              </div>
            </div>
            <div className="text-xs text-blue-400">Verify →</div>
          </div>
        </Link>
      ))}
    </div>
  )}
</div>
);
}