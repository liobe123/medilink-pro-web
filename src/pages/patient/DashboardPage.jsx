import { Link } from 'react-router-dom';
import { CalendarHeart, MapPinned, FileHeart, Clock, MapPin, ArrowRight, CalendarPlus, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByPatient } from '../../api/rendezVous';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Card, Spinner, EmptyState, ButtonLink, ErrorState, StatutBadge } from '../../components/ui';
import { formatDateHeure } from '../../utils/format';
import { downloadRendezVousIcs } from '../../utils/ics';
import { getErrorMessage } from '../../utils/errors';

/** "dans 3 jours", "demain", "dans 2 h"... */
function compteARebours(iso) {
  const diff = new Date(iso) - new Date();
  const heures = Math.round(diff / 3600000);
  if (heures < 1) return 'dans moins d\'une heure';
  if (heures < 24) return `dans ${heures} h`;
  const jours = Math.round(heures / 24);
  return jours === 1 ? 'demain' : `dans ${jours} jours`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  useDocumentTitle('Accueil');
  const { data, loading, error, reload } = useApi(() => getRendezVousByPatient(user.userId), [user.userId]);
  const rendezVous = data || [];

  const aVenir = rendezVous
    .filter((r) => r.statut !== 'ANNULE' && r.statut !== 'TERMINE' && r.statut !== 'NO_SHOW' && new Date(r.dateHeure) > new Date())
    .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));

  const prochain = aVenir[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
          Bonjour {user?.prenom} 👋
        </h1>
        <p className="text-(--color-ink-600) mt-1">Voici un apercu de votre suivi medical.</p>
      </div>

      {/* Signature : carte "prochain rendez-vous" en evidence */}
      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={reload} />
      ) : loading ? (
        <Card className="p-8 flex justify-center">
          <Spinner className="w-6 h-6" />
        </Card>
      ) : prochain ? (
        <div className="relative overflow-hidden rounded-2xl bg-(--color-petrol-600) text-white p-6 sm:p-8">
          <div
            className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-(--color-amber-400)/15"
            aria-hidden="true"
          />
          <div
            className="absolute right-16 bottom-0 w-24 h-24 rounded-full bg-white/5"
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-sm font-semibold text-(--color-amber-400)">
              Prochain rendez-vous, {compteARebours(prochain.dateHeure)}
            </p>
            <StatutBadge statut={prochain.statut} />
          </div>
          <h2 className="relative font-display font-bold text-xl sm:text-2xl mb-4 capitalize">
            {formatDateHeure(prochain.dateHeure).jour} a {formatDateHeure(prochain.dateHeure).heure}
          </h2>
          <div className="relative flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <Clock size={15} /> Dr {prochain.medecinNomComplet}
            </span>
            {prochain.specialiteMedecin && (
              <span className="flex items-center gap-1.5">
                {prochain.specialiteMedecin}
              </span>
            )}
            {prochain.etablissementNom && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} /> {prochain.etablissementNom}
              </span>
            )}
            {prochain.type === 'TELECONSULTATION' && (
              <span className="flex items-center gap-1.5"><Video size={15} /> Teleconsultation</span>
            )}
          </div>
          <div className="relative flex flex-wrap items-center gap-2 mt-5">
            <Link
              to="/patient/rendez-vous"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-petrol-900) bg-(--color-amber-400) hover:bg-(--color-amber-500) px-4 py-2 rounded-xl transition-colors"
            >
              Voir tous mes rendez-vous <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              onClick={() => downloadRendezVousIcs(prochain)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors"
            >
              <CalendarPlus size={15} /> Ajouter a mon agenda
            </button>
          </div>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={CalendarHeart}
            title="Aucun rendez-vous a venir"
            description="Trouvez un specialiste pres de chez vous et prenez rendez-vous en quelques clics."
            action={<ButtonLink to="/patient/recherche" variant="amber">Trouver un specialiste</ButtonLink>}
          />
        </Card>
      )}

      {/* Raccourcis */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/patient/dossier">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-sage-100) flex items-center justify-center mb-3">
              <FileHeart size={18} className="text-(--color-sage-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Mon dossier medical</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Consultations, ordonnances et resultats.</p>
          </Card>
        </Link>

        <Link to="/patient/recherche">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-amber-400)/20 flex items-center justify-center mb-3">
              <MapPinned size={18} className="text-(--color-amber-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Trouver un specialiste</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Recherchez par specialite et proximite.</p>
          </Card>
        </Link>

        <Link to="/patient/rendez-vous">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-petrol-50) flex items-center justify-center mb-3">
              <CalendarHeart size={18} className="text-(--color-petrol-600)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Mes rendez-vous</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">
              {aVenir.length > 0 ? `${aVenir.length} a venir` : 'Aucun rendez-vous planifie'}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
