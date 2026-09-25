import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Fenetre modale accessible : fermeture par Echap ou clic sur le fond,
 * focus place dans la fenetre a l'ouverture, defilement de la page bloque.
 */
/**
 * Imprime uniquement le contenu de la modale ouverte (ex. une ordonnance),
 * sans la page situee derriere.
 */
export function imprimerModale() {
  document.body.classList.add('imprimer-modale');
  const cleanup = () => {
    document.body.classList.remove('imprimer-modale');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

export default function Modal({ open, onClose, title, description, children, size = 'md' }) {
  const panelRef = useRef(null);
  // onClose est souvent une fonction flechee recreee a chaque rendu : on la
  // garde dans une ref pour ne pas relancer l'effet (et voler le focus des champs).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

  return createPortal(
    <div className="modale-portail fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-(--color-petrol-900)/40 print:hidden" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${widths[size]} max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 outline-none print:max-h-none print:shadow-none print:max-w-none`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display font-semibold text-lg text-(--color-ink-900)">{title}</h2>
            {description && <p className="text-sm text-(--color-ink-600) mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="print:hidden p-1.5 rounded-lg text-(--color-ink-300) hover:text-(--color-ink-600) hover:bg-(--color-petrol-50)"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
