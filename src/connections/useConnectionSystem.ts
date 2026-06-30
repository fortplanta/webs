// Session 32 — connection gamification state management.
// Tracks: ProgressState (per-canvas 0-1000 bar), lifetime score (global), glowing fragment IDs.

import { useState, useCallback } from 'react';
import type { ProgressState, ConnectionTier } from '../api/types';

const PROGRESS_THRESHOLD = 1000;
const LIFETIME_KEY = 'webs-lifetime-score';
const PROGRESS_KEY  = 'webs-progress-state';

function loadLifetimeScore(): number {
  try {
    return parseInt(localStorage.getItem(LIFETIME_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveLifetimeScore(score: number): void {
  try {
    localStorage.setItem(LIFETIME_KEY, String(score));
  } catch {}
}

function saveProgressState(state: ProgressState): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('webs-progress-changed'));
  } catch {}
}

export function loadProgressState(): ProgressState | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ProgressState) : null;
  } catch {
    return null;
  }
}

export function makeInitialProgressState(): ProgressState {
  return { current: 0, threshold: PROGRESS_THRESHOLD, totalLifetime: loadLifetimeScore() };
}

export interface ConnectionSystemState {
  progressState: ProgressState;
  glowingFragmentIds: Set<string>;
  glowDimFragmentIds: Set<string>; // LLM-found connections get dim glow
}

export interface ConnectionSystemActions {
  applyConnectionResult: (params: {
    tier: ConnectionTier;
    points: number;
    sourceFragmentId: string;
    targetFragmentId: string;
  }) => { thresholdReached: boolean };
  clearGlow: (fragmentId: string) => void;
  resetProgress: () => void;
}

export function useConnectionSystem(initialProgress?: ProgressState): [
  ConnectionSystemState,
  ConnectionSystemActions,
] {
  const [progressState, setProgressState] = useState<ProgressState>(
    initialProgress ?? makeInitialProgressState()
  );
  const [glowingFragmentIds, setGlowingFragmentIds] = useState<Set<string>>(new Set());
  const [glowDimFragmentIds, setGlowDimFragmentIds] = useState<Set<string>>(new Set());

  const applyConnectionResult = useCallback((params: {
    tier: ConnectionTier;
    points: number;
    sourceFragmentId: string;
    targetFragmentId: string;
  }): { thresholdReached: boolean } => {
    const { tier, points, sourceFragmentId, targetFragmentId } = params;
    let thresholdReached = false;

    setProgressState(prev => {
      const newCurrent = prev.current + points;
      const newLifetime = prev.totalLifetime + points;
      saveLifetimeScore(newLifetime);
      let next: ProgressState;
      if (newCurrent >= PROGRESS_THRESHOLD) {
        thresholdReached = true;
        next = { current: 0, threshold: PROGRESS_THRESHOLD, totalLifetime: newLifetime };
      } else {
        next = { current: newCurrent, threshold: PROGRESS_THRESHOLD, totalLifetime: newLifetime };
      }
      saveProgressState(next);
      return next;
    });

    if (tier === 'non-obvious-user') {
      setGlowingFragmentIds(prev => {
        const next = new Set(prev);
        next.add(sourceFragmentId);
        next.add(targetFragmentId);
        return next;
      });
    } else if (tier === 'non-obvious-claude') {
      setGlowDimFragmentIds(prev => {
        const next = new Set(prev);
        next.add(sourceFragmentId);
        next.add(targetFragmentId);
        return next;
      });
      setGlowingFragmentIds(prev => {
        const next = new Set(prev);
        next.add(sourceFragmentId);
        next.add(targetFragmentId);
        return next;
      });
    } else {
      // obvious — subtle glow (dim)
      setGlowDimFragmentIds(prev => {
        const next = new Set(prev);
        next.add(sourceFragmentId);
        next.add(targetFragmentId);
        return next;
      });
      setGlowingFragmentIds(prev => {
        const next = new Set(prev);
        next.add(sourceFragmentId);
        next.add(targetFragmentId);
        return next;
      });
    }

    return { thresholdReached };
  }, []);

  const clearGlow = useCallback((fragmentId: string) => {
    setGlowingFragmentIds(prev => {
      const next = new Set(prev);
      next.delete(fragmentId);
      return next;
    });
    setGlowDimFragmentIds(prev => {
      const next = new Set(prev);
      next.delete(fragmentId);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgressState(prev => ({
      ...prev,
      current: 0,
    }));
  }, []);

  return [
    { progressState, glowingFragmentIds, glowDimFragmentIds },
    { applyConnectionResult, clearGlow, resetProgress },
  ];
}
