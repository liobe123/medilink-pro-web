import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Building2, ArrowRight, Users, Stethoscope, ClipboardList, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getComptesEnAttente } from '../../api/admin';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Card, Spinner, StatCard, ErrorState } from '../../components/ui';
import { getErrorMessage } from '../../utils/errors';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  useDocumentTitle('Administration');
  const { data: enAttente, loading, error, reload } = useApi(() => getComptesEnAttente(), []);

  const stats = useMemo(() => {
    if (!enAttente) return null;
    const parRole = (role) => enAttente.filter((c) => c.role === role).length;
    const plusAncien = enAttente
      .map((c) => new Date(c.dateInscription))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a - b)[0];
    return {
      total: enAttente.length,
      medecins: parRole('MEDECIN'),
      secretaires: parRole('SECRETAIRE'),
      directeurs: parRole('DIRECTEUR'),
      joursAttenteMax: plusAncien ? Math.floor((Date.now() - plusAncien) / 86400000) : 0,
    };
  }, [enAttente]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
          Bonjour {user?.prenom} 👋
        </h1>
        <p className="text-(--color-ink-600) mt-1">Validez les inscriptions et gardez la plateforme fiable.</p>
      </div>

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={reload} />
      ) : loading || !stats ? (
        <div className="flex justify-center py-10"><Spinner className="w-6 h-6" /></div>
      ) : (
        <>
          {stats.total > 0 ? (
            <div className="relative overflow-hidden rounded-2xl bg-(--color-petrol-600) text-white p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-(--color-amber-400)/15" aria-hidden="true" />
              <p className="relative text-sm font-semibold text-(--color-amber-400) mb-2">Action requise</p>
              <h2 className="relative font-display font-bold text-xl sm:text-2xl mb-1">
                {stats.total} compte{stats.total > 1 ? 's' : ''} en attente de validation
              </h2>
              <p className="relative text-white/80 text-sm max-w-md">
                {stats.joursAttenteMax > 0
                  ? `La demande la plus ancienne attend depuis ${stats.joursAttenteMax} jour${stats.joursAttenteMax > 1 ? 's' : ''}.`
                  : 'Des professionnels attendent votre validation pour pouvoir se connecter.'}
              </p>
              <Link
                to="/admin/comptes"
                className="relative inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-(--color-petrol-900) bg-(--color-amber-400) hover:bg-(--color-amber-500) px-4 py-2 rounded-xl transition-colors"
              >
                Examiner les comptes <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <Card className="p-6">
              <p className="text-(--color-ink-600)">Aucun compte en attente de validation pour le moment.</p>
            </Card>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Stethoscope} label="Medecins en attente" value={stats.medecins} accent="bg-(--color-petrol-50) text-(--color-petrol-600)" />
            <StatCard icon={ClipboardList} label="Secretaires en attente" value={stats.secretaires} accent="bg-(--color-amber-400)/20 text-(--color-amber-500)" />
            <StatCard icon={Building2} label="Directeurs en attente" value={stats.directeurs} accent="bg-(--color-clay-100) text-(--color-clay-500)" />
            <StatCard icon={Clock} label="Attente max (jours)" value={stats.joursAttenteMax} accent="bg-(--color-sage-100) text-(--color-sage-500)" />
          </div>
        </>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/admin/comptes', icon: UserCheck, title: 'Comptes en attente', text: 'Approuvez ou refusez les inscriptions.', accent: 'bg-(--color-amber-400)/20 text-(--color-amber-500)' },
          { to: '/admin/utilisateurs', icon: Users, title: 'Utilisateurs', text: 'Activez ou suspendez des comptes.', accent: 'bg-(--color-sage-100) text-(--color-sage-500)' },
          { to: '/admin/etablissements', icon: Building2, title: 'Etablissements', text: 'Gerez les etablissements de sante.', accent: 'bg-(--color-petrol-50) text-(--color-petrol-600)' },
        ].map(({ to, icon: Icon, title, text, accent }) => (
          <Link key={to} to={to}>
            <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accent}`}>
                <Icon size={18} />
              </div>
              <h3 className="font-display font-semibold text-(--color-ink-900)">{title}</h3>
              <p className="text-sm text-(--color-ink-600) mt-1">{text}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
