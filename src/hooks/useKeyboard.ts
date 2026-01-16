// src/hooks/useKeyboard.ts
'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardHandlers {
  onLeft: () => void;
  onRight: () => void;
  onDrop: () => void;
  onTilt?: () => void;
  onDebug?: () => void;
  onMute?: () => void;
}

export function useKeyboard(handlers: KeyboardHandlers, enabled: boolean = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't capture if user is typing in an input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        handlers.onLeft();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        handlers.onRight();
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        handlers.onDrop();
        break;
      case 't':
      case 'T':
        handlers.onTilt?.();
        break;
      case 'g':
      case 'G':
        handlers.onDebug?.();
        break;
      case 'm':
      case 'M':
        handlers.onMute?.();
        break;
    }
  }, [enabled, handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}