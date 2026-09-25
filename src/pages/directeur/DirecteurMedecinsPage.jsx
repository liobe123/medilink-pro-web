import { useMemo, useState } from 'react';
import { Stethoscope, BadgeCheck, MapPin, Phone } from 'lucide-react';
import { getAllMedecins } from '../../api/medecins';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  Card, EmptyState, PageHeader, PageLoader, ErrorState, SearchInput, Select,
} from '../../components/ui';
import { formatTarif, matchesSearch } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function DirecteurMedecinsPage() {
  const [query, setQuery] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [verification, setVerification] = useState('');
  useDocumentTitle('Medecins');

  const { data: medecins, loading, error, reload } = useApi(() => getAllMedecins(), []);

  const specialites = useMemo(() => Array.from(new Set(
    (medecins || []).map((m) => m.specialite || 'Generaliste'),
  )).sort(), [medecins]);

  const liste = useMemo(() => (medecins || [])
    .filter((m) => matchesSearch(query, m.nom, m.prenom, `${m.prenom} ${m.nom}`, m.etablissementNom, m.numeroOrdre))
    .filter((m) => !specialite || (m.specialite || 'Generaliste') === specialite)
    .filter((m) => !verification || (verification === 'oui' ? m.verifie : !m.verifie))
    .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)), [medecins, query, specialite, verification]);

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  if (loading || !medecins) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader title="Medecins" description={`${medecins.length} medecin${medecins.length > 1 ? 's' : ''} rattache${medecins.length > 1 ? 's' : ''} a votre reseau.`} />

      {medecins.length === 0 ? (
        <Card>
          <EmptyState icon={Stethoscope} title="Aucun medecin" description="Les medecins inscrits apparaitront ici." />
        </Card>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-3">
            <SearchInput className="flex-1" placeholder="Nom, etablissement, numero d'ordre..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select value={specialite} onChange={(e) => setSpecialite(e.target.value)} className="md:w-52" aria-label="Specialite">
              <option value="">Toutes les specialites</option>
              {specialites.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select value={verification} onChange={(e) => setVerification(e.target.value)} className="md:w-44" aria-label="Verification">
              <option value="">Tous</option>
              <option value="oui">Verifies</option>
              <option value="non">Non verifies</option>
            </Select>
          </div>

          {liste.length === 0 ? (
            <Card><EmptyState icon={Stethoscope} title="Aucun resultat" description="Aucun medecin ne correspond a ces filtres." /></Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {liste.map((m) => (
                <Card key={m.id} className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-semibold text-(--color-ink-900)">Dr {m.prenom} {m.nom}</p>
                      <p className="text-sm text-(--color-amber-500) font-medium">{m.specialite || 'Generaliste'}</p>
                    </div>
                    {m.verifie ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-(--color-sage-500) bg-(--color-sage-100) px-2 py-1 rounded-full shrink-0">
                        <BadgeCheck size={13} /> Verifie
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-(--color-amber-500) bg-(--color-amber-400)/15 px-2 py-1 rounded-full shrink-0">
                        Non verifie
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-(--color-ink-600)">
                    {m.etablissementNom && <p className="flex items-center gap-1.5"><MapPin size={14} /> {m.etablissementNom}</p>}
                    {m.telephone && (
                      <a href={`tel:${m.telephone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-(--color-petrol-600) w-fit">
                        <Phone size={14} /> {m.telephone}
                      </a>
                    )}
                    {m.numeroOrdre && <p>Ordre n° {m.numeroOrdre}</p>}
                    {m.tarif != null && <p>Consultation : <span className="font-medium text-(--color-ink-900)">{formatTarif(m.tarif)}</span></p>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
