import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarHeart, Users, FileText, Clock, ArrowRight, CalendarCheck, Hourglass, Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByMedecin, updateStatutRendezVous } from '../../api/rendezVous';
import { getConsultationsByMedecin } from '../../api/consultations';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import { Card, Spinner, EmptyState, StatCard, StatutBadge, Button, ErrorState } from '../../components/ui';
import { formatDateHeure, formatHeure, isToday } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function MedecinDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [confirmingId, setConfirmingId] = useState(null);
  useDocumentTitle('Accueil medecin');

  const { data, loading, error, reload, setData } = useApi(async () => {
    const [rdvs, consultations] = await Promise.all([
      getRendezVousByMedecin(user.userId),
      getConsultationsByMedecin(user.userId).catch(() => []),
    ]);
    return { rdvs, consultations };
  }, [user.userId]);

  const stats = useMemo(() => {
    if (!data) return null;
    const now = new Date();
    const actifs = data.rdvs.filter((r) => r.statut !== 'ANNULE');
    const aVenir = actifs
      .filter((r) => r.statut !== 'TERMINE' && r.statut !== 'NO_SHOW' && new Date(r.dateHeure) > now)
      .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
    const aujourdhui = actifs
      .filter((r) => isToday(r.dateHeure))
      .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
    return {
      aVenir,
      aujourdhui,
      prochain: aVenir[0],
      enAttente: data.rdvs.filter((r) => r.statut === 'EN_ATTENTE' && new Date(r.dateHeure) > now).length,
      patients: new Set(data.rdvs.map((r) => r.patientId)).size,
      consultations: data.consultations.length,
    };
  }, [data]);

  async function confirmer(rdv) {
    setConfirmingId(rdv.id);
    try {
      await updateStatutRendezVous(rdv.id, 'CONFIRME');
      setData((prev) => ({ ...prev, rdvs: prev.rdvs.map((r) => (r.id === rdv.id ? { ...r, statut: 'CONFIRME' } : r)) }));
      toast.success(`Rendez-vous de ${rdv.patientNomComplet} confirme.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Confirmation impossible.'));
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
          Bonjour Dr {user?.prenom} 👋
        </h1>
        <p className="text-(--color-ink-600) mt-1">Voici un apercu de votre activite.</p>
      </div>

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={reload} />
      ) : loading || !stats ? (
        <Card className="p-8 flex justify-center"><Spinner className="w-6 h-6" /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={CalendarCheck} label="Aujourd'hui" value={stats.aujourdhui.length} accent="bg-(--color-petrol-50) text-(--color-petrol-600)" />
            <StatCard icon={Hourglass} label="A confirmer" value={stats.enAttente} accent="bg-(--color-amber-400)/20 text-(--color-amber-500)" />
            <StatCard icon={Users} label="Patients suivis" value={stats.patients} accent="bg-(--color-sage-100) text-(--color-sage-500)" />
            <StatCard icon={FileText} label="Consultations" value={stats.consultations} accent="bg-(--color-clay-100) text-(--color-clay-500)" />
          </div>

          {stats.prochain ? (
            <div className="relative overflow-hidden rounded-2xl bg-(--color-petrol-600) text-white p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-(--color-amber-400)/15" aria-hidden="true" />
              <p className="relative text-sm font-semibold text-(--color-amber-400) mb-2">Prochain rendez-vous</p>
              <h2 className="relative font-display font-bold text-xl sm:text-2xl mb-4 capitalize">
                {formatDateHeure(stats.prochain.dateHeure).jour} a {formatDateHeure(stats.prochain.dateHeure).heure}
              </h2>
              <p className="relative flex items-center gap-1.5 text-sm text-white/90">
                <Clock size={15} /> {stats.prochain.patientNomComplet}
              </p>
              <Link
                to="/medecin/agenda"
                className="relative inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-(--color-petrol-900) bg-(--color-amber-400) hover:bg-(--color-amber-500) px-4 py-2 rounded-xl transition-colors"
              >
                Voir mon agenda <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <Card>
              <EmptyState icon={CalendarHeart} title="Aucun rendez-vous a venir" description="Vos prochains rendez-vous patients apparaitront ici." />
            </Card>
          )}

          {stats.aujourdhui.length > 0 && (
            <section>
              <h2 className="font-display font-semibold text-lg text-(--color-ink-900) mb-3">Programme du jour</h2>
              <Card className="divide-y divide-(--color-petrol-100)">
                {stats.aujourdhui.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5 flex-wrap">
                    <div className="flex items-center gap-4">
                      <span className="font-display font-bold text-(--color-petrol-700) w-12">{formatHeure(r.dateHeure)}</span>
                      <span className="font-medium text-(--color-ink-900)">{r.patientNomComplet}</span>
                      <StatutBadge statut={r.statut} />
                    </div>
                    {r.statut === 'EN_ATTENTE' && (
                      <Button variant="success" className="py-1.5" disabled={confirmingId === r.id} onClick={() => confirmer(r)}>
                        <Check size={14} /> Confirmer
                      </Button>
                    )}
                  </div>
                ))}
              </Card>
            </section>
          )}
        </>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/medecin/agenda">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-petrol-50) flex items-center justify-center mb-3">
              <CalendarHeart size={18} className="text-(--color-petrol-600)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Mon agenda</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">
              {stats?.aVenir.length ? `${stats.aVenir.length} a venir` : 'Aucun rendez-vous planifie'}
            </p>
          </Card>
        </Link>

        <Link to="/medecin/patients">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-sage-100) flex items-center justify-center mb-3">
              <Users size={18} className="text-(--color-sage-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Mes patients</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Retrouvez vos patients et leur historique.</p>
          </Card>
        </Link>

        <Link to="/medecin/consultations?nouvelle=1">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-amber-400)/20 flex items-center justify-center mb-3">
              <FileText size={18} className="text-(--color-amber-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Nouvelle consultation</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Compte rendu, diagnostic et ordonnance.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
