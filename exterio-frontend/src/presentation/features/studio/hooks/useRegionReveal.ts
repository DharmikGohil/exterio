import { useCallback, useEffect, useMemo, useState } from 'react';

import { prefersReducedMotion } from '@/presentation/shared/utils/motion';

/** Time between one detected part appearing and the next. */
export const REVEAL_STEP_MS = 160;
/** How long "All done" stays up after the last part. */
export const REVEAL_DONE_MS = 3000;

interface RevealState {
  ids: string[];
  startedAt: number;
}

/**
 * Draws the parts Auto-detect returned one after another, instead of all at once. Detection
 * answers in one go, so this only paces how its real result is shown; with reduced motion
 * everything appears at once.
 */
export function useRegionReveal() {
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const start = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      return;
    }
    const startedAt = Date.now();
    setNow(startedAt);
    setReveal({
      ids,
      startedAt: prefersReducedMotion() ? startedAt - ids.length * REVEAL_STEP_MS : startedAt,
    });
  }, []);

  const stop = useCallback(() => setReveal(null), []);

  const elapsed = reveal ? now - reveal.startedAt : 0;
  const total = reveal?.ids.length ?? 0;
  const shown = reveal ? Math.min(total, Math.floor(elapsed / REVEAL_STEP_MS) + 1) : 0;
  const isDone = reveal !== null && shown >= total;
  const isOver = isDone && elapsed >= total * REVEAL_STEP_MS + REVEAL_DONE_MS;

  useEffect(() => {
    if (!reveal || isOver) {
      return undefined;
    }
    const timer = window.setInterval(() => setNow(Date.now()), REVEAL_STEP_MS / 2);
    return () => window.clearInterval(timer);
  }, [reveal, isOver]);

  useEffect(() => {
    if (isOver) {
      setReveal(null);
    }
  }, [isOver]);

  const hiddenIds = useMemo(() => new Set(reveal ? reveal.ids.slice(shown) : []), [reveal, shown]);
  const freshIds = useMemo(
    () => new Set(reveal && !isDone ? reveal.ids.slice(0, shown) : []),
    [reveal, shown, isDone]
  );

  return {
    isActive: reveal !== null,
    isDone,
    shown,
    total,
    /** Not drawn yet. */
    hiddenIds,
    /** Drawn during this reveal, so they animate in. */
    freshIds,
    /** The part drawn most recently. */
    latestId: reveal && shown > 0 ? reveal.ids[shown - 1] : null,
    start,
    stop,
  };
}
