import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getMedecin } from '../../api/medecins';
import { createRendezVous } from '../../api/rendezVous';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, TextInput, FieldLabel, Select, Spinner } from '../../components/ui';

export default function NouveauRendezVousPage() {
  const { medecinId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [medecin, setMedecin] = useState(null);
  const [loadingMedecin, setLoadingMedecin] = useState(true);
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [type, setType] = useState('PHYSIQUE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMedecin(medecinId)
      .then((data) => { if (!cancelled) setMedecin(data); })
      .catch(() => { if (!cancelled) setErrorMsg("Medecin introuvable."); })
      .finally(() => { if (!cancelled) setLoadingMedecin(false); });
    return () => { cancelled = true; };
  }, [medecinId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const dateHeure = `${date}T${heure}:00`;
      await createRendezVous({
        patientId: user.userId,
        medecinId,
        dateHeure,
        type,
      });
      setSuccess(true);
      setTimeout(() => navigate('/patient/rendez-vous'), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Ce creneau n'est plus disponible. Choisissez un autre horaire.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingMedecin) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/patient/recherche" className="inline-flex items-center gap-1.5 text-sm text-(--color-petrol-600) font-medium mb-5 hover:underline">
        <ArrowLeft size={15} /> Retour a la recherche
      </Link>

      <Card className="p-6">
        {medecin && (
          <div className="mb-5">
            <p className="font-display font-bold text-xl text-(--color-petrol-700)">Dr {medecin.prenom} {medecin.nom}</p>
            <p className="text-sm text-(--color-amber-500) font-medium">{medecin.specialite}</p>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center text-center py-8">
            <CheckCircle2 size={40} className="text-(--color-sage-500) mb-3" />
            <p className="font-display font-semibold text-lg text-(--color-ink-900)">Rendez-vous confirme !</p>
            <p className="text-sm text-(--color-ink-600) mt-1">Redirection vers vos rendez-vous...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="flex items-start gap-2 bg-(--color-clay-100) text-(--color-clay-500) text-sm rounded-xl px-3.5 py-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Date</FieldLabel>
                <TextInput
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Heure</FieldLabel>
                <TextInput
                  type="time"
                  required
                  value={heure}
                  onChange={(e) => setHeure(e.target.value)}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Type de consultation</FieldLabel>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="PHYSIQUE">Consultation physique</option>
                <option value="TELECONSULTATION">Teleconsultation</option>
              </Select>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              <CalendarPlus size={16} />
              {submitting ? 'Confirmation...' : 'Confirmer le rendez-vous'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
