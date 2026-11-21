import { useEffect, useRef } from 'react';

/** Scrolls a list to its end whenever `trigger` changes (a new message, a pending reply). */
export function useScrollToLatest<T extends HTMLElement>(trigger: unknown) {
  const endRef = useRef<T>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [trigger]);

  return endRef;
}
