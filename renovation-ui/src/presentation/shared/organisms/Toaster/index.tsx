import { createPortal } from 'react-dom';

import { Icon, type IconName } from '@/presentation/shared/atoms/Icon';
import { useToastContext, type ToastTone } from '@/presentation/shared/contexts/ToastContext';
import { cn } from '@/presentation/shared/utils/cn';

const TONES: Record<ToastTone, { icon: IconName; iconClass: string }> = {
  success: { icon: 'success', iconClass: 'text-emerald-400' },
  info: { icon: 'info', iconClass: 'text-sky-400' },
  error: { icon: 'error', iconClass: 'text-red-400' },
};

/** Renders the queue of toast notifications. Mount once near the root. */
export function Toaster() {
  const { toasts, dismissToast } = useToastContext();

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-16 z-[60] flex flex-col items-center gap-2 p-4 sm:items-start"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl bg-stone-900 px-4 py-3 text-sm text-white shadow-raised'
          )}
        >
          <Icon
            name={TONES[toast.tone].icon}
            className={cn('mt-0.5', TONES[toast.tone].iconClass)}
          />
          <p className="min-w-0 flex-1 leading-relaxed">{toast.message}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismissToast(toast.id)}
            className="rounded p-0.5 text-stone-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Icon name="x" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
