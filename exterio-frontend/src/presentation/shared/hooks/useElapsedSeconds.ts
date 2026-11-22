import { useEffect, useState } from 'react';

const TICK_MS = 500;

/** Whole seconds since `isActive` last turned on; 0 while it is off. */
export function useElapsedSeconds(isActive: boolean): number {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Restarting the clock when it switches on is a reset on a changed input.
  if (isActive && startedAt === null) {
    setStartedAt(Date.now());
  } else if (!isActive && startedAt !== null) {
    setStartedAt(null);
  }

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [isActive]);

  return startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
}
