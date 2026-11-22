import { useEffect, useState } from 'react';

import { prefersReducedMotion } from '@/presentation/shared/utils/motion';

/** Slowest pace, in characters a second: about the pace of a streamed chat reply. */
const MIN_CHARS_PER_SECOND = 200;
/** When far behind, the pace rises as if to close the gap in about this long. */
const CATCH_UP_SECONDS = 1;

/**
 * Text as if typed out: `text` can grow in pieces (or arrive in one go) and the returned
 * string follows it at a readable pace. The pace is set by elapsed time, not frames, so a
 * throttled background tab keeps up too. With reduced motion, or `animate` off, it is `text`.
 */
export function useTypewriter(text: string, animate: boolean) {
  const [shown, setShown] = useState(0);
  const isInstant = !animate || prefersReducedMotion();
  const visible = isInstant ? text.length : Math.min(shown, text.length);

  useEffect(() => {
    if (isInstant || shown >= text.length) {
      return;
    }
    const startedAt = performance.now();
    const frame = requestAnimationFrame((now) => {
      const seconds = Math.max(now - startedAt, 16) / 1000;
      setShown((current) => {
        const remaining = text.length - current;
        const perSecond = Math.max(MIN_CHARS_PER_SECOND, remaining / CATCH_UP_SECONDS);
        return Math.min(text.length, current + Math.max(1, Math.round(perSecond * seconds)));
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [isInstant, shown, text.length]);

  return { text: text.slice(0, visible), isTyping: visible < text.length };
}
