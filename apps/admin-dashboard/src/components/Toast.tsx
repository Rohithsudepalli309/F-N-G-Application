import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

type Variant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  variant: Variant;
  message: string;
}

interface ToastContextValue {
  toast: (variant: Variant, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (variant: Variant, message: string) => {
      const id = `a${++counter.current}`;
      setToasts((prev) => [...prev.slice(-4), { id, variant, message }]);
      setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const Icon = toast.variant === 'success' ? CheckCircle2 : toast.variant === 'error' ? XCircle : Info;
  const color = toast.variant === 'success' ? 'text-emerald-400' : toast.variant === 'error' ? 'text-red-400' : 'text-blue-400';

  return (
    <div className="pointer-events-auto relative flex items-start gap-3 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl pl-5 pr-4 py-3 min-w-[280px] max-w-sm overflow-hidden animate-toast-in">
      <div
        className={clsx(
          'absolute left-0 top-0 h-full w-1',
          toast.variant === 'success' && 'bg-emerald-500',
          toast.variant === 'error' && 'bg-red-500',
          toast.variant === 'info' && 'bg-blue-500',
        )}
      />
      <Icon size={17} className={clsx('shrink-0 mt-0.5', color)} />
      <p className="flex-1 text-sm text-slate-200 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 mt-0.5 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
