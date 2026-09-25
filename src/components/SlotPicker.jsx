import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { getCreneauxOccupes } from '../api/medecins';
import { useApi } from '../hooks/useApi';
import { HORAIRES_CABINET } from '../utils/constants';
import { toLocalDateInput, toSlotKey } from '../utils/format';
import { Spinner, cx } from './ui';

function genererCreneaux() {
  const { debut, fin, pasMinutes } = HORAIRES_CABINET;
  const slots = [];
  for (let minutes = debut * 60; minutes < fin * 60; minutes += pasMinutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

const CRENEAUX = genererCreneaux();

/**
 * Grille de creneaux pour une date donnee. Les creneaux deja reserves chez ce
 * medecin et les heures passees sont desactives : le patient ne tente plus
 * une reservation vouee a l'echec (le backend reste l'arbitre final).
 *
 * Si l'API est indisponible, la grille reste utilisable sans l'information
 * d'occupation (le backend refusera de toute facon un creneau deja pris).
 */
export default function SlotPicker({ medecinId, date, value, onChange }) {
  // Endpoint dedie : seulement les heures prises, sans le nom des autres patients.
  const { data: heuresPrises, loading, error } = useApi(
    () => getCreneauxOccupes(medecinId, date),
    [medecinId, date],
    { enabled: !!medecinId && !!date, initialData: [] },
  );

  // Minutes depuis minuit de chaque rendez-vous existant ce jour-la.
  const minutesPrises = useMemo(() => (heuresPrises || [])
    .map(toSlotKey)
    .filter((key) => key.startsWith(date))
    .map((key) => {
      const [h, m] = key.slice(11).split(':').map(Number);
      return h * 60 + m;
    }), [heuresPrises, date]);

  if (!date) {
    return <p className="text-sm text-(--color-ink-300)">Choisissez d'abord une date.</p>;
  }

  if (loading) {
    return <div className="flex justify-center py-6"><Spinner className="w-5 h-5" /></div>;
  }

  const now = new Date();
  const isToday = date === toLocalDateInput(now);
  const disponibles = CRENEAUX.filter((slot) => {
    const [h, m] = slot.split(':').map(Number);
    const debut = h * 60 + m;
    // Meme regle que le backend : pas de chevauchement avec un rendez-vous existant.
    if (minutesPrises.some((pris) => Math.abs(pris - debut) < HORAIRES_CABINET.pasMinutes)) return false;
    if (isToday && debut <= now.getHours() * 60 + now.getMinutes()) return false;
    return true;
  });

  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="Creneaux disponibles">
        {CRENEAUX.map((slot) => {
          const disabled = !disponibles.includes(slot);
          const selected = value === slot;
          return (
            <button
              key={slot}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(slot)}
              className={cx(
                'py-2 rounded-lg text-sm font-medium border transition-colors',
                selected && 'bg-(--color-petrol-600) border-(--color-petrol-600) text-white',
                !selected && !disabled && 'bg-white border-(--color-petrol-100) text-(--color-ink-900) hover:border-(--color-petrol-400)',
                disabled && 'bg-(--color-petrol-50) border-transparent text-(--color-ink-300) line-through cursor-not-allowed',
              )}
            >
              {slot}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-(--color-ink-600) mt-2">
        {disponibles.length === 0
          ? 'Aucun creneau libre ce jour-la. Essayez une autre date.'
          : `${disponibles.length} creneau${disponibles.length > 1 ? 'x' : ''} libre${disponibles.length > 1 ? 's' : ''}.`}
      </p>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-(--color-ink-300) mt-1">
          <Info size={12} /> Disponibilites non verifiees : le creneau sera confirme a la reservation.
        </p>
      )}
    </div>
  );
}
