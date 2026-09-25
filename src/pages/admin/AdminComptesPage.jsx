import { useMemo, useState } from 'react';
import { UserCheck, Check, X, Stethoscope, CheckCheck } from 'lucide-react';
import { getComptesEnAttente, validerCompte } from '../../api/admin';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import {
  Card, EmptyState, PageHeader, Button, RoleBadge, Select, Textarea, PageLoader, ErrorState, SearchInput,
} from '../../components/ui';
import { formatDate, matchesSearch } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const FILTRES_ROLE = [
  { value: '', label: 'Tous les roles' },
  { value: 'MEDECIN', label: 'Medecin' },
  { value: 'SECRETAIRE', label: 'Secretaire' },
  { value: 'DIRECTEUR', label: 'Directeur' },
];

const MOTIFS_FREQUENTS = [
  "Numero d'ordre introuvable au registre",
  'Informations incompletes',
  'Identite non verifiable',
];

export default function AdminComptesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [filtreRole, setFiltreRole] = useState('');
  const [query, setQuery] = useState('');
  const [rejetEnCours, setRejetEnCours] = useState(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selection, setSelection] = useState(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  useDocumentTitle('Comptes en attente');

  const { data: comptes, loading, error, reload, setData } = useApi(
    () => getComptesEnAttente(filtreRole || undefined),
    [filtreRole],
  );

  const liste = useMemo(() => (comptes || [])
    .filter((c) => matchesSearch(query, c.nom, c.prenom, c.email, c.specialite, c.numeroOrdre))
    .sort((a, b) => new Date(a.dateInscription) - new Date(b.dateInscription)), [comptes, query]);

  function retirer(ids) {
    setData((prev) => prev.filter((c) => !ids.includes(c.id)));
    setSelection((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
  }

  async function handleApprouver(c) {
    setProcessingId(c.id);
    try {
      await validerCompte(c.id, { approuve: true });
      retirer([c.id]);
      toast.success(`${c.prenom} ${c.nom} peut maintenant se connecter.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Approbation impossible.'));
    } finally {
      setProcessingId(null);
    }
  }

  function toggleSelection(id) {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function approuverSelection() {
    const ids = [...selection];
    const ok = await confirm({
      title: `Approuver ${ids.length} compte${ids.length > 1 ? 's' : ''} ?`,
      message: 'Verifiez les numeros d\'ordre des medecins avant une validation groupee.',
      confirmLabel: 'Approuver',
    });
    if (!ok) return;
    setBulkRunning(true);
    const results = await Promise.allSettled(ids.map((id) => validerCompte(id, { approuve: true })));
    const reussis = ids.filter((_, i) => results[i].status === 'fulfilled');
    retirer(reussis);
    setBulkRunning(false);
    if (reussis.length === ids.length) toast.success(`${reussis.length} compte(s) approuve(s).`);
    else toast.error(`${reussis.length} approuve(s), ${ids.length - reussis.length} echec(s).`);
  }

  function startRejet(id) {
    setRejetEnCours(id);
    setMotifRejet('');
  }

  async function confirmRejet(c) {
    if (!motifRejet.trim()) return;
    setProcessingId(c.id);
    try {
      await validerCompte(c.id, { approuve: false, motifRejet: motifRejet.trim() });
      setRejetEnCours(null);
      retirer([c.id]);
      toast.success(`Inscription de ${c.prenom} ${c.nom} refusee.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Refus impossible.'));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes en attente"
        description="Approuvez ou refusez les inscriptions professionnelles, de la plus ancienne a la plus recente."
        action={
          <Select value={filtreRole} onChange={(e) => { setFiltreRole(e.target.value); setSelection(new Set()); }} className="w-auto!">
            {FILTRES_ROLE.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
        }
      />

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={reload} />
      ) : loading || !comptes ? (
        <PageLoader />
      ) : comptes.length === 0 ? (
        <Card>
          <EmptyState icon={UserCheck} title="Aucun compte en attente" description="Les nouvelles inscriptions professionnelles apparaitront ici." />
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <SearchInput className="flex-1 min-w-60" placeholder="Nom, email, specialite, numero d'ordre..." value={query} onChange={(e) => setQuery(e.target.value)} />
            {selection.size > 0 && (
              <Button onClick={approuverSelection} disabled={bulkRunning}>
                <CheckCheck size={16} /> Approuver la selection ({selection.size})
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {liste.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selection.has(c.id)}
                      onChange={() => toggleSelection(c.id)}
                      className="mt-1.5 w-4 h-4 accent-(--color-petrol-600)"
                      aria-label={`Selectionner ${c.prenom} ${c.nom}`}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-semibold text-(--color-ink-900)">{c.prenom} {c.nom}</p>
                        <RoleBadge role={c.role} />
                      </div>
                      <a href={`mailto:${c.email}`} className="text-sm text-(--color-ink-600) mt-0.5 hover:text-(--color-petrol-600) block">{c.email}</a>
                      {c.telephone && <p className="text-sm text-(--color-ink-600)">{c.telephone}</p>}
                      {c.role === 'MEDECIN' && (
                        <p className="flex items-center gap-1.5 text-sm text-(--color-amber-500) font-medium mt-1.5 flex-wrap">
                          <Stethoscope size={14} /> {c.specialite || 'Specialite non renseignee'}
                          {c.numeroOrdre && <span>, ordre n° {c.numeroOrdre}</span>}
                        </p>
                      )}
                      <p className="text-xs text-(--color-ink-300) mt-1.5">Inscrit le {formatDate(c.dateInscription)}</p>
                    </div>
                  </div>

                  {rejetEnCours !== c.id && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="primary" disabled={processingId === c.id} onClick={() => handleApprouver(c)}>
                        <Check size={15} /> Approuver
                      </Button>
                      <Button variant="danger" disabled={processingId === c.id} onClick={() => startRejet(c.id)}>
                        <X size={15} /> Refuser
                      </Button>
                    </div>
                  )}
                </div>

                {rejetEnCours === c.id && (
                  <div className="mt-4 pt-4 border-t border-(--color-petrol-100) space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {MOTIFS_FREQUENTS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMotifRejet(m)}
                          className="text-xs px-2.5 py-1 rounded-full border border-(--color-petrol-100) text-(--color-ink-600) hover:border-(--color-petrol-400)"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="Motif du refus (obligatoire, transmis au demandeur)"
                      value={motifRejet}
                      onChange={(e) => setMotifRejet(e.target.value)}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button variant="danger" disabled={!motifRejet.trim() || processingId === c.id} onClick={() => confirmRejet(c)}>
                        Confirmer le refus
                      </Button>
                      <Button variant="ghost" onClick={() => setRejetEnCours(null)}>Annuler</Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
