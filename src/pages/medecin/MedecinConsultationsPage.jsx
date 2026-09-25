import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus, X, Pill, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getConsultationsByMedecin, createConsultation } from '../../api/consultations';
import { getRendezVousByMedecin } from '../../api/rendezVous';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import OrdonnanceForm from '../../components/OrdonnanceForm';
import {
  Card, Button, EmptyState, PageHeader, FieldLabel, TextInput, Textarea, Select,
  PageLoader, ErrorState, SearchInput, Alert,
} from '../../components/ui';
import { TYPES_CONSULTATION } from '../../utils/constants';
import { formatDate, matchesSearch } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const INITIAL_FORM = { patientId: '', motif: '', diagnostic: '', compteRendu: '', typeConsultation: 'PHYSIQUE' };

export default function MedecinConsultationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [rdvLie, setRdvLie] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [ordonnancePour, setOrdonnancePour] = useState(null);
  useDocumentTitle('Consultations');

  const { data, loading, error, reload } = useApi(async () => {
    const [consultations, rdvs] = await Promise.all([
      getConsultationsByMedecin(user.userId),
      getRendezVousByMedecin(user.userId),
    ]);
    const seen = new Map();
    rdvs.forEach((r) => seen.set(r.patientId, r.patientNomComplet));
    return {
      consultations: [...consultations].sort((a, b) => new Date(b.date) - new Date(a.date)),
      patients: Array.from(seen.entries())
        .map(([id, nom]) => ({ id, nom }))
        .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')),
    };
  }, [user.userId]);

  // Ouverture pre-remplie depuis l'agenda (?nouvelle=1&patientId=...&rdvId=...)
  useEffect(() => {
    if (searchParams.get('nouvelle')) {
      setForm({
        ...INITIAL_FORM,
        patientId: searchParams.get('patientId') || '',
        typeConsultation: searchParams.get('type') || 'PHYSIQUE',
      });
      setRdvLie(searchParams.get('rdvId'));
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const consultationsFiltrees = useMemo(() => (data?.consultations || []).filter(
    (c) => matchesSearch(query, c.patientNomComplet, c.motif, c.diagnostic),
  ), [data, query]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function fermerFormulaire() {
    setShowForm(false);
    setForm(INITIAL_FORM);
    setRdvLie(null);
    setErrorMsg(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      // Le backend passe le rendez-vous d'origine a TERMINE dans la meme transaction.
      const created = await createConsultation({
        patientId: form.patientId,
        rendezVousId: rdvLie || undefined,
        motif: form.motif,
        diagnostic: form.diagnostic,
        compteRendu: form.compteRendu,
        typeConsultation: form.typeConsultation,
      });

      const patientNom = data.patients.find((p) => String(p.id) === String(form.patientId))?.nom;
      toast.success('Consultation enregistree.');
      fermerFormulaire();
      await reload({ silent: true });
      // Enchainement naturel : proposer directement l'ordonnance.
      setOrdonnancePour({ ...created, patientId: created?.patientId ?? form.patientId, patientNomComplet: created?.patientNomComplet ?? patientNom });
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Impossible de creer la consultation.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  if (loading || !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultations"
        description="Comptes rendus, diagnostics et ordonnances de vos patients."
        action={
          <Button variant="amber" onClick={showForm ? fermerFormulaire : () => setShowForm(true)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Annuler' : 'Nouvelle consultation'}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && <Alert>{errorMsg}</Alert>}
            {rdvLie && (
              <Alert variant="info">Le rendez-vous associe passera au statut « Termine » a l'enregistrement.</Alert>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Patient</FieldLabel>
                <Select required value={form.patientId} onChange={(e) => update('patientId', e.target.value)}>
                  <option value="">Selectionner un patient</option>
                  {data.patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel>Type</FieldLabel>
                <Select value={form.typeConsultation} onChange={(e) => update('typeConsultation', e.target.value)}>
                  {TYPES_CONSULTATION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
            </div>

            <div>
              <FieldLabel required>Motif</FieldLabel>
              <TextInput required value={form.motif} onChange={(e) => update('motif', e.target.value)} placeholder="Douleur thoracique, controle..." />
            </div>

            <div>
              <FieldLabel>Diagnostic</FieldLabel>
              <Textarea rows={2} value={form.diagnostic} onChange={(e) => update('diagnostic', e.target.value)} />
            </div>

            <div>
              <FieldLabel>Compte rendu</FieldLabel>
              <Textarea rows={4} value={form.compteRendu} onChange={(e) => update('compteRendu', e.target.value)} />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Enregistrement...' : 'Enregistrer la consultation'}
            </Button>
          </form>
        </Card>
      )}

      {data.consultations.length > 0 && (
        <SearchInput
          placeholder="Rechercher par patient, motif ou diagnostic..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {consultationsFiltrees.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={query ? 'Aucun resultat' : 'Aucune consultation enregistree'}
            description={query ? 'Aucune consultation ne correspond a votre recherche.' : 'Vos comptes rendus apparaitront ici.'}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {consultationsFiltrees.map((c) => {
            const isOpen = expanded === c.id;
            return (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-display font-semibold text-(--color-ink-900)">{c.patientNomComplet}</p>
                    <p className="text-sm text-(--color-ink-600)">{formatDate(c.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.ordonnanceId ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-(--color-amber-500) bg-(--color-amber-400)/15 px-2.5 py-1 rounded-full">
                        <Pill size={13} /> Ordonnance delivree
                      </span>
                    ) : (
                      <Button variant="outline" className="py-1.5" onClick={() => setOrdonnancePour(c)}>
                        <Pill size={14} /> Rediger une ordonnance
                      </Button>
                    )}
                  </div>
                </div>
                {c.motif && <p className="text-sm text-(--color-ink-600) mt-3"><span className="font-medium text-(--color-ink-900)">Motif :</span> {c.motif}</p>}
                {c.diagnostic && <p className="text-sm text-(--color-ink-600) mt-1"><span className="font-medium text-(--color-ink-900)">Diagnostic :</span> {c.diagnostic}</p>}
                {c.compteRendu && (
                  <>
                    {isOpen && <p className="text-sm text-(--color-ink-600) mt-2 whitespace-pre-line">{c.compteRendu}</p>}
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-(--color-petrol-600) mt-2 hover:underline"
                      aria-expanded={isOpen}
                    >
                      {isOpen ? 'Masquer le compte rendu' : 'Voir le compte rendu'}
                      <ChevronDown size={14} className={isOpen ? 'rotate-180' : ''} />
                    </button>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <OrdonnanceForm
        open={!!ordonnancePour}
        consultation={ordonnancePour}
        onClose={() => setOrdonnancePour(null)}
        onCreated={() => reload({ silent: true })}
      />
    </div>
  );
}
