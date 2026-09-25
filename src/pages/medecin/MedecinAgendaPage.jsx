import { useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByMedecin, updateStatutRendezVous } from '../../api/rendezVous';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import RendezVousAgenda from '../../components/RendezVousAgenda';
import { PageHeader, PageLoader, ErrorState, ButtonLink } from '../../components/ui';
import { STATUT_RDV_LABELS } from '../../utils/constants';
import { getErrorMessage } from '../../utils/errors';

export default function MedecinAgendaPage() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [updatingId, setUpdatingId] = useState(null);
  useDocumentTitle('Mon agenda');

  const { data: rendezVous, loading, error, reload, setData } = useApi(
    () => getRendezVousByMedecin(user.userId),
    [user.userId],
  );

  async function handleStatutChange(rdv, statut) {
    if (statut === 'ANNULE') {
      const ok = await confirm({
        title: 'Annuler ce rendez-vous ?',
        message: `Le rendez-vous de ${rdv.patientNomComplet} sera annule et le creneau libere.`,
        confirmLabel: 'Annuler le rendez-vous',
        danger: true,
      });
      if (!ok) return;
    }
    setUpdatingId(rdv.id);
    try {
      await updateStatutRendezVous(rdv.id, statut);
      // Mise a jour locale : pas de rechargement complet de la liste.
      setData((prev) => prev.map((r) => (r.id === rdv.id ? { ...r, statut } : r)));
      toast.success(`Statut mis a jour : ${STATUT_RDV_LABELS[statut]}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Mise a jour du statut impossible.'));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mon agenda" description="Vos rendez-vous patients, passes et a venir." />

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={reload} />
      ) : loading || !rendezVous ? (
        <PageLoader />
      ) : (
        <RendezVousAgenda
          rendezVous={rendezVous}
          defaultPeriode="today"
          onStatutChange={handleStatutChange}
          updatingId={updatingId}
          renderActions={(r) => (r.statut === 'CONFIRME' || r.statut === 'EN_ATTENTE') && new Date(r.dateHeure) <= new Date(Date.now() + 3600000) && (
            <ButtonLink
              variant="outline"
              className="py-2"
              to={`/medecin/consultations?nouvelle=1&patientId=${r.patientId}&rdvId=${r.id}&type=${r.type || 'PHYSIQUE'}`}
            >
              <FilePlus2 size={15} /> Compte rendu
            </ButtonLink>
          )}
        />
      )}
    </div>
  );
}
