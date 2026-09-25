import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Search, AlertTriangle, RotateCw } from 'lucide-react';
import { STATUT_RDV_LABELS } from '../utils/constants';

/** Concatene des classes en ignorant les valeurs vides. */
export function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function Card({ children, className = '', ...props }) {
  return (
    <div className={cx('bg-white rounded-2xl border border-(--color-petrol-100) shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

const BUTTON_BASE = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const BUTTON_VARIANTS = {
  primary: 'bg-(--color-petrol-600) text-white hover:bg-(--color-petrol-700)',
  amber: 'bg-(--color-amber-400) text-(--color-petrol-900) hover:bg-(--color-amber-500)',
  ghost: 'bg-transparent text-(--color-petrol-600) hover:bg-(--color-petrol-50)',
  outline: 'bg-white border border-(--color-petrol-100) text-(--color-petrol-700) hover:border-(--color-petrol-400)',
  danger: 'bg-(--color-clay-100) text-(--color-clay-500) hover:bg-(--color-clay-100)/70',
  success: 'bg-(--color-sage-100) text-(--color-sage-500) hover:bg-(--color-sage-100)/70',
};

export function buttonClasses(variant = 'primary', className = '') {
  return cx(BUTTON_BASE, BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary, className);
}

export function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  return (
    <button type={type} className={buttonClasses(variant, className)} {...props}>
      {children}
    </button>
  );
}

/**
 * Lien avec l'apparence d'un bouton. Remplace le motif <Link><Button/></Link>
 * qui imbriquait un <button> dans un <a> (HTML invalide, double tabulation au clavier).
 */
export function ButtonLink({ to, children, variant = 'primary', className = '', ...props }) {
  return (
    <Link to={to} className={buttonClasses(variant, className)} {...props}>
      {children}
    </Link>
  );
}

export function StatutBadge({ statut }) {
  const styles = {
    EN_ATTENTE: 'bg-(--color-amber-400)/20 text-(--color-amber-500)',
    CONFIRME: 'bg-(--color-sage-100) text-(--color-sage-500)',
    ANNULE: 'bg-(--color-clay-100) text-(--color-clay-500)',
    TERMINE: 'bg-(--color-petrol-100) text-(--color-petrol-600)',
    NO_SHOW: 'bg-(--color-clay-100) text-(--color-clay-500)',
  };
  return (
    <span className={cx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', styles[statut] || 'bg-(--color-petrol-50) text-(--color-ink-600)')}>
      {STATUT_RDV_LABELS[statut] || statut}
    </span>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className={cx('animate-spin rounded-full border-2 border-(--color-petrol-100) border-t-(--color-petrol-600)', className)}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex justify-center py-20">
      <Spinner className="w-7 h-7" />
    </div>
  );
}

export function FieldLabel({ children, htmlFor, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-(--color-ink-600) mb-1.5">
      {children}
      {required && <span className="text-(--color-clay-500) ml-0.5">*</span>}
    </label>
  );
}

const INPUT_BASE = 'w-full px-3.5 py-2.5 rounded-xl border border-(--color-petrol-100) bg-white text-(--color-ink-900) placeholder:text-(--color-ink-300) focus:border-(--color-petrol-400) focus:ring-2 focus:ring-(--color-petrol-100) outline-none transition-shadow disabled:bg-(--color-petrol-50) disabled:text-(--color-ink-600)';

// Correction : auparavant {...props} ecrasait la className de base. Un
// className="pl-10" faisait donc disparaitre tout le style du champ.
export function TextInput({ className = '', ...props }) {
  return <input className={cx(INPUT_BASE, className)} {...props} />;
}

export function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={cx(INPUT_BASE, 'pr-11', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-(--color-ink-300) hover:text-(--color-petrol-600)"
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function SearchInput({ className = '', ...props }) {
  return (
    <div className={cx('relative', className)}>
      <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-ink-300) pointer-events-none" />
      <input type="search" className={cx(INPUT_BASE, 'pl-10')} {...props} />
    </div>
  );
}

export function Select({ className = '', ...props }) {
  return <select className={cx(INPUT_BASE, className)} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={cx(INPUT_BASE, 'resize-none', className)} {...props} />;
}

const STATUT_COMPTE_STYLES = {
  EN_ATTENTE: 'bg-(--color-amber-400)/20 text-(--color-amber-500)',
  APPROUVE: 'bg-(--color-sage-100) text-(--color-sage-500)',
  REJETE: 'bg-(--color-clay-100) text-(--color-clay-500)',
};

const STATUT_COMPTE_LABELS = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuve',
  REJETE: 'Rejete',
};

export function StatutCompteBadge({ statut }) {
  return (
    <span className={cx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', STATUT_COMPTE_STYLES[statut] || 'bg-(--color-petrol-50) text-(--color-ink-600)')}>
      {STATUT_COMPTE_LABELS[statut] || statut}
    </span>
  );
}

export const ROLE_LABELS = {
  PATIENT: 'Patient',
  MEDECIN: 'Medecin',
  ADMIN: 'Administrateur',
  DIRECTEUR: 'Directeur',
  SECRETAIRE: 'Secretaire',
};

export function RoleBadge({ role }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-(--color-petrol-50) text-(--color-petrol-600)">
      {ROLE_LABELS[role] || role}
    </span>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">{title}</h1>
        {description && <p className="text-(--color-ink-600) mt-1">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2 flex-wrap print:hidden">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-(--color-petrol-50) flex items-center justify-center mb-4">
          <Icon size={22} className="text-(--color-petrol-400)" strokeWidth={1.75} />
        </div>
      )}
      <h3 className="font-display font-semibold text-(--color-ink-900) mb-1">{title}</h3>
      {description && <p className="text-sm text-(--color-ink-600) max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

/** Etat d'erreur de chargement, avec bouton pour reessayer. */
export function ErrorState({ message, onRetry }) {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center text-center py-12 px-6">
        <div className="w-12 h-12 rounded-full bg-(--color-clay-100) flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-(--color-clay-500)" strokeWidth={1.75} />
        </div>
        <h3 className="font-display font-semibold text-(--color-ink-900) mb-1">Chargement impossible</h3>
        <p className="text-sm text-(--color-ink-600) max-w-sm mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={() => onRetry()}>
            <RotateCw size={15} /> Reessayer
          </Button>
        )}
      </div>
    </Card>
  );
}

export function Alert({ variant = 'error', icon: Icon = AlertTriangle, children, className = '' }) {
  const styles = {
    error: 'bg-(--color-clay-100) text-(--color-clay-500)',
    warning: 'bg-(--color-amber-400)/15 text-(--color-amber-500)',
    success: 'bg-(--color-sage-100) text-(--color-sage-500)',
    info: 'bg-(--color-petrol-50) text-(--color-petrol-600)',
  };
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cx('flex items-start gap-2 text-sm rounded-xl px-3.5 py-3', styles[variant], className)}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, accent, hint }) {
  return (
    <Card className="p-5">
      <div className={cx('w-9 h-9 rounded-lg flex items-center justify-center mb-3', accent)}>
        <Icon size={18} />
      </div>
      <p className="font-display font-bold text-2xl text-(--color-ink-900)">{value}</p>
      <p className="text-sm text-(--color-ink-600) mt-0.5">{label}</p>
      {hint && <p className="text-xs text-(--color-ink-300) mt-1">{hint}</p>}
    </Card>
  );
}

/** Onglets en "pilules" avec compteur optionnel. */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cx(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              active
                ? 'bg-(--color-petrol-600) text-white'
                : 'bg-white border border-(--color-petrol-100) text-(--color-ink-600) hover:border-(--color-petrol-400)',
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cx('text-xs px-1.5 rounded-full', active ? 'bg-white/20' : 'bg-(--color-petrol-50)')}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Avatar({ text, className = '' }) {
  return (
    <div className={cx('w-10 h-10 rounded-full bg-(--color-petrol-50) flex items-center justify-center text-(--color-petrol-600) font-display font-semibold shrink-0', className)}>
      {text}
    </div>
  );
}
