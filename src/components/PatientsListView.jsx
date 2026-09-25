import { useMemo, useState } from 'react';
import { Users, Phone, Mail } from 'lucide-react';
import { getAllPatients } from '../api/patients';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  Card, EmptyState, PageHeader, PageLoader, ErrorState, SearchInput, Avatar,
} from './ui';
import { initiales, matchesSearch } from '../utils/format';
import { getErrorMessage } from '../utils/errors';

/**
 * Vue lecture-seule de la liste des patients, partagee entre les espaces
 * Secretaire et Directeur (memes donnees, memes droits de lecture).
 */
export default function PatientsListView({ description }) {
  const [query, setQuery] = useState('');
  useDocumentTitle('Patients');
  const { data: patients, loading, error, reload } = useApi(() => getAllPatients(), []);

  const liste = useMemo(() => (patients || [])
    .filter((p) => matchesSearch(query, p.nom, p.prenom, `${p.prenom} ${p.nom}`, p.email, p.telephone))
    .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)), [patients, query]);

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  if (loading || !patients) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader title="Patients" description={description} />

      {patients.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Aucun patient" description="Les patients inscrits apparaitront ici." />
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <SearchInput
              className="flex-1 min-w-60"
              placeholder="Rechercher par nom, email ou telephone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <p className="text-sm text-(--color-ink-600)">
              {liste.length} / {patients.length} patient{patients.length > 1 ? 's' : ''}
            </p>
          </div>

          {liste.length === 0 ? (
            <Card><EmptyState icon={Users} title="Aucun resultat" description="Aucun patient ne correspond a votre recherche." /></Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {liste.map((p) => (
                <Card key={p.id} className="p-4 flex items-center gap-3">
                  <Avatar text={initiales(p.prenom, p.nom)} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-(--color-ink-900) truncate">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-(--color-ink-300) truncate">{p.email}</p>
                    {p.telephone && <p className="text-xs text-(--color-ink-300)">{p.telephone}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.telephone && (
                      <a href={`tel:${p.telephone.replace(/\s/g, '')}`} className="p-2 rounded-lg text-(--color-petrol-600) hover:bg-(--color-petrol-50)" aria-label={`Appeler ${p.prenom} ${p.nom}`}>
                        <Phone size={16} />
                      </a>
                    )}
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="p-2 rounded-lg text-(--color-petrol-600) hover:bg-(--color-petrol-50)" aria-label={`Ecrire a ${p.prenom} ${p.nom}`}>
                        <Mail size={16} />
                      </a>
                    )}
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
