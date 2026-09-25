import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from './Modal';
import { Button } from './ui';

const ConfirmContext = createContext(null);

/**
 * const confirm = useConfirm();
 * if (await confirm({ title: 'Supprimer ?', danger: true })) { ... }
 *
 * Les suppressions et annulations se faisaient auparavant en un seul clic,
 * sans possibilite de revenir en arriere.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((options) => new Promise((resolve) => {
    resolver.current = resolve;
    setState({
      title: 'Confirmer',
      message: '',
      confirmLabel: 'Confirmer',
      cancelLabel: 'Retour',
      danger: false,
      ...options,
    });
  }), []);

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!state} onClose={() => close(false)} title={state?.title} size="sm">
        {state?.message && <p className="text-sm text-(--color-ink-600) mb-6">{state.message}</p>}
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>{state?.cancelLabel}</Button>
          <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {state?.confirmLabel}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm doit etre utilise a l'interieur de ConfirmProvider");
  return ctx;
}
