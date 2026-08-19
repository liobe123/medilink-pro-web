import { useEffect, useState } from 'react';
import { Building2, MapPin, Phone, Plus, X, Pencil, Trash2 } from 'lucide-react';
import {
  getAllEtablissements, createEtablissement, updateEtablissement, deleteEtablissement,
} from '../api/etablissements';
import {
  Card, Button, Spinner, EmptyState, PageHeader, FieldLabel, TextInput,
} from './ui';

const INITIAL_FORM = { nom: '', type: '', adresse: '', telephone: '', latitude: '', longitude: '', specialitesDisponibles: '' };

/**
 * Gestion CRUD complete des etablissements de sante, partagee entre les
 * espaces Directeur et Admin (memes droits de creation/edition/suppression).
 */
export default function EtablissementsManager({ description }) {
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getAllEtablissements();
      setEtablissements(data);
    } catch {
      setEtablissements([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
  }

  function startEdit(e) {
    setEditingId(e.id);
    setForm({
      nom: e.nom || '',
      type: e.type || '',
      adresse: e.adresse || '',
      telephone: e.telephone || '',
      latitude: e.latitude ?? '',
      longitude: e.longitude ?? '',
      specialitesDisponibles: (e.specialitesDisponibles || []).join(', '),
    });
    setShowForm(true);
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        nom: form.nom,
        type: form.type || null,
        adresse: form.adresse || null,
        telephone: form.telephone || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        specialitesDisponibles: form.specialitesDisponibles
          ? form.specialitesDisponibles.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      if (editingId) {
        await updateEtablissement(editingId, payload);
      } else {
        await createEtablissement(payload);
      }
      setShowForm(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await deleteEtablissement(id);
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etablissements"
        description={description || "Gerez les hopitaux et cliniques de votre reseau."}
        action={
          <Button variant="amber" onClick={showForm ? () => setShowForm(false) : startCreate}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Annuler' : 'Ajouter un etablissement'}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FieldLabel>Nom</FieldLabel>
              <TextInput required value={form.nom} onChange={(e) => update('nom', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Type</FieldLabel>
                <TextInput placeholder="Hopital, clinique..." value={form.type} onChange={(e) => update('type', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Telephone</FieldLabel>
                <TextInput value={form.telephone} onChange={(e) => update('telephone', e.target.value)} />
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
            <div>
              <FieldLabel>Specialites disponibles</FieldLabel>
              <TextInput
                placeholder="Cardiologie, pediatrie, dermatologie..."
                value={form.specialitesDisponibles}
                onChange={(e) => update('specialitesDisponibles', e.target.value)}
              />
              <p className="text-xs text-(--color-ink-300) mt-1">Separees par des virgules.</p>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Enregistrement...' : editingId ? 'Mettre a jour' : "Creer l'etablissement"}
            </Button>
          </form>
        </Card>
      )}

      {etablissements.length === 0 ? (
        <Card>
          <EmptyState icon={Building2} title="Aucun etablissement" description="Ajoutez votre premier etablissement de sante." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {etablissements.map((e) => (
            <Card key={e.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold text-(--color-ink-900)">{e.nom}</p>
                  {e.type && <p className="text-sm text-(--color-amber-500) font-medium">{e.type}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(e)} className="p-2 rounded-lg hover:bg-(--color-petrol-50) text-(--color-petrol-600)">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="p-2 rounded-lg hover:bg-(--color-clay-100) text-(--color-clay-500)">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-(--color-ink-600)">
                {e.adresse && <p className="flex items-center gap-1.5"><MapPin size={14} /> {e.adresse}</p>}
                {e.telephone && <p className="flex items-center gap-1.5"><Phone size={14} /> {e.telephone}</p>}
              </div>
              {e.specialitesDisponibles?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {e.specialitesDisponibles.map((s) => (
                    <span key={s} className="text-xs font-medium px-2 py-1 rounded-full bg-(--color-petrol-50) text-(--color-petrol-600)">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
