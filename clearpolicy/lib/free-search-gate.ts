"use client";

import { useState, useEffect, useCallback } from "react";

export const FREE_SEARCH_LIMIT = 2;
const STORAGE_KEY = "cp-free-searches";

export function getFreeSearchCount(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function incrementFreeSearchCount(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(getFreeSearchCount() + 1));
  } catch {}
}

export function isFreeSearchLimitReached(): boolean {
  return getFreeSearchCount() >= FREE_SEARCH_LIMIT;
}

/**
 * Hook that manages free-search gating for unsigned-in users.
 *
 * - `canSearch()` — read-only check, no side effects.
 * - `tryConsumeSearch()` — checks limit, increments count if allowed,
 *    sets `showGate=true` if blocked. Returns whether the call is allowed.
 */
export function useFreeSearchGate(isSignedIn: boolean) {
  const [remaining, setRemaining] = useState(FREE_SEARCH_LIMIT);
  const [showGate, setShowGate] = useState(false);

  const refreshRemaining = useCallback(() => {
    if (!isSignedIn) {
      setRemaining(Math.max(0, FREE_SEARCH_LIMIT - getFreeSearchCount()));
    }
  }, [isSignedIn]);

  useEffect(() => {
    refreshRemaining();
  }, [refreshRemaining]);

  const canSearch = useCallback((): boolean => {
    if (isSignedIn) return true;
    return !isFreeSearchLimitReached();
  }, [isSignedIn]);

  const tryConsumeSearch = useCallback((): boolean => {
    if (isSignedIn) return true;
    if (isFreeSearchLimitReached()) {
      setShowGate(true);
      return false;
    }
    incrementFreeSearchCount();
    setRemaining(Math.max(0, FREE_SEARCH_LIMIT - getFreeSearchCount()));
    return true;
  }, [isSignedIn]);

  const triggerGate = useCallback(() => setShowGate(true), []);
  const dismissGate = useCallback(() => setShowGate(false), []);

  return { remaining, showGate, canSearch, tryConsumeSearch, triggerGate, dismissGate };
}
