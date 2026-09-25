import { useMemo, useState } from 'react';
import {
  FileHeart, Stethoscope, Pill, FlaskConical, ShieldCheck, Printer, Droplet, Cake, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDossierMedicalByPatient, getPatient } from '../../api/patients';
import { getOrdonnancesByPatient, readMedicaments } from '../../api/ordonnances';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import Modal from '../../components/Modal';
import OrdonnanceView from '../../components/OrdonnanceView';
import {
  Card, EmptyState, PageHeader, PageLoader, Button, Tabs, SearchInput,
} from '../../components/ui';
import { GROUPE_LABELS } from '../../utils/constants';
import { formatDate, matchesSearch } from '../../utils/format';

function calculerAge(dateNaissance) {
  if (!dateNaissance) return null;
  const naissance = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - naissance.getFullYear();
  const m = now.getMonth() - naissance.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < naissance.getDate())) age--;
  return age;
}

export default function DossierMedicalPage() {
  const { user } = useAuth();
  const [onglet, setOnglet] = useState('consultations');
  const [query, setQuery] = useState('');
  const [ordonnanceOuverte, setOrdonnanceOuverte] = useState(null);
  useDocumentTitle('Mon dossier medical');

  // Les sources secondaires (profil, ordonnances) ne bloquent pas l'affichage du dossier.
  const { data, loading, error } = useApi(async () => {
    const [dossier, patient, ordonnances] = await Promise.allSettled([
      getDossierMedicalByPatient(user.userId),
      getPatient(user.userId),
      getOrdonnancesByPatient(user.userId),
    ]);
    if (dossier.status === 'rejected') throw dossier.reason;
    return {
      dossier: dossier.value,
      patient: patient.status === 'fulfilled' ? patient.value : null,
      ordonnances: ordonnances.status === 'fulfilled' ? ordonnances.value : [],
    };
  }, [user.userId]);

  const consultations = useMemo(() => [...(data?.dossier?.consultations || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((c) => matchesSearch(query, c.medecinNomComplet, c.motif, c.diagnostic)), [data, query]);

  const ordonnances = useMemo(() => [...(data?.ordonnances || [])]
    .sort((a, b) => new Date(b.dateEmission || b.date || 0) - new Date(a.dateEmission || a.date || 0)), [data]);

  const resultats = data?.dossier?.resultatsAnalyses || [];

  if (loading) return <PageLoader />;

  if (error || !data?.dossier) {
    return (
      <Card>
        <EmptyState icon={FileHeart} title="Dossier indisponible" description="Impossible de charger votre dossier medical pour le moment. Reessayez dans quelques instants." />
      </Card>
    );
  }

  const { dossier, patient } = data;
  const age = calculerAge(patient?.dateNaissance);

  function ouvrirOrdonnance(consultation) {
    const ordo = ordonnances.find((o) => o.id === consultation.ordonnanceId || o.consultationId === consultation.id);
    if (ordo) setOrdonnanceOuverte(ordo);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon dossier medical"
        description={`Cree le ${formatDate(dossier.dateCreation)}, mis a jour le ${formatDate(dossier.derniereMiseAJour)}`}
        action={(
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={15} /> Imprimer mon dossier
          </Button>
        )}
      />

      {/* Fiche d'identite medicale */}
      <Card className="p-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div>
          <p className="text-xs text-(--color-ink-300)">Patient</p>
          <p className="font-display font-semibold text-(--color-ink-900)">{user.prenom} {user.nom}</p>
        </div>
        {patient?.groupeSanguin && patient.groupeSanguin !== 'INCONNU' && (
          <div className="flex items-center gap-2">
            <Droplet size={16} className="text-(--color-clay-500)" />
            <div>
              <p className="text-xs text-(--color-ink-300)">Groupe sanguin</p>
              <p className="font-semibold text-(--color-ink-900)">{GROUPE_LABELS[patient.groupeSanguin]}</p>
            </div>
          </div>
        )}
        {age != null && (
          <div className="flex items-center gap-2">
            <Cake size={16} className="text-(--color-amber-500)" />
            <div>
              <p className="text-xs text-(--color-ink-300)">Age</p>
              <p className="font-semibold text-(--color-ink-900)">{age} ans</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 text-(--color-sage-500) text-sm font-medium sm:ml-auto">
          <ShieldCheck size={17} /> Dossier chiffre et confidentiel
        </div>
      </Card>

      {(patient?.allergies || patient?.antecedents) && (
        <Card className="p-5 grid sm:grid-cols-2 gap-4 break-inside-avoid">
          {patient.allergies && (
            <div>
              <p className="text-xs font-semibold text-(--color-clay-500)">Allergies</p>
              <p className="text-sm text-(--color-ink-900) whitespace-pre-line mt-0.5">{patient.allergies}</p>
            </div>
          )}
          {patient.antecedents && (
            <div>
              <p className="text-xs font-semibold text-(--color-petrol-600)">Antecedents</p>
              <p className="text-sm text-(--color-ink-900) whitespace-pre-line mt-0.5">{patient.antecedents}</p>
            </div>
          )}
        </Card>
      )}

      <div className="print:hidden">
        <Tabs
          value={onglet}
          onChange={setOnglet}
          tabs={[
            { value: 'consultations', label: 'Consultations', count: dossier.consultations?.length || 0 },
            { value: 'ordonnances', label: 'Ordonnances', count: ordonnances.length },
            { value: 'analyses', label: 'Analyses', count: resultats.length },
          ]}
        />
      </div>

      {/* Consultations (toujours imprimees) */}
      <section className={onglet === 'consultations' ? '' : 'hidden print:block'}>
        <h2 className="hidden print:flex font-display font-semibold text-lg mb-3 items-center gap-2">
          <Stethoscope size={19} /> Consultations
        </h2>
        {(dossier.consultations?.length || 0) > 3 && (
          <SearchInput
            className="mb-3 print:hidden"
            placeholder="Rechercher un medecin, un motif, un diagnostic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
        {consultations.length === 0 ? (
          <Card>
            <EmptyState icon={Stethoscope} title="Aucune consultation" description={query ? 'Aucune consultation ne correspond a votre recherche.' : 'Vos comptes rendus de consultation apparaitront ici.'} />
          </Card>
        ) : (
          <div className="space-y-3">
            {consultations.map((c) => (
              <Card key={c.id} className="p-5 break-inside-avoid">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-display font-semibold text-(--color-ink-900)">Dr {c.medecinNomComplet}</p>
                    <p className="text-sm text-(--color-ink-600)">{formatDate(c.date)}</p>
                  </div>
                  {c.ordonnanceId && (
                    <button
                      type="button"
                      onClick={() => ouvrirOrdonnance(c)}
                      className="flex items-center gap-1 text-xs font-semibold text-(--color-amber-500) bg-(--color-amber-400)/15 hover:bg-(--color-amber-400)/25 px-2.5 py-1 rounded-full print:hidden"
                    >
                      <Pill size={13} /> Voir l'ordonnance
                    </button>
                  )}
                </div>
                {c.motif && <p className="text-sm text-(--color-ink-600) mt-3"><span className="font-medium text-(--color-ink-900)">Motif :</span> {c.motif}</p>}
                {c.diagnostic && <p className="text-sm text-(--color-ink-600) mt-1"><span className="font-medium text-(--color-ink-900)">Diagnostic :</span> {c.diagnostic}</p>}
                {c.compteRendu && <p className="text-sm text-(--color-ink-600) mt-1 whitespace-pre-line"><span className="font-medium text-(--color-ink-900)">Compte rendu :</span> {c.compteRendu}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Ordonnances */}
      <section className={onglet === 'ordonnances' ? '' : 'hidden'}>
        {ordonnances.length === 0 ? (
          <Card>
            <EmptyState icon={Pill} title="Aucune ordonnance" description="Les ordonnances delivrees par vos medecins apparaitront ici, avec leur code de verification pour la pharmacie." />
          </Card>
        ) : (
          <div className="space-y-3">
            {ordonnances.map((o) => {
              const meds = readMedicaments(o);
              return (
                <button key={o.id} type="button" onClick={() => setOrdonnanceOuverte(o)} className="w-full text-left">
                  <Card className="p-5 flex items-center justify-between gap-4 hover:border-(--color-petrol-400) transition-colors">
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-(--color-ink-900)">
                        {o.medecinNomComplet ? `Dr ${o.medecinNomComplet}` : 'Ordonnance'}
                      </p>
                      <p className="text-sm text-(--color-ink-600)">{formatDate(o.dateEmission || o.date)}</p>
                      <p className="text-sm text-(--color-ink-600) mt-1 truncate">
                        {meds.length ? meds.map((m) => m.nom).join(', ') : 'Voir le detail'}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-(--color-ink-300) shrink-0" />
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Resultats d'analyses (toujours imprimes) */}
      <section className={onglet === 'analyses' ? '' : 'hidden print:block'}>
        <h2 className="hidden print:flex font-display font-semibold text-lg mb-3 mt-6 items-center gap-2">
          <FlaskConical size={19} /> Resultats d'analyses
        </h2>
        {resultats.length === 0 ? (
          <Card>
            <EmptyState icon={FlaskConical} title="Aucun resultat disponible" description="Les resultats transmis par vos laboratoires partenaires apparaitront ici." />
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {resultats.map((r) => (
              <Card key={r.id} className="p-4 break-inside-avoid">
                <p className="font-medium text-(--color-ink-900)">{r.type || 'Analyse'}</p>
                {r.laboratoire && <p className="text-sm text-(--color-ink-600)">{r.laboratoire}</p>}
                {r.resultat && <p className="text-sm text-(--color-ink-900) mt-1">{r.resultat}</p>}
                <p className="text-xs text-(--color-ink-300) mt-1">{formatDate(r.dateResultat)}</p>
                {r.fichierUrl && (
                  <a href={r.fichierUrl} target="_blank" rel="noreferrer" className="inline-block text-xs font-semibold text-(--color-petrol-600) hover:underline mt-2 print:hidden">
                    Ouvrir le document
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal open={!!ordonnanceOuverte} onClose={() => setOrdonnanceOuverte(null)} title="Ordonnance" size="lg">
        {ordonnanceOuverte && <OrdonnanceView ordonnance={ordonnanceOuverte} patientNom={`${user.prenom} ${user.nom}`} />}
      </Modal>
    </div>
  );
}
