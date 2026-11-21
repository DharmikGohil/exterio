import { useCallback, useState } from 'react';

function readStored(key: string, fallback: boolean): boolean {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : stored === 'true';
  } catch {
    return fallback;
  }
}

/** An on/off preference remembered in this browser, like showing name tags on the photo. */
export function useStoredToggle(key: string, initialValue: boolean) {
  const [isOn, setIsOn] = useState(() => readStored(key, initialValue));

  const toggle = useCallback(() => {
    setIsOn((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Storage can be unavailable (private mode); the toggle still works for this visit.
      }
      return next;
    });
  }, [key]);

  return { isOn, toggle };
}
