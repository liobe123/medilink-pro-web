import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { Button, FieldLabel, TextInput, Textarea, Alert } from './ui';
import { useToast } from './Toast';
import { createOrdonnance, toOrdonnancePayload } from '../api/ordonnances';
import { getErrorMessage } from '../utils/errors';

const LIGNE_VIDE = { nom: '', posologie: '', duree: '' };

/**
 * Redaction d'une ordonnance numerique rattachee a une consultation.
 * Le module etait annonce sur la page d'accueil mais n'existait pas cote medecin.
 */
export default function OrdonnanceForm({ open, onClose, consultation, onCreated }) {
  const toast = useToast();
  const [lignes, setLignes] = useState([{ ...LIGNE_VIDE }]);
  const [instructions, setInstructions] = useState('');
  const [validite, setValidite] = useState('90');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  function reset() {
    setLignes([{ ...LIGNE_VIDE }]);
    setInstructions('');
    setValidite('90');
    setErrorMsg(null);
  }

  function updateLigne(index, field, value) {
    setLignes((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!lignes.some((l) => l.nom.trim())) {
      setErrorMsg('Ajoutez au moins un medicament.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await createOrdonnance(toOrdonnancePayload({
        consultationId: consultation.id,
        medicaments: lignes,
        instructions,
        dureeValiditeJours: validite,
      }));
      toast.success('Ordonnance enregistree et ajoutee au dossier du patient.');
      reset();
      onCreated?.(created);
      onClose();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Impossible d'enregistrer l'ordonnance."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Nouvelle ordonnance"
      description={consultation ? `Pour ${consultation.patientNomComplet}` : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <Alert>{errorMsg}</Alert>}

        <div className="space-y-3">
          <FieldLabel>Medicaments</FieldLabel>
          {lignes.map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <TextInput
                className="col-span-12 sm:col-span-5"
                placeholder="Paracetamol 500 mg"
                value={l.nom}
                onChange={(e) => updateLigne(i, 'nom', e.target.value)}
                aria-label={`Medicament ${i + 1}`}
              />
              <TextInput
                className="col-span-6 sm:col-span-4"
                placeholder="1 cp x 3/jour"
                value={l.posologie}
                onChange={(e) => updateLigne(i, 'posologie', e.target.value)}
                aria-label={`Posologie ${i + 1}`}
              />
              <TextInput
                className="col-span-4 sm:col-span-2"
                placeholder="5 jours"
                value={l.duree}
                onChange={(e) => updateLigne(i, 'duree', e.target.value)}
                aria-label={`Duree ${i + 1}`}
              />
              <button
                type="button"
                disabled={lignes.length === 1}
                onClick={() => setLignes((prev) => prev.filter((_, idx) => idx !== i))}
                className="col-span-2 sm:col-span-1 h-11 flex items-center justify-center rounded-lg text-(--color-clay-500) hover:bg-(--color-clay-100) disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Retirer ce medicament"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <Button variant="ghost" onClick={() => setLignes((prev) => [...prev, { ...LIGNE_VIDE }])}>
            <Plus size={15} /> Ajouter un medicament
          </Button>
        </div>

        <div>
          <FieldLabel>Instructions au patient</FieldLabel>
          <Textarea
            rows={3}
            placeholder="A prendre apres les repas. Revenir en consultation si la fievre persiste."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div className="w-40">
          <FieldLabel>Validite (jours)</FieldLabel>
          <TextInput type="number" min="1" max="365" value={validite} onChange={(e) => setValidite(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Enregistrement...' : "Enregistrer l'ordonnance"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
