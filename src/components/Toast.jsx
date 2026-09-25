import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, className: 'border-(--color-sage-500)/30 text-(--color-sage-500)' },
  error: { icon: AlertTriangle, className: 'border-(--color-clay-500)/30 text-(--color-clay-500)' },
  info: { icon: Info, className: 'border-(--color-petrol-400)/30 text-(--color-petrol-600)' },
};

/**
 * Notifications non bloquantes. Avant, la plupart des erreurs d'API etaient
 * avalees silencieusement (catch vide) : l'utilisateur cliquait sans retour.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, duration = 4000) => {
    const id = ++nextId.current;
    setToasts((list) => [...list.slice(-3), { id, type, message }]);
    if (duration) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (msg) => push('success', msg),
    error: (msg) => push('error', msg, 6000),
    info: (msg) => push('info', msg),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-50 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 flex flex-col gap-2 pointer-events-none print:hidden"
      >
        {toasts.map((t) => {
          const { icon: Icon, className } = STYLES[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 bg-white border rounded-xl shadow-lg px-4 py-3 ${className}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm text-(--color-ink-900) flex-1">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-(--color-ink-300) hover:text-(--color-ink-600)"
                aria-label="Fermer la notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit etre utilise a l'interieur de ToastProvider");
  return ctx;
}
