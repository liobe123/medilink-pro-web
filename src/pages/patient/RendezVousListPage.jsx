import { useMemo, useState } from 'react';
import { CalendarHeart, MapPin, Video, Building2, X, CalendarPlus, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByPatient, updateStatutRendezVous } from '../../api/rendezVous';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import {
  Card, Button, ButtonLink, EmptyState, StatutBadge, PageHeader, PageLoader, ErrorState, Tabs,
} from '../../components/ui';
import { formatDateHeure } from '../../utils/format';
import { downloadRendezVousIcs } from '../../utils/ics';
import { getErrorMessage } from '../../utils/errors';

// Delai minimum pour annuler en ligne (au-dela, le patient doit appeler le cabinet).
const DELAI_ANNULATION_HEURES = 2;

function categorie(r, now) {
  if (r.statut === 'ANNULE') return 'annules';
  if (new Date(r.dateHeure) >= now && r.statut !== 'TERMINE' && r.statut !== 'NO_SHOW') return 'avenir';
  return 'passes';
}

export default function RendezVousListPage() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [onglet, setOnglet] = useState('avenir');
  const [cancellingId, setCancellingId] = useState(null);
  useDocumentTitle('Mes rendez-vous');

  const { data, loading, error, reload, setData } = useApi(
    () => getRendezVousByPatient(user.userId),
    [user.userId],
  );

  const groupes = useMemo(() => {
    const now = new Date();
    const g = { avenir: [], passes: [], annules: [] };
    (data || []).forEach((r) => g[categorie(r, now)].push(r));
    g.avenir.sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
    g.passes.sort((a, b) => new Date(b.dateHeure) - new Date(a.dateHeure));
    g.annules.sort((a, b) => new Date(b.dateHeure) - new Date(a.dateHeure));
    return g;
  }, [data]);

  async function handleCancel(r) {
    const { jour, heure } = formatDateHeure(r.dateHeure);
    const ok = await confirm({
      title: 'Annuler ce rendez-vous ?',
      message: `Rendez-vous avec Dr ${r.medecinNomComplet}, ${jour} a ${heure}. Le creneau sera libere pour un autre patient.`,
      confirmLabel: 'Annuler le rendez-vous',
      cancelLabel: 'Garder',
      danger: true,
    });
    if (!ok) return;

    setCancellingId(r.id);
    try {
      await updateStatutRendezVous(r.id, 'ANNULE');
      setData((prev) => prev.map((x) => (x.id === r.id ? { ...x, statut: 'ANNULE' } : x)));
      toast.success('Rendez-vous annule.');
    } catch (err) {
      toast.error(getErrorMessage(err, "L'annulation a echoue."));
    } finally {
      setCancellingId(null);
    }
  }

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  if (loading || !data) return <PageLoader />;

  const liste = groupes[onglet];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes rendez-vous"
        description="Retrouvez l'historique et vos prochains rendez-vous."
        action={<ButtonLink to="/patient/recherche" variant="amber">Nouveau rendez-vous</ButtonLink>}
      />

      {data.length > 0 && (
        <Tabs
          value={onglet}
          onChange={setOnglet}
          tabs={[
            { value: 'avenir', label: 'A venir', count: groupes.avenir.length },
            { value: 'passes', label: 'Passes', count: groupes.passes.length },
            { value: 'annules', label: 'Annules', count: groupes.annules.length },
          ]}
        />
      )}

      {liste.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarHeart}
            title={data.length === 0 ? 'Aucun rendez-vous' : 'Rien ici pour le moment'}
            description={data.length === 0 ? "Vous n'avez encore pris aucun rendez-vous." : 'Aucun rendez-vous dans cette categorie.'}
            action={onglet === 'avenir' && <ButtonLink to="/patient/recherche" variant="amber">Trouver un specialiste</ButtonLink>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {liste.map((r) => {
            const { jour, heure } = formatDateHeure(r.dateHeure, { withYear: true });
            const heuresRestantes = (new Date(r.dateHeure) - new Date()) / 3600000;
            const isAvenir = onglet === 'avenir';
            const canCancel = isAvenir && heuresRestantes >= DELAI_ANNULATION_HEURES;
            return (
              <Card key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-semibold text-(--color-ink-900) capitalize">{jour}</p>
                    <StatutBadge statut={r.statut} />
                  </div>
                  <p className="text-sm text-(--color-ink-600) mt-0.5">{heure} avec Dr {r.medecinNomComplet}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-(--color-ink-600) flex-wrap">
                    <span className="flex items-center gap-1">
                      {r.type === 'TELECONSULTATION' ? <Video size={13} /> : <Building2 size={13} />}
                      {r.type === 'TELECONSULTATION' ? 'Teleconsultation' : 'Consultation physique'}
                    </span>
                    {r.etablissementNom && (
                      <span className="flex items-center gap-1"><MapPin size={13} /> {r.etablissementNom}</span>
                    )}
                  </div>
                  {isAvenir && !canCancel && (
                    <p className="text-xs text-(--color-amber-500) mt-2">
                      Moins de {DELAI_ANNULATION_HEURES} h avant le rendez-vous : contactez le cabinet pour annuler.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {isAvenir && (
                    <Button variant="outline" onClick={() => downloadRendezVousIcs(r)} title="Ajouter a mon agenda">
                      <CalendarPlus size={15} /> <span className="sm:hidden lg:inline">Agenda</span>
                    </Button>
                  )}
                  {canCancel && (
                    <Button variant="danger" onClick={() => handleCancel(r)} disabled={cancellingId === r.id}>
                      <X size={15} />
                      {cancellingId === r.id ? 'Annulation...' : 'Annuler'}
                    </Button>
                  )}
                  {!isAvenir && r.medecinId && (
                    <ButtonLink to={`/patient/rendez-vous/nouveau/${r.medecinId}`} variant="ghost">
                      <RotateCcw size={15} /> Reprendre RDV
                    </ButtonLink>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
