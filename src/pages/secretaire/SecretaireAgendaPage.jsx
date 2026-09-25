import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { getAllRendezVous, updateStatutRendezVous } from '../../api/rendezVous';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import RendezVousAgenda from '../../components/RendezVousAgenda';
import { PageHeader, PageLoader, ErrorState, ButtonLink } from '../../components/ui';
import { STATUT_RDV_LABELS } from '../../utils/constants';
import { getErrorMessage } from '../../utils/errors';

export default function SecretaireAgendaPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [updatingId, setUpdatingId] = useState(null);
  useDocumentTitle('Agenda');

  const { data: rendezVous, loading, error, reload, setData } = useApi(() => getAllRendezVous(), []);

  async function handleStatutChange(rdv, statut) {
    if (statut === 'ANNULE') {
      const ok = await confirm({
        title: 'Annuler ce rendez-vous ?',
        message: `${rdv.patientNomComplet} avec Dr ${rdv.medecinNomComplet}. Pensez a prevenir le patient.`,
        confirmLabel: 'Annuler le rendez-vous',
        danger: true,
      });
      if (!ok) return;
    }
    setUpdatingId(rdv.id);
    try {
      await updateStatutRendezVous(rdv.id, statut);
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
      <PageHeader
        title="Agenda"
        description="Tous les rendez-vous, tous medecins confondus."
        action={(
          <ButtonLink to="/secretaire/rendez-vous/nouveau" variant="amber">
            <CalendarPlus size={16} /> Nouveau rendez-vous
          </ButtonLink>
        )}
      />

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={reload} />
      ) : loading || !rendezVous ? (
        <PageLoader />
      ) : (
        <RendezVousAgenda
          rendezVous={rendezVous}
          showMedecin
          defaultPeriode="today"
          onStatutChange={handleStatutChange}
          updatingId={updatingId}
        />
      )}
    </div>
  );
}
