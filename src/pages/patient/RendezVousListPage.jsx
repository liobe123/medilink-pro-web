import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarHeart, MapPin, Video, Building2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByPatient, updateStatutRendezVous } from '../../api/rendezVous';
import { Card, Button, Spinner, EmptyState, StatutBadge } from '../../components/ui';

function formatDateHeure(iso) {
  const d = new Date(iso);
  return {
    jour: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function RendezVousListPage() {
  const { user } = useAuth();
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getRendezVousByPatient(user.userId);
      data.sort((a, b) => new Date(b.dateHeure) - new Date(a.dateHeure));
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

  async function handleCancel(id) {
    setCancellingId(id);
    try {
      await updateStatutRendezVous(id, 'ANNULE');
      await load();
    } finally {
      setCancellingId(null);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Mes rendez-vous</h1>
          <p className="text-(--color-ink-600) mt-1">Retrouvez l'historique et vos prochains rendez-vous.</p>
        </div>
        <Link to="/patient/recherche">
          <Button variant="amber">Nouveau rendez-vous</Button>
        </Link>
      </div>

      {rendezVous.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarHeart}
            title="Aucun rendez-vous"
            description="Vous n'avez encore pris aucun rendez-vous."
            action={
              <Link to="/patient/recherche">
                <Button variant="amber">Trouver un specialiste</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {rendezVous.map((r) => {
            const { jour, heure } = formatDateHeure(r.dateHeure);
            const isPast = new Date(r.dateHeure) < new Date();
            const canCancel = !isPast && r.statut !== 'ANNULE' && r.statut !== 'TERMINE';
            return (
              <Card key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-semibold text-(--color-ink-900) capitalize">{jour}</p>
                    <StatutBadge statut={r.statut} />
                  </div>
                  <p className="text-sm text-(--color-ink-600) mt-0.5">{heure} · Dr {r.medecinNomComplet}</p>
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

                {canCancel && (
                  <Button
                    variant="danger"
                    onClick={() => handleCancel(r.id)}
                    disabled={cancellingId === r.id}
                    className="shrink-0"
                  >
                    <X size={15} />
                    {cancellingId === r.id ? 'Annulation...' : 'Annuler'}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
