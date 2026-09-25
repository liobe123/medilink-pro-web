import { useMemo, useState } from 'react';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  getAllEtablissements, createEtablissement, updateEtablissement, deleteEtablissement,
} from '../api/etablissements';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import Modal from './Modal';
import GeolocButton from './GeolocButton';
import EtablissementCard from './EtablissementCard';
import {
  Card, Button, EmptyState, PageHeader, FieldLabel, TextInput, PageLoader, ErrorState, SearchInput, Alert,
} from './ui';
import { matchesSearch } from '../utils/format';
import { getErrorMessage } from '../utils/errors';

const INITIAL_FORM = { nom: '', type: '', adresse: '', telephone: '', latitude: '', longitude: '', specialitesDisponibles: '' };
const TYPES_SUGGERES = ['Hopital', 'Clinique', 'Centre de sante', 'Cabinet medical', 'Laboratoire'];

function toNumberOrNull(v) {
  return v !== '' && v != null ? Number(v) : null;
}

/**
 * Gestion CRUD complete des etablissements de sante, partagee entre les
 * espaces Directeur et Admin (memes droits de creation/edition/suppression).
 */
export default function EtablissementsManager({ description }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [query, setQuery] = useState('');
  useDocumentTitle('Etablissements');

  const { data: etablissements, loading, error, reload } = useApi(() => getAllEtablissements(), []);

  const liste = useMemo(() => (etablissements || []).filter((e) => matchesSearch(
    query, e.nom, e.type, e.adresse, ...(e.specialitesDisponibles || []),
  )), [etablissements, query]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function startEdit(e) {
    setEditingId(e.id);
    setFormError(null);
    setForm({
      nom: e.nom || '',
      type: e.type || '',
      adresse: e.adresse || '',
      telephone: e.telephone || '',
      latitude: e.latitude ?? '',
      longitude: e.longitude ?? '',
      specialitesDisponibles: (e.specialitesDisponibles || []).join(', '),
    });
    setModalOpen(true);
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const lat = toNumberOrNull(form.latitude);
    const lng = toNumberOrNull(form.longitude);
    if ((lat == null) !== (lng == null)) {
      setFormError('Renseignez la latitude et la longitude, ou aucune des deux.');
      return;
    }
    if ((lat != null && (lat < -90 || lat > 90)) || (lng != null && (lng < -180 || lng > 180))) {
      setFormError('Coordonnees invalides : latitude entre -90 et 90, longitude entre -180 et 180.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        nom: form.nom.trim(),
        type: form.type || null,
        adresse: form.adresse || null,
        telephone: form.telephone || null,
        latitude: lat,
        longitude: lng,
        // Dedoublonnage des specialites saisies
        specialitesDisponibles: Array.from(new Set(
          form.specialitesDisponibles.split(',').map((s) => s.trim()).filter(Boolean),
        )),
      };
      if (editingId) {
        await updateEtablissement(editingId, payload);
        toast.success(`${payload.nom} mis a jour.`);
      } else {
        await createEtablissement(payload);
        toast.success(`${payload.nom} ajoute.`);
      }
      setModalOpen(false);
      await reload({ silent: true });
    } catch (err) {
      setFormError(getErrorMessage(err, "Impossible d'enregistrer l'etablissement."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(e) {
    const ok = await confirm({
      title: `Supprimer ${e.nom} ?`,
      message: 'Les medecins rattaches a cet etablissement ne seront plus associes a aucun lieu. Cette action est definitive.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteEtablissement(e.id);
      toast.success(`${e.nom} supprime.`);
      await reload({ silent: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Suppression impossible : des donnees y sont peut-etre encore rattachees.'));
    }
  }

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />;
  if (loading || !etablissements) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etablissements"
        description={description || 'Gerez les hopitaux et cliniques de votre reseau.'}
        action={(
          <Button variant="amber" onClick={startCreate}>
            <Plus size={16} /> Ajouter un etablissement
          </Button>
        )}
      />

      {etablissements.length > 0 && (
        <SearchInput placeholder="Nom, ville, specialite..." value={query} onChange={(e) => setQuery(e.target.value)} />
      )}

      {liste.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title={query ? 'Aucun resultat' : 'Aucun etablissement'}
            description={query ? 'Aucun etablissement ne correspond a votre recherche.' : 'Ajoutez votre premier etablissement de sante.'}
            action={!query && <Button variant="amber" onClick={startCreate}><Plus size={16} /> Ajouter</Button>}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {liste.map((e) => (
            <EtablissementCard
              key={e.id}
              etablissement={e}
              actions={(
                <>
                  <button type="button" onClick={() => startEdit(e)} className="p-2 rounded-lg hover:bg-(--color-petrol-50) text-(--color-petrol-600)" aria-label={`Modifier ${e.nom}`}>
                    <Pencil size={15} />
                  </button>
                  <button type="button" onClick={() => handleDelete(e)} className="p-2 rounded-lg hover:bg-(--color-clay-100) text-(--color-clay-500)" aria-label={`Supprimer ${e.nom}`}>
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Modifier l'etablissement" : 'Nouvel etablissement'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <div>
            <FieldLabel required>Nom</FieldLabel>
            <TextInput required value={form.nom} onChange={(e) => update('nom', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Type</FieldLabel>
              <TextInput list="types-etablissement" placeholder="Hopital, clinique..." value={form.type} onChange={(e) => update('type', e.target.value)} />
              <datalist id="types-etablissement">
                {TYPES_SUGGERES.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              <FieldLabel>Telephone</FieldLabel>
              <TextInput type="tel" value={form.telephone} onChange={(e) => update('telephone', e.target.value)} />
            </div>
          </div>
          <div>
            <FieldLabel>Adresse</FieldLabel>
            <TextInput value={form.adresse} onChange={(e) => update('adresse', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Latitude</FieldLabel>
              <TextInput type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Longitude</FieldLabel>
              <TextInput type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} />
            </div>
          </div>
          <GeolocButton
            label="Je suis dans l'etablissement : utiliser ma position"
            onLocate={({ latitude, longitude }) => setForm((prev) => ({ ...prev, latitude, longitude }))}
          />
          <div>
            <FieldLabel>Specialites disponibles</FieldLabel>
            <TextInput
              placeholder="Cardiologie, pediatrie, dermatologie..."
              value={form.specialitesDisponibles}
              onChange={(e) => update('specialitesDisponibles', e.target.value)}
            />
            <p className="text-xs text-(--color-ink-300) mt-1">Separees par des virgules.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : editingId ? 'Mettre a jour' : "Creer l'etablissement"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
