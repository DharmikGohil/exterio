import { useCallback, useState } from 'react';

interface DraftState<T> {
  signature: string;
  value: T;
}

/**
 * Local, editable copy of a server value.
 * The draft is replaced whenever `signature` (a stable fingerprint of the server value)
 * changes, e.g. after a save or a refetch, and is left alone otherwise.
 */
export function useSyncedDraft<T>(source: T, signature: string) {
  const [state, setState] = useState<DraftState<T>>({ signature, value: source });

  // Adjusting state during render is React's recommended way to reset on a changed input.
  if (state.signature !== signature) {
    setState({ signature, value: source });
  }
  const draft = state.signature === signature ? state.value : source;

  const updateDraft = useCallback((updater: (current: T) => T) => {
    setState((current) => ({ ...current, value: updater(current.value) }));
  }, []);

  const resetDraft = useCallback(() => {
    setState({ signature, value: source });
  }, [signature, source]);

  return { draft, updateDraft, resetDraft };
}
