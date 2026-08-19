import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByMedecin } from '../../api/rendezVous';
import { Card, Spinner, EmptyState, PageHeader } from '../../components/ui';

export default function MedecinPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getRendezVousByMedecin(user.userId);
        const seen = new Map();
        data.forEach((r) => {
          if (!seen.has(r.patientId)) {
            seen.set(r.patientId, { id: r.patientId, nom: r.patientNomComplet, dernierRdv: r.dateHeure });
          } else if (new Date(r.dateHeure) > new Date(seen.get(r.patientId).dernierRdv)) {
            seen.get(r.patientId).dernierRdv = r.dateHeure;
          }
        });
        if (!cancelled) setPatients(Array.from(seen.values()));
      } catch {
        if (!cancelled) setPatients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user.userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mes patients" description="Les patients ayant pris rendez-vous avec vous." />

      {patients.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Aucun patient pour le moment" description="Vos patients apparaitront ici apres leur premier rendez-vous." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {patients.map((p) => (
            <Card key={p.id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-(--color-petrol-50) flex items-center justify-center text-(--color-petrol-600) font-display font-semibold shrink-0">
                {p.nom?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-(--color-ink-900)">{p.nom}</p>
                <p className="text-xs text-(--color-ink-300)">
                  Dernier rendez-vous : {new Date(p.dernierRdv).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
