import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Check } from 'lucide-react';
import { getAllPatients } from '../../api/patients';
import { getAllMedecins } from '../../api/medecins';
import { createRendezVous } from '../../api/rendezVous';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import SlotPicker from '../../components/SlotPicker';
import {
  Card, Button, FieldLabel, TextInput, Select, SearchInput, PageHeader, PageLoader, ErrorState, Alert, cx,
} from '../../components/ui';
import { TYPES_CONSULTATION } from '../../utils/constants';
import { matchesSearch, toLocalDateInput, formatTarif } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

/**
 * NOUVEAU — prise de rendez-vous par le secretariat (patient au guichet ou
 * au telephone). Utilise les endpoints existants patients, medecins, rendez-vous.
 */
export default function SecretaireNouveauRdvPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [patientQuery, setPatientQuery] = useState('');
  const [patientId, setPatientId] = useState('');
  const [medecinId, setMedecinId] = useState('');
  const [date, setDate] = useState(toLocalDateInput());
  const [heure, setHeure] = useState('');
  const [type, setType] = useState('PHYSIQUE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [slotsVersion, setSlotsVersion] = useState(0);
  useDocumentTitle('Nouveau rendez-vous');

  const { data, loading, error, reload } = useApi(async () => {
    const [patients, medecins] = await Promise.all([getAllPatients(), getAllMedecins()]);
    return {
      patients: [...patients].sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)),
      // Seuls les medecins actifs et valides peuvent etre reserves.
      medecins: medecins.filter((m) => m.actif !== false && (!m.statutCompte || m.statutCompte === 'APPROUVE')).sort((a, b) => (a.specialite || '').localeCompare(b.specialite || '')),
    };
  }, []);

  useEffect(() => { setHeure(''); }, [date, medecinId]);

  const patientsFiltres = useMemo(() => (data?.patients || [])
    .filter((p) => matchesSearch(patientQuery, p.nom, p.prenom, p.email, p.telephone))
    .slice(0, 8), [data, patientQuery]);

  const patient = data?.patients.find((p) => String(p.id) === String(patientId));
  const medecin = data?.medecins.find((m) => String(m.id) === String(medecinId));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!patientId || !medecinId || !heure) {
      setErrorMsg('Selectionnez un patient, un medecin et un creneau.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await createRendezVous({ patientId, medecinId, dateHeure: `${date}T${heure}:00`, type });
      toast.success(`Rendez-vous cree pour ${patient.prenom} ${patient.nom}.`);
      navigate('/secretaire/agenda');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Ce creneau n'est plus disponible."));
      setHeure('');
      setSlotsVersion((v) => v + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  if (loading || !data) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Nouveau rendez-vous" description="Pour un patient au guichet ou au telephone." />

      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && <Alert>{errorMsg}</Alert>}

        <Card className="p-5 space-y-3">
          <FieldLabel required>Patient</FieldLabel>
          {patient ? (
            <div className="flex items-center justify-between gap-3 bg-(--color-petrol-50) rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-(--color-ink-900)">{patient.prenom} {patient.nom}</p>
                <p className="text-xs text-(--color-ink-600)">{[patient.telephone, patient.email].filter(Boolean).join(' / ')}</p>
              </div>
              <Button variant="ghost" onClick={() => setPatientId('')}>Changer</Button>
            </div>
          ) : (
            <>
              <SearchInput
                placeholder="Nom, telephone ou email du patient..."
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                autoFocus
              />
              <div className="divide-y divide-(--color-petrol-100) border border-(--color-petrol-100) rounded-xl overflow-hidden">
                {patientsFiltres.length === 0 && (
                  <p className="text-sm text-(--color-ink-600) px-4 py-3">
                    Aucun patient trouve. Le patient doit d'abord creer son compte sur MediLinkPro.
                  </p>
                )}
                {patientsFiltres.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPatientId(p.id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-(--color-petrol-50) transition-colors"
                  >
                    <span className="font-medium text-sm text-(--color-ink-900)">{p.prenom} {p.nom}</span>
                    <span className="block text-xs text-(--color-ink-600)">{p.telephone || p.email}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <FieldLabel required>Medecin</FieldLabel>
            <Select required value={medecinId} onChange={(e) => setMedecinId(e.target.value)}>
              <option value="">Selectionner un medecin</option>
              {data.medecins.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.specialite || 'Generaliste'} : Dr {m.prenom} {m.nom}
                </option>
              ))}
            </Select>
            {medecin && (
              <p className="text-xs text-(--color-ink-600) mt-1.5">
                {[medecin.etablissementNom, formatTarif(medecin.tarif)].filter(Boolean).join(' / ')}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Date</FieldLabel>
              <TextInput type="date" required min={toLocalDateInput()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Type</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {TYPES_CONSULTATION.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    aria-pressed={type === t.value}
                    className={cx(
                      'px-2 py-2.5 rounded-xl border text-xs font-medium transition-colors',
                      type === t.value
                        ? 'border-(--color-petrol-600) bg-(--color-petrol-50) text-(--color-petrol-700)'
                        : 'border-(--color-petrol-100) text-(--color-ink-600)',
                    )}
                  >
                    {t.value === 'PHYSIQUE' ? 'Physique' : 'Teleconsultation'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <FieldLabel required>Creneau</FieldLabel>
            {medecinId ? (
              <SlotPicker key={`${medecinId}-${slotsVersion}`} medecinId={medecinId} date={date} value={heure} onChange={setHeure} />
            ) : (
              <p className="text-sm text-(--color-ink-300)">Choisissez d'abord un medecin.</p>
            )}
          </div>
        </Card>

        <Button type="submit" disabled={submitting || !patientId || !medecinId || !heure} className="w-full">
          {submitting ? 'Creation...' : (<><Check size={16} /> Creer le rendez-vous</>)}
        </Button>
      </form>

      <p className="text-xs text-(--color-ink-300) flex items-center gap-1.5">
        <CalendarPlus size={13} /> Le rendez-vous apparaitra immediatement dans l'agenda du medecin.
      </p>
    </div>
  );
}
