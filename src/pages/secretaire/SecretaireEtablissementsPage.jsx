import { useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import { getAllEtablissements } from '../../api/etablissements';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import EtablissementCard from '../../components/EtablissementCard';
import {
  Card, EmptyState, PageHeader, PageLoader, ErrorState, SearchInput,
} from '../../components/ui';
import { matchesSearch } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function SecretaireEtablissementsPage() {
  const [query, setQuery] = useState('');
  useDocumentTitle('Etablissements');
  const { data: etablissements, loading, error, reload } = useApi(() => getAllEtablissements(), []);

  const liste = useMemo(() => (etablissements || []).filter((e) => matchesSearch(
    query, e.nom, e.type, e.adresse, ...(e.specialitesDisponibles || []),
  )), [etablissements, query]);

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  if (loading || !etablissements) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader title="Etablissements" description="Hopitaux et cliniques partenaires de MediLinkPro." />

      {etablissements.length > 0 && (
        <SearchInput placeholder="Nom, ville, specialite..." value={query} onChange={(e) => setQuery(e.target.value)} />
      )}

      {liste.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title={query ? 'Aucun resultat' : 'Aucun etablissement'}
            description={query ? 'Aucun etablissement ne correspond a votre recherche.' : 'Les etablissements ajoutes apparaitront ici.'}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {liste.map((e) => <EtablissementCard key={e.id} etablissement={e} />)}
        </div>
      )}
    </div>
  );
}
