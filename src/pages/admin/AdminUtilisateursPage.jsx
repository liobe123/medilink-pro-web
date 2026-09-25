import { useMemo, useState } from 'react';
import { Users, Power, RotateCcw, ServerCog } from 'lucide-react';
import { getAllComptes, toggleActif, remettreEnAttente } from '../../api/admin';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import {
  Card, EmptyState, PageHeader, Button, RoleBadge, StatutCompteBadge, Select, PageLoader, ErrorState,
  SearchInput, Tabs, Avatar,
} from '../../components/ui';
import { formatDate, initiales, matchesSearch } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const ROLES = ['', 'PATIENT', 'MEDECIN', 'SECRETAIRE', 'DIRECTEUR', 'ADMIN'];
const ROLE_LABELS = { '': 'Tous les roles', PATIENT: 'Patients', MEDECIN: 'Medecins', SECRETAIRE: 'Secretaires', DIRECTEUR: 'Directeurs', ADMIN: 'Administrateurs' };

// Le backend peut nommer le statut "statutCompte" ou "statut".
const statutDe = (c) => c.statutCompte || c.statut;

/**
 * NOUVEAU — gestion de tous les comptes : suspendre/reactiver (toggle-actif)
 * et remettre un compte rejete en attente. Ces deux endpoints existaient dans
 * api/admin.js sans etre utilises. La liste necessite GET /api/admin/comptes.
 */
export default function AdminUtilisateursPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [role, setRole] = useState('');
  const [etat, setEtat] = useState('tous');
  const [query, setQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  useDocumentTitle('Utilisateurs');

  const { data: comptes, loading, error, reload, setData } = useApi(() => getAllComptes(role || undefined), [role]);

  const counts = useMemo(() => {
    const list = comptes || [];
    return {
      tous: list.length,
      actifs: list.filter((c) => c.actif !== false && statutDe(c) !== 'REJETE').length,
      suspendus: list.filter((c) => c.actif === false).length,
      rejetes: list.filter((c) => statutDe(c) === 'REJETE').length,
    };
  }, [comptes]);

  const liste = useMemo(() => (comptes || [])
    .filter((c) => {
      if (etat === 'actifs') return c.actif !== false && statutDe(c) !== 'REJETE';
      if (etat === 'suspendus') return c.actif === false;
      if (etat === 'rejetes') return statutDe(c) === 'REJETE';
      return true;
    })
    .filter((c) => matchesSearch(query, c.nom, c.prenom, `${c.prenom} ${c.nom}`, c.email, c.telephone)), [comptes, etat, query]);

  async function handleToggle(c) {
    const suspendre = c.actif !== false;
    if (suspendre) {
      const ok = await confirm({
        title: `Suspendre ${c.prenom} ${c.nom} ?`,
        message: "La personne ne pourra plus se connecter tant que son compte n'est pas reactive. Ses donnees sont conservees.",
        confirmLabel: 'Suspendre',
        danger: true,
      });
      if (!ok) return;
    }
    setProcessingId(c.id);
    try {
      const updated = await toggleActif(c.id);
      setData((prev) => prev.map((x) => (x.id === c.id ? { ...x, ...(updated || {}), actif: updated?.actif ?? !suspendre } : x)));
      toast.success(suspendre ? 'Compte suspendu.' : 'Compte reactive.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action impossible.'));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRemettre(c) {
    setProcessingId(c.id);
    try {
      await remettreEnAttente(c.id);
      setData((prev) => prev.map((x) => (x.id === c.id ? { ...x, statutCompte: 'EN_ATTENTE', statut: 'EN_ATTENTE' } : x)));
      toast.success(`${c.prenom} ${c.nom} est de nouveau dans les comptes en attente.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action impossible.'));
    } finally {
      setProcessingId(null);
    }
  }

  const endpointManquant = error && [404, 405].includes(error.response?.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Suspendez, reactivez ou reexaminez les comptes de la plateforme."
        action={(
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-auto!">
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        )}
      />

      {endpointManquant ? (
        <Card>
          <EmptyState
            icon={ServerCog}
            title="Fonction a activer cote serveur"
            description="Cette page a besoin de l'endpoint GET /api/admin/comptes (liste de tous les comptes). Il est decrit dans le README fourni avec cette version."
          />
        </Card>
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={reload} />
      ) : loading || !comptes ? (
        <PageLoader />
      ) : (
        <>
          <Tabs
            value={etat}
            onChange={setEtat}
            tabs={[
              { value: 'tous', label: 'Tous', count: counts.tous },
              { value: 'actifs', label: 'Actifs', count: counts.actifs },
              { value: 'suspendus', label: 'Suspendus', count: counts.suspendus },
              { value: 'rejetes', label: 'Rejetes', count: counts.rejetes },
            ]}
          />
          <SearchInput placeholder="Nom, email, telephone..." value={query} onChange={(e) => setQuery(e.target.value)} />

          {liste.length === 0 ? (
            <Card><EmptyState icon={Users} title="Aucun compte" description="Aucun compte ne correspond a ces filtres." /></Card>
          ) : (
            <Card className="divide-y divide-(--color-petrol-100)">
              {liste.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-4 flex-wrap">
                  <Avatar text={initiales(c.prenom, c.nom)} className={c.actif === false ? 'opacity-50' : ''} />
                  <div className="flex-1 min-w-48">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-(--color-ink-900)">{c.prenom} {c.nom}</p>
                      <RoleBadge role={c.role} />
                      {statutDe(c) && statutDe(c) !== 'APPROUVE' && <StatutCompteBadge statut={statutDe(c)} />}
                      {c.actif === false && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-(--color-ink-300)/20 text-(--color-ink-600)">Suspendu</span>
                      )}
                    </div>
                    <p className="text-xs text-(--color-ink-600) mt-0.5">
                      {c.email}{c.dateInscription && `, inscrit le ${formatDate(c.dateInscription)}`}
                    </p>
                    {statutDe(c) === 'REJETE' && c.motifRejet && (
                      <p className="text-xs text-(--color-clay-500) mt-0.5">Motif : {c.motifRejet}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statutDe(c) === 'REJETE' && (
                      <Button variant="outline" className="py-2" disabled={processingId === c.id} onClick={() => handleRemettre(c)}>
                        <RotateCcw size={14} /> Reexaminer
                      </Button>
                    )}
                    {c.role !== 'ADMIN' && (
                      <Button
                        variant={c.actif === false ? 'success' : 'danger'}
                        className="py-2"
                        disabled={processingId === c.id}
                        onClick={() => handleToggle(c)}
                      >
                        <Power size={14} /> {c.actif === false ? 'Reactiver' : 'Suspendre'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
