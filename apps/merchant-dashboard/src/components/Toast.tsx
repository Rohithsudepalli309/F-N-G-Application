import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

// ── Types ────────────────────────────────────────────────────────────────────

type Variant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  variant: Variant;
  message: string;
}

interface ToastContextValue {
  toast: (variant: Variant, message: string) => void;
}

// ── Context & hook ────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

// ── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (variant: Variant, message: string) => {
      const id = `t${++counter.current}`;
      // Cap at 5 visible toasts; newest at bottom
      setToasts((prev) => [...prev.slice(-4), { id, variant, message }]);
      setTimeout(() => dismiss(id), 3600);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── Toaster ───────────────────────────────────────────────────────────────────

const STYLES: Record<Variant, { bar: string; icon: typeof CheckCircle2; iconCls: string }> = {
  success: { bar: 'bg-emerald-500', icon: CheckCircle2, iconCls: 'text-emerald-400' },
  error:   { bar: 'bg-red-500',     icon: XCircle,      iconCls: 'text-red-400'     },
  info:    { bar: 'bg-blue-500',    icon: Info,         iconCls: 'text-blue-400'    },
};

function Toaster({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(({ id, variant, message }) => {
        const { bar, icon: Icon, iconCls } = STYLES[variant];
        return (
          <div
            key={id}
            className="pointer-events-auto relative flex items-start gap-3 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl pl-5 pr-4 py-3 min-w-[280px] max-w-sm overflow-hidden animate-toast-in"
          >
            {/* Left colour bar */}
            <div className={`absolute left-0 top-0 h-full w-1 ${bar}`} />

            <Icon size={17} className={clsx('shrink-0 mt-0.5', iconCls)} />

            <p className="flex-1 text-sm text-slate-200 leading-snug">{message}</p>

            <button
              onClick={() => onDismiss(id)}
              aria-label="Dismiss notification"
              className="shrink-0 mt-0.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
