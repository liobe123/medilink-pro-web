import { MapPin, Phone, Navigation } from 'lucide-react';
import { Card } from './ui';

/** Carte d'etablissement partagee (lecture seule ou avec actions). */
export default function EtablissementCard({ etablissement: e, actions }) {
  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display font-semibold text-(--color-ink-900)">{e.nom}</p>
          {e.type && <p className="text-sm text-(--color-amber-500) font-medium">{e.type}</p>}
        </div>
        {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
      </div>
      <div className="mt-3 space-y-1 text-sm text-(--color-ink-600) flex-1">
        {e.adresse && <p className="flex items-center gap-1.5"><MapPin size={14} className="shrink-0" /> {e.adresse}</p>}
        {e.telephone && (
          <a href={`tel:${e.telephone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-(--color-petrol-600) w-fit">
            <Phone size={14} className="shrink-0" /> {e.telephone}
          </a>
        )}
      </div>
      {e.specialitesDisponibles?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {e.specialitesDisponibles.map((s) => (
            <span key={s} className="text-xs font-medium px-2 py-1 rounded-full bg-(--color-petrol-50) text-(--color-petrol-600)">
              {s}
            </span>
          ))}
        </div>
      )}
      {e.latitude != null && e.longitude != null && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${e.latitude},${e.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-petrol-600) hover:underline mt-3 w-fit"
        >
          <Navigation size={13} /> Voir sur la carte
        </a>
      )}
    </Card>
  );
}
