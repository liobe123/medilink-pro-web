import { useEffect, useState } from 'react';
import { CalendarHeart, MapPin, Video, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByMedecin, updateStatutRendezVous } from '../../api/rendezVous';
import { Card, Spinner, EmptyState, StatutBadge, PageHeader, Select } from '../../components/ui';

function formatDateHeure(iso) {
  const d = new Date(iso);
  return {
    jour: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

const STATUTS_DISPONIBLES = ['EN_ATTENTE', 'CONFIRME', 'TERMINE', 'ANNULE', 'NO_SHOW'];

export default function MedecinAgendaPage() {
  const { user } = useAuth();
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getRendezVousByMedecin(user.userId);
      data.sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
      setRendezVous(data);
    } catch {
      setRendezVous([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.userId]);

  async function handleStatutChange(id, statut) {
    setUpdatingId(id);
    try {
      await updateStatutRendezVous(id, statut);
      await load();
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mon agenda" description="Vos rendez-vous patients, passes et a venir." />

      {rendezVous.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarHeart} title="Aucun rendez-vous" description="Vos rendez-vous patients apparaitront ici." />
        </Card>
      ) : (
        <div className="space-y-3">
          {rendezVous.map((r) => {
            const { jour, heure } = formatDateHeure(r.dateHeure);
            return (
              <Card key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-semibold text-(--color-ink-900) capitalize">{jour}</p>
                    <StatutBadge statut={r.statut} />
                  </div>
                  <p className="text-sm text-(--color-ink-600) mt-0.5">{heure} · {r.patientNomComplet}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-(--color-ink-600)">
                    <span className="flex items-center gap-1">
                      {r.type === 'TELECONSULTATION' ? <Video size={13} /> : <Building2 size={13} />}
                      {r.type === 'TELECONSULTATION' ? 'Teleconsultation' : 'Consultation physique'}
                    </span>
                    {r.etablissementNom && (
                      <span className="flex items-center gap-1"><MapPin size={13} /> {r.etablissementNom}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={r.statut}
                    disabled={updatingId === r.id}
                    onChange={(e) => handleStatutChange(r.id, e.target.value)}
                    className="!w-auto text-sm"
                  >
                    {STATUTS_DISPONIBLES.map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </Select>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
