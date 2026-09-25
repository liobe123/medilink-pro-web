import { useMemo, useState } from 'react';
import { CalendarHeart, MapPin, Video, Building2 } from 'lucide-react';
import { Card, EmptyState, StatutBadge, Select, SearchInput, Tabs } from './ui';
import { STATUTS_RDV, STATUT_RDV_LABELS } from '../utils/constants';
import { formatHeure, isToday, matchesSearch, toLocalDateInput } from '../utils/format';

const PERIODES = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'upcoming', label: 'A venir' },
  { value: 'past', label: 'Passes' },
  { value: 'all', label: 'Tous' },
];

function filtrePeriode(periode, r, now) {
  const d = new Date(r.dateHeure);
  if (periode === 'today') return isToday(d);
  if (periode === 'upcoming') return d >= now;
  if (periode === 'past') return d < now;
  return true;
}

function libelleJour(dayKey) {
  const today = toLocalDateInput();
  const tomorrow = toLocalDateInput(new Date(Date.now() + 86400000));
  if (dayKey === today) return "Aujourd'hui";
  if (dayKey === tomorrow) return 'Demain';
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Agenda filtrable partage par les espaces Medecin et Secretaire :
 * periode, statut, recherche par nom, et regroupement par jour.
 */
export default function RendezVousAgenda({
  rendezVous, showMedecin = false, onStatutChange, updatingId, renderActions, defaultPeriode = 'upcoming',
}) {
  const [periode, setPeriode] = useState(defaultPeriode);
  const [statut, setStatut] = useState('');
  const [query, setQuery] = useState('');

  const now = useMemo(() => new Date(), [rendezVous]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => Object.fromEntries(
    PERIODES.map((p) => [p.value, rendezVous.filter((r) => filtrePeriode(p.value, r, now)).length]),
  ), [rendezVous, now]);

  const groupes = useMemo(() => {
    const filtered = rendezVous
      .filter((r) => filtrePeriode(periode, r, now))
      .filter((r) => !statut || r.statut === statut)
      .filter((r) => matchesSearch(query, r.patientNomComplet, r.medecinNomComplet, r.etablissementNom))
      .sort((a, b) => (periode === 'past'
        ? new Date(b.dateHeure) - new Date(a.dateHeure)
        : new Date(a.dateHeure) - new Date(b.dateHeure)));

    const map = new Map();
    filtered.forEach((r) => {
      const key = toLocalDateInput(r.dateHeure);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return Array.from(map.entries());
  }, [rendezVous, periode, statut, query, now]);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Tabs
          value={periode}
          onChange={setPeriode}
          tabs={PERIODES.map((p) => ({ ...p, count: counts[p.value] }))}
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            className="flex-1"
            placeholder={showMedecin ? 'Rechercher un patient, un medecin...' : 'Rechercher un patient...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={statut} onChange={(e) => setStatut(e.target.value)} className="sm:w-52" aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            {STATUTS_RDV.map((s) => <option key={s} value={s}>{STATUT_RDV_LABELS[s]}</option>)}
          </Select>
        </div>
      </div>

      {groupes.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarHeart}
            title="Aucun rendez-vous"
            description={query || statut ? 'Aucun rendez-vous ne correspond a ces filtres.' : 'Aucun rendez-vous sur cette periode.'}
          />
        </Card>
      ) : (
        groupes.map(([dayKey, items]) => (
          <section key={dayKey} className="space-y-2.5">
            <h2 className="font-display font-semibold text-(--color-ink-900) capitalize flex items-center gap-2">
              {libelleJour(dayKey)}
              <span className="text-xs font-medium text-(--color-ink-300) normal-case">
                {items.length} rendez-vous
              </span>
            </h2>
            {items.map((r) => (
              <Card key={r.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="text-center shrink-0 w-14">
                    <p className="font-display font-bold text-lg text-(--color-petrol-700) leading-none">{formatHeure(r.dateHeure)}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-(--color-ink-900) truncate">{r.patientNomComplet}</p>
                      <StatutBadge statut={r.statut} />
                    </div>
                    {showMedecin && (
                      <p className="text-sm text-(--color-ink-600)">avec Dr {r.medecinNomComplet}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-(--color-ink-600) flex-wrap">
                      <span className="flex items-center gap-1">
                        {r.type === 'TELECONSULTATION' ? <Video size={13} /> : <Building2 size={13} />}
                        {r.type === 'TELECONSULTATION' ? 'Teleconsultation' : 'Consultation physique'}
                      </span>
                      {r.etablissementNom && (
                        <span className="flex items-center gap-1"><MapPin size={13} /> {r.etablissementNom}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {renderActions?.(r)}
                  {onStatutChange && (
                    <Select
                      value={r.statut}
                      disabled={updatingId === r.id}
                      onChange={(e) => onStatutChange(r, e.target.value)}
                      className="w-auto! text-sm"
                      aria-label="Changer le statut"
                    >
                      {STATUTS_RDV.map((s) => <option key={s} value={s}>{STATUT_RDV_LABELS[s]}</option>)}
                    </Select>
                  )}
                </div>
              </Card>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
