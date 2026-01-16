// src/components/Confetti.tsx
'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
trigger: boolean;
intensity?: 'low' | 'medium' | 'high';
}

export default function Confetti({ trigger, intensity = 'medium' }: ConfettiProps) {
useEffect(() => {
if (!trigger) return;



const configs = {
  low: { particleCount: 30, spread: 50 },
  medium: { particleCount: 100, spread: 70 },
  high: { particleCount: 200, spread: 100 },
};

const config = configs[intensity];

confetti({
  ...config,
  origin: { y: 0.7 },
  colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
});
}, [trigger, intensity]);

return null;
}

