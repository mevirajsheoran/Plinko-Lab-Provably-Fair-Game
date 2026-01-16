// src/app/page.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import PlinkoBoard from '@/components/PlinkoBoard';
import GameControls from '@/components/GameControls';
import Confetti from '@/components/Confetti';
import RecentRounds from '@/components/RecentRounds';
import { useSound } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useKeyboard } from '@/hooks/useKeyboard';
import { GameState } from '@/types';
import { PAYOUT_TABLE } from '@/lib/constants';

const INITIAL_BALANCE = 100000; // $1000 in cents
const SECRET_CODE = 'opensesame';

export default function Home() {
  // Game state
  const [state, setState] = useState<GameState>({
    roundId: null,
    commitHex: null,
    nonce: null,
    status: 'IDLE',
    dropColumn: 6,
    betAmount: 100,
    clientSeed: '',
    result: null,
    balance: INITIAL_BALANCE,
    recentRounds: [],
  });

  // Easter egg states
  const [tiltMode, setTiltMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [goldenBall, setGoldenBall] = useState(false);
  const [theme, setTheme] = useState<'default' | 'dungeon'>('default');
  const [secretInput, setSecretInput] = useState('');
  const [showSecretHint, setShowSecretHint] = useState(false);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const recentBinsRef = useRef<number[]>([]);
  const secretTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sound & motion preferences
  const [soundEnabled, setSoundEnabled] = useState(true);
  const reducedMotion = useReducedMotion();
  const { playPegHit, playBinLanding, playDrop } = useSound(soundEnabled);

  // Check for golden ball condition
  useEffect(() => {
    if (recentBinsRef.current.length >= 3) {
      const lastThree = recentBinsRef.current.slice(-3);
      if (lastThree.every((bin) => bin === 6)) {
        setGoldenBall(true);
      }
    }
  }, [state.recentRounds]);

  // Secret theme input handler - improved version
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Only handle letter keys for the secret code
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        const newInput = (secretInput + e.key.toLowerCase()).slice(-SECRET_CODE.length);
        setSecretInput(newInput);
        
        // Show hint when user starts typing matching characters
        if (SECRET_CODE.startsWith(newInput) && newInput.length > 0) {
          setShowSecretHint(true);
          
          // Clear previous timeout
          if (secretTimeoutRef.current) {
            clearTimeout(secretTimeoutRef.current);
          }
          
          // Hide hint after 2 seconds of no input
          secretTimeoutRef.current = setTimeout(() => {
            setShowSecretHint(false);
            setSecretInput('');
          }, 2000);
        }
        
        // Check if secret code is complete
        if (newInput === SECRET_CODE) {
          setTheme((prev) => (prev === 'default' ? 'dungeon' : 'default'));
          setSecretInput('');
          setShowSecretHint(false);
          setSecretUnlocked(true);
          
          // Hide unlock animation after 2 seconds
          setTimeout(() => setSecretUnlocked(false), 2000);
          
          if (secretTimeoutRef.current) {
            clearTimeout(secretTimeoutRef.current);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (secretTimeoutRef.current) {
        clearTimeout(secretTimeoutRef.current);
      }
    };
  }, [secretInput]);

  // Commit a new round
  const commitRound = useCallback(async () => {
    try {
      const response = await fetch('/api/rounds/commit', { method: 'POST' });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setState((prev) => ({
        ...prev,
        roundId: data.roundId,
        commitHex: data.commitHex,
        nonce: data.nonce,
        status: 'COMMITTED',
      }));
    } catch (error) {
      console.error('Failed to commit round:', error);
    }
  }, []);

  // Auto-commit on load
  useEffect(() => {
    if (state.status === 'IDLE') {
      commitRound();
    }
  }, [state.status, commitRound]);

  // Drop the ball
  const handleDrop = useCallback(async () => {
    if (state.status !== 'COMMITTED' || !state.roundId) return;
    if (state.betAmount > state.balance) return;

    const clientSeed = state.clientSeed || `seed-${Date.now()}`;

    try {
      // Deduct bet
      setState((prev) => ({
        ...prev,
        status: 'STARTED',
        balance: prev.balance - prev.betAmount,
        clientSeed,
      }));

      playDrop();

      // Start the round
      const startResponse = await fetch(`/api/rounds/${state.roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSeed,
          betCents: state.betAmount,
          dropColumn: state.dropColumn,
        }),
      });
      
      const startData = await startResponse.json();
      if (!startResponse.ok) throw new Error(startData.error);

      // Reveal the round
      const revealResponse = await fetch(`/api/rounds/${state.roundId}/reveal`, {
        method: 'POST',
      });
      const revealData = await revealResponse.json();
      if (!revealResponse.ok) throw new Error(revealData.error);

      // Update state with result
      setState((prev) => ({
        ...prev,
        status: 'ANIMATING',
        result: {
          binIndex: startData.binIndex,
          payoutMultiplier: startData.payoutMultiplier,
          path: startData.path,
          serverSeed: revealData.serverSeed,
        },
      }));

      // Track for golden ball
      recentBinsRef.current.push(startData.binIndex);
      if (recentBinsRef.current.length > 3) {
        recentBinsRef.current.shift();
      }
    } catch (error) {
      console.error('Failed to play round:', error);
      // Refund on error
      setState((prev) => ({
        ...prev,
        status: 'COMMITTED',
        balance: prev.balance + prev.betAmount,
      }));
    }
  }, [state, playDrop]);

  // Animation complete handler
  const handleAnimationComplete = useCallback(() => {
    if (!state.result) return;

    const payout = Math.floor(state.betAmount * state.result.payoutMultiplier);
    
    playBinLanding(state.result.binIndex, state.result.payoutMultiplier);

    setState((prev) => ({
      ...prev,
      status: 'REVEALED',
      balance: prev.balance + payout,
    }));

    // Reset golden ball after use
    if (goldenBall) {
      setGoldenBall(false);
    }

    // Prepare next round after delay
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        status: 'IDLE',
        roundId: null,
        commitHex: null,
        nonce: null,
        result: null,
        clientSeed: '',
      }));
    }, 2000);
  }, [state.result, state.betAmount, goldenBall, playBinLanding]);

  // Keyboard controls
  useKeyboard(
    {
      onLeft: () =>
        setState((prev) => ({
          ...prev,
          dropColumn: Math.max(0, prev.dropColumn - 1),
        })),
      onRight: () =>
        setState((prev) => ({
          ...prev,
          dropColumn: Math.min(12, prev.dropColumn + 1),
        })),
      onDrop: handleDrop,
      onTilt: () => setTiltMode((prev) => !prev),
      onDebug: () => setDebugMode((prev) => !prev),
      onMute: () => setSoundEnabled((prev) => !prev),
    },
    state.status === 'COMMITTED'
  );

  const isPlaying = ['STARTED', 'ANIMATING'].includes(state.status);

  // Theme-based styles
  const themeStyles = {
    default: {
      bg: 'bg-slate-900',
      headerGradient: 'from-blue-400 to-purple-400',
      accent: 'bg-slate-700 hover:bg-slate-600',
    },
    dungeon: {
      bg: 'bg-stone-900',
      headerGradient: 'from-orange-400 to-red-500',
      accent: 'bg-stone-700 hover:bg-stone-600',
    },
  };

  const currentTheme = themeStyles[theme];

  return (
    <main className={`min-h-screen p-4 md:p-8 ${currentTheme.bg} transition-colors duration-500`}>
      <div className="max-w-6xl mx-auto">
        {/* Secret Code Hint Indicator */}
        <AnimatePresence>
          {showSecretHint && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-purple-900/90 text-purple-200 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
                <span className="text-xs">🔮 Typing: </span>
                <span className="font-mono text-purple-300">
                  {secretInput}
                  <span className="animate-pulse">|</span>
                </span>
                <span className="text-xs text-purple-400 ml-2">
                  ({secretInput.length}/{SECRET_CODE.length})
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Secret Unlocked Animation */}
        <AnimatePresence>
          {secretUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="text-6xl animate-bounce">
                {theme === 'dungeon' ? '🏰' : '✨'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <motion.h1 
            className={`text-3xl font-bold bg-gradient-to-r ${currentTheme.headerGradient} bg-clip-text text-transparent`}
            key={theme}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {theme === 'dungeon' ? '🏰 Dungeon Plinko' : '🎱 Plinko'}
          </motion.h1>
          <nav className="flex gap-4">
            {/* Theme Toggle Button (visible alternative) */}
            <button
              onClick={() => setTheme(prev => prev === 'default' ? 'dungeon' : 'default')}
              className={`px-3 py-2 ${currentTheme.accent} rounded transition-colors text-sm`}
              title="Toggle theme (or type 'opensesame')"
            >
              {theme === 'dungeon' ? '☀️' : '🌙'}
            </button>
            <Link
              href="/verify"
              className={`px-4 py-2 ${currentTheme.accent} rounded transition-colors`}
            >
              🔍 Verify
            </Link>
          </nav>
        </header>

        {/* Easter egg indicators */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <AnimatePresence>
            {tiltMode && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-2 py-1 bg-yellow-600 rounded text-xs"
              >
                🎮 TILT MODE
              </motion.span>
            )}
            {goldenBall && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-2 py-1 bg-yellow-500 text-black rounded text-xs animate-pulse"
              >
                ✨ GOLDEN BALL
              </motion.span>
            )}
            {debugMode && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-2 py-1 bg-purple-600 rounded text-xs"
              >
                🔧 DEBUG
              </motion.span>
            )}
            {theme === 'dungeon' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-2 py-1 bg-orange-700 rounded text-xs"
              >
                🏰 DUNGEON MODE
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Board */}
          <div className="lg:col-span-2 flex justify-center">
            <PlinkoBoard
              dropColumn={state.dropColumn}
              path={state.result?.path || null}
              binIndex={state.result?.binIndex ?? null}
              isAnimating={state.status === 'ANIMATING'}
              onAnimationComplete={handleAnimationComplete}
              reducedMotion={reducedMotion}
              onPegHit={playPegHit}
              tiltMode={tiltMode}
              debugMode={debugMode}
              goldenBall={goldenBall}
              theme={theme}
            />
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <GameControls
              dropColumn={state.dropColumn}
              setDropColumn={(col) =>
                setState((prev) => ({ ...prev, dropColumn: col }))
              }
              betAmount={state.betAmount}
              setBetAmount={(amount) =>
                setState((prev) => ({ ...prev, betAmount: amount }))
              }
              clientSeed={state.clientSeed}
              setClientSeed={(seed) =>
                setState((prev) => ({ ...prev, clientSeed: seed }))
              }
              onDrop={handleDrop}
              isDisabled={isPlaying || state.status !== 'COMMITTED'}
              balance={state.balance}
              commitHex={state.commitHex}
              nonce={state.nonce}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
            />

            <RecentRounds />
          </div>
        </div>

        {/* Result Display */}
        <AnimatePresence>
          {state.status === 'REVEALED' && state.result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
              onClick={() => {}} // Prevent clicks from propagating
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className={`${theme === 'dungeon' ? 'bg-stone-800' : 'bg-slate-800'} rounded-lg p-8 text-center shadow-2xl`}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="text-4xl font-bold text-yellow-400 mb-2"
                >
                  {state.result.payoutMultiplier}x
                </motion.div>
                <div className="text-lg text-slate-300">
                  Won ${((state.betAmount * state.result.payoutMultiplier) / 100).toFixed(2)}
                </div>
                <div className="text-sm text-slate-500 mt-4">
                  Bin: {state.result.binIndex}
                </div>
                {state.result.payoutMultiplier >= 9 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl mt-4"
                  >
                    🎉🎊🎉
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Confetti 
          trigger={state.status === 'REVEALED' && (state.result?.payoutMultiplier ?? 0) >= 4}
          intensity={(state.result?.payoutMultiplier ?? 0) >= 9 ? 'high' : 'medium'}
        />

        {/* Footer with keyboard shortcuts */}
        <footer className="mt-8 text-center text-sm text-slate-500">
          <div className="space-y-2">
            <p>
              <span className="text-slate-400">Keyboard:</span>{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">←</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs ml-1">→</kbd>
              {' '}or{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">A</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs ml-1">D</kbd>
              {' '}to move |{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Space</kbd>
              {' '}to drop
            </p>
            <p>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">T</kbd>
              {' '}tilt |{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">G</kbd>
              {' '}debug |{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">M</kbd>
              {' '}mute
            </p>
            <p className="text-purple-400">
              🔮 Type <span className="font-mono bg-purple-900/50 px-1 rounded">opensesame</span> for a secret theme
            </p>
          </div>
        </footer>

        {/* Hidden element to ensure focus doesn't go to body */}
        <div 
          tabIndex={-1} 
          className="sr-only"
          aria-hidden="true"
        >
          Secret code listener active
        </div>
      </div>
    </main>
  );
}