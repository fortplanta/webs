import { useState, useCallback } from 'react';
import './Toast.css';

type ToastVariant = 'default' | 'success' | 'danger' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  variant?: ToastVariant;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastView: React.FC<ToastProps> = ({ toast, onDismiss }) => (
  <div className={['nd-toast', toast.variant && toast.variant !== 'default' ? `nd-toast--${toast.variant}` : ''].filter(Boolean).join(' ')} role="alert">
    <span className="nd-toast__content">{toast.message}</span>
    <button className="nd-toast__close" onClick={() => onDismiss(toast.id)} aria-label="dismiss">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
      </svg>
    </button>
  </div>
);

/* Hook for managing toast state */
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = String(Date.now());
    setToasts(t => [...t, { id, message, variant }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  return { toasts, add, dismiss };
}

interface ToastRegionProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastRegion: React.FC<ToastRegionProps> = ({ toasts, onDismiss }) => (
  <div className="nd-toast-region" aria-live="polite" aria-label="notifications">
    {toasts.map(t => <ToastView key={t.id} toast={t} onDismiss={onDismiss} />)}
  </div>
);
