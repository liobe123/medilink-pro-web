import { Printer, QrCode, Stethoscope } from 'lucide-react';
import { Button } from './ui';
import { imprimerModale } from './Modal';
import { readCodeVerification, readMedicaments } from '../api/ordonnances';
import { formatDate } from '../utils/format';

/**
 * Affichage d'une ordonnance, imprimable (la mise en page d'impression masque
 * le reste de l'application grace aux classes print:hidden).
 */
export default function OrdonnanceView({ ordonnance, patientNom }) {
  const medicaments = readMedicaments(ordonnance);
  const code = readCodeVerification(ordonnance);
  const date = ordonnance.dateEmission || ordonnance.dateCreation || ordonnance.date;

  return (
    <div>
      <div className="border border-(--color-petrol-100) rounded-xl p-5 print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-(--color-petrol-100)">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-(--color-petrol-600) flex items-center justify-center text-white">
              <Stethoscope size={18} />
            </div>
            <div>
              <p className="font-display font-semibold text-(--color-petrol-700)">
                {ordonnance.medecinNomComplet ? `Dr ${ordonnance.medecinNomComplet}` : 'Ordonnance'}
              </p>
              {ordonnance.specialiteMedecin && <p className="text-xs text-(--color-ink-600)">{ordonnance.specialiteMedecin}</p>}
            </div>
          </div>
          <p className="text-sm text-(--color-ink-600) text-right">{formatDate(date)}</p>
        </div>

        {(patientNom || ordonnance.patientNomComplet) && (
          <p className="text-sm text-(--color-ink-600) mt-4">
            Patient : <span className="font-medium text-(--color-ink-900)">{patientNom || ordonnance.patientNomComplet}</span>
          </p>
        )}

        <ul className="mt-4 space-y-2.5">
          {medicaments.length === 0 && <li className="text-sm text-(--color-ink-300)">Aucun medicament renseigne.</li>}
          {medicaments.map((m, i) => (
            <li key={i} className="text-sm">
              <p className="font-medium text-(--color-ink-900)">{m.nom}</p>
              {(m.posologie || m.duree) && (
                <p className="text-(--color-ink-600)">{[m.posologie, m.duree].filter(Boolean).join(' pendant ')}</p>
              )}
            </li>
          ))}
        </ul>

        {ordonnance.instructions && (
          <p className="text-sm text-(--color-ink-600) mt-4 pt-4 border-t border-(--color-petrol-100) whitespace-pre-line">
            {ordonnance.instructions}
          </p>
        )}

        {ordonnance.dateExpiration && (
          <p className={`text-xs mt-4 ${ordonnance.expiree ? 'text-(--color-clay-500) font-semibold' : 'text-(--color-ink-600)'}`}>
            {ordonnance.expiree ? 'Expiree depuis le ' : "Valable jusqu'au "}
            {formatDate(`${ordonnance.dateExpiration}T00:00`)}
          </p>
        )}

        {code && (
          <div className="mt-4 flex items-center gap-2 bg-(--color-petrol-50) rounded-lg px-3 py-2 w-fit">
            <QrCode size={16} className="text-(--color-petrol-600)" />
            <span className="text-xs text-(--color-ink-600)">Code pharmacie</span>
            <span className="font-mono font-semibold text-sm text-(--color-petrol-700) tracking-wider">{code}</span>
          </div>
        )}
        {ordonnance.codeVerification && (
          <p className="text-xs text-(--color-ink-300) mt-2">
            Le pharmacien peut verifier ce code sur {window.location.host}/verifier-ordonnance
          </p>
        )}
      </div>

      <div className="flex justify-end mt-4 print:hidden">
        <Button variant="outline" onClick={imprimerModale}>
          <Printer size={15} /> Imprimer
        </Button>
      </div>
    </div>
  );
}
