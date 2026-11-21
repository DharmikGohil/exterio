import { useMemo } from 'react';

import { useToastContext } from '@/presentation/shared/contexts/ToastContext';
import { getErrorMessage } from '@/presentation/shared/utils/errors';

/** Short-lived notifications. `error` accepts any thrown value and shows its message. */
export function useToast() {
  const { showToast } = useToastContext();

  return useMemo(
    () => ({
      success: (message: string) => showToast('success', message),
      info: (message: string) => showToast('info', message),
      error: (error: unknown, fallback?: string) =>
        showToast('error', typeof error === 'string' ? error : getErrorMessage(error, fallback)),
    }),
    [showToast]
  );
}
