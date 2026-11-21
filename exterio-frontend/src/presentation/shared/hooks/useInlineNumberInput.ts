import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';

import { config } from '@/config';

export interface UseInlineNumberInputParams {
  /** The saved value. */
  value: number;
  /** Changes whenever fresh server data arrives, so the field can show it. */
  syncToken: number | string;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
}

const toText = (value: number) => String(Math.round(value * 100) / 100);

/**
 * State for a number field that saves itself: the typed text is committed after a short
 * pause, on Enter and on blur, and is replaced by the saved value whenever new server data
 * arrives while the field is not being edited.
 */
export function useInlineNumberInput({
  value,
  syncToken,
  onCommit,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
}: UseInlineNumberInputParams) {
  const [text, setText] = useState(() => toText(value));
  const [synced, setSynced] = useState({ value, syncToken });
  const [isFocused, setIsFocused] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const lastSentRef = useRef<number | null>(null);

  if (!isFocused && (!Object.is(synced.value, value) || synced.syncToken !== syncToken)) {
    setSynced({ value, syncToken });
    setText(toText(value));
  }

  // New server data makes the last value we sent irrelevant.
  useEffect(() => {
    lastSentRef.current = null;
  }, [value, syncToken]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const parse = useCallback(
    (raw: string): number | null => {
      if (raw.trim() === '') {
        return null;
      }
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
    },
    [min, max]
  );

  const commit = useCallback(
    (raw: string): boolean => {
      const parsed = parse(raw);
      if (parsed === null) {
        return false;
      }
      const baseline = lastSentRef.current ?? value;
      // Compare what the user sees: the field shows two decimals, so an untouched value
      // such as 123.456 must not be saved back as 123.46.
      if (toText(parsed) !== toText(baseline)) {
        lastSentRef.current = parsed;
        onCommit(parsed);
      }
      return true;
    },
    [parse, value, onCommit]
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      setText(raw);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => commit(raw), config.inlineEditDebounceMs);
    },
    [commit]
  );

  const handleFocus = useCallback(() => setIsFocused(true), []);

  const handleBlur = useCallback(() => {
    window.clearTimeout(timerRef.current);
    if (!commit(text)) {
      setText(toText(value));
    }
    // Acknowledge what the server has told us so far; only newer data replaces the text.
    setSynced({ value, syncToken });
    setIsFocused(false);
  }, [commit, text, value, syncToken]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.currentTarget.blur();
      } else if (event.key === 'Escape') {
        window.clearTimeout(timerRef.current);
        setText(toText(lastSentRef.current ?? value));
        event.currentTarget.blur();
      }
    },
    [value]
  );

  return {
    text,
    isInvalid: isFocused && parse(text) === null,
    inputProps: {
      value: text,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
    },
  };
}
