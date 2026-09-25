import { useMemo, useState } from 'react';
import { Users, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByMedecin } from '../../api/rendezVous';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import PatientHistoriqueModal from '../../components/PatientHistoriqueModal';
import {
  Card, EmptyState, PageHeader, PageLoader, ErrorState, SearchInput, Avatar, Button, Select,
} from '../../components/ui';
import { formatDate, matchesSearch } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function MedecinPatientsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [tri, setTri] = useState('recent');
  const [selected, setSelected] = useState(null);
  useDocumentTitle('Mes patients');

  const { data: patients, loading, error, reload } = useApi(async () => {
    const rdvs = await getRendezVousByMedecin(user.userId);
    const now = new Date();
    const map = new Map();
    rdvs.forEach((r) => {
      const p = map.get(r.patientId) || { id: r.patientId, nom: r.patientNomComplet, dernierRdv: null, prochainRdv: null, nbRdv: 0 };
      const d = new Date(r.dateHeure);
      p.nbRdv++;
      if (r.statut !== 'ANNULE') {
        if (d <= now && (!p.dernierRdv || d > new Date(p.dernierRdv))) p.dernierRdv = r.dateHeure;
        if (d > now && (!p.prochainRdv || d < new Date(p.prochainRdv))) p.prochainRdv = r.dateHeure;
      }
      map.set(r.patientId, p);
    });
    return Array.from(map.values());
  }, [user.userId]);

  const liste = useMemo(() => {
    const filtered = (patients || []).filter((p) => matchesSearch(query, p.nom));
    return filtered.sort((a, b) => {
      if (tri === 'nom') return (a.nom || '').localeCompare(b.nom || '');
      if (tri === 'frequence') return b.nbRdv - a.nbRdv;
      return new Date(b.dernierRdv || 0) - new Date(a.dernierRdv || 0);
    });
  }, [patients, query, tri]);

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  if (loading || !patients) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader title="Mes patients" description={`${patients.length} patient${patients.length > 1 ? 's' : ''} ayant pris rendez-vous avec vous.`} />

      {patients.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Aucun patient pour le moment" description="Vos patients apparaitront ici apres leur premier rendez-vous." />
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput className="flex-1" placeholder="Rechercher un patient..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select value={tri} onChange={(e) => setTri(e.target.value)} className="sm:w-56" aria-label="Trier">
              <option value="recent">Vus recemment</option>
              <option value="nom">Ordre alphabetique</option>
              <option value="frequence">Plus de rendez-vous</option>
            </Select>
          </div>

          {liste.length === 0 ? (
            <Card><EmptyState icon={Users} title="Aucun resultat" description="Aucun patient ne correspond a votre recherche." /></Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {liste.map((p) => (
                <Card key={p.id} className="p-4 flex items-center gap-3">
                  <Avatar text={p.nom?.charAt(0) || '?'} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-(--color-ink-900) truncate">{p.nom}</p>
                    <p className="text-xs text-(--color-ink-600)">
                      {p.nbRdv} rendez-vous{p.dernierRdv && ` · vu le ${formatDate(p.dernierRdv, { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </p>
                    {p.prochainRdv && (
                      <p className="text-xs text-(--color-petrol-600) font-medium">
                        Prochain : {formatDate(p.prochainRdv, { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" className="px-2.5 shrink-0" onClick={() => setSelected(p)} aria-label={`Historique de ${p.nom}`}>
                    <History size={17} />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <PatientHistoriqueModal patient={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
