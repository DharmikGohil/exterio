import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (tone: ToastTone, message: string) => void;
  dismissToast: (id: number) => void;
}

const AUTO_DISMISS_MS: Record<ToastTone, number> = {
  success: 3500,
  info: 4500,
  error: 7000,
};
const MAX_VISIBLE = 4;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextIdRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextIdRef.current++;
      setToasts((current) => {
        // Repeating the same message (e.g. a retried request) should not stack up.
        const withoutDuplicate = current.filter((toast) => toast.message !== message);
        return [...withoutDuplicate, { id, tone, message }].slice(-MAX_VISIBLE);
      });
      window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS[tone]);
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}
