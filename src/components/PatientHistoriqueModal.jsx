import { Stethoscope, Pill, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { Spinner, EmptyState, Alert } from './ui';
import { useApi } from '../hooks/useApi';
import { getConsultationsByPatient } from '../api/consultations';
import { getOrdonnancesByPatient, readMedicaments } from '../api/ordonnances';
import { getPatient } from '../api/patients';
import { GROUPE_LABELS } from '../utils/constants';
import { formatDate } from '../utils/format';

/** Informations a connaitre avant de prescrire : allergies, antecedents, groupe sanguin. */
function FicheClinique({ fiche }) {
  if (!fiche) return null;
  const groupe = fiche.groupeSanguin && fiche.groupeSanguin !== 'INCONNU' ? GROUPE_LABELS[fiche.groupeSanguin] : null;
  if (!fiche.allergies && !fiche.antecedents && !groupe) return null;
  return (
    <div className="mb-5 space-y-2">
      {fiche.allergies && (
        <div className="flex items-start gap-2 bg-(--color-clay-100) text-(--color-clay-500) rounded-xl px-3.5 py-2.5 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span><strong>Allergies :</strong> {fiche.allergies}</span>
        </div>
      )}
      {(fiche.antecedents || groupe) && (
        <p className="text-sm text-(--color-ink-600) px-1">
          {groupe && <span className="mr-4"><strong className="text-(--color-ink-900)">Groupe :</strong> {groupe}</span>}
          {fiche.antecedents && <span><strong className="text-(--color-ink-900)">Antecedents :</strong> {fiche.antecedents}</span>}
        </p>
      )}
    </div>
  );
}

/**
 * Historique medical d'un patient (consultations + ordonnances), consultable
 * par le medecin avant ou pendant un rendez-vous.
 */
export default function PatientHistoriqueModal({ patient, onClose }) {
  const { data, loading, error } = useApi(async () => {
    const [consultations, ordonnances, fiche] = await Promise.allSettled([
      getConsultationsByPatient(patient.id),
      getOrdonnancesByPatient(patient.id),
      getPatient(patient.id),
    ]);
    if (consultations.status === 'rejected') throw consultations.reason;
    return {
      fiche: fiche.status === 'fulfilled' ? fiche.value : null,
      consultations: [...consultations.value].sort((a, b) => new Date(b.date) - new Date(a.date)),
      ordonnances: ordonnances.status === 'fulfilled' ? ordonnances.value : [],
    };
  }, [patient?.id], { enabled: !!patient });

  return (
    <Modal open={!!patient} onClose={onClose} size="lg" title={patient?.nom} description="Historique medical">
      {error ? (
        <Alert>Impossible de charger l'historique de ce patient.</Alert>
      ) : loading || !data ? (
        <div className="flex justify-center py-10"><Spinner className="w-6 h-6" /></div>
      ) : (
        <>
          <FicheClinique fiche={data.fiche} />
          {data.consultations.length === 0 ? (
        <EmptyState icon={Stethoscope} title="Aucune consultation" description="Aucune consultation enregistree pour ce patient." />
      ) : (
        <ol className="relative border-l-2 border-(--color-petrol-100) ml-2 space-y-5">
          {data.consultations.map((c) => {
            const ordo = data.ordonnances.find((o) => o.id === c.ordonnanceId || o.consultationId === c.id);
            return (
              <li key={c.id} className="pl-5 relative">
                <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-(--color-petrol-600) ring-4 ring-white" aria-hidden="true" />
                <p className="text-xs font-semibold text-(--color-petrol-600)">{formatDate(c.date)}</p>
                <p className="text-sm text-(--color-ink-600)">Dr {c.medecinNomComplet}</p>
                {c.motif && <p className="text-sm mt-1"><span className="font-medium">Motif :</span> {c.motif}</p>}
                {c.diagnostic && <p className="text-sm"><span className="font-medium">Diagnostic :</span> {c.diagnostic}</p>}
                {c.compteRendu && <p className="text-sm text-(--color-ink-600) mt-1 whitespace-pre-line">{c.compteRendu}</p>}
                {ordo && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-(--color-amber-500)">
                    <Pill size={13} className="mt-0.5 shrink-0" />
                    <span>{readMedicaments(ordo).map((m) => m.nom).join(', ') || 'Ordonnance delivree'}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
          )}
        </>
      )}
    </Modal>
  );
}
