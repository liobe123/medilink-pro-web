import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, CheckCircle2, MapPin, BadgeCheck } from 'lucide-react';
import { getMedecin } from '../../api/medecins';
import { createRendezVous } from '../../api/rendezVous';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import SlotPicker from '../../components/SlotPicker';
import {
  Card, Button, ButtonLink, TextInput, FieldLabel, PageLoader, Alert, EmptyState, cx,
} from '../../components/ui';
import { TYPES_CONSULTATION } from '../../utils/constants';
import { formatDate, formatTarif, toLocalDateInput } from '../../utils/format';
import { downloadRendezVousIcs } from '../../utils/ics';
import { getErrorMessage } from '../../utils/errors';

/** Les 7 prochains jours, pour une selection en un clic. */
function prochainsJours(n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function NouveauRendezVousPage() {
  const { medecinId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [date, setDate] = useState(toLocalDateInput());
  const [heure, setHeure] = useState('');
  const [type, setType] = useState('PHYSIQUE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [cree, setCree] = useState(null);
  const [slotsVersion, setSlotsVersion] = useState(0);

  const { data: medecin, loading, error } = useApi(() => getMedecin(medecinId), [medecinId]);
  useDocumentTitle(medecin ? `RDV avec Dr ${medecin.nom}` : 'Nouveau rendez-vous');

  // Changement de date : l'heure choisie n'est plus valable.
  useEffect(() => { setHeure(''); }, [date]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!heure) {
      setErrorMsg('Choisissez un creneau horaire.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const dateHeure = `${date}T${heure}:00`;
      const created = await createRendezVous({ patientId: user.userId, medecinId, dateHeure, type });
      setCree({
        id: created?.id ?? 'nouveau',
        dateHeure,
        type,
        medecinNomComplet: `${medecin.prenom} ${medecin.nom}`,
        specialiteMedecin: medecin.specialite,
        etablissementNom: medecin.etablissementNom,
        ...created,
      });
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Ce creneau n'est plus disponible. Choisissez un autre horaire."));
      setHeure('');
      setSlotsVersion((v) => v + 1); // recharge les disponibilites
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader />;

  if (error || !medecin) {
    return (
      <Card>
        <EmptyState
          icon={CalendarPlus}
          title="Medecin introuvable"
          description="Ce profil n'existe plus ou n'est pas accessible."
          action={<ButtonLink to="/patient/recherche" variant="amber">Retour a la recherche</ButtonLink>}
        />
      </Card>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link to="/patient/recherche" className="inline-flex items-center gap-1.5 text-sm text-(--color-petrol-600) font-medium mb-5 hover:underline">
        <ArrowLeft size={15} /> Retour a la recherche
      </Link>

      <Card className="p-6">
        <div className="mb-6 pb-5 border-b border-(--color-petrol-100)">
          <div className="flex items-center gap-2">
            <p className="font-display font-bold text-xl text-(--color-petrol-700)">Dr {medecin.prenom} {medecin.nom}</p>
            {medecin.verifie && <BadgeCheck size={18} className="text-(--color-sage-500)" aria-label="Medecin verifie" />}
          </div>
          <p className="text-sm text-(--color-amber-500) font-medium">{medecin.specialite || 'Generaliste'}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-(--color-ink-600)">
            {medecin.etablissementNom && <span className="flex items-center gap-1.5"><MapPin size={14} /> {medecin.etablissementNom}</span>}
            {medecin.tarif != null && <span>Consultation : <strong className="text-(--color-ink-900)">{formatTarif(medecin.tarif)}</strong></span>}
          </div>
        </div>

        {cree ? (
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle2 size={40} className="text-(--color-sage-500) mb-3" />
            <p className="font-display font-semibold text-lg text-(--color-ink-900)">
              {cree.statut === 'CONFIRME' ? 'Rendez-vous confirme' : 'Demande de rendez-vous envoyee'}
            </p>
            <p className="text-sm text-(--color-ink-600) mt-1 capitalize">
              {formatDate(cree.dateHeure, { weekday: 'long', day: 'numeric', month: 'long' })} a {heure}
            </p>
            {cree.statut !== 'CONFIRME' && (
              <p className="text-sm text-(--color-ink-600) mt-1">Le cabinet confirmera votre creneau.</p>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <Button variant="outline" onClick={() => downloadRendezVousIcs(cree)}>
                <CalendarPlus size={15} /> Ajouter a mon agenda
              </Button>
              <Button onClick={() => navigate('/patient/rendez-vous')}>Voir mes rendez-vous</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && <Alert>{errorMsg}</Alert>}

            <div>
              <FieldLabel>Type de consultation</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {TYPES_CONSULTATION.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    aria-pressed={type === t.value}
                    className={cx(
                      'px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                      type === t.value
                        ? 'border-(--color-petrol-600) bg-(--color-petrol-50) text-(--color-petrol-700)'
                        : 'border-(--color-petrol-100) text-(--color-ink-600) hover:border-(--color-petrol-400)',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Date</FieldLabel>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {prochainsJours().map((d) => {
                  const key = toLocalDateInput(d);
                  const active = key === date;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDate(key)}
                      aria-pressed={active}
                      className={cx(
                        'shrink-0 w-16 py-2 rounded-xl border text-center transition-colors',
                        active
                          ? 'bg-(--color-petrol-600) border-(--color-petrol-600) text-white'
                          : 'bg-white border-(--color-petrol-100) hover:border-(--color-petrol-400)',
                      )}
                    >
                      <span className={cx('block text-xs capitalize', active ? 'text-white/80' : 'text-(--color-ink-600)')}>
                        {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </span>
                      <span className="block font-display font-bold text-lg leading-tight">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>
              <TextInput
                type="date"
                required
                min={toLocalDateInput()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2"
                aria-label="Autre date"
              />
            </div>

            <div>
              <FieldLabel>Creneau</FieldLabel>
              <SlotPicker key={slotsVersion} medecinId={medecinId} date={date} value={heure} onChange={setHeure} />
            </div>

            <Button type="submit" disabled={submitting || !heure} className="w-full">
              <CalendarPlus size={16} />
              {submitting ? 'Envoi...' : heure ? `Reserver le ${formatDate(`${date}T00:00`, { day: 'numeric', month: 'long' })} a ${heure}` : 'Choisissez un creneau'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
