import { useMemo } from 'react';
import { Building2, Stethoscope, Users, BadgeCheck, CalendarCheck, UserX, FileText, Hourglass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllEtablissements } from '../../api/etablissements';
import { getAllMedecins } from '../../api/medecins';
import { getAllPatients } from '../../api/patients';
import { getStatistiques } from '../../api/dashboard';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Card, Spinner, StatCard, ErrorState } from '../../components/ui';
import { formatTarif } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

/** Barre horizontale proportionnelle (pas de dependance graphique). */
function BarRow({ label, value, max, suffix }) {
  const pct = max ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-(--color-ink-900) truncate pr-3">{label}</span>
        <span className="font-semibold text-(--color-petrol-700) shrink-0">{value}{suffix}</span>
      </div>
      <div className="h-2 rounded-full bg-(--color-petrol-50) overflow-hidden">
        <div className="h-full rounded-full bg-(--color-petrol-600)" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DirecteurDashboardPage() {
  const { user } = useAuth();
  useDocumentTitle('Tableau de bord');

  const { data, loading, error, reload } = useApi(async () => {
    const [etablissements, medecins, patients, indicateurs] = await Promise.all([
      getAllEtablissements(), getAllMedecins(), getAllPatients(),
      getStatistiques().catch(() => null), // indicateurs d'activite (GET /api/dashboard/statistiques)
    ]);
    return { etablissements, medecins, patients, indicateurs };
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const { etablissements, medecins, patients } = data;
    const parSpecialite = new Map();
    const parEtablissement = new Map();
    medecins.forEach((m) => {
      const s = m.specialite || 'Generaliste';
      parSpecialite.set(s, (parSpecialite.get(s) || 0) + 1);
      const e = m.etablissementNom || 'Non rattache';
      parEtablissement.set(e, (parEtablissement.get(e) || 0) + 1);
    });
    const tarifs = medecins.map((m) => m.tarif).filter((t) => t != null);
    const verifies = medecins.filter((m) => m.verifie).length;
    return {
      etablissements: etablissements.length,
      medecins: medecins.length,
      verifies,
      tauxVerification: medecins.length ? Math.round((verifies / medecins.length) * 100) : 0,
      patients: patients.length,
      patientsParMedecin: medecins.length ? (patients.length / medecins.length).toFixed(1) : '—',
      tarifMoyen: tarifs.length ? Math.round(tarifs.reduce((a, b) => a + b, 0) / tarifs.length) : null,
      specialites: Array.from(parSpecialite.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8),
      etablissementsTop: Array.from(parEtablissement.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [data]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
          Bonjour {user?.prenom} 👋
        </h1>
        <p className="text-(--color-ink-600) mt-1">Vue d'ensemble de votre reseau de sante.</p>
      </div>

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={reload} />
      ) : loading || !stats ? (
        <div className="flex justify-center py-10"><Spinner className="w-6 h-6" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Building2} label="Etablissements" value={stats.etablissements} accent="bg-(--color-petrol-50) text-(--color-petrol-600)" />
            <StatCard icon={Stethoscope} label="Medecins" value={stats.medecins} accent="bg-(--color-sage-100) text-(--color-sage-500)" hint={stats.tarifMoyen ? `Tarif moyen ${formatTarif(stats.tarifMoyen)}` : undefined} />
            <StatCard icon={BadgeCheck} label="Medecins verifies" value={`${stats.tauxVerification} %`} accent="bg-(--color-amber-400)/20 text-(--color-amber-500)" hint={`${stats.verifies} sur ${stats.medecins}`} />
            <StatCard icon={Users} label="Patients" value={stats.patients} accent="bg-(--color-clay-100) text-(--color-clay-500)" hint={`${stats.patientsParMedecin} par medecin`} />
          </div>

          {data.indicateurs && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={CalendarCheck} label="RDV aujourd'hui" value={data.indicateurs.rendezVousAujourdhui} accent="bg-(--color-petrol-50) text-(--color-petrol-600)" hint={`${data.indicateurs.rendezVousSemaine} cette semaine`} />
              <StatCard icon={FileText} label="Consultations ce mois" value={data.indicateurs.consultationsMois} accent="bg-(--color-sage-100) text-(--color-sage-500)" />
              <StatCard icon={UserX} label="Taux d'absence" value={`${data.indicateurs.tauxAbsence} %`} accent="bg-(--color-clay-100) text-(--color-clay-500)" hint="Rendez-vous non honores" />
              <StatCard icon={Hourglass} label="Comptes a valider" value={data.indicateurs.comptesEnAttente} accent="bg-(--color-amber-400)/20 text-(--color-amber-500)" />
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h2 className="font-display font-semibold text-(--color-ink-900) mb-4">Medecins par specialite</h2>
              {stats.specialites.length === 0 ? (
                <p className="text-sm text-(--color-ink-600)">Aucun medecin inscrit.</p>
              ) : (
                <div className="space-y-3">
                  {stats.specialites.map(([label, value]) => (
                    <BarRow key={label} label={label} value={value} max={stats.specialites[0][1]} />
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="font-display font-semibold text-(--color-ink-900) mb-4">Medecins par etablissement</h2>
              {stats.etablissementsTop.length === 0 ? (
                <p className="text-sm text-(--color-ink-600)">Aucun rattachement.</p>
              ) : (
                <div className="space-y-3">
                  {stats.etablissementsTop.map(([label, value]) => (
                    <BarRow key={label} label={label} value={value} max={stats.etablissementsTop[0][1]} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
