import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [dismiss]
  );

  const getVariantStyles = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return {
          container: 'bg-emerald-950 text-emerald-50 border-emerald-800',
          subtext: 'text-emerald-200',
          closeBtn: 'text-emerald-300 hover:text-white hover:bg-emerald-900',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />,
        };
      case 'error':
        return {
          container: 'bg-rose-950 text-rose-50 border-rose-800',
          subtext: 'text-rose-200',
          closeBtn: 'text-rose-300 hover:text-white hover:bg-rose-900',
          icon: <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />,
        };
      case 'warning':
        return {
          container: 'bg-amber-950 text-amber-50 border-amber-800',
          subtext: 'text-amber-200',
          closeBtn: 'text-amber-300 hover:text-white hover:bg-amber-900',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />,
        };
      default:
        return {
          container: 'bg-slate-900 text-slate-50 border-slate-700',
          subtext: 'text-slate-300',
          closeBtn: 'text-slate-300 hover:text-white hover:bg-slate-800',
          icon: <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => {
          const style = getVariantStyles(item.variant);
          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-lg border shadow-elevated transition-all duration-200 ${style.container}`}
            >
              {style.icon}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-snug">{item.title}</p>
                {item.description && (
                  <p className={`text-xs mt-0.5 leading-relaxed ${style.subtext}`}>
                    {item.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className={`p-1 rounded transition ${style.closeBtn}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
