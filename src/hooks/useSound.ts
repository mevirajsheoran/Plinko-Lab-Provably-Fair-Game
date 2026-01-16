// src/hooks/useSound.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SoundOptions {
  volume?: number;
  playbackRate?: number;
}

export function useSound(soundEnabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      setIsReady(true);
    }
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playTone = useCallback((frequency: number, duration: number, options: SoundOptions = {}) => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const { volume = 0.1 } = options;
    const ctx = audioContextRef.current;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [soundEnabled]);

  const playPegHit = useCallback((pegIndex: number) => {
    // Vary pitch based on peg position
    const baseFreq = 800 + pegIndex * 50;
    playTone(baseFreq, 0.05, { volume: 0.08 });
  }, [playTone]);

  const playBinLanding = useCallback((binIndex: number, multiplier: number) => {
    // Celebratory sound - higher pitch for better payouts
    const baseFreq = 400 + multiplier * 50;
    
    // Play a chord
    playTone(baseFreq, 0.3, { volume: 0.15 });
    setTimeout(() => playTone(baseFreq * 1.25, 0.25, { volume: 0.12 }), 50);
    setTimeout(() => playTone(baseFreq * 1.5, 0.2, { volume: 0.1 }), 100);
  }, [playTone]);

  const playDrop = useCallback(() => {
    playTone(600, 0.1, { volume: 0.1 });
  }, [playTone]);

  return {
    isReady,
    playPegHit,
    playBinLanding,
    playDrop,
  };
}