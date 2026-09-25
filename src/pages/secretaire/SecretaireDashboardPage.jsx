import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarHeart, Users, Building2, CalendarPlus, CalendarCheck, Hourglass, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllRendezVous } from '../../api/rendezVous';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Card, StatCard, StatutBadge, ButtonLink, Spinner } from '../../components/ui';
import { formatHeure, isToday } from '../../utils/format';

export default function SecretaireDashboardPage() {
  const { user } = useAuth();
  useDocumentTitle('Accueil secretariat');
  const { data, loading } = useApi(() => getAllRendezVous(), []);

  const stats = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const jour = data.filter((r) => isToday(r.dateHeure) && r.statut !== 'ANNULE')
      .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
    return {
      jour,
      aConfirmer: data.filter((r) => r.statut === 'EN_ATTENTE' && new Date(r.dateHeure) > now).length,
      absences: data.filter((r) => r.statut === 'NO_SHOW').length,
    };
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
            Bonjour {user?.prenom} 👋
          </h1>
          <p className="text-(--color-ink-600) mt-1">Coordonnez les rendez-vous et l'accueil des patients.</p>
        </div>
        <ButtonLink to="/secretaire/rendez-vous/nouveau" variant="amber">
          <CalendarPlus size={16} /> Nouveau rendez-vous
        </ButtonLink>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Spinner className="w-6 h-6" /></div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={CalendarCheck} label="Rendez-vous aujourd'hui" value={stats.jour.length} accent="bg-(--color-petrol-50) text-(--color-petrol-600)" />
            <StatCard icon={Hourglass} label="A confirmer" value={stats.aConfirmer} accent="bg-(--color-amber-400)/20 text-(--color-amber-500)" />
            <StatCard icon={UserX} label="Absences enregistrees" value={stats.absences} accent="bg-(--color-clay-100) text-(--color-clay-500)" />
          </div>

          <section>
            <h2 className="font-display font-semibold text-lg text-(--color-ink-900) mb-3">Salle d'attente du jour</h2>
            {stats.jour.length === 0 ? (
              <Card className="p-5 text-sm text-(--color-ink-600)">Aucun rendez-vous prevu aujourd'hui.</Card>
            ) : (
              <Card className="divide-y divide-(--color-petrol-100)">
                {stats.jour.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-3 flex-wrap">
                    <span className="font-display font-bold text-(--color-petrol-700) w-12">{formatHeure(r.dateHeure)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-(--color-ink-900) truncate">{r.patientNomComplet}</p>
                      <p className="text-xs text-(--color-ink-600) truncate">Dr {r.medecinNomComplet}</p>
                    </div>
                    <StatutBadge statut={r.statut} />
                  </div>
                ))}
              </Card>
            )}
          </section>
        </>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/secretaire/agenda">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-petrol-50) flex items-center justify-center mb-3">
              <CalendarHeart size={18} className="text-(--color-petrol-600)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Agenda</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Filtrer, confirmer, marquer les absences.</p>
          </Card>
        </Link>

        <Link to="/secretaire/patients">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-sage-100) flex items-center justify-center mb-3">
              <Users size={18} className="text-(--color-sage-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Patients</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Rechercher un patient enregistre.</p>
          </Card>
        </Link>

        <Link to="/secretaire/etablissements">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-amber-400)/20 flex items-center justify-center mb-3">
              <Building2 size={18} className="text-(--color-amber-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Etablissements</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Coordonnees et specialites disponibles.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
