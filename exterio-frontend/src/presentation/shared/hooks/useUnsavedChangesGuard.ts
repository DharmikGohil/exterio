import { useCallback, useEffect } from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';

/**
 * Stops the user from losing unsaved edits.
 * In-app navigation is paused (render a confirmation while `isBlocked`), and closing or
 * reloading the tab triggers the browser's own warning.
 *
 * @param isDirty whether there are unsaved changes
 * @param watchedSearchParam a query parameter that counts as "leaving" when it changes
 */
export function useUnsavedChangesGuard(isDirty: boolean, watchedSearchParam?: string) {
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (!isDirty) {
        return false;
      }
      if (currentLocation.pathname !== nextLocation.pathname) {
        return true;
      }
      if (!watchedSearchParam) {
        return false;
      }
      const current = new URLSearchParams(currentLocation.search).get(watchedSearchParam);
      const next = new URLSearchParams(nextLocation.search).get(watchedSearchParam);
      return current !== next;
    },
    [isDirty, watchedSearchParam]
  );

  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const stay = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  const leave = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  return { isBlocked: blocker.state === 'blocked', stay, leave };
}
